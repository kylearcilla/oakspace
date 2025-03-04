import { get } from "svelte/store"

import { RoutinesManager } from "./routines-manager"
import { EMPTY_CORES, ROUTINE_BLOCKS_CONTAINER_ID } from "./utils-routines"
import { getElemById, getElemNumStyle, initFloatElemPos } from "./utils-general"

export class DailyRoutinesManager extends RoutinesManager {
    constructor() {
        super()
    }

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

        this.earliestBlockTop = earliestBlock
        this.editDayRoutineElems.set(blockElems)

        // ensure that the earliest block is close to the top edge of scrollable
        this.containerElem!.classList.add("hide-scroll-bar")
        this.containerElem!.scrollTop = earliestBlock - 15

        setTimeout(() => this.containerElem!.classList.remove("hide-scroll-bar"), 0)
    }

    /* detail Edits */

    toggleEditModal(blockId: string) {
        this.blockPointerDown = this.getBlockElem(blockId)!
        this.editBlockRef = this.getDOMBlockElem(blockId)
        this.editBlock.set({
            ...this.blockPointerDown, isDragging: false
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

    onConcludeModalEdit(updatedBlock: RoutineBlockElem | null) {
        super.onConcludeModalEdit(updatedBlock)
        this.updateBreakdownData()
    }

    /* event handlers */

    onBlockClicked(id: string) {
        const editBlock =  this.getBlockElem(id)!
        this.editBlock.set({ ...editBlock, isDragging: false })

        this.openEditBlockModal()
    }

    /**
     * Block pointer down event handler
     * @param e   Pointer event
     * @param id  Id of routine block elem
     */
    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.blockPointerDown = this.getBlockElem(id)!
        const { isOnTopEdge, isOnBottomEdge } = this.isPointerOnBlockEdge(e)

        if (isOnTopEdge || isOnBottomEdge) {
            this.liftFromHead = isOnTopEdge
            this.allowStrechEdit = true

            // init directly as there is no drag distance threshold
            this.initStretchEdit(this.blockPointerDown! , true)
    
            setTimeout(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
            }, this.POINTER_CAPTURE_TIMEOUT)
    
            this.containerElem!.addEventListener("pointermove", this.onBlockStretchMove)
            this.containerElem!.addEventListener("pointerup", this.onStretchEditEnd)
        }
        else {
            this.dragStartPoint = this.cursorPos

            setTimeout(() => {
                const floatingBlock = getElemById("edit-block")
                floatingBlock?.setPointerCapture(e.pointerId)
            }, this.POINTER_CAPTURE_TIMEOUT)

            this.containerElem!.addEventListener("pointermove", this.onLiftPointerMove)
            this.containerElem!.addEventListener("pointerup", this.onLiftPointerUp)
        }
    }

    onBlockContextMenu(id: string) {
        const editBlock = this.getBlockElem(id)!
        this.editBlock.set({ ...editBlock, isDragging: true })

        this.openContextMenu()
    }

    onBoardPointerDown(e: PointerEvent) {
        const target = e.target as HTMLElement

        if (target.id != ROUTINE_BLOCKS_CONTAINER_ID || e.button === 2) {
            return
        }

        this.stretchPivotPointTopOffset = this.cursorPos.top
        this.dragStartPoint = this.cursorPos

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

            this.initStretchEdit(editBlock, false)
            this.allowStrechEdit = true
            this.editBlock.set(editBlock)

            setTimeout(() => {
                const stretchBlock = getElemById("edit-block")
                stretchBlock?.setPointerCapture(e.pointerId)
            }, this.POINTER_CAPTURE_TIMEOUT)
        }
        if (this.allowStrechEdit) {
            this.onBlockStretchMove(e)
        }
    }

    /* stretch edits */

    /**
     * Handler for when ending an old stretch or lift edit.
     */
    onStretchEditEnd = () => {
        this.removeStretchListeners()

        if (!this.allowStrechEdit) {
            this.editBlock.set(null)
            this.editContext.set(null)
            return
        }
        
        super.onStretchEditEnd()
        this.updateBreakdownData()
        this.dragStartPoint = { left: -1, top: -1 }
    }

    removeStretchListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onBoardPointerMove)
        this.containerElem!.removeEventListener("pointermove", this.onBlockStretchMove)
        this.containerElem!.removeEventListener("pointerup", this.onStretchEditEnd)
    }

    /* lift edits */

    onLiftPointerMove = (e: PointerEvent) => {
        e.preventDefault()

        if (!this.allowLiftEdit) { 
            const threshold = RoutinesManager.LIFT_DRAG_DIST_THRESHOLD

            if (this.isDragStretchValid(threshold)) {
                this.intDragLift(this.blockPointerDown!)
                this.allowLiftEdit = true
            }
        }
        if (this.allowLiftEdit) {
            this.onBlockLiftMove()
        }
    }

    onLiftPointerUp = () => {
        if (this.allowLiftEdit) {
            this.onBlockLiftEnd()
        }
        else {
            this.editContext.set("details")
        }

        this.containerElem!.removeEventListener("pointermove", this.onLiftPointerMove)
        this.containerElem!.removeEventListener("pointerup", this.onLiftPointerUp)
    }

    onBlockLiftMove() {
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
                    offsetIdx: 0
                }
            }))
        }
        else {
            this.editBlock.update((block) => ({ 
                ...block!, xOffset, yOffset, isDragging: true
            })) 
        }
    }

    /**
     * Called when block lift edit state has ended.
     */
    onBlockLiftEnd() {
        const dropAreaBlock = get(this.editBlock)!
        const editContext = get(this.editContext)
        const { endTime, startTime, dropArea } = dropAreaBlock

        const editedBlockELem = { 
            ...dropAreaBlock, startTime, endTime,
            yOffset: dropArea!.top, xOffset: dropArea!.left
        }

        editedBlockELem.dropArea = undefined

        this.finishEdit(editedBlockELem, editContext!)
        this.updateBreakdownData()

        this.editContext.set(null)
        this.editBlock.set(null)
        this.editBlockTotalTime     = -1
        this.editBlockInitStartTime = -1

        this.dragStartPoint = { left: -1, top: -1 }

        this.allowLiftEdit = false
        this.editTargetElem = null
        this.initDragLiftOffsets = { top: -1, left: -1 }
    }

    /* duplicate edits */

    onDupBlockPointerUp = () => {
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

        const editBlock  = get(this.editBlock)!
        const didClickOnButton = target.closest(".routine-block__buttons")
        if (!!didClickOnButton) return
        

        this.editBlockRef!.setPointerCapture(e.pointerId)
        this.editBlockRef!.style.cursor = "grabbing"

        const editBlockLeftOffset = getElemNumStyle(this.editBlockRef!, "left")
        
        this.initDragLiftOffsets = {
            top: this.cursorPos.top   - editBlock.yOffset,
            left: this.cursorPos.left - editBlockLeftOffset
        }

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
        this.editBlockInitStartTime = editBlock.startTime
        this.editBlockTotalTime     = editBlock.endTime - editBlock.startTime
        this.editContext.set("duplicate")

        this.editBlock.set({ 
            ...dupBlockElem, yOffset: top, xOffset: left, isDragging: false, dropArea: {
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

        this.finishEdit(editBlock, "duplicate")
        this.closeDuplicateEdit()
    }

    closeDuplicateEdit() {
        this.removeDupEventListeners()

        if (this.editBlockRef) {
            this.editBlockRef.removeEventListener("pointerdown", this.onDupBlockPointerDown)
        }

        this.resetEditState()
    }

    /* misc */

    /**
     * Get the DOM block element that corresponds to a given block elem id
     * @param id   Block elem id
     * @returns    Block elem's corresponding dom block element.
     */
    getDOMBlockElem(id: string) {
        return getElemById(`rblock--${id}`) as HTMLElement
    }
}
