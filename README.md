# Prompt Templates

A VS Code / Cursor extension to save and quickly load prompt templates.

## Features

- **Sidebar Panel** — Custom activity bar view listing all saved prompt templates
- **Click to Load** — Click any template to load it directly into Cursor chat
- **Add Template** — Click the + button to create a new template with a rich editor
- **Edit** — Click the pencil icon on any template to open it in a webview editor
- **Delete** — Click the trash icon or right-click to delete a template
- **Persistent Storage** — Templates are saved in VS Code's globalState (persists across sessions and projects)

## Installation

### Option 1: Install from VSIX file

1. Package the extension:
   ```bash
   cd prompt-templates
   npx @vscode/vsce package
   ```
2. In Cursor/VS Code, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type **"Install from VSIX"** and select it
4. Browse to the generated `.vsix` file and install
5. Reload the window (`Ctrl+Shift+P` → **"Developer: Reload Window"**)

### Option 2: Development mode (F5)

1. Open the `prompt-templates` folder as a workspace in VS Code / Cursor:
   ```bash
   cursor prompt-templates/
   ```
2. Press `F5` to launch the Extension Development Host
3. The extension will be active in the new window

### Option 3: Launch from parent project

If the extension lives inside a larger project (e.g. `safeq/prompt-templates/`):

1. Add this to your `.vscode/launch.json` in the parent project:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Run Prompt Templates",
         "type": "extensionHost",
         "request": "launch",
         "args": ["--extensionDevelopmentPath=${workspaceFolder}/prompt-templates"]
       }
     ]
   }
   ```
2. Press `F5` — it launches an Extension Development Host with the extension loaded

## Usage

1. Click the **Prompt Templates** icon in the activity bar (left sidebar)
2. Click **+** to add a new template — a rich editor opens for name and content
3. **Click** any template to load it directly into Cursor chat
4. **Pencil icon** — edit template name and content in the webview editor
5. **Trash icon** — delete the template (with confirmation)
