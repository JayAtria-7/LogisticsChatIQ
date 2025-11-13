# API Documentation

## Overview
The Advanced Multi-Package Data Collection Chatbot provides a modular API for integrating conversational package data collection into your applications.

## Core Components

### SessionManager
Manages session state, persistence, and user preferences.

```typescript
import { SessionManager } from './services/sessionManager';

const sessionManager = new SessionManager('./sessions');

// Start new package
sessionManager.startNewPackage();

// Update current package
sessionManager.updateCurrentPackage('packageType', 'box');

// Complete package
sessionManager.completeCurrentPackage();

// Get all packages
const packages = sessionManager.getPackages();

// Save session
await sessionManager.saveSession();

// Load session
await sessionManager.loadSession(sessionId);
```

#### Methods

##### `getSessionId(): string`
Returns the current session ID.

##### `startNewPackage(): void`
Initializes a new package in the session.

##### `updateCurrentPackage(field: string, value: any): void`
Updates a field in the current package being edited.

##### `completeCurrentPackage(): void`
Finalizes the current package and adds it to the session.

##### `getPackages(): Package[]`
Returns all completed packages in the session.

##### `saveSession(): Promise<void>`
Persists the session to disk.

##### `loadSession(sessionId: string): Promise<boolean>`
Loads a previously saved session.

##### `enableAutoSave(intervalMs?: number): void`
Enables automatic session saving at specified interval (default: 30000ms).

---

### ConversationManager
Handles dialogue flow, state transitions, and user input processing.

```typescript
import { ConversationManager } from './services/conversationManager';
import { SessionManager } from './services/sessionManager';

const sessionManager = new SessionManager();
const conversationManager = new ConversationManager(sessionManager);

// Get welcome message
const welcome = conversationManager.getWelcomeMessage();

// Process user input
const response = await conversationManager.processInput('yes');
console.log(response.message);
```

#### Methods

##### `getWelcomeMessage(): BotResponse`
Returns the initial welcome message.

##### `processInput(userInput: string): Promise<BotResponse>`
Processes user input and returns appropriate response.

**Returns:** `BotResponse`
```typescript
interface BotResponse {
  message: string;
  suggestions?: string[];
  needsInput: boolean;
  state: ConversationState;
  error?: string;
}
```

---

### NLPProcessor
Natural language processing for intent recognition and entity extraction.

```typescript
import { NLPProcessor } from './nlp/processor';

const nlp = new NLPProcessor();

// Process text
const result = nlp.process('I have a box that weighs 5 kg');

console.log(result.intent); // Intent.ADD_PACKAGE (if applicable)
console.log(result.entities); // Extracted entities
```

#### Methods

##### `process(input: string): NLPResult`
Analyzes input text and extracts intent and entities.

**Returns:** `NLPResult`
```typescript
interface NLPResult {
  intent: Intent | null;
  entities: ExtractedEntity[];
  confidence: number;
  normalizedText: string;
}

interface ExtractedEntity {
  type: EntityType;
  value: any;
  confidence: number;
  raw: string;
}
```

---

### PackageValidator
Validates package data in real-time.

```typescript
import { PackageValidator } from './validators/packageValidator';

const validator = new PackageValidator();

// Validate dimensions
const dimResult = validator.validateDimensions({
  length: 10,
  width: 5,
  height: 3,
  unit: 'cm'
});

if (!dimResult.isValid) {
  console.error(dimResult.errors);
}

// Cross-validate package
const crossResult = validator.crossValidate(package);
```

#### Methods

##### `validateDimensions(dimensions: Partial<Dimensions>): ValidationResult`
Validates package dimensions.

##### `validateWeight(weight: Partial<Weight>): ValidationResult`
Validates package weight.

##### `validateAddress(address: Partial<Address>): ValidationResult`
Validates destination address.

##### `validatePackageType(type: string): ValidationResult`
Validates package type.

##### `validatePriority(priority: string): ValidationResult`
Validates shipping priority.

##### `crossValidate(pkg: Partial<Package>): ValidationResult`
Performs cross-field validation checks.

##### `validatePackage(pkg: Package): ValidationResult`
Validates complete package data.

**Returns:** `ValidationResult`
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
```

---

### ExportService
Handles data export in multiple formats.

```typescript
import { ExportService, ExportFormat } from './services/exportService';

const exportService = new ExportService();

// Export as pretty JSON
const json = await exportService.exportSession(
  session,
  ExportFormat.JSON_PRETTY,
  './output.json'
);

