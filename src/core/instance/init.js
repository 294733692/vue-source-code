import {initRender} from "./render"
import {initProxy} from "./proxy"
import {initLifecycle} from "./lifecycle"
import {mergeOptions} from "../util"

/**
 * Vue初始化混合操作
 * @param options
 */
export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this

    // merge options
    if (options && options._isComponent) {
      // 优化内部组件实例化，因为动态选项合并非常的慢
      // 并且没有内部组件选项需要特殊处理
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }

    // 如果不是生产环境，执行initProxy
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm) // 开发阶段
    } else {
      vm._renderProxy = vm // 生产环境下， vm._renderProxy = vm
    }
    // 初始化render
    vm._self = vm
    initLifecycle(vm)
    initRender(vm)


    // 挂载 $mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}


export function resolveConstructorOptions() {

}

export function initInternalComponent(vm, options) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // 这样做是因为比动态枚举要快
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}
