import { ImportService, ImportFormat } from '../src/services/importService';

(async () => {
  const importService = new ImportService();

  console.log('=== Testing flexible import (missing fields get defaults) ===\n');

  // JSON with minimal data (only destination)
  const jsonMinimal = JSON.stringify([
    {
      "destination": {
        "city": "New York",
        "country": "USA"
      }
    }
  ]);

  try {
    const result = await importService.importFromFile(Buffer.from(jsonMinimal, 'utf8'), ImportFormat.JSON, 'minimal.json');
    console.log('JSON (minimal) import result:', result.success, 'packages:', result.packages.length, 'errors:', result.errors.length);
    if (result.success && result.packages.length > 0) {
      console.log('  Package created with defaults:');
      const pkg = result.packages[0];
      console.log('    - Type:', pkg.packageType);
      console.log('    - Dimensions:', `${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height} ${pkg.dimensions.unit}`);
      console.log('    - Weight:', `${pkg.weight.value} ${pkg.weight.unit}`);
      console.log('    - Destination:', `${pkg.destination.city}, ${pkg.destination.country}`);
    }
    if (result.errors.length > 0) {
      console.log('  Errors:', result.errors.map(e => `Row ${e.row}: ${e.message}`));
    }
  } catch (err) {
    console.error('JSON minimal import failed:', err);
  }

  // JSON with no destination (should fail)
  const jsonNoDestination = JSON.stringify([
    {
      "packageType": "box"
    }
  ]);

  try {
    const result = await importService.importFromFile(Buffer.from(jsonNoDestination, 'utf8'), ImportFormat.JSON, 'no-dest.json');
    console.log('\nJSON (no destination) import result:', result.success, 'packages:', result.packages.length, 'errors:', result.errors.length);
    if (result.errors.length > 0) {
      console.log('  Errors:', result.errors.map(e => `Row ${e.row}: ${e.message}`));
    }
  } catch (err) {
    console.error('JSON no destination import failed:', err);
  }

  // CSV with only city and country
  const csvMinimal = `city,country
New York,USA`;

  try {
    const result = await importService.importFromFile(Buffer.from(csvMinimal, 'utf8'), ImportFormat.CSV, 'minimal.csv');
    console.log('\nCSV (minimal) import result:', result.success, 'packages:', result.packages.length, 'errors:', result.errors.length);
    if (result.success && result.packages.length > 0) {
      const pkg = result.packages[0];
      console.log('  Package created with defaults:');
      console.log('    - Type:', pkg.packageType);
      console.log('    - Dimensions:', `${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height}`);
      console.log('    - Weight:', pkg.weight.value, pkg.weight.unit);
    }
  } catch (err) {
    console.error('CSV minimal import failed:', err);
  }
})();
