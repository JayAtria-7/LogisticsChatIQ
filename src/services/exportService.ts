import * as fs from 'fs';
import * as path from 'path';
import { Session, ExportData, Package } from '../models/types';

/**
 * Export format options
 */
export enum ExportFormat {
  JSON_PRETTY = 'json_pretty',
  JSON_COMPACT = 'json_compact',
  CSV = 'csv',
  SUMMARY = 'summary',
  PDF = 'pdf'
}

/**
 * Export Service - handles data export in various formats
 */
export class ExportService {
  private static readonly API_VERSION = '1.0.0';

  /**
   * Export session data
   */
  async exportSession(
    session: Session,
    format: ExportFormat = ExportFormat.JSON_PRETTY,
    outputPath?: string
  ): Promise<string> {
    let content: string;

    switch (format) {
      case ExportFormat.JSON_PRETTY:
        content = this.generatePrettyJSON(session);
        break;
      
      case ExportFormat.JSON_COMPACT:
        content = this.generateCompactJSON(session);
        break;
      
      case ExportFormat.CSV:
        content = this.generateCSV(session);
        break;
      
      case ExportFormat.SUMMARY:
        content = this.generateSummary(session);
        break;
      
      case ExportFormat.PDF:
        content = this.generatePDF(session);
        break;
      
      default:
        content = this.generatePrettyJSON(session);
    }

    if (outputPath) {
      await this.writeToFile(outputPath, content);
    }

    return content;
  }

