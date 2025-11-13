export { ChatbotCLI } from './cli';
export { SessionManager } from './services/sessionManager';
export { ConversationManager } from './services/conversationManager';
export { ExportService, ExportFormat } from './services/exportService';
export { NLPProcessor } from './nlp/processor';
export { PackageValidator } from './validators/packageValidator';
export { ShippingCalculator } from './utils/shippingCalculator';

// Export types
export * from './models/types';
export * from './models/enums';

// Main entry point
import { ChatbotCLI } from './cli';

const cli = new ChatbotCLI();
cli.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
