import { get } from "svelte/store"
import { SessionState } from "./enums"
import { sessionStore } from "./store"
import { sessionCopy } from "$lib/data-pom"
import { getDifferenceInSecs, isDateEarlier, minsSecondsToSecs } from "./utils-date"
import { doesSessionExist } from "./utils-session"

/**
 * Pomodoro Session object initialized when there is an active session.
 * Is itself a reactive class / data store initiated during instantiation.
 */
export class Session {
    name: string
    tag: Tag
    pomTime: number
    breakTime: number
    pomPeriods: number
    startTime: Date
    endTime: Date | null
    calculatedEndTime: Date
    totalElapsedTime: string
    timePeriodString: string
    currentPomPeriod: number
    currentIndex: number
    lastFinishedPeriodIdx: number
    pomMessage: string
    isPlaying: boolean
    state: SessionState
    sessionResult: SessionResult | null

    todos: { title: string, isChecked: boolean }[]
    todosCheckedCount = 0
    
    currentTime: { minutes: number, seconds: number }
    userFocusTimeSecs: number
    userBreakTimeSecs: number
    currentSessionTimeSecs: number
    sessionDurationMins: number
    
    interval: NodeJS.Timer | null = null

    TODO_SCORE_WEIGHT = 0.70
    TIME_SCORE_WEIGHT = 0.30

    TIME_CUT_OFF = 1860
    GOLD_CUT_OFF = 85
    SILVER_CUT_OFF = 60

    constructor(sessionSettings: SessionData) { 
        sessionStore.set(this)

        this.name = sessionSettings.name
        this.tag = sessionSettings.tag
        this.pomTime = sessionSettings.pomTime
        this.pomPeriods = sessionSettings.pomPeriods
        this.startTime = new Date(sessionSettings.startTime)
        this.endTime = sessionSettings.endTime
        this.breakTime = sessionSettings.breakTime
        this.isPlaying = sessionSettings.isPlaying
        this.calculatedEndTime = new Date(sessionSettings.calculatedEndTime)
        this.totalElapsedTime = sessionSettings.totalElapsedTime
        this.timePeriodString = sessionSettings.timePeriodString
        this.currentIndex = sessionSettings.currentIndex
        this.currentPomPeriod = sessionSettings.currentPomPeriod
        this.lastFinishedPeriodIdx = sessionSettings.lastFinishedPeriodIdx
        this.sessionResult = sessionSettings.sessionResult
        this.todos = sessionSettings.todos
        this.pomMessage = sessionSettings.pomMessage
        this.todosCheckedCount = sessionSettings.todosCheckedCount
        this.state = sessionSettings.state
        this.isPlaying = sessionSettings.isPlaying
        
        this.currentTime = sessionSettings.currentTime
        this.userFocusTimeSecs = sessionSettings.userFocusTimeSecs
        this.userBreakTimeSecs = sessionSettings.userBreakTimeSecs
        this.currentSessionTimeSecs = sessionSettings.currentSessionTimeSecs
        this.sessionDurationMins = sessionSettings.sessionDurationMins

        sessionStore.update((data: Session | null) => ({ ...data!, ...sessionSettings }))
        
        if (!doesSessionExist()) this.saveTodoData()
        if (this.isPlaying) this.playSession()
    }

    updateSession = (newData: Session) => {
        sessionStore.update((data: Session | null) => ({ ...data!, ...newData }))
        this.saveData()
    }

    /**
     * Set session store to null and clear data from local storage.
     */
    clearSession = () => {
        clearInterval(this.interval!)
        sessionStore.set(null)
        this.clearData()
    }

    /**
     * Session phases (break time, focus time) are 0 indexed. 
     * @returns See if the current phase of the session is a focus session.
     */
    iCurrentlyFocusTime = () => this.currentIndex % 2 === 0

    /**
     * @returns See if session is currently in a waiting phase
     */
    isCurrentlyWaiting = () => {
        return this.state === SessionState.WAITING_TO_PROGRESS_BREAK || this.state === SessionState.WAITING_TO_PROGRESS_FOCUS
    }

    /**
     * @param newTitle  New title for session
     */
    editSessionTitle = (newTitle: string) => {
        this.name = newTitle
        this.updateSession({ ...get(sessionStore)!, name: this.name })
    }

    /**
     * @param newTag   New tag for session
     */
    editSesionTag = (newTag: Tag) => {
        this.tag = newTag
        this.updateSession({ ...get(sessionStore)!, tag: this.tag })
    }

