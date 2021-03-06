import {isNative, makeMap} from "../util/index";
import config from '../../core/config'

let initProxy

const allowedGlobals = makeMap(
  'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
  'require' // for Webpack/Browserify
)

const warnNonPresent = (target, key) => {
  console.error(
    `Property or method "${key}" is not defined on the instance but ` +
    'referenced during render. Make sure that this property is reactive, ' +
    'either in the data option, or for class-based components, by ' +
    'initializing the property. ' +
    'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.'
  )
}

const warnReservedPrefix = (target, key) => {
  console.error(
    `Property "${key}" must be accessed with "$data.${key}" because ` +
    'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
    'prevent conflicts with Vue internals. ' +
    'See: https://vuejs.org/v2/api/#data'
  )
}

const hasProxy = typeof Proxy !== 'undefined' && isNative(Proxy)  // 判断浏览器是否支持Proxy

if (hasProxy) {
  const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
  config.keyCodes = new Proxy(config.keyCodes, {
    set(target, key, value) {
      if (isBuiltInModifier(key)) {
        console.error(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
        return false
      } else {
        target[key] = value
        return true
      }
    }
  })
}

const hasHandler = {
  has(target, key) {
    const has = key in target
    // 是全局方法、或者是私有方法，并且不在data里面
    const isAllowed = allowedGlobals(key) ||
      (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
    if (!has && !isAllowed) {
      if (key in target.$data) warnReservedPrefix(target, key)
      else warnNonPresent(target, key)
    }
    return has || !isAllowed
  }
}

const getHandler = {
  get(target, key) {
    if (typeof key === 'string' && !(key in target)) {
      if (key in target.$data) warnReservedPrefix(target, key)
      else warnNonPresent(target, key)
    }
    return target[key]
  }
}

initProxy = function initProxy(vm) {
  if (hasProxy) {
    // 确定要使用的代理处理程序
    const options = vm.$options
    const handlers = options.render && options.render._withStripped
      ? getHandler
      : hasHandler
    vm._renderProxy = new Proxy(vm, handlers)
  } else {
    vm._renderProxy = vm
  }
}

export {initProxy}
