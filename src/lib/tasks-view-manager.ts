import { tasksViewStore } from "./store";
import { ContextMenuOption, TaskSettingsOptions, RightSideTab } from "./enums"
import { getElemById, getElemNumStyle } from "./utils-general"
import { 
        MAX_X_CONTEXT_MENU_POS, SUBTASK_HEIGHT, 
        TASK_BOTTOM_PADDING, TASK_HEIGHT_MIN_NO_DESCR 
} from "$lib/utils-right-bar"


/**
 * State handler for tasks view in the right side bar.
 * Is itself a svelte store that Tasks component listens to for changes.
 */
export class TasksViewManager {
    /* Groups */
    taskGroups: TaskGroup[] = []
    currTaskGroupIdx = -1
    isNewTaskGroupFocused = false
    isMakingNewGroup = false
    isEditingGroup = false
    editingTaskGroupIdx = -1
    
    /* Tasks */
    tasks: Task[] | null = null
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

    constructor(taskGroups: TaskGroup[]) {
        this.taskGroups = taskGroups
        this.currTaskGroupIdx = taskGroups.length === 0 ? -1 : 0
        this.tasks = taskGroups.length === 0 ? null : this.taskGroups[0].tasks

        tasksViewStore.set(this)
2
        this.updateTaskViewState({
            taskGroups,
            currTaskGroupIdx: this.currTaskGroupIdx,
            tasks: this.tasks!
        })
    }

