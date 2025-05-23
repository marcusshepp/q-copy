Here’s the updated `README.md` with instructions on how to use the new CLI interface:

---

### `README.md`

````md
# q-copy 📋

> A lightning-fast CLI tool to copy multiple file contents to your clipboard

I found myself wishing I had a file where I could specify multiple files to copy to the clipboard.
This helps me with quickly create context for LLMs.
Hope you find it useful.

## ✨ Features

- 🚀 Copy multiple files to clipboard in one command
- 📄 Concatenates files with headers showing file paths
- 🔄 Cross-platform support (Windows, macOS, Linux, WSL2)
- 🏠 Uses a global config file for easy access from anywhere
- ⚙️ Easily manage which files are included with CLI commands

## 🔧 Installation

```bash
git clone https://github.com/marcusshepp/q-copy.git
cd q-copy
npm install
npm run install-global
````

## 🚀 Usage

After installing globally, you can use `q-copy` in the terminal:

### Copy contents of configured files

```bash
q-copy
```

### Show current file paths

```bash
q-copy ls
```

### Add a file path

```bash
q-copy add /absolute/path/to/file.txt
```

### Remove a file path

```bash
q-copy rm /absolute/path/to/file.txt
```

## ⚙️ Configuration

`q-copy` uses a JSON config stored at `~/.q-copy.json`. You can manage this config with the built-in commands.

Or, manually edit:

```json
{
  "filePaths": [
    "/path/to/file1.txt",
    "/path/to/file2.js"
  ]
}
```

## 📋 Output Format

When copying, it concatenates all file contents and puts them in your clipboard.

---

Made with love,
Marcus Shepherd

```
```
