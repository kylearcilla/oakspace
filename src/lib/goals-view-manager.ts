import { globalContext, goalTracker } from "./store"
import { get, writable, type Writable } from "svelte/store"

import { toast } from "./utils-toast"
import { TEST_TAGS } from "./mock-data"
import { initFloatElemPos, isEditTextElem, getElemById, isVoid, getTagFromName } from "./utils-general"
import { groupSwitchUpdate, handleStoreUpdate, moveGoalDate, moveGoalDueDay, pinGoal, reorderPinned, setPeriodPinned, setViewGoal, STATUSES, unpinGoal, updateGoalIdx } from "./utils-goals"
import { deleteGoal, getDateFromTimeFrame, getGroupIdx, getNextTimeFrame, getPeriodData, getPeriodType, getPinnedGoals, getYearProgress, moveGoal } from "./utils-goals"

export type _Goal = Goal & { secIdx: number, idx: number }
export type _Section = { section: string, idx: number }

type ViewElement = (_Section | _Goal) & { type: "section" | "goal" }
type FocusElement = { elem: HTMLElement, idx: number, viewElement: ViewElement }

const TAGS: Tag[] = TEST_TAGS


/**
 * Manages the goals interface uis (GoalsList + GoalsBoard).
 */
export class GoalsViewManager {
    goals: Goal[]
    state: Writable<GoalsViewState>
    uiState: Writable<GoalsViewUIState>

    timeFrame: { year: number, period: string }

    /* ui state */
    containerRef: HTMLElement | null = null
    sortedGoals: Goal[][] = []
    sections: string[] = []
    sectionMap: { [key: string]: number } = {}
    closedSections: boolean[] = []
    openGoalId = ""

    grouping: "status" | "tag" | "default" = "default"

    /* dragging */
    dragState: "goal" | "milestone" | null = null
    msDragSrc: Goal | null = null
    dragSrc: Goal | null = null
    dragTarget: GoalDragTarget | null = null

    /* edits */
    contextMenuPos = { left: 0, top: 0 }
    contextMenuOpen = false
    statusOpen = false
    statusMenuPos = { left: 0, top: 0 }
    editGoal: Goal | null = null
    deleteGoal: Goal | null = null

    focusElement: FocusElement | null = null

    constructor({ goals, timeFrame, grouping }: { 
        goals: Goal[], 
        timeFrame: { year: number, period: string },
        grouping: "status" | "tag" | "default", 
    }) {
        this.goals = goals
        this.timeFrame = timeFrame
        this.state = writable({
            sortedGoals: [],
            pinnedGoals: getPinnedGoals(),
            sections: [],
            viewProgress: 0,
            yrProgress: 0,
            pinnedGoal: null
        })
        this.uiState = writable({
            dragTarget: null,
            closedSections: [],
            openGoalId: "",
            contextMenuPos: { left: 0, top: 0 },
            contextMenuOpen: false,
            statusOpen: false,
            statusMenuPos: { left: 0, top: 0 },
            editGoal: null,
            deleteConfirm: false
        })
        
        this.initSections(grouping)
        this.updateProgress()
    }

    initContainerRef(containerRef: HTMLElement) {
        this.containerRef = containerRef
    }

    update(newState: Partial<GoalsViewState>) {
        this.state.update((data) => ({ ...data, ...newState }))
    }

    updateUI(newState: Partial<GoalsViewUIState>) {
        this.uiState.update((data) => ({ ...data, ...newState }))
    }

    /**
     * Reset after any goals update.
     */
    resetGoals() {
        const data = getPeriodData({      
            year: this.timeFrame.year, period: this.timeFrame.period 
        })
        this.goals = data.goals
        this.sortGoals()

        const viewProgress = this.getViewProgress()
        const yrProgress = getYearProgress(this.timeFrame.year)
        const pinnedGoal = data.pinnedGoal
        const sortedGoals = this.sortedGoals

        this.update({ viewProgress, yrProgress, pinnedGoal, sortedGoals })
    }