  /**
   * Generate pretty-printed JSON
   */
  private generatePrettyJSON(session: Session): string {
    const exportData: ExportData = {
      apiVersion: ExportService.API_VERSION,
      metadata: session.metadata,
      packages: session.packages,
      validationStatus: {
        allFieldsValidated: this.validateAllPackages(session.packages),
        invalidPackages: this.getInvalidPackages(session.packages)
      },
      userInformation: session.preferences.defaultSender,
      exportedAt: new Date()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate compact JSON
   */
  private generateCompactJSON(session: Session): string {
    const exportData: ExportData = {
      apiVersion: ExportService.API_VERSION,
      metadata: session.metadata,
      packages: session.packages,
      validationStatus: {
        allFieldsValidated: this.validateAllPackages(session.packages),
        invalidPackages: this.getInvalidPackages(session.packages)
      },
      userInformation: session.preferences.defaultSender,
      exportedAt: new Date()
    };

    return JSON.stringify(exportData);
  }

  /**
   * Generate CSV
   */
  private generateCSV(session: Session): string {
    const headers = [
      'ID',
      'Type',
      'Length',
      'Width',
      'Height',
      'Dimension Unit',
      'Weight',
      'Weight Unit',
      'Fragile',
      'Priority',
      'Destination Street',
      'Destination City',
      'Destination State',
      'Destination Postal Code',
      'Destination Country',
      'Sender Name',
      'Sender Email',
      'Sender Phone',
      'Special Instructions',
      'Estimated Value',
      'Currency',
      'Insurance Required',
      'Created At'
    ];

    const safe = (v: any) => (v === null || v === undefined) ? '' : v;
    const formatDate = (d: any) => {
      if (!d) return '';
      try {
        const dt = d instanceof Date ? d : new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toISOString();
      } catch {
        return '';
      }
    };

    const rows = session.packages.map(pkg => [
      safe(pkg.id),
      safe(pkg.packageType),
      safe(pkg.dimensions?.length),
      safe(pkg.dimensions?.width),
      safe(pkg.dimensions?.height),
      safe(pkg.dimensions?.unit),
      safe(pkg.weight?.value),
      safe(pkg.weight?.unit),
      pkg.isFragile === undefined ? '' : (pkg.isFragile ? 'Yes' : 'No'),
      safe(pkg.priority),
      safe(pkg.destination?.street),
      safe(pkg.destination?.city),
      safe(pkg.destination?.state),
      safe(pkg.destination?.postalCode),
      safe(pkg.destination?.country),
      safe(pkg.sender?.name),
      safe(pkg.sender?.email),
      safe(pkg.sender?.phone),
      safe(pkg.specialInstructions),
      (pkg.estimatedValue === undefined || pkg.estimatedValue === null) ? '' : pkg.estimatedValue,
      safe(pkg.currency),
      pkg.insuranceRequired === undefined ? '' : (pkg.insuranceRequired ? 'Yes' : 'No'),
      formatDate(pkg.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(session: Session): string {
    const safe = (v: any) => (v === null || v === undefined) ? '' : v;
    const formatDate = (d: any) => {
      if (!d) return '';
      try {
        const dt = d instanceof Date ? d : new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toLocaleString();
      } catch {
        return '';
      }
    };

    let summary = '╔════════════════════════════════════════════════════════════╗\n';
    summary += '║         PACKAGE COLLECTION SESSION SUMMARY                 ║\n';
    summary += '╚════════════════════════════════════════════════════════════╝\n\n';

    summary += `Session ID: ${safe(session.metadata.sessionId)}\n`;
    summary += `Started: ${formatDate(session.metadata.startTime)}\n`;
    summary += `Last Activity: ${formatDate(session.metadata.lastActivity)}\n`;
    summary += `Total Packages: ${safe(session.metadata.totalPackages)}\n`;
    summary += `Completed Packages: ${safe(session.metadata.completedPackages)}\n`;

    if (session.metadata.totalEstimatedCost) {
      summary += `Total Estimated Cost: ${session.metadata.currency} ${session.metadata.totalEstimatedCost.toFixed(2)}\n`;
    }

    summary += '\n' + '─'.repeat(60) + '\n\n';

    session.packages.forEach((pkg, index) => {
      summary += `📦 PACKAGE ${index + 1}\n`;
      summary += '─'.repeat(60) + '\n';
      summary += `  ID: ${safe(pkg.id)}\n`;
      summary += `  Type: ${safe(pkg.packageType).toString().toUpperCase()}\n`;

      if (pkg.dimensions) {
        summary += `  Dimensions: ${safe(pkg.dimensions.length)} × ${safe(pkg.dimensions.width)} × ${safe(pkg.dimensions.height)} ${safe(pkg.dimensions.unit)}\n`;
      }

      if (pkg.weight) {
        summary += `  Weight: ${safe(pkg.weight.value)} ${safe(pkg.weight.unit)}\n`;
      }

      summary += `  Fragile: ${pkg.isFragile ? '⚠️  YES' : 'No'}\n`;
      summary += `  Priority: ${safe(pkg.priority).toString().toUpperCase()}\n\n`;

      summary += `  📍 DESTINATION:\n`;
      if (pkg.destination) {
        summary += `     ${safe(pkg.destination.street)}\n`;
        summary += `     ${safe(pkg.destination.city)}, ${safe(pkg.destination.state)} ${safe(pkg.destination.postalCode)}\n`;
        summary += `     ${safe(pkg.destination.country)}\n`;

        if (pkg.destination.additionalInfo) {
          summary += `     Note: ${safe(pkg.destination.additionalInfo)}\n`;
        }
      } else {
        summary += `     (No destination data)\n`;
      }

      if (pkg.sender) {
        summary += `\n  👤 SENDER:\n`;
        summary += `     ${safe(pkg.sender.name)}\n`;
        if (pkg.sender.email) summary += `     📧 ${safe(pkg.sender.email)}\n`;
        if (pkg.sender.phone) summary += `     📞 ${safe(pkg.sender.phone)}\n`;
      }

      if (pkg.specialInstructions) {
        summary += `\n  📝 SPECIAL INSTRUCTIONS:\n`;
        summary += `     ${safe(pkg.specialInstructions)}\n`;
      }

      if (pkg.estimatedValue !== undefined && pkg.estimatedValue !== null) {
        const val = typeof pkg.estimatedValue === 'number' ? pkg.estimatedValue.toFixed(2) : pkg.estimatedValue;
        summary += `\n  💰 VALUE: ${safe(pkg.currency) || 'USD'} ${val}\n`;
        summary += `  🛡️  INSURANCE: ${pkg.insuranceRequired ? 'YES' : 'NO'}\n`;
      }

      if (pkg.trackingPreferences) {
        summary += `\n  📱 TRACKING:\n`;
        summary += `     Email: ${pkg.trackingPreferences.emailNotifications ? '✓' : '✗'}\n`;
        summary += `     SMS: ${pkg.trackingPreferences.smsNotifications ? '✓' : '✗'}\n`;
        summary += `     Signature: ${pkg.trackingPreferences.signatureRequired ? '✓' : '✗'}\n`;
      }

      summary += '\n' + '─'.repeat(60) + '\n\n';
    });

    summary += '\n╔════════════════════════════════════════════════════════════╗\n';
    summary += '║                  END OF SUMMARY                            ║\n';
    summary += '╚════════════════════════════════════════════════════════════╝\n';

    return summary;
  }

  /**
   * Validate all packages
   */
  private validateAllPackages(packages: Package[]): boolean {
    return packages.every(pkg => {
      return (
        pkg.id &&
        pkg.packageType &&
        pkg.dimensions &&
        pkg.weight &&
        pkg.priority &&
        pkg.destination &&
        pkg.isFragile !== undefined &&
        pkg.insuranceRequired !== undefined
      );
    });
  }

  /**
   * Get invalid packages
   */
  private getInvalidPackages(packages: Package[]): string[] {
    return packages
      .filter(pkg => {
        return !(
          pkg.id &&
          pkg.packageType &&
          pkg.dimensions &&
          pkg.weight &&
          pkg.priority &&
          pkg.destination
        );
      })
      .map(pkg => pkg.id);
  }

  /**
   * Generate PDF format (HTML-based for browser rendering)
   */
  private generatePDF(session: Session): string {
    const exportData: ExportData = {
      apiVersion: ExportService.API_VERSION,
      metadata: session.metadata,
      packages: session.packages,
      validationStatus: {
        allFieldsValidated: this.validateAllPackages(session.packages),
        invalidPackages: this.getInvalidPackages(session.packages)
      },
      userInformation: session.preferences.defaultSender,
      exportedAt: new Date()
    };
    
    // Generate HTML that can be converted to PDF in the browser
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Package Export - ${session.metadata.sessionId}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #4f46e5;
      margin: 0;
    }
    .metadata {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .metadata-item {
      margin: 5px 0;
    }
    .package {
      border: 2px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .package-header {
      background: #4f46e5;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      margin: -20px -20px 15px -20px;
      font-size: 18px;
      font-weight: bold;
    }
    .section {
      margin: 15px 0;
    }
    .section-title {
      font-weight: bold;
      color: #4f46e5;
      margin-bottom: 8px;
      font-size: 14px;
      text-transform: uppercase;
    }
    .field {
      margin: 5px 0;
      padding: 5px 0;
    }
    .label {
      display: inline-block;
      width: 180px;
      font-weight: 600;
      color: #666;
    }
    .value {
      color: #333;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #dee2e6;
      padding-top: 15px;
    }
    @media print {
      body { margin: 20px; }
      .package { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Package Export Report</h1>
    <p>Session ID: ${session.metadata.sessionId}</p>
  </div>

  <div class="metadata">
    <div class="metadata-item"><strong>Export Date:</strong> ${new Date().toLocaleString()}</div>
    <div class="metadata-item"><strong>Total Packages:</strong> ${session.metadata.totalPackages}</div>
    <div class="metadata-item"><strong>Completed:</strong> ${session.metadata.completedPackages}</div>
    <div class="metadata-item"><strong>Session Started:</strong> ${new Date(session.metadata.startTime).toLocaleString()}</div>
  </div>
`;

    exportData.packages.forEach((pkg, index) => {
      html += `
  <div class="package">
    <div class="package-header">Package ${index + 1} - ${pkg.packageType || 'N/A'}</div>
    
    <div class="section">
      <div class="section-title">📏 Dimensions & Weight</div>`;
      
      if (pkg.dimensions) {
        html += `
      <div class="field">
        <span class="label">Dimensions:</span>
        <span class="value">${pkg.dimensions.length} × ${pkg.dimensions.width} × ${pkg.dimensions.height} ${pkg.dimensions.unit}</span>
      </div>`;
      }
      
      if (pkg.weight) {
        html += `
      <div class="field">
        <span class="label">Weight:</span>
        <span class="value">${pkg.weight.value} ${pkg.weight.unit}</span>
      </div>`;
      }
      
      html += `
      <div class="field">
        <span class="label">Fragile:</span>
        <span class="value">${pkg.isFragile ? 'Yes ⚠️' : 'No'}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🚚 Shipping Details</div>
      <div class="field">
        <span class="label">Priority:</span>
        <span class="value">${pkg.priority || 'N/A'}</span>
      </div>`;
      
      if (pkg.destination) {
        html += `
      <div class="field">
        <span class="label">Destination:</span>
        <span class="value">${pkg.destination.street || ''}, ${pkg.destination.city || ''}, ${pkg.destination.state || ''} ${pkg.destination.postalCode || ''}, ${pkg.destination.country || ''}</span>
      </div>`;
      }
      
      if (pkg.sender) {
        html += `
      <div class="field">
        <span class="label">Sender:</span>
        <span class="value">${pkg.sender.name || 'N/A'}${pkg.sender.email ? ' (' + pkg.sender.email + ')' : ''}</span>
      </div>`;
      }
      
      html += `
    </div>`;

      if (pkg.specialInstructions || pkg.estimatedValue || pkg.insuranceRequired) {
        html += `
    <div class="section">
      <div class="section-title">ℹ️ Additional Information</div>`;
        
        if (pkg.specialInstructions) {
          html += `
      <div class="field">
        <span class="label">Special Instructions:</span>
        <span class="value">${pkg.specialInstructions}</span>
      </div>`;
        }
        
        if (pkg.estimatedValue) {
          html += `
      <div class="field">
        <span class="label">Estimated Value:</span>
        <span class="value">${pkg.currency || 'USD'} ${pkg.estimatedValue}</span>
      </div>`;
        }
        
        html += `
      <div class="field">
        <span class="label">Insurance:</span>
        <span class="value">${pkg.insuranceRequired ? 'Yes ✓' : 'No'}</span>
      </div>`;
        
        if (pkg.trackingPreferences) {
          const prefs = [];
          if (pkg.trackingPreferences.emailNotifications) prefs.push('Email');
          if (pkg.trackingPreferences.smsNotifications) prefs.push('SMS');
          if (pkg.trackingPreferences.signatureRequired) prefs.push('Signature Required');
          
          html += `
      <div class="field">
        <span class="label">Tracking:</span>
        <span class="value">${prefs.length > 0 ? prefs.join(', ') : 'None'}</span>
      </div>`;
        }
        
        html += `
    </div>`;
      }
      
      html += `
  </div>`;
    });

    html += `
  <div class="footer">
    <p>Generated by Advanced Package Collection System v${ExportService.API_VERSION}</p>
    <p>API Version: ${exportData.apiVersion}</p>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Write content to file
   */
  private async writeToFile(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(filePath);
      
      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Generate filename based on session and format
   */
  generateFilename(sessionId: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === ExportFormat.CSV ? 'csv' : 
                     format === ExportFormat.SUMMARY ? 'txt' :
                     format === ExportFormat.PDF ? 'html' : 'json';
    
    return `package-export-${sessionId.substring(0, 8)}-${timestamp}.${extension}`;
  }

  /**
   * Export in multiple formats
   */
  async exportAll(session: Session, outputDir: string): Promise<string[]> {
    const formats = [
      ExportFormat.JSON_PRETTY,
      ExportFormat.CSV,
      ExportFormat.SUMMARY
    ];

    const files: string[] = [];

    for (const format of formats) {
      const filename = this.generateFilename(session.metadata.sessionId, format);
      const filepath = path.join(outputDir, filename);
      await this.exportSession(session, format, filepath);
      files.push(filepath);
    }

    return files;
  }
}

export const exportService = new ExportService();
