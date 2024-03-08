import { writable, type Writable } from "svelte/store"
import { extractNum, getElemById, getElemNumStyle, moveElementInArr } from "./utils-general"

export class TasksListManager {
    options: TaskListOptionsInterface
    state: Writable<TasksListManager>
    types: Record<TaskListType, boolean> = {
        "subtasks-linked": false,
        "tasks-linked": false,
        "flexible": false,
        "ordered": false
    }
    listContainer: HTMLElement | null = null

    /* Tasks */
    tasks: Task[]
    floatingTask: Task | null = null
    pickedTaskIdx = -1
    pickedTaskHT: number = 0
    pickedTaskDescriptionHT = 0
    pickedTaskGroupIdx = 0

    /* Dragging Functionality */
    leftOffset = -1
    floatTaskStyling: {
        height: string,
        padding: string,
        borderWidth: string
    } | null = null
    floatingTaskElem: HTMLElement | null = null
    dragOverTaskElem: HTMLElement | null = null
    dragOverTaskIdx = -1
     
    taskCheckBoxJustChecked = -1
    isMakingNewTask = false
    isEditingTitle = false
    isTextAreaActive = false
    focusedTaskIdx = -1
    prevFocusedTodoIdx = -1

    floatingTaskOffset: { left: number, top: number } | null = null

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
    isContextMenuOpen = false
    contextMenuX: number | null = null
    contextMenuY: number | null = null

    rightClickedTask: null | { task: Task, idx: number }  = null
    rightClickedSubtask: null | { subtask: Subtask, idx: number } = null
    
    /* UI */
    cursorPos = { left: 0, top: 0 }
    hasUsedEditShortcut = false
    isDraggingTask = false

    textAreaHasSpellCheck = false
    hasInputBlurred = false

    FLOATING_WIDTH_PERCENT = 0.75
    FLOATING_MAX_SIDE_OFFSET = 10
    FLOATING_CLIENT_Y_TOP_OFFSET = 150

    /* Constants */
    TASK_DESCR_LINE_HT = 15
    TASK_BOTTOM_PADDING = 7
    SUBTASK_HEIGHT = 15
    DESCRIPTION_BOTTOM_PADDING = 6
    DESCRIPTION_TOP_PADDING = 4
    DESCRIPTON_MIN_HEIGHT = 20
    HOOK_HEIGHT_OFFSET = 3
    
    TASK_HEIGHT_MIN_NO_DESCR = 34
    TASK_HEIGHT_MIN_HAS_DESCR = this.TASK_HEIGHT_MIN_NO_DESCR + this.TASK_DESCR_LINE_HT
    
    MAX_TITLE_LENGTH = 50
    MAX_TAK_GROUP_TITLE_LENGTH = 10
    MAX_DESCRIPTION_LENGTH = 300
    MAX_X_CONTEXT_MENU_POS = 70

    constructor(options: TaskListOptionsInterface) {
        this.options = options
        this.tasks = options.tasks

        this.types["flexible"] = options.type.includes("flexible")
        this.types["ordered"] = options.type.includes("ordered")
        this.types["tasks-linked"] = options.type.includes("tasks-linked")
        this.types["subtasks-linked"] = options.type.includes("subtasks-linked")
        
        this.state = writable(this)
    }

    initListContainer(listContainer: HTMLUListElement) {
        this.listContainer = listContainer
    }

    update(newState: Partial<TasksListManager>) {
        this.state.update((data: TasksListManager | null) => this.getNewStateObj(data!, newState))
    }

    /* Task Updates */

    /**
     * Saves current text in input as the new task title.
     * Closes the current task-editing state.
     */
    saveNewTitle() {
        this.tasks![this.pickedTaskIdx].title = this.newText || "Untitled"
        this.newText = ""
        this.isEditingTitle = false
        this.isMakingNewTask = false

        this.update({ 
            tasks: this.tasks!,
            isEditingTitle: this.isEditingTitle,
            isMakingNewTask: this.isMakingNewTask,
            newText: this.newText
        })
    }

