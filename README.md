# q-copy 📋

> A lightning-fast CLI tool to copy multiple file contents to your clipboard

I found myself wishing I had a file where I could specify multiple files to copy to the clipboard.
This helps me with quickly create context for LLMs.
Hope you find it useful.

## ✨ Features

- 🚀 Copy multiple files to clipboard in one command
- 📄 Concatenates files with headers showing file paths
- 🔄 Cross-platform support (Windows, macOS, Linux)
- 🏠 Uses a global config file for easy access from anywhere

## 🔧 Installation

```bash
# Or install from source
git clone https://github.com/marcusshepp/q-copy.git
cd q-copy
npm install
npm run install-global
```

## 🚀 Usage

Simply run:

```bash
q-copy
```

The first time you run the command, it will create a `.q-copy.json` configuration file in your home directory.

## ⚙️ Configuration

Edit the config file at `~/.q-copy.json`:

```json
{
  "filePaths": [
    "/path/to/file1.txt",
    "/path/to/file2.js",
    "/path/to/file3.md"
  ]
}
```

Alternatively, you can use a `.env` file in your current directory:

```
FILE_PATHS=/path/to/file1.txt, /path/to/file2.js, /path/to/file3.md
```

## 📋 Output Format

Files are copied to your clipboard with the following format:

```
/path/to/file1.txt
Content of file 1

/path/to/file2.js
Content of file 2

/path/to/file3.md
Content of file 3
```

Made with love,
Marcus Shepherd
