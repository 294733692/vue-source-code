import Vue from '../web/runtime/index'
import {query} from "./util/index";
import {cached} from "./util/cached";

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// 记录原型上的$mount方法
const mount = Vue.prototype.$mount

// 重写$mount方法,这里hydrating暂时默认为false
Vue.prototype.$mount = function (el, hydrating = false) {
  el = el && query(el)

  if (el === document.body || el === document.documentElement) {
    // Vue不能挂在到html、body标签上，如果直接挂在会直接覆盖掉body，从而导致整个html不对
    console.error('Do not mount Vue to <html> or <body> - mount to elements instead')
    return this
  }

  const options = this.$options // 缓存this.$options
  // 将用户传入的template模板或者是el element转换成render函数，Vue渲染只认render函数
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        // 如果template传入的是 '#template',就去查找element元素
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          if (!template) { // 同query.el逻辑
            console.error(`Template element not found or is empty: ${options.template}`)
            return this
          }
        }
      } else if (template.nodeType) {
        // 如果是元素节点，取内部的html
        template = template.innerHTML
      }
    } else if (el) {
      template = getOuterHtml(el)
    }
    // 编译逻辑,如果template存在，就将template转换成render函数
    // TODO 编译逻辑后面在写
    if (template) {

    }
  }

  // 调用之前缓存的mount方法，这里hydrating暂时默认为false，即可
  return mount.call(this, el, hydrating)
}

/**
 * 获取节点元素内容
 * @param el
 * @return {string}
 */
function getOuterHtml(el) {
  if (el.outerHTML) { // 整个元素节点
    return el.outerHTML
  } else {
    // 如果不存在，在外面包一层，在返回里面的innerHTML
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

export default Vue
