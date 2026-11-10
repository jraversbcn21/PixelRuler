// Distance lines between two boxes ({left, top, right, bottom}), Figma style.
// Returns segments {x1, y1, x2, y2, length} in the same coordinates as the input.
function measureGap(a, b) {
  const contains = (o, i) =>
    o.left <= i.left && o.right >= i.right && o.top <= i.top && o.bottom >= i.bottom;
  const mid = (lo, hi) => (lo + hi) / 2;
  const segs = [];
  const add = (x1, y1, x2, y2) => {
    const length = Math.abs(x2 - x1) + Math.abs(y2 - y1);
    if (length > 0) segs.push({ x1, y1, x2, y2, length });
  };

  // Nested: from each inner edge to the matching outer edge
  if (contains(a, b) || contains(b, a)) {
    const [o, i] = contains(a, b) ? [a, b] : [b, a];
    const midX = mid(i.left, i.right);
    const midY = mid(i.top, i.bottom);
    add(midX, o.top, midX, i.top);
    add(i.right, midY, o.right, midY);
    add(midX, i.bottom, midX, o.bottom);
    add(o.left, midY, i.left, midY);
    return segs;
  }

  // Separated: gap between facing edges, drawn through the shared span (or the anchor's middle)
  const overlapTop = Math.max(a.top, b.top);
  const overlapBottom = Math.min(a.bottom, b.bottom);
  const y = overlapTop < overlapBottom ? mid(overlapTop, overlapBottom) : mid(a.top, a.bottom);
  if (a.right <= b.left) add(a.right, y, b.left, y);
  else if (b.right <= a.left) add(b.right, y, a.left, y);

  const overlapLeft = Math.max(a.left, b.left);
  const overlapRight = Math.min(a.right, b.right);
  const x = overlapLeft < overlapRight ? mid(overlapLeft, overlapRight) : mid(a.left, a.right);
  if (a.bottom <= b.top) add(x, a.bottom, x, b.top);
  else if (b.bottom <= a.top) add(x, b.bottom, x, a.top);

  return segs;
}

if (typeof module !== 'undefined') module.exports = { measureGap };
