import { writable, type Writable } from "svelte/store"

import { toast } from "./utils-toast"
import { TEST_GOALS } from "./mock-data"
import { initFloatElemPos, isEditTextElem, getElemById, getTagFromName } from "./utils-general"

export type _Goal = Goal & { secIdx: number, idx: number }
export type _Milestone = Milestone & { secIdx: number, goalIdx: number }
export type _Section = { section: string, idx: number }

type ViewElement = (_Section | _Goal | _Milestone) & { type: "section" | "goal" | "milestone" }
type FocusElement = { elem: HTMLElement, idx: number, viewElement: ViewElement }

const STATUSES    = ["not-started", "in-progress", "accomplished"]
const TAGS: Tag[] = Array.from(new Set(TEST_GOALS.map(goal => goal.tag).filter(tag => tag !== undefined)))
const TAG_STR     = TAGS.map((tag) => tag.name)

type GoalsViewState = {
    sortedGoals: Goal[][],
    closedSections: boolean[],
    sections: string[],
    openGoalId: string,
    dragTarget: Goal | Milestone | string | null,
    pinnedGoal: Goal | null,
    dragState: "goal" | "milestone" | null,
    contextMenuPos: { left: number, top: number }
    contextMenuOpen: boolean
    statusOpen: boolean
    statusMenuPos: { left: number, top: number }
    editGoal: Goal | null
}

export class GoalsManager {
    goals: Goal[]
    state: Writable<GoalsViewState>

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
    dragSrc: Goal | Milestone | null = null
    dragTarget: Goal | Milestone | string | null = null

    /* edits */
    contextMenuPos = { left: 0, top: 0 }
    contextMenuOpen = false
    statusOpen = false
    statusMenuPos = { left: 0, top: 0 }
    editGoal: Goal | null = null

    focusElement: FocusElement | null = null

    constructor({ goals, grouping }: { 
        goals: Goal[], 
        grouping: "status" | "tag" | "default", 
    }) {
        this.goals = goals

        this.state = writable({
            sortedGoals: [],
            closedSections: [],
            sections: [],
            openGoalId: "",
            dragTarget: null,
            grouping,
            pinnedGoal: this.goals[4],
            dragState: null,
            contextMenuPos: { left: 0, top: 0 },
            contextMenuOpen: false,
            statusOpen: false,
            statusMenuPos: { left: 0, top: 0 },
            editGoal: null
        })
        this.initSections(grouping)
    }

    initContainerRef(containerRef: HTMLElement) {
        this.containerRef = containerRef
    }

    update(newState: Partial<GoalsViewState>) {
        this.state.update((data) => {
            const state = this.getNewStateObj(data, newState)
            return state
        })
    }

    /* sections */

    initSections(grouping: "status" | "tag" | "default") {
        this.grouping = grouping

        if (grouping === "status") {
            this.sections = STATUSES
        }
        else if (grouping === "tag") {
            this.sections = TAG_STR
        }
        else {
            this.sections = ["*"]
        }

        this.initSecMap()
        this.sortedGoals = this.sectionGoals()

        this.update({ 
            sections: this.sections,
            sortedGoals: this.sortedGoals
        })
    }

    initSecMap() {
        this.sectionMap = {}
        this.sections.forEach((name, idx) => this.sectionMap[name] = idx)
    }

    sectionGoals() {
        const sortedGoals: Goal[][] = []
        const { grouping, sections, goals } = this

        sections.forEach((sec: string) => {
            const filteredGoals = goals.filter(goal => {
                if (grouping === "status") {
                    return goal.status === sec
                } 
                else if (grouping === "tag") {
                    return goal.tag?.name === sec
                }
                else {
                    return true
                }
            })
    
            filteredGoals.sort((a, b) => a.bOrder[grouping] - b.bOrder[grouping])
            sortedGoals.push(filteredGoals)
        })
    
        return sortedGoals
    }

    toggleSectionOpen(secIdx: number) {
        this.closedSections[secIdx] = !this.closedSections[secIdx]
        this.update({ closedSections: this.closedSections })
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

        this.update({ 
            sortedGoals: this.sortedGoals,
            closedSections: this.closedSections,
            openGoalId: this.openGoalId
        })
    }

    reSortGoals() {
        this.sortGoals()
        this.update({ sortedGoals: this.sortedGoals })
    }

