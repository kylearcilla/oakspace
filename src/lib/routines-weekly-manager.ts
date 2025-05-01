import { writable, type Writable, get } from "svelte/store"

import { RoutinesManager } from "./routines-manager"
import { ViewOption, EMPTY_CORES, ROUTINE_BLOCKS_CONTAINER_ID } from "./utils-routines"
import { getElemById, initFloatElemPos, isTargetTextEditor, getElemNumStyle, findAncestor, clamp } from "./utils-general"

export class WeeklyRoutinesManager extends RoutinesManager {
    currViewOption = writable(ViewOption.Weekly)
    chosenRoutine: WeeklyRoutine | null = null

    weekRoutine:      Writable<WeeklyRoutine | null> = writable(null)
    weekRoutineElems: Writable<WeekBlockElems | null> = writable(null)
    dayBreakdown:     Writable<DayBreakdown| null> = writable(null)

    editDayKey:       keyof WeeklyRoutineBlocks | null = null
    editDayKeyStore:  Writable<keyof WeeklyRoutineBlocks | null> = writable(null)

    editDayIdx = -1
    editOffsetIdx = -1
    dayColXOffset = 0
    weekCores = structuredClone(EMPTY_CORES)

    DAYS_WEEK = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ]
    daysInView = this.DAYS_WEEK

    constructor(weekRoutine?: WeeklyRoutine | null) {
        super()
        this.setViewRoutine(weekRoutine ?? null, false)
    }

    setViewRoutine(weekRoutine: WeeklyRoutine | null, doProcessBlocks = true) {
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
     * Extracts breakdown data and renders routine element blocks for routine in view.
     */
    processWeeklyRoutine() {
        if (this.isViewEmpty()) return

        const routineElems = get(this.weekRoutineElems)!
        const weekCores = structuredClone(EMPTY_CORES)
        const weekTagData: RoutineTags[] = []
        
        let i = 0
        let doGetSleepAwake = true
        
        for (let day of this.DAYS_WEEK) {
            const dayKey     = day as keyof WeeklyRoutineBlocks
            const dayRoutine = get(this.weekRoutine)!.blocks[dayKey]
            const rawBlocks  = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine

            const { coreBreakdown, earliestBlock, blockElems, tagBreakdown } = this.processBlocks(rawBlocks)
            doGetSleepAwake &&= this.doGetSleepAwakeData(rawBlocks)

            // create block elements array + set up ids
            routineElems[dayKey]!.push(
                ...blockElems.map((blockElem: RoutineBlockElem, idx: number) => ({
                    ...blockElem, xOffset: 0, id: `${i}--${idx}`,
                }))
            )
            this.earliestBlockTop = Math.min(earliestBlock ?? 0, this.earliestBlockTop)

            // tally up the breakdown data
            this.tallyWeeklyCores({ 
                cores: coreBreakdown, 
                weekCores, 
                doIgnoreSleepAwake: !doGetSleepAwake 
            })
            this.tallyWeekTagData(tagBreakdown, weekTagData)
            i++
        }
        
        this.weekCores = this.getWeekCoreAvgs(weekCores)
        this.coreBreakdown.set(weekCores)
        this.tagBreakdown.set(weekTagData.sort((a, b) => b.data.totalTime - a.data.totalTime))
        this.weekRoutineElems.set(routineElems)
    }

    updateTitle = (name: string) => {
        this.weekRoutine.update((routine) => ({ ...routine!, name }))
    }
    
    updateDescription = (description: string) => {
        this.weekRoutine.update((routine) => ({ ...routine!, description }))
    }

    /* breakdown data */

    /**
     * Update weekly tag data given new daily tag data that was just procesed.
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
     */
    tallyWeeklyCores({ cores, weekCores, doIgnoreSleepAwake }: { 
        cores: RoutineCores,
        weekCores: RoutineCores,
        doIgnoreSleepAwake: boolean
    }) {
        for (const key in weekCores) {
            const _key = key as keyof typeof weekCores
            const sleepAwake = key === "sleeping" || key === "awake"

            weekCores[_key].totalTime += cores[_key].totalTime

            if (!sleepAwake) {
                weekCores[_key].total += cores[_key].total
            }
            // is sleep or awake core
            if (sleepAwake && doIgnoreSleepAwake) {
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

    setDayBreakdown(dayIdx: number | null) {
        const viewOpt = get(this.currViewOption)

        if (dayIdx === null) {
            this.dayBreakdown.set(null)
            this.resetEditState()
            return 
        }

        this.editDayIdx  = dayIdx
        this.editDayIdx += viewOpt === ViewOption.FSS ? 4 : 0

        // init breakdown data
        const _dayKey    = this.DAYS_WEEK[this.editDayIdx]
        const dayKey     = _dayKey as keyof WeeklyRoutineBlocks
        const dayRoutine = get(this.weekRoutine)!.blocks[dayKey]
        const isLinked   = "id" in dayRoutine
        const blocks     = isLinked ? dayRoutine.blocks : dayRoutine
        
        const linkedRoutine = isLinked ? {
            name: dayRoutine.name,
            description: dayRoutine.description,
        } : null
        
        this.dayBreakdown.set({
            cores: this.getRoutineCoreBreakdown(blocks),
            tags: this.getRoutineTagBreakdown(blocks),
            day: dayKey,
            dayIdx,
            linkedRoutine,
            blocksLength: blocks.length
        })
        this.editDayKey  = dayKey
        this.initEditDayRoutines()
    }

    /**
     * Update the breakdown data after an edit was made on the week routine.
     */
    updateBreakdownData() {
        const weekCores = structuredClone(EMPTY_CORES)
        const weekTagData: RoutineTags[] = []

        let doGetSleepAwake = true

        for (let day of this.DAYS_WEEK) {
            const dayKey     = day as keyof WeeklyRoutineBlocks
            const dayRoutine = get(this.weekRoutine)!.blocks[dayKey]
            const rawBlocks  = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine

            const cores = this.getRoutineCoreBreakdown(rawBlocks)
            const tagBreakdown = this.getRoutineTagBreakdown(rawBlocks)
            doGetSleepAwake &&= this.doGetSleepAwakeData(rawBlocks)

            // tally up the stats
            this.tallyWeeklyCores({ 
                cores, weekCores, doIgnoreSleepAwake: !doGetSleepAwake 
            })
            this.tallyWeekTagData(tagBreakdown, weekTagData)
        }

        this.weekCores = this.getWeekCoreAvgs(weekCores)
        this.coreBreakdown.set(weekCores)
        this.tagBreakdown.set(weekTagData.sort((a, b) => b.data.totalTime - a.data.totalTime))
    }

    /* week routine updates */

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
    applyRoutineElemsUpdates({
        newRoutineElems,
        editDayKey,
        updateIdices = true,
        editContext = "edited"
    }: {
        newRoutineElems: RoutineBlockElem[], 
        editDayKey: keyof WeekBlockElems, 
        updateIdices?: boolean,
        editContext?: "unlinked" | "cleared" | "linked" | "edited"
    }) {

        const weekRoutine      = get(this.weekRoutine)!
        const weekRoutineElems = get(this.weekRoutineElems)!
        const updateLinked     = editContext === "edited"
        const isSetRoutine     = "id" in weekRoutine.blocks[editDayKey]

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
            const doUpdate = updateLinked ? this.hasSameLinkedRoutine({ weekRoutine, srcKey: editDayKey, queryKey: dayKey }) : dayKey === editDayKey

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
    applyRoutineUpdates({ newRoutine, editDayKey, editContext = "edited" }: {
        newRoutine: DailyRoutine | RoutineBlock[], 
        editDayKey: keyof WeekBlockElems,
        editContext?: "unlinked" | "cleared" | "linked" | "edited",
    }) {
        const updateLinked = editContext === "edited"
        const weekRoutine  = get(this.weekRoutine)!
        const isSetRoutine = "id" in weekRoutine.blocks[editDayKey]

        // if not a set day routine then just update that day
        if (!isSetRoutine || editContext === "unlinked" || editContext === "cleared") {
            weekRoutine.blocks[editDayKey] = newRoutine
            this.weekRoutine.set(weekRoutine)
            return
        }

        // if a daily routine, must update every other day that has that same routine
        for (let day of this.DAYS_WEEK) {
            const dayKey = day as keyof WeeklyRoutineBlocks
            const doUpdate = updateLinked ? this.hasSameLinkedRoutine({
                weekRoutine, srcKey: editDayKey, queryKey: dayKey
            }) : dayKey === editDayKey
            
            if (doUpdate && "id" in newRoutine) {
                (weekRoutine.blocks[dayKey] as DailyRoutine) = newRoutine as DailyRoutine
            }
            else if (doUpdate) {
                (weekRoutine.blocks[dayKey] as DailyRoutine).blocks = newRoutine as RoutineBlock[]
            }
        }

        this.weekRoutine.set(weekRoutine)
    }

    finishLiftEdit(editBlockElem: RoutineBlockElem) {
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
        newDayRoutine = [...newDayRoutine, {  ...editBlockElem, order: isSameDay ? editBlockElem.order : null }]
        newDayRoutine = newDayRoutine.sort((a, b) => a.startTime - b.startTime)
        newDayRoutine = newDayRoutine.map((block, idx) => ({ ...block, id: `${this.editDayIdx}--${idx}`}))

        let newRoutineDayKey = this.editDayKey! as keyof WeeklyRoutineBlocks

        // if old day and new day both have the same linked routine, then treat as if user just moved the block within the same day
        if (!isSameDay && this.hasSameLinkedRoutine({
            weekRoutine, srcKey: oldRoutineDayKey, queryKey: newRoutineDayKey
        })) {
            oldRoutine = [..._oldRoutine, { ...editBlockElem }].sort((a, b) => a.startTime - b.startTime)
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
            newRoutine: rawOldDayRoutine, 
            editDayKey: oldRoutineDayKey, 
        })
        this.applyRoutineUpdates({ 
            newRoutine: rawNewDayRoutine, 
            editDayKey: newRoutineDayKey
        })

        this.updateBreakdownData()
        this.resetEditState()
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
            editDayKey:      this.editDayKey!,
            editContext:     context
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
            newRoutine: dayRoutine, 
            editDayKey,
            editContext: context
        })

        this.updateBreakdownData()
    }

    /* edit handlers */

    /**
     * Initialize the day column being edited by user as user edits from position of pointer.
     * 
     * @param leftOffset  The positioning of the cursor at the time of interaction
     */
    initEditDayContextFromPointer(leftOffset: number) {
        const containerWidth = this.blocksContainerRef!.clientWidth
        const colWidth = containerWidth / this.daysInView.length

        const leftPos = leftOffset

        let editDayIdx = Math.floor(leftPos / colWidth)
        editDayIdx = clamp(0, editDayIdx, 6)

        this.initEditDayContextFromIdx(editDayIdx)
    }

    /**
     * Initialize the day column being edited by user as user edits from day idx.
     * 
     * @param dayIdx  Index of the day idx being edited.
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
            const maxEditDayIdx       = viewOpt === ViewOption.MTWT ? 3 : 6
            const maxEditOffsetDayIdx = viewOpt === ViewOption.MTWT ? 3 : viewOpt === ViewOption.FSS ? 2 : 6

            this.editOffsetIdx = clamp(0, this.editDayIdx , maxEditOffsetDayIdx)

            this.editDayIdx   += viewOpt === ViewOption.FSS ? 4 : 0
            this.editDayIdx    = clamp(0, this.editDayIdx , maxEditDayIdx)
            this.editDayKey    = this.getDayKeyFromIdx(this.editDayIdx)

            this.dayColXOffset = (colWidth * this.editOffsetIdx)
        }
    }

    /**
     * Afte getting the day key of the day column to be edit, set that column as the day being edited / focused on.
     */
    initEditDayRoutines() {
        const editDayRoutine      = get(this.weekRoutine)!.blocks[this.editDayKey!]
        const editDayRoutineElems = get(this.weekRoutineElems)![this.editDayKey!]

        this.editDayRoutine.set(editDayRoutine)
        this.editDayRoutineElems.set(editDayRoutineElems)
    }

    /* block / blocks container event handlers */

    onBlockClicked(id: string) {
        this.initEditDayContextFromPointer(this.cursorPos.left)
        this.initEditDayRoutines()

        const editBlock = this.getBlockFromId(id)!
        this.editBlock.set({ 
            ...editBlock, xOffset: this.dayColXOffset, isDragging: true 
        })

        this.openEditBlockModal()
    }

    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.initEditDayContextFromPointer(this.cursorPos.left)
        this.initEditDayRoutines()

        this.dragStartPoint = this.cursorPos
        this.blockPointerDown = this.getBlockFromId(id)!
        this.blockPointerDown.xOffset = this.dayColXOffset
        this.blockPointerDownId = id

        const { isOnTopEdge, isOnBottomEdge } = this.isPointerOnBlockEdge(e)

        // do a strech or lift edit
        if (isOnTopEdge || isOnBottomEdge) {
            this.liftFromHead = isOnTopEdge
    
            setTimeout(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
            }, this.POINTER_CAPTURE_TIMEOUT)
    
            this.containerElem!.addEventListener("pointermove", this.onBlockStretchMove)
            this.containerElem!.addEventListener("pointerup", this.onStretchEditEnd)
        }
        else {
            setTimeout(() => {
                const floatingBlock = getElemById("edit-block")
                floatingBlock?.setPointerCapture(e.pointerId)
            }, this.POINTER_CAPTURE_TIMEOUT)

            this.containerElem!.addEventListener("pointermove", this.onLiftPointerMove)
            this.containerElem!.addEventListener("pointerup", this.onLiftPointerUp)
        }
    }

    /* scroll container event handlers */

    onBoardPointerDown = (e: PointerEvent) => {
        const target    = e.target as HTMLElement
        const isDupEdit = get(this.editContext) === "duplicate"
        if (target.id != ROUTINE_BLOCKS_CONTAINER_ID || isDupEdit || e.button === 2) {
            return
        }

        this.initEditDayContextFromPointer(this.cursorPos.left)
        this.initEditDayRoutines()

        this.stretchPivotPointTopOffset = this.cursorPos.top
        this.dragStartPoint = this.cursorPos

        // doesn't use handler directly as drag distance must surpass the drag distance threshold
        this.containerElem!.addEventListener("pointermove", this.onBoardPointerMove)
        this.containerElem!.addEventListener("pointerup", this.onStretchEditEnd)
    }

    onBoardPointerMove = (e: PointerEvent) => {
        if (!this.allowStrechEdit) {
            const threshold = RoutinesManager.NEW_STRETCH_DRAG_DIST_THRESHOLD
            if (!this.isDragStretchValid(threshold)) return

            // attempt to make a valid block
            const editBlock = this.createBlockFromStretch()
            if (!editBlock) return
            
            const blocks = get(this.editDayRoutineElems)!
            editBlock.id = `${this.editDayIdx}--${blocks.length}`
            editBlock.xOffset = this.dayColXOffset
            
            this.initStretchEdit(editBlock, false)
            this.allowStrechEdit = true

            setTimeout(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
                
            }, this.POINTER_CAPTURE_TIMEOUT)
        }
        if (this.allowStrechEdit) {
            this.onBlockStretchMove(e)
        }
    }

    /* stretch edit */

    onStretchEditEnd = () => {
        this.removeStretchListeners()

        if (!this.allowStrechEdit) {
            this.editBlock.set(null)
            return
        }

        const editContext = get(this.editContext)
        super.onStretchEditEnd()

        if (editContext === "old-stretch") {
            this.updateSingleDayEdit()
            this.updateBreakdownData()
            
            this.resetEditState()
        }
    }

    removeStretchListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onBoardPointerMove)
        this.containerElem!.removeEventListener("pointermove", this.onBlockStretchMove)
        this.containerElem!.removeEventListener("pointerup", this.onStretchEditEnd)
    }

    /* lift edits */

    intDragLift(block: RoutineBlockElem) {
        this.editBlockRef = this.getDOMBlockElem(this.blockPointerDownId!)
        const editBlock =  block
        const editBlockLeftOffset =  getElemNumStyle(this.editBlockRef!, "left")

        this.editBlockTotalTime     = editBlock.endTime - editBlock.startTime
        this.editBlockInitStartTime = editBlock.startTime

        this.initDragLiftOffsets = {
            top: this.cursorPos.top   - editBlock.yOffset,
            left: this.cursorPos.left - editBlockLeftOffset
        }
        this.editBlock.set({ 
            ...block, 
            isDragging: true,
            dropArea: {
                top: block.yOffset, 
                left: 0, 
                doShow: true,
                offsetIdx: this.editOffsetIdx
            }
        })
        this.editContext.set("lift")
    }

    /**
     * Handler for when the mouse moves after user clicks on a lift move area.
     * For lift edits (block lit & duplicate block lift).
     * 
     * @param event 
     */
    onLiftPointerMove = (e: PointerEvent) => {
        // only allow the edit if the user has moved he cursor far enough
        if (!this.allowLiftEdit) { 
            const threshold = RoutinesManager.LIFT_DRAG_DIST_THRESHOLD

            if (this.isDragStretchValid(threshold)) {
                this.intDragLift(this.blockPointerDown!)
                this.allowLiftEdit = true
            }
        }
        if (!this.allowLiftEdit) return

        const prevDay = this.editDayKey

        // when mouse moves, know in which day column the cursor is currently at
        this.initEditDayContextFromPointer(this.cursorPos.left)

        // if a new day and init the new col
        if (prevDay != this.editDayKey) {
            this.initEditDayRoutines()
        }

        // see if linked routine
        this.isLiftOnLinkedSibling = this.hasSameLinkedRoutine({
            weekRoutine: get(this.weekRoutine)!,
            srcKey: this.getDayKeyFromIdx(this.getEditOriginDayKey()),
            queryKey: this.editDayKey!
        })

        // safeProps will be null if there was no space in current day col the cursos is in
        const { safeProps, xOffset, yOffset } = this.getLiftBlockPosition()

        if (safeProps) {
            this.editBlock.update((block) => ({ 
                ...block!, 
                ...safeProps, 
                xOffset, 
                yOffset, 
                isDragging: true,
                dropArea: {
                    top: safeProps.yOffset, 
                    left: 0, 
                    doShow: true,
                    offsetIdx: this.editOffsetIdx
                }
            }))
        }
        else {
            this.editBlock.update((block) => ({ ...block!, xOffset, yOffset, isDragging: true })) 
        }
    }

    onLiftPointerUp = () => {        
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval)
            this.scrollInterval = null
        }
        if (this.allowLiftEdit) {
            // extract needed props
            const dropAreaBlock = get(this.editBlock)!
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
            this.finishLiftEdit(editedBlockELem)
            this.resetEditState()
        }
        else {
            this.editContext.set("details")
        }

        this.removeLiftListeners()
    }

    removeLiftListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onLiftPointerMove)
        this.containerElem!.removeEventListener("pointerup", this.onLiftPointerUp)
    }

    /* context menu */

    onBlockContextMenu(id: string) {
        this.initEditDayContextFromPointer(this.cursorPos.left)
        this.initEditDayRoutines()

        const editBlock = this.getBlockFromId(id)!
        this.editBlock.set({ ...editBlock, xOffset: this.dayColXOffset, isDragging: true })

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

    /* duplicate edit */

    onDupBlockPointerUp = (e: PointerEvent) => {
        if (e.button === 2) return
        
        this.editBlock.update((block) => { 
            if (!block) return block

            const dropArea = block.dropArea!
            const yOffset  = dropArea.offsetIdx >= 0 ? dropArea.top : block.yOffset
            
            return { 
                ...block, 
                yOffset, 
                isDragging: false, 
                dropArea: { ...block.dropArea!, doShow: false }  
            }
        })
        this.removeDupEventListeners()
    }

    onDupBlockPointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement
        if (e.button === 2 || target.closest("button")) {
            e.preventDefault()
            return
        }

        const editBlock = get(this.editBlock)!
        const didClickOnButton = findAncestor({
            child: target, queryBy: "class", strict: false, queryStr: "block-buttons"
        })

        if (didClickOnButton) return

        this.editBlockRef!.setPointerCapture(e.pointerId)
        this.editBlockRef!.style.cursor = "grabbing"

        const editBlockLeftOffset = getElemNumStyle(this.editBlockRef!, "left")
        
        this.initDragLiftOffsets = {
            top: this.cursorPos.top - editBlock.yOffset,
            left: this.cursorPos.left - editBlockLeftOffset
        }

        // Add event listeners to the same element that has pointer capture
        this.editBlockRef!.addEventListener("pointermove", this.onLiftPointerMove)
        this.editBlockRef!.addEventListener("pointerup", this.onDupBlockPointerUp)
    }

    removeDupEventListeners() {
        this.editBlockRef!.removeEventListener("pointermove", this.onLiftPointerMove)
        this.editBlockRef!.removeEventListener("pointerup", this.onDupBlockPointerUp)
    }

    /**
     * On duplicated block option pressed on a block's context menu.
     * Initializes edit block, daily routine, and "duplicate" edit state.
     */
    onDuplicateBlock() {
        const editBlock    = get(this.editBlock)!
        const dupBlockRef  = this.getDOMBlockElem(editBlock.id)!
        const dupBlockElem = this.getBlockFromId(editBlock.id)!

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
        this.editBlockInitStartTime = editBlock.startTime
        this.editBlockTotalTime     = editBlock.endTime - editBlock.startTime
        this.editContext.set("duplicate")

        this.editBlock.set({ 
            ...dupBlockElem, yOffset: top, xOffset: left, isDragging: false, 
            dropArea: {
                top: 0, left: 0, offsetIdx: -1, doShow: false
            }
        })

        requestAnimationFrame(() => {
            this.editBlockRef = getElemById("edit-block")!
            this.editBlockRef!.addEventListener("pointerdown", this.onDupBlockPointerDown)
        })
    }

    confirmDuplicate() {
        const editBlock = get(this.editBlock)!
        const view    = get(this.currViewOption)!
        const dayIdx = editBlock!.dropArea!.offsetIdx += (view === ViewOption.FSS ? 4 : 0)
        editBlock.id = `${dayIdx}--${0}`

        this.finishEdit(editBlock, "duplicate")
        this.updateSingleDayEdit()

        this.closeDuplicateEdit()
    }

    closeDuplicateEdit() {
        this.removeDupEventListeners()
        this.editBlockRef!.removeEventListener("pointerdown", this.onDupBlockPointerDown)

        this.resetEditState()
    }

    /* edits */

    setEditBlockColor(color: Color | null) {
        if (!color) return 

        super.setEditBlockColor(color)
        this.updateSingleDayEdit()
    }

    deleteEditBlock() {
        super.deleteEditBlock()
        this.updateSingleDayEdit()
    }

    toggleEditModal(blockId: string) {
        this.initEditDayContextFromIdx(+blockId.split("--")[0])
        this.initEditDayRoutines()

        this.blockPointerDown = this.getBlockFromId(blockId)!
        this.editBlockRef = this.getDOMBlockElem(blockId)
        this.editBlock.set({ 
            ...this.blockPointerDown, 
            xOffset: this.dayColXOffset,
            isDragging: false
        })

        this.editContext.set("details")
    }

    /**
     * Called when user has updated the block after editing it in the edit modal.
     */
    onConcludeModalEdit(updatedBlock: RoutineBlockElem | null) {
        super.onConcludeModalEdit(updatedBlock)
        this.updateSingleDayEdit()
    }

    resetEditState() {
        super.resetEditState()

        this.editDayRoutine.set(null)
        this.editDayRoutineElems.set(null)

        this.editDayKey = null
        this.dayColXOffset = 0
        this.editDayIdx = -1
    }

    /* week routine handlers */

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
    hasSameLinkedRoutine({ weekRoutine, srcKey, queryKey }: { 
        weekRoutine: WeeklyRoutine
        srcKey: keyof WeekBlockElems
        queryKey: keyof WeekBlockElems
    }) {
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
    getBlockFromId(id: string) {
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

    getEditOriginDayKey() {
        return +get(this.editBlock)!.id.split("--")[0]
    }

    /* day specific edits */

    useTemplateOnDayRoutine(dailyRoutine: RoutineBlockElem[] | DailyRoutine) {
        const rawBlocks = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine
        console.log(rawBlocks)
        this.editDayRoutineElems.set(this.processBlocks(rawBlocks).blockElems)
        this.editDayRoutine.set(rawBlocks)

        this.updateSingleDayEdit()
    }

    clearDayRoutine() {
        this.editDayRoutineElems.set([])
        this.editDayRoutine.set([])

        this.updateSingleDayEdit("cleared")
    }

    linkDayRoutine(dailyRoutine: DailyRoutine) {
        const blocks = this.processBlocks(dailyRoutine).blockElems

        this.editDayRoutineElems.set(blocks.map((block, idx) => ({ 
            ...block!, id: `${this.editDayIdx}--${idx}` 
        })))
        this.editDayRoutine.set(dailyRoutine)

        this.updateSingleDayEdit("linked")
    }

    unlinkSetDailyRoutine() {
        const dayRoutine = get(this.editDayRoutine) as DailyRoutine
        const blocks = dayRoutine!.blocks
        const blockElems = this.processBlocks(blocks).blockElems.map((block, idx) => ({
            ...block, id: `${this.editDayIdx}--${idx}`
        }))
        this.editDayRoutine.set(blocks)
        this.editDayRoutineElems.set(blockElems)
        
        this.updateSingleDayEdit("unlinked")
    }

    /* misc */

    isViewEmpty() {
        const routineElems = get(this.weekRoutineElems)!
        const rawRoutine   = get(this.weekRoutine)!

        return !routineElems || !rawRoutine
    }

    /**
     * Update the current view option for week view.
     * @param newOptn   Chosen view option
     */
    updateCurrViewOption(newOptn: ViewOption) {
        const todayIdx = new Date().getDay()

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

    hotkeyHandler = (ke: KeyboardEvent) => {
        const target = ke.target as HTMLElement
        const { code } = ke

        const editContext = get(this.editContext)
        const isInvalidEditState = editContext === "duplicate" || editContext === "lift" || editContext === "details"

        if (isTargetTextEditor(target) || isInvalidEditState) return

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
        return `calc(((100% / ${this.daysInView.length}) * ${dayIdx}) + 2px)`
    }

    /**
     * Get the curent edit block's x offset (floating).
     * For both pre-existing blocks on lift or stretch and duplicate blocks.
     */
    getEditBlockXOffset(editBlock: RoutineEditBlock) {
        const editContext = get(this.editContext)
        const isDragging = editBlock.isDragging
        const isDuplicate = editContext === "duplicate"

        // duplicate position
        if (isDuplicate && !isDragging) {
            const landingOffsetIdx = editBlock.dropArea!.offsetIdx
            const offsetIdx = landingOffsetIdx >= 0 ? landingOffsetIdx : this.editOffsetIdx

            return this.getXOffsetFromDayIdx(offsetIdx)
        }
        // details edit 
        else if (!isDragging) {
            const viewOptn = get(this.currViewOption)
            const fss = viewOptn === ViewOption.FSS
            const fssIdx = this.editDayIdx >= 5
            const colIdx = fss && fssIdx ? this.editDayIdx - 4 : this.editDayIdx

            return this.getXOffsetFromDayIdx(colIdx)
        }
        // floating x position
        else {
            return `${editBlock.xOffset + 2}px`
        }
    }

    getDayKey(key: string) {
        return key as keyof WeeklyRoutineBlocks
    }

    getDayKeyFromIdx(idx: number) {
        return this.DAYS_WEEK[idx] as keyof WeeklyRoutineBlocks
    }
}