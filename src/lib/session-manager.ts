import { goto } from "$app/navigation"
import { sessionManager } from "./store"

import { toast } from "./utils-toast"
import { formatPlural, setDocumentTitle } from "./utils-general"
import { addToDate, getDifferenceInSecs, secsToHHMM, secsToHhMmSs } from "./utils-date"

import focusSound  from '$lib/sounds/focus.mp3'
import breakSound  from '$lib/sounds/break.mp3'
import focusReminderSound  from '$lib/sounds/focus-reminder.mp3'

export class SessionManager {
    session!: Session
    todosChecked = 0

    periods = 0
    totalFocusTime = 0
    totalBreakTime = 0

    focusCount = 0
    breakCount = 0
    pauseCount = 0
    
    elapsedSecs = 0
    progressSecs = 0
    nextBreakSecs = 0
    minimal = false
    
    // visualizer
    visStart!: Date
    visEnd!: Date
    currDate!: Date
    visEndIncrementSecs = 0

    // segments include break and paused periods
    currSegmentIdx = -1
    segments: SessionProgressSegment[] = []
    intervalWorker: Worker | null = null

    isPlaying = false
    state: SessionState = "focus"
    
    prevPage = ""
    timer: NodeJS.Timer | null = null

    static TRANSITION_DUR_SECS = 10
    static MIN_SESSION_TIME_MINS = 10

    FOCUS_SOUND_VOL = 0.055
    BREAK_SOUND_VOL = 0.125
    FOCUS_REMINDER_SOUND_VOL = 0.02

    static CHIME_PERIOD_SECS = 60 * 1
    LENGTHY_BREAK_REMIND_SECS = 60 * 4
    LENGTHY_BREAK_THRESHOLD_SECS = 60 * 20
    
    MAX_TIME_AWAY_MINS = 1
    NEXT_HOUR_DIST_MINS = 15
    MAX_SECS = 12 * 60 * 60

