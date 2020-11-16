/**
 * 缓存策略，加快数据读取速度
 * @param fn
 * @return {function(*=): *}
 */
export function cached(fn) {
  const cache = Object.create(null)
  return (function cachedFn(str) {
    const hit = cache(str)
    return hit || (cache[str] = fn(str))
  })
}
