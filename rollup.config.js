import babel from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'
import replace from 'rollup-plugin-replace'


export default {
  input: './src/platforms/web/entry-runtime-with-compiler.js', // 打包文件入口
  output: {
    file: 'dist/umd/vue.js', // 打包文件出口
    name: 'Vue', // 指定打包后全局变量的名字
    format: 'umd', // 统一模块规范
    sourcemap: true, // es6-> es5,开启源代码调试模式
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 忽略打包node_module模块下的问题
    }),
    process.env.ENV === 'production' ? serve({
      open: true,
      openPage: "/public/index.html", // 开启服务，默认打开的文件路径
      port: 3000,
      contentBase: '', // 配置提供额外静态文件内容的目录
    }) : '',
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.ENV)
    })
  ]
}
