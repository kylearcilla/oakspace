import { isQuoteExpired } from '$lib/utils'
import { vi, describe, it, expect } from 'vitest'
import { extractPeriodDatesFromRange, getNextMoRange, getNextQuarterRange } from '$lib/utils-date'

describe('quote expiration', () => {
    it('first day of new week', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2025, 4, 12)) // may 12, 2025 (mon)
        
        expect(isQuoteExpired(new Date(2025, 4, 12))).toBe(false) // same day (mon)
        expect(isQuoteExpired(new Date(2025, 4, 11))).toBe(true) // (past sunday)
        expect(isQuoteExpired(new Date(2025, 4, 5))).toBe(true)  // (past mon)
        expect(isQuoteExpired(new Date(2025, 2, 5))).toBe(true)
        
        vi.useRealTimers()
    })
    it('past first day', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2025, 4, 13)) // may 13, 2025 (tues)
        
        expect(isQuoteExpired(new Date(2025, 4, 13))).toBe(false) // (same day)
        expect(isQuoteExpired(new Date(2025, 4, 12))).toBe(false) // (that mon)

        expect(isQuoteExpired(new Date(2025, 4, 11))).toBe(true) // (past sunday)
        expect(isQuoteExpired(new Date(2025, 4, 7))).toBe(true)  // (wed)
        expect(isQuoteExpired(new Date(2025, 4, 5))).toBe(true)  // (last mon)
        expect(isQuoteExpired(new Date(2025, 2, 5))).toBe(true)
        
        vi.useRealTimers()
    })
})

describe('iso range', () => {
    it('extract months', () => {
        const dates = extractPeriodDatesFromRange({ 
            start: '2025-01-01', end: '2026-02-01' 
        }).months

        for (let i = 1; i < 12; i++) {
            expect(dates[i - 1]).toBe(`2025-${(i).toString().padStart(2, '0')}-01`)
        }
        expect(dates[12]).toBe('2026-01-01')
        expect(dates[13]).toBe('2026-02-01')
        
    })
    it('extract quarters', () => {
        const dates = extractPeriodDatesFromRange({ 
            start: '2025-01-01', end: '2026-01-01' 
        }).quarters

        expect(dates[0]).toBe('2025-01-01') // q1
        expect(dates[1]).toBe('2025-04-01') // q2
        expect(dates[2]).toBe('2025-07-01') // q3
        expect(dates[3]).toBe('2025-10-01') // q4
        expect(dates[4]).toBe('2026-01-01') // q1
    })
    it('extract years', () => {
        const dates = extractPeriodDatesFromRange({ 
            start: '2025-01-01', end: '2026-01-01' 
        }).years

        expect(dates[0]).toBe('2025-01-01')
        expect(dates[1]).toBe('2026-01-01')
    })
    it('', () => {
        const dates = extractPeriodDatesFromRange({ 
            start: '2025-01-01', end: '2026-01-01' 
        }).years

        expect(dates[0]).toBe('2025-01-01')
        expect(dates[1]).toBe('2026-01-01')
    })
})


describe('next month range +-', () => {
    it('should calculate the correct range when moving left', () => {
        const { start, end } = getNextMoRange({ 
            isoDate: '2025-01-01', dir: 'left'
        })

        expect(start).toBe('2024-11-01')
        expect(end).toBe('2025-01-01')
    })

    it('should calculate the correct range when moving right', () => {
        const { start, end } = getNextMoRange({ 
            isoDate: '2025-01-01', dir: 'right'
        })

        expect(start).toBe('2025-01-01')
        expect(end).toBe('2025-03-01')
    })

    it('should handle year transitions correctly when moving left', () => {
        const { start, end } = getNextMoRange({ 
            isoDate: '2025-01-01', dir: 'right', r_count: 3
        })

        expect(start).toBe('2025-01-01')
        expect(end).toBe('2025-04-01')
    })

    it('should handle year transitions correctly when moving left', () => {
        const { start, end } = getNextMoRange({ 
            isoDate: '2025-01-01', dir: 'left', l_count: 3
        })

        expect(start).toBe('2024-10-01')
        expect(end).toBe('2025-01-01')
    })
})

describe('next quarter range +-', () => {
    it('should calculate the correct range when moving left', () => {
        const { start, end } = getNextQuarterRange({ 
            isoDate: '2025-01-01', dir: 'left'
        })

        expect(start).toBe('2024-07-01')
        expect(end).toBe('2025-01-01')
    })

    it('should calculate the correct range when moving right', () => {
        const { start, end } = getNextQuarterRange({ 
            isoDate: '2025-01-01', dir: 'right'
        })

        expect(start).toBe('2025-01-01')
        expect(end).toBe('2025-07-01')
    })

    it('should handle multiple quarters left', () => {
        const { start, end } = getNextQuarterRange({ 
            isoDate: '2025-07-01', dir: 'left', l_count: 3
        })

        expect(start).toBe('2024-10-01')
        expect(end).toBe('2025-07-01')
    })

    it('should handle multiple quarters right', () => {
        const { start, end } = getNextQuarterRange({ 
            isoDate: '2025-07-01', dir: 'right', r_count: 3
        })

        expect(start).toBe('2025-07-01')
        expect(end).toBe('2026-04-01')
    })

    it('should throw an error if the date is not the start of a quarter', () => {
        expect(() => getNextQuarterRange({ 
            isoDate: '2025-02-01', dir: 'right'
        })).toThrow('Date must be the first day of a quarter')
    })
})