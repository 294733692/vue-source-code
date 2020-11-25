import {initMixin} from "./init";
import {renderMixin} from "./render";
import {lifecycleMixin} from "./lifecycle";

/**
 * 初始化Vue
 * @param options
 */
function Vue(options) {
  this._init(options)
}

initMixin(Vue)
renderMixin(Vue)
lifecycleMixin(Vue)


export default Vue