    /**
     * Play current session. This will start an interval that will update the time every second.
     * If in a waiting phase, then progress to next period.
     */
    playSession = () => {
        if (this.isCurrentlyWaiting()) { 
            this.progressToNextPeriod()
            return
        }

        this.isPlaying = true
        this.updateSession({ ...get(sessionStore)!, isPlaying: true })
        this.interval = setInterval(() => {
            const endMins = this.iCurrentlyFocusTime() ? this.pomTime : this.breakTime
            this.updateTime(endMins)
        }, 1000)
    }

    /**
     * Pause current session. This will clear the current running interval.
     */
    pauseSession = () => {
        this.isPlaying = false
        clearInterval(this.interval!)
        this.updateSession({ ...get(sessionStore)!, isPlaying: false })
    }

    /**
     * Update the current time of session (minutes, seconds).
     * If it reaches the current end time, it will end the current period and stop.
     * @param endTime    The end time of current phase (focus or break).
     */
    updateTime = (endTime: number) => {
        const mins = this.currentTime!.minutes
        const secs = this.currentTime!.seconds

        if (mins === endTime) {
            this.endPeriod()
            return
        }
        if (secs === 59) {
            this.currentTime!.seconds = 0
            this.currentTime!.minutes++
        }
        else {
            this.currentTime!.seconds++

            if (this.iCurrentlyFocusTime()) {
                this.userFocusTimeSecs++
            }
            else {
                this.userBreakTimeSecs++
            }

            this.updateDocTitle(`${this.currentTime!.minutes}:${(this.currentTime!.seconds + "").padStart(2, '0')}`)
        }

        this.currentSessionTimeSecs++
        this.updateSession({ 
            ...get(sessionStore)!,  currentTime: this.currentTime, currentSessionTimeSecs: this.currentSessionTimeSecs,
            userFocusTimeSecs: this.userFocusTimeSecs, userBreakTimeSecs: this.userBreakTimeSecs
        })
    }

    /**
     * Change the document title.
     */
    updateDocTitle = (newTitle: string) => document.title = newTitle

    /**
     * Decrease the active session total time by the current running session time.
     * Then reset the current session time.
     */
    updateTimeAfterPeriodRestarted = () => {
        this.currentSessionTimeSecs -= minsSecondsToSecs(this.currentTime!.minutes, this.currentTime!.seconds)

        this.currentTime!.minutes = 0
        this.currentTime!.seconds = 0
    }

    /**
     * Increase the active session total time by the remaining session time.
     * Then reset the current session time.
     */
    updateTimeAfterPeriodEnded = () => {
        const isComingFromFocusState = this.state === SessionState.FOCUSING

        const curStateLengthSecs = (isComingFromFocusState ? this.pomTime : this.breakTime) * 60
        this.currentSessionTimeSecs += curStateLengthSecs - minsSecondsToSecs(this.currentTime!.minutes, this.currentTime!.seconds)

        this.currentTime!.minutes = 0
        this.currentTime!.seconds = 0
    }

    /**
     * End the current period after time has ran out. 
     * This will progress the period to a WAITING_TO_PROGRESS state.
     * User is shown a message and a button to progress to the next state.
     * If the period that just ended is the last phase, then end the session.
     */
    endPeriod = () => {
        this.pauseSession()
        this.isPlaying = false
        this.updateTimeAfterPeriodEnded()

        const periods = (this.pomPeriods * 2) - 2
        if (this.currentIndex === periods) {
            this.finishSession()
            return
        }

        if (this.iCurrentlyFocusTime()) {
            this.state = SessionState.WAITING_TO_PROGRESS_BREAK
            this.pomMessage = "Waiting to proceed to break period."
        }
        else {
            this.state = SessionState.WAITING_TO_PROGRESS_FOCUS
            this.pomMessage = "Waiting to proceed to focus period."
        }

        this.lastFinishedPeriodIdx++

        this.updateSession({
             ...get(sessionStore)!, isPlaying: false, currentTime: this.currentTime,  
             pomMessage: this.pomMessage, state: this.state, currentSessionTimeSecs: this.currentSessionTimeSecs,
             lastFinishedPeriodIdx: this.lastFinishedPeriodIdx
        })
    }

    /**
     * Get the next state to go to after previous phase has just ended.
     */
    getNextState = (): SessionState => {
        if (this.state === SessionState.FOCUSING) {
            return SessionState.WAITING_TO_PROGRESS_BREAK
        }
        else if (this.state === SessionState.ON_BREAK) {
            return SessionState.WAITING_TO_PROGRESS_FOCUS
        }
        else if (this.state === SessionState.WAITING_TO_PROGRESS_BREAK) {
            return SessionState.ON_BREAK
        }
        else {
            return SessionState.FOCUSING
        }
    }

