# VSC Utils

VSC Utils is a VS Code extension for the built-in Integrated Browser.

## Features

- Opens terminal URL clicks in VS Code's Integrated Browser.
- Adds `New Browser` to the Explorer context menu.
- Adds `New Text File` to the Explorer context menu near file and terminal actions.

## Commands

- `VSC Utils: New Browser`
- `VSC Utils: Open Clipboard URL in Integrated Browser`
- `VSC Utils: New Text File`

## Settings

- `vscUtils.handleTerminalLinks`: route terminal URLs to the Integrated Browser.

The old `browserUtils.*` setting names still work as compatibility aliases.

## Link Handling Limits

VSC Utils handles terminal links directly. Some VS Code surfaces, including chat output, Markdown previews, and extension release notes, use VS Code's external browser opener instead. For those links, copy the URL and run `VSC Utils: Open Clipboard URL in Integrated Browser`.

## Development

```powershell
npm install
npm run check
npm run package
```

The packaged VSIX is written to `vsc-utils-0.0.5.vsix`.
