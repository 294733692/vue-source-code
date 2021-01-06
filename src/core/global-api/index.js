export function initGlobalAPI(Vue) {
  // 这用于标识“基本”构造函数，以扩展所有的纯对象
  // Weex的多实例方案中的组件
  Vue.prototype._base = Vue
}
