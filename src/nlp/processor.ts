/**
 * LogisticsChatIQ - NLP Processor
 * Author: Jay Atria
 * GitHub: https://github.com/JayAtria-7
 * License: MIT
 * Description: Natural language processing for extracting shipping information from user input
 */

import {
  PackageType, PriorityLevel, DimensionUnit, WeightUnit, Intent, EntityType } from '../models/enums';

/**
 * Entity extracted from user input
 */
export interface ExtractedEntity {
  type: EntityType;
  value: any;
  confidence: number;
  raw: string;
}

/**
 * NLP result
 */
export interface NLPResult {
  intent: Intent | null;
  entities: ExtractedEntity[];
  confidence: number;
  normalizedText: string;
}

/**
 * Natural Language Processor for package chatbot
 */
export class NLPProcessor {
  private intentPatterns: Map<Intent, RegExp[]>;
  private entityPatterns: Map<EntityType, RegExp[]>;

  constructor() {
    this.intentPatterns = this.initializeIntentPatterns();
    this.entityPatterns = this.initializeEntityPatterns();
  }

  /**
   * Initialize intent recognition patterns
   */
  private initializeIntentPatterns(): Map<Intent, RegExp[]> {
    const patterns = new Map<Intent, RegExp[]>();

    patterns.set(Intent.ADD_PACKAGE, [
      /add (a |another )?package/i,
      /new package/i,
      /create package/i,
      /start (a )?new one/i
    ]);

    patterns.set(Intent.EDIT_PACKAGE, [
      /edit( package)?( \d+)?/i,
      /change( package)?( \d+)?/i,
      /modify( package)?( \d+)?/i,
      /update( package)?( \d+)?/i
    ]);

    patterns.set(Intent.DELETE_PACKAGE, [
      /delete( package)?( \d+)?/i,
      /remove( package)?( \d+)?/i,
      /cancel( package)?( \d+)?/i
    ]);

    patterns.set(Intent.VIEW_SUMMARY, [
      /view summary/i,
      /show (me )?(all )?packages/i,
      /list packages/i,
      /what('s| is) (in |)my (cart|list)/i,
      /summary/i
    ]);

    patterns.set(Intent.CONFIRM, [
      /^(yes|yep|yeah|yup|sure|ok|okay|correct|right|affirmative)$/i,
      /^y$/i,
      /that('s| is) (correct|right)/i,
      /sounds good/i
    ]);

    patterns.set(Intent.DENY, [
      /^(no|nope|nah|not really)$/i,
      /^n$/i,
      /that('s| is) (not |in)?correct/i,
      /that('s| is) wrong/i
    ]);

    patterns.set(Intent.HELP, [
      /help/i,
      /what can (you|i) do/i,
      /how (does this|do i) work/i,
      /commands/i,
      /options/i
    ]);

    patterns.set(Intent.SKIP, [
      /skip/i,
      /pass/i,
      /next/i,
      /leave (it )?blank/i,
      /none/i,
      /not applicable/i,
      /n\/?a/i
    ]);

    patterns.set(Intent.SAME_AS_LAST, [
      /same as (last|previous|before)/i,
      /repeat( last)?/i,
      /ditto/i,
      /copy (from )?(last|previous)/i
    ]);

    patterns.set(Intent.USE_TEMPLATE, [
      /use template/i,
      /load template/i,
      /from template/i
    ]);

    patterns.set(Intent.SAVE_TEMPLATE, [
      /save (as |this as )?template/i,
      /create template/i,
      /remember this/i
    ]);

    patterns.set(Intent.FINISH, [
      /finish/i,
      /done/i,
      /complete/i,
      /end/i,
      /that('s| is) (all|it)/i,
      /no more/i,
      /i'm done/i
    ]);

    patterns.set(Intent.CANCEL, [
      /cancel/i,
      /abort/i,
      /quit/i,
      /exit/i,
      /stop/i
    ]);

    patterns.set(Intent.PAUSE, [
      /pause/i,
      /save (for |and )?(later|now)/i,
      /come back later/i
    ]);

    patterns.set(Intent.EXPORT, [
      /export/i,
      /download/i,
      /save (to )?file/i,
      /get (the )?json/i
    ]);

    patterns.set(Intent.BULK_EDIT, [
      /all packages/i,
      /make all/i,
      /change all( to)?/i,
      /set all( to)?/i
    ]);

    return patterns;
  }

  /**
   * Initialize entity extraction patterns
   */
  private initializeEntityPatterns(): Map<EntityType, RegExp[]> {
    const patterns = new Map<EntityType, RegExp[]>();

    patterns.set(EntityType.DIMENSION, [
      /(\d+\.?\d*)\s*(cm|inch|inches|in|m|meter|meters|centimeter|centimeters)/i,
      /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(cm|inch|inches|in|m)/i,
      /length:?\s*(\d+\.?\d*)/i,
      /width:?\s*(\d+\.?\d*)/i,
      /height:?\s*(\d+\.?\d*)/i
    ]);

    patterns.set(EntityType.WEIGHT, [
      /(\d+\.?\d*)\s*(kg|kilogram|kilograms|lbs|pounds?|g|grams?|oz|ounces?)/i,
      /weighs?\s*(\d+\.?\d*)\s*(kg|lbs|g|oz)/i
    ]);

    patterns.set(EntityType.BOOLEAN, [
      /^(yes|no|true|false|y|n)$/i
    ]);

    patterns.set(EntityType.NUMBER, [
      /\d+\.?\d*/
    ]);

    patterns.set(EntityType.EMAIL, [
      /[\w\.-]+@[\w\.-]+\.\w+/i
    ]);

    patterns.set(EntityType.PHONE, [
      /[\d\s\-\+\(\)]{10,}/
    ]);

    return patterns;
  }

  /**
   * Process user input and extract intent and entities
   */
  process(input: string): NLPResult {
    const normalizedText = input.trim();
    
    const intent = this.recognizeIntent(normalizedText);
    const entities = this.extractEntities(normalizedText);

    return {
      intent,
      entities,
      confidence: intent ? 0.8 : 0.3,
      normalizedText
    };
  }

  /**
   * Recognize user intent from input
   */
  private recognizeIntent(text: string): Intent | null {
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return intent;
        }
      }
    }
    return null;
  }

  /**
   * Extract entities from input
   */
  private extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Extract package type
    const packageType = this.extractPackageType(text);
    if (packageType) {
      entities.push({
        type: EntityType.PACKAGE_TYPE,
        value: packageType,
        confidence: 0.9,
        raw: text
      });
    }

    // Extract priority
    const priority = this.extractPriority(text);
    if (priority) {
      entities.push({
        type: EntityType.PRIORITY,
        value: priority,
        confidence: 0.9,
        raw: text
      });
    }

    // Extract dimensions
    const dimensions = this.extractDimensions(text);
    if (dimensions) {
      entities.push({
        type: EntityType.DIMENSION,
        value: dimensions,
        confidence: 0.85,
        raw: text
      });
    }

    // Extract weight
    const weight = this.extractWeight(text);
    if (weight) {
      entities.push({
        type: EntityType.WEIGHT,
        value: weight,
        confidence: 0.85,
        raw: text
      });
    }

    // Extract boolean
    const boolean = this.extractBoolean(text);
    if (boolean !== null) {
      entities.push({
        type: EntityType.BOOLEAN,
        value: boolean,
        confidence: 0.95,
        raw: text
      });
    }

    // Extract email
    const email = this.extractEmail(text);
    if (email) {
      entities.push({
        type: EntityType.EMAIL,
        value: email,
        confidence: 0.9,
        raw: text
      });
    }

    // Extract phone
    const phone = this.extractPhone(text);
    if (phone) {
      entities.push({
        type: EntityType.PHONE,
        value: phone,
        confidence: 0.8,
        raw: text
      });
    }

    return entities;
  }

  /**
   * Extract package type from text
   */
  private extractPackageType(text: string): PackageType | null {
    const lower = text.toLowerCase();
    
    if (lower.includes('box')) return PackageType.BOX;
    if (lower.includes('envelope')) return PackageType.ENVELOPE;
    if (lower.includes('crate')) return PackageType.CRATE;
    if (lower.includes('pallet')) return PackageType.PALLET;
    if (lower.includes('tube')) return PackageType.TUBE;
    
    return null;
  }

  /**
   * Extract priority from text
   */
  private extractPriority(text: string): PriorityLevel | null {
    const lower = text.toLowerCase();
    
    if (lower.includes('overnight') || lower.includes('next day')) return PriorityLevel.OVERNIGHT;
    if (lower.includes('same day')) return PriorityLevel.SAME_DAY;
    if (lower.includes('express') || lower.includes('fast') || lower.includes('quick')) return PriorityLevel.EXPRESS;
    if (lower.includes('standard') || lower.includes('regular') || lower.includes('normal')) return PriorityLevel.STANDARD;
    
    return null;
  }

  /**
   * Extract dimensions from text
   */
  private extractDimensions(text: string): any {
    // Try to match LxWxH format
    const dimensionMatch = text.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(cm|inch|inches|in|m)/i);
    if (dimensionMatch) {
      const unit = this.normalizeUnit(dimensionMatch[4]);
      return {
        length: parseFloat(dimensionMatch[1]),
        width: parseFloat(dimensionMatch[2]),
        height: parseFloat(dimensionMatch[3]),
        unit
      };
    }

    // Try individual dimensions
    const lengthMatch = text.match(/length:?\s*(\d+\.?\d*)/i);
    const widthMatch = text.match(/width:?\s*(\d+\.?\d*)/i);
    const heightMatch = text.match(/height:?\s*(\d+\.?\d*)/i);
    
    if (lengthMatch && widthMatch && heightMatch) {
      const unitMatch = text.match(/(cm|inch|inches|in|m|meter|meters)/i);
      const unit = unitMatch ? this.normalizeUnit(unitMatch[1]) : DimensionUnit.CM;
      
      return {
        length: parseFloat(lengthMatch[1]),
        width: parseFloat(widthMatch[1]),
        height: parseFloat(heightMatch[1]),
        unit
      };
    }

    return null;
  }

