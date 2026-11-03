// A two-finger swipe across the sidebar flips Workspace and Files: fingers left for Files,
// right for Workspace, back and forth with the fingers still down. The Borders sidebar mods put this
// on their root (.on_scroll_wheel(swipe)). The targets are fixed, so momentum carrying on in the
// same direction lands on the view already shown and does nothing.
// Mods cannot import across folders: this file is copied into each mod that uses it.
import { run } from "herdr";

const FAR = 50; // px of sideways travel, and at least twice the vertical
const PAUSE = 200; // ms without an event ends a gesture
let x = 0, y = 0, at = 0;

export function swipe(e) {
  const now = Date.now();
  if (e.touch_phase === "started" || now - at > PAUSE) x = y = 0;
  at = now;
  if (e.delta.x * x < 0) x = y = 0; // turned around: count from here
  x += e.delta.x; y += e.delta.y;
  if (Math.abs(x) < FAR || Math.abs(x) < 2 * Math.abs(y)) return;
  run(x < 0 ? "borders-switch.files" : "borders-switch.workspace");
  x = y = 0;
}
