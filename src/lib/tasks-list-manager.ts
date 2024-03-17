import { writable, type Writable } from "svelte/store"
import { 
        addItemToArray, extractNum, findAncestorByClass, getAdditionalHeights, getDistanceBetweenTwoPoints, getElemById, getElemNumStyle, 
        getElemsByClass, getElemTrueHeight, getElemTrueWidth, isEditTextElem, isKeyAlphaNumeric, moveElementInArr 
} from "./utils-general"
import { createEventDispatcher } from "svelte"

type SubtaskLinkProp = {
    idx: number, height: number, width: number, top: number, left: number
}
type SubtaskLinkAdjustmentsContext = {
    isUserTyping?: boolean
    hasWidthChanged?: boolean
}

/**
 * Reusable task list manager component.
 * Supports movable tasks, movalbe subtasks, linked subtask.
 * Contains reactive store.
 */
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
        listHeight: string
    }
    cssVariables: {
        checkBoxFill: string
        checkBoxEmpty: string
        checkIcon: string
        taskBgColor: string
        taskHoverBgColor: string
        floatingItemBgColor: string
        subTaskLinkSolidColor: string
    }

    /* UI Data */
    taskLayout: { 
        topPadding: number, 
        bottomPadding: number, 
        leftSectionWidth: number
    } | null = null

    containerRef : HTMLElement | null = null
    tasksListContainer: HTMLElement | null = null
    tasksList: HTMLElement | null = null
    freshExpand = false    
    expandTimeOut: NodeJS.Timeout | null = null
    dispatch = createEventDispatcher()

    /* Tasks */
    tasks: Task[]
    pickedTaskIdx = -1
    pickedTaskHT: number = 0
    pickedTaskDescriptionHT = 0
    pickedTaskGroupIdx = 0
    
    taskCheckBoxJustChecked = -1
    subtasksCheckedFromTaskCheck: number[] = []

    isMakingNewTask = false
    isEditingTitle = false
    isEditingDescription = false
    
    isTitleFocused = false
    isDescriptionFocused = false
    focusedTaskIdx = -1

    prevFocusedTodoIdx = -1

    /* Subtasks */
    editingSubtaskIdx = -1
    subtaskCheckBoxJustChecked = -1
    isAddingNewSubtask = false
    subTaskLinkHt: number = 0

    frstSubTaskLinkOffset = 0
    focusedSubtaskIdx = -1

    /* Dragging Functionality */
    dragStartPoint: OffsetPoint | null = null
    dragDistance = 0
    allowDrag = false
    
    isDraggingTask = false
    isDraggingSubtask = false
    floatingItem: Task | Subtask | null = null
    
    floatingItemElem: HTMLElement | null = null
    dragOverIremElem: HTMLElement | null = null
    
    dragOverItemElemIdx = -1
    dragStartLeftOffset = -1
    
    floatingItemOffset: OffsetPoint | null = null
    floatingElemStyling: {
        height: string,
        padding: string,
        borderWidth: string
    } | null = null
    
    /* Task Context Menu */
    hasJustClosedContextMenu = false
    isContextMenuOpen = false
    contextMenuX = -1000
    contextMenuY = -1000

    rightClickedTask: null | { task: Task, idx: number }  = null
    rightClickedSubtask: null | { subtask: Subtask, idx: number } = null

    /* Misc */
    newText = ""
    cursorPos = { left: 0, top: 0 }
    hasUsedEditShortcut = false
    draggingSourceIdx = -1

    textAreaHasSpellCheck = false
    hasInputBlurred = false
    
    /* Constants */
    DRAG_DISTANCE_THRESHOLD = 5
    FLOATING_WIDTH_PERCENT = 0.75
    FLOATING_MAX_SIDE_OFFSET = 10
    FLOATING_CLIENT_Y_TOP_OFFSET = 150
    FLOATING_SUBTASK_HEIGHT = 40

    TASK_DESCR_LINE_HT = 20
    TASK_BOTTOM_PADDING = 20

    DESCRIPTION_BOTTOM_PADDING = 6
    DESCRIPTION_TOP_PADDING = 4
    DESCRIPTON_MIN_HEIGHT = 20

    HOOK_HEIGHT_OFFSET = 3
    
    TASK_HEIGHT_MIN_NO_DESCR: number
    TASK_HEIGHT_MIN_HAS_DESCR: number
    
    MAX_TITLE_LENGTH = 50
    MAX_TAK_GROUP_TITLE_LENGTH = 5
    MAX_DESCRIPTION_LENGTH = 300
    MAX_X_CONTEXT_MENU_POS = 70

    constructor(options: TaskListOptionsInterface) {
        this.options = options
        this.tasks = options.tasks

        // wrapper around the whole component
        this.containerRef = options.containerRef

        // ui options
        this.ui = {
            showDragHandle: options.ui?.showDragHandle ?? true,
            hideTaskBtn:    options.ui?.hideTaskBtn ?? false,
            isMin:          options.ui?.isMin ?? true,
            sidePadding:    options.ui?.sidePadding ?? "18px",
            hasTaskDivider: options.ui?.hasTaskDivider ?? true,
            listHeight:     options.ui?.listHeight ?? "auto"
        }

        // styling 
        this.styling = this.options.styling

        // css variables
        this.cssVariables = {
            checkBoxFill:        options.cssVariables?.checkBoxFill  ?? "rgba(var(--textColor1), 1)",
            checkBoxEmpty:       options.cssVariables?.checkBoxEmpty ?? "rgba(var(--textColor1), 0.3)",
            checkIcon:           options.cssVariables?.checkIcon     ?? "rgba(var(--textColor2), 1)",
            taskBgColor:         options.cssVariables?.taskBgColor   ?? "rgba(var(--textColor1), 1)",
            taskHoverBgColor:    options.cssVariables?.taskHoverBgColor    ?? "rgba(var(--textColor1), 0.01)",
            floatingItemBgColor: options.cssVariables?.floatingItemBgColor ?? "#141414",
            subTaskLinkSolidColor: "#313131"
        }
        
        const setTaskHeight = this.styling?.task?.height

        this.TASK_HEIGHT_MIN_NO_DESCR  = setTaskHeight ? extractNum(setTaskHeight)[0] : 40
        this.TASK_HEIGHT_MIN_HAS_DESCR = this.TASK_HEIGHT_MIN_NO_DESCR + this.TASK_DESCR_LINE_HT

        // type
        if (options.type) {
            const types = options.type.split(" ")
            this.types["subtasks-linked"] = types.includes("subtasks-linked")
            this.types["dated"] = types.includes("dated")
            this.types["ordered"] = types.includes("ordered")
            this.types["tasks-linked"] = types.includes("tasks-linked")
            this.types["subtasks"] = types.includes("subtasks")
        }
        if (this.types["subtasks-linked"] && !this.types["subtasks"]) {
            this.types["subtasks"] = true
        }
        
        this.state = writable(this)
    }

    /**
     *  Get needed layout data from component after mounted on the DOM 
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
            leftSectionWidth: taskLeftSectionElemWidth
        }

        this.update({ taskLayout: this.taskLayout })
    }

    update(newState: Partial<TasksListManager>) {
        this.state.update((data: TasksListManager | null) => this.getNewStateObj(data!, newState))
    }

    /* Tasks Stuff */

    /**
     * Button handler for new task button.
     * Makes a new task and inserts it at the top.
     * This task elem receives the editing state.
     */
    addNewTask(atIdx: number, newTask?: Task) {
        const _newTask = newTask || {
            title: "", description: "", isChecked: false, subtasks: [], id: "", idx: this.tasks.length 
        }

        this.tasks = addItemToArray(atIdx, this.tasks, _newTask)
        this.updateTaskIndices()

        this.dispatch("newTaskAdded", _newTask)
        this.update({ tasks: this.tasks })
    }

    duplicateTask(dupIdx: number) {
        const dupTask = structuredClone(this.tasks[dupIdx])!

        this.addingNewTask(dupIdx + 1, false, dupTask)
    }

    addingNewTask(atIdx: number, doToggleInput = true, newTask?: Task) {
        this.minimizeExpandedTask()
        this.toggleInputBlurred(false)

        this.addNewTask(atIdx, newTask)
        
        if (!doToggleInput) return

        this.isMakingNewTask = true
        requestAnimationFrame(() => this.onTaskTitleClicked(atIdx))

        this.update({ 
            isMakingNewTask: this.isMakingNewTask
        })
    }


    removeTask(taskIdx: number) {
        this.tasks! = this.tasks!.filter((_: Task, idx: number) => idx != taskIdx)

        // picked task idx may fall on a new one after deletion
        if (this.pickedTaskIdx >= 0) {
            this.minimizeExpandedTask()
        }

        requestAnimationFrame(() => this.updateTaskHeight())

        // if removed task is the current focus the prev task will be focused, next if the first is removed
        this.focusedTaskIdx = Math.max(0, this.focusedTaskIdx - 1)

        this.dispatch("taskRemoved", taskIdx)
        this.update({ 
            focusedTaskIdx: this.focusedTaskIdx, 
            tasks: this.tasks! 
        })

        if (this.tasks!.length === 0) {
            this.updateTaskFocusIdx("", -1)
        }
    }

    /**
     * After updating tasks list, ensure that the ordered indices are respected,
     */
    updateTaskIndices() {
        this.tasks = this.tasks.map((task, idx) => ({ ...task, idx }))
    }

    moveTask = (fromIdx: number, toIndex: number) => {
        this.tasks = moveElementInArr(this.tasks, fromIdx, toIndex)
        this.updateTaskIndices()

        this.dispatch("taskReordered")
        this.update({ tasks: this.tasks })
    }

    /**
     * Called after user has dropped the task to a new location.
     * @param wasDraggingTask   True if user was dragging task, subtask otherwise.
     */
    updateAfterDragMove = (wasDraggingTask: boolean) => {
        let fromIdx = this.floatingItem!.idx
        let toIdx = this.dragOverItemElemIdx

        // floating going up will take dest idx place
        // floating going down will take drag over's top nbr
        if (fromIdx < toIdx) {
            toIdx = Math.max(0, toIdx - 1)
        }

        if (wasDraggingTask) {
            this.moveTask(fromIdx, toIdx)
        }
        else {
            this.moveSubtask(fromIdx, toIdx)
        }
    }

    getTask(taskIdx: number) {
        if (taskIdx < 0) return null

        return this.tasks.find((task) => task.idx === taskIdx)
    }

    getCurrSubtasks() {
        return this.getSubtasks(this.pickedTaskIdx)!
    }

    getCurrentSubtask(subtaskIdx: number): Subtask | null {
        return this.getSubtask(this.pickedTaskIdx, subtaskIdx)
    }

    getSubtasks(taskIdx: number) {
        return this.tasks![taskIdx].subtasks
    }

    getSubtaskProgress(taskIdx: number) {
        const subtasks = this.getSubtasks(taskIdx)!
        let countDone = subtasks.reduce((prev, subtask) => prev + (subtask.isChecked ? 1 : 0), 0)
        return { countDone, length: subtasks.length }
    }

    /* Subtasks Stuff */
    /**
     * Add a new subtask
     * @param taskIdx   Task idx of task where new subtask will belong.
     */
    addNewSubtask(taskIdx: number, subtaskIdx: number, newSubtask?: Subtask) {
        const task = this.tasks[taskIdx]
        const taskSubtasks = task.subtasks!

        const _newSubtask = newSubtask || {
            id: "",
            taskId: "",
            idx: taskSubtasks!.length,
            isChecked: false,
            title: ""
        }

        this.tasks![taskIdx].subtasks! = addItemToArray(subtaskIdx, taskSubtasks, _newSubtask)
        this.updateSubTaskIndices(taskIdx)

        this.dispatch("subtaskAdded", { taskIdx, subtaskIdx })
        this.update({ tasks: this.tasks })
    }

    duplicateSubtask(taskIdx: number, dupIdx: number) {
        const dupSubtask = structuredClone(this.getSubtask(taskIdx, dupIdx))!

        this.addingNewSubtask(taskIdx, dupIdx + 1, false, dupSubtask)
    }

    addingNewSubtask(taskIdx: number, subtaskIdx = this.tasks[taskIdx].subtasks!.length, doToggleInput = true, newSubtask?: Subtask) {
        // add empty subtask
        this.addNewSubtask(taskIdx, subtaskIdx, newSubtask)
        requestAnimationFrame(() => this.updateTaskHeight())
        
        this.editingSubtaskIdx = subtaskIdx
        this.isAddingNewSubtask = true

        if (this.pickedTaskIdx != taskIdx) {
            this.expandTask(taskIdx)
        }

        if (!doToggleInput) return

        this.update({
            editingSubtaskIdx: this.editingSubtaskIdx,
            isAddingNewSubtask: this.isAddingNewSubtask
        })

        requestAnimationFrame(() => {
            const newSubtaskInputElem = this.getElemById(`task-subtask-title-input-id--${subtaskIdx}`)
            setTimeout(() => newSubtaskInputElem!.focus(), 250)
        })
    }

    moveSubtask = (fromIdx: number, toIndex: number) => {
        const task = this.tasks[this.pickedTaskIdx]

        let subtasks = this.getCurrSubtasks()
        subtasks = moveElementInArr(subtasks, fromIdx, toIndex)

        task.subtasks = subtasks
        this.updateSubTaskIndices(this.pickedTaskIdx)
        this.dispatch("subtasksReordered", { taskIdx: this.pickedTaskIdx })
        

        this.tasks[this.pickedTaskIdx] = task
        this.update({ tasks: this.tasks })
    }

    updateSubTaskIndices(taskIdx: number) {
        const task = this.tasks[taskIdx]
        task.subtasks = task.subtasks!.map((subtask, idx) => ({ ...subtask, idx }))
    }

    /**
     * Remove given subtask
     * @param taskIdx     Task where desired subtask to be removed belongs.
     * @param subtaskIdx  Subtask to be removed
     * 
     */
    removeSubtask(taskIdx: number, subtaskIdx: number) {
        const subtasks = this.tasks![taskIdx].subtasks!
        let newSubtasks = subtasks.filter((_, idx: number) => idx != subtaskIdx)
        newSubtasks     = newSubtasks.map((subtask, idx: number) => ({ ...subtask, idx }))

        this.tasks![this.pickedTaskIdx].subtasks = newSubtasks

        this.dispatch("subtaskRemoved", { taskIdx, subtaskIdx })
        this.update({ tasks: this.tasks! })

        requestAnimationFrame(() => this.updateTaskHeight({ isUserTyping: true }))
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

    getCurrSubtasksLength() {
        return this.getSubtasks(this.pickedTaskIdx)!.length ?? 0
    }

    getSubtasksLength(taskIdx: number) {
        return this.getSubtasks(taskIdx)!.length
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

        this.freshExpand = true
        this.pickedTaskIdx = taskIdx
        this.focusedTaskIdx = taskIdx

        this.update({ 
            pickedTaskIdx: this.pickedTaskIdx,
            focusedTaskIdx: this.focusedTaskIdx
        })

        requestAnimationFrame(() => this.updateTaskHeight())
        requestAnimationFrame(() => this.focusItemElem(`task-id--${this.focusedTaskIdx}`))
    }

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

    /**
     * Initialize the positioning of subtask link.
     * Since the bounding properties are affected by transitions, then, adjustments need to be made to work around this.
     * Also affected by other state changes like typing on contenteditable, and container width changes.
     * 
     * Can't do after animation ends as there will be a significany delay in the appearance of checkbox and subtask link.
     * 
     * @param context  The context in which the height will change. 
     *                 Occured where predicted bounding changes will occur.
     */
    initSubtasksLinks(context?: SubtaskLinkAdjustmentsContext) {
        const isTyping = context?.isUserTyping ?? false
        const hasWidthChanged = context?.hasWidthChanged ?? false

        const taskCheckBox = this.getElemById(`task-checkbox-id--${this.pickedTaskIdx}`)!
        let currCheckbox = this.getElemById(`subtask-checkbox-id--${0}`)!

        const taskCheckboxHeight = taskCheckBox.clientHeight
        const checkboxTopMargin = getElemNumStyle(currCheckbox, "margin-top")
        const subtaskCheckboxHeight = currCheckbox.clientHeight + checkboxTopMargin
        const adjustForFirstLink = !hasWidthChanged && !isTyping

        const BORDER_OFFSET = 2

        // offset due to y transform from fade-in animation changing the vertical offset
        let vertDistanceOffset = -2

        if (adjustForFirstLink && this.editingSubtaskIdx < 0) {         // expanded, no editing
            vertDistanceOffset += 5
        }
        else if (adjustForFirstLink && this.editingSubtaskIdx === 0) {  // expanded, first subtask just added
            vertDistanceOffset += 5
        }

        const hozDistance  = this.getHozDistanceBetweenTwoElems(taskCheckBox, currCheckbox) + BORDER_OFFSET
        let   vertDistance = this.getVertDistanceBetweenTwoElems(taskCheckBox, currCheckbox) + checkboxTopMargin + vertDistanceOffset

        const subtaskLinkWidth  = hozDistance + (taskCheckboxHeight / 2)
        let   subtaskLinkHeight = vertDistance + (subtaskCheckboxHeight / 2)
        let   vertOffset = -1 * (subtaskLinkHeight - (subtaskCheckboxHeight / 2))

        // for first link
        this.initSubtaskLink({
            idx: 0,
            height: subtaskLinkHeight,
            width: subtaskLinkWidth,
            top: vertOffset + 2,
            left: -1 * subtaskLinkWidth
        })

        // for second link
        for (let subtask of this.getCurrSubtasks()) {
            if (subtask.idx === 0) continue

            const isEditingSubtask =  this.editingSubtaskIdx === subtask.idx
            const curveHeightOffset = 10
            const prevLink  =  this.getElemById(`subtask-link-id--${subtask.idx - 1}`)!
            currCheckbox    =  this.getElemById(`subtask-checkbox-id--${subtask.idx}`)!

            vertDistanceOffset = 0

            // new subtask just added
            if (isEditingSubtask && !isTyping) {
                vertDistanceOffset = 5
            }

            vertDistance  = this.getVertDistanceBetweenTwoElems(prevLink, currCheckbox) + checkboxTopMargin + vertDistanceOffset
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
     * Will change when a changes in its children will cause a task height change.
     * 
     * @param isUserTyping   For adjusting how subtask link heights and positionings are calculated.
     *                              True if there was a subtask transition animation to be accounted for.
     */
    updateTaskHeight(context?: SubtaskLinkAdjustmentsContext) {
        if (this.pickedTaskIdx < 0) return

        /* Task Padding  */
        let height = this.taskLayout!.topPadding + this.taskLayout!.bottomPadding

        /* Title Editor */
        const titleElement = this.getElemById(`task-title-id--${this.pickedTaskIdx}`)!
        height += titleElement.clientHeight + 4

        /* Description Editor */
        const descrInput = this.getElemById(`task-description-input-id--${this.pickedTaskIdx}`)!
        const descrContainer = this.getElemById(`task-description-id--${this.pickedTaskIdx}`)!
        height += descrInput.clientHeight

        const descrTopMargin = getElemNumStyle(descrContainer, "margin-top")
        const descrBottomMargin = getElemNumStyle(descrContainer, "margin-bottom")

        height += descrTopMargin + descrBottomMargin

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
            
            const subtasksHeight = subtasksListElement.clientHeight - subtaskTitleInputHeight

            height += subtasksHeight
            height -= this.taskLayout!.bottomPadding + (this.isDraggingSubtask ? 0 : 10)
        }

        this.update({
            pickedTaskHT: Math.max(height, this.TASK_HEIGHT_MIN_NO_DESCR + 30),
            subTaskLinkHt: this.subTaskLinkHt,
            frstSubTaskLinkOffset: this.frstSubTaskLinkOffset
        })

        /* Connectors */
        if (doGetSubtaskHeight && this.types["subtasks-linked"]) {
            requestAnimationFrame(() => this.initSubtasksLinks(context))
        }
    }

    /**
     * Minimize current expanded task. Reset all data set from expanded task.
     */
    minimizeExpandedTask() {
        this.isEditingTitle = false
        this.isEditingDescription = false
        this.pickedTaskIdx = -1
        this.editingSubtaskIdx = -1
        this.freshExpand = false

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

        requestAnimationFrame(() => this.focusTaskTitle())
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
        requestAnimationFrame(() => this.focusDescription())
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

        this.updateSubTaskFocusIdx("", subtaskIdx)
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
        if (this.isDraggingSubtask || this.isDraggingTask) return

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

    taskSubtaskDragHandler() {
        if (!this.isDraggingTask && !this.isDraggingSubtask) return

        const { left, top } = this.cursorPos
        const isTask = this.isDraggingTask

        const listElem       = isTask ? this.tasksList! : this.getElemById(`task-subtasks-id--${this.pickedTaskIdx}`)!
        const listChildren   = [...listElem.childNodes].filter((elem) => elem.nodeName === 'LI')

        // dragging over task / subtask
        let overItemIdx = -1
        let overItemElem: HTMLElement | null = null

        listChildren.forEach((item) => {
            const _item              = item as HTMLElement
            const isElemSubtask      = _item.classList[0].includes("subtask")
            const isFloating         = _item.classList?.value.includes("--floating")
            const isOtherItem        = isTask && isElemSubtask ? true : !isTask && !isElemSubtask ? true : false

            const topEdgePosition    = _item.offsetTop
            const bottomEdgePosition = topEdgePosition + _item.clientHeight
            const _top  = this.floatingItemElem ? top : this.dragStartPoint!.top
            
            if (!isOtherItem && !isFloating && _top >= topEdgePosition && _top <= bottomEdgePosition && _item.id) {
                overItemIdx = +_item.id.split("id--")[1]
                overItemElem = item as HTMLElement
                return
            }
        })

        // init floating element, first over elem will always be the dragging source
        if (!this.floatingItem && overItemElem) {
            const sourceItemIdx = overItemIdx
            const sourceItemElem = overItemElem

            this.initDragLeftOffset(left)

            this.floatingItemElem = sourceItemElem
            this.floatingItem = isTask ? this.getTask(sourceItemIdx)! : this.getCurrentSubtask(sourceItemIdx)

            this.update({ floatingItem: this.floatingItem })
            this.hideFloatingSrcElem()

            requestAnimationFrame(() => this.updateTaskHeight())
        }

        if (!this.floatingItem) return

        if (overItemElem && overItemIdx != this.floatingItem!.idx) {
            this.initDragOverElem(overItemIdx, overItemElem as HTMLElement)
        }

        this.updateFloatingTaskPos(left, top)
    }

    onMouseMove = (event: MouseEvent) => {
        const rectTop = this.tasksList!.getBoundingClientRect().top
        const rectLeft = this.tasksList!.getBoundingClientRect().left

        if (this.dragStartPoint && !this.allowDrag) {
            this.dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (this.dragDistance > this.DRAG_DISTANCE_THRESHOLD) {
                this.allowDrag = true
            }
        }
        
        let left = event.clientX - rectLeft
        let top  =  event.clientY - rectTop

        this.cursorPos = { left, top }

        if (this.allowDrag) {
            this.taskSubtaskDragHandler()
        }
    }

    /**
     * Set the task element being dragged over.
     * @param dragOverIdx        Idx position of element being dragged over
     * @param dragOverItemElem   HTML element of task
     */
    initDragOverElem(dragOverIdx: number, dragOverItemElem: HTMLElement) {
        if (this.dragOverItemElemIdx === dragOverIdx) return

        this.dragOverItemElemIdx  = dragOverIdx
        this.dragOverIremElem = dragOverItemElem

        this.update({ dragOverItemElemIdx: this.dragOverItemElemIdx })
    }

    /**
     * Initialize the left offset position based on the initial x position of cursor when user first drags after a touch down.
     * This will be used to ensure that the drag point will be on the position the user has clicked and not always int he top right corner.
     * @param left   Initial left position.
     */
    initDragLeftOffset(left: number) {
        const listWidth = this.tasksList!.clientWidth
        const floatingItemWidth = listWidth * this.FLOATING_WIDTH_PERCENT
        const isOutsideFloatingTask = left > floatingItemWidth
        
        let xOffset = 0  // move to the right offset

        if (isOutsideFloatingTask) {
            xOffset = listWidth - floatingItemWidth  // move to right by gap diff
            this.dragStartLeftOffset = left - xOffset 
        }
        else {
            xOffset = 10
            this.dragStartLeftOffset = left < 10 ? left : left - xOffset
        }
    }

    /**
     * Update the floating position of the flaoting task element.
     * @param left  Left offset from list 
     * @param top   Top offset from list 
     */
    updateFloatingTaskPos(left: number, top: number) {
        const listWidth = this.tasksList!.clientWidth
        const floatingItemWidth = listWidth * this.FLOATING_WIDTH_PERCENT

        top -= 15
        left -= this.dragStartLeftOffset

        const prevLeft = this.floatingItemOffset?.left ?? left - this.FLOATING_MAX_SIDE_OFFSET
        const prevTop  = this.floatingItemOffset?.top ?? top - this.tasksList!.clientHeight
        
        // prevent floating task from going over the right edge
        const floatingItemRightEdge = left + floatingItemWidth
        const onListRightEdge         = floatingItemRightEdge > listWidth - this.FLOATING_MAX_SIDE_OFFSET

        left = onListRightEdge ? prevLeft : left

        // prevent from going over the bottom edge
        const floatItemHeight = this.getElemById(`floating-item-id--${this.floatingItem!.idx}`)?.clientHeight ?? 0
        const listBottomEdge = top + floatItemHeight

        if (floatItemHeight && listBottomEdge > this.tasksList!.clientHeight + floatItemHeight) {
            top = prevTop
        }
        
        this.floatingItemOffset = { 
            top, 
            left: Math.max(left, this.FLOATING_MAX_SIDE_OFFSET)
        }
        this.update({ 
            floatingItemOffset: this.floatingItemOffset 
        })

        const scrollTop    = this.tasksListContainer!.scrollTop
        const windowHeight = this.tasksListContainer!.clientHeight
        const windowYPos   = this.floatingItemOffset.top - scrollTop
        const listHeight   = this.tasksList!.clientHeight

        // scroll list accordingly if floating item is close top top / edge
        if (windowHeight + scrollTop < listHeight && windowYPos > windowHeight - 50) {
            this.tasksListContainer!.scrollTop += 10
        }
        else if (scrollTop > 0 && windowYPos < 30) {
            this.tasksListContainer!.scrollTop -= 10
        }
    }

    /**
     * On task element mouse down. 
     * If a valid touch locaiton for drag then allow drag and prevent pointer event from taking over and expanding task.
     * @param event 
     * @returns 
     */
    onTaskMouseDown = (event: MouseEvent) => {
        if (event.button != 0) return

        const target = event.target as HTMLElement
        this.dragStartPoint =  this.cursorPos


        const dragHandleClass      = findAncestorByClass(target, "drag-handle", 2)?.classList.value ?? ""
        const containsSubtaskClass = target.classList[0].includes("subtask")

        this.isDraggingSubtask =  (dragHandleClass.includes("subtask__drag-handle") ?? false) ||
                                  (containsSubtaskClass && target.tagName === "LI") ||
                                  (target.classList.value.includes("subtask__content"))

        this.isDraggingTask = !this.isDraggingSubtask &&
                                (target.tagName === "LI" || 
                                 target.classList.value.includes("task__right") || 
                                 target.classList.value.includes("task__left") ||
                                 target.classList.value.includes("task__title-container") ||
                                 !!dragHandleClass)

        this.update({ 
            isDraggingSubtask: this.isDraggingSubtask, isDraggingTask: this.isDraggingTask 
        })

        if (this.floatingItem) {
            event.preventDefault()
        }
    }
    
    /**
     * On task list mouse up. Complete drag action if there was one.
     * @returns 
     */
    onTaskListMouseUp = () => {
        // dragging state is toggled on after click
        // so dragging state cannot be toggled off immediately after a mouse up
        // since floating elem will not be initialized until after a mouse move

        let wasDraggingTask = this.isDraggingTask

        this.isDraggingTask = false
        this.isDraggingSubtask = false
        this.dragDistance = 0
        this.dragStartPoint = null
        this.allowDrag = false

        this.update({ 
            isDraggingSubtask: false, isDraggingTask: false 
        })

        // allow on click to take over
        if (!this.floatingItem) return
        
        if (this.dragOverIremElem) {
            this.updateAfterDragMove(wasDraggingTask)

            this.dragOverItemElemIdx = -1
            this.dragOverIremElem?.classList.remove(`${wasDraggingTask ? "task" : "subtask"}--drag-over`)
            this.dragOverIremElem = null
        }

        // this will cause a height transition change animation for the sourc task's original dom element
        this.showFloatingSrcElem()

        if (wasDraggingTask) {
            this.pickedTaskIdx = -1
        }

        this.dragStartLeftOffset = -1
        this.floatingItemOffset  =  null
        this.update({ floatingItemOffset: null })
                
        // do not do the height transition by letting floating task state stay active to disallow transition animation
        requestAnimationFrame(() => {
            // do this to redo the subtask links set up
            if (!wasDraggingTask) {
                this.updateTaskHeight({ isUserTyping: true })
            }

            this.floatingItem = null
            this.floatingItemElem = null
            this.update({ floatingItem: null })
        })
    }

    /**
     * The dragging task source will be hidden when the (ghost) floating element is initialized
     * @param taskElem   Original HTML element of floating element.
     */
    hideFloatingSrcElem() {
        this.update({ draggingSourceIdx: this.floatingItem!.idx })
        // this.floatingItemElem!.classList.add("dragging-source-hidden")  // doesn't work
    }

    /**
     * Show the hidden task elem again. This HTML element will be taken over by the task below it.
     */
    showFloatingSrcElem() {
        this.update({ draggingSourceIdx: -1 })
    }

    /* Inputs / Editing Functionality */

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
        this.dispatch("taskEdited", this.tasks![this.pickedTaskIdx]!)
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
        this.dispatch("taskEdited", this.tasks![this.pickedTaskIdx]!)
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
        this.dispatch("subtaskEdited", this.tasks![this.pickedTaskIdx]!)
    }

    /**
     * Input handler for all inputs in tasks view.
     * For editing task titles, subtask titles, descriptions, & task groups.
     * For description, updates the task height in real time.
     * 
     * @param event    Input event.
     */
    inputTextHandler = (newVal: string) => {
        this.newText = newVal
        requestAnimationFrame(() => this.updateTaskHeight({ isUserTyping: true }))
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

    /* Focus Functionality */

    /**
     * Focus a given task elem id. Attach focus event listeners.
     * Used for tasks and subtasks.
     * @param focusElemId   The id of the task elem to be focused.
     */
    focusItemElem(focusElemId: string) {
        const taskElem = this.getElemById(focusElemId)!
        taskElem.focus()
        
        taskElem.addEventListener('blur', this.focusedTaskOnBlurHandler)
        taskElem.addEventListener('focus', this.refocusItemElem)
    }

    /**
     * Refocus to a task elem that has already been focused and blurred.
     * Used for tasks and subtasks.
     * @param event  Focus Event
     */
    refocusItemElem = (event: FocusEvent) => {
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
            taskElement.removeEventListener('focus', this.refocusItemElem)
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

    focusTaskTitle() {
        this.isEditingTitle = true

        const inputTitleElem = this.getElemById(`task-title-id--${this.pickedTaskIdx}`) as HTMLElement
        inputTitleElem.focus()

        this.update({ 
            isEditingTitle: this.isEditingTitle
        })
    }

    focusDescription() {
        this.isEditingDescription = true

        const inputTitleElem = this.getElemById(`task-description-input-id--${this.pickedTaskIdx}`) as HTMLElement
        inputTitleElem.focus()

        this.update({ 
            isEditingDescription: this.isEditingDescription
        })
    }

    /**
     * Update the current subtask focus idx. 
     * Increments or decrements depending on which key is pressed.
     * Will reset and move to a prev or text task if idx goes out of bounds.
     * @param key   Left or right key
     */
    updateSubTaskFocusIdx(key: string, newIdx?: number) {
        const subtasklength = this.getCurrSubtasks()!.length

        if (newIdx != undefined && newIdx >= 0) {
            this.focusedSubtaskIdx = newIdx
        }
        else if (key === "ArrowUp") {
            this.focusedSubtaskIdx--
        } 
        else if (key === "ArrowDown") {
            this.focusedSubtaskIdx++

            if (this.focusedSubtaskIdx === subtasklength) {
                this.resetCurrentFocusedSubtaskIdx()
                this.updateTaskFocusIdx(key)
                return
            }
        }

        this.update({ focusedSubtaskIdx: this.focusedSubtaskIdx })

        if (this.focusedSubtaskIdx >= 0) {
            this.focusItemElem(`subtask-id--${this.focusedSubtaskIdx}`)
        }
    }

    /**
     * Update the current focus idx. 
     * Increments or decrements depending on which key is pressed.
     * @param key   Left or right key
     */
    updateTaskFocusIdx(key: string, idx?: number) {
        const tasksLength = this.tasks!.length
        if (tasksLength === 0) return

        if (idx != undefined) {
            this.focusedTaskIdx = idx
        }
        if (key === "ArrowUp") {
            this.focusedTaskIdx--
            this.focusedTaskIdx = this.focusedTaskIdx < 0 ? tasksLength - 1 : this.focusedTaskIdx
        } 
        else if (key === "ArrowDown") {
            this.focusedTaskIdx++
            this.focusedTaskIdx = this.focusedTaskIdx === tasksLength ? 0 : this.focusedTaskIdx
        }

        this.update({ focusedTaskIdx: this.focusedTaskIdx })

        if (this.focusedTaskIdx >= 0) {
            this.focusItemElem(`task-id--${this.focusedTaskIdx}`)
        }
    }

    /**
     * User to navigate between elements in a Task list.
     * This includes title, description, subtasks, and other tasks.
     * @param key   Arrow key pressed.
     */
    handleArrowkeyPressed(key: string) {
        const isDown         = key === "ArrowDown"
        const isExpanded     = this.pickedTaskIdx >= 0
        const freshExpand    = isExpanded && this.freshExpand

        // if no task is expanded, move through the tasks
        if (this.pickedTaskIdx < 0) {
            this.updateTaskFocusIdx(key)
            return
        }

        // if title is focused and up, the task is now in focus
        if (this.isTitleFocused && !isDown) {
            this.isTitleFocused = false
            this.isDescriptionFocused = false
            this.updateTaskFocusIdx(key)

            return
        }

        const subtaskIdx      = this.focusedSubtaskIdx
        const subtasksLength  = this.getCurrSubtasksLength()
        const noActiveSubElemFocus  = !this.isDescriptionFocused && !this.isTitleFocused && subtaskIdx < 0

        // moving task focus up / down to an expanded task
        const focusTaskDown    = isDown && this.focusedTaskIdx + 1 === this.pickedTaskIdx
        const focusTaskUp      = !isDown && this.focusedTaskIdx - 1 === this.pickedTaskIdx
        const fromTaskToTitle  =  noActiveSubElemFocus && (focusTaskDown || focusTaskUp)

        let isForTitle       = (isDown && freshExpand) || (!isDown && this.isDescriptionFocused) || fromTaskToTitle
        let isForDescription = !isForTitle && ((isDown && this.isTitleFocused) || (!isDown && subtaskIdx === 0))

        let isForSubtasks    =  this.types["subtasks"] && isExpanded && !isForDescription && this.focusedTaskIdx === this.pickedTaskIdx
                                && subtasksLength > 0 && ((this.isDescriptionFocused && isDown) || subtaskIdx >= 0)

        if (isForSubtasks) {
            this.isDescriptionFocused = false
            this.updateSubTaskFocusIdx(key)
        }
        else if (isForTitle) {
            this.isDescriptionFocused = false
            this.isTitleFocused = true

            this.focusTaskTitle()

            if (fromTaskToTitle && focusTaskUp) {
                this.focusedTaskIdx--
                this.update({ focusedTaskIdx: this.focusedTaskIdx })
            }
        }
        else if (isForDescription) {
            this.isTitleFocused = false
            this.focusedSubtaskIdx = -1
            this.isDescriptionFocused = true
            
            this.focusDescription()
        }
        else {
            this.isDescriptionFocused = false
            this.updateTaskFocusIdx(key)
        }

        this.freshExpand = false
    }

    /* Context Menu */

    /**
     * Fired everytimee user clicks outside context menu.
     * Will fire everytime as context menu is always on the DOM.
     * So do not close if there is no active context menu.
     */
    onContextMenuClickedOutsideHandler() {
        if (this.isContextMenuOpen) {
            this.closeContextMenu()
        }
    }

    /**
     * Called when user clicks an option from Task or Subtask dropdown menu
     * @param optionIdx   Click Event
     */
    contextMenuOptionClickedHandler (event: Event) {
        const isTaskContextMenu = this.rightClickedTask != null
        const _target = event.target as HTMLElement
        let target   = _target
        
        if (_target.tagName === "BUTTON") {
            target = _target.firstElementChild! as HTMLElement
        }
        else {
            // find the button and get is span child
            target = findAncestorByClass(_target, "dropdown-menu__option-btn")!
            target = target.firstElementChild! as HTMLElement
        }
        
        const optionTitle = target.innerText
        const taskIdx     = this.rightClickedTask?.idx ?? this.pickedTaskIdx
        const subtaskIdx  = this.rightClickedSubtask?.idx ?? 0

        /* Task Context Menu */
        if (optionTitle === "Rename" && isTaskContextMenu) { 
            this.onTaskTitleClicked(taskIdx)
        }
        else if (optionTitle === "Rename") {
            this.onSubtaskTitleClicked(subtaskIdx)   
        }
        else if (optionTitle === "Delete Task") {
            this.removeTask(taskIdx)
            this.minimizeExpandedTask()
        }
        else if (optionTitle === "Delete Subtask") {
            this.removeSubtask(this.pickedTaskIdx, subtaskIdx)
        }
        else if (optionTitle === "Add Subtask") {
            this.addingNewSubtask(taskIdx)
        }
        else if (optionTitle === "Add Task Above") {
            this.addingNewTask(taskIdx)
        }
        else if (optionTitle === "Add Task Below") {
            this.addingNewTask(taskIdx + 1)
        }
        else if (optionTitle === "Duplicate Task") {
            this.duplicateTask(taskIdx)
        }
        else if (optionTitle === "Add Subtask Above") {
            this.addingNewSubtask(taskIdx, subtaskIdx)
            this.updateSubTaskFocusIdx("", subtaskIdx)
        }
        else if (optionTitle === "Add Subtask Below") {
            this.addingNewSubtask(taskIdx, subtaskIdx + 1)
            this.updateSubTaskFocusIdx("", subtaskIdx + 1)
        }
        else if ("Duplicate Subtask") {
            this.duplicateSubtask(taskIdx, subtaskIdx)
        }

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

        const isSubtaskElem = target.classList[0].includes("subtask")

        if (["INPUT", "TEXTAREA", "H3"].includes(target.tagName) || targetClass.includes("checkbox") && !isSubtaskElem) {  
            this.contextMenuX = -1
            this.contextMenuY = -1
            return
        }

        // make sure dropdown menu stays in bounds within scroll window and scroll container
        const containerElem = this.containerRef
        const scrollTop = this.tasksListContainer!.scrollTop

        this.contextMenuX = this.cursorPos.left
        this.contextMenuY = this.cursorPos.top - scrollTop

        const tasksListContainerRightEdge = containerElem!.clientWidth
        const tasksListContainerBottomEdge = containerElem!.clientHeight

        const dropdownElem = this.getElemById("tasks-list-dropdown")!
        const contextMenuWidth = getElemTrueWidth(dropdownElem)
        const contextMenuHeight = getElemTrueHeight(dropdownElem)

        const dropdownRightEdge  = contextMenuWidth + this.cursorPos.left
        const dropdownBottomEdge = contextMenuHeight + this.cursorPos.top - scrollTop

        if (dropdownRightEdge >= tasksListContainerRightEdge) {
            const xOffset = dropdownRightEdge - tasksListContainerRightEdge
            this.contextMenuX -= xOffset
        }
        if (dropdownBottomEdge >= tasksListContainerBottomEdge) {
            const yOffset = dropdownBottomEdge - tasksListContainerBottomEdge
            this.contextMenuY -= yOffset + 10
        }
        
        // see if task or subtask context menu
        if (isSubtaskElem || subtaskIdx >= 0) {
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
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const isEditing = isEditTextElem(target)
        const { key, ctrlKey, metaKey, shiftKey } = event

        // prevent scroll when editing
        if (event.code === "Space" && !isEditing) {
            event.preventDefault()
        }
        if (metaKey && key === "d") {
            event.preventDefault()
        }
        
        // arrow shortcuts
        if (!isEditing && !shiftKey && !metaKey && (key === "ArrowUp" || key === "ArrowDown")) {
            // don't allow arrow keys to move scroll
            event.preventDefault()                  
            this.handleArrowkeyPressed(key)
        }
        else if (!isEditing && key === "Escape") {
            event.preventDefault()
            this.minimizeExpandedTask()
        }

        // finishing edits
        const isEditShortCut = (key === "Enter" || key === "Escape") && isEditing
        if (isEditShortCut) {
            target.blur()
        }

        // focused index hot keys
        const focusedIdx = this.focusedTaskIdx
        if (focusedIdx < 0 || isEditing) return

        const taskElement       = this.getElemById(`task-id--${focusedIdx}`)! as HTMLElement
        const focusedSubtaskIdx = this.focusedSubtaskIdx
        const hasFocusedSubtask = focusedSubtaskIdx >= 0
        const pickedTaskIdx     = this.pickedTaskIdx
        const isAlphaNumericKey = isKeyAlphaNumeric(event)

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
        else if (shiftKey && key === "+") {
            this.addingNewSubtask(focusedIdx)
            this.updateSubTaskFocusIdx("", this.getSubtasksLength(this.focusedTaskIdx) - 1)
        }
        else if (metaKey && key === "ArrowUp" && !hasFocusedSubtask) {
            this.addingNewTask(focusedIdx)
        }
        else if (shiftKey && key === "ArrowUp" && hasFocusedSubtask) {
            this.addingNewSubtask(focusedIdx, focusedSubtaskIdx)
            this.updateSubTaskFocusIdx("", focusedSubtaskIdx)
        }
        else if (metaKey && key === "ArrowDown" && !hasFocusedSubtask) {
            this.addingNewTask(focusedIdx + 1)
        }
        else if (shiftKey && key === "ArrowDown" && hasFocusedSubtask) {
            this.addingNewSubtask(focusedIdx, focusedSubtaskIdx + 1)
            this.updateSubTaskFocusIdx("", focusedSubtaskIdx + 1)
        }
        else if (metaKey && key === "d" && !hasFocusedSubtask) {
            this.duplicateTask(focusedIdx)
        }
        else if (metaKey && key === "d" && hasFocusedSubtask) {
            this.duplicateSubtask(focusedIdx, focusedSubtaskIdx)
        }
        else if (hasFocusedSubtask && isAlphaNumericKey) {
            this.onSubtaskTitleClicked(focusedSubtaskIdx)
        }
    }

    /* Helpers */
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

    /**
     * Get an element unique to this instance of current task list.
     * @param queryId  Id of query element
     * @returns        Element queried for
     */
    getElemById(queryId: string) {
        const idPrefix = this.options.id
        return getElemById(`${idPrefix}--${queryId}`)
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
        if (newState.subTaskLinkHt != undefined)             newStateObj.subTaskLinkHt = newState.subTaskLinkHt
        if (newState.frstSubTaskLinkOffset != undefined)     newStateObj.frstSubTaskLinkOffset = newState.frstSubTaskLinkOffset
        if (newState.isEditingDescription != undefined)      newStateObj.isEditingDescription = newState.isEditingDescription
        if (newState.isEditingTitle != undefined)            newStateObj.isEditingTitle = newState.isEditingTitle
        if (newState.newText != undefined)                      newStateObj.newText = newState.newText
        if (newState.editingSubtaskIdx != undefined)            newStateObj.editingSubtaskIdx = newState.editingSubtaskIdx
        if (newState.taskCheckBoxJustChecked != undefined)      newStateObj.taskCheckBoxJustChecked = newState.taskCheckBoxJustChecked
        if (newState.subtaskCheckBoxJustChecked != undefined)   newStateObj.subtaskCheckBoxJustChecked = newState.subtaskCheckBoxJustChecked
        if (newState.textAreaHasSpellCheck != undefined)        newStateObj.textAreaHasSpellCheck = newState.textAreaHasSpellCheck
        if (newState.tasks != undefined)                        newStateObj.tasks = newState.tasks
        if (newState.isAddingNewSubtask != undefined)           newStateObj.isAddingNewSubtask = newState.isAddingNewSubtask
        if (newState.rightClickedTask != undefined)             newStateObj.rightClickedTask = newState.rightClickedTask
        if (newState.isMakingNewTask != undefined)              newStateObj.isMakingNewTask = newState.isMakingNewTask
        if (newState.focusedTaskIdx != undefined)               newStateObj.focusedTaskIdx = newState.focusedTaskIdx
        if (newState.focusedSubtaskIdx != undefined)            newStateObj.focusedSubtaskIdx = newState.focusedSubtaskIdx

        if (newState.draggingSourceIdx != undefined)            newStateObj.draggingSourceIdx = newState.draggingSourceIdx
        if (newState.dragOverItemElemIdx != undefined)          newStateObj.dragOverItemElemIdx = newState.dragOverItemElemIdx

        if (newState.floatingItemOffset != undefined)           newStateObj.floatingItemOffset = newState.floatingItemOffset
        if (newState.floatingItem != undefined)                 newStateObj.floatingItem = newState.floatingItem
        if (newState.taskLayout != undefined)                   newStateObj.taskLayout = newState.taskLayout
        if (newState.isDraggingTask != undefined)               newStateObj.isDraggingTask = newState.isDraggingTask
        if (newState.isDraggingSubtask != undefined)            newStateObj.isDraggingSubtask = newState.isDraggingSubtask

        if (newState.contextMenuX != undefined)                 newStateObj.contextMenuX = newState.contextMenuX
        if (newState.contextMenuY != undefined)                 newStateObj.contextMenuY = newState.contextMenuY
        if (newState.rightClickedSubtask != undefined)          newStateObj.rightClickedSubtask = newState.rightClickedSubtask
        if (newState.isContextMenuOpen != undefined)            newStateObj.isContextMenuOpen = newState.isContextMenuOpen

        return newStateObj
    }
}