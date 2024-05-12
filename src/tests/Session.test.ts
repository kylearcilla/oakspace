import { SessionState } from '$lib/enums'
import { Session } from '$lib/pom-session'
import { sessionStore } from '$lib/store'
import { calculateEndTime, getTimePeriodString, minsToHHMM } from '$lib/utils-date'
import { get } from 'svelte/store'
import { describe, expect, vi } from 'vitest'

type TestUserInput = {
    name: string,
    tag: { name: string, color: string },
    pomTime: number,
    pomPeriods: number,
    breakTime: number,
    startTime: Date, // 12:00 AM - 1:25 AM
    todos: { title: string; isChecked: boolean }[],
    calculatedEndTime: Date | null,
    totalElapsedTime: string | null,
    timePeriodString: string | null
}

const options = [
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 25,
        pomPeriods: 3,
        breakTime: 5, // 85 mins - 1hr 25m
        startTime: new Date(2023, 5, 10, 0, 0, 0), // 12:00 AM - 1:25 AM
        todos: [],
        calculatedEndTime: null,
        totalElapsedTime: null,
        timePeriodString: null
    },
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 60,
        pomPeriods: 3,
        breakTime: 15, // 210 mins - 3hr 30m
        startTime: new Date(2023, 5, 10, 10, 0, 0), // 10:00 AM - 1:30 PM
        todos: [],
        calculatedEndTime: null,
        totalElapsedTime: null,
        timePeriodString: null
    },
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 60,
        pomPeriods: 3,
        breakTime: 15, // 210 mins - 3hr 30m
        startTime: new Date(2023, 5, 10, 22, 0, 0), // 10:00 PM - 1:30 AM
        todos: [],
        calculatedEndTime: null,
        totalElapsedTime: null,
        timePeriodString: null
    },
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 25,
        pomPeriods: 3,
        breakTime: 5,
        startTime: new Date(),
        todos: [],
        calculatedEndTime: null,
        totalElapsedTime: null,
        timePeriodString: null
    },
]

const prepareOptions = (input: TestUserInput) => {
    const options = { ...input }
    const totalFocusTimeMins = options.pomPeriods * options.pomTime
    const totalbreakTimeMins = (options.pomPeriods - 1) * options.breakTime
    const totalMins = totalbreakTimeMins + totalFocusTimeMins

    options.calculatedEndTime = calculateEndTime(options.startTime, totalMins)
    options.timePeriodString = getTimePeriodString(options.startTime, options.calculatedEndTime)
    options.totalElapsedTime = minsToHHMM(totalMins)

    return options
}


