import {camelize, capitalize, hasOwn} from "../../shared/util";

export function resolveAsset(
  options,
  type,
  id,
  warnMissing
) {
  if (typeof id !== 'string') {
    return
  }

  const assets = options[type]
  // 首先检查本地注册变化
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // 退回原型链
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    console.error(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}
