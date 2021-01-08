import {createEmptyVNode} from "../vdom/vnode"
import {noop} from "../../shared/util"
import Watcher from "../observer/watcher"

export let activeInstance = null // 为当前激活组件的vm实例
export let isUpdatingChildComponent = false

export function setActiveInstance(vm) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

/**
 * 建立父子组件关系
 */
export function initLifecycle(vm) {
  const options = vm.$options // 这里的vm是子组件的vm

  let parent = options.parent // 这里是vm的父组件
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  // 建立父子组件关系
  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode, hydrating) {
    // 数据更新时要用到的参数
    const vm = this
    // 数据更新时的参数
    const prevEl = vm.$el
    const prevVnode = vm._vnode // 首次渲染的时候为空
    const restoreActiveInstance = setActiveInstance(vm)
    // vm.$vnode 和 vm._vnode是父子关系
    // vm._vnode是组件的渲染vnode
    // vm.$vnode为组件的占位vnode
    vm._vnode = vnode
    // Vue.prototype.__patch__ 根据所使用的渲染后端注入入口点
    if (!prevVnode) {
      // 初始化渲染，首次渲染会走这个方法， vm.__patch__为核心
      // vm.$el 是真实DOM，vnode是vm._render生成的watcher Dom
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // 更新
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    // 更新 __vue__
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // 如果父级是HOC，则也更新其$el
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // 调度程序将调用更新的钩子，以确保子进程处于在父母的更新钩子中更新
  }
}

export function mountComponent(vm, el, hydrating) {
  vm.$el = el //缓存el
  if (!vm.$options.render) { // 没有render函数，也就是说，template没有正确转换成render函数
    vm.$options.render = createEmptyVNode // 创建一个空的VNode节点
    if (process.env.NODE_ENV !== 'production') {
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        console.error(
          'You ara using the runtime-only build of Vue where the template ' +
          'compiler is ont available. Either pre-compiler the templates into ' +
          'render functions, os use the compiler-included build.')
      } else {
        console.error('Failed to mount Component: template or render function ont defined.')
      }
    }
  }

  let updateComponent
  updateComponent = () => {
    // 先调用vm._render方法生成虚拟Node，
    // vm._update更新DOM,核心方法就是Vue.__patch__
    vm._update(vm._render(), hydrating)
  }

  // 触发渲染watcher，实例化一个渲染Watcher，在回调函数中调用 updateComponent方法，最终调用vm._update更新DOM
  // 这里Watcher起到两个作用，
  // 1.在初始化的时候会执行回调函数
  // 2.当VM示例中检测到的数据发生变化的时候执行回调函数
  new Watcher(vm, updateComponent, noop, {}, true)
  hydrating = false

  if (vm.$vnode == null) { // vm.$vnode表示Vue实例的父虚拟Node，所以为null的时候，表示当前根Vue的实例
    vm.isMounted = true // 表示示例挂载了，
    // callHook(vm, 'mounted') // 执行mounted函数
  }
  return vm
}


/**
 * 更新子组件
 * @param vm
 * @param propsData
 * @param listeners
 * @param parentVnode
 * @param renderChildren
 */
export function updateChildComponent(vm, propsData, listeners, parentVnode, renderChildren) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true
  }

  // 确定组件是否具有插槽子级
  // 我们需要覆盖$options._renderChildren之前执行此操作

  // 检查是否有动态scopedSlots(手写或编译，但带有动态广告位名称)
  // 从模板编译的静态作用域插槽具有稳定的"$stable"标记

}


function isInInactiveTree(vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return false
  }
  return false
}

export function activateChildComponent(vm, direct) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inavtive || vm._inactive === null) {
    vm._inavtive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    callHook(vm, 'activated')
  }
}

export function deactivateChildComponent(vm, direct) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    callHook(vm, 'deactivated')
  }
}

/**
 * 检查用户自定义钩子函数，并执行对应的钩子函数
 * @param vm
 * @param hook
 */
export function callHook(vm, hook) {

}
