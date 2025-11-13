/**
 * Package types supported by the system
 */
export enum PackageType {
  BOX = 'box',
  ENVELOPE = 'envelope',
  CRATE = 'crate',
  PALLET = 'pallet',
  TUBE = 'tube',
  OTHER = 'other'
}

/**
 * Priority levels for shipping
 */
export enum PriorityLevel {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  SAME_DAY = 'same_day'
}

/**
 * Unit types for measurements
 */
export enum DimensionUnit {
  CM = 'cm',
  INCH = 'inch',
  M = 'm'
}

export enum WeightUnit {
  KG = 'kg',
  LBS = 'lbs',
  G = 'g',
  OZ = 'oz'
}

/**
 * Dimensions of a package
 */
export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: DimensionUnit;
}

/**
 * Weight of a package
 */
export interface Weight {
  value: number;
  unit: WeightUnit;
}

/**
 * Address information
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

/**
 * Sender information
 */
export interface SenderInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
}

/**
 * Complete package data
 */
export interface Package {
  id: string;
  packageType: PackageType;
  dimensions: Dimensions;
  weight: Weight;
  isFragile: boolean;
  priority: PriorityLevel;
  destination: Address;
  sender?: SenderInfo;
  specialInstructions?: string;
  estimatedValue?: number;
  currency?: string;
  insuranceRequired: boolean;
  trackingPreferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    signatureRequired: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  totalPackages: number;
  completedPackages: number;
  totalEstimatedCost?: number;
  currency?: string;
  userId?: string;
  userAgent?: string;
}

/**
 * Complete session data
 */
export interface Session {
  metadata: SessionMetadata;
  packages: Package[];
  conversationHistory: ConversationEntry[];
  currentPackage?: Partial<Package>;
  templates: { [key: string]: Partial<Package> };
  preferences: UserPreferences;
}

/**
 * Conversation entry
 */
export interface ConversationEntry {
  timestamp: Date;
  role: 'user' | 'bot';
  message: string;
  intent?: string;
  entities?: { [key: string]: any };
}

/**
 * User preferences learned during the session
 */
export interface UserPreferences {
  defaultSender?: SenderInfo;
  commonAddresses: Address[];
  defaultPriority?: PriorityLevel;
  defaultCurrency?: string;
  defaultDimensionUnit?: DimensionUnit;
  defaultWeightUnit?: WeightUnit;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * JSON output structure
 */
export interface ExportData {
  apiVersion: string;
  metadata: SessionMetadata;
  packages: Package[];
  validationStatus: {
    allFieldsValidated: boolean;
    invalidPackages: string[];
  };
  userInformation?: SenderInfo;
  exportedAt: Date;
}
