# gbswitch

A simple and intuitive CLI tool to quickly switch between your recent Git branches using an interactive TUI.

## Features

- Shows the 5 most recently committed-to branches
- Interactive terminal UI with arrow key navigation
- Displays relative time since last commit on each branch
- Automatically excludes the current branch from the list
- Handles uncommitted changes with stash option
- Color-coded output for better visibility

## Installation

```bash
npm install -g gbswitch
```

## Usage

Simply run the command from any Git repository:

```bash
gbswitch
```

### How it works:

1. Run `gbswitch` in any Git repository
2. The tool will display your 5 most recent branches (excluding current)
3. Use **↑/↓ arrow keys** to navigate through the list
4. Press **Enter** to checkout the selected branch
5. Press **Esc** or select "Cancel" to exit without switching

### Features:

- **Automatic stashing**: If you have uncommitted changes, the tool will prompt you to stash them before switching
- **Time display**: Shows how long ago each branch was last committed to
- **Current branch display**: Shows your current branch at the top for reference

## Requirements

- Node.js (v12 or higher)
- Git

## License

MIT