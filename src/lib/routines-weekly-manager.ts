import { writable, type Writable, get } from "svelte/store"

import { RoutinesManager } from "./routines-manager"
import { ViewOption, EMPTY_CORES, ROUTINE_BLOCKS_CONTAINER_ID } from "./utils-routines"
import { getElemById, initFloatElemPos, isTargetTextEditor, getElemNumStyle, findAncestor, clamp } from "./utils-general"


export class WeeklyRoutinesManager extends RoutinesManager {
    currViewOption = writable(ViewOption.Weekly)
    chosenRoutine: WeeklyRoutine | null = null

    // current routine in view
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

    /**
     * @param weekRoutine   User's currently chosen routine which should be in view
     */
    constructor(weekRoutine?: WeeklyRoutine | null) {
        super()
        this.updateCurrentWeekRoutine(weekRoutine ?? null, false)
    }

    /**
     * Updates current weekly routine in view.
     * 
     * @param  weekRoutine     - Set the current routine in view to this
     * 
     * @param  doPrcessBlocks  - Should create the routine elements of the set weekly routine.
     *                           Used in subsequent initializations of routines. (At initial, component wait for mount first.)
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
            this.earliestBlockHeadPos = Math.min(earliestBlock, this.earliestBlockHeadPos)

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

    /* detail edits */

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

    /* breakdown data*/

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

    /**
     * Initialize a day routine's tag and core breakdown
     * 
     * @param dayIdx   Idx of day (0 -> Monday)
     */
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

        this.initDayEditFromContext()
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

