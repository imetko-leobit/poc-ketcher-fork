import {
  RemoteStructServiceProvider,
  StructServiceProvider,
} from 'ketcher-core';

export async function getStructServiceProvider() {
  const mode = process.env.MODE;
  const apiPath = process.env.API_PATH || process.env.REACT_APP_API_PATH;

  // Standalone WASM modes: run Indigo in-browser via Web Worker.
  // MODE=standalone  — vendored indigo-ketcher npm package (default)
  // MODE=local-wasm  — local Indigo WASM build (set LOCAL_INDIGO_WASM_PATH in .env)
  //                    The Vite alias for _indigo-ketcher-import-alias_ is redirected
  //                    to LOCAL_INDIGO_WASM_PATH at build time (see vite.config.js).
  if (mode === 'standalone' || mode === 'local-wasm') {
    const {
      StandaloneStructServiceProvider,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
    } = require('ketcher-standalone');
    return new StandaloneStructServiceProvider() as StructServiceProvider;
  }

  // Remote REST modes: Ketcher makes HTTP calls to the Indigo service.
  // MODE=remote     — any Indigo REST endpoint set via API_PATH / REACT_APP_API_PATH
  // MODE=local-rest — local Indigo service at localhost:8002, proxied by Vite dev server
  //                   (API path /v2 is forwarded to LOCAL_INDIGO_URL via vite.config.js)
  return new RemoteStructServiceProvider(apiPath);
}