    setViewPeriod({ year, period }: { year: number, period: string }) {
        this.timeFrame = { year, period }
        const data = getPeriodData({ year, period })

        this.periodPinGoal(data.pinnedGoal)
        this.initGoals(data.goals)

        return data
    }

    initGoals(goals: Goal[]) {
        this.goals = goals
        this.initSections(this.grouping)
        this.updateProgress()
    }

    /* sections */

    initSections(grouping: "status" | "tag" | "default") {
        this.grouping = grouping

        if (grouping === "status") {
            this.sections = STATUSES
        }
        else if (grouping === "tag") {
            this.sections = this.getTagSections()
        }
        else {
            this.sections = ["*"]
        }

    this.initSecMap()
    this.sortedGoals = this.sectionGoals()
        this.closedSections = new Array(this.sections.length).fill(false)

        this.update({ 
            sections: this.sections,
            sortedGoals: this.sortedGoals
        })
        this.updateUI({
            closedSections: this.closedSections
        })
    }

    initSecMap() {
        this.sectionMap = {}
        this.sections.forEach((name, idx) => this.sectionMap[name] = idx)
    }

    /**
     * Sort goals into sections.
     */
    sectionGoals() {
        const sortedGoals: Goal[][] = []
        const { grouping, sections, goals } = this

        sections.forEach((sec: string) => {
            const filteredGoals = goals.filter(goal => {
                if (grouping === "status") {
                    return goal.status === sec
                } 
                else if (grouping === "tag") {
                    return goal.tag?.name === sec || (sec === "Empty" && !goal.tag)
                }
                else {
                    return true
                }
            })
    
            filteredGoals.sort((a, b) => this.getGroupIdx(a) - this.getGroupIdx(b))
            sortedGoals.push(filteredGoals)
        })
    
        return sortedGoals
    }

    toggleSectionOpen(secIdx: number) {
        this.closedSections[secIdx] = !this.closedSections[secIdx]
        this.updateUI({ closedSections: this.closedSections })
    }

    getTagGoals(tag: Tag) {
        if (tag.name === "*") {
            return this.goals.filter(goal => !goal.tag).length
        }
        else {
            return this.goals.filter(goal => goal.tag?.name === tag.name).length
        }
    }

    getTagSections() {
        const tags = TAGS.sort((a: Tag, b: Tag) => {
            const aCount = this.getTagGoals(a)
            const bCount = this.getTagGoals(b)
            
            if (aCount > 0 && bCount === 0) return -1
            if (aCount === 0 && bCount > 0) return 1
            return 0
        })

        return tags.map(tag => tag.name)
    }

    getSectionProgress(secIdx: number) {
        const section = this.sortedGoals[secIdx]
        const done = section.filter(goal => goal.status === "accomplished").length
        const total = section.length
    
        return { done, total }
    }

    /* goal management */

    sortGoals() {
        this.sortedGoals = this.sectionGoals()
        this.closedSections = new Array(this.sections.length).fill(false)
        this.openGoalId = ""

        this.updateUI({
            closedSections: this.closedSections,
            openGoalId: this.openGoalId
        })
    }

    resortGoals() {
        this.sortGoals()
        this.update({ sortedGoals: this.sortedGoals })
    }

    toggleGoalOpen(goalId: string) {
        this.openGoalId = this.openGoalId === goalId ? "" : goalId
        this.updateUI({ openGoalId: this.openGoalId })
    }

    getGoalProgress(goal: Goal) {
        if (!goal.tasks) {
            return { checkCount: 0, total: 0 }
        }
        
        const checkCount = goal.tasks.filter(task => task.isChecked).length
        const total = goal.tasks.length

        return { checkCount, total }
    }

    removeGoal(goal: Goal) {
        const pinnedGoal = get(this.state).pinnedGoal

        if (pinnedGoal?.id === goal.id) {
            this.periodPinGoal(null)
        }

        deleteGoal(goal)
        this.update({ pinnedGoals: getPinnedGoals() })
    }

