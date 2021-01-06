import {isDef, isObject, isTrue, isUndef} from "../../shared/util";
import {createAsyncPlaceholder, resolveAsyncComponent} from "./helpes/resolve-async-component";
import {resolveConstructorOptions} from "../instance/init";
import {extractPropsFromVNodeData} from "./helpes/extract-props";
import {createFunctionalComponent} from "./create-functional-component";


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
  const baseCtor = context.$options._base

  // 纯选项对象：将其转换为构造函数
  // 通过vue.extend方法转换成构造函数
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
  // installComponentHooks(data)

  // 返回占位符节点
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  return vnode
}


// 将组件v模型信息（值和回调）转换为
// 道具和事件处理程序。
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
