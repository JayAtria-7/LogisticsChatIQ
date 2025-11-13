# 📥 Import Feature Guide

## Overview

The Package Collection Chatbot now supports **importing package data from external files**! You can bulk-upload packages from CSV, JSON, and PDF files instead of manually entering them through the chat interface.

---

## 🎯 Supported File Formats

### 1. **CSV (Comma-Separated Values)** 📊
Best for: Spreadsheet data, Excel exports, bulk data entry

**Required Columns:**
- `type` - Package type (box, envelope, crate, pallet, tube, other)
- `length`, `width`, `height` - Dimensions
- `dimension_unit` - Unit (cm, inch, m)
- `weight` - Weight value
- `weight_unit` - Unit (kg, lbs, g, oz)
- `city` - Destination city
- `country` - Destination country

**Optional Columns:**
- `fragile` - true/false, yes/no, 1/0
- `priority` - standard, express, overnight, same_day
- `street`, `state`, `postal_code` - Address details
- `sender_name`, `sender_email` - Sender information
- `special_instructions` - Delivery notes
- `estimated_value` - Package value
- `insurance` - true/false

**Example CSV:**
```csv
type,length,width,height,dimension_unit,weight,weight_unit,fragile,priority,street,city,state,postal_code,country,sender_name,sender_email,special_instructions,estimated_value,insurance
box,30,20,15,cm,5,kg,true,standard,123 Main St,New York,NY,10001,USA,John Doe,john@example.com,Handle with care,100,true
envelope,25,18,2,cm,0.5,kg,false,express,456 Oak Ave,Los Angeles,CA,90001,USA,Jane Smith,jane@example.com,Documents enclosed,50,false
```

### 2. **JSON (JavaScript Object Notation)** 📄
Best for: API exports, structured data, programmatic imports

**Structure Options:**

**Option A - Array format:**
```json
[
  {
    "packageType": "box",
    "dimensions": { "length": 30, "width": 20, "height": 15, "unit": "cm" },
    "weight": { "value": 5, "unit": "kg" },
    "isFragile": true,
    "priority": "standard",
    "destination": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "sender": { "name": "John Doe", "email": "john@example.com" },
    "specialInstructions": "Handle with care",
    "estimatedValue": 100,
    "insuranceRequired": true
  }
]
```

**Option B - Object with packages property:**
```json
{
  "packages": [
    { /* package 1 */ },
    { /* package 2 */ }
  ]
}
```

**Option C - Object with data property:**
```json
{
  "data": [
    { /* package 1 */ },
    { /* package 2 */ }
  ]
}
```

### 3. **PDF (Portable Document Format)** 📑
Best for: Reports, invoices, printed documents with package details

**Supported Patterns:**
The PDF parser looks for:
- Package identifiers: "Package 1", "Package #2", "Parcel 3"
- Dimensions: "10x20x30 cm" or "Length: 10, Width: 20, Height: 30"
- Weight: "5 kg", "10.5 lbs"
- Location: "City: New York", "Country: USA"
- Package Type: "Type: box"

**Note:** PDF import uses pattern matching and may require well-structured documents for best results.

---

## 🚀 How to Import

### Step 1: Access Import Feature
1. Open the chatbot web interface at `http://localhost:5000`
2. Click the **"📥 Import Data"** button in the sidebar footer

### Step 2: Upload File
**Method A - Click to Select:**
1. Click anywhere in the upload area
2. Browse and select your file
3. Click **"Upload & Import"**

**Method B - Drag & Drop:**
1. Drag your file from your computer
2. Drop it onto the upload area
3. Click **"Upload & Import"**

### Step 3: Review Results
After upload, you'll see:
- ✅ **Success message** with import statistics
- 📦 **Total records** found in file
- ✓ **Successfully imported** packages count
- ⚠️ **Warnings** for incomplete data
- ❌ **Errors** for invalid records

### Step 4: Verify Import
- Check the **packages sidebar** - imported packages appear immediately
- See **total cost** updated with new packages
- Export data to verify all fields were imported correctly

---

## 📋 Download CSV Template

Don't know where to start? Download our CSV template:

1. Click **"Import Data"** button
2. Click **"📥 Download CSV Template"** link at the bottom
3. Open in Excel, Google Sheets, or any spreadsheet software
4. Fill in your package data
5. Save and import!

**Template includes:**
- All supported columns with headers
- Sample data row showing correct format
- Ready to use - just replace sample with your data

---

## 📝 Import Guidelines

### File Requirements
- ✅ Maximum file size: **10 MB**
- ✅ Supported formats: `.csv`, `.json`, `.pdf`
- ✅ Encoding: UTF-8 recommended for CSV files
- ✅ Headers: Required for CSV files

### Data Validation
The import process validates:
- ✅ Required fields (dimensions, weight, destination)
- ✅ Valid package types and units
- ✅ Numeric values for dimensions and weight
- ✅ Proper data types (booleans, numbers, strings)

