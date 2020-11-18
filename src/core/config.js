import {LIFECYCLE_HOOKS} from "../shared/constants";
import {
  no,
  noop,
  identity
} from '../shared/util'

const Config = {
  // user
  optionMergeStrategies: Object.create(null), // 选项合并策略 （用于合并 core/util/options）
  silent: false, // 是否取消警告.
  productionTip: false, // 在启动时显示生产模式提示消息吗
  performance: false, // 是否记录性能
  devtools: false, // 是否启用devtools
  errorHandler: null, // 观察者错误的错误处理程序
  warnHandler: null, // 观察者的警告处理程序警告
  ignoredElements: [], // 忽略某些自定义元素
  keyCodes: Object.create(null), // v-on的自定义用户密钥别名

  // platform
  isReservedTag: no, // 检查标签是否已保留，以便不能将其注册为组件。 这与平台有关，可能会被覆盖。
  isReservedAttr: no, // 检查属性是否已保留，以便不能用作组件支柱。 这与平台有关，可能会被覆盖。
  parsePlatformTagName: identity, // 解析特定平台的真实标签名称
  isUnknownElement: no, // 检查标签是否为未知元素。取决于平台。
  getTagNamespace: noop, // 获取元素的名称空间
  mustUseProp: no, // 检查是否必须使用属性来绑定属性，例如 值取决于平台。

  // private
  async: true, // 异步执行更新。 打算由Vue Test Utils使用。如果设置为false，这将大大降低性能。

  // legacy
  _lifecycleHooks: LIFECYCLE_HOOKS, // 由于遗留原因而暴露
};

export default Config
