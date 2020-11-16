目录结构

```
src
├── compiler        # 编译相关 
├── core            # 核心代码 
├── platforms       # 不同平台的支持
├── server          # 服务端渲染
├── sfc             # .vue 文件解析
├── shared          # 共享代码
```

### compiler

`compiler`目录包含Vue.js所有编译相关代码，它包括把模板解析成`AST`语法树，AST语法树优化，代码生成等功能。

编译的工作可以在构建时做（借助webpack、vue-loader等辅助插件）；也可以在运行时做，使用包括构建功能Vue.js。显然，编译是一项耗性能的工作，所有更推荐---离线编译

### core

core目录包含了Vue.js的核心代码，包括内置组件、全局API封装，Vue实例化、观察者、虚拟DOM、工具函数等等

### platform

Vue.js 2.0支持服务端渲染，所有服务端渲染的相关逻辑都在这个目录下，需要注意的是，这部分代码是跑在服务端的node.js，不要和跑在浏览器端的Vue.js混在一起。

服务端渲染主要的工作是把组件渲染为服务端的HTML字符串，将它们直接发送到浏览器上，最后将静态标记'混合'为客服端上完全交互的应用程序。

### sfc

通常我们开发Vue.js都会借助webpack进行构建，然后通过.vue单文件来编写组件

这个目录下的代码逻辑会把.vue文件内容解析成一个JavaScript对象。

### share

Vue.js会定义一些工具方法，这里定义的工具方法会被浏览器端的Vue.js和服务端的Vue.js所共享的。
