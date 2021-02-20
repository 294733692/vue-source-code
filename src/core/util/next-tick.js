import {isIE, isIOS, isNative} from "./env"
import {noop} from "../../shared/util"

// 是否采用微任务
export let isUsingMicroTask = false

// 保存添加任务的数组
const callbacks = []
// 队列任务状态
let pending = false

// 事件循环中任务队列的回调函数
function flushCallbacks() {
  // 将状态为等带任务添加的状态
  pending = false
  // 保存一个副本
  // 原因：如果我们在nextTick的回调函数中使用了nextTick方法
  // 那么这个时候添加的方法会放在下一个任务队列中，而不是在当前队列中执行
  const copies = callbacks.slice(0)
  // 清空任务队列
  callbacks.length = 0
  // 执行回调函数（任务）
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// 这里我们使用了微任务异步延迟包装器
// 在2.5中，我们使用了（宏）任务（结合了微任务）
// 但是，它具有当状态重绘之前更改权微妙的问题
// 另外，在事件处理程序中使用（宏）任务会导致无法规避的一些奇怪的行为
// 因此，我们现在再次在各处使用微任务
// 这种折中的方案，也是存在一些问题
// 在这种情况下，微任务的优先级过高，并且在嘉定的顺序事件之间，甚至在同一事件冒泡之间也会触发
let timerFunc

// nextTick行为利用了微任务队列，可以通过本地Promise.then或MutationObserver对其进行访问
// MutationObserver拥有更广泛的支持，但是在此方面存在错误。
// 在触摸事件处理程序中触发， IOS>=9.3.3中的UIWebView
// 触发几次后，它将完全停止工作
// 因此，如果本地Promise可用，我们将使用它
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // 在有问题的UIWebViews中，Promise.then不会完全中断，但是它可能会陷入一种怪异的状态，
    // 在这种状态下，回调被推送到微任务队列中，但是队列没有被刷新，直到浏览器需要执行其他的一些工作，
    // 例如：处理一个计时器
    // 因此，我们可以通过添加一个空计时器来"强制"刷新微任务队列
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // 在本地Promise不可用的地方使用MutationObserver
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // 退回到setImmediate
  // 从技术上讲，它利用了（宏）任务队列
  // 但它仍然是比setTimeout更好的选择
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // 退回到setTimeout
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

export function nextTick(cd, ctx) {
  let _resolve
  // 将所有添加的任务保存到callbacks数组，push的是一个匿名函数
  callbacks.push(() => {
    if (cb) {
      // 使用try catch保证js代码能够正常执行
      // js是单线程，如果不适用try catch 执行的话，当某一个cb函数执行失败，就会阻断代码执行
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      // promise的逻辑
      _resolve(ctx)
    }
  })
  // 如果不是pending(在执行任务)，运行任务
  if (!pending) {
    pending = true
    timerFunc()
  }
  // 如果我们在调用nextTick的时候没有传递回调函数，这个方法会返回一个Promise
  // 这就是这个方法的第二种方法
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