// Export all formats
const files = await exportService.exportAll(session, './exports');
```

#### Methods

##### `exportSession(session: Session, format: ExportFormat, outputPath?: string): Promise<string>`
Exports session data in specified format.

**Parameters:**
- `session`: Session object to export
- `format`: Export format (JSON_PRETTY, JSON_COMPACT, CSV, SUMMARY)
- `outputPath`: Optional file path to save

**Returns:** Exported content as string

##### `exportAll(session: Session, outputDir: string): Promise<string[]>`
Exports session in all available formats.

**Returns:** Array of created file paths

##### `generateFilename(sessionId: string, format: ExportFormat): string`
Generates appropriate filename for export.

---

### ShippingCalculator
Calculates shipping costs based on package attributes.

```typescript
import { ShippingCalculator } from './utils/shippingCalculator';

const cost = ShippingCalculator.calculateCost(package);
const breakdown = ShippingCalculator.getCostBreakdown(package);
const total = ShippingCalculator.calculateTotalCost(packages);
```

#### Methods

##### `calculateCost(pkg: Partial<Package>): number`
Calculates total shipping cost for a package.

##### `getCostBreakdown(pkg: Package): { [key: string]: number }`
Returns detailed cost breakdown.

**Returns:**
```typescript
{
  baseCost: number;
  weightCost: number;
  volumeCost: number;
  fragileSurcharge?: number;
  insurance?: number;
  total: number;
}
```

##### `calculateTotalCost(packages: Package[]): number`
Calculates total cost for multiple packages.

---

## Data Models

### Package
```typescript
interface Package {
  id: string;
  packageType: PackageType;
  dimensions: Dimensions;
  weight: Weight;
  isFragile: boolean;
  priority: PriorityLevel;
  destination: Address;
  sender?: SenderInfo;
  specialInstructions?: string;
  estimatedValue?: number;
  currency?: string;
  insuranceRequired: boolean;
  trackingPreferences?: TrackingPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session
```typescript
interface Session {
  metadata: SessionMetadata;
  packages: Package[];
  conversationHistory: ConversationEntry[];
  currentPackage?: Partial<Package>;
  templates: { [key: string]: Partial<Package> };
  preferences: UserPreferences;
}
```

### ExportData
```typescript
interface ExportData {
  apiVersion: string;
  metadata: SessionMetadata;
  packages: Package[];
  validationStatus: {
    allFieldsValidated: boolean;
    invalidPackages: string[];
  };
  userInformation?: SenderInfo;
  exportedAt: Date;
}
```

## Enums

### PackageType
```typescript
enum PackageType {
  BOX = 'box',
  ENVELOPE = 'envelope',
  CRATE = 'crate',
  PALLET = 'pallet',
  TUBE = 'tube',
  OTHER = 'other'
}
```

### PriorityLevel
```typescript
enum PriorityLevel {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  SAME_DAY = 'same_day'
}
```

### ConversationState
```typescript
enum ConversationState {
  WELCOME = 'welcome',
  ASKING_PACKAGE_TYPE = 'asking_package_type',
  ASKING_DIMENSIONS = 'asking_dimensions',
  ASKING_WEIGHT = 'asking_weight',
  // ... etc
}
```

### Intent
```typescript
enum Intent {
  ADD_PACKAGE = 'add_package',
  EDIT_PACKAGE = 'edit_package',
  VIEW_SUMMARY = 'view_summary',
  CONFIRM = 'confirm',
  DENY = 'deny',
  HELP = 'help',
  SKIP = 'skip',
  // ... etc
}
```

## Usage Examples

### Basic CLI Integration
```typescript
import { ChatbotCLI } from './cli';

const cli = new ChatbotCLI();
await cli.start();
```

### Custom Integration
```typescript
import { SessionManager, ConversationManager, ExportService } from './index';

// Initialize components
const sessionManager = new SessionManager();
const conversationManager = new ConversationManager(sessionManager);
const exportService = new ExportService();

// Start conversation
let response = conversationManager.getWelcomeMessage();
console.log(response.message);

// Process user inputs
response = await conversationManager.processInput('yes');
response = await conversationManager.processInput('box');
response = await conversationManager.processInput('10 x 5 x 3 cm');
// ... continue conversation

// Export when done
const session = sessionManager.getSession();
await exportService.exportAll(session, './output');
```

### Web Service Integration
```typescript
import express from 'express';
import { SessionManager, ConversationManager } from './index';

const app = express();
const sessions = new Map();

app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  
  let manager = sessions.get(sessionId);
  if (!manager) {
    const sessionMgr = new SessionManager();
    manager = new ConversationManager(sessionMgr);
    sessions.set(sessionId, manager);
  }
  
  const response = await manager.processInput(message);
  res.json(response);
});

app.listen(3000);
```

## Error Handling

All async methods may throw errors. Wrap in try-catch:

```typescript
try {
  await sessionManager.saveSession();
} catch (error) {
  console.error('Failed to save session:', error);
}
```

## Best Practices

1. **Always enable auto-save** to prevent data loss
2. **Validate before export** using `PackageValidator`
3. **Handle state transitions** properly in custom integrations
4. **Clean up sessions** when no longer needed
5. **Use TypeScript** for type safety

## Support

For issues or questions, please refer to the README.md or open an issue in the repository.