    toggleGoalOpen(goalId: string) {
        this.openGoalId = this.openGoalId === goalId ? "" : goalId
        this.update({ openGoalId: this.openGoalId })
    }

    getGoalProgress(goal: Goal) {
        if (!goal.milestones) {
            return { checkCount: 0, total: 0 }
        }
        
        const checkCount = goal.milestones.filter(ms => ms.done).length
        const total = goal.milestones.length

        return { checkCount, total }
    }

    addGoal(newGoal: Goal) {
        const groupings: ("status" | "tag" | "default")[] = ["status", "tag", "default"]

        groupings.forEach(g => {
            const section = this.goals.filter(item => this.goalKeyVal(item, g) === this.goalKeyVal(newGoal, g))
            const toIdx = newGoal.bOrder[g]
    
            this.shiftGoals({
                goals: section,
                grouping: g,
                fromIdx: toIdx,
                toIdx: section.length,
                shift: 1
            })
    
            newGoal.bOrder[g] = toIdx
        })
        
        this.goals.push(newGoal)
        this.reSortGoals()
    }

    removeGoal(goal: Goal) {
        const groupings: ("status" | "tag" | "default")[] = ["status", "tag", "default"]
    
        groupings.forEach(g => {
            const section = this.goals.filter(item => this.goalKeyVal(item, g) === this.goalKeyVal(goal, g))
            const fromIdx = goal.bOrder[g]
            
            this.shiftGoals({
                goals: section,
                grouping: g,
                fromIdx: fromIdx + 1,
                toIdx: section.length,
                shift: -1
            })
        })

        this.goals = this.goals.filter(g => g.id !== goal.id)
        this.reSortGoals()

        toast("default", {
            message: "Goals",
            description: `"${goal.name}" deleted from your Goals`,
            action: {
                label: "Undo",
                onClick: () => {
                    this.addGoal(goal)
                }
            }
        })
    }

    pinGoal(goal: Goal | null) {
        this.update({ pinnedGoal: goal })
    }

    goalKeyVal(goal: Goal, grouping: "status" | "tag" | "default") {
        if (grouping === "status") {
            return goal.status as keyof typeof this.sectionMap
        }
        else if (grouping === "tag") {
            return goal.tag!.name as keyof typeof this.sectionMap
        }
        else {
            return "*"
        }
    }

    shiftGoals({ goals, grouping, fromIdx, toIdx, shift }: {
        goals: Goal[]
        grouping: "status" | "tag" | "default"
        fromIdx: number
        toIdx: number
        shift: 1 | -1
    }) {
        goals.forEach(goal => {
            const order = goal.bOrder[grouping]
            if (order >= fromIdx && order < toIdx) {
                goal.bOrder[grouping] += shift
            }
        })
        
        return goals
    }

    /* status management */

    setGoalStatus(goal: Goal, newStatus: "accomplished" | "in-progress" | "not-started") {
        this.goals = this.onStatusChange({ 
            goal,
            newStatus: newStatus as "accomplished" | "in-progress" | "not-started" 
        })
        this.reSortGoals()
    }

    toggleMilestoneComplete(secIdx: number, goalIdx: number, msIdx: number) {
        const goal = this.sortedGoals[secIdx][goalIdx]
        const milestones = goal.milestones
        if (!milestones) return

        milestones[msIdx].done = !milestones[msIdx].done
        this.update({ sortedGoals: this.sortedGoals })
    }

    onStatusChange({ 
        goal, 
        newStatus
    }: {
        goal: Goal
        newStatus: "accomplished" | "in-progress" | "not-started"
    }) {
        const oldIdx = goal.bOrder.status
        const oldStatus = goal.status
        const oldStatusGoals = this.goals.filter(goal => goal.status === oldStatus)
    
        const newStatusGoals = this.goals.filter(goal => goal.status === newStatus)
        const newIdx = newStatusGoals.length
    
        // remove from old
        this.shiftGoals({ 
            goals: oldStatusGoals, 
            grouping: "status", 
            fromIdx: oldIdx, 
            toIdx: oldStatusGoals.length, 
            shift: -1
        })
        // add to new
        this.shiftGoals({ 
            goals: newStatusGoals, 
            grouping: "status", 
            fromIdx: newIdx, 
            toIdx: newStatusGoals.length, 
            shift: 1
        })
    
        goal.status = newStatus
        goal.bOrder.status = newIdx
    
        return this.goals
    }

