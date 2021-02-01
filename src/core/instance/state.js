import {hasOwn, hyphenate, isPlainObject, isReservedAttribute, noop} from "../../shared/util"
import {isReserved, isServerRendering, nativeWatch} from "../util"
import {defineReactive, observe, toggleObserving} from "../observer"
import {validateProp} from "../util/props"
import config from '../config'
import {isUpdatingChildComponent} from "./lifecycle"

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

/**
 * 将vm._data代理到vm.data里面、vm._props代理到vm.props
 * @param target
 * @param sourceKey
 * @param key
 */
export function proxy(target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 * 对props、methods、data、computed、watcher
 * 做初始化操作
 */
export function initState(vm) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData*/)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

function initProps(vm, propsOptions) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // 缓存props keys，以便将来的道具更新可以使用Array进行迭代
  // 而不是动态对象枚举
  const keys = vm.$options._propKyes = []
  const isRoot = !vm.$parent
  // 根的prop应该被转换
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)) {
        console.error(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }

      // 将key变为响应式的
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          console.error(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }

    if (!(key in vm)) {
      proxy(vm, '_props', key)
    }
  }
  toggleObserving(true)
}

function initData(vm) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}

  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && console.error(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }

  // 实例上的代理数据，
  // 查看data定义的key是否也在methods、props里面也定义了
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        console.error(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }

    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && console.error(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // 观察数据
  observe(data, true /* asRootData */)
}

export function getData(data, vm) {
  try {
    return data.call(vm, vm)
  } catch (e) {
    return {}
  } finally {

  }
}

function initComputed(vm) {
}

function initMethods(vm, methods) {
}

function initWatch(vm, watch) {
}

export function defineComputed(
  target,
  key,
  userDef
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
    sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      console.warn(
        `Computed property "${key}" was assigned to but it has setter`
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this)
  }
}
