/**
 * Vue初始化混合操作
 * @param options
 */
export function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = options

    // 挂载 $mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