    periodPinGoal(goal: Goal | null, updateCache = false ) {
        this.update({ pinnedGoal: goal ?? null })

        if (updateCache) {
            setPeriodPinned({ goal, timeFrame: this.timeFrame })
        }
    }

    moveGoalDueDay(goal: Goal, newDueDate: Date) {
        moveGoalDueDay(goal, newDueDate)
    }

    /* status management */

    toggleGoalStatus(goal: Goal, newStatus?: "accomplished" | "in-progress" | "not-started") {
        if (goal.status === newStatus) return

        const oldStatus = goal.status
        goal.status =  newStatus ? newStatus : goal.status === "accomplished" ? "in-progress" : "accomplished"

        if (goal.status === "accomplished") {
            goal.completedDate = new Date()
        }
        else {
            goal.completedDate = null
        }
        

        groupSwitchUpdate({ 
            goal, 
            grouping: "status",
            sSection: oldStatus, 
            tSection: goal.status
        })
        handleStoreUpdate(goal)
    }

    /**
     * Update the year and the current view period progress.
     */
    updateProgress() {
        const viewProgress = this.getViewProgress()
        const yrProgress = getYearProgress(this.timeFrame.year)

        this.update({ viewProgress, yrProgress })
    }

    /**
     * Get the progress of the goals currently in view.
     */
    getViewProgress() {
        const completed = this.goals.filter(goal => goal.status === "accomplished").length
        const total = this.goals.length

        return total > 0 ? completed / total : 0
    }

    /* options */

    onContextMenu(pe: Event, goal: Goal) {
        pe.preventDefault()
        if (!this.containerRef) return

        const { clientX, clientY } = pe as PointerEvent
        const { left, top } = this.containerRef.getBoundingClientRect()

        this.contextMenuPos = initFloatElemPos({
            dims: { 
                height: 150,
                width: 170
            }, 
            containerDims: { 
                height: this.containerRef.clientHeight, 
                width: this.containerRef.clientWidth
            },
            cursorPos: {
                left: clientX - left,
                top: clientY - top
            }
        })

        this.editGoal = goal
        this.contextMenuOpen = true
        
        this.updateUI({
            contextMenuPos: this.contextMenuPos,
            contextMenuOpen: true,
            editGoal: goal
        })
    }

    onOptionClicked(option: string) {
        const goal = this.editGoal!
        if (option.includes("Top")) {
            option === "Pin up Top" ? pinGoal(goal) : unpinGoal(goal)
            
            this.update({ pinnedGoals: getPinnedGoals() })
        }
        else if (option.includes("Pin to")) {
            this.periodPinGoal(goal, true)
        }
        else if (option.includes("Unpin from")) {
            this.periodPinGoal(null, true)
        }
        else if (option === "Remove") {
            this.deleteGoal = goal
            this.updateUI({ deleteConfirm: true })
        }
        else if (option.startsWith("Push to")) {
            this.pushGoalToTimeFrame(goal)
        }
        else if (option === "View Details") {
            setViewGoal(goal)
        }
        this.closeContextMenu()
    }

    confirmDelete(doDelete: boolean) {
        if (doDelete) {
            this.removeGoal(this.deleteGoal!)
        }
        this.deleteGoal = null
        this.updateUI({ deleteConfirm: false })
    }

    pushGoalToTimeFrame(goal: Goal) {
        const nextTimeFrame = getNextTimeFrame(this.timeFrame)
        const nextDate = getDateFromTimeFrame(nextTimeFrame)

        const moIdx = nextDate.getMonth()
        const year = nextDate.getFullYear()
        const date = nextDate.getDate()

        moveGoalDate({ goal, moIdx, year, date })
    }
    
    closeContextMenu(removeEditGoal = true) {
        if (removeEditGoal) {
            this.editGoal = null
        }
        this.contextMenuOpen = false

        this.updateUI({
            contextMenuOpen: false,
            editGoal: this.editGoal
        })
    }

    /* drag and drop */

    setDragState(state: "goal" | null) {
        this.dragState = state
    }

