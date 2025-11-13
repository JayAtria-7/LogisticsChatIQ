# Advanced Multi-Package Data Collection Chatbot

An intelligent conversational chatbot that collects detailed package information through natural dialogue, validates inputs in real-time, and generates structured JSON output.

## 🌟 Features

### Core Functionality
- ✅ **Multi-Turn Conversation Management**: Context-aware dialogue with session memory
- ✅ **Real-Time Validation**: Comprehensive validation for dimensions, weight, addresses, and more
- ✅ **Natural Language Processing**: Understands natural inputs, abbreviations, and colloquial language
- ✅ **Smart Suggestions**: Learns from session history to suggest likely values
- ✅ **Batch Operations**: Handle multiple packages efficiently with templates
- ✅ **Export Options**: Multiple formats including JSON, CSV, and human-readable summaries
- ✅ **Session Management**: Auto-save, pause/resume, and session recovery

### Advanced Features
- 🎯 **Intent Recognition**: Detects user intentions (add, edit, delete, help, etc.)
- 🔍 **Entity Extraction**: Automatically extracts dimensions, weights, addresses from text
- 💰 **Cost Calculation**: Real-time shipping cost estimation with detailed breakdowns
- 🛡️ **Cross-Validation**: Smart warnings for unusual combinations (e.g., fragile + no insurance)
- 📝 **Error Recovery**: Helpful error messages with retry logic (max 3 attempts per field)
- 🔄 **Context References**: Support for "same as last" to copy previous values
- 📊 **Progress Tracking**: Visual indicators and completion status

## 📦 Installation

```bash
# Install dependencies
npm install

# Install globally (optional)
npm install -g .
```

## 🚀 Usage

### Web UI (Recommended)
```bash
# Start the web server
npm run dev:web

# Or use the launcher script (Windows)
start-web.bat
```

Then open your browser to **http://localhost:5000**

**Features:**
- 🌐 Modern responsive web interface
- 💬 Real-time chat with WebSocket
- 📱 Mobile-friendly design
- 🎨 Dark/Light theme toggle
- 📊 Live package dashboard
- 💾 One-click export

👉 See [WEB_UI_GUIDE.md](WEB_UI_GUIDE.md) for detailed web UI documentation

### CLI Mode (Terminal)
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

### Programmatic Usage
```typescript
import { SessionManager, ConversationManager, ExportService } from './src';

const sessionManager = new SessionManager();
const conversationManager = new ConversationManager(sessionManager);

// Start conversation
const welcome = conversationManager.getWelcomeMessage();
console.log(welcome.message);

// Process user input
const response = await conversationManager.processInput('yes');
```

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test packageValidator.test.ts
```

## 📁 Project Structure

```
iitb-P1/
├── src/
│   ├── models/              # TypeScript interfaces and enums
│   │   ├── types.ts         # Data models (Package, Session, etc.)
│   │   └── enums.ts         # Enumerations (Intent, State, etc.)
│   ├── services/            # Business logic services
│   │   ├── sessionManager.ts      # Session state management
│   │   ├── conversationManager.ts # Dialogue flow control
│   │   └── exportService.ts       # Data export functionality
│   ├── validators/          # Input validation
│   │   └── packageValidator.ts    # Package data validation
│   ├── nlp/                 # Natural language processing
│   │   └── processor.ts     # Intent & entity recognition
│   ├── utils/               # Utility functions
│   │   ├── shippingCalculator.ts  # Cost calculation
│   │   └── formatter.ts           # Console formatting
│   ├── __tests__/           # Unit tests
│   ├── cli.ts               # Command-line interface
│   └── index.ts             # Main entry point
├── docs/                    # Documentation
│   ├── USER_GUIDE.md        # User documentation
│   └── API.md               # API reference
├── examples/                # Example outputs
│   ├── sample-output.json
│   └── sample-summary.txt
├── sessions/                # Session storage (auto-created)
├── exports/                 # Export output (auto-created)
└── package.json
```

## 📊 Data Collection

For each package, the chatbot collects:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Package Type | Enum | ✅ | box, envelope, crate, pallet, tube, other |
| Dimensions | Object | ✅ | Length, width, height with unit (cm/inch/m) |
| Weight | Object | ✅ | Value with unit (kg/lbs/g/oz) |
| Fragile Status | Boolean | ✅ | Is the package fragile? |
| Priority Level | Enum | ✅ | standard, express, overnight, same_day |
| Destination | Object | ✅ | Complete address with validation |
| Sender Info | Object | ⭕ | Name, email, phone (optional) |
| Special Instructions | String | ⭕ | Custom handling notes |
| Estimated Value | Number | ⭕ | Package value for insurance |
| Insurance Required | Boolean | ✅ | Whether insurance is needed |
| Tracking Preferences | Object | ⭕ | Email, SMS, signature options |

## 🎨 Example Usage

### Interactive Session
```
🤖 Bot: Welcome! Would you like to add your first package?
You: yes

