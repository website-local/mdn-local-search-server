// eslint-disable-next-line @typescript-eslint/no-var-requires
const server = require('../lib/server/server-koa').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultConfig = require('../lib/config');

server(defaultConfig.resolveArgv()).catch(console.error);
