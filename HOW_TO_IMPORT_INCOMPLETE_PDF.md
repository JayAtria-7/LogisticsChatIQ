# How to Import PDFs with Missing Information

This guide shows you how to use the new **incomplete package completion** feature.

## Quick Start

### Step 1: Import Your PDF
1. Click the **"Import Data"** button in the sidebar
2. Select your PDF file or drag-and-drop it
3. Click **"Upload & Import"**

### Step 2: Review Results
You'll see something like this:

```
✅ Import Successful
📦 Total Records: 3
✓ Successfully Imported: 2
⚠️ Incomplete: 1
```

This means:
- **2 packages** had all required information → Already added! ✓
- **1 package** is missing some required fields → Needs your input

### Step 3: Complete Missing Information

A popup will automatically appear showing the incomplete package:

![Complete Package Modal](incomplete-modal-example.png)

**Fill in the required fields (marked with *):**
- Destination City*
- Destination Country*
- Length*
- Width*
- Height*
- Weight*

**Optional fields** (you can fill these too, but not required):
- Package Type
- State/Province
- Postal Code
- Street Address

### Step 4: Submit

Click **"Complete Package"** and you're done! The package is now added to your session with all the information.

## What You Need to Know

### Required vs Optional Fields

#### ✅ Required (Must fill to continue)
- **Destination City**: Where is this going? (e.g., "Mumbai")
- **Destination Country**: Which country? (e.g., "India")
- **Dimensions**: How big is it? (Length, Width, Height in cm)
- **Weight**: How heavy is it? (in kg)

#### ⭕ Optional (Nice to have)
- Package Type: Box, Envelope, Crate, etc.
- State/Province: For more specific location
- Postal Code: ZIP code or PIN code
- Street Address: Full delivery address

### Your Options

When the completion modal appears, you can:

1. **✅ Complete Package**: Fill in the missing info and add the package
2. **⏭️ Skip**: Close the modal and ignore the incomplete package
   - The complete packages are still imported
   - Only the incomplete ones are skipped

## Common Scenarios

### Scenario 1: E-commerce Invoice
**What the PDF has:**
```
Invoice for OnePlus 7
Ship to: Greater Noida, Uttar Pradesh, India
```

**What's missing:**
- Package dimensions
- Weight

**What you do:**
1. The completion modal appears
2. Enter dimensions: 25 x 20 x 10 cm (estimated for a phone)
3. Enter weight: 1.5 kg
4. Click "Complete Package"

### Scenario 2: Shipping Label
**What the PDF has:**
```
Package: 30x20x15 cm, 2.5 kg
Ship to: Mumbai, Maharashtra
```

**What's missing:**
- Country (which country is Maharashtra in?)

**What you do:**
1. The completion modal appears
2. Enter country: "India"
3. Click "Complete Package"

### Scenario 3: Partial Invoice
**What the PDF has:**
```
Product: Laptop
Quantity: 1
Ship to: USA
```

**What's missing:**
- City
- Dimensions
- Weight

**What you do:**
1. The completion modal appears
2. Fill in all the missing fields
3. Click "Complete Package"

## Tips for Best Results

### 📝 Have Reference Data Ready
Before importing, have nearby:
- Product dimensions (check product specs)
- Estimated weights
- Full shipping addresses

### 🎯 Use Consistent Units
The system uses:
- **Centimeters (cm)** for dimensions
- **Kilograms (kg)** for weight
- Convert if your data uses inches/pounds

### 💡 Smart Estimations
If you don't know exact dimensions:
- Small electronics: ~25x20x10 cm
- Laptops: ~40x30x5 cm
- Books: ~25x20x5 cm
- Clothing: ~30x25x10 cm

### ⚡ Batch Similar Items
If importing multiple similar packages:
- Complete the first one with accurate data
- Use those values as reference for others
- Save time on similar packages

## Troubleshooting

### "No missing fields modal appeared"
**Possible reasons:**
- All packages were complete → Great! No action needed
- No packages were extracted → Check if PDF has readable text
- JavaScript error → Check browser console (F12)

**Solution:**
- Refresh page and try again
- Make sure PDF contains actual text (not just images)
- Try a different PDF

### "I filled everything but it says error"
**Possible reasons:**
- Required fields left empty
- Invalid number format (use numbers only for dimensions/weight)
- Network connection issue

**Solution:**
- Check all fields marked with * are filled
- Make sure numbers don't have text (like "25cm" → just "25")
- Try again with stable internet

### "Package not showing in sidebar after completion"
**Possible reasons:**
- Server error during save
- Session expired

**Solution:**
- Refresh the page
- Re-import the PDF
- Check server is running (connection status)

## Example Walkthrough

Let's walk through a real example:

### 1. You have this PDF:
```
INVOICE #12345
Amazon.com

Product: OnePlus 7 Smartphone
Price: ₹29,999

SHIPPING ADDRESS:
John Doe
Sector 16, Greater Noida
Uttar Pradesh, India
201301
```

### 2. System extracts:
- ✅ Destination City: Greater Noida
- ✅ Destination State: Uttar Pradesh  
- ✅ Destination Country: India
- ✅ Postal Code: 201301
- ❌ Dimensions: Not found
- ❌ Weight: Not found

### 3. Modal appears asking for:
```
┌────────────────────────────────────┐
│ Package 1         [2 Required]     │
├────────────────────────────────────┤
│ Length* (cm)      [    25    ]     │
│ Width* (cm)       [    20    ]     │
│ Height* (cm)      [    10    ]     │
│ Weight* (kg)      [    1.5   ]     │
│                                    │
│ Already filled:                    │
│ ✓ City: Greater Noida              │
│ ✓ State: Uttar Pradesh             │
│ ✓ Country: India                   │
│ ✓ Postal Code: 201301              │
└────────────────────────────────────┘
```

### 4. You enter:
- Length: 25 (estimated for phone box)
- Width: 20
- Height: 10
- Weight: 1.5

### 5. Click "Complete Package"

### 6. Done! Package added:
```
📦 Package to Greater Noida, India
   Dimensions: 25×20×10 cm
   Weight: 1.5 kg
   Status: Ready for shipping
```

## Need More Help?

### Check the sidebar:
Look for your imported packages - they should appear as package cards

### Ask the chatbot:
Type: "Show me my packages" or "What packages do I have?"

### Check import results:
The import modal shows detailed statistics about what was imported

### Review documentation:
See `INCOMPLETE_PACKAGE_FEATURE.md` for technical details

---

**Remember:** This feature is designed to help you, not slow you down. If you have the information, great! If not, you can skip and add packages manually through the chat.

Happy importing! 📦✨
