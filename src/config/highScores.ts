/**
 * High score storage and retrieval utilities
 * 
 * Manages high scores in localStorage with a maximum of 10 entries,
 * sorted by score in descending order.
 */

export interface HighScore {
  score: number;
  date: string; // ISO date string
}

const STORAGE_KEY = "ventureHighScores";
const MAX_ENTRIES = 10;

/**
 * Retrieve top high scores from localStorage
 * @returns Array of high scores sorted by score (descending), max 10 entries
 */
export function getHighScores(): HighScore[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const scores: HighScore[] = JSON.parse(stored);
    // Ensure we only return up to MAX_ENTRIES
    return scores.slice(0, MAX_ENTRIES);
  } catch (error) {
    console.error("Error reading high scores from localStorage:", error);
    return [];
  }
}

/**
 * Add a new high score and maintain top 10 list
 * @param score The score to add
 * @param date The date when the score was achieved (defaults to current date)
 */
export function addHighScore(score: number, date: Date = new Date()): void {
  try {
    const scores = getHighScores();
    
    // Add new score
    scores.push({
      score,
      date: date.toISOString()
    });
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top MAX_ENTRIES
    const topScores = scores.slice(0, MAX_ENTRIES);
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topScores));
  } catch (error) {
    console.error("Error saving high score to localStorage:", error);
  }
}

/**
 * Format a date string for display
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatHighScoreDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Fallback to original string
  }
}
