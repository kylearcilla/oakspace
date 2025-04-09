import { get, writable, type Writable } from "svelte/store"
import { initFloatElemPos } from "./utils-general"
import { genMonthCalendar, getMonthWeeks, isSameDay, isSameMonth } from "./utils-date"
import { TEST_TAGS } from "./mock-data"
import { GOALS } from "./mock-data-goals"
  
type CalendarDay = {
    date: Date
    isInCurrMonth: boolean
}

type OverviewState = {
    month: MonthData
    entries: DayEntry[]
    weeks: CalendarDay[][]
    editDay: EditDay | null
    hasContextMenu: boolean
    contextPos: OffsetPoint
    imgModal: boolean
    entryModal: boolean
}

type EditDay = {
    date: Date
    idx: number
    data: DayEntry | null
}

export class OverviewManager {
    state: Writable<OverviewState>
    containerRef: HTMLElement | null = null
    
    constructor(entries: DayEntry[]) {
        const month = genMonthCalendar(new Date())
        
        this.state = writable({
            month,
            entries,
            weeks: getMonthWeeks(month.days),
            editDay: null,
            hasContextMenu: false,
            contextPos: { left: -1000, top: -1000 },
            imgModal: false,
            entryModal: false
        })
    }

    initContainerRef(containerRef: HTMLElement) {
        this.containerRef = containerRef
    }

    update(newState: Partial<OverviewState>) {
        this.state.update((data) => ({ ...data, ...newState }))
    }

    findDayEntry(day: Date) {
        const entries = get(this.state).entries
        const idx = entries.findIndex((d) => isSameDay(d.date, day))
        const entry = idx >= 0 ? entries[idx] : undefined

        return { entry, idx }
    }

    onContextMenu(e: PointerEvent, date: Date) {
        const sameMonth = isSameMonth(date, new Date())
        if (!this.containerRef || !sameMonth) return

        const { entry, idx } = this.findDayEntry(date)
        const rect = this.containerRef.getBoundingClientRect()
        const cursorPos = {
            left: e.clientX - rect.left - 10,
            top: e.clientY - rect.top + 30
        }
        const { left, top } = initFloatElemPos({
            dims: { height: 65, width: 125 }, 
            containerDims: { 
                height: this.containerRef.clientHeight - 5, 
                width: this.containerRef.clientWidth - 5
            },
            cursorPos
        })

        this.update({
            hasContextMenu: true,
            contextPos: { left, top },
            editDay: { date, idx, data: entry ?? null }
        })
    }

    onPhotoClicked(date: Date) {
        const { entry, idx } = this.findDayEntry(date)

        this.update({
            imgModal: true,
            editDay: { date, idx, data: entry ?? null }
        })
    }

    closeEdit() {
        this.update({
            entryModal: false,
            imgModal: false,
            editDay: null
        })
    }

    closeContextMenu() {
        this.update({
            hasContextMenu: false,
            editDay: null
        })
    }

    onSettingsOptnClicked(optn: string) {
        const { editDay } = get(this.state)
        if (!editDay) return

        const entry = editDay.data

        if (optn === "Add a Goal") {

        }
    }

    getGoalsDisplayData(goals: { type: string, name?: string, tag: any }[]) {
        return {
            firstGoal: goals[0] ?? undefined,
            count: goals.length
        }
    }

    onDayEntryUpdate(updatedData: DayEntryUpdatePayload) {
        const { editDay } = get(this.state)
        if (!editDay) return

        const day = ACTIVITY_DATA[editDay.idx]

        this.update({
            entryModal: false,
            editDay: null
        })
    }
}