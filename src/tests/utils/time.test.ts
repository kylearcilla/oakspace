import { timeStrToMins, validateTimeOfDay } from "$lib/utils-date"
import { describe, test, expect } from 'vitest'

describe('Time of day functionality', () => {
    test('Time of day validation', () => {
        // edge cases
        expect(() => validateTimeOfDay(0, 0)).not.toThrow()
        expect(() => validateTimeOfDay(0, 1)).not.toThrow()
        expect(() => validateTimeOfDay(0, 59)).not.toThrow()
        
        expect(() => validateTimeOfDay(24, 0)).not.toThrow()
        expect(() => validateTimeOfDay(24, 1)).not.toThrow()
        expect(() => validateTimeOfDay(24, 59)).not.toThrow()

        expect(() => validateTimeOfDay(11, 59, "am")).not.toThrow()
        expect(() => validateTimeOfDay(11, 59, "pm")).not.toThrow()

        expect(() => validateTimeOfDay(12, 0, "pm")).not.toThrow()
        expect(() => validateTimeOfDay(12, 59, "am")).not.toThrow()

        // regular
        expect(() => validateTimeOfDay(10, 30, "am")).not.toThrow()
        expect(() => validateTimeOfDay(10, 30, "pm")).not.toThrow()

        expect(() => validateTimeOfDay(11, 16, "am")).not.toThrow()
        expect(() => validateTimeOfDay(11, 16, "pm")).not.toThrow()

        expect(() => validateTimeOfDay(4, 16, "pm")).not.toThrow()
        expect(() => validateTimeOfDay(11, 59, "pm")).not.toThrow()
        expect(() => validateTimeOfDay(12, 0, "pm")).not.toThrow()
        expect(() => validateTimeOfDay(11, 16, "pm")).not.toThrow()
        expect(() => validateTimeOfDay(10, 45, "am")).not.toThrow()
        expect(() => validateTimeOfDay(10, 45, "pm")).not.toThrow()
        
        // strict am
        expect(() => validateTimeOfDay(0, 30, "am")).toThrow()
        expect(() => validateTimeOfDay(0, 30, "am", false)).not.toThrow()

        expect(() => validateTimeOfDay(14, 30, "am")).toThrow()
        expect(() => validateTimeOfDay(14, 30, "am", false)).not.toThrow()

        expect(() => validateTimeOfDay(24, 0, "am")).toThrow()
        expect(() => validateTimeOfDay(24, 0, "am", false)).not.toThrow()

        // strict pm
        expect(() => validateTimeOfDay(14, 30, "pm")).toThrow()
        expect(() => validateTimeOfDay(14, 30, "pm", false)).not.toThrow()

        expect(() => validateTimeOfDay(0, 0, "pm")).toThrow()
        expect(() => validateTimeOfDay(0, 0, "pm", false)).not.toThrow()

        expect(() => validateTimeOfDay(24, 0, "pm")).toThrow()
        expect(() => validateTimeOfDay(24, 0, "pm", false)).not.toThrow()

        // invalid
        expect(() => validateTimeOfDay(100, 30)).toThrow()
        expect(() => validateTimeOfDay(2, -30, "am")).toThrow()
        expect(() => validateTimeOfDay(1, -1, "am")).toThrow()
        expect(() => validateTimeOfDay(0, -1)).toThrow()
        expect(() => validateTimeOfDay(3, 60, "am")).toThrow()
        expect(() => validateTimeOfDay(25, 30, "am")).toThrow()
        expect(() => validateTimeOfDay(-1, 30, "am")).toThrow()
    })

    test('Time of day to minutes from start', () => {
        // 0 and 24
        expect(timeStrToMins(0, 0, "am")).toBe(0)
        expect(timeStrToMins(0, 1, "am")).toBe(1)

        expect(timeStrToMins(0, 0, "pm")).toBe(0)
        expect(timeStrToMins(0, 1, "pm")).toBe(1)

        expect(timeStrToMins(0, 0)).toBe(0)
        expect(timeStrToMins(0, 1)).toBe(1)

        expect(timeStrToMins(24, 0, "am")).toBe(0)
        expect(timeStrToMins(24, 1, "am")).toBe(1)

        expect(timeStrToMins(24, 0, "pm")).toBe(0)
        expect(timeStrToMins(24, 1, "pm")).toBe(1)
        
        expect(timeStrToMins(24, 0)).toBe(0)
        expect(timeStrToMins(24, 1)).toBe(1)

        // midnight
        expect(timeStrToMins(23, 59)).toBe(1439)
        expect(timeStrToMins(23, 59, "am")).toBe(1439)
        expect(timeStrToMins(23, 59, "pm")).toBe(1439)

        // noon
        expect(timeStrToMins(12, 0)).toBe(720)
        expect(timeStrToMins(12, 0, "am")).toBe(0)
        expect(timeStrToMins(12, 0, "pm")).toBe(720)

        // under 12
        expect(timeStrToMins(11, 30)).toBe(690)
        expect(timeStrToMins(11, 30, "am")).toBe(690)
        expect(timeStrToMins(11, 30, "pm")).toBe(1410)

        expect(timeStrToMins(8, 11)).toBe(491)
        expect(timeStrToMins(8, 11, "am")).toBe(491)
        expect(timeStrToMins(8, 11, "pm")).toBe(1211)

        // over 12
        expect(timeStrToMins(13, 0)).toBe(780)
        expect(timeStrToMins(13, 0, "am")).toBe(780)
        expect(timeStrToMins(13, 0, "pm")).toBe(780)

        expect(timeStrToMins(18, 25)).toBe(1105)
        expect(timeStrToMins(18, 25, "am")).toBe(1105)
        expect(timeStrToMins(18, 25, "pm")).toBe(1105)

        expect(timeStrToMins(18, 25)).toBe(timeStrToMins(6, 25, "pm"))
    })
})
