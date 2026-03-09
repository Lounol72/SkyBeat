
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://lounol72.github.io/SkyBeat/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/SkyBeat"
  },
  {
    "renderMode": 2,
    "route": "/SkyBeat/generate"
  },
  {
    "renderMode": 2,
    "route": "/SkyBeat/login"
  },
  {
    "renderMode": 2,
    "route": "/SkyBeat/signup"
  },
  {
    "renderMode": 2,
    "route": "/SkyBeat/settings"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 4114, hash: '049160263f1ca7bee2500e04933d32c27dcaeaab5fdba73285cf43f88c490a72', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1423, hash: 'f1529aba12eda8cb7d063cea46b27d69d6fab7ab21e9abf389ee0782f81e9026', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'generate/index.html': {size: 18296, hash: '181a345f95d09651d5341519b4cbcf3a40de5c057e5f72667abff68074f871d3', text: () => import('./assets-chunks/generate_index_html.mjs').then(m => m.default)},
    'login/index.html': {size: 19659, hash: '56565d163710b018228c01afe8efb4d1994ad44b473ac07135abe00b88b9b56b', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'signup/index.html': {size: 20079, hash: 'e59195bbf83d851b23a82e9a2da6649c9eba7b017aaac7eb257b189cf95ca833', text: () => import('./assets-chunks/signup_index_html.mjs').then(m => m.default)},
    'index.html': {size: 32651, hash: '13dace0adfe765408d76afb3a4e3041e46bce103373c94fa534945df16a1e033', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'settings/index.html': {size: 23615, hash: '0acc6af6808c2d6fbc252f6b5df4a59b5270cab20fa3af82e56dc847704225a1', text: () => import('./assets-chunks/settings_index_html.mjs').then(m => m.default)},
    'styles-BE6X55X3.css': {size: 11171, hash: 'cfwaWKxrAC8', text: () => import('./assets-chunks/styles-BE6X55X3_css.mjs').then(m => m.default)}
  },
};
