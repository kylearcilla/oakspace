import { get } from "svelte/store"
import { SessionState } from "./enums"
import { sessionStore } from "./store"
import { sessionCopy } from "$lib/data-pom"
import { getDifferenceInSecs, isDateEarlier } from "./utils-date"

/**
 * Pomodoro Session object initialized when there is an active session.
 * Is itself a reactive class / data store (set during instantiation).
 */
export class Session {
    name: string
    tag: Tag
    pomTime: number
    pomPeriods: number
    breakTime: number
    startTime: Date
    endTime: Date | null = null
    calculatedEndTime: Date
    totalElapsedTime: string
    timePeriodString: string
    currentIndex: number = 0
    currentPomPeriod: number = 1
    sessionResult: SessionResult | null = null
    todos: { title: string, isChecked: boolean }[] = []
    todosCheckedCount = 0
    pomMessage = "Focus Time"
    currentTime: { minutes: number, seconds: number } | null = {
        minutes: 0,
        seconds: 0
    }
    interval: NodeJS.Timer | null = null
    state: SessionState
    result: SessionResult | null = null

    TODO_SCORE_WEIGHT = 0.70
    TIME_SCORE_WEIGHT = 0.30

    TIME_CUT_OFF = 1860
    GOLD_CUT_OFF = 85
    SILVER_CUT_OFF = 60
    globalSessionObj: any

    constructor(sessionSettings: SessionInputs) { 
        this.name = sessionSettings.name
        this.tag = sessionSettings.tag
        this.pomTime = sessionSettings.focusTime
        this.pomPeriods = sessionSettings.poms
        this.breakTime = sessionSettings.breakTime
        this.startTime = new Date()
        this.calculatedEndTime = sessionSettings.calculatedEndTime!
        this.totalElapsedTime = sessionSettings.totalElapsedTime!
        this.timePeriodString = sessionSettings.timePeriodString!
        this.todos = sessionSettings.todos.map((todo) => ({ title: todo, isChecked: false }))
        this.currentPomPeriod = 1
        this.state = SessionState.FOCUSING

        this.playSession()
    }

    updateSession = (newData: Session) => {
        sessionStore.update((data: Session | null) => ({ ...data!, ...newData }))
    }

    clearSession = () => {
        sessionStore.set(null)
    }


    /**
     * Session phases are 0 indexed.
     * @returns See if the current phase of the session is a focus session.
     */
    iCurrentlyFocusTime = () => this.currentIndex % 2 === 0

    /**
     * @param newTitle   New title for the session
     */
    editSessionTitle = (newTitle: string) => {
        this.name = newTitle
        this.updateSession({ ...get(sessionStore)!, name: this.name })
    }

    /**
     * @param newTag  New tag for the session
     */
    editSesionTag = (newTag: Tag) => {
        this.tag = newTag
        this.updateSession({ ...get(sessionStore)!, tag: this.tag })
    }

    /**
     * Play current session. This will start an interval that will update the time every second.
     */
    playSession = () => {
        this.state = this.iCurrentlyFocusTime() ? SessionState.FOCUSING : SessionState.ON_BREAK

        this.interval = setInterval(() => {
            const endMins = this.iCurrentlyFocusTime() ? this.pomTime : this.breakTime
            this.updateTime(endMins)
        }, 1000)

        this.updateSession({ ...get(sessionStore)!, state: this.state })
    }

    /**
     * Pause current session. This will clear the current running interval.
     */
    pauseSession = () => {
        this.state = SessionState.PAUSED
        clearInterval(this.interval!)
        this.updateSession({ ...get(sessionStore)!, state: this.state })
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
            this.updateDocTitle(`${this.currentTime!.minutes}:${(this.currentTime!.seconds + "").padStart(2, '0')}`)
        }

