const {mergeMochaConfigs} = require('@nutol/build');
const defaultConfig = require('@nutol/build/config/.mocharc.json');

const MONOREPO_CONFIG = {
  parallel: true,
};

module.exports = mergeMochaConfigs(defaultConfig, MONOREPO_CONFIG);
