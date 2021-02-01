import {hasOwn, isObject, isPlainObject} from "../../shared/util"
import VNode from "../vdom/vnode"
import Dep from "./dep"
import {def, hasProto, isServerRendering} from "../util"
import {arrayMethods} from "./array"

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)


// 在某些情况下，我们可能希望禁用组件内部的观察
// 更新计算
export let shouldObserve = true

export function toggleObserving(value) {
  shouldObserve = value
}

/**
 * 附加到每个观察对象的观察者类，
 * 附加后，观察者将目标对象的属性键转换为getter/setter，
 * 并收集依赖关系并调度更新
 **/
export class Observer {
  value
  dep
  vmCount

  constructor(value) {
    this.value = value
    this.dep = new Dep()
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
    }
  }

  /**
   * 遍历所有属性，并将他们转换为getter/setter，
   * 仅当值的类型为Object时才调用这个方法
   */
  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * 观察数组选项列表
   */
  observeArray(item) {
    for (let i = 0, l = item.length; i < l; i++) {
      observe(item[i])
    }
  }
}

/**
 * 通过使用__proto__截取原型链来增强目标对象或数组
 */
function protoAugment(target, src) {
  target.__proto__ = src
}

/**
 * 通过定义来增强目标对象或数组
 */
function copyAugment(target, src, keys) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}


export function observe(value, asRootData) {
  // 如果观测数据不是一个对象或者是一个VNode实例，直接return
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob
  // 如果value有__ob__属性，并且是Observer实例
  // 这里避免重复观测一个数据对象
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 当一个数据对象被观测之后，会在该对象上定义一个__ob__属性
    ob = value.__ob__
  } else if (
    // 默认为true
    shouldObserve &&
    // 返回一个Boolean，用于判断是否是服务端渲染
    !isServerRendering() &&
    // 被观测的数据对象必须是数组或者是纯对象
    (Array.isArray(value) || isPlainObject(value)) &&
    // 观测的数据对象必须是可以扩展。（默认是可扩展的）
    Object.isExtensible(value) &&
    // Vue实例才拥有_isVue属性，在此是避免观测的Vue实例对象
    !value._isVue
  ) {
    ob = new Observer(value)
  }

  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

export function defineReactive(
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  const dep = new Dep()

  // 拿到obj上的属性描述符
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // configurable属性描述符为true，才能修改数据对象
  // 这里为false不能修改,直接return
  if (property && property.configurable === false) {
    return
  }

  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
    },
    set: function reactiveSetter(newVal) {
    }
  })
}
