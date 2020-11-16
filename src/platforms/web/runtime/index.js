import Vue from '../../../core/instance/index'
import {query} from "../util";
import {mountComponent} from "../../../core/instance/lifecycle";

/**
 * 公共$Mount方法，runtime-only版本
 * 也会使用这个版本
 * @param el
 * @param hydrating
 */
Vue.prototype.$mount = function (el, hydrating) {
  // 这里对el进行了一个修正，因为还有非web版本的
  el = query(el)
  return mountComponent(this, el, hydrating)
}

export default Vue
