import {createEmptyVNode} from "../vdom/vnode";
import {noop} from "../../shared/util";
import Watcher from "../observer/watcher";

export function mountComponent(vm, el, hydrating) {
  vm.$el = el //缓存el
  if (!vm.$options.render) { // 没有render函数，也就是说，template没有正确转换成render函数
    vm.$options.render = createEmptyVNode // 创建一个空的VNode节点

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

  let updateComponent
  updateComponent = () => {
    // 先调用vm._render方法生成虚拟Node，
    // vm._update更新DOM
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
