# Prompt Templates

A VS Code / Cursor extension to save and quickly load prompt templates.

## Features

- **Sidebar Panel** — Custom activity bar view listing all saved prompt templates
- **Add Template** — Click the + button to create a new template (name + content)
- **Copy on Click** — Click any template to copy its prompt text to clipboard
- **Edit / Delete** — Right-click a template for edit or delete options
- **Persistent Storage** — Templates are saved in VS Code's globalState (persists across sessions and projects)

## Installation (Development)

1. Open this folder in VS Code / Cursor
2. Press `F5` to launch the Extension Development Host
3. The "Prompt Templates" icon appears in the activity bar (left sidebar)

## Packaging for Production

```bash
npm install -g @vscode/vsce
cd prompt-templates
vsce package
```

Then install the generated `.vsix` file via **Extensions > ... > Install from VSIX**.

## Usage

1. Click the Prompt Templates icon in the activity bar
2. Click **+** to add a new template
3. Click any template to copy it to clipboard
4. Paste into Cursor chat with Ctrl+V / Cmd+V