describe('Session Basics', () => {
    let session: Session | null

    test('Toggle playback & Store / Local Instance Object Testing', () => {
        session = new Session(prepareOptions(options[0]))  
        const store = get(sessionStore)    // need to do this after every action that causes the store to update

        // can use either the store or session instance reference to call methods

        // Initialized & playing.
        expect(store).toBeDefined()
        expect(session.state).toBe(SessionState.FOCUSING)
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        
        session!.pauseSession()
        expect(session.isPlaying).toBe(false)
        expect(get(sessionStore)!.isPlaying).toBe(false)

        store!.endPeriod()
        expect(session.state).toBe(SessionState.WAITING_TO_PROGRESS_BREAK)
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_BREAK)

        session!.progressToNextPeriod()
        expect(session.state).toBe(SessionState.ON_BREAK)
        expect(get(sessionStore)!.state).toBe(SessionState.ON_BREAK)

        expect(session.isPlaying).toBe(true)
        expect(get(sessionStore)!.isPlaying).toBe(true)
        
        store!.cancelSession()
        expect(session.state).toBe(SessionState.CANCELED)
        expect(get(sessionStore)!.state).toBe(SessionState.CANCELED)

        const userEndTime = calculateEndTime(session.startTime, 85)
        const result = session!.finishSession(userEndTime)

        expect(session.state).toBe(SessionState.FINISHED)
        expect(session.state).toBe(SessionState.FINISHED)

        session = null
        get(sessionStore)?.clearSession()
    })
    test('Calculate end time and elapsed time properlly', () => {
        // 1.
        session = new Session(prepareOptions(options[0]))
        let store = get(sessionStore)

        expect(session.calculatedEndTime).toEqual(new Date(2023, 5, 10, 1, 25, 0))
        expect(get(sessionStore)!.calculatedEndTime).toEqual(new Date(2023, 5, 10, 1, 25, 0))

        expect(session.totalElapsedTime).toBe("1 hr 25 mins")
        expect(get(sessionStore)!.totalElapsedTime).toBe("1 hr 25 mins")

        store!.clearSession()
        expect(get(sessionStore)).toBeNull()

        // 2.
        session = new Session(prepareOptions(options[1]))
        store = get(sessionStore)

        expect(session.calculatedEndTime).toEqual(new Date(2023, 5, 10, 13, 30, 0))
        expect(get(sessionStore)!.calculatedEndTime).toEqual(new Date(2023, 5, 10, 13, 30, 0))

        expect(session.totalElapsedTime).toBe("3 hrs 30 mins")
        expect(get(sessionStore)!.totalElapsedTime).toBe("3 hrs 30 mins")

        store!.clearSession()
        expect(get(sessionStore)).toBeNull()

        /// 3.
        session = new Session(prepareOptions(options[2]))
        store = get(sessionStore)

        expect(session.calculatedEndTime).toEqual(new Date(2023, 5, 11, 1, 30, 0))
        expect(get(sessionStore)!.calculatedEndTime).toEqual(new Date(2023, 5, 11, 1, 30, 0))

        expect(session.totalElapsedTime).toBe("3 hrs 30 mins")
        expect(get(sessionStore)!.totalElapsedTime).toBe("3 hrs 30 mins")

        session = null
        store!.clearSession()
    })
    test('Get current period from index correctly', () => {
        session = new Session(prepareOptions(options[0]))

        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeTruthy()

        session.endPeriod()
        session.progressToNextPeriod()

        expect(session.iCurrentlyFocusTime()).toBeFalsy()
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeFalsy()
        session.endPeriod()
        session.progressToNextPeriod()

        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeTruthy()
        session.endPeriod()
        session.progressToNextPeriod()

        expect(session.iCurrentlyFocusTime()).toBeFalsy()
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeFalsy()
        session.endPeriod()
        session.progressToNextPeriod()

        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeTruthy()
        session.endPeriod()

        expect(session.state).toBe(SessionState.FINISHED)

        session = null
        get(sessionStore)!.clearSession()
    })
    test('Testing timers', () => {
        vi.useFakeTimers()

        session = null
        get(sessionStore)?.clearSession()

        // 5 seconds
        session = new Session(options[0])
        vi.advanceTimersByTime(5000)
        
        expect(session.currentTime!.seconds).toBe(5)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(5)

        // 59 secs to 60 secs
        session = new Session(options[0])
        vi.advanceTimersByTime(59_000)
        
        expect(get(sessionStore)!.currentTime!.seconds).toBe(59)
        vi.advanceTimersByTime(1000)
        expect(get(sessionStore)!.currentTime!.minutes).toBe(1)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)

        // 2 mins
        session = new Session(options[0])
        vi.advanceTimersByTime(120_000)

        expect(get(sessionStore)!.currentTime!.minutes).toBe(2)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)

        // // 60 mins
        session = new Session(options[1])
        vi.advanceTimersByTime(3_600_000)

        expect(get(sessionStore)!.currentTime!.minutes).toBe(60)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)
        
        // Period Ends
        vi.advanceTimersByTime(1000)
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_BREAK)

        session = null
        get(sessionStore)!.clearSession()
        vi.useRealTimers()
    })
    test('Progressing through a session', () => {
        vi.useFakeTimers()

        // FOCUS TIME #1
        session = new Session(prepareOptions(options[1]))
        expect(session.state).toBe(SessionState.FOCUSING)
        
        // advance by 30 seconds        
        vi.advanceTimersByTime(30_000)
        
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        session.pauseSession()
        expect(get(sessionStore)!.isPlaying).toBe(false)
        session.playSession()
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)

        // advance by 30 seconds        
        vi.advanceTimersByTime(30_000)
        
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeTruthy()
        expect(get(sessionStore)!.currentTime!.minutes).toBe(1)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)
        
        // advance all the way to 60 minutes
        vi.advanceTimersByTime(3_540_000 + 1000)
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_BREAK)
        expect(get(sessionStore)!.currentTime!.minutes).toBe(0)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)
        
        session.progressToNextPeriod()
        
        // BREAK TIME #1     
        expect(get(sessionStore)!.state).toBe(SessionState.ON_BREAK)
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeFalsy()
        vi.advanceTimersByTime(900_000 + 1000)
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_FOCUS)
        expect(get(sessionStore)!.currentTime!.minutes).toBe(0)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)

        session.progressToNextPeriod()
        
        // FOCUS TIME #2
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeTruthy()
        vi.advanceTimersByTime(3_600_000 + 1000)

        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_BREAK)
        expect(get(sessionStore)!.currentTime!.minutes).toBe(0)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)

        session.progressToNextPeriod()

        // BREAK TIME #2
        expect(get(sessionStore)!.state).toBe(SessionState.ON_BREAK)
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeFalsy()
        vi.advanceTimersByTime(900_000 + 1000)

        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_FOCUS)
        expect(get(sessionStore)!.currentTime!.minutes).toBe(0)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)

        session.progressToNextPeriod()
        
        // FOCUS TIME #3
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        expect(get(sessionStore)!.iCurrentlyFocusTime()).toBeTruthy()
        vi.advanceTimersByTime(3_600_000 + 1000)

        expect(get(sessionStore)!.state).toBe(SessionState.FINISHED)
        expect(get(sessionStore)!.currentTime!.minutes).toBe(0)
        expect(get(sessionStore)!.currentTime!.seconds).toBe(0)
        
        session = null
        get(sessionStore)!.clearSession()
        vi.useRealTimers()
    })
    test('Editing todos', () => {
        session = new Session(options[2])

        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        
        expect(session.todos[0]).toEqual({ title: "History HW", isChecked: false })
        expect(session.todos[1]).toEqual({ title: "Reading 📖", isChecked: false })

        expect(get(sessionStore)!.todos[0]).toEqual({ title: "History HW", isChecked: false })
        expect(get(sessionStore)!.todos[1]).toEqual({ title: "Reading 📖", isChecked: false })
        
        session.editTodo(1, "Meditation 🧘🏼‍♂️")
        expect(session.todos[1]).toEqual({ title: "Meditation 🧘🏼‍♂️", isChecked: false })
        expect(get(sessionStore)!.todos[1]).toEqual({ title: "Meditation 🧘🏼‍♂️", isChecked: false })

        expect(session.todosCheckedCount).toBe(0)
        expect(get(sessionStore)!.todosCheckedCount).toBe(0)
        
        // checked
        session.toggleCheckTodo(1)
        expect(session.todos[1].isChecked).toBeTruthy()
        expect(session.todosCheckedCount).toBe(1)

        expect(get(sessionStore)!.todos[1].isChecked).toBeTruthy()
        expect(get(sessionStore)!.todosCheckedCount).toBe(1)
        
        // unchecked
        session.toggleCheckTodo(1)
        expect(session.todos[1].isChecked).toBeFalsy()
        expect(session.todosCheckedCount).toBe(0)

        expect(get(sessionStore)!.todos[1].isChecked).toBeFalsy()
        expect(get(sessionStore)!.todosCheckedCount).toBe(0)

        // delete
        session.deleteTodo(0)
        expect(session.todos.length).toBe(1)
        expect(get(sessionStore)!.todos.length).toBe(1)

        // add new one
        session.addTodo("Watching tape 🏀")
        expect(session.todos.length).toBe(2)
        expect(get(sessionStore)!.todos.length).toBe(2)

        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)

        session.deleteTodo(1)

        expect(session.todosCheckedCount).toBe(1)
        expect(get(sessionStore)!.todosCheckedCount).toBe(1)

        session = null
        get(sessionStore)!.clearSession()
    })
})