    /**
     * Progress to the next period after user continues to the next period during a WAITING_TO_PROGRESS state.
     */
    progressToNextPeriod = () => {
        this.currentTime!.minutes = 0
        this.currentTime!.seconds = 0

        this.currentIndex++
        this.state = this.getNextState()

        if (this.state === SessionState.FOCUSING) {
            this.pomMessage = "Focus Time"
        }
        else if (this.state === SessionState.ON_BREAK) {
            this.pomMessage = "Break Time"
        }
        else if (this.state === SessionState.WAITING_TO_PROGRESS_BREAK) {
            this.pomMessage = "Waiting to progress to break time."
        }
        else {
            this.pomMessage = "Waiting to progress to focus time."
        }

        this.currentPomPeriod += this.state === SessionState.FOCUSING ? 1 : 0

        this.updateSession({
            ...get(sessionStore)!,  currentPomPeriod: this.currentPomPeriod, currentIndex: this.currentIndex,
            state: this.state, pomMessage: this.pomMessage, currentTime: this.currentTime
        })

        this.playSession()
    }

    /**
     * Finish current session. 
     * Calculate the user productivity score and show it with a message and an accompanying image.
     * Called automatically when timer reaches the end of session or when user ends the session early.
     */
    finishSession = () => { 
        this.pauseSession()
        this.state = SessionState.FINISHED
        this.endTime = this.endTime ?? new Date()
        this.currentSessionTimeSecs = (this.pomPeriods * this.userFocusTimeSecs) + ((this.pomPeriods - 1) * this.userBreakTimeSecs)

        const isUserTimeEarly = isDateEarlier(this.endTime, this.calculatedEndTime)

        const medalAndScore = this.getResultMedalAndScore(isUserTimeEarly)
        const msgAndImg = this.getResultImageAndMessage(medalAndScore.medal)

        this.pomMessage = "All Done!"
        this.sessionResult = { ...medalAndScore, ...msgAndImg }

        this.updateSession({ 
            ...get(sessionStore)!, state: this.state, endTime: this.endTime,
            sessionResult: this.sessionResult, currentSessionTimeSecs: this.currentSessionTimeSecs,
            pomMessage: this.pomMessage, lastFinishedPeriodIdx: this.lastFinishedPeriodIdx
        })

        return this.sessionResult
    }

    /**
     * Restart current running period.
     */
    restartPeriod = () => {
        if (this.isCurrentlyWaiting()) return

        this.updateTimeAfterPeriodRestarted()
        this.updateSession({ ...get(sessionStore)!, currentTime: this.currentTime, currentSessionTimeSecs: this.currentSessionTimeSecs })
    }

    /**
     * Forcibly skip to the next period without waiting for time to run out.
     * This will take the session to a waiting phase, not immediately to the next phase.
     * If is currently in the last period, then session will finish.
     */
    skipToNextPeriod = () => { 
        if (this.isCurrentlyWaiting()) { 
            this.progressToNextPeriod()
        }
        
        this.endPeriod()
    }

    /**
     * Cancel the current session.
     * Will not clear session yet, will do so when user closes the canceled session pop up.
     */
    cancelSession = () => {
        this.pauseSession()
        this.state = SessionState.CANCELED
        this.updateSession({ ...get(sessionStore)!, state: this.state })
    }

    /**
     * Get the medal and score for user's end result score.
     * Has 3 cases.
     * 
     * 1. All subtasks finished and finished early.
     *     - Perfect Score
     * 
     * 2. Not all subtasks finished and finished early.
     *     - Score depends on the % of subtasks finished.
     * 
     * 3. If finished at least at the designated end time
     *     - Score depends on two factors: 
     *          - amount of time between actual end time and designated end time (the farther the worse the score)
     *          - the amount of subtasks finished
     *     - Subtask factor is weighted more
     * 
     * @param isUserTimeEarly       If user ends session before the calculated end time.
     * @returns                     Score and result based on user score.
     */
    getResultMedalAndScore = (isUserTimeEarly: boolean): { score: number, medal: Medal } => {
        let score = 0
        let medal: Medal = "🏅"

        let timeScore = 0
        let todosCompletionScore = 100
        let hasFinishedAllTodos = this.todosCheckedCount === this.todos.length

        /* 1. All subtasks finished and finish early */
        if (isUserTimeEarly && hasFinishedAllTodos) {
            score = 100
            return { score, medal }
        }


        /* 2. Finished early, has not completed all todos */
        if (isUserTimeEarly && this.todosCheckedCount != this.todos.length) {
            score = Math.round((this.todosCheckedCount / this.todos.length) * 100)
            medal = this.getResultMedal(score)

            return { score, medal }
        }

        /* 3. Finished at least at the designated time. */
        if (hasFinishedAllTodos) {
            todosCompletionScore = 100
        }
        else {
            todosCompletionScore = Math.round((this.todosCheckedCount / this.todos.length) * 100)
        }

        const diffSecs = getDifferenceInSecs(this.endTime!, this.calculatedEndTime)

        if (diffSecs < this.TIME_CUT_OFF) {
            timeScore = Math.round((1 - (diffSecs / this.TIME_CUT_OFF)) * 100)
        }

        score = Math.round((this.TODO_SCORE_WEIGHT * todosCompletionScore) + (this.TIME_SCORE_WEIGHT * timeScore))
        medal = this.getResultMedal(score)

        return { score, medal }
    }

