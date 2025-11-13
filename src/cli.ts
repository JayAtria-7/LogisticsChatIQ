import * as readline from 'readline';
import { SessionManager } from './services/sessionManager';
import { ConversationManager, BotResponse } from './services/conversationManager';
import { ExportService, ExportFormat } from './services/exportService';
import { ShippingCalculator } from './utils/shippingCalculator';
import { Formatter, Colors } from './utils/formatter';
import { ConversationState } from './models/enums';

/**
 * CLI Interface for the chatbot
 */
export class ChatbotCLI {
  private sessionManager: SessionManager;
  private conversationManager: ConversationManager;
  private exportService: ExportService;
  private rl: readline.Interface;
  private isRunning: boolean = false;

  constructor() {
    this.sessionManager = new SessionManager();
    this.conversationManager = new ConversationManager(this.sessionManager);
    this.exportService = new ExportService();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: Formatter.prompt()
    });
  }

  /**
   * Start the chatbot
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Enable auto-save
    this.sessionManager.enableAutoSave(30000);

    // Display banner
    this.displayBanner();

    // Show welcome message
    const welcomeResponse = this.conversationManager.getWelcomeMessage();
    this.displayBotResponse(welcomeResponse);

    // Setup input handling
    this.rl.on('line', async (input: string) => {
      await this.handleUserInput(input.trim());
    });

    this.rl.on('close', () => {
      this.shutdown();
    });

    this.rl.prompt();
  }

  /**
   * Display banner
   */
  private displayBanner(): void {
    console.log(Formatter.header(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🚀  ADVANCED PACKAGE COLLECTION CHATBOT  📦          ║
║                                                              ║
║              Intelligent Multi-Package Data Collection       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));
    console.log('');
  }

  /**
   * Handle user input
   */
  private async handleUserInput(input: string): Promise<void> {
    if (!input) {
      this.rl.prompt();
      return;
    }

    // Special commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      this.rl.close();
      return;
    }

    if (input.toLowerCase() === 'export') {
      await this.handleExport();
      this.rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'cost') {
      this.displayCostEstimate();
      this.rl.prompt();
      return;
    }

    try {
      const response = await this.conversationManager.processInput(input);
      this.displayBotResponse(response);

      // Check if session is completed
      if (response.state === ConversationState.COMPLETED && !response.needsInput) {
        console.log('\n' + Formatter.info('Type "export" to save your data, or "exit" to quit.'));
      }

      if (response.needsInput) {
        this.rl.prompt();
      }
    } catch (error: any) {
      console.log(Formatter.error(`An error occurred: ${error.message}`));
      this.rl.prompt();
    }
  }

  /**
   * Display bot response
   */
  private displayBotResponse(response: BotResponse): void {
    console.log('');
    console.log(Formatter.bot(response.message));

    if (response.error) {
      console.log(Formatter.error(response.error));
    }

    if (response.suggestions && response.suggestions.length > 0) {
      console.log('');
      console.log(Formatter.info('Suggestions:'));
      response.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    }

    console.log('');
  }

  /**
   * Handle export command
   */
  private async handleExport(): Promise<void> {
    const session = this.sessionManager.getSession();

    if (session.packages.length === 0) {
      console.log(Formatter.warning('No packages to export.'));
      return;
    }

    console.log('');
    console.log(Formatter.info('Exporting your data...'));
    console.log('');

    try {
      const outputDir = './exports';
      const files = await this.exportService.exportAll(session, outputDir);

      console.log(Formatter.success('Export successful!'));
      console.log('');
      console.log('Files created:');
      files.forEach(file => {
        console.log(`  📄 ${file}`);
      });
      console.log('');

      // Also display summary in console
      const summary = await this.exportService.exportSession(session, ExportFormat.SUMMARY);
      console.log(summary);
    } catch (error: any) {
      console.log(Formatter.error(`Export failed: ${error.message}`));
    }
  }

  /**
   * Display cost estimate
   */
  private displayCostEstimate(): void {
    const packages = this.sessionManager.getPackages();

    if (packages.length === 0) {
      console.log(Formatter.warning('No packages to calculate cost for.'));
      return;
    }

    console.log('');
    console.log(Formatter.header('💰 SHIPPING COST ESTIMATE'));
    console.log(Formatter.separator());
    console.log('');

    let totalCost = 0;

    packages.forEach((pkg, index) => {
      const cost = ShippingCalculator.calculateCost(pkg);
      const breakdown = ShippingCalculator.getCostBreakdown(pkg);

      console.log(`Package ${index + 1}: ${pkg.packageType}`);
      console.log(`  Base Cost: $${breakdown.baseCost?.toFixed(2) || '0.00'}`);
      
      if (breakdown.weightCost) {
        console.log(`  Weight: $${breakdown.weightCost.toFixed(2)}`);
      }
      
      if (breakdown.volumeCost) {
        console.log(`  Volume: $${breakdown.volumeCost.toFixed(2)}`);
      }
      
      if (breakdown.fragileSurcharge) {
        console.log(`  Fragile Surcharge: $${breakdown.fragileSurcharge.toFixed(2)}`);
      }
      
      if (breakdown.insurance) {
        console.log(`  Insurance: $${breakdown.insurance.toFixed(2)}`);
      }
      
      console.log(`  ${Colors.bright}Total: $${cost.toFixed(2)}${Colors.reset}`);
      console.log('');

      totalCost += cost;
    });

    console.log(Formatter.separator());
    console.log(Formatter.success(`Grand Total: $${totalCost.toFixed(2)}`));
    console.log('');

    // Update session with total cost
    this.sessionManager.updateTotalCost(totalCost);
  }

  /**
   * Shutdown the application
   */
  private async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('');
    console.log(Formatter.info('Saving session...'));

    try {
      await this.sessionManager.saveSession();
      console.log(Formatter.success('Session saved successfully!'));
      console.log('');
      console.log(Formatter.info(`Session ID: ${this.sessionManager.getSessionId()}`));
      console.log(Formatter.info('You can resume this session later.'));
    } catch (error: any) {
      console.log(Formatter.error(`Failed to save session: ${error.message}`));
    }

    this.sessionManager.disableAutoSave();
    console.log('');
    console.log(Formatter.header('Thank you for using Package Collection Chatbot! 👋'));
    console.log('');
    
    process.exit(0);
  }
}

// Main entry point
if (require.main === module) {
  const cli = new ChatbotCLI();
  cli.start().catch(error => {
    console.error(Formatter.error(`Fatal error: ${error.message}`));
    process.exit(1);
  });
}
