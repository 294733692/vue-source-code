import {isDef, isObject, isTrue, isUndef} from "../../shared/util"
import {createAsyncPlaceholder, resolveAsyncComponent} from "./helpes/resolve-async-component"
import {resolveConstructorOptions} from "../instance/init"
import {extractPropsFromVNodeData} from "./helpes/extract-props"
import {createFunctionalComponent} from "./create-functional-component"
import {
  activateChildComponent,
  activeInstance,
  callHook, deactivateChildComponent,
  updateChildComponent
} from "../instance/lifecycle"
import {queueActivatedComponent} from "../observer/scheduler"


// 修补期间在组件VNode上调用内联挂钩
const componentVNodeHooks = {
  init(vnode, hydrating) {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepalive
    ) {
      // 保持活动的组件，视为补丁
      const mountedNode = vnode // 绕流工作
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = // 返回子组件的vnode实例
        createComponentInstanceForVnode(
          vnode,
          activeInstance
        )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },

  prepatch(oldVnode, vnode) {
    const options = vnode.componentOptions
    const child = vnode.componentInstance = oldVnode.componentInstance

    updateChildComponent(
      child,
      options.propsData, // update props
      options.listeners, // update listeners
      vnode, // new parent vnode
      options.children // new children
    )
  },

  // 每个组件都是在这个钩子函数里面执行`mounted`钩子函数
  // insertedVnodeQueue的添加顺序是先子后父，mounted的执行顺序也是先子后父
  insert(vnode) {
    const {context, componentInstance} = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
    if (vnode.data.keepalive) {
      if (context._isMounted) {
        // 在更新期间，保持活动的组件的子组件可能会更改
        // 因此直接在此处运行tree，可能错误的children 使用激活钩子
        // 相反，我们将他们推入队列，整个修补过程结束后对其进行处理
        queueActivatedComponent(componentInstance)
      } else {
        activateChildComponent(componentInstance, true /* direct */)
      }
    }
  },

  destroy(vnode) {
    const {componentInstance} = vnode
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepalive) {
        componentInstance.$destroy()
      } else {
        deactivateChildComponent(componentInstance, true /* direct */)
      }
    }
  }
}


const hooksToMerge = Object.keys(componentVNodeHooks)

export function createComponent(
  Ctor, // 组件
  data,
  context, // 上下文，当前vm实例
  children, // 组件子vnode
  tag
) {
  if (isUndef(Ctor)) {
    return
  }
  // 在initGlobal(Vue)，context.$options._base = Vue
  // 基类构造器，就是一个Vue
  const baseCtor = context.$options._base

  // 纯选项对象：将其转换为构造函数/器
  // 通过vue.extend方法转换成构造函数/器
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }

  // 在此阶段它不是构造函数或异步组件工厂
  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }

  // 异步组件
  let asyncFactory
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor)
    if (Ctor === undefined) {
      // 返回异步组件的占位符节点，该组件呈现作为注释节点，
      // 但保留该节点的所有原始信息。
      // 该信息将用于异步服务器渲染和水化
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {}

  // 解决构造函数选项，以防在应用全局混合后组件构造函数的创建
  resolveConstructorOptions(Ctor)

  // 将v-model数据转换为 props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data)
  }
  // 提取props
  const propsData = extractPropsFromVNodeData(data, Ctor, tag)

  // 功能性组件
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // 提取侦听器，因为这些需要被视为
  // 子组件侦听器，而不是DOM侦听器
  const listeners = data.on

  // 用.native修饰符替换为侦听器
  // 因此会在父组件补丁期间对其进行处理。
  data.on = data.nativeOn

  if (isTrue(Ctor.options.abstract)) {
    // 抽象组件不保留任何内容
    // 除了props、listeners、slot

    // 绕流工作
    const slot = data.slot
    data = {}
    if (slot) {
      data.slot = slot
    }
  }

  // 将组件管理挂钩安装到占位符节点上
  // 安装组件钩子函数
  installComponentHooks(data)

  // 返回占位符节点,生成组件vnode
  // 注意：组件的children是为空的，组价相关参数都在"componentOptions里面"
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    {Ctor, propsData, listeners, tag, children},
    asyncFactory
  )

  return vnode
}


// 将组件v-model信息（值和回调）转换为道具和事件处理程序。
function transformModel(options, data) {
  const prop = (options.model && options.model.prop) || 'value'
  const event = (options.model && options.model.event) || 'input'
  ;(data.attrs || (data.attrs = {}))[prop] = data.model.value
  const on = data.on || (data.on = {})
  const existing = on[event]
  const callback = data.model.callback
  if (isDef(existing)) {
    if (
      Array.isArray(existing)
        ? existing.indexOf(callback) === -1
        : existing !== callback
    ) {
      on[event] = [callback].concat(existing)
    }
  } else {
    on[event] = callback
  }
}


export function installComponentHooks(data) {
  const hooks = data.hook || (data.hook = {})
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const existing = hooks[key]
    const toMerge = componentVNodeHooks[key]
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
    }
  }
}

// 就是在最终执行的时候，依次执行这两个钩子函数
function mergeHook(f1, f2) {
  const merged = (a, b) => {
    f1(a, b)
    f2(a, b)
  }
  merged._merged = true
  return merged
}

/**
 * @param vnode 组件vnode
 * @param parent 当前vm的实例
 */
export function createComponentInstanceForVnode(vnode, parent) {
  const options = {
    _isComponent: true,
    _parentVnode: vnode, // 组件vnode，占位符vnode
    parent // 当前vnode的实例
  }

  // 检查 inline-template 渲染方法
  const inlineTemplate = vnode.data.inlineTemplate
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render
    options.staticRenderFns = inlineTemplate.staticRenderFns
  }
  // 这里执行extend函数里面的Super，也就是构造函数，相当于执行Vue._init(options)
  return new vnode.componentOptions.Ctor(options)
}
