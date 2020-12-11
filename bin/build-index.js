// eslint-disable-next-line @typescript-eslint/no-var-requires
const {buildIndex} = require('../lib/build-index');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultConfig = require('../lib/config');

buildIndex(defaultConfig.resolveArgv()).catch(console.error);