    /* options */

    onContextMenu(pe: PointerEvent, goal: Goal) {
        pe.preventDefault()
        if (!this.containerRef) return


        const { clientX, clientY } = pe
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

        this.update({ 
            contextMenuPos: this.contextMenuPos,
            contextMenuOpen: true,
            editGoal: goal
        })
    }

    onOptionClicked(option: string) {
        if (option === "Pin Goal") {
            this.pinGoal(this.editGoal)
        }
        else if (option === "Unpin Goal") {
            this.pinGoal(null)
        }
        else if (option === "Remove") {
            this.removeGoal(this.editGoal!)
        }

        this.closeContextMenu()
    }

    closeContextMenu(removeEditGoal = true) {
        if (removeEditGoal) {
            this.editGoal = null
        }
        this.contextMenuOpen = false

        this.update({ 
            contextMenuOpen: false,
            editGoal: this.editGoal
        })
    }

    /* drag and drop */

    onDrag(e: DragEvent, goal: Goal, milestone?: Milestone) {
        e.dataTransfer?.setData("text", "") // Required for Firefox
        e.dataTransfer!.effectAllowed = "move"

        if (!this.dragState) {
            e.preventDefault()
            return
        }

        this.msDragSrc = milestone ? goal : null
        this.dragSrc = milestone ?? goal
    }

    onDragOver(e: DragEvent, target: Goal | Milestone | string) {
        e.preventDefault()

        // the last position
        if (typeof target === "string") {
            this.dragTarget = target
        }
        else if ("name" in target && target.name !== this.dragSrc?.name) {
            this.dragTarget = target
        }
        this.update({ dragTarget: this.dragTarget })
    }

    onDragLeave() {
        this.dragTarget = null
        this.update({ dragTarget: null })
    }

    onDragEnd() {
        const { dragTarget, msDragSrc, dragSrc } = this
        const isMilestone = msDragSrc && dragSrc

        if (dragTarget && isMilestone) {
            this.reorderMilestones(msDragSrc, dragSrc as Milestone, dragTarget as Milestone)
        }
        else if (dragTarget && dragSrc) {
            this.reorderGoals(this.dragSrc as Goal, this.dragTarget as Goal | GoalStatus)
        }

        this.dragState = null
        this.dragSrc = null
        this.dragTarget = null

        this.update({ dragTarget: null, dragState: null })
    }

    setDragState(state: "goal" | "milestone" | null) {
        this.dragState = state
        this.update({ dragState: state })
    }

    reorderMilestones(goal: Goal, src: Milestone, target: Milestone | "end") {
        const milestones = goal.milestones
        if (!milestones) return

        const srcOrder = src.idx
        const lastOrder = Math.max(...milestones.map((ms) => ms.idx)) + 1
        const toIdx = target === "end" ? lastOrder : target.idx
        const direction = srcOrder < toIdx ? "up" : "down"
        const targetOrder = toIdx + (direction === "up" ? -1 : 0)

        milestones.forEach((ms) => {
            if (direction === "up" && ms.idx > srcOrder && ms.idx <= targetOrder) {
                ms.idx--
            } 
            else if (direction === "down" && ms.idx >= targetOrder && ms.idx < srcOrder) {
                ms.idx++
            }
        })

        src.idx = targetOrder
        this.update({ sortedGoals: this.sortedGoals })
    }

