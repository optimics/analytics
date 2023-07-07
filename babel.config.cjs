/* This should be sufficient to configure babel for the multirepository. Please
 * note, that the file must be a CommonJS module, so using '.cjs' suffix is
 * highly recommended. */

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
}
