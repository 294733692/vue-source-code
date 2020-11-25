import Vue from '../../../core/instance/index'
import {query} from "../util/index";
import {mountComponent} from "../../../core/instance/lifecycle";
import {inBrowser, noop} from '../../../core/util/index'
import {patch} from "./patch";

// 如果是浏览器端渲染，指向patch方法，
// 如果是服务端渲染，则指向空函数，服务端渲染是没有真实浏览器DOM环境，不需要把VNode最终转换成DOM
Vue.prototype.__patch__ = inBrowser ? patch : noop

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