    /**
     * Saves current text in input as the new task description text.
     * Closes the current task-editing state.
     */
    saveNewDescription() {
        this.tasks![this.pickedTaskIdx].description = this.newText
        this.newText = ""
        this.textAreaHasSpellCheck = false
        
        this.update({ 
            newText: this.newText,
            tasks: this.tasks!,
            textAreaHasSpellCheck: this.textAreaHasSpellCheck
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
        this.update({ focusedTaskIdx: this.focusedTaskIdx, tasks: this.tasks! })

        if (this.tasks!.length === 0) {
            this.focusedTaskIdx = -1
        }

        if (this.focusedTaskIdx < 0) return
        requestAnimationFrame(() => this.focusTaskElem(`task-id--${this.focusedTaskIdx}`))
    }

    /**
     * Button handler for new task button.
     * Makes a new task and inserts it at the top.
     * This task elem receives the editing state.
     */
    addNewTaskBtnHandler() {
        this.minimizeExpandedTask()
        this.toggleInputBlurred(false)
        this.tasks!.unshift({ 
            title: "", description: "", isChecked: false, subtasks: [], id: "", idx: this.tasks.length 
        })
        this.isMakingNewTask = true

        requestAnimationFrame(() => this.onTaskTitleClicked(0))

        this.update({ 
            isMakingNewTask: this.isMakingNewTask,
            tasks: this.tasks!,
        })
    }

    updateTaskIdx = () => {
        let fromIdx = this.floatingTask!.idx
        let toIdx = this.dragOverTaskIdx

        // let cutOffIdx = $editGoalManger!.milestones.length - $editGoalManger!.milestonesDone 

        // if (fromIdx > cutOffIdx) {
        //     return false
        // }

        // floating going up will take dest idx place
        // floating going down will take drag over's top nbr
        if (fromIdx < toIdx) {
            toIdx = Math.max(0, toIdx - 1)
        }

        this.moveTask(fromIdx, Math.min(toIdx, this.tasks.length - 1))
    }

    moveTask = (fromIdx: number, toIndex: number) => {
        this.tasks = moveElementInArr(this.tasks, fromIdx, toIndex)
        this.updateTaskIndices()
    }
    
    updateTaskIndices = () => {
        this.tasks = this.tasks.map((task, idx) => ({ ...task, idx }))
        this.update({ tasks: this.tasks })
    }

    /**
     * Get the subtasks of a given task.
     * @param taskIdx  Idx of the task whose subtask is wanted.
     */
    getSubtasks(taskIdx: number) {
        return this.tasks![taskIdx].subtasks
    }
    
    /**
     * @param   taskIdx 
     * @returns Queried task
     */
    getTask(taskIdx: number) {
        return this.tasks.find((task) => task.idx === taskIdx)
    }


    /* Subtasks Updates */

    /**
     * Get subtask
     * @param taskIdx     Task where desired subtask belongs.
     * @param subtaskIdx  Desired subtask
     * 
     * @returns Desired subtask
     */
    getSubtask(taskIdx: number, subtaskIdx: number): Subtask | null {
        return this.tasks![taskIdx].subtasks[subtaskIdx] ?? null
    }

    /**
     * Add a new subtask
     * @param taskIdx   Task idx of task where new subtask will belong.
     */
    addNewSubtask(idx: number) {
        this.tasks![idx].subtasks.push({ 
            id: "",
            taskId: "",
            idx,
            isChecked: false,
            title: ""
        })

        this.update({ tasks: this.tasks! })
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
        const newSubtasks = subtasks.filter((_, idx: number) => idx != subTaskIdx)

        this.tasks![this.pickedTaskIdx].subtasks = newSubtasks
        this.update({ tasks: this.tasks! })

        requestAnimationFrame(() => this.updateTaskHeight())
    }

    /**
     * Remove current focused subtask.
     */
    removeFocusedSubtask() {
        this.removeSubtask(this.pickedTaskIdx, this.focusedSubtaskIdx)

        this.focusedSubtaskIdx = Math.max(0, this.focusedSubtaskIdx - 1)
        this.update({ focusedSubtaskIdx: this.focusedSubtaskIdx })

        if (this.getSubtasks(this.pickedTaskIdx).length === 0) {
            this.resetCurrentFocusedSubtaskIdx()
        }
    }

    /**
     * Closes the current task-editing state.
     * Saves current text in input as the new subtask title.
     */
    saveNewSubtask() {
        this.tasks![this.pickedTaskIdx].subtasks[this.editingSubtaskIdx].title = this.newText || "Untitled"
        this.editingSubtaskIdx = -1
        this.newText = ""
        this.isAddingNewSubtask = false

        this.update({ 
            tasks: this.tasks!,
            editingSubtaskIdx: this.editingSubtaskIdx,
            newText: this.newText,
            isAddingNewSubtask: this.isAddingNewSubtask
        })
    }

    /* Task Visiblity  */

    /**
     * Updates the current text area height based on its content.
     * @param textAreaElemm  Active text area element.
     */
    updateTextAreaDescriptionHeight(textAreaElemm: HTMLTextAreaElement) {
        textAreaElemm.style.height = "5px"
        textAreaElemm.style.height = (textAreaElemm.scrollHeight) + "px"
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
        if (taskIdx === this.pickedTaskIdx) return

        this.pickedTaskIdx = taskIdx
        this.focusedTaskIdx = taskIdx
        this.update({ pickedTaskIdx: this.pickedTaskIdx })

        // toggle text area
        this.isTextAreaActive = true
        this.update({ isTextAreaActive: this.isTextAreaActive })

        // once text area has replaced the p tag, init its height to calculate that the expanded task height
        requestAnimationFrame(() => {
            const textAreaElem = this.getActiveTextAreaElement(this.pickedTaskIdx)
            this.updateTextAreaDescriptionHeight(textAreaElem)

            this.updateTaskHeight()
        })

        requestAnimationFrame(() => this.focusTaskElem(`task-id--${this.focusedTaskIdx}`))
    }

    /**
     * Updates the task height given using its children elements. 
     * Will be set to the height of the selected task elem.
     * Will change when a changes in its children will cause a task change.
     * This is done for the height animation to will not work.
     */
    updateTaskHeight() {
        if (this.pickedTaskIdx < 0) return

        let minTaskHeight = this.TASK_HEIGHT_MIN_NO_DESCR
        let subtasksHeight = 0
        let subtasksTopPadding = 0

        /* Description */
        
        const descriptionElement = getElemById(`task-description-input-id--${this.pickedTaskIdx}`)! as HTMLTextAreaElement
        const taskPadding = this.DESCRIPTION_BOTTOM_PADDING + this.DESCRIPTION_TOP_PADDING
        
        this.pickedTaskDescriptionHT = (descriptionElement!.clientHeight || 15)
        this.pickedTaskDescriptionHT += taskPadding

        /* Subtasks */
        if (this.tasks![this.pickedTaskIdx].subtasks.length > 0) {
            const subtasksListElement = getElemById(`task-subtasks-id--${this.pickedTaskIdx}`)! as HTMLElement
            
            subtasksHeight = subtasksListElement.clientHeight + subtasksTopPadding
            subtasksTopPadding = getElemNumStyle(subtasksListElement, "padding-top")

            this.hookContainerHT = this.pickedTaskDescriptionHT + subtasksTopPadding + (this.SUBTASK_HEIGHT / 2) + this.HOOK_HEIGHT_OFFSET
            this.hooklineOffset = this.hookContainerHT
        }

        const totalHt = this.pickedTaskDescriptionHT + subtasksHeight + minTaskHeight
        const taskElement = getElemById(`task-id--${this.pickedTaskIdx}`)! as HTMLElement
        const isSameHt = taskElement.clientHeight === totalHt

        this.pickedTaskHT = isSameHt ? totalHt : totalHt + this.TASK_BOTTOM_PADDING

        this.update({
            pickedTaskHT: this.pickedTaskHT,
            pickedTaskDescriptionHT: this.pickedTaskDescriptionHT,
            hookContainerHT: this.hookContainerHT,
            hooklineOffset: this.hooklineOffset
        })
    }

    /**
     * Minimize current expanded task. Reset all data set from expanded task.
     */
    minimizeExpandedTask() {
        this.isEditingTitle = false
        this.isTextAreaActive = false
        this.pickedTaskIdx = -1
        this.editingSubtaskIdx = -1

        this.pickedTaskDescriptionHT = 0
        this.pickedTaskHT = 0
        this.taskCheckBoxJustChecked = -1
        this.subtaskCheckBoxJustChecked = -1
        this.focusedSubtaskIdx = -1

        this.update({ 
            isEditingTitle: this.isEditingTitle,
            isTextAreaActive: this.isTextAreaActive,
            pickedTaskIdx: this.pickedTaskIdx,
            editingSubtaskIdx: this.editingSubtaskIdx,
            focusedSubtaskIdx: this.focusedSubtaskIdx,

            pickedTaskDescriptionHT: this.pickedTaskDescriptionHT,
            pickedTaskHT: this.pickedTaskHT,
            taskCheckBoxJustChecked: this.taskCheckBoxJustChecked,
            subtaskCheckBoxJustChecked: this.subtaskCheckBoxJustChecked,
        })
    }

    /* Task UI Handlers */

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
            const inputTitleElem = getElemById(`task-title-id--${this.pickedTaskIdx}`) as HTMLInputElement
            inputTitleElem.focus()
        })

