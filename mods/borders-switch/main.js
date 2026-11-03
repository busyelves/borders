// The sidebar's switch: Workspace (spaces and agents) or Files, one pill sliding under the
// shown one. A two-finger swipe over the sidebar flips them too (swipe.js). While the title bar
// is hidden, an arrow beside the switch brings it back.
// Commands (bind them in keys.json if you like): borders-switch.toggle, .workspace, .files.
import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, theme, layout, nextCommand } from "herdr";
import { swipe } from "./swipe.js";

const STACK = "sidebar-body";
const VIEWS = [["sidebar-lists", "Workspace"], ["sidebar-files", "Files"]];

function find(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children ?? []) { const hit = find(child, id); if (hit) return hit; }
  return null;
}

export default class BordersSwitch extends View {
  init(_props, cx) {
    cx.spawn(async () => {
      for (;;) {
        const c = await nextCommand();
        if (c === "toggle") {
          const active = find(layout(), STACK)?.active ?? VIEWS[0][0], i = VIEWS.findIndex(([id]) => id === active);
          run("layout.select", { stack: STACK, child: VIEWS[(i + 1) % VIEWS.length][0] });
        }
        if (c === "workspace" || c === "files") run("layout.select", { stack: STACK, child: VIEWS[c === "files" ? 1 : 0][0] });
      }
    });
  }

  render() {
    const t = theme(), active = find(layout(), STACK)?.active ?? VIEWS[0][0];
    const barHidden = (find(layout(), "borders-top")?.size?.px ?? 42) <= 1;
    return h_flex().on_scroll_wheel(swipe).size_full().px(4).pt(10).gap(4).items_start().child(
      div().flex_1().h(30).p(3).rounded(8).border(1.5).border_color(t.card_border ?? t.border).bg(t.hover).child(div().relative().size_full()
        .child(h_flex().absolute().top(0).left(0).size_full()
          .child(div().id("switch-gap").h_full().flex_none().w(active === VIEWS[0][0] ? "0%" : "50%").transition("width", { duration: 180, easing: "ease-out" }))
          .child(div().id("switch-pill").h_full().w("50%").flex_none().rounded(6).bg(t.sidebar_card ?? t.background).border(1).border_color(t.card_border ?? t.border).shadow_xs()))
        .child(h_flex().relative().size_full().children(VIEWS.map(([id, label]) => {
          const on = id === active;
          return div().id(`switch-${id}`).flex_1().h_full().flex().items_center().justify_center().rounded(6).text_size(10)
            .text_color(on ? t.foreground : t.muted).when(on, el => el.font_medium())
            .cursor_pointer().hover(s => s.text_color(t.foreground))
            .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
            .on_click(() => run("layout.select", { stack: STACK, child: id }))
            .child(label);
        })))))
      .when(barHidden, el => el.child(div().id("bar-show").size(26).flex_none().flex().items_center().justify_center().rounded(6).text_color(t.dim)
        .hover(s => s.bg(t.hover).text_color(t.foreground)).on_mouse_down("left", (_e, cx) => cx.stop_propagation())
        .on_click(() => run("layout.resize", { id: "borders-top", px: 42 })).child(svg("mods/files/chevron-down.svg").size(15))));
  }
}
