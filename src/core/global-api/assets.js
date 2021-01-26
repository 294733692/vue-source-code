/* @flow */

import {ASSET_TYPES} from "../../shared/constants"
import {isPlainObject, validateComponentName} from "../util"

export function initAssetRegisters(Vue) {
  /**
   * Create asset registration methods
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (id, definition) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          // this.options._base.extend 相当于 Vue.extend,
          // 把definition转化成一个继承于Vue的构造函数
          definition = this.options._base.extend(definition)
        }

        if (type === 'directive' && typeof definition === 'function') {
          definition = {bind: definition, update: definition}
        }
        // 挂载到Vue.options.components上
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