        this.update({ 
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
            const inputTextElem = getElemById(`task-subtask-title-id--${subtaskIdx}`) as HTMLInputElement
            inputTextElem!.focus()
        })

        this.update({ 
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
        this.tasks![taskIdx].isChecked = !this.tasks![taskIdx].isChecked

        if (this.tasks![taskIdx].isChecked) {
            this.taskCheckBoxJustChecked = taskIdx
        }

        this.update({ tasks: this.tasks! })
    }

    /**
     * Toggle a subtask's checkbox.
     * @param taskIdx  Idx of the the subtask's checkbock's task.
     */
    handleSubtaskCheckboxClicked(subtaskIdx: number) {
        const subtask = this.getSubtask(this.pickedTaskIdx, subtaskIdx)!
        subtask.isChecked = !subtask.isChecked

        if (subtask.isChecked) {
            this.subtaskCheckBoxJustChecked = subtaskIdx
        }

        this.update({ tasks: this.tasks! })
    }

    onMouseMove = (event: MouseEvent) => {
        // update cursor pos
        const rectTop = this.listContainer!.getBoundingClientRect().top
        const rectLeft = this.listContainer!.getBoundingClientRect().left
        
        let left = event.clientX - rectLeft
        let top  =  event.clientY - rectTop

        this.cursorPos = { left, top }
        const tasksList = [...this.listContainer!.childNodes]

        // dragging task
        let taskIdx = -1
        let taskElem: HTMLElement | null = null

        tasksList.forEach((taskItem, idx) => {
            const _taskItem = taskItem as HTMLElement
            const topEdgePosition = _taskItem.offsetTop
            const bottomEdgePosition = topEdgePosition + _taskItem.clientHeight
            const isFloating = _taskItem.className?.includes("task--floating")

            if (!isFloating && top >= topEdgePosition && top <= bottomEdgePosition && _taskItem.id) {
                taskIdx = +_taskItem.id.split("--")[1]
                taskElem = taskItem as HTMLElement
                return
            }
        })

        // floating element
        if (!this.isDraggingTask || taskIdx > this.tasks.length) return

        // init floaing element
        if (!this.floatingTask && taskElem) {
            this.initDragLeftOffset(left)

            this.floatingTaskElem = taskElem
            this.hideFloatingSrcElem()

            this.floatingTask = this.getTask(taskIdx)!
            this.update({ floatingTask: this.floatingTask })
        }

        if (taskElem && taskIdx != this.floatingTask!.idx) {
            this.initDragOverElem(taskIdx, taskElem as HTMLElement)
        }

        // do update floating position
        if (this.floatingTask) {
            this.updateFloatingTaskPos(left, top)
        }
    }


    /**
     * Set the task element being dragged over.
     * @param taskIdx        Idx position of element being dragged over
     * @param taskItemElem   HTML element of task
     */
    initDragOverElem(taskIdx: number, taskItemElem: HTMLElement) {
        if (this.dragOverTaskIdx === taskIdx) return

        if (this.dragOverTaskElem) {
            this.dragOverTaskElem.classList.remove("task--drag-over")
        }

        this.dragOverTaskIdx  = taskIdx
        this.dragOverTaskElem = taskItemElem
        this.dragOverTaskElem!.classList.add("task--drag-over")
    }

    /**
     * Initialize the left offset position based on the initial x position of cursor when user first drags after a touch down.
     * This will be used to ensure that the drag point will be on the position the user has clicked and not always int he top right corner.
     * @param left   Initial left position.
     */
    initDragLeftOffset(left: number) {
        const listWidth = this.listContainer!.clientWidth
        const floatingTaskWidth = listWidth * this.FLOATING_WIDTH_PERCENT
        const isOutsideFloatingTask = left > floatingTaskWidth
        
        let xOffset = 0  // move to the right offset

        if (isOutsideFloatingTask) {
            xOffset = listWidth - floatingTaskWidth  // move to right by gap diff
            this.leftOffset = left - xOffset 
        }
        else {
            xOffset = 10
            this.leftOffset = left < 10 ? left : left - xOffset
        }
    }

    /**
     * Update the floating position of the flaoting task element.
     * @param left 
     * @param top 
     */
    updateFloatingTaskPos(left: number, top: number) {
        const listWidth = this.listContainer!.clientWidth
        const floatingTaskWidth = listWidth * this.FLOATING_WIDTH_PERCENT
        
        left -= this.leftOffset
        
        // prevent floating task from going over the right edge
        const floatingTaskRightEdge = left + floatingTaskWidth
        const isOnRightEdge  = floatingTaskRightEdge > listWidth - this.FLOATING_MAX_SIDE_OFFSET
        const prevLeft = this.floatingTaskOffset?.left ?? left - this.FLOATING_MAX_SIDE_OFFSET
        left = isOnRightEdge ? prevLeft : left
        
        this.floatingTaskOffset = { 
            top: top - 15, 
            left: Math.max(left, this.FLOATING_MAX_SIDE_OFFSET)
        }
        this.update({ 
            floatingTaskOffset: this.floatingTaskOffset 
        })
    }

    /**
     * On task element mouse down. 
     * If a valid touch locatino for drag then allow drag and prevent pointer event from taking over and expanind task.
     * @param event 
     * @returns 
     */
    onTaskMouseDown = (event: MouseEvent) => {
        if (event.button != 0) return
        const target    = event.target as HTMLElement
        const allowDrag = target.tagName === "LI" || 
                          target.classList.value.includes("task__right") || 
                          target.classList.value.includes("task__left")

        this.isDraggingTask = allowDrag
        if (this.floatingTask) event.preventDefault()
    }
    
    /**
     * On task list mouse up. Complete drag action if there was one.
     * @returns 
     */
    onTaskListMouseUp = () => {
        // allow on click to take over
        this.isDraggingTask = false 
        if (!this.floatingTask) return
        
        if (this.dragOverTaskElem) {
            this.updateTaskIdx()

            this.dragOverTaskIdx = -1
            this.dragOverTaskElem?.classList.remove("task--drag-over")
            this.dragOverTaskElem = null
        }

        // this will cause a height transition change animation
        this.showFloatingSrcElem()
        
        // do not the height transition by letting floating task state stay active to disallow transition animation
        requestAnimationFrame(() => { 
            this.floatingTask = null
            this.update({ floatingTask: null })
        })

        this.pickedTaskIdx = -1
        this.leftOffset = -1
        this.floatingTaskOffset = null

        this.update({ floatingTaskOffset: null })
    }

    /**
     * The dragging task source will be hidden when the (ghost) floating element is initialized
     * @param taskElem   Original HTML element of floating element.
     */
    hideFloatingSrcElem() {
        this.floatTaskStyling = {
            height: `${this.floatingTaskElem!!.style.height}`,
            padding: `${this.floatingTaskElem!!.style.padding}`,
            borderWidth: `${this.floatingTaskElem!!.style.borderWidth}`
        }

        this.floatingTaskElem!.style.height = "0px"
        this.floatingTaskElem!.style.padding = "0px 0px"
        this.floatingTaskElem!.style.borderWidth = "0px"
        this.floatingTaskElem!.style.opacity = "0"
        this.floatingTaskElem!.style.visibility = "hidden"
    }

    /**
     * Show the hidden task elem again. This HTML element will be taken over by the task below it.
     */
    showFloatingSrcElem() {
        this.floatingTaskElem!.style.height = this.floatTaskStyling!.height
        this.floatingTaskElem!.style.padding =  this.floatTaskStyling!.padding
        this.floatingTaskElem!.style.borderWidth = this.floatTaskStyling!.borderWidth
        this.floatingTaskElem!.style.opacity = "1"
        this.floatingTaskElem!.style.visibility = "visible"
        this.floatingTaskElem!.classList.remove("task--expanded")
    }

    /* Focus Functionality */

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
        this.update({ focusedTaskIdx: this.prevFocusedTodoIdx })
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
        this.update({ prevFocusedTodoIdx: this.focusedTaskIdx })
    }

