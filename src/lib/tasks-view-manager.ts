import { tasksViewStore } from "./store";
import { ContextMenuOption, TaskSettingsOptions, RightSideTab } from "./enums"
import { getElemById, getElemNumStyle } from "./utils-general"
import { 
        MAX_X_CONTEXT_MENU_POS, SUBTASK_HEIGHT, 
        TASK_BOTTOM_PADDING, TASK_HEIGHT_MIN_NO_DESCR 
    } from "$lib/utils-right-bar"


/**
 * State handler for tasks view in the right side bar.
 * Is itself a svelte store that component listens to for changes.
 */
export class TasksViewManager {
    /* Groups */
    taskGroups: string[] = []
    isNewTaskGroupFocused = false
    isMakingNewGroup = false
    isEditingGroup = false
    
    /* Tasks */
    tasks: Task[] = []
    pickedTaskIdx = -1
    pickedTaskHT: number = 0
    pickedTaskDescriptionHT = 0
    pickedTaskGroupIdx = 0
    
    taskCheckBoxJustChecked = -1
    isMakingNewTask = false
    isEditingTitle = false
    isEditingDescription = false
    focusedTaskIdx = -1
    prevFocusedTodoIdx = -1

    /* Subtasks */
    editingSubtaskIdx = -1
    subtaskCheckBoxJustChecked = -1
    isAddingNewSubtask = false
    hookContainerHT: number = 0
    hooklineOffset = 0
    focusedSubtaskIdx = -1

    /* Input Values */
    newText = ""
    
    /* Task Context Menu */
    hasJustClosedContextMenu = false
    contextMenuX = -1
    contextMenuY = -1
    
    rightClickedTask: null | { task: Task, idx: number }  = null
    rightClickedSubtask: null | { subtask: SubTask, idx: number } = null
    
    /* UI */
    selectedTab: RightSideTab = RightSideTab.TASKS
    hasUsedEditShortcut = false

    textAreaHasSpellCheck = false
    hasInputBlurred = false

    constructor(tasks: Task[], taskGroups: string[]) {
        this.tasks = tasks
        this.taskGroups = taskGroups

        tasksViewStore.set(this)
    }

    updateTaskViewState(newState: Partial<TasksViewManager>) {
        tasksViewStore.update((data: TasksViewManager | null) => {
            return this.getNewStateObj(data!, newState)
        })
    }

    /* UI Click Handlers */
    onTaskTitleClicked(taskIdx: number) {
        if (window.getSelection()?.toString()) return
        
        this.expandTask(taskIdx)
        this.toggleTaskTitleInput()

        this.updateTaskViewState({ newText: this.newText })
    }
    onSubtaskTitleClicked(subtaskIdx: number) {
        this.editingSubtaskIdx = subtaskIdx

        requestAnimationFrame(() => {
            const inputTextElem = getElemById(`todo-subtask-title-id--${subtaskIdx}`) as HTMLInputElement
            inputTextElem!.focus()
        })

        this.updateTaskViewState({ 
            editingSubtaskIdx: this.editingSubtaskIdx,
            newText: this.newText
        })
    }
    onTaskedClicked(event: Event, taskIdx: number) {
        if (window.getSelection()?.toString()) return
        
        if (this.hasJustClosedContextMenu) {
            this.hasJustClosedContextMenu = false
            return
        }
        
        const target = event.target as HTMLElement
        
        if (["INPUT", "TEXTAREA", "P", "I", "H3", "SPAN", "BUTTON", "svg", "circle", "path"].includes(target.tagName)) {
            this.toggleInputBlurred(false)
            return
        }
        
        if (this.hasInputBlurred) {
            this.toggleInputBlurred(false)
        }
        else if (taskIdx === this.pickedTaskIdx) {
            this.removeHighlightedTask()
        }
        else {
            this.removeHighlightedTask()
            this.expandTask(taskIdx)
        }
    }
    handleTaskCheckboxClicked(taskIdx: number) {
        this.tasks[taskIdx].isFinished = !this.tasks[taskIdx].isFinished

        if (this.tasks[taskIdx].isFinished) {
            this.taskCheckBoxJustChecked = taskIdx
        }

        this.updateTaskViewState({ tasks: this.tasks })
    }
    handleSubtaskCheckboxClicked(subtaskIdx: number) {
        const subtask = this.getSubtask(this.pickedTaskIdx, subtaskIdx)
        subtask.isFinished = !subtask.isFinished

        if (subtask.isFinished) {
            this.subtaskCheckBoxJustChecked = subtaskIdx
        }

        this.updateTaskViewState({ tasks: this.tasks })
    }

