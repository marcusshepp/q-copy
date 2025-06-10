# q-copy 📋

> A robust, lightning-fast CLI tool to copy multiple file contents to your clipboard with advanced formatting and validation

A professional-grade command-line utility designed for developers who need to quickly aggregate file contents for AI context, code reviews, documentation, or any workflow requiring multiple file consolidation.

## ✨ Features

- 🚀 **Lightning Fast**: Copy multiple files to clipboard in milliseconds
- 📄 **Multiple Output Formats**: Plain text, Markdown, and XML formatting
- 🛡️ **Robust Error Handling**: Comprehensive validation and error recovery
- 🌟 **Pattern Matching**: Support for glob patterns like `*.js`, `**/*.ts`
- 📁 **Directory Support**: Recursively add all files from directories
- 🗑️ **Advanced Removal**: Remove files by ranges (1-5) or multiple indices (1 2 3)
- 🎯 **Cross-Platform**: Works on Windows, macOS, Linux, and WSL2

## 🔧 Installation

```bash
git clone https://github.com/marcusshepp/q-copy.git
cd q-copy
npm install
npm run install-global
```

## 🚀 Usage

### Copy Files

```bash
# Copy all configured files (default command)
q-copy

# Copy with different formats
q-copy --format markdown
q-copy --format xml

# Copy with verbose output
q-copy -v
```

### Add Files

```bash
# Add single file
q-copy add /path/to/file.txt
q-copy a /path/to/file.txt  # Short alias

# Add multiple files and patterns
q-copy a *.json src/**/*.ts docs/

# Add directories (recursive)
q-copy a ./src/ ./tests/
```

### Remove Files

```bash
# List current files with indices
q-copy ls

# Remove by range
q-copy rm 1-5        # Remove files 1 through 5

# Remove specific files
q-copy rm 1 3 5      # Remove files 1, 3, and 5

# Mix ranges and indices
q-copy rm 1-3 7 9-11 # Remove files 1-3, 7, and 9-11

# Remove by file path
q-copy rm /path/to/file.txt
```

### Other Commands

```bash
q-copy config        # Show configuration
q-copy validate      # Validate current setup
q-copy reset         # Reset to defaults
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

````markdown
## filename.txt

**Path:** `/path/to/file.txt`
**Size:** 1234 bytes

```txt
[file contents here]
```
````

### XML

```xml
<files>
  <file path="/path/to/file.txt" size="1234">
    <content><![CDATA[[file contents here]]]></content>
  </file>
</files>
```

## 🌟 Pattern Examples

```bash
# TypeScript files
q-copy a src/**/*.ts

# Multiple file types
q-copy a *.{js,ts,json}

# Configuration files
q-copy a *.json *.yaml .env*

# Test files
q-copy a **/*.test.js **/*.spec.ts

# Everything in src directory
q-copy a src/
```

## 🗑️ Removal Examples

```bash
# Remove first 5 files
q-copy rm 1-5

# Remove specific files
q-copy rm 2 4 6 8

# Complex removal
q-copy rm 1-3 8 12-15 20

# Mix with file paths
q-copy rm 1-5 /specific/file.txt 10-12
```

## ⚙️ Configuration

Configuration is stored at `~/.q-copy.json`:

```json
{
    "filePaths": ["/path/to/file1.txt", "~/file2.js"],
    "outputFormat": "plain",
    "includeHeaders": true
}
```

## 🔍 Troubleshooting

**No files configured:**

```bash
q-copy a /path/to/your/files
```

**Invalid indices:**

```bash
q-copy ls        # Check current file indices
```

**Pattern issues:**

```bash
q-copy -v a *.txt  # Use verbose mode
```

**Configuration problems:**

```bash
q-copy config    # View current settings
q-copy reset     # Reset if needed
```

## 📄 License

MIT License

---

**Made with ❤️ by Marcus Shepherd**