    /**
     * Removes current focused subtask.
     */
    resetCurrentFocusedSubtaskIdx() {
        this.focusedSubtaskIdx = -1
        this.update({ focusedSubtaskIdx: this.focusedSubtaskIdx })
    }

    /**
     * Removes current focused task.
     */
    resetCurrentFocusedTaskdx() {
        this.focusedTaskIdx = -1
        this.update({ focusedTaskIdx: this.focusedTaskIdx })
    }

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

        this.update({ focusedSubtaskIdx: this.focusedSubtaskIdx })
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
        
        this.focusTaskElem(`task-id--${this.focusedTaskIdx}`)
        this.update({ focusedTaskIdx: this.focusedTaskIdx })
    }

    /* UI Input Handlers */

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
            this.updateTextAreaDescriptionHeight(inputElem as HTMLTextAreaElement)
            requestAnimationFrame(() => this.updateTaskHeight())
        }
    }

    getActiveTextAreaElement(taskIdx: number) {
        return getElemById(`task-description-input-id--${taskIdx}`)! as HTMLTextAreaElement
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
        if (targetClass.includes("subtask__title-input")) {
            this.newText = this.getSubtask(this.pickedTaskIdx, this.editingSubtaskIdx)!.title
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
        const targetClass = target.classList.value

        // Input Shortcut Pressed 
        if (targetClass.includes("subtask__title-input")) {
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
        if (this.isEditingTitle) {
            this.isEditingTitle = false
            this.newText = ""

            this.update({ isEditingTitle: false, newText: "" })
        }
        else if (this.editingSubtaskIdx >= 0) {
            this.editingSubtaskIdx = -1
            this.newText = ""

            this.update({  editingSubtaskIdx: -1, newText: "" })
        }
    }

    /**
     * Toggle input description spell check.
     * True if focusing and false if blurred.
     * Used to give the illusion focusing and blurring will change textarea to p tag and vice-versa.
     */
    toggleSpellCheck() {
        this.textAreaHasSpellCheck = !this.textAreaHasSpellCheck
        this.update({ textAreaHasSpellCheck: this.textAreaHasSpellCheck })
    }
    

    /* Context Menus */

    /**
     * Fired everytimee user clicks outside context menu.
     * Will fire everytime as context menu is always on the DOM.
     * So do not close if there is no active context menu.
     */
    onContextMenuClickedOutsideHandler = () => {
        if (!this.isContextMenuOpen) return

        this.closeContextMenu()
    }

    /**
     * Close (hide) context menu and reset all data set from invoking the context menu.
     */
    closeContextMenu = () => {
        this.isContextMenuOpen = false
        this.update({ isContextMenuOpen: false })
        
        // allow for dropdown-menu fade out animation to finish
        setTimeout(() => {
            this.contextMenuX = null
            this.contextMenuY = null
            this.rightClickedSubtask = null
            this.rightClickedTask = null
            this.hasJustClosedContextMenu = true

            this.update({
                rightClickedSubtask: this.rightClickedSubtask,
                rightClickedTask: this.rightClickedTask,
                contextMenuX: this.contextMenuX,
                contextMenuY: this.contextMenuY
            })
        }, 100)
    }

    /**
     * Open a context menu. 
     * Two types, one for a task and subtask. Uses target element class to distinguish.
     * @param event         Pointer event from right click
     * @param taskIdx       Task idx user has right clicked
     * @param subtaskIdx    Subtask idx whose settings btn user has right clicked. Will be < 0 if user clicked on task instead.
     *                      If subtask elem itself was clicked, the idx will be captured from the id of target elem. 
     * @returns
     */
    openContextMenu = (event: Event, taskIdx: number, subtaskIdx = -1) => {
        if (this.isContextMenuOpen) {
            this.closeContextMenu()
            return
        }

        const pe = event as PointerEvent
        const target = pe.target as HTMLElement
        const targetClass = target.classList.value
        pe.preventDefault()

        if (["INPUT", "TEXTAREA", "H3", "SPAN"].includes(target.tagName) || targetClass.includes("checkbox")) { 
            this.contextMenuX = -1
            this.contextMenuY = -1
            return
        }

        this.contextMenuX = this.cursorPos.left - 15
        this.contextMenuY = this.cursorPos.top + 10

        // make sure dropdown menu stays in bounds
        const listContainerWidth = this.listContainer!.clientWidth
        const contextWidthStr    = this.options.contextMenuOptions.width
        const contextWidthStrVal = extractNum(contextWidthStr)[0]
        const dropdownWidth      = contextWidthStr.includes("px") ? contextWidthStrVal : ((contextWidthStrVal / 100) * listContainerWidth)
        const dropdownRightEdge  = dropdownWidth + this.cursorPos.left

        if (dropdownRightEdge >= listContainerWidth) {
            const xOffset = dropdownRightEdge - listContainerWidth
            this.contextMenuX -= xOffset
        }
        
        // task or subtask context menu
        if (targetClass.includes("subtask") || subtaskIdx >= 0) {
            const clickedSubtaskIdx = subtaskIdx >= 0 ? subtaskIdx : parseInt(target.id.split("--")[1])
            this.rightClickedSubtask = { subtask: this.getSubtask(taskIdx, subtaskIdx)!, idx: clickedSubtaskIdx }
        }
        else {
            this.rightClickedTask = { task: this.tasks![taskIdx], idx: taskIdx }
        }

        this.update({
            contextMenuY: this.contextMenuY, 
            contextMenuX: this.contextMenuX,
            rightClickedSubtask: this.rightClickedSubtask,
            rightClickedTask: this.rightClickedTask,
            isContextMenuOpen: true
        })
    }

    /**
     * Fired after user clicks on an option from Task or Subtask dropdown menu
     * @param optionIdx   Idx of clicked option.
     */
    contextMenuOptionClickedHandler = (optionIdx: number) => {
        const isTaskContextMenu = this.rightClickedTask != null

        /* Task Context Menu */
        if (optionIdx === 0 && isTaskContextMenu) { 
            this.onTaskTitleClicked(this.rightClickedTask!.idx)
        }
        else if (optionIdx === 1 && isTaskContextMenu) { 
            this.isAddingNewSubtask = true
            this.expandTask(this.rightClickedTask!.idx)
            this.addNewSubtask(this.rightClickedTask!.idx)

            const newSubTaskIdx = this.tasks![this.rightClickedTask!.idx].subtasks.length - 1
            this.editingSubtaskIdx = newSubTaskIdx

            // select subtask input after expansion
            requestAnimationFrame(() => {
                const newSubtaskInputElem = getElemById(`task-subtask-title-id--${newSubTaskIdx}`)
                setTimeout(() => newSubtaskInputElem!.focus(), 500)
            })

            this.update({
                editingSubtaskIdx: this.editingSubtaskIdx,
                isAddingNewSubtask: this.isAddingNewSubtask
            })
        }
        else if (optionIdx === 2 && isTaskContextMenu) { 
            const newTasks = this.tasks!.filter((_: Task, idx: number) => idx != this.rightClickedTask!.idx)
            this.tasks! = newTasks
            this.minimizeExpandedTask()
        }

        /* Subtask Context Menu*/
        if (optionIdx === 0 && !isTaskContextMenu) {
            this.onSubtaskTitleClicked(this.rightClickedSubtask!.idx)   
        }
        else if (optionIdx === 1 && !isTaskContextMenu) {
            this.removeSubtask(this.pickedTaskIdx, this.rightClickedSubtask!.idx)
        }

        this.closeContextMenu()
    }

    /**
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
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
        const isEditShortCut = (key === "Enter" || key === "Escape") && isEditing

        if (isEditShortCut) {
            target.blur()
        }

        // FOCUSED IDX SHORTCUTS
        const focusedIdx = this.focusedTaskIdx
        if (focusedIdx < 0 || isEditing) return

        const focusedSubtaskIdx = this.focusedSubtaskIdx
        const pickedTaskIdx = this.pickedTaskIdx
        const taskElement = getElemById(`task-id--${focusedIdx}`)! as HTMLElement
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
    getNewStateObj(oldState: TasksListManager, newState: Partial<TasksListManager>): TasksListManager {
        const newStateObj = oldState

        if (newState.pickedTaskIdx != undefined)             newStateObj.pickedTaskIdx = newState.pickedTaskIdx
        if (newState.pickedTaskHT != undefined)              newStateObj.pickedTaskHT = newState.pickedTaskHT
        if (newState.pickedTaskDescriptionHT != undefined)   newStateObj.pickedTaskDescriptionHT = newState.pickedTaskDescriptionHT
        if (newState.hookContainerHT != undefined)           newStateObj.hookContainerHT = newState.hookContainerHT
        if (newState.hooklineOffset != undefined)            newStateObj.hooklineOffset = newState.hooklineOffset
        if (newState.isTextAreaActive != undefined)      newStateObj.isTextAreaActive = newState.isTextAreaActive
        if (newState.isEditingTitle != undefined)            newStateObj.isEditingTitle = newState.isEditingTitle
        if (newState.editingSubtaskIdx != undefined)         newStateObj.editingSubtaskIdx = newState.editingSubtaskIdx
        if (newState.taskCheckBoxJustChecked != undefined)   newStateObj.taskCheckBoxJustChecked = newState.taskCheckBoxJustChecked
        if (newState.subtaskCheckBoxJustChecked != undefined)   newStateObj.subtaskCheckBoxJustChecked = newState.subtaskCheckBoxJustChecked
        if (newState.tasks != undefined)                        newStateObj.tasks = newState.tasks
        if (newState.textAreaHasSpellCheck != undefined)        newStateObj.textAreaHasSpellCheck = newState.textAreaHasSpellCheck
        if (newState.rightClickedTask != undefined)             newStateObj.rightClickedTask = newState.rightClickedTask
        if (newState.isAddingNewSubtask != undefined)           newStateObj.isAddingNewSubtask = newState.isAddingNewSubtask
        if (newState.isMakingNewTask != undefined)              newStateObj.isMakingNewTask = newState.isMakingNewTask
        if (newState.focusedTaskIdx != undefined)               newStateObj.focusedTaskIdx = newState.focusedTaskIdx
        if (newState.focusedSubtaskIdx != undefined)            newStateObj.focusedSubtaskIdx = newState.focusedSubtaskIdx
        if (newState.newText != undefined)                      newStateObj.newText = newState.newText
        if (newState.floatingTaskOffset != undefined)           newStateObj.floatingTaskOffset = newState.floatingTaskOffset
        if (newState.floatingTask != undefined)                 newStateObj.floatingTask = newState.floatingTask

        if (newState.contextMenuX != undefined)                 newStateObj.contextMenuX = newState.contextMenuX
        if (newState.contextMenuY != undefined)                 newStateObj.contextMenuY = newState.contextMenuY
        if (newState.rightClickedSubtask != undefined)          newStateObj.rightClickedSubtask = newState.rightClickedSubtask
        if (newState.isContextMenuOpen != undefined)            newStateObj.isContextMenuOpen = newState.isContextMenuOpen

        return newStateObj
    }
}