### Error Handling
- ❌ **Rows with missing required fields** are skipped
- ⚠️ **Invalid values** use sensible defaults
- 📊 **Detailed error report** shows which rows failed and why
- ✓ **Partial imports** succeed - valid rows are imported even if some fail

---

## 💡 Tips & Best Practices

### CSV Files
1. **Use the template** as your starting point
2. **Don't skip headers** - column names must match exactly
3. **Use consistent units** throughout your file
4. **Quote text fields** containing commas (e.g., "123 Main St, Apt 4")
5. **Boolean values**: Use `true/false`, `yes/no`, or `1/0`

### JSON Files
1. **Validate JSON** before importing (use jsonlint.com)
2. **Match exact field names** (case-sensitive)
3. **Use nested objects** for complex fields (dimensions, weight, address)
4. **Include required fields** at minimum
5. **Optional fields** can be omitted or set to `null`

### PDF Files
1. **Use structured documents** - tables work best
2. **Clear labels** help: "Package 1", "Weight: 5 kg"
3. **One package per section** for clearer parsing
4. **Simple layouts** parse better than complex designs
5. **Test with sample** before bulk import

### General Tips
- ✅ **Start small** - test with 2-3 packages first
- ✅ **Check results** - review import statistics
- ✅ **Fix errors** - use error messages to correct data
- ✅ **Re-import** - you can import multiple files
- ✅ **Export to verify** - export after import to confirm data

---

## 🔍 Common Issues & Solutions

### Issue: "No file uploaded"
**Solution:** Make sure file is selected before clicking "Upload & Import"

### Issue: "Invalid file type"
**Solution:** Only CSV, JSON, and PDF files are supported. Check file extension.

### Issue: "File too large"
**Solution:** File must be under 10MB. Split large files into smaller batches.

### Issue: "No package data extracted from PDF"
**Solution:** PDF may not contain recognizable patterns. Try CSV or JSON format instead.

### Issue: "Row skipped - insufficient data"
**Solution:** Row is missing required fields (dimensions, weight, or destination). Add missing data.

### Issue: All imports failed
**Solution:** 
- Check CSV headers match template exactly
- Validate JSON structure
- Ensure required fields are present
- Review error messages for specific issues

---

## 📊 Example Files

Sample files are provided in the `examples/` directory:

- **`sample-packages.csv`** - CSV format with 5 packages
- **`sample-packages.json`** - JSON format with 3 packages

Use these as references for your own imports!

---

## 🛠 Technical Details

### API Endpoint
```
POST /api/import
Content-Type: multipart/form-data

Parameters:
- file: File (required)
- sessionId: string (required)

Response:
{
  success: boolean,
  totalRecords: number,
  successfulImports: number,
  failedImports: number,
  packages: Package[],
  errors: Array<{ row: number, message: string }>,
  warnings: Array<{ row: number, message: string }>
}
```

### Template Endpoint
```
GET /api/import/template

Response: CSV file download
Content-Type: text/csv
```

---

## 🎓 Tutorial: Your First Import

Let's import 3 packages using CSV:

**1. Download the template**
```
Click "Import Data" → "Download CSV Template"
```

**2. Edit in Excel/Google Sheets**
```csv
type,length,width,height,dimension_unit,weight,weight_unit,city,country
box,30,20,15,cm,5,kg,New York,USA
envelope,25,18,2,cm,0.5,kg,Los Angeles,USA
tube,90,10,10,cm,2,kg,Chicago,USA
```

**3. Save as CSV**
```
File → Save As → package-data.csv
```

**4. Import in Chatbot**
```
1. Open chatbot
2. Click "Import Data"
3. Select package-data.csv
4. Click "Upload & Import"
5. See "Successfully imported 3 packages!"
```

**5. Verify**
```
- Check sidebar: 3 packages listed
- Click "Export Data" → "JSON" to see full details
```

**Done!** 🎉 You've successfully imported packages!

---

## 📞 Need Help?

- Check **Import Result** panel for specific error messages
- Review **sample files** in `examples/` directory
- Use **CSV template** as reference
- Test with **small files first** (2-3 packages)
- Verify **file format** matches examples above

---

## 🔄 Import + Export Workflow

**Complete Data Management:**

```
1. Import → Bulk upload existing packages (CSV/JSON/PDF)
                    ↓
2. Chat → Add more packages through conversation
                    ↓
3. Export → Download complete dataset (JSON/CSV/Summary/PDF)
                    ↓
4. Edit → Modify in Excel/editor
                    ↓
5. Re-import → Upload updated file
```

This workflow allows you to:
- ✅ Migrate data from other systems
- ✅ Bulk-update package information
- ✅ Share data between sessions
- ✅ Back up your work
- ✅ Collaborate with others

---

**Ready to import? Click that 📥 button and let's go!** 🚀
