import {createEmptyVNode} from "../vdom/vnode";
import {noop} from "../../shared/util";
import Watcher from "../observer/watcher";

export let activeInstance = null
export let isUpdatingChildComponent = false

export function setActiveInstance(vm) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode, hydrating) {
    // 数据更新时要用到的参数
    const vm = this
    // 数据更新时的参数
    const prevEl = vm.$el
    const prevVnode = vm._vnode // 首次渲染的时候为空
    const restoreActiveInstance = setActiveInstance(vm)
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