    /**
     * @param score     End result score.
     * @returns         Result medal which depends on the numerical score.
     */
    getResultMedal = (score: number): Medal => {
        if (score >= this.GOLD_CUT_OFF) {
            return "🏅"
        }
        else if (score >= this.SILVER_CUT_OFF) {
            return "🥈"
        }
        else {
            return "🥉"
        }
    }

    /**
     * Get result message and an accompanying image to show the user after the user ends.
     * Content will depend on the user performance. 
     * 
     * @param medal   The medal in which the result message and image depends on.
     * @returns       Result image and message to be shown to the user after session conclusion.
     */
    getResultImageAndMessage = (medal: Medal): { message: string, resultImgUrl: string } => {
        let msgs: string[] = []
        let imgs: string[] = []

        if (medal === "🥉") {
            msgs = sessionCopy.bronzeResultMessages
            imgs = sessionCopy.bronzeResultImages
        }
        else if (medal === "🥈") {
            msgs = sessionCopy.silverResultMessages
            imgs = sessionCopy.silverResultImages
        }
        else {
            msgs = sessionCopy.goldResultMessages
            imgs = sessionCopy.goldResultImages
        }

        return {
            message: msgs[Math.floor(Math.random() * msgs.length)],
            resultImgUrl: imgs[Math.floor(Math.random() * imgs.length)]
        }
    }

    addTodo = (todoTitle: string) => {
        this.todos.push({ title: todoTitle, isChecked: false })
        this.updateSession({ ...get(sessionStore)!, todos: this.todos })

        this.saveTodoData()
    }
    editTodo = (todoIndex: number, newTitle: string) => {
        this.todos[todoIndex].title = newTitle
        this.updateSession({ ...get(sessionStore)!, todos: this.todos })

        this.saveTodoData()
    }
    deleteTodo = (todoIndex: number) => {
        this.todosCheckedCount -= this.todos[todoIndex].isChecked ? 1 : 0
        this.todos.splice(todoIndex, 1)
        this.updateSession({ ...get(sessionStore)!, todos: this.todos, todosCheckedCount: this.todosCheckedCount })

        this.saveTodoData()
    }
    toggleCheckTodo = (todoIndex: number) => {
        this.todos[todoIndex].isChecked = !this.todos[todoIndex].isChecked
        this.todosCheckedCount += this.todos[todoIndex].isChecked ? 1 : -1
        this.updateSession({ ...get(sessionStore)!, todos: this.todos, todosCheckedCount: this.todosCheckedCount })

        this.saveTodoData()
    }

    saveTodoData = () => {
        localStorage.setItem("todos", JSON.stringify(this.todos))
    }
    saveData = () => {
        localStorage.setItem("session", JSON.stringify({
            name: this.name,
            tag: this.tag,
            pomTime: this.pomTime,
            pomPeriods: this.pomPeriods,
            breakTime: this.breakTime,
            startTime: this.startTime,
            isPlaying: this.isPlaying,
            endTime: this.endTime,
            calculatedEndTime: this.calculatedEndTime,
            totalElapsedTime: this.totalElapsedTime,
            timePeriodString: this.timePeriodString,
            currentIndex: this.currentIndex,
            currentPomPeriod: this.currentPomPeriod,
            lastFinishedPeriodIdx: this.lastFinishedPeriodIdx,
            sessionResult: this.sessionResult,
            todosCheckedCount: this.todosCheckedCount,
            pomMessage: this.pomMessage,
            state: this.state,
            currentTime: this.currentTime,
            userFocusTimeSecs: this.userFocusTimeSecs,
            userBreakTimeSecs: this.userBreakTimeSecs,
            currentSessionTimeSecs: this.currentSessionTimeSecs,
            sessionDurationMins: this.sessionDurationMins 
        }))
    }
    clearData = () => {
        localStorage.removeItem("todos")
        localStorage.removeItem("session")
    }
}