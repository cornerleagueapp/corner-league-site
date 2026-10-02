export function hasMoreBelow(
  content: number,
  viewport: number,
  offset: number,
) {
  return viewport > 0 && content > viewport + offset + 2;
}
