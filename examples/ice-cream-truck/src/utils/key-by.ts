export function keyBy<T extends object, K extends keyof T>(
  arr: T[],
  key: K
): Record<T[K], T> {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item
    return acc
  }, {} as Record<T[K], T>)
}
