import { Package, PackageType, PriorityLevel, DimensionUnit, WeightUnit, Address } from '../models/types';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

/**
 * Supported import file formats
 */
export enum ImportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
  TXT = 'txt'
}

/**
 * Incomplete package requiring user input
 */
export interface IncompletePackage {
  id: string;
  partialData: Partial<Package>;
  missingFields: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'boolean';
    options?: string[];
    required: boolean;
  }>;
  extractedText?: string;
}

/**
 * Import result with statistics
 */
export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  packages: Package[];
  incompletePackages?: IncompletePackage[];
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
}

/**
 * CSV row structure
 */
interface CSVRow {
  type?: string;
  length?: string;
  width?: string;
  height?: string;
  dimension_unit?: string;
  weight?: string;
  weight_unit?: string;
  fragile?: string;
  priority?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  sender_name?: string;
  sender_email?: string;
  special_instructions?: string;
  estimated_value?: string;
  insurance?: string;
  [key: string]: string | undefined;
}

/**
 * Service for importing package data from various file formats
 */
export class ImportService {
  /**
   * Import packages from file buffer
   */
  async importFromFile(
    fileBuffer: Buffer,
    format: ImportFormat,
    fileName: string
  ): Promise<ImportResult> {
    try {
      switch (format) {
        case ImportFormat.CSV:
          return await this.importFromCSV(fileBuffer);
        case ImportFormat.JSON:
          return await this.importFromJSON(fileBuffer);
        case ImportFormat.PDF:
          return await this.importFromPDF(fileBuffer);
        case ImportFormat.TXT:
          return await this.importFromTXT(fileBuffer);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        totalRecords: 0,
        successfulImports: 0,
        failedImports: 0,
        packages: [],
        errors: [{ row: 0, message: `Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        warnings: []
      };
    }
  }

  /**
   * Import from CSV file
   */
  private async importFromCSV(fileBuffer: Buffer): Promise<ImportResult> {
    const csvContent = fileBuffer.toString('utf-8');
    const result: ImportResult = {
      success: true,
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      packages: [],
      errors: [],
      warnings: []
    };

    return new Promise((resolve) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (parseResult) => {
          const rows = parseResult.data as CSVRow[];
          result.totalRecords = rows.length;

          rows.forEach((row, index) => {
            try {
              const pkg = this.parseCSVRow(row, index + 2); // +2 for header row and 1-based indexing
              
              if (pkg) {
                result.packages.push(pkg);
                result.successfulImports++;
              } else {
                result.failedImports++;
                result.warnings.push({
                  row: index + 2,
                  message: 'Row skipped - insufficient data'
                });
              }
            } catch (error) {
              result.failedImports++;
              result.errors.push({
                row: index + 2,
                message: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          });

          result.success = result.successfulImports > 0;
          resolve(result);
        },
        error: (error: Error) => {
          result.success = false;
          result.errors.push({ row: 0, message: `CSV parsing error: ${error.message}` });
          resolve(result);
        }
      });
    });
  }

  /**
   * Parse a single CSV row into a Package
   */
  private parseCSVRow(row: CSVRow, rowNumber: number): Package | null {
    // Try to find city/country in various column name formats
    const findValue = (row: CSVRow, ...keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()];
        if (value && value.trim()) return value.trim();
      }
      // Try fuzzy match - check all keys in row
      for (const rowKey of Object.keys(row)) {
        const normalizedKey = rowKey.toLowerCase().replace(/[_\s-]/g, '');
        for (const searchKey of keys) {
          const normalizedSearch = searchKey.toLowerCase().replace(/[_\s-]/g, '');
          if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
            const value = row[rowKey];
            if (value && value.trim()) return value.trim();
          }
        }
      }
      return undefined;
    };

    const city = findValue(row, 'city', 'destination_city', 'dest_city', 'destinationcity');
    const country = findValue(row, 'country', 'destination_country', 'dest_country', 'destinationcountry');

    // Accept ANY row that has at least some data - even if no city/country
    const hasAnyData = Object.values(row).some(val => val && val.trim());
    if (!hasAnyData) {
      return null; // Skip completely empty rows
    }

    const now = new Date();
    
    const pkg: Package = {
      id: uuidv4(),
      packageType: this.parsePackageType(findValue(row, 'type', 'package_type', 'packagetype') || 'box'),
      dimensions: {
        length: parseFloat(findValue(row, 'length', 'len', 'l') || '0') || 10,
        width: parseFloat(findValue(row, 'width', 'w') || '0') || 10,
        height: parseFloat(findValue(row, 'height', 'h', 'ht') || '0') || 10,
        unit: this.parseDimensionUnit(findValue(row, 'dimension_unit', 'dim_unit', 'unit') || 'cm')
      },
      weight: {
        value: parseFloat(findValue(row, 'weight', 'wt', 'weight_value') || '0') || 1,
        unit: this.parseWeightUnit(findValue(row, 'weight_unit', 'wt_unit') || 'kg')
      },
      isFragile: this.parseBoolean(findValue(row, 'fragile', 'is_fragile')),
      priority: this.parsePriority(findValue(row, 'priority', 'shipping_priority') || 'standard'),
      destination: {
        street: findValue(row, 'street', 'address', 'destination_street', 'dest_street') || '',
        city: city || 'Unknown',
        state: findValue(row, 'state', 'province', 'destination_state', 'dest_state') || '',
        postalCode: findValue(row, 'postal_code', 'zip', 'zipcode', 'postcode', 'destination_postal') || '',
        country: country || 'Unknown'
      },
      sender: findValue(row, 'sender_name', 'sender', 'from') ? {
        name: findValue(row, 'sender_name', 'sender', 'from') || '',
        email: findValue(row, 'sender_email', 'email')
      } : undefined,
      specialInstructions: findValue(row, 'special_instructions', 'instructions', 'notes'),
      estimatedValue: findValue(row, 'estimated_value', 'value', 'amount') ? parseFloat(findValue(row, 'estimated_value', 'value', 'amount')!) : undefined,
      insuranceRequired: this.parseBoolean(findValue(row, 'insurance', 'insurance_required')),
      createdAt: now,
      updatedAt: now
    };

    return pkg;
  }

  /**
   * Import from JSON file
   */
  private async importFromJSON(fileBuffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      packages: [],
      errors: [],
      warnings: []
    };

    try {
      const jsonContent = fileBuffer.toString('utf-8');
      const data = JSON.parse(jsonContent);

      // Support different JSON structures
      let packagesArray: any[] = [];
      
      if (Array.isArray(data)) {
        packagesArray = data;
      } else if (data.packages && Array.isArray(data.packages)) {
        packagesArray = data.packages;
      } else if (data.data && Array.isArray(data.data)) {
        packagesArray = data.data;
      } else {
        throw new Error('Invalid JSON format. Expected an array of packages or an object with a "packages" property.');
      }

      result.totalRecords = packagesArray.length;

      packagesArray.forEach((item, index) => {
        try {
          const pkg = this.parseJSONPackage(item, index);
          if (pkg) {
            result.packages.push(pkg);
            result.successfulImports++;
          } else {
            result.failedImports++;
            result.warnings.push({
              row: index + 1,
              message: 'Package skipped - insufficient data'
            });
          }
        } catch (error) {
          result.failedImports++;
          result.errors.push({
            row: index + 1,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      result.success = result.successfulImports > 0;
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        message: `JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return result;
  }

  /**
   * Parse a JSON object into a Package
   */
  private parseJSONPackage(data: any, index: number): Package | null {
    // Accept ANY object that has at least some data
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return null; // Skip empty objects
    }

    const now = new Date();

    const pkg: Package = {
      id: data.id || uuidv4(),
      packageType: this.parsePackageType(data.packageType || data.type || 'box'),
      dimensions: data.dimensions ? {
        length: parseFloat(data.dimensions.length) || 10,
        width: parseFloat(data.dimensions.width) || 10,
        height: parseFloat(data.dimensions.height) || 10,
        unit: this.parseDimensionUnit(data.dimensions.unit || 'cm')
      } : {
        length: 10,
        width: 10,
        height: 10,
        unit: DimensionUnit.CM
      },
      weight: data.weight ? {
        value: parseFloat(data.weight.value) || 1,
        unit: this.parseWeightUnit(data.weight.unit || 'kg')
      } : {
        value: 1,
        unit: WeightUnit.KG
      },
      isFragile: data.isFragile !== undefined ? Boolean(data.isFragile) : false,
      priority: this.parsePriority(data.priority || 'standard'),
      destination: data.destination ? {
        street: data.destination.street || '',
        city: data.destination.city || 'Unknown',
        state: data.destination.state || '',
        postalCode: data.destination.postalCode || data.destination.postal_code || '',
        country: data.destination.country || 'Unknown'
      } : {
        street: '',
        city: 'Unknown',
        state: '',
        postalCode: '',
        country: 'Unknown'
      },
      sender: data.sender,
      specialInstructions: data.specialInstructions || data.special_instructions,
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : undefined,
      currency: data.currency,
      insuranceRequired: data.insuranceRequired !== undefined ? Boolean(data.insuranceRequired) : false,
      trackingPreferences: data.trackingPreferences,
      createdAt: data.createdAt ? new Date(data.createdAt) : now,
      updatedAt: now
    };

    return pkg;
  }

  /**
   * Import from PDF file
   */
  private async importFromPDF(fileBuffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      packages: [],
      incompletePackages: [],
      errors: [],
      warnings: []
    };

    try {
      // Use pdf-parse correctly: it exports a PDFParse class
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: fileBuffer });
      const pdfData = await parser.getText();
      const text = (pdfData && pdfData.text) ? pdfData.text : (typeof pdfData === 'string' ? pdfData : '');

      // Try to extract structured data from PDF text
      const packages = this.extractPackagesFromText(text);
      
      result.totalRecords = packages.length;

      // Validate each package and separate complete from incomplete
      for (const pkg of packages) {
        const validation = this.validatePackage(pkg);
        
        if (validation.isComplete) {
          result.packages.push(pkg);
          result.successfulImports++;
        } else {
          // Create incomplete package for user to fill in
          const incompletePackage: IncompletePackage = {
            id: uuidv4(),
            partialData: pkg,
            missingFields: validation.missingFields,
            extractedText: text.substring(0, 500) // First 500 chars for context
          };
          result.incompletePackages!.push(incompletePackage);
        }
      }

      result.success = result.packages.length > 0 || result.incompletePackages!.length > 0;

      if (packages.length === 0) {
        result.warnings.push({
          row: 0,
          message: 'No package data could be extracted from PDF. Please ensure the PDF contains structured package information.'
        });
      } else if (result.incompletePackages!.length > 0) {
        result.warnings.push({
          row: 0,
          message: `Found ${result.incompletePackages!.length} package(s) with missing information. Please review and complete the required fields.`
        });
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        message: `PDF parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return result;
  }

  /**
   * Import packages from TXT file
   * Supports plain text with structured or semi-structured format
   */
  private async importFromTXT(fileBuffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      packages: [],
      incompletePackages: [],
      errors: [],
      warnings: []
    };

    try {
      const text = fileBuffer.toString('utf-8');
      
      // Try to extract structured data from text
      const packages = this.extractPackagesFromText(text);
      
      result.totalRecords = packages.length;

      // Validate each package and separate complete from incomplete
      for (const pkg of packages) {
        const validation = this.validatePackage(pkg);
        
        if (validation.isComplete) {
          result.packages.push(pkg);
          result.successfulImports++;
        } else {
          // Create incomplete package for user to fill in
          const incompletePackage: IncompletePackage = {
            id: uuidv4(),
            partialData: pkg,
            missingFields: validation.missingFields,
            extractedText: text.substring(0, 500) // First 500 chars for context
          };
          result.incompletePackages!.push(incompletePackage);
        }
      }

      result.success = result.packages.length > 0 || result.incompletePackages!.length > 0;

      if (packages.length === 0) {
        result.warnings.push({
          row: 0,
          message: 'No package data could be extracted from text file. Supported formats: CSV-like, JSON-like, or key-value pairs.'
        });
      } else if (result.incompletePackages!.length > 0) {
        result.warnings.push({
          row: 0,
          message: `Found ${result.incompletePackages!.length} package(s) with missing information. Please review and complete the required fields.`
        });
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        message: `TXT parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return result;
  }

  /**
   * Validate package and identify missing required fields
   */
  private validatePackage(pkg: Package): {
    isComplete: boolean;
    missingFields: Array<{
      field: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'boolean';
      options?: string[];
      required: boolean;
    }>;
  } {
    const missingFields: Array<{
      field: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'boolean';
      options?: string[];
      required: boolean;
    }> = [];

    // Check required fields
    if (!pkg.destination.city || pkg.destination.city.trim() === '') {
      missingFields.push({
        field: 'destination.city',
        label: 'Destination City',
        type: 'text',
        required: true
      });
    }

    if (!pkg.destination.country || pkg.destination.country.trim() === '') {
      missingFields.push({
        field: 'destination.country',
        label: 'Destination Country',
        type: 'text',
        required: true
      });
    }

    if (!pkg.dimensions.length || pkg.dimensions.length <= 0) {
      missingFields.push({
        field: 'dimensions.length',
        label: 'Length',
        type: 'number',
        required: true
      });
    }

    if (!pkg.dimensions.width || pkg.dimensions.width <= 0) {
      missingFields.push({
        field: 'dimensions.width',
        label: 'Width',
        type: 'number',
        required: true
      });
    }

    if (!pkg.dimensions.height || pkg.dimensions.height <= 0) {
      missingFields.push({
        field: 'dimensions.height',
        label: 'Height',
        type: 'number',
        required: true
      });
    }

    if (!pkg.weight || !pkg.weight.value || pkg.weight.value <= 0) {
      missingFields.push({
        field: 'weight.value',
        label: 'Weight',
        type: 'number',
        required: true
      });
    }

    // Optional but commonly needed fields
    if (!pkg.packageType || pkg.packageType === PackageType.BOX) {
      missingFields.push({
        field: 'packageType',
        label: 'Package Type',
        type: 'select',
        options: Object.values(PackageType),
        required: false
      });
    }

    if (!pkg.destination.state || pkg.destination.state.trim() === '') {
      missingFields.push({
        field: 'destination.state',
        label: 'State/Province',
        type: 'text',
        required: false
      });
    }

    if (!pkg.destination.postalCode || pkg.destination.postalCode.trim() === '') {
      missingFields.push({
        field: 'destination.postalCode',
        label: 'Postal Code',
        type: 'text',
        required: false
      });
    }

    return {
      isComplete: missingFields.filter(f => f.required).length === 0,
      missingFields
    };
  }

  /**
   * Complete an incomplete package with user-provided data
   */
  public completePackage(incompleteId: string, fieldValues: Record<string, any>): Package | null {
    // This method will be called from the API endpoint
    // For now, just create and return the completed package
    const partialData = fieldValues.partialData as Partial<Package>;
    const now = new Date();

    // Deep merge the partial data with the new field values
    const completedPackage: Package = {
      id: partialData.id || uuidv4(),
      packageType: fieldValues.packageType || partialData.packageType || PackageType.BOX,
      dimensions: {
        length: parseFloat(fieldValues['dimensions.length']) || partialData.dimensions?.length || 0,
        width: parseFloat(fieldValues['dimensions.width']) || partialData.dimensions?.width || 0,
        height: parseFloat(fieldValues['dimensions.height']) || partialData.dimensions?.height || 0,
        unit: fieldValues['dimensions.unit'] || partialData.dimensions?.unit || DimensionUnit.CM
      },
      weight: {
        value: parseFloat(fieldValues['weight.value']) || partialData.weight?.value || 0,
        unit: fieldValues['weight.unit'] || partialData.weight?.unit || WeightUnit.KG
      },
      isFragile: fieldValues.isFragile !== undefined ? Boolean(fieldValues.isFragile) : (partialData.isFragile || false),
      priority: fieldValues.priority || partialData.priority || PriorityLevel.STANDARD,
      destination: {
        street: fieldValues['destination.street'] || partialData.destination?.street || '',
        city: fieldValues['destination.city'] || partialData.destination?.city || '',
        state: fieldValues['destination.state'] || partialData.destination?.state || '',
        postalCode: fieldValues['destination.postalCode'] || partialData.destination?.postalCode || '',
        country: fieldValues['destination.country'] || partialData.destination?.country || ''
      },
      sender: partialData.sender,
      specialInstructions: fieldValues.specialInstructions || partialData.specialInstructions,
      estimatedValue: fieldValues.estimatedValue ? parseFloat(fieldValues.estimatedValue) : partialData.estimatedValue,
      currency: fieldValues.currency || partialData.currency,
      insuranceRequired: fieldValues.insuranceRequired !== undefined ? Boolean(fieldValues.insuranceRequired) : (partialData.insuranceRequired || false),
      trackingPreferences: partialData.trackingPreferences,
      createdAt: partialData.createdAt || now,
      updatedAt: now
    };

    return completedPackage;
  }

  /**
   * Extract package data from PDF text using pattern matching
   */
  private extractPackagesFromText(text: string): Package[] {
    const packages: Package[] = [];
    const now = new Date();

    // Try different extraction strategies
    
    // First, try to extract from exported summary format (📦 PACKAGE format)
    const summaryPackages = this.extractFromSummary(text, now);
    if (summaryPackages.length > 0) {
      return summaryPackages;
    }

    const invoicePackages = this.extractFromInvoice(text, now);
    if (invoicePackages.length > 0) {
      return invoicePackages;
    }

    const manifestPackages = this.extractFromManifest(text, now);
    if (manifestPackages.length > 0) {
      return manifestPackages;
    }

    return packages;
  }

  /**
   * Extract package data from exported summary format (📦 PACKAGE 1, etc.)
   */
  private extractFromSummary(text: string, timestamp: Date): Package[] {
    const packages: Package[] = [];
    
    // Split by package sections using various markers
    const packageSections = text.split(/(?:📦\s*PACKAGE\s+\d+|─{10,})/i).filter(s => s.trim().length > 50);
    
    for (const section of packageSections) {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const pkg: Partial<Package> = {
        id: uuidv4(),
        destination: {} as Address
      };
      
      for (const line of lines) {
        // Extract Type
        if (/Type:\s*(\w+)/i.test(line)) {
          const match = line.match(/Type:\s*(\w+)/i);
          if (match) pkg.packageType = this.parsePackageType(match[1]);
        }
        
        // Extract Dimensions (30 × 20 × 15 cm format)
        if (/Dimensions:\s*(\d+\.?\d*)\s*[×x]\s*(\d+\.?\d*)\s*[×x]\s*(\d+\.?\d*)\s*(cm|inch|m|mm)/i.test(line)) {
          const match = line.match(/Dimensions:\s*(\d+\.?\d*)\s*[×x]\s*(\d+\.?\d*)\s*[×x]\s*(\d+\.?\d*)\s*(cm|inch|m|mm)/i);
          if (match) {
            pkg.dimensions = {
              length: parseFloat(match[1]),
              width: parseFloat(match[2]),
              height: parseFloat(match[3]),
              unit: this.parseDimensionUnit(match[4])
            };
          }
        }
        
        // Extract Weight
        if (/Weight:\s*(\d+\.?\d*)\s*(kg|g|lbs|oz)/i.test(line)) {
          const match = line.match(/Weight:\s*(\d+\.?\d*)\s*(kg|g|lbs|oz)/i);
          if (match) {
            pkg.weight = {
              value: parseFloat(match[1]),
              unit: this.parseWeightUnit(match[2])
            };
          }
        }
        
        // Extract Fragile
        if (/Fragile:\s*(Yes|No|⚠️)/i.test(line)) {
          pkg.isFragile = /Yes|⚠️/i.test(line);
        }
        
        // Extract Priority
        if (/Priority:\s*(\w+)/i.test(line)) {
          const match = line.match(/Priority:\s*(\w+)/i);
          if (match) {
            const priority = match[1].toUpperCase();
            pkg.priority = priority as PriorityLevel || PriorityLevel.STANDARD;
          }
        }
        
        // Extract destination city, state, postal code, country
        // Look for patterns like: "New York, Uttar Pradesh 201306"
        const locationMatch = line.match(/([A-Za-z\s]+),\s*([A-Za-z\s]+)\s+(\d{5,6})/);
        if (locationMatch) {
          (pkg.destination as Address).city = locationMatch[1].trim();
          (pkg.destination as Address).state = locationMatch[2].trim();
          (pkg.destination as Address).postalCode = locationMatch[3];
        }
        
        // Extract country (line with just country name or "India", "USA", etc.)
        if (/^\s*(India|USA|United States|UK|United Kingdom|Canada|Australia)\s*$/i.test(line)) {
          (pkg.destination as Address).country = this.expandCountryCode(line.trim());
        }
        
        // Extract street address
        if (line.includes(',') && line.length > 20 && !line.includes(':') && !locationMatch) {
          const dest = pkg.destination as Address;
          if (!dest.street || dest.street === '') {
            dest.street = line;
          }
        }
        
        // Extract special instructions
        if (/SPECIAL INSTRUCTIONS:/i.test(line)) {
          const nextLineIdx = lines.indexOf(line) + 1;
          if (nextLineIdx < lines.length) {
            pkg.specialInstructions = lines[nextLineIdx];
          }
        }
        
        // Extract value
        if (/VALUE:\s*USD\s*(\d+\.?\d*)/i.test(line)) {
          const match = line.match(/VALUE:\s*USD\s*(\d+\.?\d*)/i);
          if (match) {
            pkg.estimatedValue = parseFloat(match[1]);
          }
        }
        
        // Extract insurance
        if (/INSURANCE:\s*(YES|NO)/i.test(line)) {
          pkg.insuranceRequired = /YES/i.test(line);
        }
      }
      
      // Validate and add package
      if (this.isValidPackage(pkg)) {
        packages.push(this.finalizePackage(pkg, timestamp));
      }
    }
    
    return packages;
  }

  /**
   * Extract package data from invoice/order documents
   */
  private extractFromInvoice(text: string, timestamp: Date): Package[] {
    const packages: Package[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract shipping address
    let shippingAddress: Partial<Address> = {};
    let itemDescription = '';
    let quantity = 1;
    
    // Find shipping address section
    let inShippingSection = false;
    let addressLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect shipping address section
      if (/shipping\s+address/i.test(line)) {
        inShippingSection = true;
        addressLines = [];
        continue;
      }
      
      // End of shipping section
      if (inShippingSection && (/invoice|order|total|amount|for\s+\w+:/i.test(line) || line.startsWith('₹'))) {
        inShippingSection = false;
      }
      
      // Collect address lines
      if (inShippingSection && line.length > 0 && !line.includes(':')) {
        addressLines.push(line);
      }
      
      // Parse address components
      const cityStateMatch = line.match(/^([A-Z\s]+),\s*([A-Z\s]+),\s*(\d{6})/);
      if (cityStateMatch) {
        shippingAddress.city = this.toTitleCase(cityStateMatch[1].trim());
        shippingAddress.state = this.toTitleCase(cityStateMatch[2].trim());
        shippingAddress.postalCode = cityStateMatch[3];
      }
      
      // Extract country (usually "IN" or full country name)
      if (/^IN$|^USA$|^UK$|^INDIA$/i.test(line)) {
        shippingAddress.country = this.expandCountryCode(line);
      }
      
      // Extract item description (product name)
      if (/description|item|product/i.test(line) && i + 1 < lines.length) {
        itemDescription = lines[i + 1];
      }
      
      // Extract quantity
      const qtyMatch = line.match(/qty\s*[:\s]+(\d+)/i) || line.match(/quantity\s*[:\s]+(\d+)/i);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1]);
      }
    }
    
