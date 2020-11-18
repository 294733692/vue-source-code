import VNode, {createEmptyVNode} from "../vdom/vnode";
import {resolveSlots} from "./render-helpers/resolve-slots";
import {emptyObject} from "../util/index";
import {createElement} from "../vdom/create-element";

export let currentRenderingInstance

export function initRender(vm) {
  vm._vnode = null // 子树的根节点
  vm._staticTrees = null // v-once的缓存树
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // 父树中占位符节点
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject

  // 将createElement fn绑定到该实例，
  // 这样我们就可以其中获得适当的渲染上下文
  // args顺序：tag,data,children,normalizationType, alwaysNormalize从模块编译的渲染函数使用内部函数
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // 规范化始终应用于公开版本，用于用户编写的渲染功能
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
}

/**
 * Render混合操作，初始化
 */
export function renderMixin(Vue) {
  Vue.prototype._render = function () {
    const vm = this
    const {render, _parentVnode} = vm.$options

    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      // 不需要维护堆栈，因为所有fns都被调用彼此分开
      // 修补父组件时，将调用嵌套组件的渲染fns
      currentRenderingInstance = vm
      vnode.render.call(vm._renderProxy, vm.$createElement) // 生产环境下 vm._renderProxy  => 相当于vm
    } catch (e) {
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          vnode = vm._vnode
        }
      } else {
        console.error('renderError');
        vnode = vm._vnode
      }
    } finally {
      currentRenderingInstance = null
    }

    // 如果返回的数组仅包含一个节点
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }

    // 如果渲染函数出错，则返回空的vnode
    if (!(vnode instanceof VNode)) {
      if (Array.isArray(vnode)) {
        console.error(
          'Multiple root nodes returned from function. Render function ' +
          'should return a single root node.'
        )
      }
      vnode = createEmptyVNode()
    }
    // 设置父级
    vnode.parent = _parentVnode
    return vnode
  }
}