  /**
   * Extract weight from text
   */
  private extractWeight(text: string): any {
    const weightMatch = text.match(/(\d+\.?\d*)\s*(kg|kilogram|kilograms|lbs|pounds?|g|grams?|oz|ounces?)/i);
    if (weightMatch) {
      const unit = this.normalizeWeightUnit(weightMatch[2]);
      return {
        value: parseFloat(weightMatch[1]),
        unit
      };
    }
    return null;
  }

  /**
   * Extract boolean from text
   */
  private extractBoolean(text: string): boolean | null {
    const lower = text.toLowerCase().trim();
    if (['yes', 'y', 'true', 'yeah', 'yep', 'sure', 'ok'].includes(lower)) return true;
    if (['no', 'n', 'false', 'nope', 'nah'].includes(lower)) return false;
    return null;
  }

  /**
   * Extract email from text
   */
  private extractEmail(text: string): string | null {
    const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : null;
  }

  /**
   * Extract phone from text
   */
  private extractPhone(text: string): string | null {
    const phoneMatch = text.match(/[\d\s\-\+\(\)]{10,}/);
    return phoneMatch ? phoneMatch[0].trim() : null;
  }

  /**
   * Normalize dimension unit
   */
  private normalizeUnit(unit: string): DimensionUnit {
    const lower = unit.toLowerCase();
    if (lower.includes('inch') || lower === 'in') return DimensionUnit.INCH;
    if (lower === 'm' || lower.includes('meter')) return DimensionUnit.M;
    return DimensionUnit.CM;
  }

  /**
   * Normalize weight unit
   */
  private normalizeWeightUnit(unit: string): WeightUnit {
    const lower = unit.toLowerCase();
    if (lower.includes('lb') || lower.includes('pound')) return WeightUnit.LBS;
    if (lower.includes('g') && !lower.includes('kg')) return WeightUnit.G;
    if (lower.includes('oz') || lower.includes('ounce')) return WeightUnit.OZ;
    return WeightUnit.KG;
  }
}

export const nlpProcessor = new NLPProcessor();
