import { vi, describe, it, expect } from 'vitest'
import { isQuoteExpired } from '$lib/utils'

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