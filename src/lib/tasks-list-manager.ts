import { writable, type Writable } from "svelte/store"
import { extractNum, findAncestorByClass, getElemById, getElemNumStyle, getElemsByClass, getElemTrueHeight, getElemTrueWidth, getVertScrollStatus, isEditTextElem, moveElementInArr } from "./utils-general"

type SubtaskLinkProp = {
    idx: number, height: number, width: number, top: number, left: number
}

export class TasksListManager {
    options: TaskListOptionsInterface
    state: Writable<TasksListManager>

    /* Options */
    types: Record<TaskListType, boolean> = {
        "subtasks-linked": false,
        "tasks-linked": false,
        "ordered": false,
        "dated": false,
        "subtasks": false
    }
    styling?: {
        list?: ElemDimensions
        task?: ElemDimensions
        subtask?: ElemDimensions
        checkbox?: ElemDimensions
        description?: ElemDimensions
        descriptionInput?: { fontSize: CSSREMVal }
    }
    ui: {
        showDragHandle: boolean
        hideTaskBtn: boolean
        isMin: boolean
        sidePadding: CSSUnitVal
        hasTaskDivider: boolean
    }
    cssVariables: {
        checkBoxFill: string
        checkBoxEmpty: string
        checkIcon: string
        taskBgColor: string
        taskHoverBgColor: string
        floatingTaskBgColor: string
    }

    /* Layout */
    taskLayout: { 
        topPadding: number, bottomPadding: number, leftSectionWidth: number 
    } | null = null

    tasksListContainer: HTMLElement | null = null
    tasksList: HTMLElement | null = null

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
    
    subtasksCheckedFromTaskCheck: number[] = []
    taskCheckBoxJustChecked = -1

    isMakingNewTask = false
    isEditingTitle = false
    isEditingDescription = false
    
    focusedTaskIdx = -1
    prevFocusedTodoIdx = -1

    floatingTaskOffset: { left: number, top: number } | null = null

    /* Subtasks */
    editingSubtaskIdx = -1
    subtaskCheckBoxJustChecked = -1
    isAddingNewSubtask = false
    subTaskLinkHt: number = 0
    frstSubTaskLinkOffset = 0
    focusedSubtaskIdx = -1

    /* Input Values */
    newText = ""
    
    /* Task Context Menu */
    hasJustClosedContextMenu = false
    isContextMenuOpen = false
    contextMenuX = -1000
    contextMenuY = -1000

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
    TASK_DESCR_LINE_HT = 20
    TASK_BOTTOM_PADDING = 20
    SUBTASK_HEIGHT = 15

    DESCRIPTION_BOTTOM_PADDING = 6
    DESCRIPTION_TOP_PADDING = 4
    DESCRIPTON_MIN_HEIGHT = 20

    HOOK_HEIGHT_OFFSET = 3
    
    TASK_HEIGHT_MIN_NO_DESCR: number
    TASK_HEIGHT_MIN_HAS_DESCR: number
    
    MAX_TITLE_LENGTH = 50
    MAX_TAK_GROUP_TITLE_LENGTH = 10
    MAX_DESCRIPTION_LENGTH = 300
    MAX_X_CONTEXT_MENU_POS = 70

