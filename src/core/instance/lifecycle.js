import {createEmptyVNode} from "../vdom/vnode";
import {noop} from "../../shared/util";
import Watcher from "../observer/watcher";

export function mountComponent(vm, el, hydrating) {
  vm.$el = el
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode

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
    vm._update(vm._render(), hydrating)
  }

  // 触发渲染watcher
  new Watcher(vm, updateComponent, noop, {}, true)
  hydrating = false

  if (vm.$vnode == null) {
    vm.isMounted = true
    // callHook(vm, 'mounted')
  }
  return vm
}
