import {remove} from "../../shared/util"

let uid = 0

/**
 * dep是可以观察的，可以有多个订阅它的指令
 * dep是订阅者Watcher对应的数据依赖
 */
export default class Dep {
  static target // 全局唯一的watcher，同一时间只能有一个全局的 watcher 被计算
  id
  subs // 是watcher的数组

  constructor() {
    // 每一个dep都有一个唯一的id
    this.id = uid++
    // subs用于存放依赖
    this.subs = []
  }

  // 向subs数字添加依赖
  addSub(sub) {
    this.subs.push(sub)
  }

  // 移除依赖
  removeSub(sub) {
    remove(this.subs, sub)
  }

  // 设置某个Watcher的依赖
  // 这里添加了Dep.target是否存在的判断，目的是判断是不是Watcher的构造函数调用
  // 也就是说判断了它是Watcher的this.get调用，而不是普通调用
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify() {
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // 如果没有运行异步，则不会在调度程序中潜默进行排序，
      // 我们需要立即对齐进行排序，以确保其正确的顺序触发
      subs.sort((a, b) => a.id - b.id)
    }
    // 通知所有绑定的Watcher。调用Watcher的update
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// 当前正在评估的watcher
// 这是全局唯一的，因为一次只能评估一个watcher
Dep.target = null
const targetStack = []

/**
 * 把Dep.target赋值为当前的渲染watcher，并压栈（为了恢复用）
 */
export function pushTarget(target) {
  targetStack.push()
  Dep.target = target
}

/**
 * 恢复成上一次正在计算的target
 */
export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
