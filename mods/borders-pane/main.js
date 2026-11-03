// A pane's header, for layouts that frame their panes:
//   { "tab": "active", "pane": { "header": { "content": { "mod": "borders-pane" } } } }
// Shows an optional role badge, the program's icon, the agent's name or the terminal's title,
// the folder's last part on the right, and the agent's status; on hover, buttons split, zoom and
// close this pane. Click: focus the pane. Props from the app: { pane, terminal }.
//
// Roles: give a terminal the label role=<name> (`hc label <terminal> role=lead`). The header shows
// the name as a badge and takes its colour as a tint, deeper when focused. lead, orch, advisor
// and successor have colours in the Borders themes (role_lead, ...); any other name is grey.

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, theme, home, terminals } from "herdr";

function icon(p, size, color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

function folder(cwd) {
  if (!cwd) return "";
  return cwd === home() ? "~" : cwd.replace(/\/$/, "").split("/").pop();
}

const ROLES = { lead: "role_lead", orch: "role_orch", advisor: "role_advisor", successor: "role_successor" };

export default class BordersPane extends View {
  init() { this.hovered = false; }

  me() {
    return panes().find((p) => p.pane === props()?.pane);
  }

  button(t, id, name, command, args) {
    return div().id(id).p(3).rounded(4).text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); run(command, args); })
      .child(svg(`mods/borders-pane/${name}.svg`).size(14));
  }

  render() {
    const t = theme();
    const p = this.me();
    if (!p) return div();
    const labels = (p.terminal && terminals().find((x) => x.address === p.terminal)?.labels) || {};
    // An agent shows its session's name (the terminal title it sets); anything else, its program.
    const agentTitle = p.program?.agent && p.title && p.title !== p.program.name ? p.title : "";
    const name = agentTitle || ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const role = (labels.role ?? "").trim().toLowerCase();
    const tone = role ? t[ROLES[role]] ?? t.dim : null;
    const pic = icon(p.program, 16, t.dim);
    const st = p.status, pane = p.pane;
    return h_flex()
      .id(`pane-head-${pane}`)
      .size_full()
      .px(10)
      .gap(8)
      .items_center()
      .bg(tone ? tone + (p.focused ? "24" : "14") : t.background)
      // Round with the pane: its 10px corner less the 1.5px border, else the header's square corners poke past the curve.
      .rounded_t(8.5)
      .border_b(1)
      .border_color(t.border)
      .text_size(10.5)
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane }))
      .when(Boolean(role), el => el.child(div().flex_none().px(7).h(19).flex().items_center().rounded(5)
        .bg(tone).text_size(9.5).font_bold().text_color("#FFFFFF").child(role.toUpperCase())))
      .when(Boolean(pic), (el) => el.child(pic))
      .child(div().flex_none().truncate().max_w(320).text_size(12.5).font_semibold().text_color(p.focused ? t.foreground : t.muted).child(name))
      .child(div().flex_1())
      .child(div().flex_none().truncate().max_w(240).text_color(t.dim).child(folder(p.cwd)))
      .when(st === "working", el => el.child(/* a still dot, not a spinner: a turning glyph redraws the window every frame */ div().size(8).rounded(4).flex_none().mx(2).bg(t.working)))
      .when(st === "blocked", el => el.child(div().flex_none().px(6).h(18).flex().items_center().rounded(5).bg(t.blocked + "26").text_size(9.5).font_semibold().text_color(t.blocked).child("Needs you")))
      .when(st === "done", el => el.child(div().size(7).flex_none().rounded(4).bg(t.done)))
      .when(this.hovered, el => el
        .child(this.button(t, `ph-r-${pane}`, "split-right", "pane.split", { direction: "right", pane }))
        .child(this.button(t, `ph-d-${pane}`, "split-down", "pane.split", { direction: "down", pane }))
        .child(this.button(t, `ph-z-${pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom", { pane }))
        .child(this.button(t, `ph-x-${pane}`, "close", "pane.close", { pane })));
  }
}