    updateTaskViewState(newState: Partial<TasksViewManager>) {
        tasksViewStore.update((data: TasksViewManager | null) => {
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
    onTaskTitleClicked(taskIdx: number) {
        if (window.getSelection()?.toString()) return
        this.expandTask(taskIdx)

        this.isEditingTitle = true

        requestAnimationFrame(() => { 
            const inputTitleElem = getElemById(`todo-title-id--${this.pickedTaskIdx}`) as HTMLInputElement
            inputTitleElem.focus()
        })

        this.updateTaskViewState({ 
            isEditingTitle: this.isEditingTitle,
        })
    }

    /**
     * Task list item component's subtask title element on click handler.
     * Immediately focuses new subtask title input.
     * Will not work if user has highlighted subtask title.
     * 
     * @param taskIdx   Subtask idx of task component
     */
    onSubtaskTitleClicked(subtaskIdx: number) {
        if (window.getSelection()?.toString()) return

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

    /**
     * Task elemen on click handler. Only used for expansion and minimization of task.
     * Expands clicked task if not expanded and minimizes otherwise.
     * Will not expand if user has selectde title.
     * 
     * @param event      On click event.
     * @param taskIdx    Idx of task selected.
     */
    onTaskedClicked(event: Event, taskIdx: number) {
        if (window.getSelection()?.toString()) {
            return
        }
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
            this.minimizeExpandedTask()
        }
        else {
            this.minimizeExpandedTask()
            this.expandTask(taskIdx)
        }
    }

    /**
     * Toggle a task's checkbox.
     * @param taskIdx  Idx of the the checkbock's task.
     */
    handleTaskCheckboxClicked(taskIdx: number) {
        this.tasks![taskIdx].isFinished = !this.tasks![taskIdx].isFinished

        if (this.tasks![taskIdx].isFinished) {
            this.taskCheckBoxJustChecked = taskIdx
        }

        this.updateTaskViewState({ tasks: this.tasks! })
    }

    /**
     * Toggle a subtask's checkbox.
     * @param taskIdx  Idx of the the subtask's checkbock's task.
     */
    handleSubtaskCheckboxClicked(subtaskIdx: number) {
        const subtask = this.getSubtask(this.pickedTaskIdx, subtaskIdx)!
        subtask.isFinished = !subtask.isFinished

        if (subtask.isFinished) {
            this.subtaskCheckBoxJustChecked = subtaskIdx
        }

        this.updateTaskViewState({ tasks: this.tasks! })
    }

    /* UI Input Handlers */

    /**
     * Toggles description text area input element.
     * Will change task to an editing-description-state. 
     * Will stay that way until task is minimized for ease of use.
     */
    toggleTextArea() {
        requestAnimationFrame(() => {
            this.isEditingDescription = true
            this.updateTaskViewState({ isEditingDescription: this.isEditingDescription })
        })
    }

    /**
     * Input handler for all inputs in tasks view.
     * For editing task titles, subtask titles, descriptions, & task groups.
     * For description, updates the task height in real time.
     * 
     * @param event    Input event.
     */
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

    /**
     * Input on focus handler for all inputs in tasks view.
     * Initializes shared input text variable.
     * 
     * @param event    Focus event.
     */
    onInputFocusHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value

        // close task group input when clicking on a new input
        if (!targetClass.includes("new-task-group-title-input") && (this.isEditingGroup || this.isMakingNewGroup)) {
            this.closeEditState()
        }

        if (targetClass.includes("subtask-title-input")) {
            this.newText = this.getSubtask(this.pickedTaskIdx, this.editingSubtaskIdx)!.title
        }
        else if (targetClass.includes("new-task-group-title-input")) {
            this.newText = this.isEditingGroup ? this.taskGroups[this.pickedTaskGroupIdx].title : ""

            // class styling modifier for focus styling as underline is outside of input elem
            this.isNewTaskGroupFocused = true
            this.updateTaskViewState({ isNewTaskGroupFocused: true })   
        }
        else if (targetClass.includes("title-input")) {
            this.newText = this.tasks![this.pickedTaskIdx].title
        }
        else if (targetClass.includes("description")) {
            this.newText = this.tasks![this.pickedTaskIdx].description!
        }
    }

    /**
     * Input on blur handler for all inputs in tasks view.
     * By default, focusing out of an input will save input text except for editing / making new group.
     * Focusing out will also not automatically minimize the task.
     * 
     * @param event    Focus event.
     */
    onInputBlurHandler(event: FocusEvent) {
        const target = event.target as HTMLElement
        const relatedTarget = event.relatedTarget as HTMLElement
        const targetClass = target.classList.value
        const relatedTargetClass = relatedTarget?.classList.value ?? ""

        // both using a shortcut and clicking away will cause a blur
        // this should only handle click-away blurs
        if (this.hasUsedEditShortcut) {
            this.hasUsedEditShortcut = false
            return
        }
        else if (relatedTargetClass.includes("tab-btn")) {
            this.closeEditState()
            return
        }

        this.hasJustClosedContextMenu = false

        // Input Shortcut Pressed 
        if (targetClass.includes("subtask-title-input")) {
            this.saveNewSubtask()
        }
        else if (targetClass.includes("task-group-title-input")) {
            this.isNewTaskGroupFocused = false
            this.updateTaskViewState({ isNewTaskGroupFocused: false })
        }
        else if (targetClass.includes("title-input")) {
            this.saveNewTitle()
        }
        else if (targetClass.includes("description")) {
            this.saveNewDescription()
        }

        this.toggleInputBlurred(true)
    }

    /**
     * Triggered when an input element has been blurred.
     * Used to distinguish between focusing out of an input elem by click away vs. using an editing shortcut.
     * 
     * @param hasInputBlurred   An input eleme has been blurred.
     */
    toggleInputBlurred(hasInputBlurred: boolean) {
        this.hasInputBlurred = hasInputBlurred
    }

    /**
     * Close current editing state if there is one.
     */
    closeEditState() {

        // this should be first to handle close task group edit state when clicking on a new input elem
        if (this.isEditingGroup || this.isMakingNewGroup) {
            this.isEditingGroup = false
            this.isMakingNewGroup = false
            this.isNewTaskGroupFocused = false
            this.newText = ""

            this.updateTaskViewState({ 
                isEditingGroup: false, isMakingNewGroup: false, 
                isNewTaskGroupFocused: true, newText: ""
            })
        }
        else if (this.isEditingDescription) {
            this.isEditingDescription = false
            this.newText = ""

            this.updateTaskViewState({ isEditingDescription: false, newText: "" })
        }
        else if (this.isEditingTitle) {
            this.isEditingTitle = false
            this.newText = ""

            this.updateTaskViewState({ isEditingTitle: false, newText: "" })
        }
        else if (this.editingSubtaskIdx >= 0) {
            this.editingSubtaskIdx = -1
            this.newText = ""

            this.updateTaskViewState({  editingSubtaskIdx: -1, newText: "" })
        }
    }

    /* Menu Handlers */

    /**
     * Close an open context menu.
     */
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
     * Open a context menu. 
     * Two types, one for a task and subtask. Uses target element class to distinguish.
     * @param event         Right click event
     * @param taskIdx       Task idx user has right clicked
     * @param subtaskIdx    Subtask idx whose settings btn user has right clicked. Will be < 0 if user clicked on task instead.
     *                      If subtask elem itself was clicked, the idx will be captured from the id of target elem. 
     * @returns 
     */
    openMilestoneContextMenu(event: MouseEvent, taskIdx: number, subtaskIdx = -1) {
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
            this.rightClickedSubtask = { subtask: this.getSubtask(taskIdx, subtaskIdx)!, idx: clickedSubtaskIdx }
        }
        else {
            this.rightClickedTask = { task: this.tasks![taskIdx], idx: taskIdx }
        }

        this.updateTaskViewState({
            contextMenuX: this.contextMenuX,
            contextMenuY: this.contextMenuY,
            rightClickedSubtask: this.rightClickedSubtask,
            rightClickedTask: this.rightClickedTask,
        })
    }

    /**
     * Handler for context menu options.
     * @param option    Option user has clicked.
     */
    contextMenuHandler(option: ContextMenuOption) {
        if (option === ContextMenuOption.ADD_SUBTASK) {
            this.expandTask(this.rightClickedTask!.idx)
            this.isAddingNewSubtask = true
            this.addNewSubtask(this.rightClickedTask!.idx)

            const newSubTaskIdx = this.tasks![this.rightClickedTask!.idx].subtasks.length - 1
            this.editingSubtaskIdx = newSubTaskIdx

            requestAnimationFrame(() => {
                const newSubtaskInputElem = getElemById(`todo-subtask-title-id--${newSubTaskIdx}`)
                setTimeout(() => newSubtaskInputElem!.focus(), 500)
            })
        }
        else if (option === ContextMenuOption.DELETE_TASK) {
            const newTasks = this.tasks!.filter((_: Task, idx: number) => idx != this.rightClickedTask!.idx)
            this.tasks! = newTasks

            this.minimizeExpandedTask()
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

    /**
     * Get tasks from ta task group.
     * @param   taskGroupIdx  Task group idx whose tasks are desired.
     * @returns tasks of a given group
     */
    getTaskGroupTasks(taskGroupIdx: number) {
        return this.taskGroups[taskGroupIdx]
    }

    /**
     * Update current task group
     * @param taskGroupIdx 
     */
    updateTaskGroup(taskGroupIdx: number) {
        this.currTaskGroupIdx = taskGroupIdx
        this.tasks = taskGroupIdx < 0 ? null : this.taskGroups[taskGroupIdx].tasks

        if (this.pickedTaskGroupIdx >= 0) {
            this.minimizeExpandedTask()
        }
        if (this.focusedTaskIdx >= 0) {
            this.resetCurrentFocusedTaskdx()
        }

        this.updateTaskViewState({
            currTaskGroupIdx: this.currTaskGroupIdx,
            tasks: this.tasks
        })
    }

    /**
     * Saves current text in input as the new task group title.
     * Closes the current task-editing state.
     * Will not save if user has clicked 'Esc.'
     * 
     * @param doSave   Save the current text.
     */
    saveNewTaskGroupTitle(doSave: boolean) {
        if (doSave && this.isEditingGroup) {
            this.taskGroups[this.currTaskGroupIdx].title = this.newText
        }
        else if (doSave && this.isMakingNewGroup) {
            this.taskGroups.push({ title: this.newText, tasks: [] })
            this.updateTaskGroup(this.taskGroups.length - 1)
        }

        this.newText = ""
        this.isEditingGroup = false
        this.isMakingNewGroup = false

        this.updateTaskViewState({ 
            newText: "",
            isEditingGroup: false,
            isMakingNewGroup: false,
            taskGroups: this.taskGroups
        })
    }

    /**
     * Deletes current task group.
     */
    deleteTaskGroup() {
        this.taskGroups = this.taskGroups.filter((taskGroup: TaskGroup, idx: number) => this.currTaskGroupIdx != idx)
        const newTaskGroupIdx = this.taskGroups.length === 0 ? -1 : Math.max(this.currTaskGroupIdx - 1, 0)
        this.updateTaskGroup(newTaskGroupIdx)

        this.updateTaskViewState({ taskGroups: this.taskGroups })
    }

    /**
     * Task group dropdown list handler
     * @param taskGroupIdx   New task group idx.
     */
    taskGroupDropdownHandler(taskGroupIdx: number) {
        this.updateTaskGroup(taskGroupIdx)
    }

    /**
     * Settings handler for tasks view settings.
     * 
     * @param option   Option user has clicked. 
     */
    tasksSettingsHandler(option: TaskSettingsOptions) {
        if (option === TaskSettingsOptions.MAKE_NEW_TASK_GROUP) {
            this.isMakingNewGroup = true
        }
        else if (option === TaskSettingsOptions.RENAME_TASK_GROUP) {
            this.isEditingGroup = true
        }
        else {
            this.deleteTaskGroup()
        }

        this.updateTaskViewState({
            isMakingNewGroup: this.isMakingNewGroup,
            isEditingGroup: this.isEditingGroup
        })

        requestAnimationFrame(() => {
            if (!this.isMakingNewGroup && !this.isEditingGroup) return
            const elem = getElemById(`task-group-input`)! as HTMLInputElement
            elem.focus()

            elem.value = this.isEditingGroup ? this.tasks![this.pickedTaskGroupIdx].title : ""
        })
    }

    /* Misc. Handlers */

    /**
     * Toggle input description spell check.
     * True if focusing and false if blurred.
     * Used to give the illusion focusing and blurring will change textarea to p tag and vice-versa.
     */
    toggleSpellCheck() {
        this.textAreaHasSpellCheck = !this.textAreaHasSpellCheck
        this.updateTaskViewState({ textAreaHasSpellCheck: this.textAreaHasSpellCheck })
    }

    /* Task Updates */

    /**
     * Saves current text in input as the new task title.
     * Closes the current task-editing state.
     * Will not save if user has clicked 'Esc'
     * 
     * @param doSave   Save the current text.
     */
    saveNewTitle(doSave = true) {
        if (doSave && this.newText) {
            this.tasks![this.pickedTaskIdx].title = this.newText
        }
        else if (!doSave && this.isMakingNewTask || doSave && !this.newText) {
            this.removeTask(this.pickedTaskIdx)
            this.minimizeExpandedTask()
        }

        this.newText = ""
        this.isEditingTitle = false
        this.isMakingNewTask = false

        this.updateTaskViewState({ 
            tasks: this.tasks!,
            isEditingTitle: this.isEditingTitle,
            isMakingNewTask: this.isMakingNewTask,
            newText: this.newText
        })
    }

    /**
     * Saves current text in input as the new task description text.
     * Closes the current task-editing state.
     * Will not save if user has clicked 'Esc.'
     * 
     * @param doSave   Save the current text.
     */
    saveNewDescription(doSave = true) {
        if (doSave) {
            this.tasks![this.pickedTaskIdx].description = this.newText
        }
        else {
            const descriptInputElem = getElemById(`todo-description-input-id--${this.pickedTaskIdx}`) as HTMLTextAreaElement
            descriptInputElem.value = this.tasks![this.pickedTaskIdx].description!

            descriptInputElem.style.height = "5px"
            descriptInputElem.style.height = (descriptInputElem.scrollHeight) + "px"
        }

        this.newText = ""
        this.textAreaHasSpellCheck = false

        requestAnimationFrame(() => this.updateTaskHeight())

        this.updateTaskViewState({ 
            newText: this.newText,
            tasks: this.tasks!,
            textAreaHasSpellCheck: this.textAreaHasSpellCheck
        })
    }


    /**
     * Button handler for new task button.
     * Makes a new task and inserts it at the top.
     * This task elem receives the editing state.
     */
    addNewTaskBtnHandler() {
        this.minimizeExpandedTask()
        this.toggleInputBlurred(false)
        this.tasks!.unshift({ title: "", description: "", isFinished: false, subtasks: [] })
        this.isMakingNewTask = true
        this.hasJustClosedContextMenu = false

        requestAnimationFrame(() => this.onTaskTitleClicked(0))

        this.updateTaskViewState({ 
            isMakingNewTask: this.isMakingNewTask,
            tasks: this.tasks!,
        })
    }

    /**
     * Removes a given task.
     * @param taskIdx  Idx of task to be removed.
     */
    removeTask(taskIdx: number) {
        this.tasks! = this.tasks!.filter((_: Task, idx: number) => idx != taskIdx)

        // picked task idx may fall on a new one after deletion
        if (this.pickedTaskIdx >= 0) {
            this.minimizeExpandedTask()
        }

        requestAnimationFrame(() => this.updateTaskHeight())

        // if removed task is the current focus the prev task will be focuseds, next if the first is removed
        this.focusedTaskIdx = Math.max(0, this.focusedTaskIdx - 1)
        this.updateTaskViewState({ focusedTaskIdx: this.focusedTaskIdx, tasks: this.tasks! })

        if (this.tasks!.length === 0) {
            this.focusedTaskIdx = -1
        }

        if (this.focusedTaskIdx < 0) return
        requestAnimationFrame(() => this.focusTaskElem(`todo-id--${this.focusedTaskIdx}`))
    }

    /**
     * Expand a given task.
     * This expaned task will be the picked and focused one.
     * Sets the height of task based on its elements. 
     * This is done for the height animation as auto will not work.
     * 
     * @param taskIdx  Task idx of the task to be expanded.
     */
    expandTask(taskIdx: number) {
        this.pickedTaskIdx = taskIdx
        this.focusedTaskIdx = taskIdx
        this.updateTaskViewState({ pickedTaskIdx: this.pickedTaskIdx })

        requestAnimationFrame(() => this.updateTaskHeight())
        requestAnimationFrame(() => this.toggleTextArea())

        if (this.focusedTaskIdx < 0) return
        requestAnimationFrame(() => this.focusTaskElem(`todo-id--${this.focusedTaskIdx}`))
    }

    /**
     * Get the subtasks of a given task.
     * @param taskIdx  Idx of the task whose subtask is wanted.
     */
    getSubtasks(taskIdx: number) {
        return this.tasks![taskIdx].subtasks
    }

    /**
     * Updates the task height given using its children elements. 
     * Will be set to the height of the selected task elem.
     * Will change when a changes in its children will cause a task change.
     * This is done for the height animation as auto will not work.
     */
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
        if (this.tasks![this.pickedTaskIdx].subtasks.length > 0) {
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

    /**
     * Minimize current expanded task.
     */
    minimizeExpandedTask() {
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

    /**
     * Focus a given task elem id. Attach focus event listeners.
     * Used for tasks and subtasks.
     * @param focusElemId   The id of the task elem to be focused.
     */
    focusTaskElem(focusElemId: string) {
        const taskElem = getElemById(focusElemId)!
        taskElem.focus()
        
        taskElem.addEventListener('blur', this.focusedTaskOnBlurHandler)
        taskElem.addEventListener('focus', this.refocusTaskElem)
    }

    /**
     * Refocus to a task elem that has already been focused and blurred.
     * Used for tasks and subtasks.
     * @param event  Focus Event
     */
    refocusTaskElem = (event: FocusEvent) => {
        if (event.relatedTarget) return
    
        this.focusedTaskIdx = this.prevFocusedTodoIdx
        this.updateTaskViewState({ focusedTaskIdx: this.prevFocusedTodoIdx })
    }

    /**
     * Blur handler for when a current focused task loses focus.
     * Removes prev focused task if user does moves to a new focus task so blurs away from clicking away.
     * Removes also event listeners if necessary.
     * 
     * @param event  Focus Event
     */
    focusedTaskOnBlurHandler = (event: FocusEvent) => {
        const relatedTarget = event.relatedTarget as HTMLElement
        const taskElement = event.target as HTMLElement
        const isMovingToNewFocusTask = relatedTarget != null

        // do not remove listeners when user clicks away, they will be needed on refocus
        if (isMovingToNewFocusTask) {
            taskElement.removeEventListener('blur', this.focusedTaskOnBlurHandler)
            taskElement.removeEventListener('focus', this.refocusTaskElem)
        }

        this.prevFocusedTodoIdx = this.focusedTaskIdx
        this.updateTaskViewState({ prevFocusedTodoIdx: this.focusedTaskIdx })
    }

    /**
     * Removes current focused subtask.
     */
    resetCurrentFocusedSubtaskIdx() {
        this.focusedSubtaskIdx = -1
        this.updateTaskViewState({ focusedSubtaskIdx: this.focusedSubtaskIdx })
    }

    /**
     * Removes current focused task.
     */
    resetCurrentFocusedTaskdx() {
        this.focusedTaskIdx = -1
        this.updateTaskViewState({ focusedTaskIdx: this.focusedTaskIdx })
    }

    /* Subtasks Updates */

    /**
     * Get subtask
     * @param taskIdx     Task where desired subtask belongs.
     * @param subtaskIdx  Desired subtask
     * 
     * @returns Desired subtask
     */
    getSubtask(taskIdx: number, subtaskIdx: number): SubTask | null {
        return this.tasks![taskIdx].subtasks[subtaskIdx] ?? null
    }

    /**
     * Add a new subtask
     * @param taskIdx   Task idx of task where new subtask will belong.
     */
    addNewSubtask(taskIdx: number) {
        this.tasks![taskIdx].subtasks.push({ title: "", isFinished: false })

        this.updateTaskViewState({ tasks: this.tasks! })
        requestAnimationFrame(() => this.updateTaskHeight())
    }

    /**
     * Remove given subtask
     * @param taskIdx     Task where desired subtask to be removed belongs.
     * @param subtaskIdx  Subtask to be removed
     * 
     */
    removeSubtask(taskIdx: number, subTaskIdx: number) {
        const subtasks = this.tasks![taskIdx].subtasks
        const newSubtasks = subtasks.filter((_: SubTask, idx: number) => idx != subTaskIdx)

        this.tasks![this.pickedTaskIdx].subtasks = newSubtasks
        this.updateTaskViewState({ tasks: this.tasks! })

        requestAnimationFrame(() => this.updateTaskHeight())
    }

    /**
     * Remove current focused subtask.
     */
    removeFocusedSubtask() {
        this.removeSubtask(this.pickedTaskIdx, this.focusedSubtaskIdx)

        this.focusedSubtaskIdx = Math.max(0, this.focusedSubtaskIdx - 1)
        this.updateTaskViewState({ focusedSubtaskIdx: this.focusedSubtaskIdx })

        if (this.getSubtasks(this.pickedTaskIdx).length === 0) {
            this.resetCurrentFocusedSubtaskIdx()
        }
    }

    /**
     * Closes the current task-editing state.
     * Saves current text in input as the new subtask title.
     * Will not save if user has clicked 'Esc.'
     * 
     * @param doSave  Do save current changes.
     */
    saveNewSubtask(doSave = true) {
        if (doSave && this.newText) {
            this.tasks![this.pickedTaskIdx].subtasks[this.editingSubtaskIdx].title = this.newText
        }
        else if (!doSave && this.isAddingNewSubtask || doSave && !this.newText) {
            this.removeSubtask(this.pickedTaskIdx, this.editingSubtaskIdx)
        }
        
        this.editingSubtaskIdx = -1
        this.newText = ""
        this.isAddingNewSubtask = false

        this.updateTaskViewState({ 
            tasks: this.tasks!,
            editingSubtaskIdx: this.editingSubtaskIdx,
            newText: this.newText,
            isAddingNewSubtask: this.isAddingNewSubtask
        })
    }

    /* Focus Functionality */

    /**
     * Up and down key pressed handler. Used for both subtasks and tasks.
     * Will be for subtasks if there is an expanded task, there are subtasks in it, expanded is focused.
     * @param key   Arrow key pressed.
     */
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

    /**
     * Update the current subtask focus idx. 
     * Increments or decrements depending on which key is pressed.
     * Will reset and move to a prev or text task if idx goes out of bounds.
     * @param key   Left or right key
     */
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

        this.updateTaskViewState({ focusedSubtaskIdx: this.focusedSubtaskIdx })
    }

    /**
     * Update the current focus idx. 
     * Increments or decrements depending on which key is pressed.
     * @param key   Left or right key
     */
    updateTaskFocusIdx(key: string) {
        const tasksLength = this.tasks!.length
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

    /**
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const targetClass = target.classList.value
        const key = event.key
        const tag = target.tagName

        // prevent scroll when editing
        if (event.code === "Space" && tag != "INPUT" && tag != "TEXTAREA") {
            event.preventDefault()
        }

        // GENERAL SHORTCUTS
        if (["BODY", "LI"].includes(tag) && key === "ArrowUp" || key === "ArrowDown") {
            event.preventDefault()                  // don't allow arrow keys to move scroll
            this.handleArrowkeyPressed(key)
        }
        else if (!["INPUT", "TEXTAREA"].includes(tag) && key === "Escape") {
            this.minimizeExpandedTask()
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
            // click away blur and edit shortcut blur must be separate
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
                this.minimizeExpandedTask()
            }
            if (pickedTaskIdx < 0 || pickedTaskIdx >= 0 && pickedTaskIdx != focusedIdx) {
                this.expandTask(focusedIdx)
            }
        }
    }

    /* Misc. */
    hasTabBarClicked() {
        this.focusedSubtaskIdx = -1
        
        if (this.focusedTaskIdx >= 0) {
            this.resetCurrentFocusedTaskdx()
        }
        if (this.pickedTaskGroupIdx >= 0) {
            this.minimizeExpandedTask()
        }

        this.closeEditState()

        this.updateTaskViewState({ focusedSubtaskIdx: -1 })
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
        if (newState.currTaskGroupIdx != undefined)             newStateObj.currTaskGroupIdx = newState.currTaskGroupIdx
        if (newState.taskGroups != undefined)                   newStateObj.taskGroups = newState.taskGroups
        if (newState.isEditingGroup != undefined)               newStateObj.isEditingGroup = newState.isEditingGroup
        if (newState.isMakingNewGroup != undefined)             newStateObj.isMakingNewGroup = newState.isMakingNewGroup

        return newStateObj
    }
}