import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface UsageDay {
  date: string;
  models: string[];
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  totalTokens: number;
  cost: number;
}

export interface UsageReport {
  days: UsageDay[];
  total: {
    input: number;
    output: number;
    cacheCreate: number;
    cacheRead: number;
    totalTokens: number;
    cost: number;
  };
}

/**
 * Service for checking and running ccusage CLI tool
 * ccusage provides Claude Code token usage reports
 */
export class CCUsageService {
  /**
   * Get the execution environment with proper PATH for macOS
   */
  private getExecEnv() {
    const env = { ...process.env };

    // On macOS, add common binary paths that might not be in Electron's PATH
    if (process.platform === 'darwin') {
      const paths = [env.PATH || '', '/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin'];
      env.PATH = paths.filter(p => p).join(':');
    }

    return env;
  }

  /**
   * Check if ccusage is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      const env = this.getExecEnv();
      // Use process.stdout.write to ensure visibility in terminal
      process.stdout.write(`[CCUsage] Checking installation with PATH: ${env.PATH}\n`);

      // Try to run ccusage --version instead of which
      const { stdout } = await execAsync('ccusage --version', {
        env,
      });
      process.stdout.write(`[CCUsage] ccusage --version stdout: ${stdout}\n`);
      const installed = stdout.trim().length > 0;
      process.stdout.write(`[CCUsage] isInstalled result: ${installed}\n`);
      return installed;
    } catch (error) {
      process.stderr.write(
        `[CCUsage] Error checking installation: ${error instanceof Error ? error.message : error}\n`
      );
      if (error instanceof Error && 'stderr' in error) {
        process.stderr.write(`[CCUsage] stderr: ${(error as any).stderr}\n`);
      }
      return false;
    }
  }

  /**
   * Get ccusage version
   */
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('ccusage --version', {
        env: this.getExecEnv(),
      });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Get raw ccusage output
   */
  async getRawOutput(): Promise<string> {
    try {
      process.stdout.write('[CCUsage] Running ccusage --no-color\n');
      const { stdout } = await execAsync('ccusage --no-color', {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        env: this.getExecEnv(),
      });
      process.stdout.write(`[CCUsage] Got ${stdout.length} chars of output\n`);
      return stdout;
    } catch (error) {
      process.stderr.write(
        `[CCUsage] Error running ccusage: ${error instanceof Error ? error.message : error}\n`
      );
      throw new Error(
        `Failed to run ccusage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Run ccusage and get the usage report
   */
  async getUsageReport(): Promise<UsageReport> {
    try {
      const stdout = await this.getRawOutput();
      const result = this.parseUsageOutput(stdout);
      process.stdout.write(`[CCUsage] Parsed ${result.days.length} days\n`);
      return result;
    } catch (error) {
      process.stderr.write(
        `[CCUsage] Error getting usage report: ${error instanceof Error ? error.message : error}\n`
      );
      throw new Error(
        `Failed to run ccusage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse ccusage output into structured data
   */
  private parseUsageOutput(output: string): UsageReport {
    const days: UsageDay[] = [];
    let totalData = {
      input: 0,
      output: 0,
      cacheCreate: 0,
      cacheRead: 0,
      totalTokens: 0,
      cost: 0,
    };

    // Split into lines and find the table
    const lines = output.split('\n');
    process.stdout.write(`[CCUsage Parser] Processing ${lines.length} lines\n`);
    let inTable = false;
    let currentDay: UsageDay | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!line) continue;

      // Detect table start (line with Date header)
      if (line.includes('Date') && line.includes('Models') && line.includes('Input')) {
        process.stdout.write(`[CCUsage Parser] Found table header at line ${i}\n`);
        inTable = true;
        i++; // Skip the header separator line
        continue;
      }

      if (!inTable) continue;

      // Parse data rows
      if (line.includes('│') && !line.includes('─')) {
        const parsed = this.parseTableRow(line, currentDay);

        if (parsed) {
          if (parsed.date === 'Total') {
            totalData = {
              input: parsed.input,
              output: parsed.output,
              cacheCreate: parsed.cacheCreate,
              cacheRead: parsed.cacheRead,
              totalTokens: parsed.totalTokens,
              cost: parsed.cost,
            };
            currentDay = null;
          } else if (parsed.isNewDay) {
            // This is a new day entry
            if (currentDay) {
              days.push(currentDay);
            }
            currentDay = parsed;
          } else if (currentDay && parsed.models.length > 0) {
            // This is a continuation row with additional models
            currentDay.models.push(...parsed.models);
          }
        }
      }
    }

    // Push the last day if exists
    if (currentDay) {
      days.push(currentDay);
    }

    return {
      days,
      total: totalData,
    };
  }

  /**
   * Parse a single table row
   */
  private parseTableRow(
    line: string,
    currentDay: UsageDay | null
  ): (UsageDay & { isNewDay: boolean }) | null {
    try {
      // Split by │ and clean up
      const parts = line.split('│').map(p => p.trim());

      if (parts.length < 8) return null;

      const dateStr = parts[0] || '';
      const modelsStr = parts[1] || '';
      const inputStr = parts[2] || '';
      const outputStr = parts[3] || '';
      const cacheCreateStr = parts[4] || '';
      const cacheReadStr = parts[5] || '';
      const totalTokensStr = parts[6] || '';
      const costStr = parts[7] || '';

      // Extract model names (they appear as "- model-name")
      const models: string[] = [];
      if (modelsStr && modelsStr !== '') {
        const modelMatches = modelsStr.match(/- ([\w-]+)/g);
        if (modelMatches) {
          models.push(...modelMatches.map(m => m.replace('- ', '')));
        }
      }

      // Check if this is a new day or a continuation row
      const isNewDay = dateStr.trim().length > 0 && dateStr.trim() !== '';

      if (isNewDay) {
        // This is a new day entry with a date
        return {
          date: dateStr,
          models,
          input: this.parseNumber(inputStr),
          output: this.parseNumber(outputStr),
          cacheCreate: this.parseNumber(cacheCreateStr),
          cacheRead: this.parseNumber(cacheReadStr),
          totalTokens: this.parseNumber(totalTokensStr),
          cost: this.parseCost(costStr),
          isNewDay: true,
        };
      } else if (currentDay && models.length > 0) {
        // This is a continuation row (no date, just additional models)
        return {
          date: currentDay.date,
          models,
          input: currentDay.input,
          output: currentDay.output,
          cacheCreate: currentDay.cacheCreate,
          cacheRead: currentDay.cacheRead,
          totalTokens: currentDay.totalTokens,
          cost: currentDay.cost,
          isNewDay: false,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse number from string (handles commas)
   */
  private parseNumber(str: string): number {
    if (!str || str.trim() === '') return 0;
    return parseInt(str.replace(/,/g, ''), 10) || 0;
  }

  /**
   * Parse cost from string (removes $ and handles decimals)
   */
  private parseCost(str: string): number {
    if (!str || str.trim() === '') return 0;
    return parseFloat(str.replace(/[$,]/g, '')) || 0;
  }
}
