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

function normalizeArrayChildren(children, nestedIndex) {
  const res = []
  return res
}
