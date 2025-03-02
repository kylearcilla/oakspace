import { get } from "svelte/store"

import { RoutinesManager } from "./routines-manager"
import { EMPTY_CORES, ROUTINE_BLOCKS_CONTAINER_ID } from "./utils-routines"
import { getElemById, getElemNumStyle, initFloatElemPos } from "./utils-general"

export class DailyRoutinesManager extends RoutinesManager {
    constructor() {
        super()
    }

    /**
     * Initialize edit routine.
     * A daily routine is immediately in edit mode if it's in view.
     * 
     * @param routine    Edit routine.
     */
    initEditRoutine(routine: DailyRoutine | null) {
        if (get(this.editContext) === "duplicate") {
            this.closeDuplicateEdit()
        }
        if (!routine) {
            this.coreBreakdown.set(EMPTY_CORES)
            this.tagBreakdown.set([])
            this.editDayRoutine.set(null)
            this.editDayRoutineElems.set(null)
            return
        }

        this.editDayRoutine.set(routine)
        const { coreBreakdown, earliestBlock, blockElems, tagBreakdown } = this.processBlocks(routine.blocks)

        this.coreBreakdown.set(coreBreakdown)
        this.tagBreakdown.set(tagBreakdown)

        this.earliestBlockHeadPos = earliestBlock
        this.editDayRoutineElems.set(blockElems)

        // ensure that the earliest block is close to the top edge of scrollable
        this.containerElem!.classList.add("hide-scroll-bar")
        this.containerElem!.scrollTop = earliestBlock - 15

        setTimeout(() => this.containerElem!.classList.remove("hide-scroll-bar"), 0)
    }

    /* Detail Edits */

    toggleEditModal(blockId: string) {
        this.blockOnPointerDown = this.getBlockElem(blockId)!
        this.editingBlockRef = this.getDOMBlockElem(blockId)
        this.editingBlock.set({
            ...this.blockOnPointerDown, isDragging: false
        })

        this.editContext.set("details")
    }

    /**
     * Updates a selected daily routine's title
     * @param name 
     */
    updateTitle = (name: string) => {
        this.editDayRoutine.update((routine) => ({ ...routine!, name }))
    }

    /**
     * Updates a selected daily routine's description
     * @param title 
     */
    updateDescription = (description: string) => {
        this.editDayRoutine.update((routine) => ({ ...routine!, description } ))
    }

    updateRoutinesFromRoutine = (updatedRoutine: DailyRoutine) => {
    }

    onConcludeModalEdit(updatedBlock: RoutineBlockElem | null) {
        super.onConcludeModalEdit(updatedBlock)
        this.updateBreakdownData()
    }

    /* event handlers */

    /**
     * Block pointer down event handler
     * @param e   Pointer event
     * @param id  Id of routine block elem
     */
    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.blockPointerDown = this.getBlockElem(id)!
        const { isOnTopEdge, isOnBottomEdge } = this.isBlockPointerDownOnEdge(e)

        if (isOnTopEdge || isOnBottomEdge) {
            this.isDragLiftFromHead = isOnTopEdge
            this.allowStrechEdit = true

            // init directly as there is no drag distance threshold
            this.initStretchEdit(this.blockPointerDown! , true)
    
            requestAnimationFrame(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
            })
    
            this.containerElem!.addEventListener("pointermove", this.onBlockStretchMove)
            this.containerElem!.addEventListener("pointerup", this.onStretchEditEnd)
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
     * Handler for when the mouse moves after user clicks on a block.
     * Initialized after user has clicked on a block to initiate a lift edit state.
     * @param event  Pointer event
     */
    onLiftBlockPointerMove = (e: PointerEvent) => {
        e.preventDefault()

        if (!this.allowLiftEdit) { 
            const threshold = RoutinesManager.LIFT_DRAG_DIST_THRESHOLD

            if (this.isDragStretchValid(threshold)) {
                this.intDragLiftMoveEdit(this.blockPointerDown!)
                this.allowLiftEdit = true
            }
        }
        if (this.allowLiftEdit) {
            this.onBlockLiftMove()
        }
    }

    /**
     * Pointer up event handler for when user clicks up on a block.
     * Initialized after user has clicked on a block to initiate a lift edit state.
     * Terminates an lift edit state or a stretch edit state.
     */
    onLiftBlockPointerUp = () => {
        if (this.allowLiftEdit) {
            this.onBlockLiftEnd()
        }
        else {
            this.editContext.set("details")
        }

        this.containerElem!.removeEventListener("pointermove", this.onLiftBlockPointerMove)
        this.containerElem!.removeEventListener("pointerup", this.onLiftBlockPointerUp)
    }