    constructor(options: TaskListOptionsInterface) {
        this.options = options
        this.tasks = options.tasks

        // ui options
        this.ui = {
            showDragHandle: options.ui?.showDragHandle ?? true,
            hideTaskBtn: options.ui?.hideTaskBtn ?? false,
            isMin: options.ui?.isMin ?? true,
            sidePadding: options.ui?.sidePadding ?? "18px",
            hasTaskDivider: options.ui?.hasTaskDivider ?? true
        }

        // styling 
        this.styling = this.options.styling

        // css variables
        this.cssVariables = {
            checkBoxFill:     options.cssVariables?.checkBoxFill  ?? "rgba(var(--textColor1), 1)",
            checkBoxEmpty:    options.cssVariables?.checkBoxEmpty ?? "rgba(var(--textColor1), 0.25)",
            checkIcon:        options.cssVariables?.checkIcon     ?? "rgba(var(--textColor2), 1)",
            taskBgColor:      options.cssVariables?.taskBgColor   ?? "rgba(var(--textColor1), 1)",
            taskHoverBgColor: options.cssVariables?.taskHoverBgColor  ?? "rgba(var(--textColor1), 0.01)",
            floatingTaskBgColor: options.cssVariables?.floatingTaskBgColor ?? "#141414"
        }
        
        const setTaskHeight = this.styling?.task?.height

        this.TASK_HEIGHT_MIN_NO_DESCR  = setTaskHeight ? extractNum(setTaskHeight)[0] : 40
        this.TASK_HEIGHT_MIN_HAS_DESCR = this.TASK_HEIGHT_MIN_NO_DESCR + this.TASK_DESCR_LINE_HT

        // type
        this.types["subtasks"] = options.type.includes("subtasks")
        this.types["dated"] = options.type.includes("dated")
        this.types["ordered"] = options.type.includes("ordered")
        this.types["tasks-linked"] = options.type.includes("tasks-linked")
        this.types["subtasks-linked"] = options.type.includes("subtasks-linked")
        
        this.state = writable(this)
    }

