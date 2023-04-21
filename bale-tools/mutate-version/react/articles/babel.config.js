module.exports = {
  presets: [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        'useBuiltIns': 'usage',
        'corejs': 3,
        'modules': false
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    ['@babel/plugin-proposal-decorators', {'legacy': true}],
    ['@babel/plugin-proposal-class-properties'],
    ['@babel/plugin-syntax-jsx']
  ]
}

