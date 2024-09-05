import { ModalType } from "./enums"
import { sessionManager } from "./store"
import { openModal } from "./utils-home"
import { setDocumentTitle } from "./utils-general"
import { addToDate, getDifferenceInSecs, getNextHour, secsToHhMmSs, startOfDay } from "./utils-date"
import { get } from "svelte/store"

export class SessionManager {
    session!: Session
    todosChecked = 0

    periods = 1
    totalFocusTime = 0
    totalBreakTime = 0

    focusCount = 0
    breakCount = 0
    pauseCount = 0
    
    transitionCount = 0
    elapsedSecs = 0
    progressSecs = 0  // focus and break progress
    nextBreakSecs = 0
    
    // visualizer
    visStart!: Date
    visEnd!: Date
    progressTail!: Date
    focusStart!: Date
    breakStart!: Date
    breakTail!: Date
    prevDate!: Date
    visEndIncrementSecs = 0

    // segments include break and paused periods
    currSegmentIdx = -1
    segments: SessionProgressSegment[] = []
    timer: Worker | NodeJS.Timer | null = null

    isPlaying = false
    state: SessionState = "focus"
    
    prevPage = ""

    static TRANSITION_DUR_SECS = 10
    static MIN_SESSION_TIME_MINS = 15
    NEXT_HOUR_DIST_MINS = 15
    MAX_SECS = 12 * 60 * 60

    constructor(session?: Session) {
        if (session) {
            this.progressTail = new Date()
            this.focusStart = new Date()
            this.prevDate = new Date()
            this.session = session
            this.isPlaying = true
            this.state = "focus"
        }
        else {
            this.load()
        }
        this.todosChecked = this.session!.todos.reduce((count, todo) => {
            return count += (todo.isChecked ? 1 : 0)
        }, 0)

        sessionManager.set(this)
        
        this.initNextVisEndTimeIncrement()
        this.initVisualStartEndTimes()
        this.initTimer()

        if (session && this.session.mode === "pom") {
            this.initNextBreak()
        }

        this.updateVisEnd()
    }

    update(newState: Partial<SessionManager>) {
        let _newState: SessionManager

        sessionManager.update((state) => {
            _newState = this.getNewState(state!, newState)
            return _newState
        })

        this.save(_newState!)
    }

    updateTitle(newName: string) {
        this.session.name = newName
        this.update({ session: this.session })
    }

    initVisualStartEndTimes() {
        this.visStart = this.nearestFiveMinuteTime(this.session.startTime)
        this.visEnd   = addToDate({ date: this.visStart, time: this.visEndIncrementSecs })
    }

    nearestFiveMinuteTime(date: Date) {
        const roundedDate = new Date(date)
        const minutes = roundedDate.getMinutes()

        const roundedMinutes = Math.floor(minutes / 5) * 5
        roundedDate.setMinutes(roundedMinutes)
        roundedDate.setSeconds(0)

        return roundedDate
    }

    initNextVisEndTimeIncrement() {
        if (this.session.mode === "pom") {
            const firstPeriodMins  = this.session.focusTime + this.session.breakTime
            const remainingMinutes = firstPeriodMins % 60
            const maxTime  = 60 - this.NEXT_HOUR_DIST_MINS
            const nextHour = remainingMinutes >= maxTime ? 2 : 1
        
            this.visEndIncrementSecs = nextHour * 60 * 60
        }
        else {
            this.visEndIncrementSecs = 3_600
        }
    }

    /* controls */

    togglePlay() {
        if (this.state === "break" && this.isPlaying) {
            this.isPlaying = true
            this.update({ isPlaying: true })
        }
        if (["to-focus", "to-break", "break"].includes(this.state)) {
            return
        }
        this.isPlaying = !this.isPlaying
        this.update({ isPlaying: this.isPlaying })

        if (!this.isPlaying) {
            this.pauseCount++
            this.currSegmentIdx = this.newSegment({ type: "paused" })

            this.update({ 
                segments: this.segments,
                pauseCount: this.pauseCount
            })
        }
        else {
            this.currSegmentIdx = -1
        }

        this.updateCounterTracker({ state: this.isPlaying ? "focus" : "break" })
    }

    /* timer */
    updateCounterTracker(args: { state: "focus" | "break" | "pause" }) {
        const { state } = args

        if (state === "break" || state === "pause") {
            this.breakStart = new Date()

            this.breakTail = this.breakTail ? addToDate({
                date: this.breakTail,
                time: this.diff(this.focusStart, new Date())
            }) : new Date()
        }
        else {
            this.focusStart = new Date()

            this.progressTail = this.breakStart ? addToDate({
                date: this.progressTail,
                time: this.diff(this.breakStart, new Date())
            }) : new Date()
        }
    }

    initTimer() {
        const isDev = import.meta.env.MODE === "development"

        if (isDev) {
            this.timer = setInterval(() => this.updateProgress(), 1000)
        }
        else {
            // offload to background worker to avoid throttling
            this.timer = new Worker(new URL('./workers/timeWorker.ts', import.meta.url))
            this.timer.onmessage = (event) => {
                if (event.data === 'tick') { 
                    this.updateProgress()
                }
            }
            this.timer.postMessage({ interval: 1000 })
        }

    }

