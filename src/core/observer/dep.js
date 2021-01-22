export default class Dep {

}

// 当前正在评估的watcher
// 这是全局唯一的，因为一次只能评估一个watcher
Dep.target = null
const targetStack = []

export function pushTarget(target) {
  targetStack.push()
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
