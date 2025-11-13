# 🎯 Quick Start: Import Feature

## What's New?

✨ **Bulk Import Packages** from files instead of manually typing!

## Supported Formats

| Format | Best For | Extension |
|--------|----------|-----------|
| CSV 📊 | Excel, Spreadsheets | `.csv` |
| JSON 📄 | APIs, Structured Data | `.json` |
| PDF 📑 | Reports, Documents | `.pdf` |

## How to Import (3 Steps)

### 1️⃣ Click Import Button
- Open chatbot at `http://localhost:5000`
- Click **"📥 Import Data"** in sidebar

### 2️⃣ Upload File
- **Click** to browse OR **Drag & Drop** file
- Supports: CSV, JSON, PDF (max 10MB)

### 3️⃣ Review & Done!
- See import results
- Packages appear in sidebar automatically
- Start chatting or export!

## Get Started Fast

### Option 1: Use Template
```bash
1. Click "Import Data"
2. Click "Download CSV Template"
3. Fill in your data
4. Upload!
```

### Option 2: Use Sample Files
```bash
Import these files from examples/ folder:
- sample-packages.csv (5 packages)
- sample-packages.json (3 packages)
```

### Option 3: Create Your Own

**Minimum CSV:**
```csv
type,length,width,height,dimension_unit,weight,weight_unit,city,country
box,30,20,15,cm,5,kg,New York,USA
envelope,25,18,2,cm,0.5,kg,Los Angeles,USA
```

**Minimum JSON:**
```json
{
  "packages": [
    {
      "packageType": "box",
      "dimensions": {"length": 30, "width": 20, "height": 15, "unit": "cm"},
      "weight": {"value": 5, "unit": "kg"},
      "destination": {"city": "New York", "country": "USA"}
    }
  ]
}
```

## Required Fields

For successful import, each package MUST have:
- ✅ **Dimensions** (length, width, height, unit)
- ✅ **Weight** (value, unit)
- ✅ **Destination** (city, country minimum)

## Optional Fields

Make imports richer with:
- Package type (box, envelope, crate, pallet, tube)
- Priority (standard, express, overnight, same_day)
- Fragile flag
- Address details (street, state, postal code)
- Sender info (name, email)
- Special instructions
- Estimated value
- Insurance

## Common CSV Columns

```
type, length, width, height, dimension_unit,
weight, weight_unit, fragile, priority,
street, city, state, postal_code, country,
sender_name, sender_email, special_instructions,
estimated_value, insurance
```

## Workflow

```
Import Files → Review Results → Chat/Add More → Export → Edit → Re-Import
```

## Tips

💡 **Start Small** - Test with 2-3 packages first
💡 **Use Template** - Download and modify it
💡 **Check Errors** - Review import results carefully
💡 **Partial Success OK** - Valid rows import even if some fail
💡 **Export to Verify** - Export after import to check data

## File Limits

- **Max Size:** 10 MB
- **Formats:** .csv, .json, .pdf only
- **Encoding:** UTF-8 recommended

## Example Import Flow

```bash
# 1. Download template
http://localhost:5000 → Import Data → Download CSV Template

# 2. Add your packages (in Excel/Sheets)
box,30,20,15,cm,5,kg,true,standard,...

# 3. Save as CSV
File → Save As → my-packages.csv

# 4. Import
Import Data → Upload my-packages.csv → Upload & Import

# 5. Success!
"Successfully imported X packages!"
```

## Need Full Documentation?

📖 Read **IMPORT_GUIDE.md** for:
- Detailed format specifications
- Error troubleshooting
- Advanced examples
- API documentation
- PDF import patterns

## Quick Test

Want to try right now?

1. **Open browser:** `http://localhost:5000`
2. **Click:** "📥 Import Data"
3. **Upload:** `examples/sample-packages.csv`
4. **See:** 5 packages imported instantly! 🎉

---

**Ready? Let's import!** 🚀

```
examples/
├── sample-packages.csv  ← Try this first!
└── sample-packages.json ← Or this!
```
