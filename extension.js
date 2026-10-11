const path = require("path");
const vscode = require("vscode");

const urlPattern = /https?:\/\/[^\s<>"'`)\]}]+/g;

class BrowserTerminalLink extends vscode.TerminalLink {
  constructor(startIndex, length, url) {
    super(startIndex, length);
    this.url = url;
    this.tooltip = "Open in Integrated Browser";
  }
}

function provideTerminalLinks(context) {
  const config = vscode.workspace.getConfiguration("vscUtils");
  const legacyConfig = vscode.workspace.getConfiguration("browserUtils");
  if (!config.get("handleTerminalLinks", legacyConfig.get("handleTerminalLinks", true))) {
    return [];
  }

  const links = [];
  for (const match of context.line.matchAll(urlPattern)) {
    links.push(new BrowserTerminalLink(match.index, match[0].length, match[0]));
  }
  return links;
}

async function openIntegratedBrowser(url) {
  try {
    await vscode.commands.executeCommand(
      "workbench.action.browser.open",
      url ? { url } : undefined
    );
  } catch {
    if (url) {
      await vscode.commands.executeCommand("simpleBrowser.show", url);
    } else {
      await vscode.commands.executeCommand("workbench.action.browser.open");
    }
  }
}

async function openClipboardUrl() {
  const clipboard = (await vscode.env.clipboard.readText()).trim();
  const value =
    /^https?:\/\//i.test(clipboard)
      ? clipboard
      : await vscode.window.showInputBox({
          prompt: "URL to open in the Integrated Browser",
          value: clipboard,
          validateInput(input) {
            return /^https?:\/\//i.test(input.trim()) ? undefined : "Enter an http or https URL.";
          },
        });

  if (!value) return;
  await openIntegratedBrowser(value.trim());
}

async function getTargetFolder(resource) {
  if (resource?.scheme === "file") {
    try {
      const stat = await vscode.workspace.fs.stat(resource);
      if (stat.type & vscode.FileType.Directory) {
        return resource;
      }
    } catch {}
    return vscode.Uri.file(path.dirname(resource.fsPath));
  }

  const firstFolder = vscode.workspace.workspaceFolders?.[0];
  return firstFolder?.uri;
}

async function newTextFile(resource) {
  const folder = await getTargetFolder(resource);
  if (!folder) {
    await vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
    return;
  }

  const name = await vscode.window.showInputBox({
    prompt: "New text file name",
    value: "New Text File.txt",
    validateInput(value) {
      if (!value.trim()) return "Enter a file name.";
      if (/[<>:"/\\|?*]/.test(value)) return "File name contains invalid characters.";
      return undefined;
    },
  });
  if (!name) return;

  const target = vscode.Uri.joinPath(folder, name.trim());
  try {
    try {
      await vscode.workspace.fs.stat(target);
      vscode.window.showErrorMessage(`File already exists: ${target.fsPath}`);
      return;
    } catch {}

    await vscode.workspace.fs.writeFile(target, new Uint8Array());
    const doc = await vscode.workspace.openTextDocument(target);
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    vscode.window.showErrorMessage(`Could not create file: ${error.message}`);
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.window.registerTerminalLinkProvider({
      provideTerminalLinks,
      handleTerminalLink: link => openIntegratedBrowser(link.url),
    }),
    vscode.commands.registerCommand("browserUtils.openNewBrowser", () => openIntegratedBrowser()),
    vscode.commands.registerCommand("browserUtils.openClipboardUrl", openClipboardUrl),
    vscode.commands.registerCommand("browserUtils.newTextFile", newTextFile)
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
