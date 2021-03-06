import {initExtend} from "./extend"
import {ASSET_TYPES} from "../../shared/constants"
import buildInComponents from '../components/index'
import {initAssetRegisters} from "./assets"

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI(Vue) {

  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }
  Vue.nextTick = nextTick

  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // 这用于标识“基本”构造函数，以扩展所有的纯对象
  // Weex的多实例方案中的组件
  Vue.prototype._base = Vue

  // 合并keep-alive组件
  extend(Vue.options.components, buildInComponents)

  initExtend(Vue)
  initAssetRegisters(Vue)
}