    /**
     *  Get needed layout data from Task after mounted on the DOM 
     */
    initAfterLoaded() {
        this.tasksList = this.getElemById("tasks-list")!
        this.tasksListContainer = this.getElemById("tasks-list-container")!

        // task top padding
        const taskElem = getElemsByClass("task")![0] as HTMLElement
        const taskTopPadding = getElemNumStyle(taskElem, "padding-top")
        const bottomPadding = getElemNumStyle(taskElem, "padding-bottom")

        // left section width
        const taskLeftSectionElem = getElemsByClass("task__left")![0] as HTMLElement
        const taskLeftSectionElemWidth = getElemTrueWidth(taskLeftSectionElem)
        
        this.taskLayout = {
            topPadding: taskTopPadding,
            bottomPadding: bottomPadding,
            leftSectionWidth: taskLeftSectionElemWidth,
        }

        this.update({ taskLayout: this.taskLayout })
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
    saveNewDescription = () => {
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

    getCurrSubtasks() {
        return this.getSubtasks(this.pickedTaskIdx)!
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
        if (taskIdx < 0) return null

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
        if (taskIdx < 0 || subtaskIdx < 0) return null

        return this.tasks[taskIdx].subtasks![subtaskIdx] ?? null
    }

    /**
     * Add a new subtask
     * @param taskIdx   Task idx of task where new subtask will belong.
     */
    addNewSubtask(idx: number) {
        const taskSubtasks = this.tasks![idx].subtasks!
        taskSubtasks!.push({ 
            id: "",
            taskId: "",
            idx: taskSubtasks!.length,
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
        const subtasks = this.tasks![taskIdx].subtasks!
        let newSubtasks = subtasks.filter((_, idx: number) => idx != subTaskIdx)
        newSubtasks     = newSubtasks.map((subtask, idx: number) => ({ ...subtask, idx }))

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

        if (this.getSubtasks(this.pickedTaskIdx)!.length === 0) {
            this.resetCurrentFocusedSubtaskIdx()
        }
    }

    /**
     * Closes the current task-editing state.
     * Saves current text in input as the new subtask title.
     */
    saveNewSubtask() {
        this.tasks![this.pickedTaskIdx].subtasks![this.editingSubtaskIdx]!.title = this.newText || "Untitled"
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

        // once text area has replaced the p tag, init its height to calculate that the expanded task height
        requestAnimationFrame(() => {
            this.updateTaskHeight()
        })

        requestAnimationFrame(() => this.focusTaskElem(`task-id--${this.focusedTaskIdx}`))
    }

    getTaskElemHeight(id: string) {
        return this.getElemById(id)!.clientHeight
    }

    getHozDistanceBetweenTwoElems(a: HTMLElement, b: HTMLElement) {
        const aRect = a.getBoundingClientRect()
        const bRect = b.getBoundingClientRect()
        
        return  Math.abs(bRect.left - aRect.right)
    }

    getVertDistanceBetweenTwoElems(a: HTMLElement, b: HTMLElement) {
        const aRect = a.getBoundingClientRect()
        const bRect = b.getBoundingClientRect()
        
        return  Math.abs(bRect.top - aRect.bottom)
    }

    // M25 43 H9.66992 C4.69936 43 0.669922 38.9706 0.669922 34 V0.0244141
    // M16.2188 30.0801H9.66797C4.69741 30.0801 0.667969 26.0506 0.667969 21.0801V0.687744

    initSubtaskLink(prop: SubtaskLinkProp) {
        const linkElem = this.getElemById(`subtask-link-id--${prop.idx}`)!
        const svgElem = linkElem.firstChild! as SVGElement
        const pathElem = svgElem.firstChild as SVGPathElement

        linkElem.style.height = prop.height + 'px'
        linkElem.style.width  = prop.width + 'px'
        linkElem.style.top    = prop.top + 'px'
        linkElem.style.left   = prop.left + 'px'

        // svg container
        svgElem.setAttribute("width", prop.width + '')
        svgElem.setAttribute("height", (prop.height + 1) + '')

        // path
        pathElem.setAttribute("d", `M${prop.width} ${prop.height}H9.66992C4.69936 ${prop.height} 0.669922 ${prop.height - 4.0294} 0.669922 ${prop.height - 9}V0.0244141`)
    }

    initSubtasksLinks(isTyping = false) {
        const taskCheckBox = this.getElemById(`task-checkbox-id--${this.pickedTaskIdx}`)!
        let currCheckbox = this.getElemById(`subtask-checkbox-id--${0}`)!

        const taskCheckboxHeight = taskCheckBox.clientHeight
        const subTaskCheckboxMarginTop = getElemNumStyle(currCheckbox, "margin-top")
        const subtaskCheckboxHeight = currCheckbox.clientHeight + subTaskCheckboxMarginTop
        const BORDER_OFFSET = 2

        // at certain states the vertical distance will grow from the growth of checkbox bound top pos
        let vertDistanceOffset = isTyping ? -5 : 0

        if (isTyping || !isTyping && this.editingSubtaskIdx > 0) {   // typing or new (non first) subtask has just been added 
            vertDistanceOffset = -5
        }

        const hozDistance  = this.getHozDistanceBetweenTwoElems(taskCheckBox, currCheckbox) + BORDER_OFFSET
        let   vertDistance = this.getVertDistanceBetweenTwoElems(taskCheckBox, currCheckbox) + subTaskCheckboxMarginTop + vertDistanceOffset + BORDER_OFFSET

        const subtaskLinkWidth  = hozDistance + (taskCheckboxHeight / 2)
        let   subtaskLinkHeight = vertDistance + (subtaskCheckboxHeight / 2)
        let   vertOffset = -1 * (subtaskLinkHeight - (subtaskCheckboxHeight / 2))

        this.initSubtaskLink({
            idx: 0,
            height: subtaskLinkHeight,
            width: subtaskLinkWidth,
            top: vertOffset + 2,
            left: -1 * subtaskLinkWidth
        })

        for (let subtask of this.getCurrSubtasks()) {
            if (subtask.idx === 0) continue

            const isEditingSubtask =  this.editingSubtaskIdx === subtask.idx
            const isSecond = subtask.idx === 1
            const curveHeightOffset = 10
            const prevLink  =  this.getElemById(`subtask-link-id--${subtask.idx - 1}`)!
            currCheckbox    =  this.getElemById(`subtask-checkbox-id--${subtask.idx}`)!

            // at certain states the vertical distance will grow from the growth of checkbox bound top pos
            vertDistanceOffset = 0

            if (!isTyping && isSecond && this.editingSubtaskIdx < 0) {
                vertDistanceOffset = -6
            }
            else if (!isEditingSubtask) {            // non-editing subtasks
                vertDistanceOffset = -1
            }
            else if (isEditingSubtask && isTyping) { // editing a subtask + typing on field
                vertDistanceOffset = -2
            }
            else if (isEditingSubtask) {             // new subtask has just been added
                vertDistanceOffset = 3
            }

            vertDistance  = this.getVertDistanceBetweenTwoElems(prevLink, currCheckbox) + subTaskCheckboxMarginTop + vertDistanceOffset + BORDER_OFFSET
            subtaskLinkHeight = vertDistance + curveHeightOffset

            vertOffset = -1 * (subtaskLinkHeight - (subtaskCheckboxHeight / 2))

            this.initSubtaskLink({
                idx: subtask.idx ,
                height: subtaskLinkHeight,
                width:  subtaskLinkWidth,
                top: vertOffset + 2,
                left: -1 * subtaskLinkWidth
            })
        }
    }

    /**
     * Updates the task height given using its children elements. 
     * Will be set to the height of the selected task elem.
     * Will change when a changes in its children will cause a task change.
     * This is done for the height animation to will not work.
     */
    updateTaskHeight(isEditing = false) {
        if (this.pickedTaskIdx < 0) return

        /* Task Padding  */
        let height = this.taskLayout!.topPadding + this.taskLayout!.bottomPadding

        /* Title Editor */
        const titleElement = this.getElemById(`task-title-id--${this.pickedTaskIdx}`)!
        height += titleElement.clientHeight + 4

        /* Description Editor */
        const descriptionElement = this.getElemById(`task-description-input-id--${this.pickedTaskIdx}`)!
        height += descriptionElement.clientHeight

        /* Subtask Editor */
        const subtaskTitleElement = this.getElemById(`task-subtask-title-input-id--${this.editingSubtaskIdx}`)
        if (subtaskTitleElement) {
            height += subtaskTitleElement!.clientHeight
        }

        /* Rest of the Subtasks Height */
        let doGetSubtaskHeight = this.types["subtasks"] && this.tasks![this.pickedTaskIdx].subtasks!.length > 0

        if (doGetSubtaskHeight) {
            const subtasksListElement = this.getElemById(`task-subtasks-id--${this.pickedTaskIdx}`)!
            const subtaskTitleInputHeight = subtaskTitleElement?.clientHeight ?? 0
            
            const subtasksTopPadding = getElemNumStyle(subtasksListElement, "padding-top")
            const subtasksHeight = subtasksListElement.clientHeight + subtasksTopPadding - subtaskTitleInputHeight

            height += subtasksHeight
        }

        /* Connectors */
        if (doGetSubtaskHeight && this.types["subtasks-linked"]) {
            this.initSubtasksLinks(isEditing)
        }

        this.update({
            pickedTaskHT: height,
            subTaskLinkHt: this.subTaskLinkHt,
            frstSubTaskLinkOffset: this.frstSubTaskLinkOffset
        })
    }

    /**
     * Minimize current expanded task. Reset all data set from expanded task.
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
        this.subtasksCheckedFromTaskCheck = []

        this.update({ 
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

    /* Task UI Handlers */

    /**
     * Task list item component's title element on click handler.
     * Immediately focuses new title input.
     * Will not expand if user has selectde title.
     * 
     * @param taskIdx   Task idx of task component
     */
    onTaskTitleClicked(taskIdx: number) {
        this.expandTask(taskIdx)
        this.isEditingTitle = true

        requestAnimationFrame(() => { 
            const inputTitleElem = this.getElemById(`task-title-id--${this.pickedTaskIdx}`) as HTMLElement
            inputTitleElem.focus()
        })

        this.update({ 
            isEditingTitle: this.isEditingTitle,
        })
    }

    /**
     * Task list item component's title element on click handler.
     * Immediately focuses new title input.
     * Will not expand if user has selectde title.
     * 
     * @param taskIdx   Task idx of task component
     */
    onTaskDescriptionClicked(taskIdx: number) {
        this.expandTask(taskIdx)
        this.isEditingDescription = true

        requestAnimationFrame(() => { 
            const inputTitleElem = this.getElemById(`task-description-input-id--${this.pickedTaskIdx}`) as HTMLElement
            inputTitleElem.focus()
        })

        this.update({ 
            isEditingDescription: this.isEditingDescription,
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
            const inputTextElem = this.getElemById(`task-subtask-title-input-id--${subtaskIdx}`) as HTMLInputElement
            inputTextElem!.focus()
        })

        this.update({ editingSubtaskIdx: this.editingSubtaskIdx })
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
        
        if (["P", "I", "H3", "SPAN", "BUTTON", "svg", "circle", "path"].includes(target.tagName) || isEditTextElem(target)) {
            this.toggleInputBlurred(false)
            return
        }
        
        // dont minimize when clickout of an input
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
    handleTaskCheckboxClicked(pickedTask: Task) {
        let taskIdx = pickedTask.idx
        this.tasks![taskIdx].isChecked = !this.tasks![taskIdx].isChecked

        if (this.tasks![taskIdx].isChecked) {
            this.taskCheckBoxJustChecked = taskIdx
            let subtasks = this.getSubtasks(pickedTask.idx)!
            
            subtasks.forEach((subtask, idx) => { 
                if (subtask.isChecked) return

                this.subtasksCheckedFromTaskCheck.push(subtask.idx)
                subtasks[idx] = { ...subtask, isChecked: true }
            })
        }
        else if (this.subtasksCheckedFromTaskCheck.length > 0) {
            let subtasks = this.getSubtasks(pickedTask.idx)!

            subtasks.forEach((subtask, idx) => { 
                const wasChecked = this.subtasksCheckedFromTaskCheck.some((subtaskIdx) => subtaskIdx === subtask.idx)
                if (!wasChecked) return

                subtasks[idx] = { ...subtask, isChecked: false }
            })

            this.tasks![taskIdx].subtasks = subtasks
            this.subtasksCheckedFromTaskCheck = []
        }

        this.update({ 
            tasks: this.tasks!
        })
    }

    doAnimatedCheckedSubtaskTitle(subtaskIdx: number) {
        return this.subtaskCheckBoxJustChecked === subtaskIdx ||
               this.subtasksCheckedFromTaskCheck.some((idx) => idx === subtaskIdx)
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
        const rectTop = this.tasksList!.getBoundingClientRect().top
        const rectLeft = this.tasksList!.getBoundingClientRect().left
        
        let left = event.clientX - rectLeft
        let top  =  event.clientY - rectTop

        this.cursorPos = { left, top }
        const tasksList = [...this.tasksList!.childNodes].filter((elem) => elem.nodeName === 'LI')

        // dragging task
        let taskId = -1
        let taskElem: HTMLElement | null = null

        tasksList.forEach((taskItem, idx) => {
            const _taskItem = taskItem as HTMLElement
            const topEdgePosition = _taskItem.offsetTop
            const bottomEdgePosition = topEdgePosition + _taskItem.clientHeight
            const isFloating = _taskItem.className?.includes("task--floating")

            if (!isFloating && top >= topEdgePosition && top <= bottomEdgePosition && _taskItem.id) {
                taskId = +_taskItem.id.split("id--")[1]
                taskElem = taskItem as HTMLElement
                return
            }
        })
        
        // floating element
        if (!this.isDraggingTask || taskId > this.tasks.length) return

        // init floaing element
        if (!this.floatingTask && taskElem) {
            this.initDragLeftOffset(left)

            this.floatingTaskElem = taskElem
            this.hideFloatingSrcElem()

            this.floatingTask = this.getTask(taskId)!
            this.update({ floatingTask: this.floatingTask })
        }

        if (!this.floatingTask) return

        if (taskElem && taskId != this.floatingTask!.idx) {
            this.initDragOverElem(taskId, taskElem as HTMLElement)
        }
        this.updateFloatingTaskPos(left, top)
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
        const listWidth = this.tasksList!.clientWidth
        const floatingTaskWidth = listWidth * this.FLOATING_WIDTH_PERCENT
        const isOutsideFloatingTask = left > floatingTaskWidth
        
        let xOffset = 0  // move to the right offset

        if (isOutsideFloatingTask) {
            xOffset = listWidth - floatingTaskWidth  // move to right by gap diff
            this.leftOffset = left - xOffset 
            console.log(this.leftOffset)
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
        const listWidth = this.tasksList!.clientWidth
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
        const target = event.target as HTMLElement

        const isDragHandle = findAncestorByClass(target, "drag-handle", 2) != null

        this.isDraggingTask = target.tagName === "LI" || 
                              target.classList.value.includes("task__right") || 
                              target.classList.value.includes("task__left") ||
                              isDragHandle

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
        const taskElem = this.getElemById(focusElemId)!
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
        let isForSubtasks = this.pickedTaskIdx >= 0 && this.types["subtasks"]
        let subtasklength = 0

        if (isForSubtasks) {
            subtasklength = this.getSubtasks(this.pickedTaskIdx)!.length
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
        const subtasklength = this.getSubtasks(this.pickedTaskIdx)!.length

        if (key === "ArrowUp") {
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
    inputTextHandler = (newVal: string) => {
        this.newText = newVal
        requestAnimationFrame(() => this.updateTaskHeight(true))
    }

    /**
     * Input on focus handler for all inputs in tasks view.
     * Initializes shared input text variable.
     * 
     * @param event    Focus event.
     */
    onInputFocusHandler = (event: FocusEvent) => {
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

        this.update({ newText: this.newText })
    }

    /**
     * Input on blur handler for all inputs in tasks view.
     * By default, focusing out of an input will save input text except for editing / making new group.
     * Focusing out will also not automatically minimize the task.
     * 
     * @param event    Focus event.
     */
    onInputBlurHandler = (event: FocusEvent) => {
        const target = event.target as HTMLInputElement
        const relatedTarget = event.relatedTarget as HTMLElement
        const targetClass = target.classList.value

        if (this.pickedTaskIdx < 0) return

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


        // close if user clicks outside of list
        if (!relatedTarget || !target.id?.includes(this.options.id)) {
            // this.minimizeExpandedTask()
        }
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
    

    /* Context Menus */

    /**
     * Fired after user clicks on an option from Task or Subtask dropdown menu
     * @param optionIdx   Idx of clicked option.
     */
    contextMenuOptionClickedHandler (event: any, optionIdx: number) {
        const isTaskContextMenu = this.rightClickedTask != null
        const target = event.target as HTMLElement
        const optionTitle = target.innerText

        /* Task Context Menu */
        if (optionTitle === "Rename" && isTaskContextMenu) { 
            this.onTaskTitleClicked(this.rightClickedTask!.idx)
        }
        else if (optionTitle === "Rename") {
            this.onSubtaskTitleClicked(this.rightClickedSubtask!.idx)   
        }
        else if (optionTitle === "Delete Task") {
            const newTasks = this.tasks!.filter((_: Task, idx: number) => idx != this.rightClickedTask!.idx)
            this.tasks! = newTasks
            this.minimizeExpandedTask()
        }
        else if (optionTitle === "Delete Subtask") {
            this.removeSubtask(this.pickedTaskIdx, this.rightClickedSubtask!.idx)
        }
        else if ("Add Subtask") {
            // add empty subtask
            this.addNewSubtask(this.rightClickedTask!.idx)
            
            const newSubTaskIdx = this.tasks![this.rightClickedTask!.idx].subtasks!.length - 1
            this.editingSubtaskIdx = newSubTaskIdx
            this.isAddingNewSubtask = true

            // go to editing state
            this.update({
                editingSubtaskIdx: this.editingSubtaskIdx,
                isAddingNewSubtask: this.isAddingNewSubtask
            })

            // expand and focus on input element afterwards
            this.expandTask(this.rightClickedTask!.idx)

            requestAnimationFrame(() => {
                const newSubtaskInputElem = this.getElemById(`task-subtask-title-input-id--${newSubTaskIdx}`)
                setTimeout(() => newSubtaskInputElem!.focus(), 100)
            })
        }
        else if (optionTitle === "Rename") {
            this.onSubtaskTitleClicked(this.rightClickedSubtask!.idx)   
        }

        this.closeContextMenu()
    }

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
            this.contextMenuX = -1000
            this.contextMenuY = -1000
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
        const pe = event as PointerEvent
        const target = pe.target as HTMLElement
        const targetClass = target.classList.value
        pe.preventDefault()

        if (this.isContextMenuOpen) {
            this.closeContextMenu()
            return
        }

        const isSubtaskTitle = targetClass.includes("subtask__title")

        if (["INPUT", "TEXTAREA", "H3"].includes(target.tagName) || targetClass.includes("checkbox") && !isSubtaskTitle) { 
            this.contextMenuX = -1
            this.contextMenuY = -1
            return
        }

        // make sure dropdown menu stays in bounds within scroll window and scroll container
        const { hasReachedBottom, details: { scrollTop } } = getVertScrollStatus(this.tasksListContainer!)
        const containerElem = hasReachedBottom ? this.tasksList : this.tasksListContainer

        this.contextMenuX = this.cursorPos.left - 15
        this.contextMenuY = this.cursorPos.top + 4

        const tasksListContainerRightEdge = containerElem!.clientWidth
        const tasksListContainerBottomEdge = containerElem!.clientHeight + scrollTop

        const dropdownElem = this.getElemById("tasks-list-dropdown")!

        const contextMenuWidth = getElemTrueWidth(dropdownElem)
        const dropdownRightEdge  = contextMenuWidth + this.cursorPos.left
        
        const contextMenuHeight = getElemTrueHeight(dropdownElem)
        const dropdownBottomEdge  = contextMenuHeight + this.cursorPos.top

        if (dropdownRightEdge >= tasksListContainerRightEdge) {
            const xOffset = dropdownRightEdge - tasksListContainerRightEdge
            this.contextMenuX -= xOffset
        }
        if (dropdownBottomEdge >= tasksListContainerBottomEdge) {
            const yOffset = dropdownBottomEdge - tasksListContainerBottomEdge
            this.contextMenuY -= yOffset
        }
        
        // see if task or subtask context menu
        if (isSubtaskTitle || subtaskIdx >= 0) {
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

    getElemById(queryId: string) {
        const idPrefix = this.options.id
        return getElemById(`${idPrefix}--${queryId}`)
    }

    /**
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const key = event.key
        const tag = target.tagName
        const isEditing = isEditTextElem(target)

        // prevent scroll when editing
        if (event.code === "Space" && !isEditing) {
            event.preventDefault()
        }
        
        // GENERAL SHORTCUTS
        if (!isEditing && ["BODY", "LI"].includes(tag) && key === "ArrowUp" || key === "ArrowDown") {
            event.preventDefault()                  // don't allow arrow keys to move scroll
            this.handleArrowkeyPressed(key)
        }
        else if (!isEditing && key === "Escape") {
            this.minimizeExpandedTask()
        }

        // Enter || Space While Editing
        const isEditShortCut = (key === "Enter" || key === "Escape") && isEditing
        if (isEditShortCut) {
            target.blur()
        }

        // FOCUSED IDX SHORTCUTS
        const focusedIdx = this.focusedTaskIdx
        if (focusedIdx < 0 || isEditing) return

        const focusedSubtaskIdx = this.focusedSubtaskIdx
        const pickedTaskIdx = this.pickedTaskIdx
        const taskElement = this.getElemById(`task-id--${focusedIdx}`)! as HTMLElement
        const hasFocusedSubtask = focusedSubtaskIdx >= 0

        if (key === "Backspace" && !hasFocusedSubtask) {
            this.removeTask(focusedIdx)
        }
        else if (key === "Backspace" && hasFocusedSubtask) {
            this.removeFocusedSubtask()
        }
        else if (key === "Enter" && !hasFocusedSubtask) {
            this.handleTaskCheckboxClicked(this.getTask(focusedIdx)!)
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
        if (newState.subTaskLinkHt != undefined)           newStateObj.subTaskLinkHt = newState.subTaskLinkHt
        if (newState.frstSubTaskLinkOffset != undefined)            newStateObj.frstSubTaskLinkOffset = newState.frstSubTaskLinkOffset
        if (newState.isEditingDescription != undefined)      newStateObj.isEditingDescription = newState.isEditingDescription
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
        if (newState.taskLayout != undefined)                   newStateObj.taskLayout = newState.taskLayout
        if (newState.subtasksCheckedFromTaskCheck != undefined) newStateObj.subtasksCheckedFromTaskCheck = newState.subtasksCheckedFromTaskCheck

        if (newState.contextMenuX != undefined)                 newStateObj.contextMenuX = newState.contextMenuX
        if (newState.contextMenuY != undefined)                 newStateObj.contextMenuY = newState.contextMenuY
        if (newState.rightClickedSubtask != undefined)          newStateObj.rightClickedSubtask = newState.rightClickedSubtask
        if (newState.isContextMenuOpen != undefined)            newStateObj.isContextMenuOpen = newState.isContextMenuOpen

        return newStateObj
    }
}