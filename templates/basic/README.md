# Sherlock Project

Created with [Sherlock](https://github.com/yourusername/sherlock-lang) - Beautiful STEM animation framework

## 🚀 Quick Start

```bash
# Preview your animation (live reload)
sherlock preview scenes/intro.sherlock

# Or use npm script
npm run preview

# Export to video
sherlock render scenes/intro.sherlock -o output.mp4

# Or use npm script
npm run render
```

## 📖 Available Commands

```bash
# Live coding mode with documentation
sherlock code scenes/intro.sherlock --guide primitives

# View documentation in terminal
sherlock guide primitives
sherlock guide components
sherlock guide syntax

# Browse and copy examples
sherlock examples
sherlock examples --copy neural_network_demo

# Manage configuration
sherlock config --init    # Create .sherlockrc
sherlock config --show    # View current config
```

## 📁 Project Structure

```
.
├── scenes/              # Your .sherlock animation files
│   └── intro.sherlock  # Sample animation
├── output/             # Rendered videos (created automatically)
├── package.json        # Project configuration
└── README.md          # This file
```

## ✏️ Editing Scenes

Edit `.sherlock` files in any text editor:
- **VS Code**: Install "YAML" extension for syntax highlighting
- **Sublime Text**: Use YAML syntax
- **Vim/Neano**: YAML mode

### Scene Structure
```yaml
concept: "Your animation title"
total_duration: 5

phases:
  intro:
    duration: 5
    elements:
      myText:
        type: primitive
        shape: text[text:"Hello!" fontSize:48 fill:#3B82F6 at:(0,0)]
```

## 🎬 Rendering Tips

### Draft Quality (fast preview)
```bash
sherlock render scenes/intro.sherlock -w 1280 -h 720 --fps 24 -q 28
```

### Standard Quality (balanced)
```bash
sherlock render scenes/intro.sherlock -w 1920 -h 1080 --fps 30 -q 18
```

### High Quality (best output)
```bash
sherlock render scenes/intro.sherlock -w 1920 -h 1080 --fps 60 -q 15
```

### 4K Quality
```bash
sherlock render scenes/intro.sherlock -w 3840 -h 2160 --fps 30 -q 15
```

## 📚 Learning Resources

### Built-in Guides
```bash
sherlock guide              # List all guides
sherlock guide syntax       # Learn DSL syntax
sherlock guide components   # Component reference
sherlock guide primitives   # Primitive types
```

### Examples
```bash
sherlock examples           # Browse all examples
sherlock examples --copy abc_commented  # Copy for learning
```

### Online Resources
- Documentation: [GitHub Repository](https://github.com/yourusername/sherlock-lang)
- Examples: Check the `scenes` folder in Sherlock installation
- Community: [Discussions](https://github.com/yourusername/sherlock-lang/discussions)

## 🎯 Next Steps

1. **Edit `scenes/intro.sherlock`** - Modify the sample animation
2. **Preview your changes** - Run `sherlock preview scenes/intro.sherlock`
3. **Explore examples** - Run `sherlock examples` to see what's possible
4. **Create new scenes** - Add more `.sherlock` files to `scenes/`
5. **Export your work** - Render to video when ready

## 💡 Pro Tips

- Use `sherlock code` for live development with documentation
- Keep scenes modular - one concept per file
- Use consistent naming for elements (camelCase recommended)
- Comment complex animations for future reference
- Test with short durations first, then extend
- Use git to version control your scenes

## 🐛 Troubleshooting

### Preview not working?
- Ensure Node.js and dependencies are installed
- Check port 3000 is not in use
- Try different port: `sherlock preview --port 3001`

### Render failing?
- Confirm FFmpeg is installed: `ffmpeg -version`
- Check scene file syntax (valid YAML)
- Verify file paths are correct
- Check disk space for output

### Need help?
```bash
sherlock --help              # General help
sherlock render --help       # Command-specific help
sherlock guide syntax        # Syntax reference
```

## 🤝 Contributing

Found a bug or have a feature idea? 
- Report issues: [GitHub Issues](https://github.com/yourusername/sherlock-lang/issues)
- Share your scenes: Create a pull request with examples
- Improve docs: Documentation PRs welcome!

## 📄 License

This project template is provided as-is. Your animations are yours!

---

**Happy animating! 🎬✨**

*Need help? Run `sherlock guide` or visit the [documentation](https://github.com/yourusername/sherlock-lang)*
