# Sample Invoice for PDF Import Testing

This document simulates an e-commerce invoice similar to the one you provided.

---

**INVOICE**

**Sold By:**
Darshita Aashiyana Private Limited
Unit No. 1, Khewat/ Khata No: 373/ 400 Mustatil No 31
Village Taoru, Tehsil Taoru, District Mewat
On Bilaspur Taoru Road
Mewat, Haryana, 122105
IN

PAN No: AAFCD6883Q
GST Registration No: 06AAFCD6883Q1ZU

**Order Details:**
Order Number: 407-8153595-7245952
Order Date: 10.08.2019
Invoice Number: DEL2-68786
Invoice Details: HR-DEL2-179184911-1920
Invoice Date: 10.08.2019

---

**Billing Address:**
karthik
C1001 ace city, sector1
GREATER NOIDA, UTTAR PRADESH, 201306
IN

**Shipping Address:**
karthik
C1001 ace city, sector1
GREATER NOIDA, UTTAR PRADESH, 201306
IN

---

**Product Details:**

| Sl. No | Description | Unit Price | Qty | Net Amount | Tax Rate | Tax Type | Tax Amount | Total Amount |
|--------|-------------|------------|-----|------------|----------|----------|------------|--------------|
| 1 | OnePlus 7 (Mirror Blue, 6GB RAM, 128GB Storage) B07HGMLBW1 (OP7-NBLUE-6-128GB) HSN:8517 | ₹29,463.39 | 1 | ₹29,463.39 | 12% | IGST | ₹3,535.61 | ₹32,999.00 |

**TOTAL:** ₹32,999.00

**Amount in Words:**
Thirty-two Thousand Nine Hundred And Ninety-nine only

---

For Darshita Aashiyana Private Limited:

Authorized Signatory

---

**Expected Import Result:**
When this invoice is imported, the system should create a package with:
- **Destination:** Greater Noida, Uttar Pradesh, India
- **Package Type:** Box (inferred from electronics)
- **Fragile:** Yes (smartphone)
- **Dimensions:** ~25x20x10 cm (estimated for phone)
- **Weight:** ~1.5 kg (estimated)
- **Description:** OnePlus 7 smartphone

The enhanced parser now:
1. Detects "Shipping Address" section
2. Extracts city, state, postal code, and country
3. Identifies the product (OnePlus 7 smartphone)
4. Infers package characteristics based on product type
5. Creates a package with estimated dimensions and weight