    /**
     * Handler for when ending an old stretch or lift edit.
     */
    onStretchEditEnd = () => {
        this.removeStretchEventListeners()

        if (!this.allowStrechEdit) {
            this.editingBlock.set(null)
            return
        }
        
        super.onStretchEditEnd()
        this.updateBreakdownData()
        this.dragStartPoint = { left: -1, top: -1 }
    }

    removeStretchEventListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onScrollContainerPointerMove)
        this.containerElem!.removeEventListener("pointermove", this.onBlockStretchMove)
        this.containerElem!.removeEventListener("pointerup", this.onStretchEditEnd)
    }

    onBlockContextMenu(id: string) {
        const editBlock = this.getBlockElem(id)!
        this.editingBlock.set({ ...editBlock, isDragging: true })

        this.openContextMenu()
    }

    /**
     * Pointer down event hanlder on scroll container (blocks container parent)
     * 
     * @param e 
     */
    onScrollContainerPointerDown(e: PointerEvent) {
        const target = e.target as HTMLElement

        if (target.id != ROUTINE_BLOCKS_CONTAINER_ID || e.button === 2) {
            return
        }

        this.stretchPivotPointTopOffset = this.cursorPos.top
        this.dragStartPoint = this.cursorPos

        this.containerElem!.addEventListener("pointermove", this.onScrollContainerPointerMove)
        this.containerElem!.addEventListener("pointerup", this.onStretchEditEnd)
    }

    /**
     * Pointer move handler for scroll container (parent of blocks container).
     * Initialized after user has just clicked on the scroll container (to make a new block).
     * 
     * @param e   Pointer Event
     */
    onScrollContainerPointerMove = (e: PointerEvent) => {
        if (!this.allowStrechEdit) {    
            const threshold = RoutinesManager.NEW_STRETCH_DRAG_DIST_THRESHOLD
            if (!this.isHozDragValid(threshold)) return

            // attempt to make a valid block
            const editBlock = this.createBlockFromStretch()
            if (!editBlock) return

            this.initStretchEdit(editBlock, false)
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

    /* lift edits */

    /**
     * Called when block is moved by the user during lift edit state
     */
    onBlockLiftMove() {
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
                    offsetIdx: 0
                }
            }))
        }
        else {
            this.editingBlock.update((block) => ({ 
                ...block!, xOffset, yOffset, isDragging: true
            })) 
        }
    }

    /**
     * Called when block lift edit state has ended.
     */
    onBlockLiftEnd() {
        const dropAreaBlock = get(this.editingBlock)!
        const editContext = get(this.editContext)
        const { endTime, startTime, dropArea } = dropAreaBlock

        const editedBlockELem = { 
            ...dropAreaBlock, startTime, endTime,
            yOffset: dropArea!.top, xOffset: dropArea!.left
        }

        editedBlockELem.dropArea = undefined

        this.updateRoutineBlock(editedBlockELem, editContext!)
        this.updateBreakdownData()

        this.editContext.set(null)
        this.editingBlock.set(null)
        this.editingBlockTotalTime     = -1
        this.editingBlockInitStartTime = -1

        this.dragStartPoint = { left: -1, top: -1 }

        this.allowLiftEdit = false
        this.editTargetElem = null
        this.initDragLiftOffsets = { top: -1, left: -1 }
    }

    /* duplicate edits */

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
        const didClickOnButton = target.closest(".routine-block__buttons")

        if (!!didClickOnButton) return

        this.editingBlockRef!.setPointerCapture(e.pointerId)
        this.editingBlockRef!.style.cursor = "grabbing"

        const editBlockLeftOffset = getElemNumStyle(this.editingBlockRef!, "left")
        
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
        const dupBlockElem = this.getBlockElem(editBlock.id)!

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

        this.updateRoutineBlock(editBlock, "duplicate")
        this.closeDuplicateEdit()
    }

    closeDuplicateEdit() {
        this.removeDupEventListeners()
        this.editingBlockRef!.removeEventListener("pointerdown", this.onDupBlockPointerDown)

        this.resetEditState()
    }

    resetEditState() {
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
    }

    /* DOM Helpers */

    /**
     * Get the DOM block element that corresponds to a given block elem id
     * @param id   Block elem id
     * @returns    Block elem's corresponding dom block element.
     */
    getDOMBlockElem(id: string) {
        return getElemById(`rblock--${id}`) as HTMLElement
    }
}
