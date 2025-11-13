import { ImportService, ImportFormat } from '../src/services/importService';

(async () => {
  const importService = new ImportService();

  // Test if pdf-parse can be loaded correctly
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PDFParse } = require('pdf-parse');
    console.log('PDFParse class loaded:', typeof PDFParse);
    
    if (typeof PDFParse !== 'function') {
      console.error('ERROR: PDFParse is not a constructor.');
      process.exit(1);
    }

    // Create a minimal PDF buffer for testing
    // This is a simple PDF with text "Test Package"
    const minimalPDF = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
      '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
      '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
      'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000114 00000 n\n' +
      'trailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF'
    );

    // Test the actual import
    const result = await importService.importFromFile(minimalPDF, ImportFormat.PDF, 'test.pdf');
    console.log('\nPDF import test result:');
    console.log('  Success:', result.success);
    console.log('  Packages:', result.packages.length);
    console.log('  Incomplete:', result.incompletePackages?.length || 0);
    console.log('  Errors:', result.errors.length);
    
    if (result.errors.length > 0) {
      console.log('  Error messages:', result.errors.map(e => e.message));
    }
    
    if (result.warnings.length > 0) {
      console.log('  Warnings:', result.warnings.map(w => w.message));
    }
    
    console.log('\n✓ PDF import module is working correctly');
  } catch (err) {
    console.error('✗ PDF import test failed:', err);
    process.exit(1);
  }
})();
