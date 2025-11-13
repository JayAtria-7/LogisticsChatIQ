# Advanced Multi-Package Data Collection Chatbot - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Using the Chatbot](#using-the-chatbot)
3. [Commands and Features](#commands-and-features)
4. [Data Collection Flow](#data-collection-flow)
5. [Tips and Best Practices](#tips-and-best-practices)
6. [Exporting Data](#exporting-data)

## Getting Started

### Installation
```bash
npm install
```

### Running the Chatbot
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Using the Chatbot

### Basic Interaction
The chatbot communicates in natural language. You can answer questions naturally without strict formatting.

**Examples:**
- Instead of typing exact values, you can say: "it's a small box"
- For dimensions: "10 by 5 by 3 centimeters" or "10 x 5 x 3 cm"
- For weight: "about 5 kilos" or "5 kg"

### Starting a Session
When you launch the chatbot, it will greet you and ask if you want to add a package. Simply type "yes" or "add package" to begin.

## Commands and Features

### Global Commands
These commands work at any point in the conversation:

| Command | Description |
|---------|-------------|
| `help` | Display help information and available commands |
| `summary` | View all packages added so far |
| `finish` | Complete the session and prepare for export |
| `cancel` | Cancel the current session and clear all data |
| `pause` | Save the session and resume later |
| `export` | Export all package data to files |
| `cost` | Calculate estimated shipping costs |
| `exit` / `quit` | Exit the application |

### Navigation Commands

| Command | Description |
|---------|-------------|
| `skip` | Skip optional fields |
| `same as last` | Copy value from the previous package |
| `edit` | Edit the current package |
| `yes` / `no` | Confirm or deny |

## Data Collection Flow

The chatbot collects the following information for each package:

### 1. Package Type
**Question:** What type of package are you shipping?

**Options:**
- Box
- Envelope
- Crate
- Pallet
- Tube
- Other

**Examples:**
- "box"
- "it's a small envelope"
- "crate"

### 2. Dimensions
**Question:** What are the dimensions?

**Format:** Length x Width x Height Unit

**Examples:**
- "10 x 5 x 3 cm"
- "12 x 8 x 6 inches"
- "Length 10, width 5, height 3 cm"

**Supported Units:**
- cm (centimeters)
- inch / inches / in
- m (meters)

### 3. Weight
**Question:** What's the weight?

**Format:** Value Unit

**Examples:**
- "5 kg"
- "10 lbs"
- "500 g"

**Supported Units:**
- kg (kilograms)
- lbs / pounds
- g (grams)
- oz (ounces)

### 4. Fragile Status
**Question:** Is this package fragile?

**Answer:** yes / no

### 5. Priority Level
**Question:** What's the shipping priority?

**Options:**
- Standard (regular delivery)
- Express (faster delivery)
- Overnight (next day)
- Same Day (same day delivery)

**Examples:**
- "express"
- "I need it overnight"
- "standard shipping is fine"

### 6. Destination Address
**Question:** Where is this package being shipped to?

**Format:**
```
Street address
City, State ZIP
Country
```

**Example:**
```
123 Main Street
New York, NY 10001
USA
```

### 7. Sender Information (Optional)
**Question:** Who is the sender?

**Format:** Name, Email, Phone (optional)

**Examples:**
- "John Doe, john@example.com, 555-1234"
- "Jane Smith" (minimal)
- Type "skip" to skip

### 8. Special Instructions (Optional)
**Question:** Any special handling instructions?

**Examples:**
- "Handle with care"
- "Leave at front door"
- "Signature required"
- Type "skip" to skip

### 9. Estimated Value (Optional)
**Question:** What is the estimated value?

**Examples:**
- "100"
- "$250.50"
- Type "skip" to skip

### 10. Insurance
**Question:** Would you like to add insurance?

**Answer:** yes / no

### 11. Tracking Preferences (Optional)
**Question:** What tracking preferences would you like?

**Options:**
- Email notifications
- SMS notifications
- Signature required

**Examples:**
- "email and SMS"
- "just email"
- Type "skip" for none

### 12. Confirmation
The chatbot will show a summary of your package. Confirm if correct or type "edit" to make changes.

## Tips and Best Practices

### Using Natural Language
✓ **DO:**
- "small box, about 5 kg"
- "express shipping please"
- "same destination as the last one"

✗ **DON'T:**
- Worry about exact formatting
- Re-enter information you've already provided

### Saving Time with Shortcuts

**1. Same as Last**
If you're shipping multiple similar packages:
```
Bot: What are the dimensions?
You: same as last
```

**2. Templates**
Save frequently used configurations:
```
You: save as template "standard_box"
You: use template "standard_box"
```

**3. Batch Operations**
```
You: make all packages express priority
You: 5 packages with same specs
```

### Handling Errors
If the chatbot doesn't understand:
1. Try rephrasing your answer
2. Type "help" for guidance
3. Use more explicit values (e.g., "5 kg" instead of "five kilos")

You get 3 attempts per field before the chatbot suggests skipping.

### Reviewing Your Work
At any time, type `summary` to see all packages you've added.

## Exporting Data

### Export Formats

#### 1. JSON (Default)
Complete package data in JSON format.

```bash
You: export
```

Creates:
- `package-export-XXXXXX.json` (pretty-printed)
- Includes all metadata, validation status, and packages

#### 2. CSV
Spreadsheet-compatible format.

File includes:
- All package details in columns
- Easy to import into Excel or Google Sheets

#### 3. Human-Readable Summary
Text file with formatted package information.

File includes:
- Session metadata
- Detailed package information
- Cost breakdown

### Export Location
All exports are saved to the `./exports` directory.

### Automatic Saving
The chatbot automatically saves your session every 30 seconds. If you disconnect, you can resume using your Session ID.

## Example Session

```
Bot: Welcome! Would you like to add your first package?

You: yes

Bot: What type of package are you shipping?

You: box

Bot: What are the dimensions?

You: 30 x 20 x 15 cm

Bot: What's the weight?

You: 5 kg

Bot: Is this package fragile?

You: no

Bot: What's the shipping priority?

You: express

Bot: Where is this package being shipped to?

You: 123 Main Street
     Los Angeles, CA 90001
     USA

Bot: Who is the sender?

You: skip

Bot: Any special handling instructions?

You: skip

Bot: What is the estimated value?

You: 200

Bot: Would you like to add insurance?

You: yes

Bot: What tracking preferences would you like?

You: email

Bot: [Shows package summary]
     Is this information correct?

You: yes

Bot: Package saved successfully! Would you like to add another package?

You: no, I'm done

Bot: Session completed! Total packages: 1

You: export

Bot: Export successful!
     Files created:
     📄 ./exports/package-export-12345678.json
     📄 ./exports/package-export-12345678.csv
     📄 ./exports/package-export-12345678.txt
```

## Troubleshooting

### Common Issues

**Problem:** Chatbot doesn't understand my input
**Solution:** Try using more explicit values or different phrasing

**Problem:** Made a mistake in a previous field
**Solution:** Wait for package summary, then type "edit"

**Problem:** Session was interrupted
**Solution:** Note your Session ID and use it to resume

**Problem:** Export failed
**Solution:** Check that you have write permissions in the exports directory

## Advanced Features

### Session Management
- **Auto-save:** Enabled by default every 30 seconds
- **Resume:** Use Session ID to continue later
- **Multiple sessions:** Can manage multiple independent sessions

### Cost Calculation
Type `cost` at any time to see:
- Individual package costs
- Cost breakdowns (base, weight, volume, surcharges)
- Total estimated shipping cost

### Smart Suggestions
The chatbot learns from your session:
- Remembers common addresses
- Suggests package types based on dimensions
- Auto-completes based on previous entries

## Need Help?

Type `help` at any time during your session for quick assistance!
