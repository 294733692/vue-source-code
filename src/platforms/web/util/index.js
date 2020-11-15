/**
 * @author yuyunchao
 * @date 2020/11/06 13:24:40
 * @desc 查找对应的element元素
 */
export function query (el) {
  // 如果传入的el是字符串，查找对应的DOM
  if (typeof el === 'string') { // 如果是字符串，通过元素方法，查找对应element元素
    const selected = document.querySelector(el)
    if (!selected) { // 如果没找到对应的element元素，抛出异常，并返回一个空的div
      console.error('Cannot find element:' + el)
      return document.createElement('div')
    }
    return selected
  } else { // 如果不是string，说明用户传入的是element元素，直接返回
    return el
  }
}

