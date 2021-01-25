import {parsePath} from "../util/lang"
import {isObject, noop, remove} from "../../shared/util"
import {handleError} from "../util"

let uid = 0

// 观察者解析表达式，依赖收集项
// 并在表达式值更改的时候触发回调
// 这都用 $watch() Api和指令
export default class Watcher {
  vm = ''
  expression = ''
  cd
  id = ''
  deep = false
  user = false
  lazy = false
  sync = false
  dirty = false
  active = false

  // diff算法相关
  deps = []
  newDeps = []
  depIds
  newDepIds = ''
  before = ''
  getter = ''
  value = ''

  constructor(
    vm,
    expOrFn, // 表达式或者是方法
    cb, // 回调
    options, // 配置参数
    isRenderWatcher // 是否是渲染watcher
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this // 表明当前实例为渲染watcher
    }
    vm._watchers = [].push(this)

    // options配置处理, TODO 暂时可以忽略
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid
    this.active = true
    this.dirty = this.lazy // 对懒观察者
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = expOrFn.toString()

    // 为getter解析表达式
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        console.error(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function insted'
        )
      }
    }

    this.value = this.lazy ? undefined : this.get()
  }

  /**
   * 重新收集依赖关系
   */
  get() {
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)  // 这里实际执行的lifecycle => updateComponent方法
    } catch (e) {
      if (this.user) {
        console.error(`getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      if (this.deep) {
        // traverse(value)
      }
      this.cleanupDeps()
    }
    return value
  }

  /**
   * 清除依赖集合
   */
  cleanupDeps() {
  }

  /**
   * 计划程序作业界面
   * 将由调度程序调用
   **/
  run() {
    if (this.active) {
      const value = this.get()

      if (
        value !== this.value ||
        // 即使值相同，deep watchers和 对象/数组上的观察者也应触发，
        // 因为该值可能以发生变异
        isObject(value) ||
        this.deep
      ) {
        // 设置新的值
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e.this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  teardown() {
    // 将自身从vm的watcher列表移除
    // 这是一个有点昂贵的操作，所有我们跳过它
    // 如果vm被销毁的话
    if (this.active) {
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
