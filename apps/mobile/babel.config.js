module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // Reanimated's worklet transform MUST be the last plugin in the chain.
    plugins: ['react-native-reanimated/plugin'],
  }
}