        this.updateSession({ ...get(sessionStore)!, currentTime: this.currentTime })
    }

    /**
     * Change the document title.
     */
    updateDocTitle = (newTitle: string) => document.title = newTitle


    /**
     * End the current period after time has ran out. 
     * This will progress the period to a WAITING_TO_PROGRESS state.
     * Player is shown a message and a button to progress to the next state.
     * If this is the last phase, then end the session.
     */
    endPeriod = () => {
        this.pauseSession()
        this.currentTime!.minutes = 0
        this.currentTime!.seconds = 0
        this.state = this.iCurrentlyFocusTime() ? SessionState.WAITING_TO_PROGRESS_BREAK : SessionState.WAITING_TO_PROGRESS_FOCUS
        let randomMsgIdx = 0

        if (this.state === SessionState.WAITING_TO_PROGRESS_BREAK) {
            randomMsgIdx = Math.floor(Math.random() * sessionCopy.breakTimeMessages.length)
            this.pomMessage = sessionCopy.breakTimeMessages[randomMsgIdx]
        }
        else if (this.state === SessionState.WAITING_TO_PROGRESS_FOCUS) {
            randomMsgIdx = Math.floor(Math.random() * sessionCopy.focusMessages.length)
            this.pomMessage = sessionCopy.focusMessages[randomMsgIdx]
        }

        const periods = (this.pomPeriods * 2) - 2

        this.updateSession({ ...get(sessionStore)!, currentTime: this.currentTime,  pomMessage: this.pomMessage })

        if (this.currentIndex === periods) {
            this.finishSession()
            return
        }
    }

    /**
     * Progress to the next period after user continues to the next period during a WAITING_TO_PROGRESS state.
     * Will restart the current time.
     */
    progressToNextPeriod = () => {
        this.currentTime!.minutes = 0
        this.currentTime!.seconds = 0

        this.currentIndex++
        this.state = this.iCurrentlyFocusTime() ? SessionState.FOCUSING : SessionState.ON_BREAK

        if (this.state === SessionState.FOCUSING) {
            this.pomMessage = "Focus Time"
        }
        else if (this.state === SessionState.ON_BREAK) {
            this.pomMessage = "Break Time"
        }
        
        const hasFinishedFocusPeriod = this.currentIndex % 2 != 0

        if (hasFinishedFocusPeriod) { 
            this.currentPomPeriod++

            this.updateSession({
                ...get(sessionStore)!, 
                currentPomPeriod: this.currentPomPeriod,
                currentIndex: this.currentIndex,
                state: this.state,
                pomMessage: this.pomMessage,
                currentTime: this.currentTime
            })
        }

        this.playSession()
    }

    renameSesion = (newName: string) => {
        this.name = newName
        this.updateSession({ ...get(sessionStore)!, name: this.name })
    }

    /**
     * Finish current session. 
     * Calculate the user productivity score and show it with a message and an accompanying image.
     */
    finishSession = (fakeEndTime: Date = new Date()) => { 
        this.pauseSession()
        this.endTime = fakeEndTime
        this.endTime = new Date()

        const endTime = this.endTime
        this.state = SessionState.FINISHED

        const isEndTimeEarlier = isDateEarlier(endTime, this.calculatedEndTime)
        const hasFinishedAllTodos = this.todosCheckedCount === this.todos.length
        const medalAndScore = this.getMedalAndScore(isEndTimeEarlier, hasFinishedAllTodos)
        const msgAndImg = this.getResultImageAndMessage(medalAndScore.medal)

        this.sessionResult = { ...medalAndScore, ...msgAndImg }
        console.log(this.sessionResult)

        this.updateSession({ ...get(sessionStore)!, state: this.state, sessionResult: this.sessionResult })
        // this.clearSession()

        return this.sessionResult
    }

    /**
     * Restart current running period.
     */
    restartPeriod = () => {
        this.currentTime!.minutes = 0
        this.currentTime!.seconds = 0

        this.updateSession({ ...get(sessionStore)!, currentTime: this.currentTime })
    }

    /**
     * Forcibly skip to the next period without waiting for time to run out.
     */
    skipToNextPeriod = () => this.progressToNextPeriod()

    /**
     * Cancel the current session.
     * TODO: UI for letting the user know that they have just canceled.
     */
    cancelSession = () => {
        this.pauseSession()
        this.clearSession()
    }

    /**
     * Get the medal and score for user's end result score.
     * Has 3 cases.
     * 
     * 1. All subtasks finished and finished early.
     *     - Gold + 100
     * 
     * 2. Not all subtasks finished and finished early.
     *     - Score depends on the % of subtasks finished.
     * 
     * 3. If finished at least at the designated end time
     *     - Score depends on two factors: 
     *          - amount of time between actual end time and designated end time.
     *          - the amount of subtasks finished
     *     - Subtask factor is weighted more
     * 
     * @param isEndTimeEarlier 
     * @param hasFinishedAllTodos 
     * @returns 
     */
    getMedalAndScore = (isEndTimeEarlier: boolean, hasFinishedAllTodos: boolean): { score: number, medal: Medal } => {
        let score = 0
        let medal: Medal = "🏅"

        let timeScore = 0
        let subtasksScore = 100

        /* 1. All subtasks finished and finish early */
        if (isEndTimeEarlier && hasFinishedAllTodos) {
            score = 100
            return { score, medal }
        }


        /* 2. Finished early, has not completed all todos */
        if (isEndTimeEarlier && !hasFinishedAllTodos) {
            subtasksScore = Math.round((this.todosCheckedCount / this.todos.length) * 100)

            score = subtasksScore
            medal = this.getMedal(score)

            return { score, medal }
        }

        /* 3. Finished at least at the designated time. */
        if (hasFinishedAllTodos) {
            subtasksScore = 100
        }
        else {
            subtasksScore = Math.round((this.todosCheckedCount / this.todos.length) * 100)
        }

        const diffSecs = getDifferenceInSecs(this.endTime!, this.calculatedEndTime)

        if (diffSecs < this.TIME_CUT_OFF) {
            const percentageScore = 1 - (diffSecs / this.TIME_CUT_OFF)
            const intScore = Math.round(percentageScore * 100)
            timeScore = intScore
        }

        score = Math.round((this.TODO_SCORE_WEIGHT * subtasksScore) + (this.TIME_SCORE_WEIGHT * timeScore))
        medal = this.getMedal(score)

        return { score, medal }
    }

    /**
     * @param score     End result score.
     * @returns         Result medal which depends on the numerical score.
     */
    getMedal = (score: number): Medal => {
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
        if (medal === "🥉") {
            const msgs = sessionCopy.bronzeResultMessages
            const imgs = sessionCopy.bronzeResultImages

            return {
                message: msgs[Math.floor(Math.random() * msgs.length)],
                resultImgUrl: imgs[Math.floor(Math.random() * imgs.length)]
            }
        }

        const LAST_SILVER_MSG_IDX = 3
        const LAST_SILVER_IMG_IDX = 3
        const msgs = sessionCopy.goodResultMessages
        const imgs = sessionCopy.goodResultImages

        let lastIdxMsg = medal === "🥈" ? LAST_SILVER_MSG_IDX : msgs.length - 1  // if silver get from first 4 msgs, if gold get from rest
        let lastIdxImg = medal === "🥈" ? LAST_SILVER_IMG_IDX : imgs.length - 1  // if silver get from first 4 imgs, if gold get from rest

        let randomIdxMsg = Math.floor(Math.random() * lastIdxMsg + 1)

        // if any of the last 4 msgs is chosen when gold, must use the very last img
        let resultImgUrl = randomIdxMsg > LAST_SILVER_MSG_IDX ? imgs[imgs.length - 1] : imgs[Math.floor(Math.random() * lastIdxImg + 1)] 

        return {
            message: msgs[randomIdxMsg],
            resultImgUrl
        }
    }

    addTodo = (todoTitle: string) => {
        this.todos.push({ title: todoTitle, isChecked: false })
        this.updateSession({ ...get(sessionStore)!, todos: this.todos })
    }
    editTodo = (todoIndex: number, newTitle: string) => {
        this.todos[todoIndex].title = newTitle
        this.updateSession({ ...get(sessionStore)!, todos: this.todos })
    }
    deleteTodo = (todoIndex: number) => {
        this.todosCheckedCount -= this.todos[todoIndex].isChecked ? 1 : 0
        this.todos.splice(todoIndex, 1)
        this.updateSession({ ...get(sessionStore)!, todos: this.todos, todosCheckedCount: this.todosCheckedCount })
    }
    toggleCheckTodo = (todoIndex: number) => {
        this.todos[todoIndex].isChecked = !this.todos[todoIndex].isChecked
        this.todosCheckedCount += this.todos[todoIndex].isChecked ? 1 : -1
        this.updateSession({ ...get(sessionStore)!, todos: this.todos, todosCheckedCount: this.todosCheckedCount })
    }
}