    constructor(session?: Session) {
        if (session) {
            this.currDate = new Date()
            this.session = session

            this.isPlaying = true
            this.state = "focus"
        }
        else if (!this.load()) {
            this.inactiveWindowQuit()
            return
        }
        this.todosChecked = this.session!.todos.reduce((count, todo) => {
            return count += (todo.isChecked ? 1 : 0)
        }, 0)

        sessionManager.set(this)

        if (session) {
            this.initNextVisEndTimeIncrement()
            this.initVisualStartEndTimes()
            this.updateVisEnd()
        }
        if (session && this.session.mode === "pom") {
            this.initNextBreak()
        }
        if (this.state != "done") {
            this.initTimer()
        }
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
            const firstPeriodMins = (this.session.focusTime + this.session.breakTime) / 60
            const mins = firstPeriodMins % 60
            const hrs  = Math.floor(firstPeriodMins / 60)
            const maxTime  = 60 - this.NEXT_HOUR_DIST_MINS
            const nextHour = hrs + (mins >= maxTime ? 2 : 1)
    
            this.visEndIncrementSecs = nextHour * 60 * 60
        }
        else {
            this.visEndIncrementSecs = 3_600
        }

    }

    /* controls */
    togglePlay() {
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
    }

    toggleMinimal() {
        this.minimal = !this.minimal
        this.update({ minimal: this.minimal })
    }

    /* timer */
    initTimer() {
        // offload to background worker to avoid throttling
        this.intervalWorker = new Worker(new URL('./workers/timeWorker.ts', import.meta.url))
        this.intervalWorker.onmessage = (event) => {
            if (event.data === 'tick') { 
                this.updateProgress()
            }
        }
        this.intervalWorker.postMessage({ interval: 1000 })
    }

    stopTimer() {
        if (!this.intervalWorker) return

        this.intervalWorker.terminate()
        this.intervalWorker = null
    }

    updateProgress() {
        const { breakTime } = this.session
        const state = this.state
        const mode = this.session.mode
        const focus = state === "focus"
        const transition = ["to-break", "to-focus"].includes(state)
        const TRANSITION_DUR_SECS = SessionManager.TRANSITION_DUR_SECS
        const isPom = mode === "pom"

        this.elapsedSecs += 1
        this.update({ elapsedSecs: this.elapsedSecs })
        this.currDate = new Date()

        if (this.elapsedSecs > this.MAX_SECS) {
            this.reachedMaxElapsedTimeHandler()
            return
        }
    
        // counter
        if (this.elapsedSecs > this.MAX_SECS) {
            this.finish()
        }
        if (this.isPlaying) {
            this.progressSecs++
            this.update({ progressSecs: this.progressSecs })
        }
        if (!transition) {
            this.totalFocusTime += this.isPlaying && focus ? 1 : 0
            this.totalBreakTime += !this.isPlaying || !focus ? 1 : 0

            this.update({
                totalFocusTime: this.totalFocusTime,
                totalBreakTime: this.totalBreakTime
            })
        }

        // state
        if (focus && this.elapsedSecs >= this.nextBreakSecs && !transition && isPom) {
            this.stateTransition("break")
        }
        else if (!focus && this.progressSecs >= breakTime && !transition && isPom) {
            this.stateTransition("focus")
        }

        // other updates
        if (transition) {
            const toFocus = state === "to-focus"
            const timeleft = TRANSITION_DUR_SECS - this.progressSecs
            const emoji = toFocus ? "→⏰" : "→🌿"

            setDocumentTitle(emoji + secsToHhMmSs(timeleft))
            
            if (timeleft <= 0 && this.session.mode === "pom") {
                toFocus ? this.focus() : this.break()
                this.initNextBreak()
            }
        }
        else if (this.isPlaying) {
            const emoji = focus ? "⏰" : "🌿"
            setDocumentTitle(emoji + secsToHhMmSs(this.progressSecs))
        }
        else {
            this.updateSegments()
            setDocumentTitle("⏸️" + secsToHhMmSs(this.progressSecs))
        }

        this.soundHandler()
        this.updateVisEnd()
    }

    /**
     * Sound handler for playing time blindness chime and lengthly break pings.
     */
    soundHandler() {
        const { allowChime, allowSfx, mode } = this.session
        const flow = mode === "flow"
        const elapsed = this.elapsedSecs        
        const progress = this.progressSecs

        if (flow && 
            allowSfx && 
            this.state === "break" && 
            progress > this.LENGTHY_BREAK_THRESHOLD_SECS && 
            progress % this.LENGTHY_BREAK_REMIND_SECS === 0
        ) {
            // plays at regular intervals if break is taking long
            this.playBreakSound()
        }
        if (allowChime && elapsed > 0 && elapsed % SessionManager.CHIME_PERIOD_SECS === 0) {
            this.playChimeSound()
        }
    }

    /**
     * Initialize a new break segment.
     * Occurs during the conclusion of a break segment and on to a focus segment.
     * Break segments start on the start of the transition to the break segment.
     */
    initNextBreak() {
        const { focusTime, breakTime } = this.session
        const transSecs = SessionManager.TRANSITION_DUR_SECS
        const firstBreakStart = addToDate({ date: new Date(), time: focusTime })
        const firstBreakEnd   = addToDate({ date: firstBreakStart, time: breakTime + (2 * transSecs) + 1 })
        
        this.periods++
        this.nextBreakSecs = (this.periods * focusTime) + ((this.periods - 1) * breakTime) + ((this.periods - 1) * (2 * transSecs))

        this.segments.push({
            start: firstBreakStart,
            end: firstBreakEnd,
            type: "break"
        })
        this.update({
            periods: this.periods,
            nextBreakSecs: this.nextBreakSecs
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
        const incrsFromStart = Math.floor(this.elapsedSecs / this.visEndIncrementSecs)
        const start = this.visStart

        const recentIncrHr = addToDate({ 
            date: start,
            time: incrsFromStart * this.visEndIncrementSecs
        })
        const nextIncrHr = addToDate({ 
            date: recentIncrHr,
            time: this.visEndIncrementSecs
        })
        const distFromNextHrSecs = getDifferenceInSecs(nextIncrHr, addToDate({
            date: this.session.startTime,
            time: this.elapsedSecs
        }))
        const distFromNextHrMins = distFromNextHrSecs / 60

        if (distFromNextHrMins <= this.NEXT_HOUR_DIST_MINS) {
            const nextNextIncrHr = addToDate({ 
                date: nextIncrHr,
                time: this.visEndIncrementSecs
            })

            this.visEnd = this.nearestFiveMinuteTime(nextNextIncrHr)
            this.update({ visEnd: this.visEnd })
        }
    }

    /* states */
    break() {
        this.progressSecs = 0
        this.breakCount++
        this.state = "break"
        this.isPlaying = true

        this.update({ 
            progressSecs: this.progressSecs,
            breakCount: this.breakCount,
            periods: this.periods,
            isPlaying: true,
            state: "break"
        })
    }

    focus() {
        this.progressSecs = 0
        this.focusCount++
        this.state = "focus"

        this.update({ 
            progressSecs: this.progressSecs,
            focusCount: this.focusCount,
            state: "focus"
        })
    }

    stateTransition(toState: "break" | "focus") {
        this.progressSecs = 0
        this.isPlaying = true
        
        if (toState === "break") {
            this.state = "to-break"
            this.playBreakSound()

            this.update({ 
                progressSecs: this.progressSecs,
                state: "to-break",
                isPlaying: true
            })
        }
        else {
            this.state = "to-focus"
            this.playFocusSound()

            this.update({ 
                progressSecs: this.progressSecs,
                isPlaying: true,
                state: "to-focus"
            })
        }
    }

    playFocusSound() {
        const audio = new Audio(focusSound)
        audio.volume = this.FOCUS_SOUND_VOL
        audio.play()
    }

    playBreakSound() {
        const audio = new Audio(breakSound)
        audio.volume = this.BREAK_SOUND_VOL
        audio.play()
    }

    playChimeSound() {
        const audio = new Audio(focusReminderSound)
        audio.volume = this.FOCUS_REMINDER_SOUND_VOL
        audio.play()
    }

    /* conclude  */

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

        setDocumentTitle("Somara")
        goto(this.prevPage)
    }

    newSegment(args: { type: SessionState }) {
        this.segments.push({
            type: args.type, start: new Date(), end: new Date()
        })

        return this.segments.length - 1
    }

    updatePrevPage(route: string) {
        this.prevPage = route
        this.update({ prevPage: route })
    }

    quit() {
        this.stopTimer()
        localStorage.removeItem("session")
        sessionManager.set(null)
        setDocumentTitle("Somara")
    }

    reachedMaxElapsedTimeHandler() {
        setTimeout(() => {
            toast("info", {
                message: `Session fnished. Maximum elapsed time reached. (${secsToHHMM(this.MAX_SECS)}).`
            })
        }, 1000)
        this.finish()
    }
    inactiveWindowQuit() {
        setTimeout(() => {
            toast("info", {
                message: `Session canceled. Window was closed for more than ${formatPlural("minute", this.MAX_TIME_AWAY_MINS)}`
            })
        }, 1000)
        this.quit()
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

    /* state */

    load() {
        const data = localStorage.getItem("session")
        if (!data) return

        const session = JSON.parse(data)
        const isDone  = session.state === "done"
        const currDate    = new Date(session.currDate)
        const elapsedTime = isDone ? 0 : getDifferenceInSecs(currDate, new Date())
        const maxTimeAway = this.MAX_TIME_AWAY_MINS * 60

        if (elapsedTime > maxTimeAway && !isDone) {
            return false
        }

        this.session = session.session
        this.session.startTime = new Date(this.session.startTime)
        this.periods = session.periods
        this.totalFocusTime = session.totalFocusTime
        this.totalBreakTime = session.totalBreakTime
        this.elapsedSecs = session.elapsedSecs
        this.progressSecs = session.progressSecs
        this.focusCount = session.focusCount
        this.breakCount = session.breakCount
        this.pauseCount = session.pauseCount
        this.segments = session.segments
        this.currSegmentIdx = session.currSegmentIdx
        this.nextBreakSecs = session.nextBreakSecs
        this.state = session.state
        this.prevPage = session.prevPage
        this.minimal = session.minimal
        this.visStart = new Date(session.visStart)
        this.visEnd = new Date(session.visEnd)
        this.visEndIncrementSecs = session.visEndIncrementSecs

        const transition = this.state.startsWith("to-")

        this.elapsedSecs += transition ? 0 : elapsedTime
        this.progressSecs += this.isPlaying ? 0 : elapsedTime

        if (isDone) {
            const endTime = this.session.result!.endTime!
            this.session.result!.endTime = new Date(endTime)
        }
        else {
            this.isPlaying = session.isPlaying
            this.currDate = new Date()
        }
        if ((this.state === "break" || this.state === "paused") && !isDone) {
            this.totalBreakTime += elapsedTime
        }
        else if (this.state === "focus" && !isDone) {
            this.totalFocusTime += elapsedTime
        }

        return true
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
            currSegmentIdx: state.currSegmentIdx,
            nextBreakSecs: state.nextBreakSecs,
            visStart: state.visStart,
            visEnd: state.visEnd,
            visEndIncrementSecs: state.visEndIncrementSecs,
            currDate: this.currDate,
    
            isPlaying: state.isPlaying,
            minimal: state.minimal,
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
        if (newState.minimal)  oldState.minimal = newState.minimal

        return oldState
    }
}