# koodalanne — Terminal themes

The **Neon Precision** ANSI palette, matched to the design tokens. Same colors as
the VS Code theme and the design system, so your editor, terminal and website
feel like one world.

## ANSI palette

| Slot | Normal | Bright | Token |
| --- | --- | --- | --- |
| Background | `#111218` | — | `--kd-ink-800` |
| Foreground | `#ececee` | — | `--kd-grey-100` |
| Cursor | `#f890e7` | — | `--kd-pink-300` |
| Black | `#0c0d12` | `#2a2d3a` | ink-900 / ink-500 |
| Red | `#ff5470` | `#ff8095` | signal-danger |
| Green | `#33e59b` | `#5ff0b3` | signal-success |
| Yellow | `#ffcf6a` | `#ffdd8f` | signal-warning / sunset-3 |
| Blue | `#7a5cff` | `#9b83ff` | violet |
| Magenta | `#f890e7` | `#faaeef` | pink-300 / pink-200 |
| Cyan | `#0bd3d3` | `#5ee6e6` | cyan-300 / cyan-200 |
| White | `#cfcfd6` | `#ffffff` | grey-200 / white |

## Install

- **iTerm2** — Settings → Profiles → Colors → *Color Presets…* → Import →
  `koodalanne.itermcolors`, then select it.
- **Windows Terminal** — copy the object in `windows-terminal.json` into the
  `"schemes"` array of `settings.json`, then set `"colorScheme": "koodalanne — Neon Precision"`.
- **Alacritty** — merge `alacritty.toml` into `~/.config/alacritty/alacritty.toml`.
- **VS Code integrated terminal** — already covered by the
  [VS Code theme](../vscode-theme/).
