# DMentor AI - Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Visual Studio Code 1.85.0 or higher

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Compile TypeScript**
   ```bash
   npm run compile
   ```
   Or for development with watch mode:
   ```bash
   npm run watch
   ```

3. **Open in VS Code**
   ```bash
   code .
   ```

4. **Run the Extension**
   - Press `F5` to launch a new Extension Development Host window
   - Or use the "Run Extension" configuration from the Run and Debug panel

5. **Package for Distribution** (Optional)
   ```bash
   npm install -g vsce
   vsce package
   ```
   This creates a `.vsix` file that can be installed in VS Code.

## Development

### Project Structure

```
DMentorAI/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── core/
│   │   └── dmentorCore.ts       # Core functionality
│   ├── personalities/            # Personality system
│   │   ├── personalityManager.ts
│   │   ├── personality.ts
│   │   └── [personality types]
│   ├── analysis/
│   │   └── codeAnalyzer.ts      # Code analysis engine
│   ├── ui/
│   │   ├── statusBarManager.ts  # Status bar integration
│   │   ├── suggestionManager.ts # Suggestions panel
│   │   └── insightsDashboard.ts # Insights dashboard
│   └── commands/
│       └── commandManager.ts    # Command handlers
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
└── README.MD                     # Documentation
```

### Key Features Implemented

✅ Status bar integration (lower navbar in VS Code)
✅ 6 mentor personalities (Strict Mentor, Creative Collaborator, Rubber Duck, Security Guardian, Performance Optimizer, Accessibility Advocate)
✅ Proactive code analysis
✅ Real-time code issue detection
✅ Suggestions panel with webview
✅ Insights dashboard
✅ Command palette integration
✅ Configuration options
✅ Keyboard shortcuts

### Testing the Extension

1. Open a code file (JavaScript, TypeScript, Python, or HTML)
2. Start typing or make changes
3. Watch for:
   - Status bar updates (👻 DMentor icon in lower navbar)
   - Code suggestions appearing
   - Notifications for critical issues

4. Try commands:
   - `Ctrl+Shift+D` - Open suggestions panel
   - `Ctrl+Shift+M` - Switch personality
   - `Ctrl+Shift+R` - Request code review
   - `Ctrl+Shift+K` - View insights

## Troubleshooting

### Extension not activating
- Check VS Code version (needs 1.85.0+)
- Verify dependencies are installed: `npm install`
- Check output panel for errors

### Status bar not showing
- The status bar item appears on the left side of the lower navbar
- It should show 👻 DMentor or personality-specific icon
- Try reloading the window: `Ctrl+R` (or `Cmd+R` on Mac)

### Code analysis not working
- Ensure the file type is supported (JS/TS, Python, HTML)
- Check that `dmentorAI.proactiveInterruptions` is enabled in settings
- Verify the file is saved or in an active editor

## Next Steps

For production deployment:
1. Update version in `package.json`
2. Add icon and screenshots
3. Publish to VS Code Marketplace
4. Update README with actual links

