import { describe, it, expect, beforeEach } from 'vitest'
import {
  getQuestions,
  getProfiles,
  scoreTest,
  aptitudeQuestions,
  vakQuestions,
  aptitudeProfiles,
  vakProfiles,
} from './test-data'

describe('getQuestions', () => {
  it('should return aptitude questions for testType "aptitudes"', () => {
    const result = getQuestions('aptitudes')
    expect(result).toBe(aptitudeQuestions)
    expect(result.length).toBe(25)
  })

  it('should return VAK questions for testType "vak"', () => {
    const result = getQuestions('vak')
    expect(result).toBe(vakQuestions)
    expect(result.length).toBe(10)
  })

  it('should default to aptitude questions for invalid testType', () => {
    const result = getQuestions('invalid' as any)
    expect(result).toBe(aptitudeQuestions)
  })
})

describe('getProfiles', () => {
  it('should return aptitude profiles', () => {
    const result = getProfiles('aptitudes')
    expect(result).toEqual(aptitudeProfiles)
    expect(Object.keys(result)).toHaveLength(5)
  })

  it('should return VAK profiles', () => {
    const result = getProfiles('vak')
    expect(result).toEqual(vakProfiles)
    expect(Object.keys(result)).toHaveLength(3)
  })

  it('should default to aptitude profiles for invalid testType', () => {
    const result = getProfiles('invalid' as any)
    expect(result).toEqual(aptitudeProfiles)
  })
})

describe('scoreTest', () => {
  beforeEach(() => {
    // Reset scores before each test
  })

  it('should score aptitude test with all answers A', () => {
    const answers = { A: 'A', B: 'A', C: 'A', D: 'A', E: 'A' }
    const result = scoreTest('aptitudes', answers)
    expect(result.leaders).toEqual(['A'])
    expect(result.scores.A).toBe(5)
  })

  it('should score aptitude test with mixed answers', () => {
    const answers = { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' }
    const result = scoreTest('aptitudes', answers)
    expect(result.scores.A).toBe(1)
    expect(result.scores.B).toBe(1)
    expect(result.scores.C).toBe(1)
    expect(result.scores.D).toBe(1)
    expect(result.scores.E).toBe(1)
    // Should have leaders (tie among all)
    expect(result.leaders).toHaveLength(5)
  })

  it('should score VAK test with all answers A', () => {
    const answers = { A: 'A', B: 'A', C: 'A' }
    const result = scoreTest('vak', answers)
    expect(result.leaders).toEqual(['A'])
    expect(result.scores.A).toBe(3)
  })

  it('should handle ties correctly', () => {
    // Answers that give equal scores to A and B
    const answers = { A: 'A', B: 'B', C: 'A', D: 'B', E: 'A' }
    const result = scoreTest('aptitudes', answers)
    // A appears 3 times, B appears 2 times
    expect(result.leaders).toEqual(['A'])
    expect(result.scores.A).toBe(3)
    expect(result.scores.B).toBe(2)
  })

  it('should handle incomplete answers (some values not in keys)', () => {
    const answers = { A: 'X', B: 'A', C: 'A', D: 'A', E: 'A' }
    // 'X' is not a valid key, should be ignored
    const result = scoreTest('aptitudes', answers)
    expect(result.scores.A).toBe(4) // 4 valid answers of 'A'
    expect(result.scores.X).toBeUndefined()
  })

  it('should handle empty answers object', () => {
    const answers: Record<string, string> = {}
    const result = scoreTest('aptitudes', answers)
    // All scores should be 0, so there's a tie
    expect(result.leaders).toHaveLength(5)
  })

  it('should score VAK test correctly', () => {
    const answers = { A: 'A', B: 'B', C: 'C' }
    const result = scoreTest('vak', answers)
    expect(result.leaders).toHaveLength(3) // tie among A, B, C
    expect(result.scores.A).toBe(1)
    expect(result.scores.B).toBe(1)
    expect(result.scores.C).toBe(1)
  })
})