    // Build address from collected lines
    if (addressLines.length > 0 && !shippingAddress.street) {
      // First line might be name, next lines are address
      const startIdx = addressLines[0].length < 50 ? 1 : 0; // Skip if first line looks like a name
      shippingAddress.street = addressLines.slice(startIdx, -1).join(', ');
    }
    
    // If we have at least city and country, create a package
    if (shippingAddress.city && shippingAddress.country) {
      // Infer package properties from product description
      const packageData = this.inferPackageFromProduct(itemDescription || 'Product', quantity);
      
      const pkg: Package = {
        id: uuidv4(),
        packageType: packageData.type,
        dimensions: packageData.dimensions,
        weight: packageData.weight,
        isFragile: packageData.fragile,
        priority: PriorityLevel.STANDARD,
        destination: {
          street: shippingAddress.street || '',
          city: shippingAddress.city,
          state: shippingAddress.state || '',
          postalCode: shippingAddress.postalCode || '',
          country: shippingAddress.country,
          additionalInfo: itemDescription
        },
        specialInstructions: `Imported from invoice - ${itemDescription.substring(0, 100)}`,
        insuranceRequired: false,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      packages.push(pkg);
    }
    
    return packages;
  }

  /**
   * Extract package data from shipping manifest documents
   */
  private extractFromManifest(text: string, timestamp: Date): Package[] {
    const packages: Package[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentPackage: Partial<Package> | null = null;
    
    for (const line of lines) {
      // Detect package boundaries (e.g., "Package 1", "Package #1", etc.)
      if (/^(package|pkg|parcel)\s*[#:]?\s*\d+/i.test(line)) {
        if (currentPackage && this.isValidPackage(currentPackage)) {
          packages.push(this.finalizePackage(currentPackage, timestamp));
        }
        currentPackage = { id: uuidv4() };
        continue;
      }

      if (!currentPackage) {
        currentPackage = { id: uuidv4() };
      }

      // Extract dimensions (e.g., "Dimensions: 10x20x30 cm" or "Length: 10, Width: 20, Height: 30")
      const dimMatch = line.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*(cm|inch|m)?/i);
      if (dimMatch) {
        currentPackage.dimensions = {
          length: parseFloat(dimMatch[1]),
          width: parseFloat(dimMatch[2]),
          height: parseFloat(dimMatch[3]),
          unit: this.parseDimensionUnit(dimMatch[4] || 'cm')
        };
      }

      // Extract weight (e.g., "Weight: 5 kg" or "5.5 lbs")
      const weightMatch = line.match(/(\d+\.?\d*)\s*(kg|lbs|g|oz)/i);
      if (weightMatch && !currentPackage.weight) {
        currentPackage.weight = {
          value: parseFloat(weightMatch[1]),
          unit: this.parseWeightUnit(weightMatch[2])
        };
      }

      // Extract city and country
      if (/city|destination/i.test(line)) {
        const cityMatch = line.match(/:\s*(.+?)(?:,|$)/);
        if (cityMatch) {
          if (!currentPackage.destination) {
            currentPackage.destination = {} as Address;
          }
          (currentPackage.destination as Address).city = cityMatch[1].trim();
        }
      }

      if (/country/i.test(line)) {
        const countryMatch = line.match(/:\s*(.+?)(?:,|$)/);
        if (countryMatch) {
          if (!currentPackage.destination) {
            currentPackage.destination = {} as Address;
          }
          (currentPackage.destination as Address).country = countryMatch[1].trim();
        }
      }

      // Extract package type
      if (/type/i.test(line)) {
        const typeMatch = line.match(/:\s*(\w+)/);
        if (typeMatch) {
          currentPackage.packageType = this.parsePackageType(typeMatch[1]);
        }
      }
    }

    // Don't forget the last package
    if (currentPackage && this.isValidPackage(currentPackage)) {
      packages.push(this.finalizePackage(currentPackage, timestamp));
    }

    return packages;
  }

  /**
   * Infer package properties from product description
   */
  private inferPackageFromProduct(description: string, quantity: number = 1): {
    type: PackageType;
    dimensions: { length: number; width: number; height: number; unit: DimensionUnit };
    weight: { value: number; unit: WeightUnit };
    fragile: boolean;
  } {
    const lowerDesc = description.toLowerCase();
    
    // Detect package type from product
    let type = PackageType.BOX;
    let fragile = false;
    let dimensions = { length: 30, width: 20, height: 15, unit: DimensionUnit.CM };
    let weight = { value: 2, unit: WeightUnit.KG };
    
    // Electronics - usually fragile and medium-sized
    if (/phone|mobile|smartphone|tablet|laptop|computer|electronic/i.test(description)) {
      type = PackageType.BOX;
      fragile = true;
      dimensions = { length: 25, width: 20, height: 10, unit: DimensionUnit.CM };
      weight = { value: 1.5, unit: WeightUnit.KG };
    }
    // Documents/papers
    else if (/document|paper|letter|certificate|invoice/i.test(description)) {
      type = PackageType.ENVELOPE;
      fragile = false;
      dimensions = { length: 30, width: 22, height: 2, unit: DimensionUnit.CM };
      weight = { value: 0.3, unit: WeightUnit.KG };
    }
    // Clothing/fabric
    else if (/cloth|shirt|dress|fabric|apparel|garment/i.test(description)) {
      type = PackageType.BOX;
      fragile = false;
      dimensions = { length: 35, width: 25, height: 10, unit: DimensionUnit.CM };
      weight = { value: 1, unit: WeightUnit.KG };
    }
    // Books
    else if (/book|magazine|publication/i.test(description)) {
      type = PackageType.BOX;
      fragile = false;
      dimensions = { length: 30, width: 25, height: 5, unit: DimensionUnit.CM };
      weight = { value: 1.2, unit: WeightUnit.KG };
    }
    // Large items
    else if (/furniture|appliance|equipment/i.test(description)) {
      type = PackageType.CRATE;
      fragile = true;
      dimensions = { length: 80, width: 60, height: 50, unit: DimensionUnit.CM };
      weight = { value: 15, unit: WeightUnit.KG };
    }
    
    // Adjust weight by quantity
    weight.value *= quantity;
    
    return { type, dimensions, weight, fragile };
  }

  /**
   * Convert text to title case
   */
  private toTitleCase(text: string): string {
    return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Expand country codes to full names
   */
  private expandCountryCode(code: string): string {
    const codes: { [key: string]: string } = {
      'IN': 'India',
      'US': 'United States',
      'USA': 'United States',
      'UK': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'CN': 'China',
      'INDIA': 'India'
    };
    return codes[code.toUpperCase()] || code;
  }

  /**
   * Check if a partial package has minimum required fields
   */
  private isValidPackage(pkg: Partial<Package>): boolean {
    return !!(
      pkg.dimensions &&
      pkg.weight &&
      pkg.destination &&
      (pkg.destination as Address).city &&
      (pkg.destination as Address).country
    );
  }

  /**
   * Finalize a partial package with default values
   */
  private finalizePackage(partial: Partial<Package>, timestamp: Date): Package {
    return {
      id: partial.id || uuidv4(),
      packageType: partial.packageType || PackageType.BOX,
      dimensions: partial.dimensions!,
      weight: partial.weight!,
      isFragile: partial.isFragile || false,
      priority: partial.priority || PriorityLevel.STANDARD,
      destination: {
        street: (partial.destination as Address)?.street || '',
        city: (partial.destination as Address)?.city || '',
        state: (partial.destination as Address)?.state || '',
        postalCode: (partial.destination as Address)?.postalCode || '',
        country: (partial.destination as Address)?.country || ''
      },
      sender: partial.sender,
      specialInstructions: partial.specialInstructions,
      estimatedValue: partial.estimatedValue,
      currency: partial.currency,
      insuranceRequired: partial.insuranceRequired || false,
      trackingPreferences: partial.trackingPreferences,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  /**
   * Helper: Parse package type
   */
  private parsePackageType(value: string): PackageType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case 'box':
        return PackageType.BOX;
      case 'envelope':
        return PackageType.ENVELOPE;
      case 'crate':
        return PackageType.CRATE;
      case 'pallet':
        return PackageType.PALLET;
      case 'tube':
        return PackageType.TUBE;
      default:
        return PackageType.OTHER;
    }
  }

  /**
   * Helper: Parse dimension unit
   */
  private parseDimensionUnit(value: string): DimensionUnit {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case 'cm':
      case 'centimeter':
      case 'centimeters':
        return DimensionUnit.CM;
      case 'inch':
      case 'inches':
      case 'in':
        return DimensionUnit.INCH;
      case 'm':
      case 'meter':
      case 'meters':
        return DimensionUnit.M;
      default:
        return DimensionUnit.CM;
    }
  }

  /**
   * Helper: Parse weight unit
   */
  private parseWeightUnit(value: string): WeightUnit {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case 'kg':
      case 'kilogram':
      case 'kilograms':
        return WeightUnit.KG;
      case 'lbs':
      case 'lb':
      case 'pound':
      case 'pounds':
        return WeightUnit.LBS;
      case 'g':
      case 'gram':
      case 'grams':
        return WeightUnit.G;
      case 'oz':
      case 'ounce':
      case 'ounces':
        return WeightUnit.OZ;
      default:
        return WeightUnit.KG;
    }
  }

