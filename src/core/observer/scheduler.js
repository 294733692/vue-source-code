import Watcher from './watcher'
import config from '../config'
import {activateChildComponent, callHook} from "../instance/lifecycle"
import {devtools} from "../util"

export const MAX_UPDATE_COUNT = 100

const queue = []
const activatedChildren = []
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
  // 2、组件的用户监视程序在其呈现监视程序之前运行（因为用户观察者先于渲染观察者创建）
  // 3、如果在父组件的观察者运行期间破坏了某个组件，它的观察者可以被跳过
  queue.sort((a, b) => a.id - b.id)

  // 不缓存长度，因为当我们运行现有观察者时，可能会推入更多的观察者
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
