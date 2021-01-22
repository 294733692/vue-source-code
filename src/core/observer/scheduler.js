import Watcher from './watcher'
import config from '../config'
import {callHook} from "../instance/lifecycle"

export const MAX_UPDATE_COUNT = 100

const queue = []
const activatedChildren = []
let has = {}
let circular = {}
let waiting = false
let flushing = false
let index = 0

/**
 * 对在修补程序中激活的保持活动的组件进行排队
 * 修补整个tree后，将处理队列
 */
export function queueActivatedComponent(vm) {
  vm._isactive = false
  activatedChildren.push(vm)
}

// 异步边缘事件：需要在附加事件侦听器时保存时间搓
// 但是调用performance.now()会产生性能开销，尤其是如果页面有数千个事件侦听器。
// 取而代之的是，每次调度程序刷新时，我们都会使用一个时间戳，
// 并将其用于该刷新期间附加的所有时间侦听器
export let currentFlushTimestamp = 0

// 异步边缘案例，修复需要存储事件监听器的附加时间戳
let getNow = () => Date.now()

/**
 * 刷新两个队列并允许观察程序
 */
function flushSchedulerQueue() {

  //...
  const updatedQueue = queue.slice() // 更新了的watcher数组
  callUpdateHooks(updatedQueue)
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
