import { HrsMinsFormatOption } from '$lib/enums';
import { TimeInputManager } from '$lib/inputs';
import { formatTimeToHHMM, getDifferenceInSecs, getElapsedTime, secsToHHMM } from '$lib/utils-date';
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

/*

describe("HasTokenExpiredText", () => {
    const ACTIVE_TOKEN_THRESHOLD_SECS = 60
    const EXPIRES_IN_SECS = 3600

    const hasAccessTokenExpired = (currentTime: Date, expiresInSecs: number) => {
        const createdAt = new Date("2024-02-23T12:00:00");
        const currentTimeTime = currentTime.getTime();

        const timeElapsed = currentTimeTime - new Date(createdAt).getTime();
        const timeRemaining = expiresInSecs * 1000 - timeElapsed;

        const threshold = ACTIVE_TOKEN_THRESHOLD_SECS * 1000;
        return threshold >= timeRemaining;
    };

    test('Above Threshold', () => {
        const currentTime = new Date("2024-02-23T12:58:59")
        expect(hasAccessTokenExpired(currentTime, EXPIRES_IN_SECS)).toBe(false);
    });

    test('Below Threshold', () => {
        const currentTime = new Date("2024-02-23T12:59:01")
        expect(hasAccessTokenExpired(currentTime, EXPIRES_IN_SECS)).toBe(true);
    });

    test('On Threshold', () => {
        const currentTime = new Date("2024-02-23T12:59:00")
        expect(hasAccessTokenExpired(currentTime, EXPIRES_IN_SECS)).toBe(true);
    });
})

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
    
        const elapsedTime = secsToHHMM(diffSecs)
        expect(elapsedTime).toBe("0m")

    })
    test('Below 1h', () => {
        const start = new Date()
        const end = new Date(start)

        end.setMinutes(end.getMinutes() + 59)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs)
        expect(elapsedTime).toBe("59m")
    })
    test('Over 1h', () => {
        const start = new Date()
        const end = new Date(start)

        end.setMinutes(end.getMinutes() + 100)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs)
        expect(elapsedTime).toBe("1h 40m")
    })
    test('Double Digit Hours', () => {
        const start = new Date()
        const end = new Date(start)

        end.setMinutes(end.getMinutes() + 720)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs)
        expect(elapsedTime).toBe("12h")
    })
    test('Non-whole number minutes #1.', () => {
        const start = new Date()
        const end = new Date(start)

        end.setSeconds(end.getSeconds() + 2739)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs)
        expect(elapsedTime).toBe("45m")
    })
    test('Non-whole number minutes #2.', () => {
        const start = new Date()
        const end = new Date(start)

        end.setSeconds(end.getSeconds() + 12621)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs)
        expect(elapsedTime).toBe("3h 30m")
    })
    test('Non-whole number minutes #3.', () => {
        const start = new Date()
        const end = new Date(start)

        end.setSeconds(end.getSeconds() + 289)

        const diffSecs = getDifferenceInSecs(start, end)
    
        const elapsedTime = secsToHHMM(diffSecs)
        expect(elapsedTime).toBe("4m")
    })
    test('Pom Display. Start mins less then end', () => {
        const start = new Date(2023, 10, 1, 12, 28, 59)  // 12:28:59
        const end = new Date(2023, 10, 1, 12, 29, 0)  // 12:29:00

        const diffSecs = getDifferenceInSecs(start, end)
        expect(diffSecs).toBe(1)
    
        // 12:28 PM - 12:29 PM
        const elapsedTime = getElapsedTime(start, end)
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
        const elapsedTime = getElapsedTime(start, end)
        expect(elapsedTime).toBe("32m")
    })
    test('Pom Display. Hrs Included.', () => {
        const start = new Date(2023, 10, 1, 12, 28, 0)  // 12:28
        const end = new Date(2023, 10, 1, 17, 0, 0)     // 5:00

        const diffSecs = getDifferenceInSecs(start, end)
        expect(diffSecs).toBe(272 * 60)
    
        // 12:28 PM - 5:01 PM
        const elapsedTime = getElapsedTime(start, end)
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

*/

