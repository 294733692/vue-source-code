import {initRender} from "./render";
import {initProxy} from "./proxy";

/**
 * Vue初始化混合操作
 * @param options
 */
export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = options


    // 如果不是生产环境，执行initProxy
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm) // 开发阶段
    } else {
      vm._renderProxy = vm // 生产环境下， vm._renderProxy = vm
    }
    // 初始化render
    initRender(vm)

    // 挂载 $mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}


export function resolveConstructorOptions() {

}
