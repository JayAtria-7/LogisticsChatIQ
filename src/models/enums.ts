/**
 * States in the package data collection flow
 */
export enum ConversationState {
  WELCOME = 'welcome',
  ASKING_PACKAGE_TYPE = 'asking_package_type',
  ASKING_DIMENSIONS = 'asking_dimensions',
  ASKING_WEIGHT = 'asking_weight',
  ASKING_FRAGILE = 'asking_fragile',
  ASKING_PRIORITY = 'asking_priority',
  ASKING_DESTINATION = 'asking_destination',
  ASKING_SENDER = 'asking_sender',
  ASKING_SPECIAL_INSTRUCTIONS = 'asking_special_instructions',
  ASKING_VALUE = 'asking_value',
  ASKING_INSURANCE = 'asking_insurance',
  ASKING_TRACKING_PREFS = 'asking_tracking_prefs',
  PACKAGE_SUMMARY = 'package_summary',
  ASKING_CONTINUE = 'asking_continue',
  COMPLETED = 'completed',
  EDITING = 'editing',
  VIEWING_SUMMARY = 'viewing_summary'
}

/**
 * User intents recognized by NLP
 */
export enum Intent {
  ADD_PACKAGE = 'add_package',
  EDIT_PACKAGE = 'edit_package',
  DELETE_PACKAGE = 'delete_package',
  VIEW_SUMMARY = 'view_summary',
  CONFIRM = 'confirm',
  DENY = 'deny',
  HELP = 'help',
  SKIP = 'skip',
  SAME_AS_LAST = 'same_as_last',
  USE_TEMPLATE = 'use_template',
  SAVE_TEMPLATE = 'save_template',
  FINISH = 'finish',
  CANCEL = 'cancel',
  PAUSE = 'pause',
  EXPORT = 'export',
  BULK_EDIT = 'bulk_edit'
}

/**
 * Entity types extracted from user input
 */
export enum EntityType {
  PACKAGE_TYPE = 'package_type',
  DIMENSION = 'dimension',
  WEIGHT = 'weight',
  ADDRESS = 'address',
  PRIORITY = 'priority',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  DATE = 'date',
  EMAIL = 'email',
  PHONE = 'phone'
}