    onDrag(e: DragEvent, goal: Goal) {
        e.dataTransfer?.setData("text", "") // Required for Firefox
        e.dataTransfer!.effectAllowed = "move"

        if (!this.dragState) {
            e.preventDefault()
            return
        }
        this.dragSrc = goal
    }

    /**
     * Drag over hanlder for moving a goal.
     * For goals within the goal list or board, month or pinned goal in carousel.
     * 
     * @param e - the drag event
     * @param target  - new nbr goal, or section name, or month number
     * 
     * @returns true if the drag is valid, false otherwise
     */
    onDragEnter(e: DragEvent, target: string | Goal | number) {
        e.preventDefault()
        const tElem = e.target as HTMLElement
        const parentElem = tElem.closest("[data-drag-context]") as HTMLElement

        if (!parentElem) return

        const dragContext = parentElem.dataset.dragContext

        if (dragContext === "goal") {
            this.dragTarget = { type: "goal", data: target }
        }
        else if (dragContext === "month") {
            this.dragTarget = { type: "month", data: target }
        }
        else if (dragContext === "pinned-goal") {
            this.dragTarget = { type: "pinnedGoal", data: target }
        }

        this.updateUI({ dragTarget: this.dragTarget })

        return true
    }

    onDragEnd() {
        const { dragTarget: target, dragSrc } = this

        if (target && dragSrc) {
            const type = target!.type

            // moving within goal list or board
            if (type === "goal") {
                this.reorderGoals(this.dragSrc as Goal, target!.data as Goal | string)
            }
            // pinning goal to the goal caoursel
            else if (type === "pinnedGoal") {
                const goal = this.dragSrc!
                const nbrPinGoal = target!.data as Goal

                if (!isVoid(goal.pinIdx)) {
                    this.reorderPinnedGoals(goal, nbrPinGoal)
                    this.closeDrag()
                    return
                }
                
                goal.pinIdx = nbrPinGoal.pinIdx
                pinGoal(goal, nbrPinGoal.pinIdx!)
                this.update({ pinnedGoals: getPinnedGoals() })
            }
            // moving goal to a different month
            else if (type === "month") {
                const moIdx = target!.data as number
                moveGoalDate({ 
                    goal: dragSrc, 
                    moIdx, 
                    year: this.timeFrame.year 
                })
            }
        }
        this.closeDrag()
    }

    resetGoalsDragTarget() {
        this.dragTarget = null
        this.updateUI({ dragTarget: null })
    }

    closeDrag() {
        this.dragState = null
        this.dragSrc = null
        this.dragTarget = null

        this.updateUI({ dragTarget: null })
    }

    /* reorder */

    reorderGoals(srcGoal: Goal, target: Goal | string) {
        if (typeof target != "string" && srcGoal.id === target.id) {
            return
        }
        moveGoal({
            srcGoal,
            target,
            timeFrame: this.timeFrame,
            grouping: this.grouping
        })
    }

    reorderPinnedGoals(srcGoal: Goal, target: Goal) {
        reorderPinned(srcGoal, target)

        this.update({ pinnedGoals: getPinnedGoals() })
    }

    /* navigation */

    navigateViewElements(input: "arrow-up" | "arrow-down" | "enter" | "space" | "delete") {
        const arrowUp = input === "arrow-up"
        const arrowDown = input === "arrow-down"
        const { sortedGoals, sections, openGoalId, closedSections, grouping } = this
    
        if (arrowUp || arrowDown) {
            const elements: ViewElement[] = []
    
            // construct the elements how they are presented in the DOM
            for (let i = 0; i < sortedGoals.length; i++) {
                const isOpen = !closedSections[i]
                const goals = sortedGoals[i].length
    
                if (grouping != "default") {
                    elements.push({ 
                        section: sections[i],
                        idx: i,
                        type: "section",
                    })
                }
                for (let j = 0; j < goals && isOpen; j++) {
                    const goal = sortedGoals[i][j]
                    elements.push({
                        ...goal,
                        type: "goal",
                        secIdx: i,
                        idx: j
                    })
                }
            }
    
            if (!this.focusElement) {
               this.setNewFocus(elements[0], 0)
            }
            else {
                const idx = this.focusElement.idx
                const newIdx = this.getSafeIdx(idx + (arrowUp ? -1 : 1), elements.length)
                this.setNewFocus(elements[newIdx], newIdx)
            }
        }
    
        return this.focusElement
    }