describe('Scoring Sessions', () => {
    let session: Session | null

    test('Scoring a cancelled session', () => {
        session = new Session(prepareOptions(options[0]))
        session.playSession()
        session.cancelSession()

        expect(session.state).toBe(SessionState.CANCELED)
        session.clearSession()
        session = null
    })
    test('Scoring a session finished early with no incomplete todos', () => {
        session = new Session(prepareOptions(options[3]))
        session.playSession()
        
        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        
        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)

        session.finishSession()
        expect(get(sessionStore)!.finishSession().score).toEqual(100)
        expect(get(sessionStore)!.finishSession().medal).toEqual("🏅")

        session.clearSession()
        session = null
    })
    test('Scoring a session finished early with complete todos', () => {
        // 0%
        session = new Session(prepareOptions(options[3]))

        session.addTodo("History HW")
        session.addTodo("Reading 📖")

        let res = get(sessionStore)!.finishSession(calculateEndTime(session.startTime, 10))
        
        expect(res.score).toEqual(0)
        expect(res.medal).toEqual("🥉")

        get(sessionStore)!.clearSession()
        options[3].todos = []

        // 100%
        session = new Session(prepareOptions(options[3]))

        session.addTodo("History HWs")
        session.addTodo("Reading 📖s")
        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)
        
        res = session.finishSession(calculateEndTime(session.startTime, 10))

        expect(res.score).toEqual(100)
        expect(res.medal).toEqual("🏅")

        get(sessionStore)!.clearSession()
        options[3].todos = []

        // 80%
        session = new Session(prepareOptions(options[3]))
        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)
        session.toggleCheckTodo(3)
        session.toggleCheckTodo(4)

        res = session.finishSession(calculateEndTime(session.startTime, 10))

        expect(res.score).toEqual(80)
        expect(res.medal).toEqual("🥈")

        get(sessionStore)!.clearSession()
        options[3].todos = []
        session = null
    })
    test('Scoring a session finsished at least on time: ON TIME', () => {
        session = new Session(prepareOptions(options[3]))

        let endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + 0)

        expect(endTime).toEqual(session.calculatedEndTime)

        const res = session.finishSession(endTime)

        expect(res.score).toEqual(100)
        expect(res.medal).toEqual("🏅")

        get(sessionStore)!.clearSession()
        options[3].todos = []
        session = null
    })
    test('Scoring a session finsished that went over (with complete todos)', () => {
        // 1 min over
        session = new Session(prepareOptions(options[3]))
        let endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + 60)

        let res = session.finishSession(endTime)

        expect(res.score).toEqual(99)
        expect(res.medal).toEqual("🏅")

        get(sessionStore)!.clearSession()
        options[3].todos = []

        // 30 min over
        session = new Session(prepareOptions(options[3]))
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 30))

        expect(get(sessionStore)!.finishSession(endTime)).includes({ score: 71, medal: "🥈" })

        get(sessionStore)!.clearSession()
        options[3].todos = []

        // 31 min over
        session = new Session(prepareOptions(options[3]))
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 31))

        expect(get(sessionStore)!.finishSession(endTime)).includes({ score: 70, medal: "🥈" })

        get(sessionStore)!.clearSession()
        options[3].todos = []
        session = null
    })
    test('Scoring a session finsished at least on time (with incomplete todos)', () => {
        session = new Session(prepareOptions(options[3]))    // 25m x 3poms
        let endTime = new Date(session.calculatedEndTime)

        // 31 min over
        session = new Session(prepareOptions(options[3]))
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 31))

        // 50%
        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        session.toggleCheckTodo(0)

        expect(session.finishSession(endTime)).includes({ score: 35, medal: "🥉" })

        get(sessionStore)!.clearSession()
        options[3].todos = []

        // 17 min over
        session = new Session(prepareOptions(options[3]))
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 17))

        get(sessionStore)!.clearSession()
        options[3].todos = []

        // 33% Done
        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.toggleCheckTodo(0)

        expect(session.finishSession(endTime)).includes({ score: 37, medal: "🥉" })

        session.clearSession()
        session = null
    })
})

