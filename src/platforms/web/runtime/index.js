import Vue from '../../../core/instance/index'
import {query} from "../util/index";
import {mountComponent} from "../../../core/instance/lifecycle";
import {inBrowser} from '../../../core/util/index'

/**
 * 公共$Mount方法，runtime-only版本
 * 也会使用这个版本
 * @param el
 * @param hydrating
 */
Vue.prototype.$mount = function (
  el,  // 挂在的元素，字符串或DOM对象，如果是字符串，会在浏览器环境下调用query方法转换成DOM对象
  hydrating // 服务器渲染相关、在浏览器环境下，不需要传入，默认为false
) {
  // 这里对el进行了一个校验，runtime-only版本会直接执行这一步
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

export default Vue
