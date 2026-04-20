![Reader Highlighter Tags Art](https://github.com/user-attachments/assets/3d9d5720-d308-4af5-b277-faab84745f62)

# Reader Highlighter Tags

A powerful Obsidian plugin that brings a **Medium-like highlighting experience** directly to **Reading View**.

Designed for power users who read long-form content in Obsidian, this plugin allows you to highlight, tag, annotate, and organize your notes without ever switching to Edit mode. It is "smart" about your content—understanding lists, indentation, and identical text occurrences to ensure your markdown remains clean and valid.

<div align="center">
  <video src="https://github.com/user-attachments/assets/dff37003-3d0d-4b25-9348-c9141bfe0029" controls="controls"></video>
</div>

---

## Core Features

### High-Precision Selection Engine
The plugin utilizes a custom "Noise Shield" structural filtering engine. This system strips non-visible Markdown syntax—including footnotes, task checkboxes, callout headers, and internal HTML tags—from the virtual content before matching. This ensures that text selected in the browser precisely correlates with the physical coordinates in the source file.

- **Coordinate Mapping**: Handles complex document transformations, including transclusions and embedded files, to accurately inject markers into the underlying Markdown.
- **Literal Character Support**: Sophisticated regex gap patterns preserve literal characters like brackets, asterisks, and dollar signs, ensuring that technical notes (math formulas, regex strings) are highlighted with 100% accuracy.
- **Anchor Matching**: Large multi-paragraph selections are located using a dual-anchor strategy (start and end chunks), providing resilience against structural anomalies in long blocks.

### Smart Content Handling
- **Callout Blocks**: Automatically recognizes Obsidian callout prefixes (e.g., `> [!INFO]`). Highlights are applied to the inner content without corrupting the callout syntax.
- **Native HTML Blocks**: Capable of matching text within raw HTML `div` or `span` tags by stripping structural tags from the search buffer.
- **Smart Expansion**: Selection boundaries automatically expand to whole words or detect existing markers to prevent fragmented formatting.

### Tagging and Metadata
- **Frontmatter Integration**: Optionally applies highlight tags directly to the note's YAML frontmatter. Existing tags are checked to prevent duplicates.
- **Contextual Suggestions**: Fuzzy-search tagging modal suggests tags based on recent usage, folder names, and existing file metadata.
- **Auto-Tagging**: Customizable default prefixes can be applied to every highlight automatically.

### Workflow Tools
- **Highlight Navigator**: A dedicated sidebar view provides an overview of all highlights in the active document. Clicking a highlight scrolls the view to its exact context.
- **Erase Highlight**: A "sweep-and-clean" utility that removes highlighting markers from the selected range, even if the selection spans multiple paragraphs or non-highlighted gaps.
- **Footnote Annotations**: Captures comments as standard Markdown footnotes appended to the bottom of the document.
- **Quote Templates**: Customizable templates for copying text as formatted blockquotes with metadata variables (date, file path, original context).

### UI and Performance
- **Floating Toolbar**: A glassmorphism-inspired toolbar that appears at the point of selection or at fixed screen positions (top, bottom, left, right).
- **Mobile Optimization**: includes haptic feedback, keyboard-aware modals, and long-press shortcuts for mobile reading efficiency.
- **Performance**: Optimized for large documents with a safe regex execution model to prevent browser freezes.

## Settings

### Highlighting
- **Color Highlighting**: Toggle between standard Obsidian `==` syntax and HTML `<mark>` tags for persistent, theme-independent colors.
- **Color Palette**: Define five quick-access colors, each with its own optional automatic tag.

### Toolbar
- **Custom Positioning**: Set the toolbar to follow text or remain anchored to screen edges.
- **Toggle Buttons**: Enable or disable specific actions (Tag, Quote, Erase, Annotate) based on your personal workflow.

### Integration
- **Reading Progress**: Automatically tracks and restores the scroll position for every note in your vault.
- **Hotkeys**: Comprehensive command registration for all core actions, including specific color application and navigator toggling.

## Installation

### Manual Installation
1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`) from the GitHub releases page.
2. Create a folder named `reader-highlighter-tags` in your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.