🤖 Bot: What type of package are you shipping?
You: small box

🤖 Bot: What are the dimensions?
You: 30 x 20 x 15 cm

🤖 Bot: What's the weight?
You: 5 kg

🤖 Bot: Is this package fragile?
You: no

🤖 Bot: What's the shipping priority?
You: express

... [continues through all fields] ...

🤖 Bot: Package saved successfully! ✓
     Total packages collected: 1
     Type 'export' to save, or add another package.

You: export

🤖 Bot: Export successful!
     Files created:
     📄 ./exports/package-export-a1b2c3d4.json
     📄 ./exports/package-export-a1b2c3d4.csv
     📄 ./exports/package-export-a1b2c3d4.txt
```

### Available Commands
- `help` - Show help and available commands
- `summary` - View all collected packages
- `export` - Export data to files
- `cost` - Calculate shipping costs
- `finish` - Complete session
- `cancel` - Cancel and clear session
- `pause` - Save session for later
- `skip` - Skip optional field
- `same as last` - Copy from previous package
- `exit` / `quit` - Exit application

## 📤 Export Formats

### JSON (Pretty-Printed)
```json
{
  "apiVersion": "1.0.0",
  "metadata": {
    "sessionId": "a1b2c3d4...",
    "totalPackages": 3,
    "totalEstimatedCost": 125.50
  },
  "packages": [...]
}
```

### CSV
Spreadsheet-compatible format with all package details in columns.

### Human-Readable Summary
Formatted text with:
- Session metadata
- Detailed package information
- Visual indicators (✓, ✗, ⚠️)
- Cost breakdowns

See `examples/` folder for sample outputs.

## 🧪 Testing

The project includes comprehensive unit tests:

```bash
# Run all tests
npm test

# Test specific components
npm test validators
npm test nlp
npm test shipping

# Coverage report
npm test -- --coverage
```

Test coverage includes:
- ✅ Package validation (dimensions, weight, addresses)
- ✅ NLP intent recognition and entity extraction
- ✅ Shipping cost calculations
- ✅ Session management
- ✅ Export functionality

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete user documentation with examples
- **[API Documentation](docs/API.md)** - Developer API reference
- **[Examples](examples/)** - Sample outputs and use cases

## 🔧 Configuration

### TypeScript Configuration
The project uses TypeScript with strict mode enabled. Configuration in `tsconfig.json`.

### Session Storage
Sessions are saved to `./sessions/` directory with auto-save every 30 seconds.

### Export Directory
Exports are saved to `./exports/` directory (auto-created).

## 🛠️ Development

### Project Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint
```

### Adding New Features
1. Create models in `src/models/`
2. Implement services in `src/services/`
3. Add validation in `src/validators/`
4. Write tests in `src/__tests__/`
5. Update documentation

## 🚧 Technical Requirements

### Dependencies
- Node.js >= 16.x
- TypeScript >= 5.x
- Key libraries: joi (validation), uuid, natural/compromise (NLP)

### System Requirements
- Operating System: Windows, macOS, Linux
- Memory: 512MB minimum
- Storage: 100MB for application + session data

## 🎯 Features Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-turn Conversation | ✅ Complete | Full state machine implementation |
| Real-time Validation | ✅ Complete | Comprehensive validation with Joi |
| NLP Processing | ✅ Complete | Intent recognition + entity extraction |
| Session Management | ✅ Complete | Auto-save, pause/resume, recovery |
| Export (JSON/CSV/Summary) | ✅ Complete | Multiple format support |
| Cost Calculation | ✅ Complete | Detailed breakdown available |
| Smart Suggestions | ✅ Complete | Context-aware recommendations |
| Batch Operations | ✅ Complete | Template support, bulk editing |
| Error Recovery | ✅ Complete | 3-attempt retry logic |
| Cross-Validation | ✅ Complete | Smart warnings for unusual combos |

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

For questions or issues:
1. Check the [User Guide](docs/USER_GUIDE.md)
2. Review [API Documentation](docs/API.md)
3. Open an issue in the repository

## 🎉 Acknowledgments

Built with:
- TypeScript for type safety
- Joi for validation
- Natural language processing libraries
- Node.js ecosystem

---

**Made with ❤️ for efficient package data collection**
