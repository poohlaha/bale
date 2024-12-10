module.exports = {
  plugins: [
    require('autoprefixer'),
    require('postcss-aspect-ratio-mini'),
    require('postcss-write-svg')({
      utf8: false,
    }),
    require('cssnano')({
      'cssnano-preset-advanced': {
        zindex: false,
      },
    }),
    /* antd-mobile 配置
    require('postcss-px-to-viewport-8-plugin')({
      // include: [/src/], // 如果设置了include，那将只有匹配到的文件才会被转换
      viewportWidth: 320, // antd-mobile 为 320
      viewportHeight: 568, // antd-mobile 为 568
      unitPrecision: 3, // 转换后的精度，即小数点位数
      // propList: ["*", "!letter-spacing"], // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换, 当有些属性的单位我们不希望转换的时候，可以添加在数组后面，并在前面加上!号
      unitToConvert: 'px', // 要转化的单位
      viewportUnit: 'vw', // 指定需要转换成的视窗单位，默认vw
      fontViewportUnit: 'vw', // 指定字体需要转换成的视窗单位，默认vw
      selectorBlackList: ['.ignore', '.hairlines'],
      minPixelValue: 0, // 默认值1，小于或等于1px则不进行转换, 此处改为0, 是为了兼容antd-mobile v5版本 picker问题
      mediaQuery: false, // 是否在媒体查询的css代码中也进行转换，默认false
      replace: true, // 是否转换后直接更换属性值
      // exclude: [/node_modules/], // 设置忽略文件，用正则做目录名匹配
      landscape: false, // 是否处理横屏情况
      // landscapeUnit: 'vw', // 横屏时使用的单位
      // landscapeWidth: 1338, // 横屏时使用的视口宽度
    })
     */
  ],
}
