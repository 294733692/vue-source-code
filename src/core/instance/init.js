import {initRender} from "./render"
import {initProxy} from "./proxy"
import {callHook, initLifecycle} from "./lifecycle"
import {extend, mergeOptions} from "../util"
import {initState} from "./state"

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

    // 初始化父子组件关系
    initLifecycle(vm)
    initRender(vm)

    callHook(vm, 'beforeCreate')
    initState(vm)

    // 挂载 $mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent(vm, options) {
  // 把之前通过 createComponentInstanceForVnode 函数传入的几个参数合并到内部的选项 $options 里
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

/**
 * 解析构造函数选项
 * @param Ctor
 * @returns {*|{}|{parent, _parentVnode, _isComponent}}
 */
export function resolveConstructorOptions(Ctor) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cacheSuperOptions = Ctor.superOptions
    if (superOptions !== cacheSuperOptions) {
      // super options changed
      // 需要分析新的options
      Ctor.superOptions = superOptions
      // 检查他们是否有后期的有改或附加选项
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

/**
 * 解决修改的选项
 * @param Ctor
 * @returns {{}}
 */
function resolveModifiedOptions(Ctor) {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
