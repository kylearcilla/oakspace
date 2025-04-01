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

    // session
    periods = 0
    totalFocusTime = 0
    totalBreakTime = 0

    focusCount = 0
    breakCount = 0
    pauseCount = 0
    
    elapsedSecs = 0
    progressSecs = 0
    nextBreakSecs = 0
    
    // visualizer
    visStart!: Date
    visEnd!: Date
    currDate!: Date
    visEndIncrementSecs = 0
    
    // segments include break and paused periods
    currSegmentIdx = -1
    segments: SessionProgressSegment[] = []
    
    isPlaying = false
    showTasks = false
    minUi = false
    visualizer = true
    show = true
    fontStyle: FontStyle = "default"

    state: SessionState = "focus"
    prevPage = ""

    static readonly TRANSITION_DUR_SECS = 10
    static readonly MIN_SESSION_TIME_MINS = 10
    
    static readonly CHIME_PERIOD_SECS = 60 * 4
    readonly LENGTHY_BREAK_REMIND_SECS = 60 * 4
    readonly LENGTHY_BREAK_THRESHOLD_SECS = 60 * 20
    readonly FOCUS_MODE_TIME_EXTEND_SECS = 60 * 60
    
    readonly MAX_TIME_AWAY_MINS = 1
    readonly NEXT_HOUR_DIST_MINS = 15
    readonly MAX_SECS = 12 * 60 * 60 // 12 hours

    readonly FOCUS_SOUND_VOL = 0.055
    readonly BREAK_SOUND_VOL = 0.125
    readonly FOCUS_REMINDER_SOUND_VOL = 0.02        

    constructor(session?: Session) {
        if (session) {
            this.currDate = new Date()
            this.session = session
            this.playFocusSound()
            
            this.isPlaying = true
            this.state = "focus"
        }
        else if (!this.load()) {
            this.inactiveWindowQuit()
            return
        }
        this.todosChecked = this.session!.todos.reduce((count, todo) => count += (todo.isChecked ? 1 : 0), 0)
        sessionManager.set(this)

        if (session) {
            this.setVisualTimeExtend()
            this.setVisualStartEndTimes()
            this.updateVisEnd()
        }
        if (session && this.session.mode === "pom") {
            this.initNextPomBreak()
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

    nearestFiveMinuteTime(date: Date) {
        const roundedDate = new Date(date)
        const minutes = roundedDate.getMinutes()
        const roundedMinutes = Math.floor(minutes / 5) * 5
        roundedDate.setMinutes(roundedMinutes)
        roundedDate.setSeconds(0)

        return roundedDate
    }
    /**
     * Calculates the time increment for extending the visualizer end time.
     * 
     * Determines how far ahead to extend the visualizer timeline when the current time 
     * approaches the visible end.
     * 
     * Flow mode: Always uses a 1-hour increment.
     * 
     * Pomodoro mode: Based on the length of a complete period (focus + break):
     * - If a period fits comfortably within an hour, extend by 1 hour
     * - If a period is close to filling an hour, extend by 2 hours to ensure visibility
     * 
     * Examples:
     * - 25m focus + 5m break = 30m period → extends by 1 hour
     * - 45m focus + 15m break = 60m period → extends by 2 hours
     */
    setVisualTimeExtend() {
        if (this.session.mode === "pom") {
            const firstPeriodMins = (this.session.focusTime + this.session.breakTime) / 60
            const mins = firstPeriodMins % 60
            const hrs  = Math.floor(firstPeriodMins / 60)
            const maxTime  = 60 - this.NEXT_HOUR_DIST_MINS
            const nextHour = hrs + (mins >= maxTime ? 2 : 1)
    
            this.visEndIncrementSecs = nextHour * 60 * 60
        }
        else {
            this.visEndIncrementSecs = this.FOCUS_MODE_TIME_EXTEND_SECS
        }
    }

    /**
     * Set the start and end times for the visualizer.
     */
    setVisualStartEndTimes() {
        this.visStart = this.nearestFiveMinuteTime(this.session.startTime)
        this.visEnd   = addToDate({ date: this.visStart, time: this.visEndIncrementSecs })
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
            this.newBreakSegment("paused")

            this.update({ 
                segments: this.segments,
                pauseCount: this.pauseCount
            })
        }
    }

    updateFontStyle(style: FontStyle) {
        this.fontStyle = style
        this.update({ fontStyle: style })
    }

    updateProgress() {
        const { breakTime } = this.session
        const state = this.state
        const mode = this.session.mode
        const focus = state === "focus"
        const transition = ["to-break", "to-focus"].includes(state)
        const isPom = mode === "pom"
        const TRANSITION_DUR_SECS = SessionManager.TRANSITION_DUR_SECS

        this.elapsedSecs += 1
        this.currDate = new Date()
        this.update({ elapsedSecs: this.elapsedSecs })

        if (this.elapsedSecs > this.MAX_SECS) {
            this.reachedMaxElapsedTimeHandler()
            return
        }
        // counters
        if (this.isPlaying) {
            // time for the current period (focus or break)
            this.progressSecs++
            this.update({ progressSecs: this.progressSecs })
        }
        if (!transition) {
            this.totalFocusTime += this.isPlaying && focus ? 1 : 0
            this.totalBreakTime += !this.isPlaying || !focus ? 1 : 0

            this.update({
                totalFocusTime: this.totalFocusTime, totalBreakTime: this.totalBreakTime
            })
        }

        // break once the set next break time is reached
        if (focus && this.elapsedSecs >= this.nextBreakSecs && !transition && isPom) {
            this.stateTransition("break")
        }
        // focus once current progress is greater than break time
        else if (!focus && this.progressSecs >= breakTime && !transition && isPom) {
            this.stateTransition("focus")
        }

        // transition handler + visuals
        if (transition) {
            const toFocus = state === "to-focus"
            const timeleft = TRANSITION_DUR_SECS - this.progressSecs
            const emoji = toFocus ? "→⏰" : "→🌿"

            setDocumentTitle(emoji + secsToHhMmSs(timeleft))
            
            if (timeleft <= 0) {
                toFocus ? this.focus() : this.break()
                this.initNextPomBreak()
            }
        }
        else if (this.isPlaying && focus) {
            setDocumentTitle("🌿" + secsToHhMmSs(this.progressSecs))
        }
        else {
            this.updateRecentBreakSegment()
            const emoji = state === "break" ? "🌿" : "⏸️"
            setDocumentTitle(emoji + secsToHhMmSs(this.progressSecs))
        }

        this.autoSoundHandler()
        this.updateVisEnd()
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
            this.newBreakSegment("break")

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

    /**
     * Initialize a new break segment and set the next break time.
     * Break inlcude both pauses & breaks.
     * Triggers during the conclusion of a break segment and on to a focus segment.
     */
    initNextPomBreak() {
        const { focusTime, breakTime } = this.session
        const transSecs = SessionManager.TRANSITION_DUR_SECS
        const firstBreakStart = addToDate({ date: new Date(), time: focusTime })
        const firstBreakEnd   = addToDate({ date: firstBreakStart, time: breakTime + (2 * transSecs) + 1 })
        
        this.periods++
        this.nextBreakSecs = (this.periods * focusTime) + ((this.periods - 1) * breakTime) + ((this.periods - 1) * (2 * transSecs))

        this.update({
            periods: this.periods,
            nextBreakSecs: this.nextBreakSecs
        })
    }

    /**
     * Update the inactive segments (pause / break) after each tick.
     */
    updateRecentBreakSegment() {
        const idx = this.currSegmentIdx
        if (idx < 0) return

        const recentSegment = this.segments[idx]
        this.segments[idx] = {
            ...recentSegment, end: new Date()
        }

        this.update({ segments: this.segments })
    }

    /**
     * Extends the end time on the visualizer.
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

        // if current place in current segment is close to the next hour then extend
        if (distFromNextHrMins <= this.NEXT_HOUR_DIST_MINS) {
            const nextNextIncrHr = addToDate({ 
                date: nextIncrHr,
                time: this.visEndIncrementSecs
            })

            this.visEnd = this.nearestFiveMinuteTime(nextNextIncrHr)
            this.update({ visEnd: this.visEnd })
        }
    }

    newBreakSegment(type: "break" | "paused") {
        this.segments.push({
            type, start: new Date(), end: new Date()
        })

        this.currSegmentIdx = this.segments.length - 1

        return this.currSegmentIdx
    }

    flowModeToggleState() {
        if (this.state === "break") {
            this.stateTransition("focus")
            this.periods++
        }
        else if (this.state === "focus") {
            this.stateTransition("break")
        }
    }

    /* sound */

    autoSoundHandler() {
        const { allowChime, allowSfx, mode } = this.session
        const flow = mode === "flow"
        const elapsed = this.elapsedSecs        
        const progress = this.progressSecs

        // flow: if break is taking long
        if (flow && allowSfx && progress > this.LENGTHY_BREAK_THRESHOLD_SECS && progress % this.LENGTHY_BREAK_REMIND_SECS === 0) {
            this.playBreakSound()
        }
        // time blindness, play on set intervals
        if (allowChime && elapsed > 0 && elapsed % SessionManager.CHIME_PERIOD_SECS === 0) {
            this.playChimeSound()
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

    /* ui */

    toggleMinUi() {
        this.minUi = !this.minUi
        this.update({ minUi: this.minUi })
    }

    toggleShow() {
        this.show = !this.show
        this.update({ show: this.show })
    }

    toggleVisualizer() {
        this.visualizer = !this.visualizer
        this.update({ visualizer: this.visualizer })
    }

    toggleTasks() {
        this.showTasks = !this.showTasks
        this.update({ showTasks: this.showTasks })
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

        this.update({
            session: this.session, state: "done"
        })

        setDocumentTitle("Oakspace")
    }

    updatePrevPage(route: string) {
        this.prevPage = route
        this.update({ prevPage: route })
    }

    quit() {
        localStorage.removeItem("session")
        sessionManager.set(null)
        setDocumentTitle("Oakspace")
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

    /* utils */

    updateTasks(tasks: Task[]) {
        this.session.todos = tasks
        this.todosChecked = tasks.reduce((count, todo) => count += (todo.isChecked ? 1 : 0), 0)

        this.update({
            session: this.session,
            todosChecked: this.todosChecked
        })
    }

    load() {
        const data = localStorage.getItem("session")
        if (!data) return false

        const session = JSON.parse(data)
        const isDone  = session.state === "done"
        const currDate    = new Date(session.currDate)
        const elapsedTime = isDone ? 0 : getDifferenceInSecs(currDate, new Date())
        const maxTimeAway = this.MAX_TIME_AWAY_MINS * 60
        const transition = session.state.startsWith("to-")

        if (elapsedTime > maxTimeAway && !isDone) {
            return false
        }

        this.session = session.session
        this.session.startTime = new Date(this.session.startTime)

        this.periods = session.periods
        this.focusCount = session.focusCount
        this.breakCount = session.breakCount
        this.pauseCount = session.pauseCount

        this.totalFocusTime = session.totalFocusTime
        this.totalBreakTime = session.totalBreakTime
        this.elapsedSecs = session.elapsedSecs
        this.progressSecs = session.progressSecs

        this.state = session.state
        this.currSegmentIdx = session.currSegmentIdx
        this.segments = session.segments
        this.nextBreakSecs = session.nextBreakSecs
        
        this.visStart = new Date(session.visStart)
        this.visEnd = new Date(session.visEnd)
        this.visualizer = session.visualizer
        this.visEndIncrementSecs = session.visEndIncrementSecs
        this.showTasks = session.showTasks
        this.fontStyle = session.fontStyle
        this.minUi = session.minUi
        this.prevPage = session.prevPage
        this.show = session.show
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
            
            isPlaying: state.isPlaying,
            state: state.state,

            periods: state.periods,
            focusCount: state.focusCount,
            breakCount: state.breakCount,
            pauseCount: state.pauseCount,
            segments: state.segments,

            totalFocusTime: state.totalFocusTime,
            totalBreakTime: state.totalBreakTime,
            elapsedSecs: state.elapsedSecs,
            
            currSegmentIdx: state.currSegmentIdx,
            nextBreakSecs: state.nextBreakSecs,

            visStart: state.visStart,
            visEnd: state.visEnd,
            visEndIncrementSecs: state.visEndIncrementSecs,
            
            minUi: state.minUi,
            visualizer: state.visualizer,
            fontStyle: state.fontStyle,
            show: state.show,
            currDate: this.currDate,
            showTasks: state.showTasks,
            prevPage: state.prevPage,
            progressSecs: state.progressSecs
        }))
    }

    getNewState(oldState: SessionManager, newState: Partial<SessionManager>) {
        if (newState.session)  oldState.session = newState.session
        if (newState.progressSecs)  oldState.progressSecs = newState.progressSecs

        if (newState.isPlaying)  oldState.isPlaying = newState.isPlaying
        if (newState.state)  oldState.state = newState.state
        
        if (newState.periods)  oldState.periods = newState.periods
        if (newState.focusCount)  oldState.focusCount = newState.focusCount
        if (newState.breakCount)  oldState.breakCount = newState.breakCount
        if (newState.prevPage)  oldState.prevPage = newState.prevPage
        if (newState.pauseCount)  oldState.pauseCount = newState.pauseCount
        
        if (newState.totalFocusTime)  oldState.totalFocusTime = newState.totalFocusTime
        if (newState.totalBreakTime)  oldState.totalBreakTime = newState.totalBreakTime
        if (newState.elapsedSecs)  oldState.elapsedSecs = newState.elapsedSecs
        
        if (newState.visStart)  oldState.visStart = newState.visStart
        if (newState.fontStyle)  oldState.fontStyle = newState.fontStyle
        if (newState.visEnd)  oldState.visEnd = newState.visEnd
        if (newState.showTasks)  oldState.showTasks = newState.showTasks
        if (newState.show)  oldState.show = newState.show
        if (newState.minUi)  oldState.minUi = newState.minUi
        if (newState.visualizer)  oldState.visualizer = newState.visualizer
        if (newState.todosChecked)  oldState.todosChecked = newState.todosChecked
        
        return oldState
    }
}