    /* UI Input Handlers */
    toggleTaskTitleInput() {
        this.isEditingTitle = true
        this.newText = this.tasks[this.pickedTaskIdx].title

        requestAnimationFrame(() => { 
            const inputTitleElem = getElemById(`todo-title-id--${this.pickedTaskIdx}`) as HTMLInputElement
            inputTitleElem.focus()
        })

        this.updateTaskViewState({ 
            isEditingTitle: this.isEditingTitle
        })
    }
    toggleTextArea() {
        requestAnimationFrame(() => {
            this.isEditingDescription = true
            this.updateTaskViewState({ 
                isEditingDescription: this.isEditingDescription 
            })
        })
    }
    inputTextHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement | HTMLTextAreaElement
        const targetClass = inputElem.classList.value

        this.newText = inputElem.value

        if (targetClass.includes("description")) {
            inputElem.style.height = "5px"
            inputElem.style.height = (inputElem.scrollHeight) + "px"
    
            requestAnimationFrame(() => this.updateTaskHeight())
        }
    }
    onInputFocusHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        if (targetClass.includes("subtask-title-input")) {
            this.newText = this.getSubtask(this.pickedTaskIdx, this.editingSubtaskIdx).title
        }
        else if (targetClass.includes("new-task-group-title-input")) {
            this.newText = this.taskGroups[this.pickedTaskGroupIdx]
            this.isNewTaskGroupFocused = true
            this.updateTaskViewState({ isNewTaskGroupFocused: true })   
        }
        else if (targetClass.includes("title-input")) {
            this.newText = this.tasks[this.pickedTaskIdx].title
        }
        else if (targetClass.includes("description")) {
            this.newText = this.tasks[this.pickedTaskIdx].description!
        }
    }
    onInputBlurHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        if (this.hasUsedEditShortcut) {
            this.hasUsedEditShortcut = false
            return
        }

        this.hasJustClosedContextMenu = false

        // Input Shortcut Pressed 
        if (targetClass.includes("subtask-title-input")) {
            this.saveNewSubtask()
        }
        else if (targetClass.includes("title-input")) {
            this.saveNewTitle()
        }
        else if (targetClass.includes("description")) {
            this.saveNewDescription()
        }

        this.toggleInputBlurred(true)
    }
    toggleInputBlurred(hasInputBlurred: boolean) {
        this.hasInputBlurred = hasInputBlurred
    }

    /* Menu Handlers */
    closeContextMenu() {
        this.contextMenuX = -1
        this.contextMenuY = -1
        this.rightClickedSubtask = null
        this.rightClickedTask = null
        this.hasJustClosedContextMenu = true

        this.updateTaskViewState({
            contextMenuX: this.contextMenuX,
            contextMenuY: this.contextMenuY,
            rightClickedSubtask: this.rightClickedSubtask,
            rightClickedTask: this.rightClickedTask,
        })
    }

    /**
     * 
     * @param event         Right click event
     * @param taskIdx       Task idx user has right clicked
     * @param subtaskIdx    Subtask idx whose settings btn user has right clicked. Will be < 0 if user clicked on task instead.
     *                      If subtask object was clicked, the idx is captured from the id of target elem. 
     * @returns 
     */
    toggleContextMenu(event: MouseEvent, taskIdx: number, subtaskIdx = -1) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        
        if (["INPUT", "TEXTAREA", "H3", "SPAN"].includes(target.tagName) || targetClass.includes("checkbox")) { 
            this.contextMenuX = -1
            this.contextMenuY = -1
            return
        }

        event.preventDefault()
        
        this.contextMenuX = subtaskIdx >= 0 ? MAX_X_CONTEXT_MENU_POS : Math.min(event.offsetX, MAX_X_CONTEXT_MENU_POS)
        this.contextMenuY = event.clientY

        if (targetClass.includes("subtask") || subtaskIdx >= 0) {
            const clickedSubtaskIdx = subtaskIdx >= 0 ? subtaskIdx : parseInt(target.id.split("--")[1])
            this.rightClickedSubtask = { subtask: this.getSubtask(taskIdx, subtaskIdx), idx: clickedSubtaskIdx }
        }
        else {
            this.rightClickedTask = { task: this.tasks[taskIdx], idx: taskIdx }
        }

        this.updateTaskViewState({
            contextMenuX: this.contextMenuX,
            contextMenuY: this.contextMenuY,
            rightClickedSubtask: this.rightClickedSubtask,
            rightClickedTask: this.rightClickedTask,
        })
    }
    contextMenuHandler(option: ContextMenuOption) {
        if (option === ContextMenuOption.ADD_SUBTASK) {
            this.expandTask(this.rightClickedTask!.idx)
            this.isAddingNewSubtask = true
            this.addNewSubtask(this.rightClickedTask!.idx)

            const newSubTaskIdx = this.tasks[this.rightClickedTask!.idx].subtasks.length - 1
            this.editingSubtaskIdx = newSubTaskIdx

            requestAnimationFrame(() => {
                const newSubtaskInputElem = getElemById(`todo-subtask-title-id--${newSubTaskIdx}`)
                setTimeout(() => newSubtaskInputElem!.focus(), 500)
            })
        }
        else if (option === ContextMenuOption.DELETE_TASK) {
            const newTasks = this.tasks.filter((_: Task, idx: number) => idx != this.rightClickedTask!.idx)
            this.tasks = newTasks

            this.removeHighlightedTask()
        }
        else {
            this.removeSubtask(this.pickedTaskIdx, this.rightClickedSubtask!.idx)
        }

        this.updateTaskViewState({
            editingSubtaskIdx: this.editingSubtaskIdx,
            isAddingNewSubtask: this.isAddingNewSubtask,
        })

        this.closeContextMenu()
    }

    /* Groups */
    taskGroupDropdownHandler(taskGroup: string) {

    }
    toggleNewGroupInputFocus() {
        this.isNewTaskGroupFocused = !this.isNewTaskGroupFocused
        this.updateTaskViewState({ isNewTaskGroupFocused: this.isNewTaskGroupFocused })
    }
    saveNewTaskGroupTitle(doSave: boolean) {

        this.newText = ""

        this.updateTaskViewState({ 
            newText: "",
            isEditingGroup: false,
            isMakingNewGroup: false
        })
    }

    /* Misc. Handlers */
    toggleSpellCheck() {
        this.textAreaHasSpellCheck = !this.textAreaHasSpellCheck
        this.updateTaskViewState({ textAreaHasSpellCheck: this.textAreaHasSpellCheck })
    }
    tasksSettingsHandler(optionsIdx: TaskSettingsOptions) {
        if (optionsIdx === TaskSettingsOptions.MAKE_NEW_TASK_GROUP) {
            this.isMakingNewGroup = true
        }
        else if (optionsIdx === TaskSettingsOptions.RENAME_TASK_GROUP) {
            this.isEditingGroup = true
        }
        else {

        }

        this.updateTaskViewState({
            isMakingNewGroup: this.isMakingNewGroup,
            isEditingGroup: this.isEditingGroup
        })

        requestAnimationFrame(() => {
            if (!this.isMakingNewGroup && !this.isEditingGroup) return
            const elem = getElemById(`task-group-input`)! as HTMLInputElement
            elem.focus()

            elem.value = this.isEditingGroup ? this.tasks[this.pickedTaskGroupIdx].title : ""
        })
    }

    /* Task Updates */
    saveNewTitle(doSave = true) {
        if (doSave && this.newText) {
            this.tasks[this.pickedTaskIdx].title = this.newText
        }
        else if (!doSave && this.isMakingNewTask || doSave && !this.newText) {
            this.removeTask(this.pickedTaskIdx)
            this.removeHighlightedTask()
        }

        this.newText = ""
        this.isEditingTitle = false
        this.isMakingNewTask = false

        this.updateTaskViewState({ 
            tasks: this.tasks,
            isEditingTitle: this.isEditingTitle,
            isMakingNewTask: this.isMakingNewTask,
            newText: this.newText
        })
    }
    saveNewDescription(doSave = true) {
        if (doSave) {
            this.tasks[this.pickedTaskIdx].description = this.newText
        }
        else {
            const descriptInputElem = getElemById(`todo-description-input-id--${this.pickedTaskIdx}`) as HTMLTextAreaElement
            descriptInputElem.value = this.tasks[this.pickedTaskIdx].description!

            descriptInputElem.style.height = "5px"
            descriptInputElem.style.height = (descriptInputElem.scrollHeight) + "px"
        }

        this.newText = ""
        this.textAreaHasSpellCheck = false

        requestAnimationFrame(() => this.updateTaskHeight())

        this.updateTaskViewState({ 
            newText: this.newText,
            tasks: this.tasks,
            textAreaHasSpellCheck: this.textAreaHasSpellCheck
        })
    }
    addNewTaskBtnHandler() {
        this.removeHighlightedTask()
        this.toggleInputBlurred(false)
        this.tasks.unshift({ title: "", description: "", isFinished: false, subtasks: [] })
        this.isMakingNewTask = true
        this.hasJustClosedContextMenu = false

        requestAnimationFrame(() => this.onTaskTitleClicked(0))

        this.updateTaskViewState({ 
            isMakingNewTask: this.isMakingNewTask,
            tasks: this.tasks,
        })
    }
    removeTask(taskIdx: number) {
        this.tasks = this.tasks.filter((_: SubTask, idx: number) => idx != taskIdx)
        this.updateTaskViewState({ tasks: this.tasks })

        if (this.pickedTaskIdx >= 0) {
            this.removeHighlightedTask()
        }

        requestAnimationFrame(() => this.updateTaskHeight())

        this.focusedTaskIdx = Math.max(0, this.focusedTaskIdx - 1)
        this.updateTaskViewState({ focusedTaskIdx: this.focusedTaskIdx })

        if (this.tasks.length === 0) {
            this.focusedTaskIdx = -1
        }

        if (this.focusedTaskIdx < 0) return
        requestAnimationFrame(() => this.focusTaskElem(`todo-id--${this.focusedTaskIdx}`))
    }
    expandTask(taskIdx: number) {
        this.pickedTaskIdx = taskIdx
        this.focusedTaskIdx = taskIdx
        this.updateTaskViewState({ pickedTaskIdx: this.pickedTaskIdx })

        requestAnimationFrame(() => this.updateTaskHeight())
        requestAnimationFrame(() => this.toggleTextArea())

        if (this.focusedTaskIdx < 0) return
        requestAnimationFrame(() => this.focusTaskElem(`todo-id--${this.focusedTaskIdx}`))
    }
    getSubtasks(taskIdx: number) {
        return this.tasks[taskIdx].subtasks
    }
    updateTaskHeight() {
        let minTaskHeight = TASK_HEIGHT_MIN_NO_DESCR
        let subtasksHeight = 0
        let subtasksTopPadding = 0

        // Description
        let descriptionIdStr = ""
        if (this.isEditingDescription) {
            descriptionIdStr = `todo-description-input-id--${this.pickedTaskIdx}`
        }
        else {
            descriptionIdStr = `todo-description-id--${this.pickedTaskIdx}`
        }

        const descriptionElement = getElemById(descriptionIdStr)! as HTMLElement
        this.pickedTaskDescriptionHT = descriptionElement?.clientHeight || 15

        // Subtasks
        if (this.tasks[this.pickedTaskIdx].subtasks.length > 0) {
            const subtasksListElement = getElemById(`todo-subtasks-id--${this.pickedTaskIdx}`)! as HTMLElement
            
            subtasksHeight = subtasksListElement.clientHeight + subtasksTopPadding
            subtasksTopPadding = getElemNumStyle(subtasksListElement, "padding-top")

            this.hookContainerHT = this.pickedTaskDescriptionHT + subtasksTopPadding + SUBTASK_HEIGHT / 2 + 4
            this.hooklineOffset = this.hookContainerHT
        }

        const totalHt = this.pickedTaskDescriptionHT + subtasksHeight + minTaskHeight
        const taskElement = getElemById(`todo-id--${this.pickedTaskIdx}`)! as HTMLElement
        const isSameHt = taskElement.clientHeight === totalHt

        this.pickedTaskHT = isSameHt ? totalHt : totalHt + TASK_BOTTOM_PADDING

        this.updateTaskViewState({
            pickedTaskHT: this.pickedTaskHT,
            pickedTaskDescriptionHT: this.pickedTaskDescriptionHT,
            hookContainerHT: this.hookContainerHT,
            hooklineOffset: this.hooklineOffset
        })
    }
    removeHighlightedTask() {
        this.isEditingTitle = false
        this.isEditingDescription = false
        this.pickedTaskIdx = -1
        this.editingSubtaskIdx = -1

        this.pickedTaskDescriptionHT = 0
        this.pickedTaskHT = 0
        this.taskCheckBoxJustChecked = -1
        this.subtaskCheckBoxJustChecked = -1
        this.focusedSubtaskIdx = -1

        this.updateTaskViewState({ 
            isEditingTitle: this.isEditingTitle,
            isEditingDescription: this.isEditingDescription,
            pickedTaskIdx: this.pickedTaskIdx,
            editingSubtaskIdx: this.editingSubtaskIdx,
            focusedSubtaskIdx: this.focusedSubtaskIdx,

            pickedTaskDescriptionHT: this.pickedTaskDescriptionHT,
            pickedTaskHT: this.pickedTaskHT,
            taskCheckBoxJustChecked: this.taskCheckBoxJustChecked,
            subtaskCheckBoxJustChecked: this.subtaskCheckBoxJustChecked,
        })
    }
    focusTaskElem(focusElemId: string) {
        const taskElem = getElemById(focusElemId)!
        taskElem.focus()
        
        taskElem.addEventListener('blur', this.focusedTaskOnBlurHandler)
        taskElem.addEventListener('focus', this.refocusTaskElem)
    }
    refocusTaskElem = (event: FocusEvent) => {
        if (event.relatedTarget) return
    
        this.focusedTaskIdx = this.prevFocusedTodoIdx
        this.updateTaskViewState({ focusedTaskIdx: this.prevFocusedTodoIdx })
    }
    focusedTaskOnBlurHandler = (event: FocusEvent) => {
        const relatedTarget = event.relatedTarget as HTMLElement
        const taskElement = event.target as HTMLElement

        // do not remove listeners when user clicks outside of app, they will be needed on refocus
        if (relatedTarget != null) {
            taskElement.removeEventListener('blur', this.focusedTaskOnBlurHandler)
            taskElement.removeEventListener('focus', this.refocusTaskElem)
        }

        this.prevFocusedTodoIdx = this.focusedTaskIdx
        this.updateTaskViewState({ prevFocusedTodoIdx: this.focusedTaskIdx })

        if (!relatedTarget || relatedTarget?.tagName === "LI") return
        this.resetCurrentFocusedTaskdx()
    }
    resetCurrentFocusedSubtaskIdx() {
        this.focusedSubtaskIdx = -1
        this.updateTaskViewState({ focusedSubtaskIdx: this.focusedSubtaskIdx })
    }
    resetCurrentFocusedTaskdx() {
        this.focusedTaskIdx = -1
        this.updateTaskViewState({ focusedTaskIdx: this.focusedTaskIdx })
    }

    /* Subtasks Updates */
    getSubtask(taskIdx: number, subtaskIdx: number): SubTask {
        return this.tasks[taskIdx].subtasks[subtaskIdx]
    }
    addNewSubtask(taskIdx: number) {
        this.tasks[taskIdx].subtasks.push({ title: "", isFinished: false })

        this.updateTaskViewState({ tasks: this.tasks })
        requestAnimationFrame(() => this.updateTaskHeight())
    }
    removeSubtask(taskIdx: number, subTaskIdx: number) {
        const subtasks = this.tasks[taskIdx].subtasks
        const newSubtasks = subtasks.filter((_: SubTask, idx: number) => idx != subTaskIdx)

        this.tasks[this.pickedTaskIdx].subtasks = newSubtasks
        this.updateTaskViewState({ tasks: this.tasks })

        requestAnimationFrame(() => this.updateTaskHeight())
    }
    removeFocusedSubtask() {
        this.removeSubtask(this.pickedTaskIdx, this.focusedSubtaskIdx)

        this.focusedSubtaskIdx = Math.max(0, this.focusedSubtaskIdx - 1)
        this.updateTaskViewState({ focusedSubtaskIdx: this.focusedSubtaskIdx })

        if (this.getSubtasks(this.pickedTaskIdx).length === 0) {
            this.resetCurrentFocusedSubtaskIdx()
        }
    }
    saveNewSubtask(doSave = true) {
        if (doSave && this.newText) {
            this.tasks[this.pickedTaskIdx].subtasks[this.editingSubtaskIdx].title = this.newText
        }
        else if (!doSave && this.isAddingNewSubtask || doSave && !this.newText) {
            this.removeSubtask(this.pickedTaskIdx, this.editingSubtaskIdx)
        }
        
        this.editingSubtaskIdx = -1
        this.newText = ""
        this.isAddingNewSubtask = false

        this.updateTaskViewState({ 
            tasks: this.tasks,
            editingSubtaskIdx: this.editingSubtaskIdx,
            newText: this.newText,
            isAddingNewSubtask: this.isAddingNewSubtask
        })
    }

    /* Focus Functionality */
    handleArrowkeyPressed(key: string) {
        let isForSubtasks = this.pickedTaskIdx >= 0
        let subtasklength = 0

        if (isForSubtasks) {
            subtasklength = this.getSubtasks(this.pickedTaskIdx).length
            isForSubtasks = isForSubtasks && subtasklength > 0 && this.focusedTaskIdx === this.pickedTaskIdx            
        }

        if (isForSubtasks) {
            this.updateSubTaskFocusIdx(key)
        }
        else {
            this.updateTaskFocusIdx(key)
        }
    }
    updateSubTaskFocusIdx(key: string) {
        const subtasklength = this.getSubtasks(this.pickedTaskIdx).length

        if (key === "ArrowUp") {
            this.focusedSubtaskIdx = Math.max(this.focusedSubtaskIdx, 0)
            this.focusedSubtaskIdx--

            if (this.focusedSubtaskIdx < 0)  {
                this.resetCurrentFocusedSubtaskIdx()
                this.updateTaskFocusIdx(key)
                return
            }
        } else if (key === "ArrowDown") {
            this.focusedSubtaskIdx++

            if (this.focusedSubtaskIdx === subtasklength) {
                this.resetCurrentFocusedSubtaskIdx()
                this.updateTaskFocusIdx(key)
                return
            }
        }

        // this.focusTaskElem(`subtask-idx--${this.focusedSubtaskIdx}`)  .focus() for subtask elem fails to work
        this.updateTaskViewState({ focusedSubtaskIdx: this.focusedSubtaskIdx })
    }
    updateTaskFocusIdx(key: string) {
        const tasksLength = this.tasks.length
        if (tasksLength === 0) return

        if (key === "ArrowUp") {
            this.focusedTaskIdx--
            this.focusedTaskIdx = this.focusedTaskIdx < 0 ? tasksLength - 1 : this.focusedTaskIdx
        } else if (key === "ArrowDown") {
            this.focusedTaskIdx++
            this.focusedTaskIdx = this.focusedTaskIdx === tasksLength ? 0 : this.focusedTaskIdx
        }
        
        this.focusTaskElem(`todo-id--${this.focusedTaskIdx}`)
        this.updateTaskViewState({ focusedTaskIdx: this.focusedTaskIdx })
    }

    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value
        const key = event.key
        const tag = target.tagName

        // GENERAL SHORTCUTS
        if (["BODY", "LI"].includes(tag) && key === "ArrowUp" || key === "ArrowDown") {
            this.handleArrowkeyPressed(key)
        }
        else if (!["INPUT", "TEXTAREA"].includes(tag) && key === "Escape") {
            this.removeHighlightedTask()
        }

        const isEditing = ["INPUT", "TEXTAREA"].includes(tag)
        const isEditShortCut = (key === "Enter" || key ==="Escape") && isEditing

        // EDITING SHORTCUTS
        if (isEditShortCut && targetClass.includes("subtask")) {
            this.saveNewSubtask(key === "Enter")
        }
        else if (isEditShortCut && targetClass.includes("task")) {
            this.saveNewTaskGroupTitle(key === "Enter")
        }
        else if (isEditShortCut && targetClass.includes("title")) {
            this.saveNewTitle(key === "Enter")
        }
        else if (isEditShortCut && targetClass.includes("description")) {
            this.saveNewDescription(key === "Enter")
        }

        if (isEditShortCut) {
            this.hasUsedEditShortcut = true
            target.blur()
        }

        // FOCUSED IDX SHORTCUTS
        const focusedIdx = this.focusedTaskIdx
        if (focusedIdx < 0 || isEditing) return

        const focusedSubtaskIdx = this.focusedSubtaskIdx
        const pickedTaskIdx = this.pickedTaskIdx
        const taskElement = getElemById(`todo-id--${focusedIdx}`)! as HTMLElement
        const hasFocusedSubtask = focusedSubtaskIdx >= 0

        if (key === "Backspace" && !hasFocusedSubtask) {
            this.removeTask(focusedIdx)
        }
        else if (key === "Backspace" && hasFocusedSubtask) {
            this.removeFocusedSubtask()
        }
        else if (key === "Enter" && !hasFocusedSubtask) {
            this.handleTaskCheckboxClicked(focusedIdx)
        }
        else if (key === "Enter" && hasFocusedSubtask) {
            this.handleSubtaskCheckboxClicked(focusedSubtaskIdx)
        }
        else if (key === "Escape") {
            taskElement.blur()
            this.resetCurrentFocusedSubtaskIdx()
        }
        else if (event.code === "Space") {
            if (pickedTaskIdx >= 0) {
                this.removeHighlightedTask()
            }
            if (pickedTaskIdx < 0 || pickedTaskIdx >= 0 && pickedTaskIdx != focusedIdx) {
                this.expandTask(focusedIdx)
            }
        }
    }

    /**
     * 
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be preserved.
     * Will only update the UI-relevant data that needs to be listned in the UI.
     * 
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(oldState: TasksViewManager, newState: Partial<TasksViewManager>): TasksViewManager {
        const newStateObj = oldState

        if (newState.pickedTaskIdx != undefined)             newStateObj.pickedTaskIdx = newState.pickedTaskIdx
        if (newState.pickedTaskHT != undefined)              newStateObj.pickedTaskHT = newState.pickedTaskHT
        if (newState.pickedTaskDescriptionHT != undefined)   newStateObj.pickedTaskDescriptionHT = newState.pickedTaskDescriptionHT
        if (newState.hookContainerHT != undefined)           newStateObj.hookContainerHT = newState.hookContainerHT
        if (newState.hooklineOffset != undefined)            newStateObj.hooklineOffset = newState.hooklineOffset
        if (newState.isEditingDescription != undefined)      newStateObj.isEditingDescription = newState.isEditingDescription
        if (newState.isEditingTitle != undefined)            newStateObj.isEditingTitle = newState.isEditingTitle
        if (newState.editingSubtaskIdx != undefined)         newStateObj.editingSubtaskIdx = newState.editingSubtaskIdx
        if (newState.taskCheckBoxJustChecked != undefined)   newStateObj.taskCheckBoxJustChecked = newState.taskCheckBoxJustChecked
        if (newState.subtaskCheckBoxJustChecked != undefined)   newStateObj.subtaskCheckBoxJustChecked = newState.subtaskCheckBoxJustChecked
        if (newState.tasks != undefined)                        newStateObj.tasks = newState.tasks
        if (newState.textAreaHasSpellCheck != undefined)        newStateObj.textAreaHasSpellCheck = newState.textAreaHasSpellCheck
        if (newState.rightClickedTask != undefined)             newStateObj.rightClickedTask = newState.rightClickedTask
        if (newState.contextMenuX != undefined)                 newStateObj.contextMenuX = newState.contextMenuX
        if (newState.contextMenuY != undefined)                 newStateObj.contextMenuY = newState.contextMenuY
        if (newState.isAddingNewSubtask != undefined)           newStateObj.isAddingNewSubtask = newState.isAddingNewSubtask
        if (newState.isMakingNewTask != undefined)              newStateObj.isMakingNewTask = newState.isMakingNewTask
        if (newState.focusedTaskIdx != undefined)               newStateObj.focusedTaskIdx = newState.focusedTaskIdx
        if (newState.focusedSubtaskIdx != undefined)            newStateObj.focusedSubtaskIdx = newState.focusedSubtaskIdx
        if (newState.newText != undefined)                      newStateObj.newText = newState.newText
        if (newState.isNewTaskGroupFocused != undefined)        newStateObj.isNewTaskGroupFocused = newState.isNewTaskGroupFocused

        return newStateObj
    }
}