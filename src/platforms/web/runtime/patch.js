import * as nodeOps from './node-ops'
import {createPatchFunction} from "../../../core/vdom/patch";
import baseModules from '../../../core/vdom/modules/index'
import platformModules from '../../web/runtime/modules/index'


// 指令模块应在最后应用
// 毕竟内置模板已经被应用
const modules = platformModules.concat(baseModules)

// 采用函数柯里化的方法
export const patch = createPatchFunction({nodeOps, modules})
