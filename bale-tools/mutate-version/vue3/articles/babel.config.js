module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage', // 按需引入 polyfill
        corejs: 3
      }
    ],
    [
      '@babel/preset-typescript', // 引用Typescript插件
      {
        allExtensions: true // 支持所有文件扩展名，否则在vue文件中使用ts会报错
      }
    ],
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: ['@babel/plugin-transform-runtime']
}
