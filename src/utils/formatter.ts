/**
 * Color codes for terminal output
 */
export const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Formatter utility for console output
 */
export class Formatter {
  /**
   * Format success message
   */
  static success(message: string): string {
    return `${Colors.green}✓ ${message}${Colors.reset}`;
  }

  /**
   * Format error message
   */
  static error(message: string): string {
    return `${Colors.red}✗ ${message}${Colors.reset}`;
  }

  /**
   * Format warning message
   */
  static warning(message: string): string {
    return `${Colors.yellow}⚠ ${message}${Colors.reset}`;
  }

  /**
   * Format info message
   */
  static info(message: string): string {
    return `${Colors.cyan}ℹ ${message}${Colors.reset}`;
  }

  /**
   * Format header
   */
  static header(message: string): string {
    return `${Colors.bright}${Colors.blue}${message}${Colors.reset}`;
  }

  /**
   * Format bot message
   */
  static bot(message: string): string {
    return `${Colors.cyan}🤖 Bot: ${Colors.reset}${message}`;
  }

  /**
   * Format user prompt
   */
  static prompt(): string {
    return `${Colors.green}You: ${Colors.reset}`;
  }

  /**
   * Clear console
   */
  static clear(): void {
    console.clear();
  }

  /**
   * Print line separator
   */
  static separator(char: string = '─', length: number = 60): string {
    return char.repeat(length);
  }

  /**
   * Format JSON for display
   */
  static json(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}