const func = () => console.log("XS")

describe('Skipping & Restarting Sessions', () => {
    let session: Session | null

    beforeEach(() => {
        vi.useFakeTimers()
    })    
    afterEach(() => {
        session!.clearSession()
        session = null
        vi.useRealTimers()
    })

    test('Skipping through a session.', () => {
        session = new Session(prepareOptions(options[2])) // 60 / 15 x 3

        // FOCUS TIME: #1
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        
        // advance by 30 mintes        
        vi.advanceTimersByTime(1_800_000 )
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        
        session.skipToNextPeriod()
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_BREAK)
        session.progressToNextPeriod()
        
        // BREAK TIME: #1
        expect(get(sessionStore)!.state).toBe(SessionState.ON_BREAK)
        session.skipToNextPeriod()
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_FOCUS)
        session.progressToNextPeriod()
        
        // FOCUS TIME: #2
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        session.skipToNextPeriod()
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_BREAK)
        session.progressToNextPeriod()
        
        // BREAK TIME: #1
        expect(get(sessionStore)!.state).toBe(SessionState.ON_BREAK)
        session.skipToNextPeriod()
        expect(get(sessionStore)!.state).toBe(SessionState.WAITING_TO_PROGRESS_FOCUS)
        session.progressToNextPeriod()
        
        // FOCUS TIME: #3
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)

        session.skipToNextPeriod()
        expect(get(sessionStore)!.state).toBe(SessionState.FINISHED)
    })
    test('Restaring Focus Period', () => {
        session = new Session(prepareOptions(options[2]))  // 60 / 15 x 3

        // FOCUS TIME: #1
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)
        
        // advance by 30 mintes        
        vi.advanceTimersByTime(1_800_000 )
        expect(get(sessionStore)!.state).toBe(SessionState.FOCUSING)

        session.restartPeriod()
        expect(get(sessionStore)!.currentTime).toEqual({ minutes: 0, seconds: 0 })

        // BREAK TIME: #1
        session.skipToNextPeriod()
        session.progressToNextPeriod()

        expect(get(sessionStore)!.state).toBe(SessionState.ON_BREAK)

        // advance by 5 mintes        
        vi.advanceTimersByTime(300_000)
        session.restartPeriod()
        expect(get(sessionStore)!.currentTime).toEqual({ minutes: 0, seconds: 0 })
    })
})