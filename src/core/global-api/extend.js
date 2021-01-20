import {ASSET_TYPES} from "../../shared/constants"
import {mergeOptions, validateComponentName} from "../util/index"
import {defineComputed, proxy} from "../instance/state"


export function initExtend(Vue) {
  /**
   * 每个实例构造函数（包括Vue）都有一个唯一的cid。
   * 这让我们能够创建包装的"子构造函数"并对其进行缓存
   */

  Vue.cid = 0
  let cid = 1

  /**
   * 继承类
   * 采用原型继承，返回一个子构造器
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {}
    const Super = this // this指向Vue
    const SuperId = Super.cid // 这里是Vue.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    // 如果进来发现SuperId相同，说明他们是继承同一个父类构造器来的
    // 这里做了缓存优化
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    // 定义组件name
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // 定义子构造函数，实际上就是调用Vue._init()
    const Sub = function VueComponent(options) {
      this._init(options)
    }
    // 简单的原型继承
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    Sub['super'] = Super

    if (Sub.options.props) {
      initProps(Sub)
    }

    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // 允许进一步扩展、混合、插件使用
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // 创建资源注册
    // 以便扩展类也可以拥有私有资源
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })

    // 启用递归自查找
    if (name) {
      Sub.options.components[name] = Sub
    }

    // 在扩展时保留对超级选项的引用
    // 稍后在实例化中，我们可以检查super的选项是否具有已更新
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // 缓存构造函数，
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps(Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, '_props', key)
  }
}

function initComputed(Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
