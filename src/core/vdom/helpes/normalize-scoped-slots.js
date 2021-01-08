import {emptyObject, no} from "../../../shared/util"
import {def} from "../../util"
import {normalizeChildren} from "./normalize-children"

export function normalizeScopedSlots(
  slots,
  normalSlots,
  prevSlots
) {
  let res
  const hasNormalSlots = Object.keys(normalSlots).length > 0
  const isStable = slots ? !!slots.$stable : !hasNormalSlots
  const key = slots && slots.$key
  if (!slots) {
    res = {}
  } else if (slots._normalized) {
    // 快速路径 1：仅子组件进行重新渲染，父组件未更改
    return slots._normalized
  } else if (
    isStable &&
    prevSlots &&
    prevSlots !== emptyObject &&
    key === prevSlots.$key &&
    !hasNormalSlots &&
    !prevSlots.$hasNormal
  ) {
    // 快捷路径 2：稳定的作用域插槽，具有、没有用于代理的正常插槽
    // 仅需要标准化一次
    return prevSlots
  } else {
    res = {}
    for (const key in slots) {
      if (slots[key] && key[0] !== '$') {
        res[key] = normalizeScopedSlot(normalSlots, key, slots[key])
      }
    }
  }

  // 在scopedSlots上公开普通插槽
  for (const key in normalSlots) {
    if (!(key in res)) {
      res[key] = proxyNormalSlot(normalSlots, key)
    }
  }

  // avoriaz似乎模拟了一个不可扩展的"$scopedSlots"对象，
  // 当该对象向下传递，将导致错误
  if (slots && Object.isExtensible(slots)) {
    slots._normalized = res
  }
  def(res, '$stable', isStable)
  def(res, '$key', key)
  def(res, '$hasNormal', hasNormalSlots)
  return res
}

function normalizeScopedSlot(normalSlots, key, fn) {
  const normalized = function () {
    let res = arguments.length ? fn.apply(null, arguments) : fn({})
    res = res && typeof res === 'object' && !Array.isArray(res)
      ? [res] // single vnode
      : normalizeChildren(res)
    return res && (
      res.length === 0 ||
      (res.length === 1 && res[0].isComment) // #9658
    ) ? undefined
      : res
  }
  // 这是一个使用新的v-slot语法且没有范围的插槽，
  // 虽然是编译为作用域的插槽后，渲染fn用户会希望它存在有this.$slot中，
  // 因为语法在语义上是一个正常的插槽
  if (fn.proxy) {
    Object.defineProperty(normalSlots, key, {
      get: normalized,
      enumerable: true,
      configurable: true
    })
  }
  return normalized
}


function proxyNormalSlot(slots, key) {
  return () => slots[key]
}

