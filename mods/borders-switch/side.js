// Bars and the sidebar sit on chrome and canvas. A theme with chrome_* colours (Parchment: grey bars,
// cream cards) gives them their own text and states; a theme without them is used as it is.
// Popups a bar mod opens sit on the popover, so they keep the theme's own colours.
// Mods cannot import across folders: this file is copied into each mod that uses it.
import { props } from "herdr";

const KEYS = ["foreground", "muted", "dim", "hover", "raised", "selected", "border", "input"];

export function side(t) {
  if (!t.chrome_foreground || props()?.overlay) return t;
  const o = { ...t };
  for (const k of KEYS) if (t[`chrome_${k}`]) o[k] = t[`chrome_${k}`];
  return o;
}
