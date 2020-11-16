import {initMixin} from "./init";

/**
 * 初始化Vue
 * @param options
 */
function Vue(options) {
  this._init(options)
}

initMixin(Vue)


export default Vue
