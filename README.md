# Borders

A calm, card-based layout for the [Herdr](https://herdr.dev) desktop app: an 8px grid, outlined
cards in the sidebar, a tab track with a raised pill in the title bar, a Workspace | Files switch
and pane headers that can carry a role colour. Three themes: light, dark, and Parchment (grey bars,
cream panes, a gold accent).

![Borders](preview.png)

## Install

Ask your Herdr agent to add `herdr.dev/layouts/busyelves/borders`, or copy by hand into your Herdr
home (`~/.config/herdr-app`):

- `layouts/borders.json` → `layouts/`
- `themes/borders-*.json` → `themes/`
- `mods/borders-*` → `mods/`

Then pick **Borders** in Settings › Layout (or run `layout.switch borders`). Your own layout stays
as it was; delete the files to remove Borders. For the Parchment look, pick **borders-parchment**
in Settings › Theme.

Nothing reaches the network. `borders-spaces` and `borders-files` are restyled copies of Herdr's
own Spaces and Files blocks, and run what those do: `git` for branches and changes, `hc` for other
machines, and `sh` to list a folder. The other mods only draw and run Herdr commands.

## Role colours

Label a terminal with a role and its pane header shows a badge and a tint:

```sh
hc label <terminal> role=lead     # also: orch, advisor, successor; any other word shows grey
```

## Files

[`RECIPE.md`](RECIPE.md) is the brief to build Borders from scratch; the files are one build of it.

## Licence

MIT, see [`LICENSE`](LICENSE). The Parchment theme's colours come from the Obsidian theme
[Kabadoni](https://github.com/nickberckley/kabadoni) by Nika Kutsniashvili (MIT); its notice is in
`LICENSE`.
