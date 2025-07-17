# YAML Panel

![Thumbnail](https://raw.githubusercontent.com/jaewonE/obsidian-yaml-panel/refs/heads/master/assets/sample.png)

A streamlined Obsidian plugin that displays the YAML frontmatter of your active file in a dedicated panel. The panel automatically hides property names when space is limited and lets you assign custom SVG icons for specific keys.

## Features

-   Shows YAML properties in a separate panel for quick reference.
-   Automatically hides property names below a user-defined width threshold.
-   Supports custom property icons via SVG snippets.
-   Settings tab for adjusting threshold and icon assignments.

## Installation

1. Download the latest release from the [releases page](https://github.com/jaewonE/obsidian-yaml-panel/releases).
2. Extract the contents to `<vault>/.obsidian/plugins/yaml-panel`.
3. Enable **YAML Panel** in Obsidian’s community plugins settings.

## Building from Source

Requires Node.js 16 or higher.

```bash
npm i
npm run dev        # compile in watch mode
npm run build      # production build
```

## Settings

-   **Name hiding threshold** – width in pixels before property names are hidden.
-   **Custom property icons** – specify property names and SVG code to display instead of the default icon.

Sample icons are provided in the `icon-samples` folder.

## License

This project is licensed under the GNU General Public License v3.0.
