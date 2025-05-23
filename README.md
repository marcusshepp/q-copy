# q-copy 📋

> A robust, lightning-fast CLI tool to copy multiple file contents to your clipboard with advanced formatting and validation

A professional-grade command-line utility designed for developers who need to quickly aggregate file contents for AI context, code reviews, documentation, or any workflow requiring multiple file consolidation.

## ✨ Features

- 🚀 **Lightning Fast**: Copy multiple files to clipboard in milliseconds
- 📄 **Multiple Output Formats**: Plain text, Markdown, and XML formatting
- 🛡️ **Robust Error Handling**: Comprehensive validation and error recovery
- 🔍 **File Validation**: Automatic file existence, readability, and size checks
- 📊 **Progress Reporting**: Detailed feedback on file processing and sizes
- 🏠 **Global Configuration**: Uses `~/.q-copy.json` for persistent settings
- ⚙️ **Flexible CLI**: Intuitive commands for managing file lists
- 🔧 **TypeScript**: Fully typed for reliability and maintainability
- 📝 **Smart Headers**: Optional file metadata in output
- 🎯 **Cross-Platform**: Works on Windows, macOS, Linux, and WSL2

## 🔧 Installation

### Global Installation (Recommended)
```bash
git clone https://github.com/marcusshepp/q-copy.git
cd q-copy
npm install
npm run install-global
```

### Development Installation
```bash
git clone https://github.com/marcusshepp/q-copy.git
cd q-copy
npm install
npm run build
```

## 🚀 Usage

### Basic Commands

#### Copy Files to Clipboard
```bash
# Copy all configured files (default command)
q-copy
q-copy copy

# Copy with verbose output
q-copy -v

# Copy in different formats
q-copy --format markdown
q-copy --format xml
q-copy --format plain

# Copy without file headers
q-copy --no-headers
```

#### Manage File Paths
```bash
# List current file paths with status
q-copy ls
q-copy list

# Add single or multiple file paths
q-copy add /path/to/file.txt
q-copy add ./src/index.ts ./src/config.ts ./README.md

# Remove by index (1-based)
q-copy rm 1
q-copy remove 3

# Remove by file path
q-copy rm /path/to/file.txt
```

#### Configuration Management
```bash
# Show configuration details
q-copy config

# Validate current configuration
q-copy validate

# Reset configuration to defaults
q-copy reset
```

### Advanced Usage

#### Global Options
```bash
# Verbose mode - detailed output
q-copy -v copy

# Quiet mode - suppress non-error output
q-copy -q copy

# Combine options
q-copy -v --format markdown --no-headers
```

#### File Path Management
```bash
# Add multiple files at once
q-copy add ~/Documents/*.md ./src/**/*.ts

# Remove multiple files by index
q-copy rm 1
q-copy rm 2
q-copy rm 3

# View file status and sizes
q-copy ls
```

## 📋 Output Formats

### Plain Text (Default)
```
================================================================================
File: /path/to/file.txt
Size: 1234 bytes
Last Modified: 2024-01-15T10:30:00.000Z
================================================================================

[file contents here]
```

### Markdown
```markdown
## filename.txt

**Path:** `/path/to/file.txt`
**Size:** 1234 bytes
**Last Modified:** 2024-01-15T10:30:00.000Z

```txt
[file contents here]
```
```

### XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<files>
  <file path="/path/to/file.txt" size="1234" lastModified="2024-01-15T10:30:00.000Z">
    <content><![CDATA[[file contents here]]]></content>
  </file>
</files>
```

## ⚙️ Configuration

q-copy uses a JSON configuration file stored at `~/.q-copy.json`:

```json
{
  "filePaths": [
    "/absolute/path/to/file1.txt",
    "~/relative/path/to/file2.js",
    "./project/file3.md"
  ],
  "outputFormat": "plain",
  "includeHeaders": true,
  "prompt": ""
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePaths` | `string[]` | `[]` | Array of file paths to include |
| `outputFormat` | `string` | `"plain"` | Output format: `plain`, `markdown`, or `xml` |
| `includeHeaders` | `boolean` | `true` | Include file metadata headers |
| `prompt` | `string` | `""` | Optional prompt text (reserved for future use) |

## 🛡️ Error Handling & Validation

q-copy includes comprehensive error handling:

- **File Validation**: Checks file existence, readability, and size limits
- **Path Validation**: Validates and normalizes file paths
- **Configuration Validation**: Ensures valid JSON and required fields
- **Clipboard Errors**: Handles clipboard access failures gracefully
- **Detailed Logging**: Optional verbose output for debugging

### File Size Limits
- Maximum individual file size: **50MB**
- Files exceeding the limit will be skipped with a warning

### Path Handling
- Supports `~` expansion for home directory
- Automatically normalizes paths across platforms
- Validates against invalid characters

## 🔍 Troubleshooting

### Common Issues

**"No file paths configured"**
```bash
q-copy add /path/to/your/file.txt
```

**"File not found" errors**
```bash
q-copy validate  # Check which files are missing
q-copy ls        # View current status of all files
```

**Configuration issues**
```bash
q-copy config    # View current configuration
q-copy reset     # Reset to defaults if corrupted
```

**Clipboard access issues**
- Ensure your system has clipboard access permissions
- On Linux, you may need `xclip` or `xsel` installed

### Enable Verbose Logging
```bash
q-copy -v copy   # See detailed processing information
```

### View Configuration
```bash
q-copy config    # Shows config file location and current settings
```

## 🔄 Migration from v0.x

If you're upgrading from an earlier version:

1. Your existing `~/.q-copy.json` will be automatically migrated
2. Environment variable configuration (`.env`) will be imported on first run
3. The new CLI interface replaces the old separate config script

## 🚀 Performance

- **Startup Time**: < 100ms for typical configurations
- **File Processing**: Handles hundreds of files efficiently
- **Memory Usage**: Optimized for large file collections
- **Size Reporting**: Real-time progress with file sizes and timing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper TypeScript typing
4. Add tests if applicable
5. Submit a pull request

## 📝 Development

```bash
# Install dependencies
npm install

# Development mode with auto-restart
npm run dev

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with TypeScript, Commander.js, and clipboardy for reliable cross-platform clipboard access.

---

**Made with ❤️ by Marcus Shepherd**

For issues, feature requests, or contributions, visit the [GitHub repository](https://github.com/marcusshepp/q-copy).
