import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSecrets } from '../src/index.js'

test('loads missing values and preserves an explicit empty override', async () => {
  const env = { DATABASE_URL: '' }
  const entries = []
  const result = await loadSecrets({
    url: 'https://secrets.example.test',
    token: 'synthetic-token',
    env,
    fetchImpl: async () => new Response(JSON.stringify({ DATABASE_URL: 'provider', REDIS_URL: 'redis://provider' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
    logger: { info: (_message, details) => entries.push(details) },
  })

  assert.deepEqual(result, { loaded: ['REDIS_URL'], preserved: ['DATABASE_URL'], managed: 2 })
  assert.equal(env.DATABASE_URL, '')
  assert.equal(env.REDIS_URL, 'redis://provider')
  assert.deepEqual(entries[0].loaded, ['REDIS_URL'])
  assert.doesNotMatch(JSON.stringify(entries), /synthetic-token|redis:\/\/provider/)
})

test('fails without required configuration or with an invalid payload', async () => {
  await assert.rejects(() => loadSecrets({ url: 'https://secrets.example.test', token: '' }), /SECRETS_TOKEN/)
  await assert.rejects(() => loadSecrets({
    url: 'https://secrets.example.test',
    token: 'synthetic-token',
    fetchImpl: async () => new Response(JSON.stringify({ API_KEY: 7 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
    logger: { info() {} },
  }), /invalid payload/)
})

test('identifies an HTML response without exposing its content', async () => {
  await assert.rejects(() => loadSecrets({
    url: 'https://secrets.example.test',
    token: 'synthetic-token',
    fetchImpl: async () => new Response('<!doctype html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }),
    logger: { info() {} },
  }), /returned "text\/html; charset=utf-8" instead of JSON/)
})
