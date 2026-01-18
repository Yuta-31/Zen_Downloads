# Download Router

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)

A Chrome extension that automatically organizes your downloads into folders based on customizable rules.

## Features

- 📁 **Automatic Organization**: Automatically organize downloads into folders based on URL patterns, file types, and custom conditions
- 🎯 **Flexible Rules Engine**: Create custom rules with multiple conditions and actions
- 📝 **Template System**: Use dynamic path templates with variables like `{host}`, `{ext}`, `{yyyy-mm-dd}`, and more
- 🔄 **Conflict Resolution**: Handle file name conflicts with options like uniquify, overwrite, or prompt
- 🎨 **Modern UI**: Built with React and Tailwind CSS for a clean, intuitive interface
- ⚡ **Real-time Preview**: See how your rules will organize files before applying them
- 💾 **Import/Export**: Share rule configurations or back them up

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/Yuta-31/custom_download_path.git
   cd custom_download_path
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `appPackages` folder from the project directory

## Usage

### Creating Rules

1. Click the extension icon in your browser toolbar
2. Click "Settings" to open the options page
3. Add a new rule with:
   - **Name**: A descriptive name for your rule
   - **Enabled**: Toggle to enable/disable the rule
   - **Domains**: URL patterns to match (e.g., `*.github.com`, `example.com`)
   - **Conditions**: File conditions (extension, mime type, size, etc.)
   - **Path Template**: Where to save the file using template variables
   - **Conflict Resolution**: How to handle existing files with the same name

### Template Variables

Use these variables in your path templates:

- `{file}` - Original filename
- `{name}` - Filename without extension
- `{ext}` - File extension
- `{host}` - Hostname of the download URL
- `{domain}` - Domain name (without subdomain)
- `{path}` - URL path
- `{yyyy}` - Year (4 digits)
- `{mm}` - Month (2 digits)
- `{dd}` - Day (2 digits)
- `{hh}` - Hour (2 digits)
- `{MM}` - Minute (2 digits)
- `{ss}` - Second (2 digits)
- `{yyyy-mm-dd}` - Full date (e.g., 2024-01-15)

### Example Rules

**Organize images by date and site:**
```
Path: {host}/images/{yyyy-mm-dd}/{file}
Conditions: Extension in [png, jpg, jpeg, gif, webp]
```

**Separate documents by type:**
```
Path: Documents/{ext}/{file}
Conditions: Extension in [pdf, doc, docx, txt]
```

**Group downloads from specific sites:**
```
Path: Projects/GitHub/{name}.{ext}
Domains: *.github.com
```

## Configuration

### Rule Structure

Rules are evaluated in order from top to bottom. The first matching rule is applied.

```typescript
{
  id: "unique-id",
  name: "Rule Name",
  enabled: true,
  domains: ["*.example.com"],
  conditions: [
    { key: "ext", op: "in", value: ["pdf", "doc"] }
  ],
  actions: {
    pathTemplate: "{host}/{yyyy-mm-dd}/{file}",
    conflict: "uniquify"
  }
}
```

### Condition Operators

- `in` - Value is in the list
- `notIn` - Value is not in the list
- `eq` - Value equals
- `ne` - Value does not equal
- `contains` - Value contains substring
- `notContains` - Value does not contain substring
- `startsWith` - Value starts with
- `endsWith` - Value ends with
- `matches` - Value matches regex pattern

### Conflict Resolution Options

- `uniquify` - Add a number suffix to create a unique filename (e.g., file(1).pdf)
- `overwrite` - Replace the existing file
- `prompt` - Ask the user what to do

## Development

### Project Structure

```
src/
├── background/      # Background service worker
├── content/         # Content scripts
├── popup/           # Extension popup UI
├── options/         # Settings page
├── lib/             # Shared utilities
│   └── rules/       # Rules engine and template system
└── schemas/         # Zod schemas for validation
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run package` - Package extension for distribution
- `npm run license:check` - Check licenses of all dependencies
- `npm run license:generate` - Generate third-party license notices

### Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives + class-variance-authority)
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Validation**: Zod
- **Testing**: Vitest

### UI Components

The UI follows the shadcn/ui approach:

- **Location**: Components live under [src/components/ui](src/components/ui)
- **Primitives**: Built on Radix UI (e.g., `@radix-ui/react-alert-dialog`)
- **Variants**: Styled via `class-variance-authority (cva)` with consistent `variant` and `size` props
- **Composition**: Uses `Slot` and a `cn` utility for class merging

When adding components, mirror existing patterns (e.g., [Button](src/components/ui/button.tsx)) and export both the component and its variants for reuse.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project uses various open-source packages. Their licenses can be found in the [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) file.

To view a summary of all dependency licenses:
```bash
npm run license:check
```

To regenerate the third-party notices:
```bash
npm run license:generate
```

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI built with [shadcn/ui](https://ui.shadcn.com/) on top of [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
