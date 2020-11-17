import {parsePath} from "../util/lang";
import {noop} from "../../shared/util";

let uid = 0

// 观察者解析表达式，依赖收集项
// 并在表达式值更改的时候触发回调
// 这都用 $watch() Api和指令
export default class Watcher {
  vm = ''
  expression = ''
  cd = ''
  id = ''
  deep = false
  user = false
  lazy = false
  sync = false
  dirty = false
  active = false
  deps = []
  newDeps = []
  deps
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
      value = this.getter.call(vm, vm)
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
}