    stopTimer() {
        if (!this.timer) return
        const isDev = import.meta.env.MODE === "development"

        if (isDev) {
            clearInterval(this.timer as any)
        }
        else {
            (this.timer as Worker).terminate()
        }
        this.timer = null
    }

    updateProgress() {
        const { breakTime, startTime } = this.session
        const state = this.state
        const focus = state === "focus"
        const playing = this.isPlaying
        const transition = ["to-break", "to-focus"].includes(state)
        const TRANSITION_DUR_SECS = SessionManager.TRANSITION_DUR_SECS

        this.prevDate = new Date()

        if (!transition) {
            this.elapsedSecs = this.diff(new Date(), startTime)
        }
        if (this.elapsedSecs > this.MAX_SECS) {
            this.finish()
        }
        if (playing) {
            this.progressSecs = this.diff(new Date(), this.progressTail)
            this.update({ progressSecs: this.progressSecs })
        }
        if (!transition) {
            const updateFocus = playing && focus
            const updateBreak = !playing || !focus
            this.totalFocusTime = updateFocus ? this.diff(new Date(), this.progressTail) : this.totalFocusTime
            this.totalBreakTime = updateBreak ? this.diff(new Date(), playing ? this.progressTail : this.breakTail) : this.totalBreakTime

            this.update({
                totalFocusTime: this.totalFocusTime,
                totalBreakTime: this.totalBreakTime
            })
        }
        if (focus && this.elapsedSecs === this.nextBreakSecs) {
            this.stateTransition("break")
        }
        else if (!focus && this.progressSecs === breakTime) {
            this.stateTransition("focus")
        }
        if (state === "to-focus") {
            setDocumentTitle("→⏰" + secsToHhMmSs(TRANSITION_DUR_SECS - this.progressSecs))
        }
        else if (state === "to-break") {
            setDocumentTitle("→🌿" + secsToHhMmSs(TRANSITION_DUR_SECS - this.progressSecs))
        }
        else if (playing) {
            const emoji = focus ? "⏰" : "🌿"
            setDocumentTitle(emoji + secsToHhMmSs(this.progressSecs))
        }
        else {
            this.updateSegments()
            setDocumentTitle("⏸️" + secsToHhMmSs(this.progressSecs))
        }

        this.updateVisEnd()
    }

    initNextBreak() {
        const { focusTime, breakTime } = this.session
        const firstbreakTail = addToDate({ date: new Date(), time: focusTime })
        const firstBreakEnd   = addToDate({ date: firstbreakTail, time: breakTime })

        this.nextBreakSecs = (this.periods * focusTime) + (breakTime * (this.periods - 1))

        this.segments.push({
            start: firstbreakTail,
            end: firstBreakEnd,
            type: "break"
        })
    }

    /**
     * Update the inactive segments (pause / break) after each tick.
     */
    updateSegments() {
        const idx = this.currSegmentIdx
        if (idx < 0) return

        const recentSegment = this.segments[idx]

        this.segments[idx] = {
            ...recentSegment, end: new Date()
        }

        this.update({ segments: this.segments })
    }

    /**
     * Update the end date on the visualizer.
     * Will increase the end date if the progress gets too close to the end date.
     * Ensures that there is always space for a full period (focus + break segments).
     */
    updateVisEnd() {
        const elapsed = this.elapsedSecs
        const incrsFromStart = elapsed / this.visEndIncrementSecs 
        const { startTime } = this.session

        const recentIncrHr = addToDate({ 
            date: startTime,
            time: incrsFromStart * this.visEndIncrementSecs
        })
        const nextIncrHr = addToDate({ 
            date: recentIncrHr,
            time: this.visEndIncrementSecs
        })
        const distFromNextHr = this.diff(nextIncrHr, new Date()) / 60

        if (distFromNextHr <= this.NEXT_HOUR_DIST_MINS) {
            this.visEnd = nextIncrHr
            this.update({ visEnd: nextIncrHr })
            
            if (this.session.mode === "pom") {
                this.initNextBreak()
            }
        }
    }

    /* states */
    break() {
        this.progressSecs = 0
        this.breakCount++
        this.periods++
        this.state = "break"
        this.updateCounterTracker({ state: "break" })

        this.update({ 
            progressSecs: this.progressSecs,
            breakCount: this.breakCount,
            periods: this.periods,
            state: "break"
        })
    }

    focus() {
        this.progressSecs = 0
        this.focusCount++
        this.state = "focus"
        this.updateCounterTracker({ state: "focus" })

        this.update({ 
            progressSecs: this.progressSecs,
            focusCount: this.focusCount,
            state: "focus"
        })
    }

