import Watcher from './watcher'
import config from '../config'

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
