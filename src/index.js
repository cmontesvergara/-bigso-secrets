function validateSecrets(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('The Secrets Adapter returned an invalid payload.')
  }
  if (!Object.values(payload).every((value) => typeof value === 'string')) {
    throw new Error('The Secrets Adapter returned an invalid payload.')
  }
  return payload
}

function adapterEndpoint(url) {
  const endpoint = new URL('/v1/secrets', url)
  if (endpoint.username || endpoint.password) {
    throw new Error('SECRETS_ADAPTER_URL must not include credentials.')
  }
  return endpoint
}

export async function loadSecrets({
  url = process.env.SECRETS_ADAPTER_URL,
  token = process.env.SECRETS_TOKEN,
  env = process.env,
  fetchImpl = globalThis.fetch,
  logger = console,
} = {}) {
  if (!url) throw new Error('SECRETS_ADAPTER_URL is required.')
  if (!token) throw new Error('SECRETS_TOKEN is required.')
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required.')

  const endpoint = adapterEndpoint(url)
  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Secrets Adapter request failed with status ${response.status}.`)

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Secrets Adapter returned "${contentType || 'no content type'}" instead of JSON. Verify SECRETS_ADAPTER_URL points to the Adapter.`)
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('Secrets Adapter returned malformed JSON.')
  }
  const secrets = validateSecrets(payload)
  const loaded = []
  const preserved = []
  for (const [key, value] of Object.entries(secrets)) {
    if (key in env) preserved.push(key)
    else {
      env[key] = value
      loaded.push(key)
    }
  }

  logger.info?.('[bigso-secrets] Secrets bootstrap completed', {
    adapter: endpoint.origin,
    received: Object.keys(secrets).length,
    loaded,
    preserved,
    managed: Object.keys(secrets).length,
  })
  return { loaded, preserved, managed: Object.keys(secrets).length }
}
