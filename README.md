# @bigso/secrets

Cliente Node.js que solicita secretos al BIGSO Secrets Adapter antes del bootstrap de la aplicación.

## Uso local

```js
import { loadSecrets } from '@bigso/secrets'

await loadSecrets()
```

Requiere `SECRETS_ADAPTER_URL` y `SECRETS_TOKEN`, o las opciones equivalentes en la llamada. Las claves que ya existen en `process.env`, incluso vacías, conservan precedencia. El informe incluye nombres y conteos, sin valores ni token.

```bash
npm test
```

La publicación pública en npm se realiza mediante releases semánticos desde
`main`.
El alcance se gobierna en `bigso-governance`, Change `CHG-2026-0029`. No
integra ni configura `erp-core`.
