import { writable, type Writable, get } from "svelte/store"
import { RoutinesManager } from "./routines-manager"
import { getElemById, getDistBetweenTwoPoints, initFloatElemPos, isTargetTextEditor, getElemNumStyle, findAncestor } from "./utils-general"
import { ViewOption, EMPTY_CORES, ROUTINE_BLOCKS_CONTAINER_ID } from "./utils-routines"

/**
 * Object for managing for the funcitonality and state of weely routines page.
 */
export class WeeklyRoutinesManager extends RoutinesManager {
    currViewOption = writable(ViewOption.Weekly)
    chosenRoutine: WeeklyRoutine | null = null

    // current routine in view
    weekRoutine:      Writable<WeeklyRoutine | null> = writable(null)
    weekRoutineElems: Writable<WeekBlockElems | null> = writable(null)
    dayBreakdown:     Writable<DayBreakdown| null> = writable(null)

    editDayKey: keyof WeeklyRoutineBlocks | null = null
    editDayKeyStore: Writable<keyof WeeklyRoutineBlocks | null> = writable(null)

    editDayIdx = -1
    editOffsetIdx = -1
    dayColXOffset = 0
    weekCores = structuredClone(EMPTY_CORES)

    DAYS_WEEK = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ]
    daysInView = this.DAYS_WEEK

    /**
     * @param weekRoutine   User's currently chosen routine which should be in view
     */
    constructor(weekRoutine?: WeeklyRoutine) {
        super()

        if (weekRoutine) {
            this.updateCurrentWeekRoutine(weekRoutine, false)
        }
    }

    /**
     * Updates current weekly routine in view.
     * 
     * @param  weekRoutine     Set the current routine in view to this
     * @param  doPrcessBlocks  Should create the routine elements of the set weekly routine.
     */
    updateCurrentWeekRoutine(weekRoutine: WeeklyRoutine | null, doProcessBlocks = true) {
        this.chosenRoutine = weekRoutine
        
        this.weekRoutine.set(weekRoutine)
        this.weekRoutineElems.set({ 
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] 
        })
        
        if (!weekRoutine) {
            this.dayBreakdown.set(null)
            this.resetEditState()
        }
        if (weekRoutine && doProcessBlocks) {
            this.processWeeklyRoutine()
        }
    }

    /**
     * Processes weekly routine by extracting breakdown data and rendering routine element blocks the currently set week routine.
     * 
     * @param onlyBreakdownData  Process breakdown data only. 
     *                           Used when an edit has been made and breakdown data needs to be recalculated.
     * 
     */
    processWeeklyRoutine() {
        const routineElems = get(this.weekRoutineElems)!

        // analytics
        const weekCores = structuredClone(EMPTY_CORES)
        const weekTagData: RoutineTags[] = []
        
        let i = 0
        let doIgnoreSleepAwake = false
        
        for (let day of this.DAYS_WEEK) {
            const dayKey     = day as keyof WeeklyRoutineBlocks
            const dayRoutine = get(this.weekRoutine)!.blocks[dayKey]
            const rawBlocks  = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine

            const { coreBreakdown, earliestBlock, blockElems, tagBreakdown } = this.processRoutineBlocks(rawBlocks)
            
            if (coreBreakdown.awake.totalTime < 0) {
                doIgnoreSleepAwake = coreBreakdown.awake.totalTime < 0
            }

            // create block elements array + set up ids
            routineElems[dayKey]!.push(
                ...blockElems.map((blockElem: RoutineBlockElem, idx: number) => ({
                    ...blockElem, xOffset: 0, id: `${i}--${idx}`,
                }))
            )
            this.earliestBlockHeadPos = Math.min(earliestBlock, this.earliestBlockHeadPos)

            // tally up the stats
            this.tallyWeeklyCores(coreBreakdown, weekCores, doIgnoreSleepAwake)
            this.tallyWeekTagData(tagBreakdown, weekTagData)
            i++
        }
        
        this.weekCores = this.getWeekCoreAvgs(weekCores)

        this.coreBreakdown.set(weekCores)
        this.tagBreakdown.set(weekTagData.sort((a, b) => b.data.totalTime - a.data.totalTime))
        this.weekRoutineElems.set(routineElems)
    }

    /* Week Routine Detail Edits */

    /**
     * Updates a selected daily routine's title
     * @param name 
     */
    updateTitle = (name: string) => {
        this.weekRoutine.update((routine) => ({ ...routine!, name }))
    }
    
    updateDescription = (description: string) => {
        this.weekRoutine.update((routine) => ({ ...routine!, description }))
    }

    /* Breakdown Data */

    /**
     * Update weekly tag data given new daily tag data that was just procesed.
     * 
     * @param dayTagData   - Total tag breakdown data for a given day.
     * @param weekTagData  - Total weekly tag breakdown data so far.
     */
    tallyWeekTagData(dayTagData: RoutineTags[], weekTagData: RoutineTags[]) {
        for (const tagBreakdown of dayTagData) {
            const tagIdx = weekTagData.findIndex(_tagBreakdown => _tagBreakdown.tag.name === tagBreakdown.tag.name)
    
            // If the tag doesn't exist in the weekly total data, add it
            if (tagIdx === -1) {
                tagBreakdown.data.avgTime = Math.floor(tagBreakdown.data.totalTime / 7)
                weekTagData.push(tagBreakdown)
            } 
            else {
                const prevTag = weekTagData[tagIdx]
                prevTag.data.totalTime += tagBreakdown.data.totalTime
                prevTag.data.total     += tagBreakdown.data.total
                prevTag.data.avgTime    = Math.floor(prevTag.data.totalTime / 7)

                weekTagData[tagIdx] = prevTag
            }
        }
    }

    /**
     * Update weekly core data given new daily core data that was just procesed.
     * 
     * @param dayTagData          - Day tag dataTotal core breakdown data for a given day.
     * @param weekTagData         - Total weekly core breakdown data so far.
     * @param doIgnoreSleepAwake  - If sleep or awake core data should be ignored. 
     *                              All days must have, awake and sleeping core data
     */
    tallyWeeklyCores(dayCores: RoutineCores, weekCores: RoutineCores, doIgnoreSleepAwake: boolean) {
        for (const key in weekCores) {
            const _key = key as keyof typeof weekCores
            const isActivityCore = key != "sleeping" && key != "awake"

            weekCores[_key].totalTime += dayCores[_key].totalTime

            if (isActivityCore) {
                weekCores[_key].total += dayCores[_key].total
            }

            // is sleep or awake core
            if (!isActivityCore && doIgnoreSleepAwake) {
                weekCores[_key].totalTime = -1
                weekCores[_key].total = -1
                weekCores[_key].avgTime = -1
            }
        }
    }

    /**
     * Get the averages of each core category after they have been processed.
     * @param weekCores   - Week core data to be averaged.
     * @returns           -  Updated week cores with the proper averages set.
     */
    getWeekCoreAvgs(weekCores: RoutineCores) {
        for (const key in weekCores) {
            const core = weekCores[key as keyof typeof weekCores]

            // if there is at least one core activity
            if (core.totalTime >= 0) {
                core.avgTime = Math.floor(core.totalTime / this.daysInView.length)
            }
        }
        return weekCores
    }

    /**
     * Initialize a day routine's tag and core breakdown
     * @param dayIdx   Idx of day (0 -> Monday)
     */
    initDayRoutineBreakdown(dayIdx: number | null) {
        if (dayIdx === null) {
            this.dayBreakdown.set(null)
            this.resetEditState()
            return 
        }

        // init breakdown data
        const _dayKey    = this.DAYS_WEEK[dayIdx]
        const dayKey     = _dayKey as keyof WeeklyRoutineBlocks
        const dayRoutine = get(this.weekRoutine)!.blocks[dayKey]
        const isLinked   = "id" in dayRoutine
        const blocks     = isLinked ? dayRoutine.blocks : dayRoutine
        
        const linkedRoutine = isLinked ? {
            name: dayRoutine.name,
            description: dayRoutine.description,
        } : null
        
        this.dayBreakdown.set({
            cores: this.getBlockCoreBreakdown(blocks),
            tags: this.getBlockTagBreakdown(blocks),
            day: dayKey,
            dayIdx,
            linkedRoutine,
            blocksLength: blocks.length
        })

        // init edit data
        this.editDayIdx = dayIdx
        this.editDayKey = dayKey

        this.initDayEditFromContext()
    }

    /**
     * Update the breakdown data after an edit was made on the week routine.
     */
    updateBreakdownData() {
        const weekCores = structuredClone(EMPTY_CORES)
        const weekTagData: RoutineTags[] = []

        for (let day of this.DAYS_WEEK) {
            const dayKey     = day as keyof WeeklyRoutineBlocks
            const dayRoutine = get(this.weekRoutine)!.blocks[dayKey]
            const rawBlocks  = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine

            const cores = this.getBlockCoreBreakdown(rawBlocks)
            const tagBreakdown = this.getBlockTagBreakdown(rawBlocks)
            const doIgnoreSleepAwake = cores.awake.totalTime < 0

            // tally up the stats
            this.tallyWeeklyCores(cores, weekCores, doIgnoreSleepAwake)
            this.tallyWeekTagData(tagBreakdown, weekTagData)
        }

        this.weekCores = this.getWeekCoreAvgs(weekCores)
        this.coreBreakdown.set(weekCores)
        this.tagBreakdown.set(weekTagData.sort((a, b) => b.data.totalTime - a.data.totalTime))
    }

    /* Week Routine Updates */

    /**
     * Applies updates to the processed routine block elements for the specified day. 
     * Also updates days that have the same linked daily routines if appropriate.
     * 
     * @param data - The data containing the new routine elements and the key of the day to be edited.
     * @param data.newRoutineElems - The new routine elements to be incorporated into the day.
     * @param data.editDayKey      - The key of the day to be edited.
     * @param data.updateLinked    - Optional flag to indicate whether to update other daily routines that share the same routine
     * @param data.updateIdices    - Do update 
     */
    applyRoutineElemsUpdates(data: {
        newRoutineElems: RoutineBlockElem[], 
        editDayKey: keyof WeekBlockElems, 
        updateIdices?: boolean
        updateLinked?: boolean
    }) {
        const { newRoutineElems, editDayKey, updateIdices = true, updateLinked = true } = data

        const weekRoutine = get(this.weekRoutine)!
        const weekRoutineElems = get(this.weekRoutineElems)!
        const isSetRoutine = "id" in weekRoutine.blocks[editDayKey]

        // if not a set day routine then just update that day
        if (!isSetRoutine) {
            weekRoutineElems[editDayKey] = newRoutineElems
            this.weekRoutineElems.set(weekRoutineElems)
            return
        }

        let dayIdx = 0

        // if a daily routine, must update every other day that has that same routine
        for (let day of this.DAYS_WEEK) {
            const dayKey = day as keyof WeeklyRoutineBlocks
            const doUpdate = updateLinked ? this.hasSameLinkedRoutine({
                weekRoutine, srcKey: editDayKey, queryKey: dayKey
            }) : dayKey === editDayKey

            if (doUpdate && updateIdices) {
                weekRoutineElems[dayKey] = newRoutineElems.map((routine, idx) => ({
                    ...routine, id: `${dayIdx}--${idx}`
                }))
            }
            else if (doUpdate) {
                weekRoutineElems[dayKey] = newRoutineElems
            }
            dayIdx++
        }

        this.weekRoutineElems.set(weekRoutineElems)
    }

    /**
     * Applies updates to the raw routine block elements for the specified day and its linked days in a weekly routine.
     * 
     * @param data - The data containing the new routine elements and the key of the day to be edited.
     * @param data.newRoutineElems - The new routine elements to be incorporated into the day.
     * @param data.editDayKey      - The key of the day to be edited.
     * @param data.updateLinked    - Optional flag to indicate whether to update other daily routines that share the same routine
     */
    applyRoutineUpdates(data: {
        newRoutineElems: DailyRoutine | RoutineBlock[], 
        editDayKey: keyof WeekBlockElems,
        updateLinked?: boolean
    }) {
        const { newRoutineElems, editDayKey, updateLinked = true } = data
        const weekRoutine = get(this.weekRoutine)!
        const isSetRoutine = "id" in weekRoutine.blocks[editDayKey]

        // if not a set day routine then just update that day
        if (!isSetRoutine) {
            weekRoutine.blocks[editDayKey] = newRoutineElems
            this.weekRoutine.set(weekRoutine)
            return
        }

        // if a daily routine, must update every other day that has that same routine
        for (let day of this.DAYS_WEEK) {
            const dayKey = day as keyof WeeklyRoutineBlocks
            const doUpdate = updateLinked ? this.hasSameLinkedRoutine({
                weekRoutine, srcKey: editDayKey, queryKey: dayKey
            }) : dayKey === editDayKey
            
            if (doUpdate && "id" in newRoutineElems) {
                (weekRoutine.blocks[dayKey] as DailyRoutine) = newRoutineElems as DailyRoutine
            }
            else if (doUpdate) {
                (weekRoutine.blocks[dayKey] as DailyRoutine).blocks = newRoutineElems as RoutineBlock[]
            }
        }

        this.weekRoutine.set(weekRoutine)
    }

    /**
     * Update the routine after a lift edit was made
     * @param editBlockElem  Block element that was being lifted.
     */
    updateRoutineFromLift(editBlockElem: RoutineBlockElem) {
        // update elems
        const weekElems        = get(this.weekRoutineElems)!
        const weekRoutine      = get(this.weekRoutine)!
        const oldRoutineIdx    = +editBlockElem.id.split("--")[0]
        const oldRoutineDayKey = this.DAYS_WEEK[oldRoutineIdx] as keyof WeekBlockElems
        const isSameDay        = this.editDayKey! === oldRoutineDayKey
        
        // remove lifted block from old day routine
        let _oldRoutine = weekElems[oldRoutineDayKey].filter((block) => (block.id != editBlockElem.id))
        let oldRoutine  = _oldRoutine

        if (!isSameDay) {
            oldRoutine = isSameDay ? oldRoutine : oldRoutine.map((block, idx) => ({ ...block, id: `${oldRoutineIdx}--${idx}`}))
        }
        
        // add to destination day routine
        let newDayRoutine = []

        newDayRoutine = isSameDay ? oldRoutine : weekElems[this.editDayKey!]
        newDayRoutine = [...newDayRoutine, { 
            ...editBlockElem, orderContext: isSameDay ? editBlockElem.orderContext : null 
        }]
        newDayRoutine = newDayRoutine.sort((a, b) => a.startTime - b.startTime)
        newDayRoutine = newDayRoutine.map((block, idx) => ({ ...block, id: `${this.editDayIdx}--${idx}`}))

        let newRoutineDayKey = this.editDayKey! as keyof WeeklyRoutineBlocks

        // if old day and new day both have the same linked routine, then treat as if user just moved the block within the same day
        if (!isSameDay && this.hasSameLinkedRoutine({
            weekRoutine, srcKey: oldRoutineDayKey, queryKey: newRoutineDayKey
        })) {

            oldRoutine = [..._oldRoutine, { ...editBlockElem }]
            newDayRoutine = oldRoutine

            newRoutineDayKey = oldRoutineDayKey
        }

        const rawNewDayRoutine = newDayRoutine.map((block) => {
            const { id, height, xOffset, yOffset, ...rest } = block
            return rest
        })
        const rawOldDayRoutine = oldRoutine.map((block) => {
            const { id, height, xOffset, yOffset, ...rest } = block
            return rest
        })

        // update the display weekly routine elements
        this.applyRoutineElemsUpdates({ 
            newRoutineElems: oldRoutine, 
            editDayKey: oldRoutineDayKey, 
        })
        this.applyRoutineElemsUpdates({ 
            newRoutineElems: newDayRoutine, 
            editDayKey: newRoutineDayKey,
        })

        // update the raw weekly routine
        this.applyRoutineUpdates({ 
            newRoutineElems: rawOldDayRoutine, 
            editDayKey: oldRoutineDayKey, 
        })
        this.applyRoutineUpdates({ 
            newRoutineElems: rawNewDayRoutine, 
            editDayKey: newRoutineDayKey
        })

        this.updateBreakdownData()
    }

    /**
     * Update the week routine after an update was made on a single day routine itself.
     * Also updates the breakdown data to reflect changesl
     */
    updateSingleDayEdit(context: "unlinked" | "cleared" | "linked" | "edited" = "edited") {
        const updatedDayRoutine = get(this.editDayRoutine)
        const updatedDayRoutineElems = get(this.editDayRoutineElems)
        const weekRoutine = get(this.weekRoutine)

        if (!updatedDayRoutine || !updatedDayRoutineElems) return

        // upate the block elems
        this.applyRoutineElemsUpdates({ 
            newRoutineElems: updatedDayRoutineElems, 
            editDayKey: this.editDayKey!,
            updateLinked: context === "edited"
        })

        // update the raw blocks
        const editDayKey = this.editDayKey! as keyof WeeklyRoutineBlocks
        const dayBlocks = weekRoutine!.blocks
        const blocks = "id" in updatedDayRoutine ? updatedDayRoutine.blocks : updatedDayRoutine
        let dayRoutine: DailyRoutine | RoutineBlock[] = []

        if (context === "cleared") {
            dayRoutine = []
        }
        else if (context === "unlinked") {
            dayRoutine = blocks
        }
        else if (context === "linked") {
            dayRoutine = updatedDayRoutine
        }
        else if (context === "edited") {
            dayRoutine = updatedDayRoutine
        }
        else if ("id" in dayBlocks[editDayKey]) {
            dayRoutine = blocks
        }

        this.applyRoutineUpdates({ 
            newRoutineElems: dayRoutine, 
            editDayKey,
            updateLinked: context === "edited"
        })

        this.updateBreakdownData()
    }

    /* Edit Handlers */

    /**
     * 
     * Initialize the day routine being edited by a user from interation with a block element.
     * @param leftOffset  The positioning of the cursor at the time of interaction
     */
    initEditDayContextFromLeftOffset(leftOffset: number) {
        const containerWidth = this.blocksContainerRef!.clientWidth
        const colWidth = containerWidth / this.daysInView.length

        const leftPos = leftOffset

        this.editDayIdx = Math.floor(leftPos / colWidth)
        this.initEditDayContextFromIdx(this.editDayIdx)
    }

    /**
     * 
     * Initialize the day routine being edited through the day index.
     * @param dayIdx  Index of the day
     */
    initEditDayContextFromIdx(dayIdx: number) {
        const viewOpt = get(this.currViewOption)
        const containerWidth = this.blocksContainerRef!.clientWidth
        const colWidth = containerWidth / this.daysInView.length

        this.editDayIdx = dayIdx

        if (viewOpt === ViewOption.Today) {
            const todayIdx = (new Date().getDay() + 6) % 7

            this.editDayIdx = todayIdx
            this.editDayKey = this.getDayKeyFromIdx(todayIdx)
            this.editOffsetIdx = 0
            this.dayColXOffset = 0
        }
        else {
            this.editOffsetIdx = this.editDayIdx
            this.editDayIdx += viewOpt === ViewOption.FSS ? 4 : 0
            this.editDayKey  = this.getDayKeyFromIdx(this.editDayIdx)

            this.dayColXOffset = (colWidth * this.editOffsetIdx)
        }
    }

    /**
     * Afte getting the day key of the day column to be edit, set that column as the day being edited / focused on.
     */
    initDayEditFromContext() {
        const editDayRoutine      = get(this.weekRoutine)!.blocks[this.editDayKey!]
        const editDayRoutineElems = get(this.weekRoutineElems)![this.editDayKey!]

        this.editDayRoutine.set(editDayRoutine)
        this.editDayRoutineElems.set(editDayRoutineElems)
    }

    /* Block / Blocks Container Event Handlers */

    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.initEditDayContextFromLeftOffset(this.cursorPos.left)
        this.initDayEditFromContext()

        this.blockOnPointerDown = this.getWeekBlockFromId(id)!
        
        const { isOnTopEdge, isOnBottomEdge } = this.isBlockPointerDownOnEdge(e)
        this.editingBlockRef = this.getDOMBlockElem(id)
        this.editingBlock.set({ 
            ...this.blockOnPointerDown, 
            xOffset: this.dayColXOffset,
            isDragging: true
        })

        // do a strech or lift edit
        if (isOnTopEdge || isOnBottomEdge) {
            this.isDragLiftFromHead = isOnTopEdge
            this.allowStrechEdit = true

            // init directly as there is no drag distance threshold
            this.initDragStretchEdit(this.blockOnPointerDown! , true)
    
            requestAnimationFrame(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
            })
    
            this.containerElem!.addEventListener("pointermove", this.onBlockStretchMove)
            this.containerElem!.addEventListener("pointerup", this.onBlockStretchEditEnd)
        }
        else {
            this.dragStartPoint = this.cursorPos

            requestAnimationFrame(() => {
                const floatingBlock = getElemById("edit-block")
                floatingBlock?.setPointerCapture(e.pointerId)
            })

            this.containerElem!.addEventListener("pointermove", this.onLiftBlockPointerMove)
            this.containerElem!.addEventListener("pointerup", this.onLiftBlockPointerUp)
        }
    }

    /**
     * Handler for when the mouse moves after user clicks on a lift move area.
     * For lift edits (block lit & duplicate block lift).
     * 
     * @param event 
     */
    onLiftBlockPointerMove = (e: PointerEvent) => {
        e.preventDefault()

        // only allow the edit if the user has moved he cursor far enough
        if (!this.allowLiftEdit) { 
            const dragDistance = getDistBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance > this.STRETCH__DRAG_DISTANCE_THRESHOLD) {
                this.intDragLiftMoveEdit(this.blockOnPointerDown!)
                this.allowLiftEdit = true
            }
        }
        if (!this.allowLiftEdit) return

        const prevDay = this.editDayKey

        // when mouse moves, know in which day column the cursor is currently at
        this.initEditDayContextFromLeftOffset(this.cursorPos.left)

        // if a new day and init the new col
        if (prevDay != this.editDayKey) {
            this.initDayEditFromContext()
        }

        // safeProps will be null if there was no space in current day col the cursos is in
        const { safeProps, xOffset, yOffset } = this.getLiftBlockPosition()

        if (safeProps) {
            this.editingBlock.update((block) => ({ 
                ...block!, ...safeProps, 
                xOffset, yOffset, isDragging: true,
                dropArea: {
                    top: safeProps.yOffset, left: xOffset, doShow: true,
                    offsetIdx: this.editOffsetIdx
                }
            }))
        }
        else {
            this.editingBlock.update((block) => ({ ...block!, xOffset, yOffset })) 
        }
    }

    onLiftBlockPointerUp = () => {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval)
            this.scrollInterval = null
        }

        if (this.allowLiftEdit) {
            // extract needed props
            const dropAreaBlock = get(this.editingBlock)!
            const { endTime, startTime, dropArea } = dropAreaBlock
    
            const editedBlockELem = { 
                ...dropAreaBlock, startTime, endTime,
                yOffset: dropArea!.top, xOffset: dropArea!.left,
            }

            // current set editDayIdx might not be the same as drop area
            // occurs when destination day col has no space for drop area block
            // so the drop area col idx will not be updated for the column, it will keep old
            // while the edot block always updates no matter what

            this.initEditDayContextFromIdx(dropArea!.offsetIdx)
            this.updateRoutineFromLift(editedBlockELem)

            this.resetEditState()
        }
        else {
            this.editContext.set("details")
        }

        this.removeLiftEventListeners()
    }

    /* Scroll Container Event Handlers */

    onScrollContainerPointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement
        if (target.id != ROUTINE_BLOCKS_CONTAINER_ID || e.button === 2) {
            return
        }

        this.initEditDayContextFromLeftOffset(this.cursorPos.left)
        this.initDayEditFromContext()

        this.stretchPivotPointTopOffset = this.getDragPivotPointTopOffset(0, this.cursorPos.top, false)
        this.dragStartPoint      = this.cursorPos

        // doesn't use handler directly as drag distance must surpass the drag distance threshold
        this.containerElem!.addEventListener("pointermove", this.onScrollContainerPointerMove)
        this.containerElem!.addEventListener("pointerup", this.onBlockStretchEditEnd)
    }

    onScrollContainerPointerMove = (e: PointerEvent) => {
        if (!this.allowStrechEdit) {
            if (!this.isDragWithinStretchThreshold()) return
            
            // attempt to make a valid block
            const editBlock = this.createBlockFromStretchEdit()
            if (!editBlock) return
            
            const blocks = get(this.editDayRoutineElems)!
            editBlock.id = `${this.editDayIdx}--${blocks.length}`
            editBlock.xOffset = this.dayColXOffset
            
            this.initDragStretchEdit(editBlock, false)
            this.allowStrechEdit = true
            this.editingBlock.set(editBlock)

            requestAnimationFrame(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
            })
        }
        if (this.allowStrechEdit) {
            this.onBlockStretchMove(e)
        }
    }

    /* Stretch Edit */

    onBlockStretchEditEnd = () => {
        this.removeStretchEventListeners()
        if (!this.allowStrechEdit) return

        super.onBlockStretchEditEnd()
        this.updateSingleDayEdit()
        this.updateBreakdownData()
        
        this.resetEditState()
    }

    removeStretchEventListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onScrollContainerPointerMove)
        this.containerElem!.removeEventListener("pointermove", this.onBlockStretchMove)
        this.containerElem!.removeEventListener("pointerup", this.onBlockStretchEditEnd)
    }

    /* Lift Edits */

    removeLiftEventListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onLiftBlockPointerMove)
        this.containerElem!.removeEventListener("pointerup", this.onLiftBlockPointerUp)
    }

    /* Context Menu */

    onBlockContextMenu(id: string) {
        this.initEditDayContextFromLeftOffset(this.cursorPos.left)
        this.initDayEditFromContext()

        const editBlock = this.getWeekBlockFromId(id)!
        this.editingBlock.set({ ...editBlock, xOffset: this.dayColXOffset, isDragging: true })

        this.openContextMenu()
    }

    openContextMenu() {
        const containerWidth = this.containerElem!.clientWidth
        const containerHeight = this.containerElem!.clientHeight
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: this.cursorPos.left
        }

        const { top, left } = initFloatElemPos({
            dims: { height: 135, width: 150 }, 
            cursorPos, 
            containerDims: { height: containerHeight, width: containerWidth }
        })

        this.contextMenuPos.set({ left, top: top + scrollTop })
    }

    getColorPickerPos() {
        const containerWidth = this.containerElem!.clientWidth 
        const containerHeight = this.containerElem!.clientHeight
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: Math.max(this.cursorPos.left - 10, 0)
        }

        const { top, left } = initFloatElemPos({
            dims: { height: 165, width: 190 }, 
            cursorPos, 
            containerDims: { height: containerHeight, width: containerWidth }
        })

        return { left, top: top + scrollTop }
    }

    /* Duplicate Edit */

    onDupBlockPointerUp = () => {
        this.editingBlock.update((block) => { 
            const yOffset = block!.dropArea?.top ?? block!.yOffset
            
            return { 
                ...block!, isDragging: false, yOffset, 
                dropArea: { ...block!.dropArea!, doShow: false }  
            }
        })
        this.removeDupEventListeners()
    }

    onDupBlockPointerDown = (e: PointerEvent) => {
        if (e.button === 2) return

        const target = e.target as HTMLElement
        const editBlock  = get(this.editingBlock)!

        const didClickOnButton = findAncestor({
            child: target, queryBy: "class", strict: false, queryStr: "block-buttons"
        })

        if (didClickOnButton) return

        this.editingBlockRef!.setPointerCapture(e.pointerId)
        this.editingBlockRef!.style.cursor = "grabbing"

        const editBlockLeftOffset =  getElemNumStyle(this.editingBlockRef!, "left")
        
        this.initDragLiftOffsets = {
            top: this.cursorPos.top   - editBlock.yOffset,
            left: this.cursorPos.left - editBlockLeftOffset
        }

        this.editingBlockRef!.addEventListener("pointermove", this.onLiftBlockPointerMove)
        this.editingBlockRef!.addEventListener("pointerup", this.onDupBlockPointerUp)
    }

    removeDupEventListeners() {
        this.editingBlockRef!.removeEventListener("pointermove", this.onLiftBlockPointerMove)
        this.editingBlockRef!.removeEventListener("pointerup", this.onDupBlockPointerUp)
    }

    /**
     * On duplicated block option pressed on a block's context menu.
     * Initializes edit block, daily routine, and "duplicate" edit state.
     */
    onDuplicateBlock() {
        const editBlock    = get(this.editingBlock)!
        const dupBlockRef  = this.getDOMBlockElem(editBlock.id)!
        const dupBlockElem = this.getWeekBlockFromId(editBlock.id)!
        const dayIdx = +dupBlockElem.id.split("--")[0]
        
        this.initEditDayContextFromIdx(dayIdx)
        this.initDayEditFromContext()
        
        const containerWidth = this.blocksContainerRef!.clientWidth
        const containerHeight = this.blocksContainerRef!.clientHeight

        const { top, left } = initFloatElemPos({
            cursorPos: {
                left: editBlock.xOffset + 5,
                top: editBlock.yOffset + 5
            }, 
            dims: { 
                height: dupBlockRef.clientHeight, width: dupBlockRef.clientWidth 
            }, 
            containerDims: { height: containerHeight, width: containerWidth }
        })

        this.allowLiftEdit = true
        this.editingBlockInitStartTime = editBlock.startTime
        this.editingBlockTotalTime     = editBlock.endTime - editBlock.startTime
        this.editContext.set("duplicate")

        this.editingBlock.set({ 
            ...dupBlockElem, yOffset: top, xOffset: left, isDragging: false, dropArea: {
                top: 0, left: 0, offsetIdx: -1, doShow: false
            }
        })

        requestAnimationFrame(() => {
            this.editingBlockRef = getElemById("edit-block")!
            this.editingBlockRef!.addEventListener("pointerdown", this.onDupBlockPointerDown)
        })
    }

    confirmDuplicate() {
        const editBlock = get(this.editingBlock)!
        const dayIdx = editBlock!.dropArea!.offsetIdx
        editBlock.id = `${dayIdx}--${0}`

        this.updateRoutineAfterBlockUpdate(editBlock, "duplicate")
        this.updateSingleDayEdit()

        this.closeDuplicateEdit()
    }

    closeDuplicateEdit() {
        this.removeDupEventListeners()
        this.editingBlockRef!.removeEventListener("pointerdown", this.onDupBlockPointerDown)

        this.resetEditState()
    }

    /* Edits */

    setEditBlockColor(color: Color | null) {
        if (!color) return 

        super.setEditBlockColor(color)
        this.updateSingleDayEdit()
    }

    deleteEditBlock() {
        super.deleteEditBlock()
        this.updateSingleDayEdit()
    }

    onConcludeModalEdit(updatedBlock: RoutineBlockElem | null) {
        super.onConcludeModalEdit(updatedBlock)
        this.updateSingleDayEdit()
    }

    resetEditState() {
        this.editDayRoutine.set(null)
        this.editDayRoutineElems.set(null)

        this.editingBlock.set(null)
        this.editContext.set(null)

        this.editingBlockTotalTime     = -1
        this.editingBlockInitStartTime = -1

        this.editingBlockRef = null
        this.dragStartPoint = { left: -1, top: -1 }
        this.initDragLiftOffsets = { left: -1, top: -1 }
        this.allowLiftEdit = false
        this.editTargetElem = null
        this.initDragLiftOffsets = { top: -1, left: -1 }

        this.editDayKey = null
        this.dayColXOffset = 0
        this.editDayIdx = -1

    }

    /* Week Routine Handlers */

    /**
     * Checks if two given daily routines of a weekly routine have the same linked daily routine.
     * 
     * @param context - The context for checking linked routines.
     * @param context.weekRoutine - The weekly routine containing the daily routines.
     * @param context.srcKey - The key of the source daily routine.
     * @param context.queryKey - The key of the query daily routine.
     * 
     * @returns   Returns true if the two daily routines have the same linked routine, otherwise false.
     */
    hasSameLinkedRoutine(context: { 
        weekRoutine: WeeklyRoutine,
        srcKey: keyof WeekBlockElems,
        queryKey: keyof WeekBlockElems
    }) {
        const { weekRoutine, queryKey, srcKey } = context

        const srcDay   = weekRoutine.blocks[srcKey]
        const queryDay = weekRoutine.blocks[queryKey]

        if (!("id" in srcDay) || !("id" in queryDay)) return false

        return srcDay.id === queryDay.id || srcDay.name === queryDay.name
    }

    /**
     * Find a week routine block using an id
     * 
     * @param id  Id of block
     * @returns   Block
     */
    getWeekBlockFromId(id: string) {
        const dayIdx = +id.split("--")[0]
        const dayProp = this.getDayKeyFromIdx(dayIdx)

        return get(this.weekRoutineElems)![dayProp].find((block) => block.id === id)
    }

    /**
     * See if a day routine is linked to a daily routine
     * @param   _dayKey  Day key ie "Monday"
     * @returns  
     */
    isDayRoutineLinked(day: string) {
        const dayKey = day as keyof WeeklyRoutineBlocks
        const dayRoutine = get(this.weekRoutine)!.blocks[dayKey]

        return "id" in dayRoutine
    }

    /* Day Specific Edits */

    useTemplateOnDayRoutine(dailyRoutine: RoutineBlockElem[] | DailyRoutine) {
        const rawBlocks = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine

        this.editDayRoutineElems.set(this.processRoutineBlocks(rawBlocks).blockElems)
        this.editDayRoutine.set(rawBlocks)

        this.updateSingleDayEdit()
    }

    clearDayRoutine() {
        this.editDayRoutineElems.set([])
        this.editDayRoutine.set([])

        this.updateSingleDayEdit("cleared")
    }

    linkDayRoutine(dailyRoutine: DailyRoutine) {
        this.editDayRoutineElems.set(this.processRoutineBlocks(dailyRoutine).blockElems)
        this.editDayRoutine.set(dailyRoutine)

        this.updateSingleDayEdit("linked")
    }

    unlinkSetDailyRoutine() {
        const dayIdx = get(this.dayBreakdown)!.dayIdx
        const dayKey = this.getDayKeyFromIdx(dayIdx)
        const weekRoutine = get(this.weekRoutine)!
        const linkedDayRoutine = weekRoutine.blocks[dayKey] as DailyRoutine
        const blocks = linkedDayRoutine.blocks

        this.editDayRoutineElems.set(this.processRoutineBlocks(blocks).blockElems)
        this.editDayRoutine.set(blocks)

        this.updateSingleDayEdit("unlinked")
    }

    /* Misc Handlers */

    /**
     * Update the current view option for week view.
     * @param newOptn   Chosen view option
     */
    updateCurrViewOption(newOptn: ViewOption) {
        const todayIdx = (new Date().getDay() + 6) % 7

        if (newOptn === ViewOption.Today) {
            this.daysInView = [this.DAYS_WEEK[todayIdx]]
        }
        else if (newOptn === ViewOption.MTWT) {
            this.daysInView = this.DAYS_WEEK.slice(0, 4)
        }
        else if (newOptn === ViewOption.FSS) {
            this.daysInView = this.DAYS_WEEK.slice(4, 7)
        }
        else {
            this.daysInView = this.DAYS_WEEK
        }
        this.currViewOption.set(newOptn)
    }

    hotkeyHandler = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement
        const { code } = e

        if (isTargetTextEditor(target)) return

        if (code === "Digit1") {
            this.updateCurrViewOption(ViewOption.Today)
        }
        else if (code === "Digit2") {
            this.updateCurrViewOption(ViewOption.Weekly)
        }
        else if (code === "Digit3") {
            this.updateCurrViewOption(ViewOption.MTWT)
        }
        else if (code === "Digit4") {
            this.updateCurrViewOption(ViewOption.FSS)
        }
    }

    getXOffsetFromDayIdx(dayIdx: number) {
        const _dayIdx = dayIdx >= 0 ? dayIdx : this.editDayIdx
        return `calc(((100% / ${this.daysInView.length}) * ${_dayIdx}))`
    }

    getEditBlockXOffset(editBlock: RoutineEditBlock) {
        const isDragging = editBlock.isDragging
        const isDupEditAndAtRest = get(this.editContext) === "duplicate" && !isDragging

        if (isDupEditAndAtRest) {
            return this.getXOffsetFromDayIdx(editBlock.dropArea?.offsetIdx ?? -1)
        }
        else {
            return `${editBlock.xOffset + 2}px`
        }
    }
    

    getDOMBlockElem(id: string) {
        return getElemById(id) as HTMLElement
    }

    getDayKey(key: string) {
        return key as keyof WeeklyRoutineBlocks
    }

    getDayKeyFromIdx(idx: number) {
        return this.DAYS_WEEK[idx] as keyof WeeklyRoutineBlocks
    }
}