import Vue from '../../../core/instance/index'
import {query} from "../util";
import {mountComponent} from "../../../core/instance/lifecycle";

Vue.prototype.$mount = function (el, hydrating) {
  el = query(el)
  return mountComponent(this, el, hydrating)
}

export default Vue
