import { editGoalManger } from "./store"
import { getElemById, moveElementInArr } from "./utils-general"
import { EditGoalContextMenu, EditGoalOption, EditMilestoneOption, GoalStatus, ModalType } from "./enums"
import { openModal } from "./utils-home"

export class EditGoalManager {
    title: string | null = null
    description: string | null = null
    tag: Tag | null = null 
    milestones: Milestone[] = []
    milestonesDone = 0
    status = GoalStatus.OnHold
    creationDate: Date | null = null
    dueDate: Date | null = null
    accomplishedDate: Date | null = null
    sectionId = 0
    sectionIdx = -1
    isPinned = false

    imgSrc: string | null = null
    isImgHidden = false

    newText = ""
    isEditingTitle = false
    isEditingDescription = false
    isEditingMilestoneTitle = false
    isMakingNewMilestone = false
    textAreaHasSpellCheck = false
    descrTextAreaHt = 0
    hasUsedEditShortcut = false

    editingMilestoneIdx = -1

    leftSide: HTMLElement | null = null
    newGoalModal: HTMLElement | null = null

    datePickerPos = ""
    milestoneContextMenuPos = ""
    goalContextMenuPos = ""
    imgContextMenuPos = ""
    milestoneContextMenuYPos = -1    
    showImgUploadModal = false

    constructor(goal: Goal | null) {
        if (goal) {
            this.title = goal.title
            this.description = goal.description
            this.tag = goal.tag
            this.milestones = goal.milestones
            this.status = goal.status
            this.creationDate = goal.creationDate
            this.milestonesDone = goal.milestonesDone
            this.dueDate = goal.dueDate
            this.accomplishedDate = goal.accomplishedDate
            this.imgSrc = goal.imgSrc
            this.isImgHidden = goal.isImgHidden
            this.sectionId = goal.sectionId
            this.sectionIdx = goal.sectionIdx
            this.isPinned = goal.isPinned
        }
        editGoalManger.set(this)
    }

    quit() {
        editGoalManger.set(null)
    }

    bindElems() {
        this.newGoalModal = getElemById("edit-goal-modal")!
        this.leftSide = getElemById("edit-goal-modal--left-side")!
    }

    updateEditGoalState(newState: Partial<EditGoalManager>) {
        editGoalManger.update((data: EditGoalManager | null) => {
            return this.getNewStateObj(data!, newState)
        })
    }

    /* UI Click Handlers */

    /**
     * Task list item component's title element on click handler.
     * Immediately focuses new title input.
     * Will not expand if user has selectde title.
     * 
     * @param taskIdx   Task idx of task component
     */
    onGoalTitleClicked() {
        if (window.getSelection()?.toString()) return

        this.isEditingTitle = true

        requestAnimationFrame(() => { 
            const inputTitleElem = getElemById(`goal-title-input`) as HTMLInputElement
            inputTitleElem.focus()
        })

        this.updateEditGoalState({ 
            isEditingTitle: this.isEditingTitle,
            newText: this.newText
        })
    }

    /**
     * Task list item component's subtask title element on click handler.
     * Immediately focuses new subtask title input.
     * Will not work if user has highlighted subtask title.
     * 
     * @param taskIdx   Subtask idx of task component
     */
    onDescriptionClicked(event: Event) {
        if (window.getSelection()?.toString()) return

        const target = event.target as HTMLElement

        this.isEditingDescription = true
        this.descrTextAreaHt = target.clientHeight

        this.updateEditGoalState({ 
            isEditingDescription: true,
            descrTextAreaHt: this.descrTextAreaHt
        })
        
        requestAnimationFrame(() => {
            const inputTextElem = getElemById(`goal-description-input`) as HTMLTextAreaElement
            inputTextElem!.focus()
        })
    }

    onMilestoneClicked(milestoneIdx: number) {
        if (window.getSelection()?.toString()) return

        this.editingMilestoneIdx = milestoneIdx < 0 ? this.editingMilestoneIdx : milestoneIdx
        this.newText = this.milestones[this.editingMilestoneIdx].title
        this.isEditingMilestoneTitle = true

        this.updateEditGoalState({ 
            editingMilestoneIdx: this.editingMilestoneIdx,
            newText: this.newText,
            isEditingMilestoneTitle: true
        })

        requestAnimationFrame(() => {
            const inputTextElem = getElemById(`milestone-title-input`) as HTMLInputElement
            inputTextElem!.focus()
        })
    }

    onInputFocusHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        if (targetClass.includes("milestone")) {
            this.newText = ""
        }
        else if (targetClass.includes("milestone")) {
            this.newText = this.milestones[this.editingMilestoneIdx].title
        }
        else if (targetClass.includes("title-input")) {
            this.newText = this.title!
        }
        else if (targetClass.includes("description")) {
            this.newText = this.description!
        }

        this.updateEditGoalState({ newText: this.newText })
    }
    onInputBlurHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        // both using a shortcut and clicking away will cause a blur
        // this should only handle click-away blurs
        if (this.hasUsedEditShortcut) {
            this.hasUsedEditShortcut = false
            return
        }

        // Input Shortcut Pressed 
        if (targetClass.includes("new-milestone")) {
            this.saveNewMilestone()
        }
        else if (targetClass.includes("milestone")) {
            this.saveNewMilestoneTitle()
        }
        else if (targetClass.includes("title-input")) {
            this.saveNewTitle()
        }
        else if (targetClass.includes("description")) {
            this.saveNewDescription()
        }
    }

    saveNewTitle(doSave: boolean = true) {
        if (doSave && this.newText) {
            this.title = this.newText
        }
        this.isEditingTitle = false
        this.newText = ""
        this.updateEditGoalState({ title: this.title, isEditingTitle: false, newText: "" })
    }

    saveNewDescription(doSave: boolean = true) {
        if (doSave) {
            this.description = this.newText
        }
        this.isEditingDescription = false
        this.newText = ""
        this.updateEditGoalState({ description: this.description, isEditingDescription: false, newText: "" })
    }

    saveNewMilestoneTitle(doSave: boolean = true) {
        if (doSave && this.newText) {
            this.milestones[this.editingMilestoneIdx].title = this.newText!
        }

        this.removeEditMilestone()
        this.isEditingMilestoneTitle = false
        this.newText = ""
        this.updateEditGoalState({ milestones: this.milestones, isEditingMilestoneTitle: false, newText: "" })
    }

    saveNewMilestone(doSave: boolean = true) {
        if (doSave && this.newText) {
            this.milestones.unshift({ idx: 0, id: "", endDate: null, title: this.newText })
        }

        this.isMakingNewMilestone = false
        this.newText = ""
        this.updateEditGoalState({ isMakingNewMilestone: false, milestones: this.milestones })
    }

    deleteGoal() {
        console.log("GOAL DELETED")
    }

    inputTextHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement | HTMLTextAreaElement
        const targetClass = inputElem.classList.value
        this.newText = inputElem.value

        if (targetClass.includes("description")) {
            inputElem.style.height = "5px"
            inputElem.style.height = (inputElem.scrollHeight) + "px"
        }
    }

    // Editing Goal

    editGoalDate(newDate: Date | null) {
        this.dueDate = newDate
        this.updateEditGoalState({ dueDate: this.dueDate })
        this.closeDatePicker()
    }

    editGoalAccomplishedDate(newAccomplishedDate: Date) {
        this.accomplishedDate = newAccomplishedDate
        this.updateEditGoalState({ accomplishedDate: this.accomplishedDate })
    }

    editNewTag(newTag: Tag) {
        this.tag = newTag
        this.updateEditGoalState({ tag: newTag })
    }

    editNewStatus(newStatus: GoalStatus) {
        this.status = newStatus
        this.updateEditGoalState({ status: newStatus })
    }

    editGoalImgSrc(imgSrc: string | null) {
        this.imgSrc = imgSrc
        this.updateEditGoalState({ imgSrc: this.imgSrc, isImgHidden: imgSrc === null })
    }

    editGoalImgSrcVisibility(doHide: boolean) {
        this.isImgHidden = doHide
    }

    updateSectionIdx(targetSectionIdx: GoalSectionItemId) {
        this.sectionId = targetSectionIdx.sectionId
        this.sectionIdx = targetSectionIdx.sectionItemIdx

        this.updateEditGoalState({
            sectionId: this.sectionId,
            sectionIdx: this.sectionIdx,
        })
    }
    
    togglePinGoal() {
        this.isPinned = !this.isPinned
        this.updateEditGoalState({ isPinned: this.isPinned })
    }

   
   // Editing Milestone 

   newMilestoneBtnClicked() {
        this.isMakingNewMilestone = true
        this.updateEditGoalState({ isMakingNewMilestone: true })
    }

    setEditMilestone(milestoneIdx: number) {
        this.editingMilestoneIdx = milestoneIdx
        this.updateEditGoalState({ editingMilestoneIdx: milestoneIdx })
    }

    removeEditMilestone() {
        this.setEditMilestone(-1)
    }

    deleteMilestone(milestoneIdxToDelete: number) {
        const isDone = this.milestones[milestoneIdxToDelete].endDate

        this.milestonesDone -= isDone ? 1 : 0
        this.milestones.splice(milestoneIdxToDelete, 1)

        this.updateEditGoalState({ milestones: this.milestones, milestonesDone: this.milestonesDone })
    }

    addNewMilestone(newMilestone: Milestone) {
        this.milestones.push(newMilestone)
        this.updateEditGoalState({ milestones: this.milestones })
    }

    toggleCheckMilestone(milestoneIdx: number) {
        const hasFinished = this.milestones[milestoneIdx].endDate != null
        this.milestones[milestoneIdx].endDate = hasFinished ? null : new Date()
        this.milestonesDone += hasFinished ? -1 : 1

        this.updateEditGoalState({ milestonesDone: this.milestonesDone, milestones: this.milestones })
        this.sortMilestones()
    }

    editMileStoneFinishDate(newDate: Date | null) {
        const milestone = this.milestones[this.editingMilestoneIdx]

        if (milestone.endDate && !newDate) {
            this.milestonesDone--
        }
        else if (!milestone.endDate && newDate) {
            this.milestonesDone++
        }

        milestone.endDate = newDate

        this.closeDatePicker()
        this.removeEditMilestone()
        this.sortMilestones()
    }

    moveElemInMilestone(fromIdx: number, toIndex: number) {
        this.milestones = moveElementInArr(this.milestones, fromIdx, toIndex)
        this.sortUnFinishishedMilestones()
    }

    sortUnFinishishedMilestones() {
        this.milestones.forEach((milestone: Milestone, idx: number) => {
            if (!milestone.endDate) {
                milestone.idx = idx
            }
        })

        this.updateEditGoalState({ milestones: this.milestones })
    }

    sortMilestones() {
        this.milestones.sort((a: Milestone, b: Milestone) => {
            if (a.endDate === null && b.endDate === null) {
                return a.idx - b.idx
            } else if (a.endDate === null) {
                return -1
            } else if (b.endDate === null) {
                return 1
            }
            return b.endDate.getTime() - a.endDate.getTime()
        })

        this.updateEditGoalState({ milestones: this.milestones, milestonesDone: this.milestonesDone })
    }

    goalOptionClicked(option: EditGoalOption) {
        if (option === EditGoalOption.DelteGoal) {
            this.deleteGoal()   
        }
        else if (option === EditGoalOption.ChangeImage) {
            openModal(ModalType.ImgUpload)
        }
        else if (option === EditGoalOption.ToggleHideImg) {
            this.editGoalImgSrcVisibility(!this.isImgHidden)
        }
        else if (option === EditGoalOption.RemoveImage) {
            this.editGoalImgSrc(null)
        }
        else {
            this.togglePinGoal()
        }
        
        this.closeGoalContextMenu()
    }

    milestoneOptionClicked(event: Event, option: EditMilestoneOption) {
        if (option === EditMilestoneOption.ChangeDate) {
            this.onContextMenu(event, EditGoalContextMenu.Date)
        }
        else if (option === EditMilestoneOption.EditTitle) {
            this.onMilestoneClicked(this.editingMilestoneIdx)
        }
        else {
            this.deleteMilestone(this.editingMilestoneIdx)
        }

        const doResetMilestoneIdx = option === EditMilestoneOption.Delete
        this.closeMilestoneContextMenu(doResetMilestoneIdx)
    }

    onMilestoneSettings(event: Event, milestoneIdx: number) {
        this.setEditMilestone(milestoneIdx)
        this.onContextMenu(event, EditGoalContextMenu.Milestone)
    }

    // Date Picker & Context Menu
    getLeftSideDimensions() {
        return [this.leftSide!.clientWidth, this.leftSide!.clientHeight]
    }
    onContextMenu(event: Event, option: EditGoalContextMenu) {
        const pointerEvent = event as PointerEvent
        const rect = this.leftSide!.getBoundingClientRect()

        // x and y offsets from modal edges
        const x = pointerEvent.clientX - rect.left
        const y = pointerEvent.clientY - rect.top

        event.preventDefault()
        event.stopPropagation()


        // close any open context menu
        if (this.datePickerPos) {
            this.closeDatePicker()
        }
        else if (this.imgContextMenuPos) {
            this.closeImgContextMenu()
        }
        else if (this.goalContextMenuPos) {
            this.closeGoalContextMenu()
        }
        else if (this.milestoneContextMenuPos) {
            const doResetMilestoneIdx = option === EditGoalContextMenu.Date && this.editingMilestoneIdx < 0
            this.closeMilestoneContextMenu(doResetMilestoneIdx)
        }

        // open context menu
        if (option === EditGoalContextMenu.Date && this.datePickerPos) {
            this.closeDatePicker()
            return
        }
        else if (option === EditGoalContextMenu.Date) {
            this.openDatePicker({ x, y })
        }
        else if (option === EditGoalContextMenu.Goal && this.goalContextMenuPos) {
            this.closeGoalContextMenu()
            return
        }
        else if (option === EditGoalContextMenu.Goal) {
            this.openGoalContextMenu({ x,  y })
        }
        else if (option === EditGoalContextMenu.Milestone && this.milestoneContextMenuPos) {
            this.closeMilestoneContextMenu()
            return
        }
        else if (option === EditGoalContextMenu.Milestone) {
            this.openMilestoneContextMenu(pointerEvent, { x,  y })
        }
        else {
            this.openImgContextMenu({ x, y })
        }
    }

    openMilestoneContextMenu(event: PointerEvent, pos: { x: number, y: number }) {
        const target = event.target as HTMLElement
        const isSettingsBtn = event.button === 0
        if (!isSettingsBtn && target.tagName != "DIV" && target.tagName != "LI") return

        const [_, h] = this.getLeftSideDimensions()

        this.milestoneContextMenuPos = `bottom: ${h - (pos.y + 100)}px; left: ${pos.x}px`
        this.updateEditGoalState({ milestoneContextMenuPos: this.milestoneContextMenuPos })
    }
    openGoalContextMenu(pos: { x: number, y: number }) {
        this.goalContextMenuPos = `top: ${pos.y + 15}px; left: ${pos.x - 20}px`
        this.updateEditGoalState({ goalContextMenuPos: this.goalContextMenuPos })
    }
    openDatePicker(pos: { x: number, y: number }) {
        const [_, h] = this.getLeftSideDimensions()
        const isForMilestone = this.editingMilestoneIdx >= 0
        const percFromTop = pos.y / h
        let yOffSet = isForMilestone ? 240 : 340

        if (isForMilestone) {
            this.closeMilestoneContextMenu(false)
        }
        if (percFromTop >= 0.60) {
            yOffSet -= 200
        }
        
        const fromBottom = h - pos.y - yOffSet

        this.datePickerPos = `bottom: ${fromBottom}px; left: ${pos.x - 40}px`
        this.updateEditGoalState({ datePickerPos: this.datePickerPos })
    }
    openImgContextMenu(pos: { x: number, y: number }) {
        this.imgContextMenuPos = `top: ${pos.y}px; left: ${pos.x - 40}px`
        this.updateEditGoalState({ imgContextMenuPos: this.imgContextMenuPos })
    }
    closeGoalContextMenu() {
        this.goalContextMenuPos = ""
        this.updateEditGoalState({ goalContextMenuPos: "" })
    }
    closeMilestoneContextMenu(doResetEditIdx = true) {
        this.milestoneContextMenuPos = ""
        this.updateEditGoalState({ milestoneContextMenuPos: "" })

        if (doResetEditIdx) this.removeEditMilestone()
    }
    closeDatePicker() {
        this.datePickerPos = ""
        this.updateEditGoalState({ datePickerPos: "" })

        if (this.editingMilestoneIdx >= 0) {
            this.removeEditMilestone()
        }
    }
    closeImgContextMenu() {
        this.imgContextMenuPos = ""
        this.updateEditGoalState({ imgContextMenuPos: "" })
    }
    updateActivePicker() {
        const [w, _] = this.getLeftSideDimensions()
        const isForMilestone = this.editingMilestoneIdx >= 0

        if (isForMilestone) {
            const regex = /left:\s*(-?\d+(\.\d+)?px)/
            const match = this.datePickerPos.match(regex)
            this.datePickerPos = this.datePickerPos.replace(match![1], `${w - 130}px`)
        }
        else {
            this.datePickerPos = `bottom: -50px; left: ${w}px`
        }

        this.updateEditGoalState({ datePickerPos: this.datePickerPos })
    }


    /**
     * Keyboard shortcut handler for edit goal modal
     * @param event  Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value
        const key = event.key
        const tag = target.tagName

        const isEditing = ["INPUT", "TEXTAREA"].includes(tag)
        const isEditShortCut = (key === "Enter" || key ==="Escape") && isEditing
        const doSave = key === "Enter"

        // EDITING SHORTCUTS
        if (isEditShortCut && targetClass.includes("new-milestone")) {
            this.saveNewMilestone(doSave)
        }
        if (isEditShortCut && targetClass.includes("milestone")) {
            this.saveNewMilestoneTitle(doSave)
        }
        else if (isEditShortCut && targetClass.includes("title")) {
            this.saveNewTitle(doSave)
        }
        else if (isEditShortCut && targetClass.includes("description")) {
            this.saveNewDescription(doSave)
        }

        if (isEditShortCut) {
            // click away blur and edit shortcut blur must be separate
            this.hasUsedEditShortcut = true
            target.blur()
        }
    }

    getNewStateObj(oldState: EditGoalManager, newState: Partial<EditGoalManager>): EditGoalManager {
        const newStateObj = oldState

        if (newState.title != undefined)            newStateObj!.title = newState.title
        if (newState.description != undefined)      newStateObj!.description = newState.description
        if (newState.tag != undefined)              newStateObj!.tag = newState.tag
        if (newState.milestones != undefined)       newStateObj!.milestones = newState.milestones
        if (newState.milestonesDone != undefined)   newStateObj!.milestonesDone = newState.milestonesDone
        if (newState.dueDate != undefined)          newStateObj!.dueDate = newState.dueDate
        if (newState.accomplishedDate != undefined) newStateObj!.accomplishedDate = newState.accomplishedDate
        if (newState.status != undefined)           newStateObj!.status = newState.status
        if (newState.creationDate != undefined)     newStateObj!.creationDate = newState.creationDate
        if (newState.datePickerPos != undefined)    newStateObj!.datePickerPos = newState.datePickerPos
        if (newState.milestoneContextMenuPos != undefined)  newStateObj!.milestoneContextMenuPos = newState.milestoneContextMenuPos
        if (newState.isEditingMilestoneTitle != undefined)  newStateObj!.isEditingMilestoneTitle = newState.isEditingMilestoneTitle
        if (newState.isEditingDescription != undefined)     newStateObj!.isEditingDescription = newState.isEditingDescription
        if (newState.isEditingTitle != undefined)           newStateObj!.isEditingTitle = newState.isEditingTitle
        if (newState.isMakingNewMilestone != undefined)     newStateObj!.isMakingNewMilestone = newState.isMakingNewMilestone
        if (newState.imgSrc != undefined)                   newStateObj!.imgSrc = newState.imgSrc
        if (newState.imgContextMenuPos != undefined)        newStateObj!.imgContextMenuPos = newState.imgContextMenuPos
        if (newState.sectionId != undefined)                newStateObj!.sectionId = newState.sectionId
        if (newState.sectionIdx != undefined)               newStateObj!.sectionIdx = newState.sectionIdx
        if (newState.isPinned != undefined)                 newStateObj!.isPinned = newState.isPinned

        return newStateObj
    }
}