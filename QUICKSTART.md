# Quick Start Guide

Get up and running with the Advanced Multi-Package Data Collection Chatbot in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- TypeScript compiler
- Joi for validation
- UUID for session IDs
- Natural language processing libraries

## Step 2: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Step 3: Run the Chatbot

```bash
npm run dev
```

You'll see the welcome screen:

```
╔══════════════════════════════════════════════════════════════╗
║         🚀  ADVANCED PACKAGE COLLECTION CHATBOT  📦          ║
║              Intelligent Multi-Package Data Collection       ║
╚══════════════════════════════════════════════════════════════╝

🤖 Bot: Welcome to the Advanced Package Collection System! 🎉
        Would you like to add your first package?
```

## Step 4: Add Your First Package

Simply follow the conversational prompts:

```
You: yes

🤖 Bot: What type of package are you shipping?

You: box

🤖 Bot: What are the dimensions?

You: 30 x 20 x 15 cm

🤖 Bot: What's the weight?

You: 5 kg

🤖 Bot: Is this package fragile?

You: no

🤖 Bot: What's the shipping priority?

You: express
```

Continue answering the questions until the package is complete!

## Step 5: Export Your Data

Once you've added all your packages:

```
You: finish

🤖 Bot: Session completed! Total packages: 1

You: export

🤖 Bot: Export successful!
     Files created:
     📄 ./exports/package-export-xxx.json
     📄 ./exports/package-export-xxx.csv
     📄 ./exports/package-export-xxx.txt
```

## Quick Tips

### Use Natural Language
Don't worry about exact formatting:
- "small box" works just as well as "box"
- "about 5 kilos" = "5 kg"
- "express shipping" = "express"

### Save Time
- Type `same as last` to copy from previous package
- Type `skip` to skip optional fields
- Type `help` anytime for assistance

### View Your Progress
- Type `summary` to see all packages
- Type `cost` to calculate shipping costs

### Common Commands
| Command | Action |
|---------|--------|
| `help` | Show help |
| `summary` | View all packages |
| `export` | Export data |
| `finish` | Complete session |
| `exit` | Quit application |

## Example Session

Here's a complete example session:

```bash
npm run dev

You: yes
You: box
You: 30 x 20 x 15 cm
You: 5 kg
You: no
You: express
You: 123 Main Street
     Los Angeles, CA 90001
     USA
You: skip
You: skip
You: 200
You: yes
You: email
You: yes

# Package is saved!

You: no
You: finish
You: export
You: exit
```

That's it! You've successfully:
✅ Added a package
✅ Completed the session
✅ Exported the data
✅ Exited the application

## Next Steps

- Read the [User Guide](USER_GUIDE.md) for detailed features
- Check the [API Documentation](API.md) for integration
- Explore `examples/` folder for sample outputs

## Troubleshooting

**Issue:** TypeScript errors when building
**Solution:** Make sure you have TypeScript installed: `npm install -g typescript`

**Issue:** Module not found errors
**Solution:** Delete `node_modules` and run `npm install` again

**Issue:** Can't find exports folder
**Solution:** It's created automatically when you export. Check `./exports/`

## Need Help?

Type `help` in the chatbot at any time, or check the documentation in the `docs/` folder.

Happy packaging! 📦
