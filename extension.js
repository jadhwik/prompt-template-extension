const vscode = require('vscode');

const STORAGE_KEY = 'promptTemplates';

// ── Tree Data Provider ──────────────────────────────────────────────

class PromptTemplatesProvider {
  constructor(context) {
    this._context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTemplates() {
    return this._context.globalState.get(STORAGE_KEY, []);
  }

  async saveTemplates(templates) {
    await this._context.globalState.update(STORAGE_KEY, templates);
    this.refresh();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const templates = this.getTemplates();

    if (templates.length === 0) {
      const emptyItem = new vscode.TreeItem(
        'No templates yet. Click + to add one.'
      );
      emptyItem.contextValue = 'empty';
      return [emptyItem];
    }

    return templates.map((t) => {
      const item = new vscode.TreeItem(t.name);
      item.tooltip = t.content;
      item.description =
        t.content.length > 50
          ? t.content.substring(0, 50) + '...'
          : t.content;
      item.iconPath = new vscode.ThemeIcon('file-text');
      item.contextValue = 'template';
      // Click = load directly into chat
      item.command = {
        command: 'prompt-templates.loadToChat',
        title: 'Load to Chat',
        arguments: [t],
      };
      return item;
    });
  }
}

// ── Webview HTML (edit mode only) ──────────────────────────────────

function getEditorHtml(template) {
  const data = JSON.stringify(template).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--vscode-font-family);
    padding: 28px 32px;
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    max-width: 840px;
    margin: 0 auto;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }
  .header-title {
    font-size: 20px;
    font-weight: 600;
  }
  .badge {
    font-size: 11px;
    padding: 3px 12px;
    border-radius: 12px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    font-weight: 500;
  }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 6px;
    margin-top: 18px;
  }
  .name-input {
    width: 100%;
    padding: 9px 14px;
    font-size: 14px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 6px;
    outline: none;
  }
  .name-input:focus { border-color: var(--vscode-focusBorder); }
  .prompt-editor {
    width: 100%;
    min-height: 300px;
    padding: 16px;
    font-family: var(--vscode-editor-font-family);
    font-size: 14px;
    line-height: 1.7;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 6px;
    resize: vertical;
    outline: none;
    tab-size: 2;
  }
  .prompt-editor:focus { border-color: var(--vscode-focusBorder); }
  .char-count {
    text-align: right;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    margin-top: 4px;
  }
  .actions {
    display: flex;
    gap: 10px;
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid var(--vscode-panel-border);
  }
  .btn {
    padding: 8px 20px;
    border-radius: 5px;
    font-size: 13px;
    cursor: pointer;
    border: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.85; }
  .btn:active { opacity: 0.7; }
  .btn-primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  .btn-danger {
    background: transparent;
    color: var(--vscode-errorForeground);
    border: 1px solid var(--vscode-errorForeground);
    margin-left: auto;
  }
  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 18px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-radius: 6px;
    font-size: 13px;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .toast.show { opacity: 1; }
</style>
</head>
<body>
  <div class="header">
    <span class="header-title" id="display-name"></span>
    <span class="badge">Edit Template</span>
  </div>

  <div class="section-label">Template Name</div>
  <input class="name-input" id="name-input" type="text" placeholder="e.g. Code Review, Bug Fix, Refactor..." />

  <div class="section-label">Prompt Content</div>
  <textarea class="prompt-editor" id="content-editor" placeholder="Write your prompt template here..." spellcheck="false"></textarea>
  <div class="char-count" id="char-count">0 characters</div>

  <div class="actions">
    <button class="btn btn-primary" onclick="saveChanges()">Save Changes</button>
    <button class="btn btn-danger" onclick="deleteTemplate()">Delete</button>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const vscode = acquireVsCodeApi();
    const template = ${data};

    const nameInput = document.getElementById('name-input');
    const contentEditor = document.getElementById('content-editor');
    const charCount = document.getElementById('char-count');
    const displayName = document.getElementById('display-name');

    nameInput.value = template.name || '';
    contentEditor.value = template.content || '';
    displayName.textContent = template.name || 'New Template';
    updateCharCount();

    if (template.name) {
      contentEditor.focus();
    } else {
      nameInput.focus();
    }

    contentEditor.addEventListener('input', updateCharCount);
    function updateCharCount() {
      charCount.textContent = contentEditor.value.length + ' characters';
    }

    nameInput.addEventListener('input', function() {
      displayName.textContent = nameInput.value || 'Untitled';
    });

    contentEditor.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
        updateCharCount();
      }
    });

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }

    function saveChanges() {
      const name = nameInput.value.trim();
      const content = contentEditor.value.trim();
      if (!name) { showToast('Name is required'); nameInput.focus(); return; }
      if (!content) { showToast('Content is required'); contentEditor.focus(); return; }
      vscode.postMessage({ command: 'save', id: template.id, name, content });
      displayName.textContent = name;
      showToast('Saved!');
    }

    function deleteTemplate() {
      vscode.postMessage({ command: 'delete', id: template.id });
    }
  </script>
