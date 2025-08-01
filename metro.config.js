const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Mapbox support
config.resolver.alias = {
  ...config.resolver.alias,
  '@rnmapbox/maps': '@rnmapbox/maps',
};

module.exports = config;