    setNewFocus(viewElem: ViewElement, idx: number) {
        const type = viewElem.type
        let elem: HTMLElement | null = null
    
        if (type === "section") {
            const section = viewElem as _Section
            elem = getElemById(`section--${section.idx}`)
        }
        else if (type === "goal") {
            const { secIdx, idx } = viewElem as _Goal
            elem = getElemById(`goal--${secIdx}-${idx}`)
        }
    
        if (this.focusElement) {
            this.togglElemFocus(this.focusElement.elem, false)
        }
        this.focusElement = {
            elem: elem!, idx, viewElement: viewElem
        }
        this.togglElemFocus(this.focusElement.elem, true)
    }

    getSafeIdx(idx: number, max: number) {
        return idx < 0 ? max - 1 : idx > max - 1 ? 0 : idx
    }
    
    togglElemFocus(elem: HTMLElement, focus: boolean) {
        if (focus) {
            elem.focus()
        }
        else {
            elem.blur()
        }
    }

    exitFocus() {
        if (this.focusElement) {
            this.togglElemFocus(this.focusElement.elem, false)
            this.focusElement = null
        }
    }

    /* hotkeys */

    handleKeydown(ke: KeyboardEvent) {
        const viewGoal = get(goalTracker).viewGoal
        if (isEditTextElem(ke.target as HTMLElement) || viewGoal) return
        
        const hotkeyFocus = get(globalContext).hotkeyFocus
        if (hotkeyFocus !== "default") {
            return
        }
        
        const { key } = ke
        let input: "arrow-up" | "arrow-down" | "enter" | "space" | "delete" = "enter"

        if (key === "ArrowDown") {
            input = "arrow-down"
        }
        else if (key === "ArrowUp") {
            input = "arrow-up"
        }
        else if (key === "Enter") {
            input = "enter"
        }
        else if (key === "Space" || key === " ") {
            input = "space"
        }
        else if (key === "Backspace") {
            input = "delete"
        }
        else {
            return
        }

        ke.preventDefault()
        const focused = this.navigateViewElements(input)
        if (!focused) return

        const viewElem = focused.viewElement
        const type = viewElem.type

        if (input === "space" && type === "section") {
            const section = viewElem as _Section
            this.toggleSectionOpen(section.idx)
        }
        else if (input === "space" && type === "goal") {
            const goal = viewElem as _Goal
            this.toggleGoalOpen(goal.id)
        }
        else if (type === "goal") {
            const goal = viewElem as _Goal
            const goalItem = this.sortedGoals[goal.secIdx][goal.idx]

            if (input === "enter") {
                this.toggleGoalStatus(goalItem)
            }
            else if (input === "delete") {
                this.removeGoal(goalItem)
            }
        }
    }
    
    /* utils */

    getGroupIdx(goal: Goal) {
        const period = getPeriodType(this.timeFrame.period)

        return getGroupIdx({
            goal,
            period,
            grouping: this.grouping
        })
    }

    updateGoalIdx(goal: Goal, idx: number) {
        const period = getPeriodType(this.timeFrame.period)

        return updateGoalIdx({
            goal,
            period,
            grouping: this.grouping,
            idx
        })
    }

    getSectionContext(name: string): { name: GoalViewSection, valueId: string } {
        let valueId = name
        let grouping = this.grouping

        if (grouping === "status") {
            return { name: "status", valueId }
        }
        else if (grouping === "tag") {
            valueId = getTagFromName(name)!.id
            
            return { name: "tag", valueId }
        }
        else {
            return { name: "default", valueId }
        }
    }
}
