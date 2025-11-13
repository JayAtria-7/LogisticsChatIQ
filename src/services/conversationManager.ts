import { SessionManager } from './sessionManager';
import { NLPProcessor, NLPResult } from '../nlp/processor';
import { PackageValidator } from '../validators/packageValidator';
import { ConversationState, Intent } from '../models/enums';
import {
  Package,
  PackageType,
  PriorityLevel,
  DimensionUnit,
  WeightUnit,
  Dimensions,
  Weight,
  Address
} from '../models/types';

/**
 * Response from conversation manager
 */
export interface BotResponse {
  message: string;
  suggestions?: string[];
  needsInput: boolean;
  state: ConversationState;
  error?: string;
}

/**
 * Conversation Manager - handles dialogue flow and state transitions
 */
export class ConversationManager {
  private sessionManager: SessionManager;
  private nlpProcessor: NLPProcessor;
  private validator: PackageValidator;
  private retryCount: Map<string, number>;
  private maxRetries = 3;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
    this.nlpProcessor = new NLPProcessor();
    this.validator = new PackageValidator();
    this.retryCount = new Map();
  }

  /**
   * Process user input and generate response
   */
  async processInput(userInput: string): Promise<BotResponse> {
    // Add to conversation history
    this.sessionManager.addConversationEntry('user', userInput);

    // Process with NLP
    const nlpResult = this.nlpProcessor.process(userInput);

    // Check for global commands
    const globalIntent = await this.handleGlobalIntent(nlpResult);
    if (globalIntent) {
      this.sessionManager.addConversationEntry('bot', globalIntent.message);
      return globalIntent;
    }

    // Handle based on current state
    const response = await this.handleStateInput(userInput, nlpResult);
    this.sessionManager.addConversationEntry('bot', response.message);

    return response;
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage(): BotResponse {
    const message = `Welcome to the Advanced Package Collection System! 🎉

I'll help you collect detailed information about your packages through our conversation.

You can:
- Add multiple packages with complete details
- Use natural language (e.g., "small box", "10kg")
- Say "same as last" to copy from previous package
- Save templates for frequently shipped items
- View summary of all packages anytime
- Edit or delete packages

Let's get started! Would you like to add your first package?

Commands: help, summary, finish, cancel`;

    return {
      message,
      suggestions: ['Yes, add a package', 'Help', 'View commands'],
      needsInput: true,
      state: ConversationState.WELCOME
    };
  }

  /**
   * Handle global intents (work in any state)
   */
  private async handleGlobalIntent(nlpResult: NLPResult): Promise<BotResponse | null> {
    switch (nlpResult.intent) {
      case Intent.HELP:
        return this.getHelpResponse();
      
      case Intent.VIEW_SUMMARY:
        return this.getPackageSummary();
      
      case Intent.FINISH:
        return this.finishSession();
      
      case Intent.CANCEL:
        return this.cancelSession();
      
      case Intent.PAUSE:
        return await this.pauseSession();
      
      case Intent.EXPORT:
        return this.exportData();
    }

    return null;
  }

  /**
   * Handle input based on current conversation state
   */
  private async handleStateInput(input: string, nlpResult: NLPResult): Promise<BotResponse> {
    const state = this.sessionManager.getCurrentState();

    switch (state) {
      case ConversationState.WELCOME:
        return this.handleWelcomeState(nlpResult);
      
      case ConversationState.ASKING_PACKAGE_TYPE:
        return this.handlePackageTypeInput(input, nlpResult);
      
      case ConversationState.ASKING_DIMENSIONS:
        return this.handleDimensionsInput(input, nlpResult);
      
      case ConversationState.ASKING_WEIGHT:
        return this.handleWeightInput(input, nlpResult);
      
      case ConversationState.ASKING_FRAGILE:
        return this.handleFragileInput(input, nlpResult);
      
      case ConversationState.ASKING_PRIORITY:
        return this.handlePriorityInput(input, nlpResult);
      
      case ConversationState.ASKING_DESTINATION:
        return this.handleDestinationInput(input, nlpResult);
      
      case ConversationState.ASKING_SENDER:
        return this.handleSenderInput(input, nlpResult);
      
      case ConversationState.ASKING_SPECIAL_INSTRUCTIONS:
        return this.handleSpecialInstructionsInput(input, nlpResult);
      
      case ConversationState.ASKING_VALUE:
        return this.handleValueInput(input, nlpResult);
      
      case ConversationState.ASKING_INSURANCE:
        return this.handleInsuranceInput(input, nlpResult);
      
      case ConversationState.ASKING_TRACKING_PREFS:
        return this.handleTrackingPrefsInput(input, nlpResult);
      
      case ConversationState.PACKAGE_SUMMARY:
        return this.handlePackageSummaryState(nlpResult);
      
      case ConversationState.EDITING:
        return this.handleEditingState(input, nlpResult);
      
      case ConversationState.ASKING_CONTINUE:
        return this.handleContinueState(nlpResult);
      
      case ConversationState.COMPLETED:
        return this.handleCompletedState(nlpResult);
      
      default:
        return {
          message: "I'm not sure what to do here. Type 'help' for assistance.",
          needsInput: true,
          state
        };
    }
  }

  /**
   * Handle welcome state
   */
  private handleWelcomeState(nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.CONFIRM || nlpResult.intent === Intent.ADD_PACKAGE) {
      this.sessionManager.startNewPackage();
      this.sessionManager.setState(ConversationState.ASKING_PACKAGE_TYPE);
      
      return {
        message: `Great! Let's start with the package type.

What type of package are you shipping?

Options:
- Box (standard cardboard box)
- Envelope (document/letter)
- Crate (wooden crate)
- Pallet (large pallet)
- Tube (cylindrical tube)
- Other

You can also describe it naturally, like "small box" or "large envelope".`,
        suggestions: ['Box', 'Envelope', 'Crate', 'Pallet'],
        needsInput: true,
        state: ConversationState.ASKING_PACKAGE_TYPE
      };
    }

    return {
      message: 'No problem! When you\'re ready to add a package, just let me know. Type "help" for more options.',
      needsInput: true,
      state: ConversationState.WELCOME
    };
  }

  /**
   * Handle package type input
   */
  private handlePackageTypeInput(input: string, nlpResult: NLPResult): BotResponse {
    // Check for "same as last"
    if (nlpResult.intent === Intent.SAME_AS_LAST) {
      const lastPackage = this.sessionManager.getLastPackage();
      if (lastPackage) {
        this.sessionManager.updateCurrentPackage('packageType', lastPackage.packageType);
        return this.moveToNextState(ConversationState.ASKING_DIMENSIONS);
      }
    }

    // Extract package type from entities or text
    const packageTypeEntity = nlpResult.entities.find(e => e.type === 'package_type');
    const packageType = packageTypeEntity?.value || this.extractPackageTypeFromInput(input);

    if (!packageType) {
      return this.handleInvalidInput(
        ConversationState.ASKING_PACKAGE_TYPE,
        'I didn\'t catch the package type. Please choose: box, envelope, crate, pallet, tube, or other.'
      );
    }

    // Validate
    const validation = this.validator.validatePackageType(packageType);
    if (!validation.isValid) {
      return this.handleValidationError(ConversationState.ASKING_PACKAGE_TYPE, validation);
    }

    // Save and move to next
    this.sessionManager.updateCurrentPackage('packageType', packageType);
    this.resetRetryCount('packageType');

    return this.moveToNextState(ConversationState.ASKING_DIMENSIONS);
  }

  /**
   * Handle dimensions input
   */
  private handleDimensionsInput(input: string, nlpResult: NLPResult): BotResponse {
    // Check for "same as last"
    if (nlpResult.intent === Intent.SAME_AS_LAST) {
      const lastPackage = this.sessionManager.getLastPackage();
      if (lastPackage) {
        this.sessionManager.updateCurrentPackage('dimensions', lastPackage.dimensions);
        return this.moveToNextState(ConversationState.ASKING_WEIGHT);
      }
    }

    // Extract dimensions
    const dimensionEntity = nlpResult.entities.find(e => e.type === 'dimension');
    const dimensions = dimensionEntity?.value || this.parseDimensionsFromInput(input);

    if (!dimensions) {
      return this.handleInvalidInput(
        ConversationState.ASKING_DIMENSIONS,
        'Please provide dimensions in format: "length x width x height unit" (e.g., "10 x 5 x 3 cm") or skip.'
      );
    }

    // Validate
    const validation = this.validator.validateDimensions(dimensions);
    if (!validation.isValid) {
      return this.handleValidationError(ConversationState.ASKING_DIMENSIONS, validation);
    }

    // Save and move to next
    this.sessionManager.updateCurrentPackage('dimensions', dimensions);
    this.resetRetryCount('dimensions');

    let response = this.moveToNextState(ConversationState.ASKING_WEIGHT);
    
    // Add warnings if any
    if (validation.warnings.length > 0) {
      response.message = validation.warnings.join('\n') + '\n\n' + response.message;
    }

    return response;
  }

  /**
   * Handle weight input
   */
  private handleWeightInput(input: string, nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.SAME_AS_LAST) {
      const lastPackage = this.sessionManager.getLastPackage();
      if (lastPackage) {
        this.sessionManager.updateCurrentPackage('weight', lastPackage.weight);
        return this.moveToNextState(ConversationState.ASKING_FRAGILE);
      }
    }

    const weightEntity = nlpResult.entities.find(e => e.type === 'weight');
    const weight = weightEntity?.value || this.parseWeightFromInput(input);

    if (!weight) {
      return this.handleInvalidInput(
        ConversationState.ASKING_WEIGHT,
        'Please provide weight with unit (e.g., "5 kg", "10 lbs", "500 g").'
      );
    }

    const validation = this.validator.validateWeight(weight);
    if (!validation.isValid) {
      return this.handleValidationError(ConversationState.ASKING_WEIGHT, validation);
    }

    this.sessionManager.updateCurrentPackage('weight', weight);
    this.resetRetryCount('weight');

    let response = this.moveToNextState(ConversationState.ASKING_FRAGILE);
    
    if (validation.warnings.length > 0) {
      response.message = validation.warnings.join('\n') + '\n\n' + response.message;
    }

    return response;
  }

  /**
   * Handle fragile input
   */
  private handleFragileInput(input: string, nlpResult: NLPResult): BotResponse {
    const boolEntity = nlpResult.entities.find(e => e.type === 'boolean');
    const isFragile = boolEntity?.value;

    if (isFragile === undefined) {
      return this.handleInvalidInput(
        ConversationState.ASKING_FRAGILE,
        'Please answer yes or no.'
      );
    }

    this.sessionManager.updateCurrentPackage('isFragile', isFragile);
    this.resetRetryCount('fragile');

    return this.moveToNextState(ConversationState.ASKING_PRIORITY);
  }

  /**
   * Handle priority input
   */
  private handlePriorityInput(input: string, nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.SAME_AS_LAST) {
      const lastPackage = this.sessionManager.getLastPackage();
      if (lastPackage) {
        this.sessionManager.updateCurrentPackage('priority', lastPackage.priority);
        return this.moveToNextState(ConversationState.ASKING_DESTINATION);
      }
    }

    const priorityEntity = nlpResult.entities.find(e => e.type === 'priority');
    const priority = priorityEntity?.value || this.extractPriorityFromInput(input);

    if (!priority) {
      return this.handleInvalidInput(
        ConversationState.ASKING_PRIORITY,
        'Please choose: standard, express, overnight, or same_day.'
      );
    }

    const validation = this.validator.validatePriority(priority);
    if (!validation.isValid) {
      return this.handleValidationError(ConversationState.ASKING_PRIORITY, validation);
    }

    this.sessionManager.updateCurrentPackage('priority', priority);
    this.resetRetryCount('priority');

    return this.moveToNextState(ConversationState.ASKING_DESTINATION);
  }

  /**
   * Handle destination input
   */
  private handleDestinationInput(input: string, nlpResult: NLPResult): BotResponse {
    // Check for skip intent first
    if (nlpResult.intent === Intent.SKIP) {
      return this.moveToNextState(ConversationState.ASKING_SENDER);
    }

    if (nlpResult.intent === Intent.SAME_AS_LAST) {
      const lastPackage = this.sessionManager.getLastPackage();
      if (lastPackage) {
        this.sessionManager.updateCurrentPackage('destination', lastPackage.destination);
        return this.moveToNextState(ConversationState.ASKING_SENDER);
      }
    }

    // For simplicity, parse address from multi-line or structured input
    const address = this.parseAddressFromInput(input);

    if (!address) {
      return {
        message: `Please provide the destination address in the following format:

Street address
City, State
Postal code
Country

Or type each on separate lines, or say "skip" to enter later.`,
        needsInput: true,
        state: ConversationState.ASKING_DESTINATION
      };
    }

    const validation = this.validator.validateAddress(address);
    if (!validation.isValid) {
      return this.handleValidationError(ConversationState.ASKING_DESTINATION, validation);
    }

    this.sessionManager.updateCurrentPackage('destination', address);
    this.sessionManager.addCommonAddress(address);
    this.resetRetryCount('destination');

    let response = this.moveToNextState(ConversationState.ASKING_SENDER);
    
    if (validation.warnings.length > 0) {
      response.message = validation.warnings.join('\n') + '\n\n' + response.message;
    }

    return response;
  }

  /**
   * Handle sender input
   */
  private handleSenderInput(input: string, nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.SKIP) {
      return this.moveToNextState(ConversationState.ASKING_SPECIAL_INSTRUCTIONS);
    }

    if (nlpResult.intent === Intent.SAME_AS_LAST) {
      const lastPackage = this.sessionManager.getLastPackage();
      if (lastPackage && lastPackage.sender) {
        this.sessionManager.updateCurrentPackage('sender', lastPackage.sender);
        return this.moveToNextState(ConversationState.ASKING_SPECIAL_INSTRUCTIONS);
      }
    }

    const sender = this.parseSenderFromInput(input, nlpResult);

    if (!sender) {
      return {
        message: 'Please provide sender name and optionally email/phone, or type "skip".',
        needsInput: true,
        state: ConversationState.ASKING_SENDER
      };
    }

    const validation = this.validator.validateSenderInfo(sender);
    if (!validation.isValid) {
      return this.handleValidationError(ConversationState.ASKING_SENDER, validation);
    }

    this.sessionManager.updateCurrentPackage('sender', sender);
    this.sessionManager.setDefaultSender(sender);
    this.resetRetryCount('sender');

    return this.moveToNextState(ConversationState.ASKING_SPECIAL_INSTRUCTIONS);
  }

  /**
   * Handle special instructions input
   */
  private handleSpecialInstructionsInput(input: string, nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.SKIP) {
      return this.moveToNextState(ConversationState.ASKING_VALUE);
    }

    this.sessionManager.updateCurrentPackage('specialInstructions', input.trim());
    return this.moveToNextState(ConversationState.ASKING_VALUE);
  }

  /**
   * Handle value input
   */
  private handleValueInput(input: string, nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.SKIP) {
      return this.moveToNextState(ConversationState.ASKING_INSURANCE);
    }

    const value = parseFloat(input.replace(/[^0-9.]/g, ''));

    if (isNaN(value) || value < 0) {
      return this.handleInvalidInput(
        ConversationState.ASKING_VALUE,
        'Please enter a valid number (e.g., "100", "$250.50") or "skip".'
      );
    }

    this.sessionManager.updateCurrentPackage('estimatedValue', value);
    this.sessionManager.updateCurrentPackage('currency', 'USD');
    this.resetRetryCount('value');

    return this.moveToNextState(ConversationState.ASKING_INSURANCE);
  }

  /**
   * Handle insurance input
   */
  private handleInsuranceInput(input: string, nlpResult: NLPResult): BotResponse {
    const boolEntity = nlpResult.entities.find(e => e.type === 'boolean');
    const insuranceRequired = boolEntity?.value;

    if (insuranceRequired === undefined) {
      return this.handleInvalidInput(
        ConversationState.ASKING_INSURANCE,
        'Please answer yes or no.'
      );
    }

    this.sessionManager.updateCurrentPackage('insuranceRequired', insuranceRequired);
    this.resetRetryCount('insurance');

    return this.moveToNextState(ConversationState.ASKING_TRACKING_PREFS);
  }

  /**
   * Handle tracking preferences input
   */
  private handleTrackingPrefsInput(input: string, nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.SKIP) {
      this.sessionManager.updateCurrentPackage('trackingPreferences', {
        emailNotifications: false,
        smsNotifications: false,
        signatureRequired: false
      });
      return this.moveToNextState(ConversationState.PACKAGE_SUMMARY);
    }

    // Simple parsing for tracking preferences
    const prefs = {
      emailNotifications: /email/i.test(input),
      smsNotifications: /sms|text/i.test(input),
      signatureRequired: /signature/i.test(input)
    };

    this.sessionManager.updateCurrentPackage('trackingPreferences', prefs);
    return this.moveToNextState(ConversationState.PACKAGE_SUMMARY);
  }

  /**
   * Handle package summary state
   */
  private handlePackageSummaryState(nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.CONFIRM) {
      this.sessionManager.completeCurrentPackage();
      this.sessionManager.setState(ConversationState.ASKING_CONTINUE);

      return {
        message: 'Package saved successfully! ✓\n\nWould you like to add another package?',
        suggestions: ['Yes', 'No, I\'m done', 'View summary'],
        needsInput: true,
        state: ConversationState.ASKING_CONTINUE
      };
    }

    if (nlpResult.intent === Intent.DENY || nlpResult.intent === Intent.EDIT_PACKAGE) {
      this.sessionManager.setState(ConversationState.EDITING);
      return {
        message: 'What would you like to edit? (e.g., "change weight", "edit destination")',
        needsInput: true,
        state: ConversationState.EDITING
      };
    }

    return {
      message: 'Please confirm if the package details are correct (yes/no), or say "edit" to make changes.',
      needsInput: true,
      state: ConversationState.PACKAGE_SUMMARY
    };
  }

  /**
   * Handle editing state - when user wants to edit specific fields
   */
  private handleEditingState(input: string, nlpResult: NLPResult): BotResponse {
    const lowerInput = input.toLowerCase().trim();
    
    // Check if user wants to cancel editing
    if (lowerInput.includes('cancel') || lowerInput.includes('done') || lowerInput.includes('back') || lowerInput.includes('no')) {
      this.sessionManager.setState(ConversationState.PACKAGE_SUMMARY);
      return this.getPackageSummary();
    }
    
    // Check what field the user wants to edit
    if (lowerInput.includes('weight')) {
      this.sessionManager.setState(ConversationState.ASKING_WEIGHT);
      return {
        message: `Great! What's the new weight of this package?

Please include the unit (kg, lbs, g, oz)
Example: "5 kg", "10 lbs", "500 g"`,
        needsInput: true,
        state: ConversationState.ASKING_WEIGHT
      };
    }
    
    if (lowerInput.includes('dimension') || lowerInput.includes('size')) {
      this.sessionManager.setState(ConversationState.ASKING_DIMENSIONS);
      return {
        message: `What are the new dimensions?

Please provide in format: Length x Width x Height Unit
Example: "10 x 5 x 3 cm" or "12 x 8 x 6 inches"`,
        needsInput: true,
        state: ConversationState.ASKING_DIMENSIONS
      };
    }
    
    if (lowerInput.includes('destination') || lowerInput.includes('address')) {
      this.sessionManager.setState(ConversationState.ASKING_DESTINATION);
      return {
        message: `Where should this package be shipped to?

Please provide the full address:
Street address
City, State ZIP
Country`,
        needsInput: true,
        state: ConversationState.ASKING_DESTINATION
      };
    }
    
    if (lowerInput.includes('type') || lowerInput.includes('package type')) {
      this.sessionManager.setState(ConversationState.ASKING_PACKAGE_TYPE);
      return {
        message: 'What type of package is this?',
        suggestions: ['Box', 'Envelope', 'Crate', 'Pallet', 'Tube', 'Other'],
        needsInput: true,
        state: ConversationState.ASKING_PACKAGE_TYPE
      };
    }
    
    if (lowerInput.includes('fragile')) {
      this.sessionManager.setState(ConversationState.ASKING_FRAGILE);
      return {
        message: 'Is this package fragile? (yes/no)',
        suggestions: ['Yes', 'No'],
        needsInput: true,
        state: ConversationState.ASKING_FRAGILE
      };
    }
    
    if (lowerInput.includes('priority') || lowerInput.includes('shipping')) {
      this.sessionManager.setState(ConversationState.ASKING_PRIORITY);
      return {
        message: `What's the shipping priority?

Options:
- Standard (regular delivery)
- Express (faster delivery)
- Overnight (next day)
- Same Day (same day delivery)`,
        suggestions: ['Standard', 'Express', 'Overnight', 'Same Day'],
        needsInput: true,
        state: ConversationState.ASKING_PRIORITY
      };
    }
    
    if (lowerInput.includes('sender')) {
      this.sessionManager.setState(ConversationState.ASKING_SENDER);
      return {
        message: `📤 Who is sending this package?

Please provide the sender's information:
- Name (required)
- Email (optional)
- Phone (optional)

Examples:
- "John Doe"
- "Jane Smith, jane@email.com, +1234567890"`,
        needsInput: true,
        state: ConversationState.ASKING_SENDER
      };
    }
    
    if (lowerInput.includes('instruction') || lowerInput.includes('special')) {
      this.sessionManager.setState(ConversationState.ASKING_SPECIAL_INSTRUCTIONS);
      return {
        message: 'What are the special handling instructions?',
        needsInput: true,
        state: ConversationState.ASKING_SPECIAL_INSTRUCTIONS
      };
    }
    
    if (lowerInput.includes('value') || lowerInput.includes('price')) {
      this.sessionManager.setState(ConversationState.ASKING_VALUE);
      return {
        message: 'What is the estimated value of the package contents?\nExample: "100", "$250.50"',
        needsInput: true,
        state: ConversationState.ASKING_VALUE
      };
    }
    
    if (lowerInput.includes('insurance')) {
      this.sessionManager.setState(ConversationState.ASKING_INSURANCE);
      return {
        message: 'Would you like to add insurance for this package? (yes/no)',
        suggestions: ['Yes', 'No'],
        needsInput: true,
        state: ConversationState.ASKING_INSURANCE
      };
    }
    
    // If we can't determine what to edit, ask again with specific options
    return {
      message: `I can help you edit the following fields:
      
📦 Package Type
📏 Dimensions
⚖️ Weight
⚠️ Fragile status
🚚 Priority/Shipping
📍 Destination
👤 Sender information
📝 Special instructions
💰 Value
🛡️ Insurance

Please tell me which field you'd like to edit.`,
      suggestions: ['Weight', 'Dimensions', 'Destination', 'Priority', 'Cancel editing'],
      needsInput: true,
      state: ConversationState.EDITING
    };
  }

  /**
   * Handle continue state
   */
  private handleContinueState(nlpResult: NLPResult): BotResponse {
    if (nlpResult.intent === Intent.CONFIRM || nlpResult.intent === Intent.ADD_PACKAGE) {
      this.sessionManager.startNewPackage();
      this.sessionManager.setState(ConversationState.ASKING_PACKAGE_TYPE);

      return {
        message: 'Great! Let\'s add another package. What type of package is this?',
        suggestions: ['Box', 'Envelope', 'Crate', 'Same as last'],
        needsInput: true,
        state: ConversationState.ASKING_PACKAGE_TYPE
      };
    }

    return this.finishSession();
  }

  /**
   * Move to next state in the flow
   */
  private moveToNextState(nextState: ConversationState): BotResponse {
    this.sessionManager.setState(nextState);

    const messages: { [key in ConversationState]?: string } = {
      [ConversationState.ASKING_DIMENSIONS]: `Perfect! Now, what are the dimensions?

Please provide in format: Length x Width x Height Unit
Example: "10 x 5 x 3 cm" or "12 x 8 x 6 inches"

Or type "same as last" to use previous package dimensions.`,
      
      [ConversationState.ASKING_WEIGHT]: `Great! What's the weight of this package?

Please include the unit (kg, lbs, g, oz)
Example: "5 kg", "10 lbs", "500 g"

Or type "same as last" to use previous weight.`,
      
      [ConversationState.ASKING_FRAGILE]: 'Is this package fragile? (yes/no)',
      
      [ConversationState.ASKING_PRIORITY]: `What's the shipping priority?

Options:
- Standard (regular delivery)
- Express (faster delivery)
- Overnight (next day)
- Same Day (same day delivery)

Or type "same as last".`,
      
      [ConversationState.ASKING_DESTINATION]: `Where is this package being shipped to?

Please provide the full address or type "same as last":
Street address
City, State ZIP
Country`,
      
      [ConversationState.ASKING_SENDER]: `📤 Who is sending this package?

Please provide the sender's information:
- Name (required)
- Email (optional)
- Phone (optional)

Examples:
- "John Doe"
- "Jane Smith, jane@email.com, +1234567890"

Or type "skip" to leave blank, or "same as last" to reuse previous sender.`,
      
      [ConversationState.ASKING_SPECIAL_INSTRUCTIONS]: 'Any special handling instructions? (or type "skip")',
      
      [ConversationState.ASKING_VALUE]: 'What is the estimated value of the package contents? (or type "skip")\nExample: "100", "$250.50"',
      
      [ConversationState.ASKING_INSURANCE]: 'Would you like to add insurance for this package? (yes/no)',
      
      [ConversationState.ASKING_TRACKING_PREFS]: `What tracking preferences would you like?

You can choose: email, SMS, signature required
Example: "email and SMS" or type "skip" for none.`,
      
      [ConversationState.PACKAGE_SUMMARY]: this.getPackageConfirmation()
    };

    return {
      message: messages[nextState] || 'Moving to next step...',
      needsInput: true,
      state: nextState
    };
  }

  /**
   * Get package confirmation message
   */
  private getPackageConfirmation(): string {
    const pkg = this.sessionManager.getCurrentPackage();
    if (!pkg) return 'Error: No package data found.';

    let message = '\n📦 Package Summary:\n';
    message += '─────────────────────\n';
    message += `Type: ${pkg.packageType}\n`;
    
    if (pkg.dimensions) {
      message += `Dimensions: ${pkg.dimensions.length} x ${pkg.dimensions.width} x ${pkg.dimensions.height} ${pkg.dimensions.unit}\n`;
    }
    
    if (pkg.weight) {
      message += `Weight: ${pkg.weight.value} ${pkg.weight.unit}\n`;
    }
    
    message += `Fragile: ${pkg.isFragile ? 'Yes' : 'No'}\n`;
    message += `Priority: ${pkg.priority}\n`;
    
    if (pkg.destination) {
      message += `Destination: ${pkg.destination.city}, ${pkg.destination.state}, ${pkg.destination.country}\n`;
    }
    
    if (pkg.estimatedValue) {
      message += `Value: $${pkg.estimatedValue}\n`;
    }
    
    message += `Insurance: ${pkg.insuranceRequired ? 'Yes' : 'No'}\n`;
    message += '─────────────────────\n';
    message += '\nIs this information correct? (yes/no/edit)';

    return message;
  }

  /**
   * Handle invalid input
   */
  private handleInvalidInput(state: ConversationState, message: string): BotResponse {
    const key = state;
    const retries = this.retryCount.get(key) || 0;

    if (retries >= this.maxRetries - 1) {
      this.resetRetryCount(key);
      return {
        message: `${message}\n\nYou can also type "skip" to leave this field blank, "help" for assistance, or "cancel" to start over.`,
        needsInput: true,
        state
      };
    }

    this.retryCount.set(key, retries + 1);

    return {
      message,
      needsInput: true,
      state
    };
  }

  /**
   * Handle validation error
   */
  private handleValidationError(state: ConversationState, validation: any): BotResponse {
    let message = validation.errors.join('\n');
    
    if (validation.suggestions.length > 0) {
      message += '\n\n' + validation.suggestions.join('\n');
    }

    return this.handleInvalidInput(state, message);
  }

  /**
   * Reset retry count
   */
  private resetRetryCount(key: string): void {
    this.retryCount.delete(key);
  }

  /**
   * Get help response
   */
  private getHelpResponse(): BotResponse {
    return {
      message: `📚 Help & Commands:

🔹 Navigation:
- "help" - Show this help message
- "summary" - View all packages
- "finish" - Complete and export data
- "cancel" - Cancel current session
- "pause" - Save and resume later

🔹 Shortcuts:
- "same as last" - Copy value from previous package
- "skip" - Skip optional fields
- "edit" - Modify current package

🔹 Natural Language:
You can use natural descriptions like:
- "small box" for package type
- "10 x 5 x 3 cm" for dimensions
- "5 kg" for weight
- "express" for priority

Just answer questions naturally!`,
      needsInput: true,
      state: this.sessionManager.getCurrentState()
    };
  }

  /**
   * Get package summary
   */
  private getPackageSummary(): BotResponse {
    const packages = this.sessionManager.getPackages();
    
    if (packages.length === 0) {
      return {
        message: 'No packages added yet. Would you like to add one?',
        needsInput: true,
        state: this.sessionManager.getCurrentState()
      };
    }

    let message = `\n📦 Your Packages (${packages.length}):\n`;
    message += '═════════════════════════════\n\n';

    packages.forEach((pkg, index) => {
      message += `Package ${index + 1}:\n`;
      message += `  Type: ${pkg.packageType}\n`;
      message += `  Dimensions: ${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height} ${pkg.dimensions.unit}\n`;
      message += `  Weight: ${pkg.weight.value} ${pkg.weight.unit}\n`;
      message += `  Priority: ${pkg.priority}\n`;
      message += `  Destination: ${pkg.destination.city}, ${pkg.destination.country}\n`;
      message += '\n';
    });

    message += '═════════════════════════════\n';

    return {
      message,
      needsInput: true,
      state: this.sessionManager.getCurrentState()
    };
  }

  /**
   * Finish session
   */
  private finishSession(): BotResponse {
    const packages = this.sessionManager.getPackages();

    if (packages.length === 0) {
      this.sessionManager.setState(ConversationState.WELCOME);
      return {
        message: 'No packages to export. Session ended. Type "add" to start adding packages!',
        suggestions: ['Add package', 'Help'],
        needsInput: true,
        state: ConversationState.WELCOME
      };
    }

    this.sessionManager.setState(ConversationState.COMPLETED);

    return {
      message: `✓ Session completed!

Total packages collected: ${packages.length}

Your data has been saved. You can now export it using the "export" command.

Thank you for using the Package Collection System! 🎉`,
      needsInput: false,
      state: ConversationState.COMPLETED
    };
  }

  /**
   * Cancel session
   */
  private cancelSession(): BotResponse {
    this.sessionManager.clearSession();

    return {
      message: 'Session cancelled. All data cleared. Type anything to start fresh.',
      needsInput: true,
      state: ConversationState.WELCOME
    };
  }

  /**
   * Pause session
   */
  private async pauseSession(): Promise<BotResponse> {
    await this.sessionManager.saveSession();

    return {
      message: `Session paused and saved!

Session ID: ${this.sessionManager.getSessionId()}

You can resume later by providing this ID.`,
      needsInput: false,
      state: this.sessionManager.getCurrentState()
    };
  }

  /**
   * Export data
   */
  private exportData(): BotResponse {
    return {
      message: 'Export functionality will be implemented in the export service.',
      needsInput: true,
      state: this.sessionManager.getCurrentState()
    };
  }

  /**
   * Handle completed state - allow user to start new session
   */
  private handleCompletedState(nlpResult: NLPResult): BotResponse {
    // If user wants to add another package, restart the session
    if (nlpResult.intent === Intent.ADD_PACKAGE || nlpResult.intent === Intent.CONFIRM) {
      // Clear the session and start fresh
      this.sessionManager.clearSession();
      this.sessionManager.setState(ConversationState.WELCOME);
      
      // Start immediately
      this.sessionManager.startNewPackage();
      this.sessionManager.setState(ConversationState.ASKING_PACKAGE_TYPE);
      
      return {
        message: `Great! Let's start with the package type.

What type of package are you shipping?

Options:
- Box (standard cardboard box)
- Envelope (document/letter)
- Crate (wooden crate)
- Pallet (large pallet)
- Tube (cylindrical tube)
- Other

You can also describe it naturally, like "small box" or "large envelope".`,
        suggestions: ['Box', 'Envelope', 'Crate', 'Pallet'],
        needsInput: true,
        state: ConversationState.ASKING_PACKAGE_TYPE
      };
    }

    // Otherwise, restart with welcome message
    this.sessionManager.clearSession();
    this.sessionManager.setState(ConversationState.WELCOME);
    return this.getWelcomeMessage();
  }

  // Helper parsing methods

  private extractPackageTypeFromInput(input: string): string | null {
    const lower = input.toLowerCase();
    if (lower.includes('box')) return PackageType.BOX;
    if (lower.includes('envelope')) return PackageType.ENVELOPE;
    if (lower.includes('crate')) return PackageType.CRATE;
    if (lower.includes('pallet')) return PackageType.PALLET;
    if (lower.includes('tube')) return PackageType.TUBE;
    return null;
  }

  private parseDimensionsFromInput(input: string): Dimensions | null {
    const match = input.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*(cm|inch|inches|in|m)/i);
    if (match) {
      return {
        length: parseFloat(match[1]),
        width: parseFloat(match[2]),
        height: parseFloat(match[3]),
        unit: this.normalizeUnit(match[4])
      };
    }
    return null;
  }

  private parseWeightFromInput(input: string): Weight | null {
    const match = input.match(/(\d+\.?\d*)\s*(kg|lbs|g|oz)/i);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: this.normalizeWeightUnit(match[2])
      };
    }
    return null;
  }

  private extractPriorityFromInput(input: string): string | null {
    const lower = input.toLowerCase();
    if (lower.includes('overnight') || lower.includes('next day')) return PriorityLevel.OVERNIGHT;
    if (lower.includes('same day')) return PriorityLevel.SAME_DAY;
    if (lower.includes('express')) return PriorityLevel.EXPRESS;
    if (lower.includes('standard') || lower.includes('regular')) return PriorityLevel.STANDARD;
    return null;
  }

  private parseAddressFromInput(input: string): Address | null {
    // Simple parsing - in production, use a proper address parser
    const lines = input.split('\n').map(l => l.trim()).filter(l => l);
    
    // Multi-line format (preferred)
    if (lines.length >= 3) {
      return {
        street: lines[0],
        city: lines[1].split(',')[0]?.trim() || '',
        state: lines[1].split(',')[1]?.trim() || '',
        postalCode: lines[2].split(' ')[0] || '',
        country: lines[lines.length - 1]
      };
    }
    
    // Single line with comma separation
    if (lines.length === 1 && input.includes(',')) {
      const parts = input.split(',').map(p => p.trim());
      
      // Format 1: street, city, state, postalCode, country (5 parts)
      if (parts.length >= 5) {
        return {
          street: parts[0],
          city: parts[1],
          state: parts[2],
          postalCode: parts[3],
          country: parts[4]
        };
      }
      
      // Format 2: street, city, state postalCode, country (4 parts with space-separated state/postal)
      if (parts.length >= 4) {
        const statePostal = parts[2].split(' ');
        return {
          street: parts[0],
          city: parts[1],
          state: statePostal[0] || '',
          postalCode: statePostal.slice(1).join(' ') || parts[2],
          country: parts[3]
        };
      }
      
      // Format 3: street, city state, country (3 parts)
      if (parts.length >= 3) {
        const cityState = parts[1].split(' ');
        return {
          street: parts[0],
          city: cityState[0] || parts[1],
          state: cityState.slice(1).join(' ') || '',
          postalCode: parts[2].split(' ')[0] || '',
          country: parts[parts.length - 1]
        };
      }
    }

    return null;
  }

  private parseSenderFromInput(input: string, nlpResult: NLPResult): any {
    const emailEntity = nlpResult.entities.find(e => e.type === 'email');
    const phoneEntity = nlpResult.entities.find(e => e.type === 'phone');

    const lines = input.split('\n').map(l => l.trim()).filter(l => l);
    const name = lines[0] || input;

    return {
      name,
      email: emailEntity?.value,
      phone: phoneEntity?.value
    };
  }

  private normalizeUnit(unit: string): DimensionUnit {
    const lower = unit.toLowerCase();
    if (lower.includes('inch') || lower === 'in') return DimensionUnit.INCH;
    if (lower === 'm') return DimensionUnit.M;
    return DimensionUnit.CM;
  }

  private normalizeWeightUnit(unit: string): WeightUnit {
    const lower = unit.toLowerCase();
    if (lower.includes('lb')) return WeightUnit.LBS;
    if (lower === 'g') return WeightUnit.G;
    if (lower.includes('oz')) return WeightUnit.OZ;
    return WeightUnit.KG;
  }
}
