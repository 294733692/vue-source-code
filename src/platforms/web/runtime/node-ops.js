/**
 * DOM操作函数
 */
import {namespaceMap} from "../util/element";


/**
 * 创建一个新的元素
 */
export function createElement(tagName, vnode) {
  const elm = document.createElement(tagName)
  if (tagName !== 'select') {
    return elm
  }
  // false或者null的时候将移除这个特性，但是undefined的时候不会被移除
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}

export function createElementNS(namespace, tagName) {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

export function createTextNode(text) {
  return document.createTextNode(text)
}

export function createComment(text) {
  return document.createComment(text)
}

export function insertBefore(parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode)
}

export function removeChild(node, child) {
  node.removeChild(child)
}

export function appendChild(node, child) {
  node.appendChild(child)
}

export function parentNode(node) {
  return node.parentNode
}

export function nextSibling(node) {
  return node.nextSibling
}

export function tagName(node) {
  return node.tagName
}

export function setTextContent(node, text) {
  node.textContent = text
}

export function setStyleScope(node, scopeId) {
  node.setAttribute(scopeId, '')
}
