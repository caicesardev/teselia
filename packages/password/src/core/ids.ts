let instanceCount = 0

export function nextInstanceId(prefix: string): string {
  instanceCount += 1
  return `${prefix}-${instanceCount}`
}
