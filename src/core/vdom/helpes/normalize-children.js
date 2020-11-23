import VNode, {createTextVNode} from "../vnode";
import {isFalse, isTrue, isDef, isUndef, isPrimitive} from "../../../core/util/index";

// 模板编译器试图通过在编译时静态分析模板来最大程度地减少标准化需求。
//
// 对于纯HTML标记，可以完全跳过规范化，因为可以保证生成的渲染函数返回Array<VNode>.
// 在两种情况下，需要额外规范化：
//
// 1.当子集包含组件时：因为功能组件可能返回Array而不是单个node
// 在这种情况下，只需要简单的规范化-如果任何子级是Array，
// 我们将使用Array.prototype.concat将整个内容弄平，保证只有1级深度。
// 因为功能组件已经规范了自己的孩子
export function simpleNormalizeChildren(children) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
}

// 2.当子级包含始终生成嵌套数组的构造时，
// 例如 <template>，<slot>，v-for或用户提供子代时
// 带有手写的渲染功能/ JSX。 在这种情况下，完全归一化
// 需要满足所有可能类型的儿童价值观。
export function normalizeChildren(children) {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

/**
 * 判断是否为空文本节点
 * @param node
 */
function isTextNode(node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

/**
 * 将children扁平成一维数组
 */
function normalizeArrayChildren(children, nestedIndex) {
  const res = []
  let i, c, lastIndex, last
  for (i = 0; i < children.length; i++) {
    c = children[i]
    if (isUndef(c) || typeof c === 'boolean') continue
    lastIndex = res.length - 1
    last = res[lastIndex]
    // 嵌套的
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)
        // 合并相邻文本节点，如果当前节点和下一次节点都是文本节点，把这两个节点合并到一个节点里面
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + c[0].text)
          c.shift()
        }
        res.push.apply(res, c)
      }
    } else if (isPrimitive(c)) { // 判断是否是基础类型
      if (isTextNode(last)) { // 是否是文本节点
        // 合并相邻的文本节点
        // 这里对ssr化必要的，因为文本节点在呈现为HTML字符串实质上已合并
        res[lastIndex] = children(lastIndex.text + c)
      } else if (c !== '') {
        // 转化为vnode节点
        res.push(createTextVNode(c))
      }
    } else {
      // 正常VNode
      if (isTextNode(c) && isTextNode(last)) {
        // 合并相邻文本节点
        res[lastIndex] = createTextVNode(last.text + c.text)
      } else {
        // 嵌套数组子集的默认键(比如v-for生成的)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = `__vlist${nestedIndex}_${i}__`
        }
        res.push(c)
      }
    }
  }
  return res
}