    /* week routine updates*/

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
        newRoutine: DailyRoutine | RoutineBlock[], 
        editDayKey: keyof WeekBlockElems,
        editContext?: "unlinked" | "cleared" | "linked" | "edited",
    }) {
        const { newRoutine, editDayKey, editContext = "edited" } = data
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
     * 
     * Initialize the day routine being edited by a user from interation with a block element.
     * @param leftOffset  The positioning of the cursor at the time of interaction
     */
    initEditDayContextFromLeftOffset(leftOffset: number) {
        const containerWidth = this.blocksContainerRef!.clientWidth
        const colWidth = containerWidth / this.daysInView.length

        const leftPos = leftOffset

        let editDayIdx = Math.floor(leftPos / colWidth)
        editDayIdx = clamp(0, editDayIdx, 6)

        this.initEditDayContextFromIdx(editDayIdx)
    }

    /**
     * Initialize the edit day idx, key, and offset idx with current view in mind from the edit day idx.
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
    initDayEditFromContext() {
        const editDayRoutine      = get(this.weekRoutine)!.blocks[this.editDayKey!]
        const editDayRoutineElems = get(this.weekRoutineElems)![this.editDayKey!]

        this.editDayRoutine.set(editDayRoutine)
        this.editDayRoutineElems.set(editDayRoutineElems)
    }

    /* block / blocks container event handlers */

    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.initEditDayContextFromLeftOffset(this.cursorPos.left)
        this.initDayEditFromContext()

        this.dragStartPoint = this.cursorPos
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
    
            requestAnimationFrame(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
            })
    
            this.containerElem!.addEventListener("pointermove", this.onBlockStretchMove)
            this.containerElem!.addEventListener("pointerup", this.onBlockStretchEditEnd)
        }
        else {
            requestAnimationFrame(() => {
                const floatingBlock = getElemById("edit-block")
                floatingBlock?.setPointerCapture(e.pointerId)
            })

            this.containerElem!.addEventListener("pointermove", this.onLiftBlockPointerMove)
            this.containerElem!.addEventListener("pointerup", this.onLiftBlockPointerUp)
        }
    }

    intDragLiftMoveEdit(block: RoutineBlockElem) {
        const editBlock           =  get(this.editingBlock)!
        const editBlockLeftOffset =  getElemNumStyle(this.editingBlockRef!, "left")

        this.editingBlockTotalTime     = editBlock.endTime - editBlock.startTime
        this.editingBlockInitStartTime = editBlock.startTime

        // left and top offsets differences between cursor and top / left edges of block
        // allows drag point to be not just be the very top left corner of block
        this.initDragLiftOffsets = {
            top: this.cursorPos.top   - editBlock.yOffset,
            left: this.cursorPos.left - editBlockLeftOffset
        }

        // set edit state
        this.editingBlock.set({ 
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
    onLiftBlockPointerMove = (e: PointerEvent) => {
        e.preventDefault()

        // only allow the edit if the user has moved he cursor far enough
        if (!this.allowLiftEdit) { 
            const threshold = RoutinesManager.LIFT_DRAG_DIST_THRESHOLD

            if (this.isDragStretchValid(threshold)) {
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

        // see if linked routine
        this.isLiftOnLinkedSibling = this.hasSameLinkedRoutine({
            weekRoutine: get(this.weekRoutine)!,
            srcKey: this.getDayKeyFromIdx(this.getEditOriginDayKey()),
            queryKey: this.editDayKey!
        })

        // safeProps will be null if there was no space in current day col the cursos is in
        const { safeProps, xOffset, yOffset } = this.getLiftBlockPosition()

        if (safeProps) {
            this.editingBlock.update((block) => ({ 
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
            this.editingBlock.update((block) => ({ 
                ...block!, xOffset, yOffset, isDragging: true
            })) 
        }
    }

    onLiftBlockPointerUp = (e: PointerEvent) => {        
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

    /* scroll container event handlers */

    onScrollContainerPointerDown = (e: PointerEvent) => {
        const target    = e.target as HTMLElement
        const isDupEdit = get(this.editContext) === "duplicate"
        if (target.id != ROUTINE_BLOCKS_CONTAINER_ID || isDupEdit || e.button === 2) {
            return
        }

        this.initEditDayContextFromLeftOffset(this.cursorPos.left)
        this.initDayEditFromContext()

        this.stretchPivotPointTopOffset = this.cursorPos.top
        this.dragStartPoint = this.cursorPos

        // doesn't use handler directly as drag distance must surpass the drag distance threshold
        this.containerElem!.addEventListener("pointermove", this.onScrollContainerPointerMove)
        this.containerElem!.addEventListener("pointerup", this.onBlockStretchEditEnd)
    }

    onScrollContainerPointerMove = (e: PointerEvent) => {
        if (!this.allowStrechEdit) {
            const threshold = RoutinesManager.NEW_STRETCH_DRAG_DIST_THRESHOLD
            if (!this.isHozDragValid(threshold)) return
            
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

    /* stretch edit */

    onBlockStretchEditEnd = () => {
        this.removeStretchEventListeners()

        if (!this.allowStrechEdit) {
            this.editingBlock.set(null)
            return
        }

        const editContext = get(this.editContext)
        super.onBlockStretchEditEnd()

        if (editContext === "old-stretch") {
            this.updateSingleDayEdit()
            this.updateBreakdownData()
            
            this.resetEditState()
        }
    }

    removeStretchEventListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onScrollContainerPointerMove)
        this.containerElem!.removeEventListener("pointermove", this.onBlockStretchMove)
        this.containerElem!.removeEventListener("pointerup", this.onBlockStretchEditEnd)
    }

    /* lift edits */

    removeLiftEventListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onLiftBlockPointerMove)
        this.containerElem!.removeEventListener("pointerup", this.onLiftBlockPointerUp)
    }

    /* context menu */

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

    /* duplicate edit */

    onDupBlockPointerUp = () => {
        this.editingBlock.update((block) => { 
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
        
        // col edit init already set when on right click
        
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
            ...dupBlockElem, yOffset: top, xOffset: left, isDragging: false, 
            dropArea: {
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
        const view    = get(this.currViewOption)!
        const dayIdx = editBlock!.dropArea!.offsetIdx += (view === ViewOption.FSS ? 4 : 0)
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
        this.initDayEditFromContext()

        this.blockOnPointerDown = this.getWeekBlockFromId(blockId)!
        this.editingBlockRef = this.getDOMBlockElem(blockId)
        this.editingBlock.set({ 
            ...this.blockOnPointerDown, 
            xOffset: this.dayColXOffset,
            isDragging: false
        })

        this.editContext.set("details")
    }

    /**
     * Called when user has updated the block after editing it in the edit modal.
     * @param updatedBlock
     */
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
        this.allowStrechEdit = false
        this.editTargetElem = null
        this.initDragLiftOffsets = { top: -1, left: -1 }

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

    getEditOriginDayKey() {
        return +get(this.editingBlock)!.id.split("--")[0]
    }

    /* day specific edits */

    useTemplateOnDayRoutine(dailyRoutine: RoutineBlockElem[] | DailyRoutine) {
        const rawBlocks = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine

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

        this.editDayRoutineElems.set(blocks.map((block, idx) => ({ ...block!, id: `${this.editDayIdx}--${idx}` })))
        this.editDayRoutine.set(dailyRoutine)

        this.updateSingleDayEdit("linked")
    }

    unlinkSetDailyRoutine() {
        this.editDayRoutine.update((data) => (data! as DailyRoutine).blocks as RoutineBlock[])
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
        const isDragging = editBlock.isDragging
        const isDuplicate = get(this.editContext) === "duplicate"

        // after user has released after dragging a duplicate edit block
        if (isDuplicate && !isDragging) {
            const landingOffsetIdx = editBlock.dropArea!.offsetIdx
            const offsetIdx        = landingOffsetIdx >= 0 ? landingOffsetIdx : this.editOffsetIdx

            return this.getXOffsetFromDayIdx(offsetIdx)
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