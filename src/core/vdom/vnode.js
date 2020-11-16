/**
 * VNode类
 */
export default class VNode {
  tag = ''
  data = ' '
  children = ''
  text = ''
  elm = ''
  ns = ''
  context = ''
  key = ''
  componentOptions = ''
  componentInstance = ''
  parent = ''

  // strictly internal
  raw = '' // 包含原始的html? (server only)
  isStatic = '' // 是否是静态节点
  isRootInsert = '' // 输入过渡检查
  isComment = '' // 是否是空评论占位符?
  isCloned = '' // 是否是克隆节点?
  isOnce = '' // 是否是v-once节点?
  asyncFactory = '' // 异步组件工厂函数
  asyncMeta = ''
  isAsyncPlaceholder = ''
  ssrContext = ''
  fnContext = '' // 真实功能节点的上下文
  fnOptions = ''// 用于ssr缓存
  devtoolsMeta = '' // 用于存储devtools的功能渲染上下文
  fnScopeId = ''// 范围id查询功能

  constructor(
    tag,
    data,
    children,
    text,
    elm,
    context,
    componetsOptions,
    asyncFactory
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  get child() {
    return this.componentInstance
  }
}


/**
 * 创建空节点
 * @param text
 * @returns {VNode}
 */
export const createEmptyVNode = (text = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

/**
 * 创建文本节点
 * @param val
 * @returns {VNode}
 */
export function createTextVNode(val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// 优化浅克隆
// 用于静态节点和插槽节点，因为他们可以在多个渲染中重复使用，
// 克隆他们可以避免在DOM操作依赖它们的elm参考时出错
export function cloneVNode(vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children && vnode.children.slice(), // 克隆子数组以避免在克隆子数组的时候，原数组发生变异
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
