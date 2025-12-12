# DMentor AI

<div align="center">

![DMentor AI Banner](https://img.shields.io/badge/DMentor-AI_Powered-6C63FF?style=for-the-badge&logo=robot&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![AI Pair Programming](https://img.shields.io/badge/Pair_Programming-Revolutionary-FF6B6B?style=for-the-badge)

**Your Proactive AI Pair Programmer with Personality**

*The first AI coding assistant that interrupts you (politely) to make you a better developer*

[Features](#-features) • [Installation](#-installation) • [Personalities](#-mentor-personalities) • [Getting Started](#-getting-started) • [FAQ](#-faq)

</div>

---

## 🎯 What is DMentor AI?

DMentor AI is not just another code completion tool. It's your **proactive AI pair programmer** that actively watches your code, understands context, and intervenes when it spots potential issues—before you finish typing.

Think of it as having a senior developer looking over your shoulder, but one that learns your style, adapts to your preferences, and offers guidance with different personalities to match your needs.

### 🤔 How is it Different?

| Traditional AI Tools | DMentor AI |
|---------------------|------------|
| ✍️ Waits for you to ask | 🚨 Proactively interrupts with warnings |
| 🤖 One-size-fits-all responses | 👥 Multiple personalities (mentor, collaborator, critic) |
| 📝 Just suggests code | 🎓 Teaches you *why* with context |
| 😶 Silent observer | 💬 Active pair programmer |
| 📊 Generic suggestions | 🧠 Learns your coding style |

---

## ✨ Features

### 🎭 Adaptive AI Personalities

Choose how your AI mentor interacts with you:

#### 👨‍🏫 **Strict Mentor**
- Direct, no-nonsense feedback
- Enforces best practices rigorously
- Perfect for learning or working on critical projects
- *"That approach will cause memory leaks. Here's why..."*

#### 🤝 **Creative Collaborator**
- Encouraging and supportive
- Offers alternative approaches
- Great for brainstorming and exploration
- *"Interesting! Have you considered this pattern instead?"*

#### 🦆 **Rubber Duck**
- Asks clarifying questions
- Helps you think through problems
- Minimal interruptions, maximum insight
- *"What are you trying to achieve with this function?"*

#### 🛡️ **Security Guardian**
- Hypervigilant about vulnerabilities
- Specializes in security best practices
- Reviews code from an attacker's perspective
- *"Stop! This is vulnerable to SQL injection."*

#### ⚡ **Performance Optimizer**
- Obsessed with speed and efficiency
- Spots bottlenecks before they happen
- Suggests optimizations in real-time
- *"That O(n²) loop could be O(n log n)..."*

#### ♿ **Accessibility Advocate**
- Ensures inclusive code
- Checks WCAG compliance
- Suggests semantic improvements
- *"This button needs an aria-label for screen readers"*

### 🚨 Proactive Interventions

DMentor AI watches your code and interrupts when it detects:

- 🐛 **Potential bugs** before you run the code
- 🔒 **Security vulnerabilities** as you type
- 🐌 **Performance issues** (N+1 queries, memory leaks)
- ♻️ **Code smells** (duplicated logic, god functions)
- 🎨 **Style violations** (inconsistent naming, poor structure)
- 🧪 **Missing test coverage** for critical functions
- 📦 **Deprecated APIs** in your dependencies
- 🔄 **Race conditions** in async code

### 🧠 Smart Learning System

- **Adapts to your style**: Learns your naming conventions, patterns, and preferences
- **Remembers feedback**: Stops suggesting things you consistently reject
- **Context awareness**: Understands your project architecture and business logic
- **Team alignment**: Can sync preferences across your team

### 👥 Simulated Code Reviews

Get instant PR reviews from multiple perspectives:

```
💬 Security Review: "Potential XSS vulnerability on line 47"
💬 Performance Review: "Database query could be optimized"
💬 Accessibility Review: "Missing keyboard navigation support"
💬 Code Quality Review: "Consider extracting this into a separate function"
```

### 📊 Developer Insights Dashboard

Track your coding journey:

- 📈 Code quality trends over time
- 🎯 Most common mistakes and improvements
- ⏱️ Time spent in "flow state" vs. debugging
- 🏆 Achievement system for writing better code
- 📚 Personalized learning recommendations

---

## 📦 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
3. Search for **"DMentor AI"**
4. Click **Install**
5. Reload VS Code

### From Command Line

```bash
code --install-extension dmentor-ai
```

### Requirements

- VS Code 1.85.0 or higher
- Active internet connection for AI features
- 4GB RAM minimum (8GB recommended)

---

## 🚀 Getting Started

### 1. Initial Setup

After installation, DMentor AI will guide you through setup:

1. **Choose Your Primary Mentor Personality**
   - Start with "Creative Collaborator" if you're unsure
   - You can switch anytime with `Ctrl+Shift+M`

2. **Set Your Experience Level**
   - Beginner: More explanations, gentler guidance
   - Intermediate: Balanced approach
   - Expert: Assumes knowledge, focuses on advanced patterns

3. **Configure Intervention Frequency**
   - Minimal: Only critical issues
   - Balanced: Important issues and suggestions
   - Maximum: All observations and tips

### 2. Your First Coding Session

1. Start coding as normal
2. Watch for the 👻 ghost icon in the status bar
3. When DMentor has feedback, you'll see a gentle notification
4. Click to view the suggestion or dismiss

### 3. Quick Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Open DMentor Panel | `Ctrl+Shift+D` | View all active suggestions |
| Switch Personality | `Ctrl+Shift+M` | Change mentor personality |
| Request Review | `Ctrl+Shift+R` | Get instant code review |
| Ask DMentor | `Ctrl+Shift+Q` | Ask a specific question |
| Toggle Interventions | `Ctrl+Shift+I` | Pause/resume interruptions |
| View Insights | `Ctrl+Shift+K` | Open insights dashboard |

---

## 🎭 Mentor Personalities in Action

### Example: Detecting a Bug

**Strict Mentor:**
```
🚨 STOP: Null pointer exception will occur on line 42
The 'user' object can be null here. Add a null check before accessing properties.
This is a critical bug that will crash in production.
```

**Creative Collaborator:**
```
💡 Hey! I noticed 'user' might be null on line 42
How about using optional chaining (?.) or a default value?
This would make your code more resilient. Want to see an example?
```

**Rubber Duck:**
```
🦆 Question: What happens if 'user' is null on line 42?
Have you considered all the code paths that lead here?
Walk me through your logic...
```

### Example: Performance Issue

**Performance Optimizer:**
```
⚡ Performance Warning: O(n²) complexity detected
Your nested loop on lines 78-85 will be slow with large datasets.
Consider using a Map for O(n) lookup instead. Here's how...
[Show optimized code]
```

**Strict Mentor:**
```
❌ Unacceptable: This nested loop is inefficient
Refactor immediately. Use a hash map for constant-time lookups.
In production, this will cause timeout errors with 10k+ items.
```

---

## ⚙️ Configuration

### Basic Settings

```json
{
  // Personality Settings
  "dmentorAI.personality": "creative-collaborator",
  "dmentorAI.experienceLevel": "intermediate",
  "dmentorAI.interventionFrequency": "balanced",
  
  // Behavior
  "dmentorAI.proactiveInterruptions": true,
  "dmentorAI.autoReviewOnSave": true,
  "dmentorAI.showInlineHints": true,
  "dmentorAI.soundEffects": false,
  
  // Learning
  "dmentorAI.learnFromFeedback": true,
  "dmentorAI.syncTeamPreferences": false,
  "dmentorAI.anonymousUsageData": true,
  
  // Advanced
  "dmentorAI.maxSuggestionsPerMinute": 3,
  "dmentorAI.focusModeRespect": true,
  "dmentorAI.quietHours": ["22:00-08:00"]
}
```

### Advanced Customization

#### Create Custom Personalities

```json
{
  "dmentorAI.customPersonalities": [
    {
      "name": "Code Poet",
      "description": "Focuses on elegant, readable code",
      "tone": "artistic",
      "priorities": ["readability", "elegance", "simplicity"]
    }
  ]
}
```

#### Configure Detection Rules

```json
{
  "dmentorAI.detectionRules": {
    "security": "strict",
    "performance": "balanced",
    "style": "relaxed",
    "accessibility": "strict"
  }
}
```

---

## 🎓 Use Cases

### For Junior Developers
- Learn best practices in real-time
- Understand *why* certain patterns are better
- Build confidence with supportive guidance
- Track improvement over time

### For Senior Developers
- Catch edge cases you might miss
- Get a fresh perspective on complex problems
- Maintain consistency across large codebases
- Mentor mode: Explain code to juniors

### For Solo Developers
- Simulate having a team for code reviews
- Multiple perspective reviews (security, performance, UX)
- Combat loneliness of solo development
- Stay accountable to best practices

### For Teams
- Enforce consistent coding standards
- Knowledge sharing across experience levels
- Reduce PR review time
- Onboard new members faster

---

## 🤝 Integration

DMentor AI works seamlessly with:

- ✅ GitHub Copilot
- ✅ GitLens
- ✅ ESLint / Prettier
- ✅ Jest / Testing frameworks
- ✅ Debugger
- ✅ Language servers (TypeScript, Python, Java, etc.)

---

## 📊 Privacy & Data

### What We Collect
- Code patterns (anonymized, hashed)
- Interaction patterns (accepted/rejected suggestions)
- Performance metrics
- **Never:** Your actual source code or business logic

### Local-First Processing
- Most analysis happens on your machine
- Only sends minimal context to AI models
- Can enable fully offline mode (reduced features)

### Team Sync (Optional)
- Share style preferences across your team
- Keeps individual code private
- Admin controls for enterprise

---

## 🐛 Troubleshooting

### DMentor is too chatty
```json
{
  "dmentorAI.interventionFrequency": "minimal",
  "dmentorAI.maxSuggestionsPerMinute": 1
}
```

### I need focus time
- Enable Focus Mode: `Ctrl+Shift+F`
- Or set quiet hours in settings
- DMentor respects VS Code's Zen Mode

### Suggestions aren't relevant
- Switch personalities to find better fit
- Use "Not Helpful" feedback to train the AI
- Check that your language is properly detected

### Performance issues
- Reduce intervention frequency
- Disable auto-review on save
- Exclude large files in settings

---

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ 6 core mentor personalities
- ✅ Proactive bug detection
- ✅ Multi-perspective code reviews
- ✅ Learning system
- ✅ Insights dashboard

### Coming Soon (v1.5)
- 🔄 Voice mode (voice-to-code conversations)
- 🎮 Interactive coding challenges
- 📹 Screen recording with AI commentary
- 🌐 Web-based dashboard
- 🤖 Custom personality creator

### Future Vision (v2.0)
- 👥 Pair programming with remote developers
- 🎯 AI-generated test cases
- 📚 Auto-generated documentation
- 🔮 Predictive debugging
- 🌍 Multi-language support

---

## 💝 Pricing

### Free Tier
- 100 interventions per day
- 3 personality types
- Basic insights
- Community support

### Pro ($9/month)
- Unlimited interventions
- All 6+ personalities
- Advanced insights & analytics
- Priority support
- Custom personalities
- Team sync features

### Enterprise (Custom)
- On-premise deployment
- SSO integration
- Custom training on your codebase
- Dedicated support
- SLA guarantees

---

## 🙋 FAQ

**Q: Will DMentor replace my senior developers?**
A: No! DMentor augments human expertise. It's a tool for catching issues and sharing knowledge, not replacing human judgment and creativity.

**Q: Does it work with [my language]?**
A: DMentor supports JavaScript/TypeScript, Python, Java, C#, Go, Rust, PHP, and Ruby. More languages coming soon!

**Q: Is my code sent to the cloud?**
A: Only minimal, anonymized context is sent to AI models. Your actual source code stays on your machine.

**Q: Can I turn off interruptions?**
A: Absolutely! You have full control over when and how often DMentor chimes in.

**Q: Does it work offline?**
A: Limited offline mode available with reduced AI features. Full offline coming in v1.5.

**Q: How is this different from Copilot?**
A: Copilot suggests code. DMentor *reviews* your code proactively and teaches you. They work great together!

---

## 🤝 Contributing

We're open source! Contributions welcome:

- 🐛 [Report bugs](https://github.com/vishalnandy17/dmentorai/issues)
- 💡 [Suggest features](https://github.com/vishalnandy17/dmentorai/discussions)
- 🔧 [Submit PRs](https://github.com/vishalnandy17/dmentorai/pulls)
- 📖 [Improve docs](https://github.com/vishalnandy17/dmentorai/wiki)

Check our [Contributing Guide](CONTRIBUTING.md) to get started!

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

- Built with ❤️ by Vishal who wished he had a mentor
- Powered by state-of-the-art AI models
- Inspired by the pair programming culture
- Special thanks to our amazing beta testers

---

<div align="center">

### 👻 **"Code with confidence. Learn continuously. Ship faster."**

**Made by developers, for developers**

[⭐ Star on GitHub](https://github.com/vishalnandy17/dmentorai) | 

---

*DMentor AI - Your proactive pair programmer that makes you better, one commit at a time*

</div>
