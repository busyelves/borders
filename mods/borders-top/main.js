// The Borders title bar: the shown space's tabs in one track with a raised pill under the
// active tab, then + (new menu) and ^ (hides the bar). The empty left part drags the window.
// Tabs: click selects, drag onto another tab moves it there, double-click renames, right-click
// opens the tab menu, the wheel over the track steps through tabs.
// The side panel (Files or Changes, right of the panes) is remembered per space.
import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, theme, spaces, panes, openOverlay, layout, window, settings, shared } from "herdr";
import { side } from "./side.js";

function find(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children ?? []) { const hit = find(child, id); if (hit) return hit; }
  return null;
}

export default class BordersTop extends View {
  init() {
    this.pressed = null;
    try { this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}"); } catch { this.panels = {}; }
  }

  // Switching spaces shows that space's panel choice (closed if it never had one);
  // opening or closing the panel records it.
  syncPanel(space, panel, body, enabled) {
    if (!space || !panel) return;
    const now = panel.hidden ? null : body?.active ?? null;
    if (space.id !== this.space) {
      const first = this.space === undefined;
      this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = this.panels[space.id] ?? null, want = enabled.includes(stored) ? stored : null;
        if (want !== now) {
          this.pending = { want, until: Date.now() + 1000 };
          if (want) { run("layout.select", { stack: "panel-body", child: want }); run("layout.show", { id: "panel" }); }
          else run("layout.hide", { id: "panel" });
          return;
        }
      }
    }
    // Until the restore lands (or something else won), the old state isn't a choice.
    if (this.pending) {
      if (this.pending.want !== now && Date.now() < this.pending.until) return;
      this.pending = null;
    }
    if (this.panels[space.id] === now) return;
    this.panels[space.id] = now;
    try { localStorage.setItem("panels", JSON.stringify(this.panels)); } catch {}
  }

  render() {
    const t = side(theme()), root = layout();
    // Hidden: the bar stays one drawn pixel (layout.hide or 0 would stop its live data).
    if ((find(root, "borders-top")?.size?.px ?? 42) <= 1) return div().size_full();
    const space = spaces().find(s => s.active), tabs = space?.tabs ?? [];
    this.syncPanel(space, find(root, "panel"), find(root, "panel-body"), shared("workspace.panels") ?? ["files", "changes"]);
    const stop = (_e, cx) => cx.stop_propagation();

    const tabItem = (c, i) => {
      const program = panes().find(p => p.tab === c.id && p.program?.agent)?.program ?? panes().find(p => p.tab === c.id)?.program;
      const name = /^tb\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      const on = c.active;
      return h_flex().id(`tab-${c.id}`).h_full().px(10).gap(7).rounded(6).items_center().flex_none().text_size(10)
        .border(1).border_color(on ? t.card_border ?? t.border : "#00000000").when(on, el => el.bg(t.sidebar_card ?? t.background).shadow_xs().font_medium()).text_color(on ? t.foreground : t.muted)
        .hover(s => s.text_color(t.foreground))
        .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) run("tab.rename", { id: c.id }); })
        .on_mouse_up("left", () => {
          const from = this.pressed; this.pressed = null;
          if (from !== null && from !== i) run("tab.move", { id: tabs[from].id, index: i + 1 });
          else run("tab.select", { id: c.id });
        })
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
        .when(Boolean(program?.icon), el => el.child(program.tint ? svg(program.icon).size(14).text_color(t.muted) : image(program.icon).size(14)))
        .child(div().max_w(170).truncate().child(c.zoomed ? `${name} Z` : name))
        .when(c.status === "working", el => el.child(/* a still dot, not a spinner: a turning glyph redraws the window every frame */ div().size(8).rounded(4).flex_none().mx(2).bg(t.working)))
        .when(c.status === "blocked" || c.status === "done", el => el.child(div().size(6).rounded(3).bg(t[c.status])))
        .when(c.active, el => el.child(div().id(`close-${c.id}`).text_color(t.dim).hover(s => s.text_color(t.foreground)).on_mouse_down("left", stop)
          .on_click((_e, cx) => { cx.stop_propagation(); run("tab.close", { id: c.id }); }).child(svg("mods/borders-top/close.svg").size(12))));
    };

    // With the sidebar hidden this row sits under the window buttons: leave them room.
    const sidebar = find(root, "sidebar"), w = window();
    const lights = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights
      ? Math.max(0, (root.traffic_lights[0] + 64) / settings().zoom - (sidebar?.hidden ? 0 : sidebar?.size?.px ?? 0))
      : 0;
    const button = (id, child, action) => div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6).text_color(t.dim)
      .hover(s => s.bg(t.hover).text_color(t.foreground)).on_mouse_down("left", stop).on_click(action).child(child);

    return h_flex().size_full().min_w(0).pl(lights).pt(2).pb(10).gap(4).items_center()
      .on_mouse_up("left", () => { this.pressed = null; })
      .child(div().flex_1().min_w(0))
      // Sized to its tabs, so it sits against the +; at most the row less its buttons, cut off beyond that.
      .child(h_flex().id("tab-scroll").flex_none().max_w("85%").h_full().items_center().overflow_hidden()
        .on_scroll_wheel(e => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
        .child(h_flex().flex_none().h_full().p(3).gap(2).items_center().rounded(8).border(1.5).border_color(t.card_border ?? t.border).bg(t.hover)
          .children(tabs.map(tabItem))))
      .child(button("tab-new", "+", () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })))
      .child(button("bar-hide", svg("mods/borders-top/chevron-up.svg").size(15), () => run("layout.resize", { id: "borders-top", px: 1 })));
  }
}
