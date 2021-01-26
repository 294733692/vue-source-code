import {
  camelize,
  capitalize, extend,
  hasOwn,
  isBuiltInTag,
  isPlainObject,
  toRawType
} from "../../shared/util"
import config from '../config'
import {unicodeRegExp} from "./lang"
import {LIFECYCLE_HOOKS} from "../../shared/constants"


/**
 * 选项覆盖策略是处理的功能
 * 如果将复选项和子选项合并到最终值中
 */
const strats = config.optionMergeStrategies

/**
 * 解决asset
 * 使用此功能是因为子实例需要访问其祖先链定义的资源
 */
export function resolveAsset(
  options,
  type,
  id,
  warnMissing
) {
  if (typeof id !== 'string') {
    return
  }

  const assets = options[type]
  // 首先检查本地注册变化
  // 如果Id存在，直接使用id拿
  if (hasOwn(assets, id)) return assets[id]
  // 如果id不存在，把id变为驼峰形式在拿
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  // 在驼峰的形式上，将首字母大写在拿
  // ==== 这也解释了全局注册组件的时候，id可以是连字符、驼峰或首字母大写 =======
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // 退回原型链去查找
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    console.error(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}

/**
 * 规范props，处理用户参数的props参数
 * 确保将所有props选项语法标准化为基于对象的格式
 * @param options
 * @param vm
 */
function normalizeProps(options, vm) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) { // 如果是数组
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        // 将-拼接的转化成小驼峰，例如: base_url => baseUrl
        name = camelize(val)
        res[name] = {type: null} // 转入数组，props的val没有类型，默认添加一个type类型
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn('props must be strings when useing array syntax')
      }
    }
  } else if (isPlainObject(props)) { // 如果是对象
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val) ? val : {type: val}
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'Invalid value for option "props": expected an Array or an Object, ' +
      `but got ${toRawType(props)}`
    )
  }
  options.props = res
}

/*
 * 规范子组件注入参数规范化，基于对象格式规范化
 */
function normalizeInject(options, vm) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) { // 如果是数组
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = {from: inject[i]}
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(key)
        ? extend({from: key}, val)
        : {from: val}
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`
    )
  }
}

/**
 * 规范自定义指令，基于对象格式规范
 */
function normalizeDirectives(options) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = {bind: def, update: def}
      }
    }
  }
}

/**
 * 校验组件
 */
function checkComponents(options) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

/**
 * 校验组件名称
 */
export function validateComponentName(name) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    console.warn(
      'Invalid component name: "' + name + '". Component names' +
      'should conform to vaild custom element name in html5 specification'
    )
  }

  // 如果是内置标签 或者是保留标签
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    console.warn(
      'Do not use build-in or reserved HTML elements as component ' +
      'id:' + name
    )
  }
}


/**
 * 将两个选项对象合并到一个新的对象中，
 * 在实例化和继承中都使用的核心使用程序
 * @param parent 父级
 * @param child 子级
 * @param vm vm实例
 */
export function mergeOptions(
  parent,
  child,
  vm
) {
  if (process.env.NODE_ENV !== 'production') {
    // 检查注册的标签是否是保留或者是原生标签
    checkComponents(child)
  }

  if (typeof child === 'function') {
    child = child.options
  }

  normalizeProps(child, vm) // 规范用户传入的props参数
  normalizeInject(child, vm) // 规范子组件注入inject参数
  normalizeDirectives(child) // 规范自定义指定

  // 在子选项上应用扩展和混合
  // 单仅当它是原始选项对象而不是另一个mergeOptions调用的结果时。
  // 仅合并的选项具有_base属性
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.entends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }

  /**
   * 合并策略，对于不同的key有不同的合并策略
   */
  function mergeField(key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }

  return options
}


function mergeHook(
  parentVal,
  childVal
) {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res ? dedupeHooks(res) : res
}

/**
 * 删除重复挂钩数据
 */
function dedupeHooks(hooks) {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    res.push(hooks[i])
  }
  return res
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})
