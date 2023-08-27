import { Session } from '$lib/Session';
import { describe, expect, vi } from 'vitest';

enum SessionState {
    EMPTY, PAUSED, PLAYING, WAITING_TO_PROGRESS, FINISHED, CANCELED, FINISH_TOO_EARLY
}

const options = [
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 25,
        pomPeriods: 3,
        breakTime: 5, // 105 mins - 1hr 25m
        startTime: new Date(2023, 5, 10, 0, 0, 0) // 12:00 AM - 1:25 AM
    },
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 60,
        pomPeriods: 3,
        breakTime: 15, // 210 mins - 3hr 30m
        startTime: new Date(2023, 5, 10, 10, 0, 0) // 10:00 AM - 1:30 PM
    },
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 60,
        pomPeriods: 3,
        breakTime: 15, // 210 mins - 3hr 30m
        startTime: new Date(2023, 5, 10, 22, 0, 0) // 10:00 PM - 1:30 AM
    },
    {
        name: "Reading Time",
        tag: { name: "school", color: "#ACACD2" },
        pomTime: 25,
        pomPeriods: 3,
        breakTime: 5,
        startTime: new Date() 
    },
]

describe('Session Basics', () => {
    let session: Session | null

    test('Pausing and playing', () => {
        session = new Session(options[0])

        expect(session.sessionState).toBe(SessionState.EMPTY)
        session.playSession()
        expect(session.sessionState).toBe(SessionState.PLAYING)
        session.pauseSession()
        expect(session.sessionState).toBe(SessionState.PAUSED)
        
        session.endPeriod()
        expect(session.sessionState).toBe(SessionState.WAITING_TO_PROGRESS)

        session.progressToNextPeriod()
        expect(session.sessionState).toBe(SessionState.PLAYING)
        
        session.cancelSession()
        expect(session.sessionState).toBe(SessionState.CANCELED)
        
        session.finishSession()
        expect(session.sessionState).toBe(SessionState.FINISHED)

        session = null
    })
    test('Calculate end time and elapsed time properlly', () => {
        session = new Session(options[0])

        expect(session.calculatedEndTime).toEqual(new Date(2023, 5, 10, 1, 25, 0))
        expect(session.totalElapsedTime).toBe("1:25")

        session = new Session(options[1])

        expect(session.calculatedEndTime).toEqual(new Date(2023, 5, 10, 13, 30, 0))
        expect(session.totalElapsedTime).toBe("3:30")

        session = new Session(options[2])

        expect(session.calculatedEndTime).toEqual(new Date(2023, 5, 11, 1, 30, 0))
        expect(session.totalElapsedTime).toBe("3:30")

        session = null
    })
    test('Get current period from index correctly', () => {
        session = new Session(options[0])

        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        session.endPeriod()
        session.progressToNextPeriod()
        expect(session.iCurrentlyFocusTime()).toBeFalsy()
        session.endPeriod()
        session.progressToNextPeriod()
        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        session.endPeriod()
        session.progressToNextPeriod()
        expect(session.iCurrentlyFocusTime()).toBeFalsy()
        session.endPeriod()
        session.progressToNextPeriod()
        expect(session.iCurrentlyFocusTime()).toBeTruthy()

        session.endPeriod()
        expect(session.sessionState).toBe(SessionState.FINISHED)
    })
    test('Testing timers', () => {
        vi.useFakeTimers()

        // 5 seconds
        session = new Session(options[0])
        session.playSession()
        vi.advanceTimersByTime(5000)
        
        expect(session.currentTime!.seconds).toBe(5)

        // 59 secs to 60 secs
        session = new Session(options[0])
        session.playSession()
        vi.advanceTimersByTime(59000)
        
        expect(session.currentTime!.seconds).toBe(59)
        vi.advanceTimersByTime(1000)
        expect(session.currentTime!.minutes).toBe(1)
        expect(session.currentTime!.seconds).toBe(0)

        // 2 mins
        session = new Session(options[0])
        session.playSession()
        vi.advanceTimersByTime(120000)

        expect(session.currentTime!.minutes).toBe(2)
        expect(session.currentTime!.seconds).toBe(0)

        // 60 mins
        session = new Session(options[1])
        session.playSession()
        vi.advanceTimersByTime(3600000)

        expect(session.currentTime!.minutes).toBe(60)
        expect(session.currentTime!.seconds).toBe(0)
        
        // Period Ends
        vi.advanceTimersByTime(1000)
        expect(session.sessionState).toBe(SessionState.WAITING_TO_PROGRESS)
    })

    test('Progressing through a session', () => {
        vi.useFakeTimers()

        // FOCUS TIME #1: advance to 60 mins
        session = new Session(options[1])
        expect(session.sessionState).toBe(SessionState.EMPTY)
        session.playSession()
        
        // advance by 30 seconds        
        vi.advanceTimersByTime(30000)
        
        expect(session.sessionState).toBe(SessionState.PLAYING)
        session.pauseSession()
        expect(session.sessionState).toBe(SessionState.PAUSED)
        session.playSession()
        expect(session.sessionState).toBe(SessionState.PLAYING)

        // advance by 30 seconds        
        vi.advanceTimersByTime(30000)
        
        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        expect(session.currentTime!.minutes).toBe(1)
        expect(session.currentTime!.seconds).toBe(0)
        
        vi.advanceTimersByTime(3540000 + 1000)
        expect(session.sessionState).toBe(SessionState.WAITING_TO_PROGRESS)
        expect(session.currentTime!.minutes).toBe(0)
        expect(session.currentTime!.seconds).toBe(0)
        
        session.progressToNextPeriod()
        
        // BREAK TIME #1     
        expect(session.sessionState).toBe(SessionState.PLAYING)
        expect(session.iCurrentlyFocusTime()).toBeFalsy()
        vi.advanceTimersByTime(900000 + 1000)
        expect(session.sessionState).toBe(SessionState.WAITING_TO_PROGRESS)
        expect(session.currentTime!.minutes).toBe(0)
        expect(session.currentTime!.seconds).toBe(0)

        session.progressToNextPeriod()
        
        // FOCUS TIME #2
        expect(session.sessionState).toBe(SessionState.PLAYING)
        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        vi.advanceTimersByTime(3600000 + 1000)

        expect(session.sessionState).toBe(SessionState.WAITING_TO_PROGRESS)
        expect(session.currentTime!.minutes).toBe(0)
        expect(session.currentTime!.seconds).toBe(0)

        session.progressToNextPeriod()

        // BREAK TIME #2
        expect(session.sessionState).toBe(SessionState.PLAYING)
        expect(session.iCurrentlyFocusTime()).toBeFalsy()
        vi.advanceTimersByTime(900000 + 1000)

        expect(session.sessionState).toBe(SessionState.WAITING_TO_PROGRESS)
        expect(session.currentTime!.minutes).toBe(0)
        expect(session.currentTime!.seconds).toBe(0)

        session.progressToNextPeriod()
        
        // FOCUS TIME #3
        expect(session.sessionState).toBe(SessionState.PLAYING)
        expect(session.iCurrentlyFocusTime()).toBeTruthy()
        vi.advanceTimersByTime(3600000 + 1000)

        expect(session.sessionState).toBe(SessionState.FINISHED)
        expect(session.currentTime!.minutes).toBe(0)
        expect(session.currentTime!.seconds).toBe(0)
    })

    test('Editing todos', () => {
        session = new Session(options[2])

        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        
        expect(session.todos[0]).toEqual({ title: "History HW", isChecked: false })
        expect(session.todos[1]).toEqual({ title: "Reading 📖", isChecked: false })
        
        session.editTodo(1, "Meditation 🧘🏼‍♂️")
        expect(session.todos[1]).toEqual({ title: "Meditation 🧘🏼‍♂️", isChecked: false })

        expect(session.todosCheckedCount).toBe(0)
        
        // checked
        session.toggleCheckTodo(1)
        expect(session.todos[1].isChecked).toBeTruthy()
        expect(session.todosCheckedCount).toBe(1)
        
        // unchecked
        session.toggleCheckTodo(1)
        expect(session.todos[1].isChecked).toBeFalsy()
        expect(session.todosCheckedCount).toBe(0)

        // delete
        session.deleteTodo(0)
        expect(session.todos.length).toBe(1)


        // add new one
        session.addTodo("Watching tape 🏀")
        expect(session.todos.length).toBe(2)

        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)

        session.deleteTodo(1)
        expect(session.todosCheckedCount).toBe(1)
    })
})