    reorderGoals(srcGoal: Goal, target: Goal | GoalStatus) {
        const { grouping, goals, sectionMap } = this

        const toEnd = typeof target === "string"
        const s = {
            order: srcGoal.bOrder[grouping],
            section: this.goalKeyVal(srcGoal, grouping),
            sectionIdx: -1
        }
        const t = {
            order:   toEnd ? -1 : target.bOrder[grouping],
            section: toEnd ? target : this.goalKeyVal(target, grouping),
            sectionIdx: -1
        }
        
        const sameSec = s.section === t.section
        const sSection = goals.filter(goal => this.goalKeyVal(goal, grouping) === s.section)
        const tSection = goals.filter(goal => this.goalKeyVal(goal, grouping) === t.section)
        const fromIdx = s.order
    
        t.order = toEnd ? tSection.length : t.order
        s.sectionIdx = sectionMap[s.section]
        t.sectionIdx = sectionMap[t.section]
    
        let toIdx = 0
        let direction: "up" | "down" = "up"
    
        if (sameSec) {
            direction = s.order > t.order ? "up" : "down"
            toIdx = direction === "up" ? t.order : t.order - 1
    
            if (direction === "up") {
                this.shiftGoals({ 
                    goals: sSection, 
                    grouping, 
                    fromIdx: toIdx, 
                    toIdx: fromIdx, 
                    shift: 1
                })
            }
            else {
                this.shiftGoals({ 
                    goals: tSection, 
                    grouping, 
                    fromIdx, 
                    toIdx: toIdx + 1, 
                    shift: -1
                })
            }
        }
        else {
            direction = s.sectionIdx > t.sectionIdx ? "up" : "down"
            toIdx = t.order
    
            // remove from src section
            this.shiftGoals({ 
                goals: sSection, 
                grouping, 
                fromIdx, 
                toIdx: sSection.length,
                shift: -1
            })
    
            // make space for new item
            this.shiftGoals({ 
                goals: tSection, 
                grouping, 
                fromIdx: toIdx, 
                toIdx: tSection.length, 
                shift: 1
            })
        }
    
        this.updateSrcGoaOnOrder({ srcGoal, target, grouping })
        srcGoal.bOrder[grouping] = toIdx

        this.reSortGoals()
    }

    updateSrcGoaOnOrder(args: {
        srcGoal: Goal, target: Goal | GoalStatus, grouping: "status" | "tag" | "default"
    }) {
        const { srcGoal, target, grouping } = args
        
        if (grouping === "status") {
            srcGoal.status = typeof target === "string" ? target : target.status
        }
        else if (grouping === "tag") {
            srcGoal.tag = typeof target === "string" ? getTagFromName(target)! : target.tag
        }
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
                    const isOpen = openGoalId === goal.id
    
                    elements.push({
                        ...goal,
                        type: "goal",
                        secIdx: i,
                        idx: j
                    })
                    if (isOpen && goal.milestones) {
                        const ms = goal.milestones.map(ms => ({ 
                            ...ms, 
                            type: "milestone" as const, 
                            secIdx: i,
                            goalIdx: j
                        }))
                        elements.push(...ms)
                    }
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
        else if (type === "milestone") {
            const ms = viewElem as _Milestone
            elem = getElemById(`milestone--${ms.goalIdx}-${ms.idx}`)
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
        if (isEditTextElem(ke.target as HTMLElement)) return
        
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
        else if (input === "enter" && type === "milestone") {
            const milestone = viewElem as _Milestone
            const { secIdx, goalIdx, idx } = milestone
            
            this.toggleMilestoneComplete(secIdx, goalIdx, idx)
        }
        else if (type === "goal") {
            const goal = viewElem as _Goal
            const goalItem = this.sortedGoals[goal.secIdx][goal.idx]
            const newStatus = goalItem.status === "accomplished" ? "in-progress" : "accomplished"

            if (input === "enter") {
                this.setGoalStatus(goalItem, newStatus)
            }
            else if (input === "delete") {
                this.removeGoal(goalItem)
            }
        }
    }

    getNewStateObj(oldState: GoalsViewState, newState: Partial<GoalsViewState>): GoalsViewState {
        const newStateObj = oldState

        if (newState.sortedGoals !== undefined) newStateObj.sortedGoals = newState.sortedGoals
        if (newState.sections !== undefined) newStateObj.sections = newState.sections
        if (newState.closedSections !== undefined) newStateObj.closedSections = newState.closedSections
        if (newState.openGoalId !== undefined) newStateObj.openGoalId = newState.openGoalId
        if (newState.dragTarget !== undefined) newStateObj.dragTarget = newState.dragTarget
        if (newState.pinnedGoal !== undefined) newStateObj.pinnedGoal = newState.pinnedGoal
        if (newState.dragState !== undefined) newStateObj.dragState = newState.dragState
        if (newState.editGoal !== undefined) newStateObj.editGoal = newState.editGoal
        if (newState.contextMenuPos !== undefined) newStateObj.contextMenuPos = newState.contextMenuPos
        if (newState.contextMenuOpen !== undefined) newStateObj.contextMenuOpen = newState.contextMenuOpen
        if (newState.statusOpen !== undefined) newStateObj.statusOpen = newState.statusOpen
        if (newState.statusMenuPos !== undefined) newStateObj.statusMenuPos = newState.statusMenuPos

        return newStateObj
    }
}