import Watcher from './watcher'
import config from '../config'
import {activateChildComponent, callHook} from "../instance/lifecycle"
import {devtools} from "../util"
import {nextTick} from "../util/next-tick"

export const MAX_UPDATE_COUNT = 100

// 存放整个watcher数组
const queue = []
const activatedChildren = []
// 保存Watcher，用于判断watcher是否存在
//
let has = {}
let circular = {}
let waiting = false
let flushing = false
let index = 0

/**
 * 重置 scheduler 状态
 */
function resetSchedulerState() {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

// 异步边缘事件：需要在附加事件侦听器时保存时间搓
// 但是调用performance.now()会产生性能开销，尤其是如果页面有数千个事件侦听器。
// 取而代之的是，每次调度程序刷新时，我们都会使用一个时间戳，
// 并将其用于该刷新期间附加的所有时间侦听器
export let currentFlushTimestamp = 0

// 异步边缘案例，修复需要存储事件监听器的附加时间戳
let getNow = () => Date.now()

/**
 * 对在修补程序中激活的保持活动的组件进行排队
 * 修补整个tree后，将处理队列
 */
export function queueActivatedComponent(vm) {
  vm._isactive = false
  activatedChildren.push(vm)
}

/**
 * 刷新两个队列并允许观察程序
 */
function flushSchedulerQueue() {
  currentFlushTimestamp = getNow()
  flushing = true
  let watcher, id

  // 刷新前对队列进行排序，这样可以确保：
  // 1、组件从父级更新为子级。（因为parent 总是在 children 之前创立）
  //    因为父组件的创建过程要先于子组件，所以Watcher的创建过程也是先父后子，执行顺序先父后子
  // 2、组件的用户监视程序在其呈现监视程序之前运行（因为用户观察者先于渲染观察者创建）
  // 3、如果在父组件的观察者运行期间破坏了某个组件，它的观察者可以被跳过
  queue.sort((a, b) => a.id - b.id)

  // 不缓存长度，因为当我们运行现有观察者时，可能会推入更多的观察者
  // 主要注意的是，这里的queue.length长度有可能会在执行watcher.run的时候会发生改变
  // 如果在watcher.run的过程中，又执行了queueWatcher
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    watcher.run()
    // 在开发打包阶段，插件并停止循环更新
    if (process.env.NODE_ENV !== 'production' && has[id] !== null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        console.warn('You may  have an  infinite update loop' + (
          watcher.user
            ? `in watcher with expression "${watcher.expression}"`
            : `in a component render function`
        ),
          watcher.vm
        )
        break
      }
    }
  }

  // 重置状态之前保留发布队列的副本
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice() // 更新了的watcher数组

  resetSchedulerState()

  // 执行组件已更新并激活了挂钩
  callActivatedHooks(activatedQueue)
  callUpdateHooks(updatedQueue)

  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}

/**
 * 执行update钩子
 * @param queue
 */
function callUpdateHooks(queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}

function callActivatedHooks(queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inavtive = true
    activateChildComponent(queue[i], true /* true */)
  }
}

/**
 * 添加一个观察者到观察者队列。
 * 除非刷新队列是将其推送，否则具有重复ids的作业将被跳过
 */
export function queueWatcher(watcher) {
  const id = watcher.id
  if (has[id] == null) { // 如果之前watcher不存在
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    if (!waiting) {
      waiting = true
      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}