    stateTransition(toState: "break" | "focus") {
        const TRANSITION_DUR_SECS = SessionManager.TRANSITION_DUR_SECS
        this.progressSecs = 0
        this.progressTail = new Date()
        
        if (toState === "break") {
            this.state = "to-break"
            this.isPlaying = true

            this.update({ 
                state: "to-break",
                isPlaying: true
            })

            setTimeout(() => {
                this.break()

            }, TRANSITION_DUR_SECS * 1000)
        }
        else {
            this.state = "to-focus"            
            this.update({ state: "to-focus"})

            if (this.session.mode === "pom") {
                this.initNextBreak()
            }

            setTimeout(() => {
                this.focus()

            }, TRANSITION_DUR_SECS * 1000)
        }
    }

    finish() {
        const result = {
            endTime: new Date(),
            focusCount: this.focusCount,
            breakCount: this.breakCount,
            pauseCount: this.pauseCount,
            elapsedSecs: this.elapsedSecs,
            totalFocusTime: this.totalFocusTime,
            totalBreakTime: this.totalBreakTime
        }

        this.session.result = result
        this.stopTimer()

        this.update({
            session: this.session,
            state: "done"
        })

        openModal(ModalType.SessionSummary)
    }

    newSegment(args: { type: SessionState }) {
        this.segments.push({
            type: args.type, start: new Date(), end: new Date()
        })

        return this.segments.length - 1
    }

    /* conclude  */

    updatePrevPage(route: string) {
        this.prevPage = route
        this.update({ prevPage: route })
    }

    /* tasks */
    updateTasks(tasks: Task[]) {
        this.session.todos = tasks
        this.todosChecked = tasks.reduce((count, todo) => {
            return count += (todo.isChecked ? 1 : 0)
        }, 0)

        this.update({
            session: this.session,
            todosChecked: this.todosChecked
        })
    }

    diff(x: Date, y: Date) {
        return getDifferenceInSecs(x, y)
    }

    /* state */

    quit() {
        this.stopTimer()
        localStorage.removeItem("session")
        sessionManager.set(null)
        setDocumentTitle("Somara")
    }

    load() {
        const data = localStorage.getItem("session")
        if (!data) return

        const session = JSON.parse(data)
        this.session = session.session
        this.session.startTime = new Date(this.session.startTime)

        this.periods = session.periods
        this.totalFocusTime = session.totalFocusTime
        this.totalBreakTime = session.totalBreakTime
        
        this.focusCount = session.focusCount
        this.breakCount = session.breakCount
        this.pauseCount = session.pauseCount
        this.elapsedSecs = session.elapsedSecs
        this.transitionCount = session.transitionCount
        this.segments = session.segments
        this.currSegmentIdx = session.currSegmentIdx
        this.nextBreakSecs = session.nextBreakSecs
        this.progressTail = new Date()
        this.prevDate = new Date(session.prevDate)

        this.isPlaying = session.isPlaying
        this.state = session.state
        this.prevPage = session.prevPage
        this.progressSecs = session.progressSecs

        this.elapsedSecs += this.diff(this.prevDate, new Date())
        this.prevDate = new Date()
    }

    save(state: SessionManager) {
        localStorage.setItem("session", JSON.stringify({
            session: state.session,
            periods: state.periods,
            totalFocusTime: state.totalFocusTime,
            totalBreakTime: state.totalBreakTime,
            
            focusCount: state.focusCount,
            breakCount: state.breakCount,
            pauseCount: state.pauseCount,
            elapsedSecs: state.elapsedSecs,
            segments: state.segments,
            transitionCount: state.transitionCount,
            currSegmentIdx: state.currSegmentIdx,
            nextBreakSecs: state.nextBreakSecs,
            progressTail: state.progressTail,
            prevDate: state.prevDate,
    
            isPlaying: state.isPlaying,
            state: state.state,
            prevPage: state.prevPage,
            progressSecs: state.progressSecs
        }))
    }

    getNewState(oldState: SessionManager, newState: Partial<SessionManager>) {
        if (newState.session)  oldState.session = newState.session
        if (newState.progressSecs)  oldState.progressSecs = newState.progressSecs

        if (newState.isPlaying)  oldState.isPlaying = newState.isPlaying
        if (newState.state)  oldState.state = newState.state
        if (newState.todosChecked)  oldState.todosChecked = newState.todosChecked
        if (newState.periods)  oldState.periods = newState.periods
        if (newState.focusCount)  oldState.focusCount = newState.focusCount
        if (newState.breakCount)  oldState.breakCount = newState.breakCount
        if (newState.prevPage)  oldState.prevPage = newState.prevPage
        if (newState.pauseCount)  oldState.pauseCount = newState.pauseCount
        if (newState.totalFocusTime)  oldState.totalFocusTime = newState.totalFocusTime
        if (newState.totalBreakTime)  oldState.totalBreakTime = newState.totalBreakTime
        if (newState.elapsedSecs)  oldState.elapsedSecs = newState.elapsedSecs
        if (newState.visStart)  oldState.visStart = newState.visStart
        if (newState.visEnd)  oldState.visEnd = newState.visEnd
        if (newState.transitionCount)  oldState.transitionCount = newState.transitionCount

        return oldState
    }
}