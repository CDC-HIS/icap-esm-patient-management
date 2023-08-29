const config = (module.exports = require('openmrs/default-webpack-config'));
// Overrides to disable CSS Modules for non-scss scripts, this means
// CSS Modules will only be supported with .scss scripts
config.cssRuleConfig.use = ['style-loader', 'css-loader'];
config.cssRuleConfig.test = /\.css$/;
module.exports = config;
