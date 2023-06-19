export function oneOf<T>(...args: T[]): T {
  return args[Math.floor(Math.random() * args.length)]
}
