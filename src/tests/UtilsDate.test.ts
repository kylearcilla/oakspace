import { HrsMinsFormatOption } from '$lib/enums';
import { formatTimeToHHMM, getDifferenceInSecs, getPomPeriodElapsedTime, secsToHHMM } from '$lib/utils-date';
import { describe, expect } from 'vitest';

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


describe('ElapsedTimeBetweenTwoDates', () => {
    test('Same Minutes', () => {
        const start = new Date()
        const end = new Date(start)

        end.setMinutes(end.getMinutes() + 0)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs, HrsMinsFormatOption.MIN_LETTERS)
        expect(elapsedTime).toBe("0m")

    })
    test('Below 1h', () => {
        const start = new Date()
        const end = new Date(start)

        end.setMinutes(end.getMinutes() + 59)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs, HrsMinsFormatOption.MIN_LETTERS)
        expect(elapsedTime).toBe("59m")
    })
    test('Over 1h', () => {
        const start = new Date()
        const end = new Date(start)

        end.setMinutes(end.getMinutes() + 100)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs, HrsMinsFormatOption.MIN_LETTERS)
        expect(elapsedTime).toBe("1h 40m")
    })
    test('Double Digit Hours', () => {
        const start = new Date()
        const end = new Date(start)

        end.setMinutes(end.getMinutes() + 720)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs, HrsMinsFormatOption.MIN_LETTERS)
        expect(elapsedTime).toBe("12h")
    })
    test('Non-whole number minutes #1.', () => {
        const start = new Date()
        const end = new Date(start)

        end.setSeconds(end.getSeconds() + 2739)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs, HrsMinsFormatOption.MIN_LETTERS)
        expect(elapsedTime).toBe("45m")
    })
    test('Non-whole number minutes #2.', () => {
        const start = new Date()
        const end = new Date(start)

        end.setSeconds(end.getSeconds() + 12621)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs, HrsMinsFormatOption.MIN_LETTERS)
        expect(elapsedTime).toBe("3h 30m")
    })
    test('Non-whole number minutes #3.', () => {
        const start = new Date()
        const end = new Date(start)

        end.setSeconds(end.getSeconds() + 289)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs, HrsMinsFormatOption.MIN_LETTERS)
        expect(elapsedTime).toBe("4m")
    })
    test('Pom Display. Start mins less then end', () => {
        const start = new Date(2023, 10, 1, 12, 28, 59)  // 12:28:59
        const end = new Date(2023, 10, 1, 12, 29, 0)  // 12:29:00

        const diffSecs = getDifferenceInSecs(start, end)
        expect(diffSecs).toBe(1)
    
        // 12:28 PM - 12:29 PM
        const elapsedTime = getPomPeriodElapsedTime(start, end)
        expect(elapsedTime).toBe("1m")
    })
    test('Pom Display. Start mins less then end', () => {
        const start = new Date(2023, 10, 1, 12, 28, 0)  // 12:28
        const end = new Date(2023, 10, 1, 13, 0, 1)  // 1:00:01

        expect(formatTimeToHHMM(start)).toBe("12:28 PM")
        expect(formatTimeToHHMM(end)).toBe("1:00 PM")

        const diffSecs = getDifferenceInSecs(start, end)
        expect(diffSecs).toBe(32 * 60 + 1)
    
        // 12:28 PM - 1:01 PM
        const elapsedTime = getPomPeriodElapsedTime(start, end)
        expect(elapsedTime).toBe("32m")
    })
    test('Pom Display. Hrs Included.', () => {
        const start = new Date(2023, 10, 1, 12, 28, 0)  // 12:28
        const end = new Date(2023, 10, 1, 17, 0, 0)     // 5:00

        const diffSecs = getDifferenceInSecs(start, end)
        expect(diffSecs).toBe(272 * 60)
    
        // 12:28 PM - 5:01 PM
        const elapsedTime = getPomPeriodElapsedTime(start, end)
        expect(elapsedTime).toBe("4h 32m")
    })
})

describe("Formating Time to HH:MM", () => {
    test("Test", () => {
        const start = new Date(2023, 10, 1, 12, 28, 59)  // 12:28:59
        const end = new Date(2023, 10, 1, 12, 29, 0)  // 12:29:00
        
        let startStr = String(formatTimeToHHMM(start))
        let endStr = String(formatTimeToHHMM(end))

        expect(startStr).toBe("12:28 PM")
        expect(endStr).toBe("12:29 PM")
    })
})