export function nextGalleryIndex(current: number, delta: -1 | 1, total: number) {
  const next = current + delta;
  return next < 0 || next >= total ? current : next;
}
