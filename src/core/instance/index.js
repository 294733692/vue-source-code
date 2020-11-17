import {initMixin} from "./init";
import {renderMixin} from "./render";

/**
 * 初始化Vue
 * @param options
 */
function Vue(options) {
  this._init(options)
}

initMixin(Vue)
renderMixin(Vue)


export default Vue