  /**
   * Helper: Parse priority
   */
  private parsePriority(value: string): PriorityLevel {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case 'standard':
        return PriorityLevel.STANDARD;
      case 'express':
        return PriorityLevel.EXPRESS;
      case 'overnight':
        return PriorityLevel.OVERNIGHT;
      case 'same_day':
      case 'same day':
        return PriorityLevel.SAME_DAY;
      default:
        return PriorityLevel.STANDARD;
    }
  }

  /**
   * Helper: Parse boolean from string
   */
  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false;
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
  }

  /**
   * Generate a sample CSV template
   */
  generateCSVTemplate(): string {
    const headers = [
      'type',
      'length',
      'width',
      'height',
      'dimension_unit',
      'weight',
      'weight_unit',
      'fragile',
      'priority',
      'street',
      'city',
      'state',
      'postal_code',
      'country',
      'sender_name',
      'sender_email',
      'special_instructions',
      'estimated_value',
      'insurance'
    ];

    const sampleRow = [
      'box',
      '30',
      '20',
      '15',
      'cm',
      '5',
      'kg',
      'true',
      'standard',
      '123 Main St',
      'New York',
      'NY',
      '10001',
      'USA',
      'John Doe',
      'john@example.com',
      'Handle with care',
      '100',
      'true'
    ];

    return headers.join(',') + '\n' + sampleRow.join(',');
  }
}
