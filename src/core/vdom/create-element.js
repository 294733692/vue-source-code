import {
  isDef,
  isPrimitive,
  isTrue
} from "../../core/util/index";
import VNode, {createEmptyVNode} from "./vnode";
import {normalizeChildren, simpleNormalizeChildren} from "./helpes/normalize-children";
import config from '../config'
import {resolveAsset} from "../util/options";
import {createComponent} from "./create-component";

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

/**
 * createElement参数处理
 */
export function createElement(
  context, // vm实例
  tag, // VNode标签
  data, // VNode的data
  children, // VNode的子节点也可以说是子VNode
  normalizationType, // 根据这个的类型 来处理children
  alwaysNormalize
) {
  // 检测data的类型，通过判断data是不是数组或者是不是基本类型，来判断data是否传入，
  // 如果满足条件，说明data没有传入，传入的第三个参数是children
  // 那么将所有参数前移，规范参数处理
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }

  // 判断alwaysNormalize是否为true
  // 后面会根据 normalizationType 的类型来处理children
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }

  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement(
  context,
  tag,
  data,
  children,
  normalizationType
) {
  // data不能为响应式对象
  // __ob__：表明这个是响应式的
  if (isDef(data) && isDef(data.__ob__)) {
    process.env.NODE_ENV !== 'production' && console.log(
      `Avoid using observed data object as vndode data: ${JSON.stringify((data))} \n` +
      'Always create fresh vnode data objects in each render!'
    )
    return createEmptyVNode // 返回一个空注释节点
  }

  if (!tag) {
    // 在组件的情况下：设置为false value
    return createEmptyVNode
  }

  // 非原始密钥警告, TODO 暂时可以忽略
  if (process.env.NODE_ENV !== 'production'
    && isDef(data) && isDef(data.key) && isPrimitive(data.key)) {
    if (!('@binding' in data.key)) {
      console.error(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead'
      )
    }
  }

  // 支持单功能子级作为默认作用域插槽 TODO 暂时忽略
  if (Array.isArray(children)
    && typeof children[0] === 'function') {
    data = data || {}
    data.scopedSolts = {default: children[0]}
    children.length = 0
  }

  // 根据normalizationType的类型来处理children
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }

  let vnode, ns
  // tag可能是字符串，也可能是组件形式
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns || config.getTagNamespace(tag))
    if (config.isReservedTag(tag)) { // 判断是否是保留标签
      // 判断tag是否是html的原生标签
      // 是就创建一个平台保留标签的VNode
      if (process.env._NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
        `the .native modifier for v-on is only valid on components but it was used on <${tag}>.`
      }
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'conponents', tag))) {
      // component
      // 如果是组件，创建组件VNode
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // 未知或未列出的命名空间元素
      // 在运行时检查，因为它可能会在其他运行时分配一个名称空间
      // 父级规范子集，如果是未识别的标签（类似于组定义组件这种，el-input这种），创建VNdode
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }

  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS(vnode, ns, force) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // 在外部对象中使用默认名称空间
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force)
      }
    }
  }
}

/**
 * 深度绑定样式，如 :class :style，
 * 类似于插槽节点
 * @param data
 */
function registerDeepBindings(data) {
  if (isObject(data.style)) {
    traverse(data.style)
  }
  if (isObject(data.class)) {
    traverse(data.class)
  }
}
