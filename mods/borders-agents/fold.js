// Folding a sidebar section to its header: the arrow beside its name shrinks the block to the
// header's height (layout.resize) and keeps the size it had in shared "borders.folds" to restore.
// Folded is read from the layout (no taller than the header), so a dragged divider can unfold it.
import { run, layout, shared, setShared } from "herdr";
import { svg } from "gpui-kit";

function find(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children ?? []) { const hit = find(child, id); if (hit) return hit; }
  return null;
}

// A folded block is its header plus its box's border (1.5 px above and below, as the layout draws it).
const EDGE = 3;

export function folded(id, head) {
  const px = find(layout(), id)?.size?.px;
  return px !== undefined && px <= head + EDGE + 1;
}

export function toggle(id, head) {
  const node = find(layout(), id);
  if (!node) return;
  const kept = shared("borders.folds") ?? {};
  if (folded(id, head)) run("layout.resize", { id, ...(kept[id] ?? { weight: 1 }) });
  else { setShared("borders.folds", { ...kept, [id]: node.size }); run("layout.resize", { id, px: head + EDGE }); }
}

export function chevron(t, id, head) {
  return svg(`mods/workspace-chrome/chevron-${folded(id, head) ? "right" : "down"}.svg`).size(11).flex_none().text_color(t.dim);
}
