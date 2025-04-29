# Q-Copy

A lightweight CLI tool that allows you to quickly copy the contents of multiple files to your system clipboard. Q-Copy automatically detects your operating system (Windows, Linux, or macOS) and uses the appropriate clipboard mechanisms.

## Features

- Cross-platform support for Windows, Linux, and macOS
- Simple configuration with file paths listed at the top of the script
- Sequential copying of multiple files with confirmation output
- Helpful error messages if files can't be accessed or clipboard operations fail
- Written in TypeScript for type safety and modern JavaScript features

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/q-copy.git

# Navigate to the project folder
cd q-copy

# Install dependencies
npm install
```

## Usage

1. Edit the file paths in the `src/index.ts` file
2. Build and run the script:

```bash
# Build the TypeScript project
npm run build

# Run the script
npm start
```

### Requirements

- **Windows**: No additional requirements (uses PowerShell)
- **Linux**: Requires `xclip` to be installed
  ```bash
  # Ubuntu/Debian
  sudo apt-get install xclip
  
  # Fedora
  sudo dnf install xclip
  ```
- **macOS**: No additional requirements (uses pbcopy)

## Example

```typescript
// Edit the file paths at the top of the script
private readonly filePaths: string[] = [
    './src/index.ts',
    './README.md',
    './package.json'
];
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```

## License

MIT

---

Marcus Shepherd
