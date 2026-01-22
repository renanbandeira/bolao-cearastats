import { describe, it, expect } from 'vitest';
import { calculatePoints, type BetData, type MatchResult } from './scoring';

describe('calculatePoints', () => {
  describe('Score prediction', () => {
    it('should award 4 points for exact score prediction when alone', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 1 }
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 1 },
        actualScorers: [],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-1', 1]]); // Only one person predicted this score
      const playerCounts = new Map();

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4);
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
      expect(scoring.breakdown.exactScore).toBeUndefined();
    });

    it('should award 2 points for exact score prediction when shared', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 1 }
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 1 },
        actualScorers: [],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-1', 3]]); // Three people predicted this score
      const playerCounts = new Map();

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(2);
      expect(scoring.breakdown.exactScore).toBe(2);
      expect(scoring.breakdown.exactScoreAlone).toBeUndefined();
    });

    it('should award 1 point for matching result only (win)', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 }
      };

      const result: MatchResult = {
        actualScore: { ceara: 3, opponent: 1 }, // Both are wins, but different scores
        actualScorers: [],
        actualAssists: []
      };

      const scoreCounts = new Map([['3-1', 1]]);
      const playerCounts = new Map();

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(1);
      expect(scoring.breakdown.winOrDraw).toBe(1);
    });

    it('should award 1 point for matching result only (draw)', () => {
      const bet: BetData = {
        predictedScore: { ceara: 1, opponent: 1 }
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 2 }, // Both are draws, but different scores
        actualScorers: [],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-2', 1]]);
      const playerCounts = new Map();

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(1);
      expect(scoring.breakdown.winOrDraw).toBe(1);
    });

    it('should award 0 points for incorrect prediction', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 } // Predicted win
      };

      const result: MatchResult = {
        actualScore: { ceara: 0, opponent: 2 }, // Actually lost
        actualScorers: [],
        actualAssists: []
      };

      const scoreCounts = new Map([['0-2', 1]]);
      const playerCounts = new Map();

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(0);
      expect(scoring.breakdown).toEqual({});
    });
  });

  describe('Player prediction - Scorers', () => {
    it('should award 4 points for matched scorer when alone', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player a', 1]]); // Only one person predicted this player

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(8); // 4 (exact score) + 4 (scorer)
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
      expect(scoring.breakdown.matchedScorerAlone).toBe(4);
    });

    it('should award 2 points for matched scorer when shared', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 2]]);
      const playerCounts = new Map([['player a', 3]]); // Three people predicted this player

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4); // 2 (exact score) + 2 (scorer)
      expect(scoring.breakdown.exactScore).toBe(2);
      expect(scoring.breakdown.matchedScorer).toBe(2);
    });

    it('should award 0 points when predicted player did not score', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player C'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player c', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4); // Only exact score points
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
      expect(scoring.breakdown.matchedScorerAlone).toBeUndefined();
    });
  });

  describe('Player prediction - Assists', () => {
    it('should award 2 points for matched assist when alone', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player B'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player C'],
        actualAssists: ['Player B', 'Player D']
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player b', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(6); // 4 (exact score) + 2 (assist)
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
      expect(scoring.breakdown.matchedAssistAlone).toBe(2);
    });

    it('should award 1 point for matched assist when shared', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player B'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player C'],
        actualAssists: ['Player B', 'Player D']
      };

      const scoreCounts = new Map([['2-0', 2]]);
      const playerCounts = new Map([['player b', 2]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(3); // 2 (exact score) + 1 (assist)
      expect(scoring.breakdown.exactScore).toBe(2);
      expect(scoring.breakdown.matchedAssist).toBe(1);
    });

    it('should award 0 points when predicted player did not assist', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player E'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player C'],
        actualAssists: ['Player B', 'Player D']
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player e', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4); // Only exact score points
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
      expect(scoring.breakdown.matchedAssistAlone).toBeUndefined();
    });
  });

  describe('Duplicate players - Scorers', () => {
    it('should multiply scorer points when the same player appears twice in actualScorers', () => {
      const bet: BetData = {
        predictedScore: { ceara: 4, opponent: 0 },
        predictedPlayer: 'Vina'
      };

      const result: MatchResult = {
        actualScore: { ceara: 4, opponent: 1 },
        actualScorers: ['Vina', 'Vina', 'Pedro Henrique', 'Matheus Araujo'], // Player scored twice
        actualAssists: ['Vina', 'Pedro Henrique', 'Matheus Araujo']
      };

      const scoreCounts = new Map([['4-1', 1]]);
      const playerCounts = new Map([['Vina', 2]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: Player scored 2 goals → 4 points = 4 points for scoring
      // Expected: Player assisted once → 2 points = 2 points for assisting
      expect(scoring.points).toBe(6); // 2 (win score) + 6 (4 goals + 2 assists)
      expect(scoring.breakdown.matchedScorerAlone).toBe(undefined); // noboty scored alone
      expect(scoring.breakdown.exactScoreAlone).toBe(undefined); // no exact score alone
      expect(scoring.breakdown.matchedScorer).toBe(4); // 2 goals × 4 points
      expect(scoring.breakdown.matchedAssist).toBe(1); // 2 assists × 2 points
    });

    it('should award points for each goal when player scores three times (hat-trick)', () => {
      const bet: BetData = {
        predictedScore: { ceara: 3, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 3, opponent: 0 },
        actualScorers: ['Player A', 'Player A', 'Player A'], // Hat-trick
        actualAssists: []
      };

      const scoreCounts = new Map([['3-0', 1]]);
      const playerCounts = new Map([['player a', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: 3 goals × 4 points = 12 points for scoring
      expect(scoring.points).toBe(16); // 4 (exact score alone) + 12 (3 goals × 4 points)
      expect(scoring.breakdown.matchedScorerAlone).toBe(12); // 3 goals × 4 points each
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
    });

    it('should multiply shared prediction points for multiple goals', () => {
      const bet: BetData = {
        predictedScore: { ceara: 4, opponent: 1 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 4, opponent: 1 },
        actualScorers: ['Player A', 'Player B', 'Player A', 'Player B'], // Player A scored 2
        actualAssists: []
      };

      const scoreCounts = new Map([['4-1', 3]]); // Score prediction is shared
      const playerCounts = new Map([['player a', 2]]); // Player prediction is shared

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: 2 goals × 2 points (shared) = 4 points for scoring
      expect(scoring.points).toBe(6); // 2 (exact score shared) + 4 (2 goals × 2 points shared)
      expect(scoring.breakdown.matchedScorer).toBe(4); // 2 goals × 2 points
      expect(scoring.breakdown.exactScore).toBe(2);
    });
  });

  describe('Duplicate players - Assists', () => {
    it('should multiply assist points when the same player appears twice in actualAssists', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player B'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player C'],
        actualAssists: ['Player B', 'Player B'] // Player assisted twice
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player b', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: Player assisted 2 times → 2 points × 2 = 4 points for assisting
      expect(scoring.points).toBe(8); // 4 (exact score alone) + 4 (2 assists × 2 points)
      expect(scoring.breakdown.matchedAssistAlone).toBe(4); // 2 assists × 2 points each
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
    });

    it('should award points for three assists', () => {
      const bet: BetData = {
        predictedScore: { ceara: 3, opponent: 0 },
        predictedPlayer: 'Player B'
      };

      const result: MatchResult = {
        actualScore: { ceara: 3, opponent: 0 },
        actualScorers: ['Player A', 'Player C', 'Player D'],
        actualAssists: ['Player B', 'Player B', 'Player B'] // Three assists
      };

      const scoreCounts = new Map([['3-0', 1]]);
      const playerCounts = new Map([['player b', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: 3 assists × 2 points = 6 points for assisting
      expect(scoring.points).toBe(10); // 4 (exact score alone) + 6 (3 assists × 2 points)
      expect(scoring.breakdown.matchedAssistAlone).toBe(6); // 3 assists × 2 points each
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
    });

    it('should multiply shared assist points for multiple assists', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player B'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player C'],
        actualAssists: ['Player B', 'Player B'] // Player assisted twice
      };

      const scoreCounts = new Map([['2-0', 2]]); // Score shared
      const playerCounts = new Map([['player b', 3]]); // Player shared

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: 2 assists × 1 point (shared) = 2 points for assisting
      expect(scoring.points).toBe(4); // 2 (exact score shared) + 2 (2 assists × 1 point shared)
      expect(scoring.breakdown.matchedAssist).toBe(2); // 2 assists × 1 point
      expect(scoring.breakdown.exactScore).toBe(2);
    });
  });

  describe('Combined scenarios', () => {
    it('should award points for multiple goals AND multiple assists', () => {
      const bet: BetData = {
        predictedScore: { ceara: 3, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 3, opponent: 0 },
        actualScorers: ['Player A', 'Player B', 'Player A'], // Player A scored 2 goals
        actualAssists: ['Player A', 'Player C'] // Player A assisted 1 time
      };

      const scoreCounts = new Map([['3-0', 1]]);
      const playerCounts = new Map([['player a', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: (2 goals × 4 pts) + (1 assist × 2 pts) = 8 + 2 = 10 player points
      expect(scoring.points).toBe(14); // 4 (exact score alone) + 8 (scorer) + 2 (assist)
      expect(scoring.breakdown.matchedScorerAlone).toBe(8); // 2 goals × 4 points
      expect(scoring.breakdown.matchedAssistAlone).toBe(2); // 1 assist × 2 points
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
    });

    it('should handle player who both scored once and assisted once (alone)', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: ['Player A', 'Player C']
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player a', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: (1 goal × 4 pts) + (1 assist × 2 pts) = 6 player points
      expect(scoring.points).toBe(10); // 4 (exact score) + 4 (1 goal) + 2 (1 assist)
      expect(scoring.breakdown.matchedScorerAlone).toBe(4);
      expect(scoring.breakdown.matchedAssistAlone).toBe(2);
    });

    it('should handle player who both scored and assisted (shared)', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: ['Player A', 'Player C']
      };

      const scoreCounts = new Map([['2-0', 2]]);
      const playerCounts = new Map([['player a', 2]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      // Expected: (1 goal × 2 pts) + (1 assist × 1 pt) = 3 player points
      expect(scoring.points).toBe(5); // 2 (exact score) + 2 (1 goal) + 1 (1 assist)
      expect(scoring.breakdown.matchedScorer).toBe(2);
      expect(scoring.breakdown.matchedAssist).toBe(1);
    });

    it('should award only score points when no player is predicted', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 }
        // No predictedPlayer
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: ['Player C']
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map();

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4); // Only exact score points
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
      expect(scoring.breakdown.matchedScorerAlone).toBeUndefined();
      expect(scoring.breakdown.matchedAssistAlone).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty actualScorers and actualAssists arrays', () => {
      const bet: BetData = {
        predictedScore: { ceara: 0, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 0, opponent: 0 },
        actualScorers: [],
        actualAssists: []
      };

      const scoreCounts = new Map([['0-0', 1]]);
      const playerCounts = new Map([['player a', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4); // Only exact score points
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
    });

    it('should handle undefined actualScorers and actualAssists', () => {
      const bet: BetData = {
        predictedScore: { ceara: 1, opponent: 0 },
        predictedPlayer: 'Player A'
      };

      const result: MatchResult = {
        actualScore: { ceara: 1, opponent: 0 }
        // actualScorers and actualAssists are undefined
      };

      const scoreCounts = new Map([['1-0', 1]]);
      const playerCounts = new Map([['player a', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4); // Only exact score points
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
    });

    it('should handle case-insensitive player name matching', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'PLAYER A' // Uppercase
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['player a', 'Player B'], // Lowercase
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player a', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(8); // Should match despite case difference
      expect(scoring.breakdown.matchedScorerAlone).toBe(4);
    });

    it('should handle player names with extra whitespace', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: '  Player A  ' // Extra whitespace
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['player a', 1]]);

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(8); // Should match after trimming
      expect(scoring.breakdown.matchedScorerAlone).toBe(4);
    });

    it('should not award player points when predicted player is empty string', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: '' // Empty string
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Player A', 'Player B'],
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map();

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(4); // Only exact score points
      expect(scoring.breakdown.exactScoreAlone).toBe(4);
    });
  });

  describe('Name sanitization tests', () => {
    it('should match player with alternate spelling (Vinicius Goes -> Vina)', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Vinicius Goes'
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Vina', 'Player B'], // Vina is the sanitized form
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['vina', 1]]); // Use sanitized name in map

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(8);
      expect(scoring.breakdown.matchedScorerAlone).toBe(4);
    });

    it('should match player with alternate spelling (PH -> Pedro Henrique)', () => {
      const bet: BetData = {
        predictedScore: { ceara: 1, opponent: 0 },
        predictedPlayer: 'PH'
      };

      const result: MatchResult = {
        actualScore: { ceara: 1, opponent: 0 },
        actualScorers: ['Pedro Henrique'],
        actualAssists: []
      };

      const scoreCounts = new Map([['1-0', 1]]);
      const playerCounts = new Map([['pedro henrique', 1]]); // Use sanitized name in map

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(8);
      expect(scoring.breakdown.matchedScorerAlone).toBe(4);
    });

    it('should count multiple goals from player with sanitized name', () => {
      const bet: BetData = {
        predictedScore: { ceara: 2, opponent: 0 },
        predictedPlayer: 'Vinícius Góes' // With accents
      };

      const result: MatchResult = {
        actualScore: { ceara: 2, opponent: 0 },
        actualScorers: ['Vina', 'Vina'], // Sanitized form appears twice
        actualAssists: []
      };

      const scoreCounts = new Map([['2-0', 1]]);
      const playerCounts = new Map([['vina', 1]]); // Use sanitized name in map

      const scoring = calculatePoints(bet, result, scoreCounts, playerCounts);

      expect(scoring.points).toBe(12); // 4 (exact score) + 8 (2 goals × 4 points)
      expect(scoring.breakdown.matchedScorerAlone).toBe(8);
    });
  });
});
