const {getDefaultConfig} = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      '@': path.resolve(__dirname),
    },
    sourceExts: [...defaultConfig.resolver.sourceExts, 'ts', 'tsx'],
  },
  watchFolders: [path.resolve(__dirname)],
};