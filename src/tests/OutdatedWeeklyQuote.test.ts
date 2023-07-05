import {beforeEach, describe, expect, it} from 'vitest';

const isQuoteOutDated = (quoteCreatedDate: Date, currDate: Date) => {
    return quoteCreatedDate.getFullYear() === currDate.getFullYear()
            && (getWeekNumber(quoteCreatedDate) === getWeekNumber(currDate));
}

const getWeekNumber = (currentDate: Date) => {
    const startDate = new Date(currentDate.getFullYear(), 0, 1)
    const days = Math.floor(((currentDate as any) - (startDate as any)) / (24 * 60 * 60 * 1000))
    
    const weekNumber = Math.ceil(days / 7)
    return weekNumber
}

describe('OutdatedWeeklyQuoteTest', () => {
    test('Different Year', () => {
        expect(isQuoteOutDated(new Date('2022-01-01'), new Date('2023-06-29'))).toBeFalsy()
    })
    test('Different Month', () => {
        expect(isQuoteOutDated(new Date('2023-01-29'), new Date('2023-06-29'))).toBeFalsy()
    })
    test('Different Week', () => {
        expect(isQuoteOutDated(new Date('2023-06-22'), new Date('2023-06-29'))).toBeFalsy()
    })
    test('Same Week Different Day', () => {
        expect(isQuoteOutDated(new Date('2023-06-28'), new Date('2023-06-29'))).toBeTruthy()
    })
    test('On Sunday (Sunday is not start of new week)', () => {
        expect(isQuoteOutDated(new Date('2023-06-25'), new Date('2023-06-29'))).toBeFalsy()
    })
    test('On Monday (Monday is of new week)', () => {
        expect(isQuoteOutDated(new Date('2023-06-26'), new Date('2023-06-29'))).toBeFalsy()
    })
})