</body>
</html>`;
}

// ── Extension Activation ───────────────────────────────────────────

function activate(context) {
  const provider = new PromptTemplatesProvider(context);
  const openPanels = new Map();

  vscode.window.registerTreeDataProvider('promptTemplatesList', provider);

  // ── CLICK template → load directly into Cursor chat ──
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'prompt-templates.loadToChat',
      async (template) => {
        if (!template || !template.content) return;

        await vscode.env.clipboard.writeText(template.content);

        try {
          await vscode.commands.executeCommand('workbench.action.chat.open');
          await new Promise((r) => setTimeout(r, 400));
          await vscode.commands.executeCommand(
            'editor.action.clipboardPasteAction'
          );
          vscode.window.showInformationMessage('Prompt loaded in chat!');
        } catch {
          vscode.window.showInformationMessage(
            `Prompt copied! Paste with ${process.platform === 'darwin' ? 'Cmd' : 'Ctrl'}+V`
          );
        }
      }
    )
  );

  // ── ADD template → open empty webview editor ──
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'prompt-templates.addTemplate',
      () => {
        const newId = Date.now().toString();
        const template = { id: newId, name: '', content: '' };

        const panel = vscode.window.createWebviewPanel(
          'promptTemplateEditor',
          'New Template',
          vscode.ViewColumn.One,
          { enableScripts: true, retainContextWhenHidden: true }
        );

        panel.webview.html = getEditorHtml(template);
        openPanels.set(newId, panel);
        panel.onDidDispose(() => openPanels.delete(newId));

        panel.webview.onDidReceiveMessage(async (message) => {
          if (message.command === 'save') {
            const templates = provider.getTemplates();
            const existing = templates.find((t) => t.id === message.id);
            if (existing) {
              existing.name = message.name;
              existing.content = message.content;
            } else {
              templates.push({
                id: message.id,
                name: message.name,
                content: message.content,
              });
            }
            await provider.saveTemplates(templates);
            panel.title = message.name;
            vscode.window.showInformationMessage(
              `Template "${message.name}" saved.`
            );
          } else if (message.command === 'delete') {
            const pick = await vscode.window.showQuickPick(['Yes', 'No'], {
              placeHolder: 'Delete this template?',
            });
            if (pick === 'Yes') {
              const templates = provider.getTemplates();
              await provider.saveTemplates(
                templates.filter((t) => t.id !== message.id)
              );
              panel.dispose();
              vscode.window.showInformationMessage('Template deleted.');
            }
          }
        });
      }
    )
  );

  // ── EDIT template (pencil icon) → open webview editor ──
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'prompt-templates.editTemplate',
      (treeItem) => {
        const templates = provider.getTemplates();
        const template = templates.find((t) => t.name === treeItem.label);
        if (!template) return;

        // Reuse panel if already open
        if (openPanels.has(template.id)) {
          openPanels.get(template.id).reveal();
          return;
        }

        const panel = vscode.window.createWebviewPanel(
          'promptTemplateEditor',
          `Edit: ${template.name}`,
          vscode.ViewColumn.One,
          { enableScripts: true, retainContextWhenHidden: true }
        );

        panel.webview.html = getEditorHtml(template);
        openPanels.set(template.id, panel);
        panel.onDidDispose(() => openPanels.delete(template.id));

        panel.webview.onDidReceiveMessage(async (message) => {
          if (message.command === 'save') {
            const templates = provider.getTemplates();
            const t = templates.find((x) => x.id === message.id);
            if (t) {
              t.name = message.name;
              t.content = message.content;
              await provider.saveTemplates(templates);
              panel.title = `Edit: ${message.name}`;
              vscode.window.showInformationMessage(
                `Template "${message.name}" saved.`
              );
            }
          } else if (message.command === 'delete') {
            const pick = await vscode.window.showQuickPick(['Yes', 'No'], {
              placeHolder: `Delete "${template.name}"?`,
            });
            if (pick === 'Yes') {
              const templates = provider.getTemplates();
              await provider.saveTemplates(
                templates.filter((t) => t.id !== message.id)
              );
              panel.dispose();
              vscode.window.showInformationMessage('Template deleted.');
            }
          }
        });
      }
    )
  );

  // ── DELETE template (trash icon) → confirm and remove ──
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'prompt-templates.deleteTemplate',
      async (treeItem) => {
        const pick = await vscode.window.showQuickPick(['Yes', 'No'], {
          placeHolder: `Delete template "${treeItem.label}"?`,
        });
        if (pick !== 'Yes') return;

        const templates = provider.getTemplates();
        const template = templates.find((t) => t.name === treeItem.label);
        await provider.saveTemplates(
          templates.filter((t) => t.name !== treeItem.label)
        );

        if (template && openPanels.has(template.id)) {
          openPanels.get(template.id).dispose();
        }

        vscode.window.showInformationMessage(
          `Template "${treeItem.label}" deleted.`
        );
      }
    )
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