// must toggle ⛳️ flagged code lines in finishSession() for custom end times
describe('Scoring Sessions', () => {
    let session: Session | null

    test('Scoring a cancelled session', () => {
        session = new Session(options[0])
        session.playSession()
        session.cancelSession()

        expect(session.sessionState).toBe(SessionState.CANCELED)
    })
    test('Scoring a session finished early with no incomplete todos', () => {
        session = new Session(options[3])
        session.playSession()
        
        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        
        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)

        session.finishSession()
        
        expect(session.finishSession()).toEqual({ score: 100, medal: "🏅" })
    })
    test('Scoring a session finished early with complete todos', () => {
        // 0%
        session = new Session(options[3])
        session.playSession()

        session.addTodo("History HW")
        session.addTodo("Reading 📖")

        session.finishSession()
        
        expect(session.finishSession()).toEqual({ score: 0, medal: "🥉" })

        // 100%
        session = new Session(options[3])
        session.playSession()

        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)

        session.finishSession()

        expect(session.finishSession()).toEqual({ score: 100, medal: "🏅" })

        // 80%
        session = new Session(options[3])
        session.playSession()

        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.toggleCheckTodo(0)
        session.toggleCheckTodo(1)
        session.toggleCheckTodo(3)
        session.toggleCheckTodo(4)

        session.finishSession()

        expect(session.finishSession()).toEqual({ score: 80, medal: "🥈" })
    })
    test('Scoring a session finsished at least on time: ON TIME', () => {
        session = new Session(options[3])
        let endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + 0)

        expect(endTime).toEqual(session.calculatedEndTime)
        expect(session.finishSession(endTime)).toEqual({ score: 100, medal: "🏅" })
    })
    test('Scoring a session finsished that went over (with complete todos)', () => {
        // 1 min over
        session = new Session(options[3])
        let endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + 60)

        expect(session.finishSession(endTime)).toEqual({ score: 99, medal: "🏅" })

        // 30 min over
        session = new Session(options[3])
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 30))

        expect(session.finishSession(endTime)).toEqual({ score: 71, medal: "🥈" })

        // 31 min over
        session = new Session(options[3])
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 31))

        expect(session.finishSession(endTime)).toEqual({ score: 70, medal: "🥈" })
    })
    test('Scoring a session finsished at least on time (with incomplete todos)', () => {
        session = new Session(options[3])
        let endTime = new Date(session.calculatedEndTime)

        // 31 min over
        session = new Session(options[3])
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 31))

        // 50%
        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        session.toggleCheckTodo(0)

        expect(session.finishSession(endTime)).toEqual({ score: 35, medal: "🥉" })

        // 17 min over
        session = new Session(options[3])
        endTime = new Date(session.calculatedEndTime)
        endTime.setSeconds(endTime.getSeconds() + (60 * 17))

        // 33%
        session.addTodo("History HW")
        session.addTodo("Reading 📖")
        session.addTodo("Reading 📖")
        session.toggleCheckTodo(0)

        expect(session.finishSession(endTime)).toEqual({ score: 37, medal: "🥉" })
    })
})