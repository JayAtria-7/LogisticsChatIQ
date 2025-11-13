import { ExportService, ExportFormat } from '../src/services/exportService';
import { Session } from '../src/models/types';

(async () => {
  const exportService = new ExportService();

  const session: Session = {
    metadata: {
      sessionId: 'test-session-1',
      startTime: new Date().toISOString() as any, // intentionally string to simulate loaded session
      lastActivity: new Date().toISOString() as any,
      totalPackages: 1,
      completedPackages: 1,
      currency: 'USD'
    } as any,
    packages: [
      {
        id: 'pkg-1',
        packageType: 'box' as any,
        dimensions: { length: 10, width: 5, height: 2, unit: 'cm' } as any,
        weight: { value: 2.5, unit: 'kg' } as any,
        isFragile: false,
        priority: 'standard' as any,
        destination: { street: '123 Main St', city: 'Townsville', state: 'TS', postalCode: '12345', country: 'Wonderland' } as any,
        sender: { name: 'Alice', email: 'alice@example.com' } as any,
        specialInstructions: 'Handle with care',
        estimatedValue: 100,
        currency: 'USD',
        insuranceRequired: false,
        trackingPreferences: { emailNotifications: true, smsNotifications: false, signatureRequired: false },
        createdAt: new Date().toISOString() as any, // intentionally string
        updatedAt: new Date()
      } as any
    ],
    conversationHistory: [],
    currentPackage: undefined,
    templates: {},
    preferences: { commonAddresses: [], defaultCurrency: 'USD' }
  } as any;

  try {
    const csv = await exportService.exportSession(session as any, ExportFormat.CSV);
    console.log('CSV export succeeded. Length:', csv.length);
    console.log(csv.split('\n').slice(0,3).join('\n'));

    const summary = await exportService.exportSession(session as any, ExportFormat.SUMMARY);
    console.log('\nSUMMARY export succeeded. Length:', summary.length);
    console.log(summary.split('\n').slice(0,10).join('\n'));
  } catch (err) {
    console.error('Export test failed:', err);
    process.exit(1);
  }
})();
