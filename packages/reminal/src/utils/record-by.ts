export function recordBy<T extends object, K extends keyof T>(
  arr: T[],
  getKey: (item: T) => T[K]
): Record<T[K], T> {
  return arr.reduce((acc, item) => {
    acc[getKey(item)] = item
    return acc
  }, {} as Record<T[K], T>)
}
