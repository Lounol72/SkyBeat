
export default {
  basePath: 'https://lounol72.github.io/SkyBeat',
  allowedHosts: [],
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
