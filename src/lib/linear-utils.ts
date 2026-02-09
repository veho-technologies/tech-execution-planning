/**
 * Linear integration utilities
 */

/**
 * Parse actual days from Linear issue comments or description
 * Supports patterns like:
 * - "Actual: 3.5 days"
 * - "Actual: 3.5d"
 * - "Time spent: 3.5 days"
 * - "actual: 3.5"
 *
 * @param text - Text content from Linear (comments or description)
 * @returns Parsed days value or null if no match found
 */
export function parseActualDaysFromLinear(text: string): number | null {
  if (!text) return null;

  // Regex patterns to match various formats
  const patterns = [
    /actual:\s*(\d+(?:\.\d+)?)\s*(?:days?|d)?/i,
    /time\s*spent:\s*(\d+(?:\.\d+)?)\s*(?:days?|d)?/i,
    /spent:\s*(\d+(?:\.\d+)?)\s*(?:days?|d)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const days = parseFloat(match[1]);
      if (!isNaN(days) && days >= 0) {
        return days;
      }
    }
  }

  return null;
}

/**
 * Extract actual days from Linear issue data
 * Checks comments first, then description
 *
 * @param linearIssue - Linear issue object with comments and description
 * @returns Parsed actual days or 0 if not found
 */
export function extractActualDaysFromLinearIssue(linearIssue: any): number {
  // Check all comments (most recent first)
  if (linearIssue.comments?.nodes && Array.isArray(linearIssue.comments.nodes)) {
    for (const comment of linearIssue.comments.nodes) {
      const actual = parseActualDaysFromLinear(comment.body);
      if (actual !== null) {
        return actual;
      }
    }
  }

  // Check description
  if (linearIssue.description) {
    const actual = parseActualDaysFromLinear(linearIssue.description);
    if (actual !== null) {
      return actual;
    }
  }

  return 0;
}

/**
 * Parse multiple actual day entries from text
 * Useful for tracking actuals per sprint in comments
 *
 * Example:
 * "Sprint 1 Actual: 2.5 days
 *  Sprint 2 Actual: 3.0 days"
 *
 * @param text - Text with potential multiple actual entries
 * @returns Map of sprint identifiers to actual days
 */
export function parseMultipleActuals(text: string): Map<string, number> {
  const results = new Map<string, number>();

  if (!text) return results;

  // Match pattern: "Sprint X Actual: Y days"
  const sprintPattern = /sprint\s+(\d+|[a-z]+)\s+actual:\s*(\d+(?:\.\d+)?)\s*(?:days?|d)?/gi;

  let match;
  while ((match = sprintPattern.exec(text)) !== null) {
    const sprintId = match[1].toLowerCase();
    const days = parseFloat(match[2]);
    if (!isNaN(days) && days >= 0) {
      results.set(sprintId, days);
    }
  }

  return results;
}
