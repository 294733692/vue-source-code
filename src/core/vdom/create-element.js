import {isPrimitive} from "../../core/util/index";

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

export function createElement(
  context, // vm实例
  tag, // VNode标签
  data, // VNode的data
  children, // VNode的子节点也可以说是子VNode
  normalizationType,
  alwaysNormalize
) {
  // 检测传入的第三个参数，是否是children类型的，也就是data的传参

  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement(
  content,
  tag,
  data,
  children,
  normalizationType
) {

}
