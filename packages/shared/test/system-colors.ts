export function systemColor(keyword: string): string {
  const probe = document.createElement('span')
  probe.style.color = keyword
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}