describe("Time Formatting", () => {
    test("Without AM / PM, HH Only", () => {
        let result = TimeInputManager.validateTimeInput("7");
        expect(result).toEqual(420)

        result = TimeInputManager.validateTimeInput("0");
        expect(result).toEqual(0)

        result = TimeInputManager.validateTimeInput("2");
        expect(result).toEqual(120)
        
        result = TimeInputManager.validateTimeInput("11");
        expect(result).toEqual(660)

        result = TimeInputManager.validateTimeInput("12");
        expect(result).toEqual(720)

        result = TimeInputManager.validateTimeInput("13");
        expect(result).toEqual(780)

        result = TimeInputManager.validateTimeInput("23");
        expect(result).toEqual(1380)

        result = TimeInputManager.validateTimeInput("24");
        expect(result).toEqual(0)
    })

    test("Without AM / PM, HH:MM Only", () => {
        let result = TimeInputManager.validateTimeInput("7:00");
        expect(result).toEqual(420)

        result = TimeInputManager.validateTimeInput("0:00");
        expect(result).toEqual(0)
        
        result = TimeInputManager.validateTimeInput("11:00");
        expect(result).toEqual(660)

        result = TimeInputManager.validateTimeInput("11:55");
        expect(result).toEqual(660 + 55)

        result = TimeInputManager.validateTimeInput("12:59");
        expect(result).toEqual(720 + 59)

        result = TimeInputManager.validateTimeInput("12:33");
        expect(result).toEqual(720 + 33)

        result = TimeInputManager.validateTimeInput("05:39");
        expect(result).toEqual(300 + 39)

        result = TimeInputManager.validateTimeInput("9:39");
        expect(result).toEqual(540 + 39)

        result = TimeInputManager.validateTimeInput("13:00");
        expect(result).toEqual(780)

        result = TimeInputManager.validateTimeInput("23:59");
        expect(result).toEqual(1380 + 59)

        result = TimeInputManager.validateTimeInput("24:33");
        expect(result).toEqual(33)

        result = TimeInputManager.validateTimeInput("24:00");
        expect(result).toEqual(0)
    })

    test("With AM / HM", () => {
        let result = TimeInputManager.validateTimeInput("7:00 AM");
        expect(result).toEqual(420)

        result = TimeInputManager.validateTimeInput("0:00 AM");
        expect(result).toEqual(0)

        result = TimeInputManager.validateTimeInput("0:00 PM");
        expect(result).toEqual(0)
        
        result = TimeInputManager.validateTimeInput("11:00 PM");
        expect(result).toEqual(1380)
        
        result = TimeInputManager.validateTimeInput("11:00 AM");
        expect(result).toEqual(660)

        result = TimeInputManager.validateTimeInput("11:55 PM");
        expect(result).toEqual(1380 + 55)

        result = TimeInputManager.validateTimeInput("11:55 AM");
        expect(result).toEqual(660 + 55)

        result = TimeInputManager.validateTimeInput("12:59");
        expect(result).toEqual(720 + 59)

        result = TimeInputManager.validateTimeInput("05:39 PM");
        expect(result).toEqual(1020 + 39)

        result = TimeInputManager.validateTimeInput("05:39 AM");
        expect(result).toEqual(300 + 39)

        result = TimeInputManager.validateTimeInput("9:39 AM");
        expect(result).toEqual(540 + 39)

        result = TimeInputManager.validateTimeInput("13:00 PM");
        expect(result).toEqual(780)

        result = TimeInputManager.validateTimeInput("23:59 PM");
        expect(result).toEqual(1380 + 59)

        result = TimeInputManager.validateTimeInput("23:59 AM");
        expect(result).toEqual(1380 + 59)

        result = TimeInputManager.validateTimeInput("24:33 PM");
        expect(result).toEqual(33)
    })

    test("Weird Valid Inputs", () => {
        let result = TimeInputManager.validateTimeInput("754");
        expect(result).toEqual(420 + 54)

        result = TimeInputManager.validateTimeInput("am754");
        expect(result).toEqual(420 + 54)

        result = TimeInputManager.validateTimeInput("7am54");
        expect(result).toEqual(420 + 54)

        result = TimeInputManager.validateTimeInput("7pm54");
        expect(result).toEqual(1140 + 54)

        result = TimeInputManager.validateTimeInput("ww7pmzz54er");
        expect(result).toEqual(1140 + 54)

        result = TimeInputManager.validateTimeInput("ww17pmzz54er");
        expect(result).toEqual(1020 + 54)

        result = TimeInputManager.validateTimeInput("ww17a_mpmzz54er");
        expect(result).toEqual(1020 + 54)
    })

    test("Weird Invalid Inputs", () => {
        expect(() => {
            TimeInputManager.validateTimeInput("22323")
        }).toThrow()

        expect(() => {
            TimeInputManager.validateTimeInput("66")
        }).toThrow()

        expect(() => {
            TimeInputManager.validateTimeInput("33:31")
        }).toThrow()

        expect(() => {
            TimeInputManager.validateTimeInput("12:99")
        }).toThrow()

        expect(() => {
            TimeInputManager.validateTimeInput("25:49")
        }).toThrow()

        expect(() => {
            TimeInputManager.validateTimeInput("53")
        }).toThrow()

        expect(() => {
            TimeInputManager.validateTimeInput("599")
        }).toThrow()

        expect(() => {
            TimeInputManager.validateTimeInput("-45")
        }).toThrow()
    })
})