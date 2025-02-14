import { v4 as uuidv4 } from 'uuid'
import { get, writable, type Writable } from "svelte/store"

import { Tasks } from "./Tasks"
import { TextEditorManager } from "./inputs"
import { 
        elemHasClasses, findAncestor, getElemById, initFloatElemPos, 
        isEditTextElem, shouldScroll
} from "./utils-general"
import { toast } from "./utils-toast"
import { globalContext } from './store'

type StateType = Omit<TasksListManager, "tasks">

type DragAction = "nbr-add-top" | "nbr-add-bottom" | "child-add" | "remove" | "remove-child" | "drag-end"

/**
 * Reusable task list manager component.
 * Supports movable tasks, movalbe subtasks
 * Contains reactive store.
 */
export class TasksListManager {
    tasks: Tasks
    options: TasksListOptions
    state: Writable<StateType>

    /* options */
    settings: {
        numbered: boolean
        reorder: boolean
        subtasks: boolean
        type: "side-bar" | "default"
        allowDuplicate: boolean
        removeOnComplete: boolean
        maxDepth: number
        max: number
        maxSubtasks: number
        maxTitleLines: number
        maxDescrLines: number
        maxTitleLength: number
        maxDescrLength: number
        addBtn: {
            iconScale: number
            doShow: boolean
            style?: StylingOptions
            text: string
            pos: "top" | "bottom"
        }
    }
    ui: {
        fontSize: CSSTextSize
        menuWidth: CSSUnitVal
        maxHeight: CSSUnitVal
        sidePadding: CSSUnitVal
        padding: CSSUnitVal
        borderRadius: CSSUnitVal
        hasTaskDivider: boolean
        listHeight: CSSUnitVal
        checkboxDim: CSSUnitVal
    }

    rootRef : HTMLElement | null = null
    tasksContainer: HTMLElement | null = null
    tasksList: HTMLElement | null = null

    /* interaction */
    focusTask: Task & { isChild: boolean } | null = null
    pickedTask: Task | null = null
    editTask: Task | null = null
    focusElemIdx = -1

    /* edits  */
    editMode: "title" | "description" | "task" | null = null
    newText = ""
    justEdited = false
    newTaskAdded: Task | null = null

    /* drag and drop */
    isDragging = false
    dragSrc: Task | null = null
    dragTarget: Task | null = null
    targetElem: HTMLElement | null = null

    targetParentId: string | null = null
    isTargetEnd = false
    dragAction: DragAction | null = null
    
    /* context menu */
    justClosedContextMenu = false
    contextMenuOpen = false
    contextMenu: OffsetPoint = { left: -1000, top: -1000 }

    /* ui */
    cursorPos: OffsetPoint = { left: 0, top: 0 }
    scrollWindowCursorPos: OffsetPoint = { left: 0, top: 0 }
    scrollInterval: NodeJS.Timer | null = null
    debounceTimer: NodeJS.Timer | null = null
    
    /* constants */
    DROP_TOP_BORDER_CLASSES = "drop-top-border drop-top-border--over"
    DROP_BOTTOM_BORDER_CLASSES = "drop-bottom-border drop-bottom-border--over"
    DRAG_OVER_BG = "rgba(var(--textColor1), 0.025)"

    FLOATING_WIDTH_PERCENT = 0.8
    DROP_AS_CHILD_X_THRESHOLD = 140
    MAX_DEPTH = 3

    MAX_X_CONTEXT_MENU_POS = 70

    constructor({ options, tasks }: { options: TasksListOptions, tasks: Task[] }) {
        this.options = options
        this.rootRef = options.rootRef
        
        const { settings, ui } = options
        const { type = "default" } = options ?? {}
        
        const { 
            maxDepth = 3, 
            removeOnComplete = false, 
            allowDuplicate = true, 
            numbered = false, 
            subtasks = true, 
            reorder = true,
            maxTitleLines = type === "side-bar" ? 1 : 2,
            maxDescrLines = type === "side-bar" ? 2 : 2,
            maxTitleLength = 200,
            maxDescrLength = 500,
            max = 30,
            maxSubtasks = 20,
            addBtn = {
                doShow: false, iconScale: 1.1,
                text: "Add an Item", pos: "bottom",
                style: {}
            }
        } = settings ?? {}

        const {
            menuWidth = "150px" as CSSUnitVal,
            fontSize = "1.4rem" as CSSTextSize,
            maxHeight = "100%",
            sidePadding = "15px" as CSSUnitVal,
            hasTaskDivider = true,
            padding = "10px 0px 9px 0px" as CSSUnitVal,
            borderRadius = "0px" as CSSUnitVal,
            listHeight = "auto",
            checkboxDim = "16px" as CSSUnitVal
        } = ui ?? {}

        this.settings = {
            numbered,
            subtasks,
            reorder,
            allowDuplicate,
            maxDepth,
            removeOnComplete,
            type,
            max,
            maxSubtasks,
            maxTitleLines,
            maxDescrLines,
            maxTitleLength,
            maxDescrLength,
            // @ts-ignore
            addBtn
        }
        this.ui = {
            padding,
            fontSize,
            maxHeight,
            sidePadding,
            borderRadius,
            hasTaskDivider,
            listHeight,
            checkboxDim,
            menuWidth
        }
        this.tasks = new Tasks({ 
            tasks: removeOnComplete ? tasks.filter(t => !t.isChecked) : tasks, 
            maxDepth 
        })

        this.state = writable(this)
    }

    update(newState: Partial<StateType>) {
        this.state.update((data: StateType | null) => this.getNewStateObj(data!, newState))
    }

    initAfterLoaded(taskListContainerRef: HTMLElement, taskListRef: HTMLElement) {
        this.tasksContainer = taskListContainerRef
        this.tasksList = taskListRef
    }

    /* event handlers  */

    /**
     * Toggle expand a task that has been clicked.
     * Does not run while on edit mode.
     */
    onTaskClicked(args: { event: Event, id: string, isChild: boolean, atMaxDepth: boolean }) { 
        const { event, id, isChild, atMaxDepth } = args
        const target = event.target as HTMLElement
        const tagName = target.tagName
        const isEditElem = isEditTextElem(target)
        const isCheckbox = target.classList.contains("task__checkbox")

        if (this.justEdited || isEditElem || tagName === "BUTTON" || tagName === "I" || isCheckbox) {
            this.justEdited = false
            return
        }
        
        if (!atMaxDepth) {
            this.initFocusTask(id, isChild)
            this.toggleExpandTask(id, isChild)
        }
    }

    /**
     * Runs when user clicks on a title to edit it.
     * Expands task only if it's a root task.
     */
    onTaskTitleClick(args: { id: string, isChild: boolean, doExpand: boolean }) {
        const { id, doExpand, isChild } = args
        if (doExpand) {
            this.expandRootTask(id)
        }

        this.initFocusTask(id!, isChild)
        this.editMode = "title"
        this.editTask = this.tasks.getTask(id)!
        this.update({ editTask: this.editTask, editMode: "title" })

        this.initTaskEdit("title")
    }

    /**
     * Runs when user clicks on description to edit it.
     * Expands task only if it's a root task.
     */
    onTaskDescriptionFocus(id: string, isChild: boolean) {
        if (!isChild) {
            this.expandRootTask(id)
        }

        this.initFocusTask(id!, isChild)
        this.editMode = "description"
        this.editTask = this.tasks.getTask(id)!

        this.update({ editTask: this.editTask, editMode: "description" })
        requestAnimationFrame(() => this.initTaskEdit("description"))
    }

    /* pointer stuff  */

    onTaskListPointerMove = (event: PointerEvent) => {
        if (!this.tasksList) return

        this.updatePointers(event.clientX, event.clientY)
    }

    /**
     * Track the positiopning of cursor positions relative to scroll window / scroll container.
     * 
     * @param clientX 
     * @param clientY 
     */
    updatePointers(clientX: number, clientY: number) {
        const windowRect = this.tasksContainer!.getBoundingClientRect()
        const tasksList = this.tasksList!.getBoundingClientRect()
        
        const blocksLeft = clientX - tasksList.left
        const blocksTop = clientY - tasksList.top

        const windowLeft = clientX - windowRect.left
        const windowTop = clientY - windowRect.top
        
        this.cursorPos = { left: blocksLeft, top: blocksTop }
        this.scrollWindowCursorPos = { left: windowLeft, top: windowTop }
    }

    /* task visibility */

    /**
     * Used to toggle an expanded task.
     * There can only be one opened root task at a time.
     * While there can be multiple open child tasks.
     * 
     * @param id        Task id in question.
     * @param isChild   If task is a child.
     */
    toggleExpandTask(id: string, isChild: boolean) {
        if (isChild) {
            const open = this.tasks.isTaskOpen(id)

            if (open) {
                this.resetTextContainers(id)
            }
            this.tasks.toggleTaskOpen(id)
        }
        else if (id === this.pickedTask?.id) {
            this.minimizeExpandedTask()
        }
        else if (this.pickedTask) {
            this.minimizeExpandedTask()
            this.expandRootTask(id)
        }
        else {
            this.expandRootTask(id)
        }
    }

    /**
     * Expand a given task.
     * 
     * @param taskId Id of task to be expanded,
     */
    expandRootTask(taskId: string) {
        if (taskId === this.pickedTask?.id) return

        this.pickedTask  = this.tasks.getTask(taskId)!
        this.update({ pickedTask: this.pickedTask })
    }

    /**
     * Close an expanded task.
     */
    minimizeExpandedTask() {
        this.resetTextContainers(this.pickedTask!.id)
        this.pickedTask = null
        this.update({ pickedTask: null })

        this.tasks.closeAllTasks()
    }

    resetTextContainers(id: string) {
        const taskElem = this.getTaskElem(id)

        if (taskElem) {
            const titleContainer = taskElem.querySelector(".task__title")
            const descriptionContainer = taskElem.querySelector(".task__description")

            if (titleContainer) {
                titleContainer.scrollTop = 0
            }
            if (descriptionContainer) {
                descriptionContainer.scrollTop = 0
            }
        }
    }

    /* focusing on task elem */

    initFocusTask(id: string, isChild: boolean) {
        const task     = this.tasks.getTask(id)
        const taskElemId = `${this.options.id}--task-id--${id}`
        const taskElems = this.getAllTaskElems()

        this.focusTask = { ...task!, isChild }
        this.focusElemIdx = taskElems.findIndex((taskElem) => taskElem.id === taskElemId)
        this.update({ focusTask: this.focusTask })
    }

    /**
     * After a task has just been added, focus on the text editor and open the task accordingly.
     * @param args 
     */
    onTaskJustAdded(args: {
        expandId?: string, isExpandChild?: boolean, 
        focusId: string, isFocusChild: boolean
    }) {
        const { expandId, isExpandChild, focusId, isFocusChild } = args
        
        requestAnimationFrame(() => {
            if (expandId != undefined && !this.isTaskOpen(expandId, isExpandChild!)) {
                this.toggleExpandTask(expandId, isExpandChild!)
            }

            requestAnimationFrame(() => {
                this.onTaskTitleClick({ 
                    id: focusId, 
                    isChild: isFocusChild, 
                    doExpand: false 
                })
            })
        })
    }

    /* editing tasks */

    /**
     * Input handler for current title or description element.
     * 
     * @param _       Input event
     * @param newVak  New text input
     */
    inputTextHandler = (newVal: string) => {
        this.newText = newVal
        this.update({ newText: newVal })
    }

    /**
     * Focus handler handler for current title or description element.
     * @param event    Focus event.
     */
    onInputFocusHandler = (event: FocusEvent) => {

    }

    /**
     * Blur handler for current title or description element.
     * @param event    Focus event.
     */
    onInputBlurHandler = (event: FocusEvent) => {
        if (!this.editMode) return

        // If switching between title/description of same task, don't clear edit state
        const target = event.target as HTMLElement
        const relatedTarget = event.relatedTarget as HTMLElement

        if (relatedTarget) {
            const currentId = target.id.split('--task-')[1].split('-id--')[1]
            const relatedId = relatedTarget.id.split('--task-')[1]?.split('-id--')[1]

            if (currentId === relatedId) return
        }

        this.closeTextEditState()
    }

    closeTextEditState() {
        if (this.editMode === "title") {
            this.saveNewTitle()
        }
        else if (this.editMode === "description") {
            this.saveNewDescription()
        }

        this.editTask = null
        this.newText = ""
        this.editMode = null
        this.justEdited = true

        this.update({ editTask: null, editMode: null })
    }

    /**
     * Initialize task editor instance for item to be edited.
     * @param field  Title or description
     */
    initTaskEdit(field: "title" | "description") {
        if (!this.editTask) return

        const { id } = this.editTask
        const tId = `task-${field}-id--${id}`
        const elem = this.getElemById(tId) as HTMLElement
        const { maxTitleLength, maxDescrLength } = this.settings
        elem.focus()
    
        const handlers = {
            onInputHandler: (_: InputEvent, value: string) => this.inputTextHandler(value),
            onBlurHandler:  () => this.closeTextEditState(),
            onFocusHandler: (e: FocusEvent) => this.onInputFocusHandler(e)
        }
        const initValue = field === "title" ? this.editTask.title : this.editTask.description
    
        const editor = new TextEditorManager({
            initValue,
            placeholder:  field === "title" ? "Title goes here..." : "No description",
            doAllowEmpty: field === "title" ? false : true,
            maxLength:    field === "title" ? maxTitleLength : maxDescrLength,
            id: `${this.options.id}--${tId}`,
            handlers
        })

        // making new task (sometimes contenteditable will take on previous text on add task above)
        if (!this.editTask.title) {
            requestAnimationFrame(() => editor.updateText(initValue))
        }
    
        elem.onpaste = (e) => editor.onPaste(e)
        elem.oninput = (e) => editor.onInputHandler(e)
        elem.onfocus = (e) => editor.onFocusHandler(e)
        elem.onblur = (e) => editor.onBlurHandler(e)

        requestAnimationFrame(() => editor.focus())
    }

    saveNewTitle = async () => {
        if (this.editTask?.title === this.newText) return

        this.tasks.editTaskText({ 
            type: "title", 
            id: this.editTask!.id, 
            text: this.newText 
        })

        if (this.newTaskAdded) {
            this.finalizeAddTask(this.newTaskAdded, "add", [this.newTaskAdded])
        }
        else {
            this.finalizeEditTask(this.tasks.getTask(this.editTask!.id)!, "name")
        }

        this.newTaskAdded = null
    }
    
    saveNewDescription = async () => {
        if (this.editTask?.description === this.newText) return

        this.tasks.editTaskText({ 
            type: "description", 
            id: this.editTask!.id, 
            text: this.newText 
        })

        this.finalizeEditTask(this.tasks.getTask(this.editTask!.id)!, "description")
    }

    /* drag functionality */

    toggleDragging(flag: boolean) {
        this.isDragging = flag
    }

    onDragStart(e: DragEvent, task: Task) {
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move"
        } 
        if (this.pickedTask?.id === task.id) {
            this.toggleExpandTask(task.id, false)
        }
        if (task.parentId) {
            this.toggleExpandTask(task.id, true)
        }
        if (!this.isDragging && this.settings.type != "side-bar") {
            e.preventDefault()
            return
        }

        this.dragSrc = task
        this.update({ dragSrc: task })
    }

    onDrag(e: DragEvent, targetId: string) {
        e.preventDefault()
        this.scrollWhenNearContainerBounds()

        const asChild = this.shouldDropAsChildHandler(e, targetId)

        if (asChild) {
            this.toggleDragClass({ type: "child-add",  de: e  })
        }
        else {
            const type = this.nbrDropPosition(e)
            this.toggleDragClass({ type, de: e })
        }
    }

    onDragEnter(e: DragEvent, parentId: string | null, targetId: string | null) {
        e.preventDefault()
        this.targetParentId = parentId

        const target = this.tasks.getTask(targetId!)
        const isNewTarget = target?.id != this.dragTarget?.id
        
        if (isNewTarget && target) {
            const type = this.nbrDropPosition(e)
            this.dragTarget = target
            this.toggleDragClass({ type, de: e })
        }
    }

    onDragLeave(e: DragEvent) {
        const target = e.target as HTMLElement
        const relatedTarget = e.relatedTarget as HTMLElement

        if (!relatedTarget) {
            return
        }

        this.toggleDragClass({ type: "remove", de: e })
        this.dragTarget = null
    }

    onDragEnd(e: DragEvent) {
        // drag target is sometimes null even if there is a target elemnt
        if (this.dragSrc && this.targetElem && !this.dragTarget) {
            const id        = this.getTaskIdFromElem(this.targetElem)!
            this.dragTarget = this.tasks.getTask(id)!
        }

        const isSelf = this.dragSrc?.id === this.dragTarget?.id
        const hasTarget = this.dragTarget || this.isTargetEnd

        if (!isSelf && this.dragSrc && hasTarget) {
            this.completeDragAction()
        }

        this.toggleDragClass({ type: "drag-end", de: e })
        
        this.dragSrc = null
        this.dragTarget = null
        this.isDragging = false        
        this.dragAction = null

        this.update({ dragSrc: null })
    }

    completeDragAction() {
        const asChild = this.dragAction === "child-add"
        if (asChild && this.dragTarget?.id === this.dragSrc?.parentId) {
            return
        }
        const targetParentId = asChild ? this.dragTarget?.id ?? null : this.targetParentId
        const action = this.dragSrc?.parentId !== targetParentId ? "new-parent" : "reorder"
        const _action = asChild ? "child" : this.dragAction === "nbr-add-bottom" ? "nbr-bottom" : "nbr-top"

        const task = this.tasks.reorderTask({ 
            src: this.dragSrc!,
            target: this.dragTarget!,
            targetParentId,
            action: _action
        })

        this.finalizeEditTask(task, action)
    }

    /**
     * Should dragging task be dropped as a target's sibling or child.
     */
    shouldDropAsChildHandler(e: DragEvent, targetId: string) {
        if (!e.clientX || !e.clientY) return false

        const target = e.target as HTMLElement
        const targetRect = target.getBoundingClientRect()
        const relativeX = e.clientX - targetRect.left
        const onRightSide = relativeX >= this.DROP_AS_CHILD_X_THRESHOLD
        const isTargetAtMaxDepth = targetId ? this.tasks.isAtMaxDepth(targetId) : false

        if (isTargetAtMaxDepth && onRightSide) {
            return false
        }

        return targetId ? onRightSide : false
    }

    nbrDropPosition(e: DragEvent) {
        const targetRect = (e.target as HTMLElement).getBoundingClientRect()
        const relativeY = e.clientY - targetRect.top
        const isTopHalf = relativeY < targetRect.height / 2

        return isTopHalf ? "nbr-add-top" : "nbr-add-bottom"
    }

    toggleDragClass({ type, de }: { type: DragAction, de: DragEvent }) {
        const target = de.target as HTMLElement // content
        const taskElem = target.parentElement!.parentElement as HTMLElement

        if (type === this.dragAction) return
        // console.log(this.dragAction, type)
        console.log(taskElem.id)

        this.dragAction = type
        
        if (type === "drag-end" && this.targetElem) {
            this.closeDragElemOnEnd()
            return
        }
        if (elemHasClasses(target, ["task__checkbox", "task__left"])) {
            return
        }

        if (type === "nbr-add-top") {
            this.addDropBorderClasses(taskElem, "top")
            this.removeDropBorderClasses(taskElem, "bottom")
        }
        else if (type === "nbr-add-bottom") {
            this.addDropBorderClasses(taskElem, "bottom")
            this.removeDropBorderClasses(taskElem, "top")
        }
        else if (type === "child-add") {
            target.style.background = this.DRAG_OVER_BG
            this.removeDropBorderClasses(taskElem)
        }
        else if (type === "remove-child") {
            target.style.background = "none"
            this.addDropBorderClasses(taskElem, "top")
        }
        else if (type === "remove") {
            target.style.background = "none"
            this.removeDropBorderClasses(taskElem)
        }

        this.targetElem = target
    }

    addDropBorderClasses(elem: HTMLElement, type: "top" | "bottom") {
        if (type === "top") {
            elem.classList.add(...this.DROP_TOP_BORDER_CLASSES.split(" "))
        }
        else if (type === "bottom") {
            elem.classList.add(...this.DROP_BOTTOM_BORDER_CLASSES.split(" "))
        }
    }

    removeDropBorderClasses(elem: HTMLElement, type?: "top" | "bottom") {
        if (type === "top") {
            elem.classList.remove(...this.DROP_TOP_BORDER_CLASSES.split(" "))
        }
        else if (type === "bottom") {
            elem.classList.remove(...this.DROP_BOTTOM_BORDER_CLASSES.split(" "))
        }
        else {
            elem.classList.remove(...this.DROP_TOP_BORDER_CLASSES.split(" "))
            elem.classList.remove(...this.DROP_BOTTOM_BORDER_CLASSES.split(" "))
        }
    }

    closeDragElemOnEnd() {
        const task = this.targetElem!.parentElement!.parentElement!
        this.targetElem!.style.background = "none"
        this.removeDropBorderClasses(task)

        this.dragAction = null
    }

    /**
     * If cursor is near the borders while a block is being lifted do a scroll to the direction of the border the block is going to.
     * If far from the borders, avoid scrolling.
     */
    scrollWhenNearContainerBounds() {
        if (this.scrollInterval) return
        
        this.scrollInterval = setInterval(() => {
            const moveDirection = shouldScroll(this.tasksContainer!, this.scrollWindowCursorPos)
            
            if (moveDirection === "up") {
                this.tasksContainer!.scrollTop -= 10
            }
            else if (moveDirection === "down") {
                this.tasksContainer!.scrollTop += 10
            }
            else if (moveDirection === "right") {
                this.tasksContainer!.scrollLeft += 10
            }
            else if (moveDirection === "left") {
                this.tasksContainer!.scrollLeft -= 10
            }
            else if (!moveDirection) {
                clearInterval(this.scrollInterval! as any)
                this.scrollInterval = null
            }
        }, 25)
    }

    /* tasks stuff */
   
   /**
     * Creates new task and focuses on the input field for user to start wriing.
     * 
     * @param args    
     * @param args.idx      Where task should be add at.
     * @param args.parentId Task's parent Id. If null, it will be a root task.
     * @param args.type     Whether new task will be a sibling or child. 
     */
    async addNewTask({ idx, parentId, type }: {
        idx?: number, 
        parentId: string | null,
        type:  "sibling" | "child"
    }) {
        const hasClientTaskHandler = !!this.options.handlers?.onAddTask
        const count = this.tasks.getTaskCount({ rootOnly: true })
        const { max, maxSubtasks } = this.settings

        // new root task
        if (!parentId && count === max) {
            toast("warning", { message: "Max depth reached" })
            return
        }

        const tempId   = hasClientTaskHandler ? "69" : uuidv4()
        const newIdx  =  idx ?? this.tasks.getSubtasks(parentId).length
        const isChild =  type === "child"

        // new child
        if (isChild && this.tasks.isAtMaxDepth(parentId!)) {
            toast("warning", { message: "Max depth reached" })
            return
        }
        if (isChild && this.tasks.getSubtaskCount(parentId!) === maxSubtasks) {
            toast("warning", { message: "Max subtasks reached" })
            return
        }   

        const task = {
            id: tempId,
            idx: newIdx,
            isChecked: false,
            title: "",
            description: "",
            parentId: parentId ?? null
        }

        this.tasks.addTask({ task, type: "new" })
        this.newTaskAdded = task
        
        this.onTaskJustAdded({
            expandId:      isChild ? parentId! : undefined,
            isExpandChild: isChild ? !this.tasks.isRootTask(parentId!) : undefined,
            focusId:       tempId,
            isFocusChild:  !this.tasks.isRootTask(tempId!)
        })

        // finalized once user finishs making the task title
    }

    duplicateTask(dupId: string) {
        const task = this.tasks.getTask(dupId)!
        const parentId = task.parentId
        const isChild = parentId !== null

        // see if parent children are at max depth
        if (isChild && this.tasks.isAtMaxDepth(parentId!)) {
            this.initMaxDepthToast()
            return
        }

        const [newTask, ...newChildren] = this.tasks.duplicateTask(dupId)
        this.finalizeAddTask(newTask, "duplicate", [newTask, ...newChildren])
    }

    async removeTask(id: string) {
        const task = this.tasks.getTask(id)!
        const removed = this.tasks.removeTask(id)
        this.finalizeRemoveTask(task, removed!)

        // move focus up
        // this.handleArrowkeyPressed(this.focusElemIdx > 0 ? "ArrowUp" : "ArrowDown")
    }

    removeCompletedTasks() {
        const removed = this.tasks.removeCompletedTasks()
        const tasks = this.tasks.getAllTasks()

        if (!this.options.handlers?.onDeleteTask) return

        this.options.handlers.onDeleteTask({
            payload: { 
                task: null, 
                removed,
                tasks
            },
            undoFunction: () => {
                this.tasks.onRemoveUndo({ removed })
            }
        })
    }

    async toggleTaskComplete(taskId: string) {
        this.tasks.toggleTaskComplete(taskId)

        const task = this.tasks.getTask(taskId)!
        const complete = task.isChecked
        const removeOnComplete = this.options.settings?.removeOnComplete
        const removed: Task[] = []

        if (complete && removeOnComplete) {
            removed.push(...this.tasks.removeTask(taskId))
        }
        this.finalizeCompleteTask(task, removed)
    }

    addNewTaskFromOutside() {
        this.addNewTask({
            idx: 0,
            parentId: null,
            type: "sibling"
        })
    }

    isTaskOpen(id: string, isChild: boolean) {
        if (isChild) {
            return this.tasks.isTaskOpen(id)
        }
        else {
            return this.pickedTask?.id === id
        }
    }

    async finalizeAddTask(newTask: Task, action: "add" | "duplicate", added: Task[]) {
        if (!this.options.handlers?.onAddTask) return
        const tasks = this.tasks.getAllTasks()

        const res = await this.options.handlers.onAddTask({
            action,
            payload: { 
                task: newTask, tasks, added 
            }
        })

        // // if api returns its own id for the new task
        if (res && res.id) {
            this.tasks.updateTaskId(newTask.id, res.id)
        }
    }

    async finalizeRemoveTask(task: Task, removed: Task[]) {
        if (!this.options.handlers?.onDeleteTask) return
        const tasks = this.tasks.getAllTasks()

        this.options.handlers.onDeleteTask({
            payload: { 
                task, 
                removed,
                tasks 
            },
            undoFunction: () => {
                // TODO: no request to add deleted
                this.tasks.onRemoveUndo({ parentTask: task, removed })
            }
        })
    }

    async finalizeCompleteTask(task: Task, removed: Task[]) {
        if (!this.options.handlers?.onTaskUpdate) return

        const isChecked = task.isChecked
        const tasks = this.tasks.getAllTasks()

        const undoFunction = () => {
            task.isChecked = false

            this.tasks.onRemoveUndo({ 
                parentTask: task, 
                removed 
            })
            this.options.handlers!.onTaskUpdate({
                action: "completion",
                payload: { 
                    task, 
                    tasks: this.tasks.getAllTasks() 
                }
            })
        }
        this.options.handlers.onTaskUpdate({
            action: "completion",
            removeOnComplete: this.settings?.removeOnComplete,
            payload: { 
                task, tasks 
            },
            ...(isChecked ? { undoFunction } : {})
        })
    }

    async finalizeEditTask(task: Task, action: TaskUpdateActions) {
        if (!this.options?.handlers?.onTaskUpdate) return
        const tasks = this.tasks.getAllTasks()

        this.options.handlers.onTaskUpdate({
            action,
            payload: { task, tasks }
        })
    }

    /* context menu */
    getContextMenuHeight() {
        const { description, id } = this.focusTask!
        const atMaxDepth = this.tasks.isAtMaxDepth(id)
        const allowDuplicate = this.settings.allowDuplicate

        let height = 32 * 3 // delete, add task above / below

        height += description ? 0 : 32  // add description
        height += atMaxDepth ? 0 : 32   // add subtask
        height += allowDuplicate ? 32 : 0  // add duplicate

        return height + 20
    }

    openContextMenu = (e: Event, taskId: string, isChild: boolean) => {
        const pe = e as PointerEvent
        const target = pe.target as HTMLElement

        if (isEditTextElem(target) || target.tagName === "BUTTON") {  
            this.contextMenu = { left: -1000, top: -1000 }
            return false
        }
        
        this.initFocusTask(taskId, isChild)

        const containerElem = this.tasksContainer!
        const width = parseInt(this.ui.menuWidth) + 5
        const scrollTop = containerElem.scrollTop
        
        const cursorPos = {
            left: this.cursorPos.left - 20,
            top: this.cursorPos.top - scrollTop
        }
        const contextMenu = initFloatElemPos({
            dims: { 
                height: this.getContextMenuHeight(), 
                width
            }, 
            containerDims: { 
                height: this.rootRef!.clientHeight, 
                width: this.rootRef!.clientWidth 
            },
            cursorPos
        })
        
        this.contextMenuOpen = true
        this.update({ contextMenu })

        return true
    }

    contextMenuHandler (option: string) {
        if (!this.focusTask) return
        const { id, idx, isChild, parentId } = this.focusTask!

        if (option === "Add Description") {
            this.onTaskDescriptionFocus(id, isChild)
        }
        else if (option === "Add Subtask") {
            this.addNewTask({
                parentId: id,
                type: "child"
            })
        }
        else if (option === "Add Task Above") {
            this.addNewTask({
                idx,
                parentId,
                type: "sibling"
            })
        }
        else if (option === "Add Task Below") {
            this.addNewTask({
                idx: idx + 1,
                parentId,
                type: "sibling"
            })
        }
        else if (option === "Duplicate Task") {
            this.duplicateTask(id)
        }
        else if (option === "Delete Task") {
            this.removeTask(id)
        }

        this.closeContextMenu()
    }

    /**
     * Close (hide) context menu and reset all data set from invoking the context menu.
     */
    closeContextMenu = () => {
        this.contextMenuOpen = false
        
        // allow for dmenu fade out animation to finish
        setTimeout(() => {
            this.contextMenu = { left: -1000, top: -1000 }
            this.justClosedContextMenu = true

            this.update({ contextMenu: this.contextMenu })
        }, 100)
    }

    /* hotkeys */
    handleArrowkeyPressed(key: "ArrowUp" | "ArrowDown") {
        const taskElems = this.getAllTaskElems()
        const length = taskElems.length

        if (length === 0) return

        if (this.focusElemIdx < 0) {
            this.focusElemIdx = 0
        }
        else if (key === "ArrowUp") {
            this.focusElemIdx = (this.focusElemIdx - 1 + length) % length
        }
        else {
            this.focusElemIdx = (this.focusElemIdx + 1) % length
        }

        const taskElem = taskElems[this.focusElemIdx] as HTMLButtonElement
        const isChild = taskElem.classList.contains("task--subtask")
        const id = taskElem.id.split("task-id--")[1]
        const task = this.tasks.getTask(id)

        if (task) {
            taskElem.focus()
            this.focusTask = { ...task!, isChild };
            this.update({ focusTask: this.focusTask })
        }
    }
    
    /**
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const isEditing = isEditTextElem(target)
        const { key, metaKey, shiftKey, ctrlKey, code } = event
        const hotkey = this.options.hotkeyFocus
        const currHotKeyContext = get(globalContext).hotkeyFocus

        if (hotkey != currHotKeyContext) {
            return
        }
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

        if (isEditing || !this.focusTask) return
        const { id,idx, parentId } = this.focusTask
        const isChild = parentId !== null
        
        if (event.code === "Space") {
            this.initFocusTask(id, isChild)
            this.toggleExpandTask(id, isChild)   
        }
        else if (event.code === "Enter") {
            this.toggleTaskComplete(id)
        }
        else if (key === "Backspace") {
            this.removeTask(id)
        }
        else if (shiftKey && key === "+") {
            this.addNewTask({
                parentId: id,
                type: "child"
            })
        }
        else if (shiftKey && key.startsWith("Arrow")) {
            this.addNewTask({
                idx: idx + (key === "ArrowDown" ? 1 : 0),
                parentId,
                type: "sibling"
            })
        }
        else if (code === "KeyD" && ctrlKey) {
            this.duplicateTask(id)
        }
    }

    /* helpers */

    getTaskIdFromElem(elem: HTMLElement) {
        const taskElem = findAncestor({
            child: elem, 
            queryStr: "task",
            strict: true,  max: 5
        })

        if (!taskElem) return ""

        return taskElem.id.split("task-id--")[1]
    }

    getTaskElem(id: string) {
        return this.getElemById(`task-id--${id}`)
    }

    getAllTaskElems() {
        const taskContainer = this.getElemById("tasks-list")!
        return [...taskContainer.querySelectorAll(".task:not(.task--dummy):not(.task--floating)")]
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

    onClickedOutside(event: CustomEvent) {
        if (this.contextMenuOpen || !event.detail?.target) {
            return
        }
        // const target = event.detail.target as HTMLElement
        // const toast = findAncestor({
        //     child: target, queryStr: "toast",
        //     strict: true,  max: 5
        // })
        
        // if (toast && getAttrValue(toast, "data-toast-context") === this.options.id) {
        //     return
        // }

        const task = this.focusTask
        this.focusTask = null
        this.focusElemIdx = -1
        this.update({ focusTask: null })

        if (this.pickedTask && (task && !task.parentId || !task)) {
            this.minimizeExpandedTask()
        }
    }

    onError(error: any) {
        console.error(error)
    }

    initMaxDepthToast() {
        toast("default", {
            message: "Max depth reached of " + this.tasks.maxDepth + " reached.",
            groupExclusive: true
        })
    }

    /**
     * Get the context menu options for both tasks and subtasks.
     * @returns 
     */
    getContextMenuOptions() {
        const { allowDuplicate } = this.settings

        return [
            { 
                name: "Add Task Above",
                rightIcon: {
                    type: "hotkey",
                    icon: ["shift", "up"]
                },
            },
            { 
                name: "Add Task Below",
                rightIcon: {
                    type: "hotkey",
                    icon: ["shift", "down"]
                },
                divider: !allowDuplicate
            },
            ...(allowDuplicate ? [{ 
                name: "Duplicate Task",
                rightIcon: {
                    type: "hotkey",
                    icon: ["ctrl", "d"]
                },
                divider: true
            }] : []),
            { 
                name: "Delete Task",
                rightIcon: {
                    type: "hotkey",
                    icon: ["delete"]
                }
            }
            ] as  DropdownListItem[]
    }

    /**
     * 
     * Get the updated version of the old state. 
     * Avoid destructuring the whole store object.
     * 
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(oldState: Omit<TasksListManager, "tasks">, newState: Partial<Omit<TasksListManager, "tasks">>): Omit<TasksListManager, "tasks"> {
        const newStateObj = oldState

        /* interaction  */
        if (newState.pickedTask != undefined) newStateObj.pickedTask = newState.pickedTask
        if (newState.focusTask != undefined)  newStateObj.focusTask = newState.focusTask

        /* edit  */
        if (newState.newText != undefined)    newStateObj.newText = newState.newText
        if (newState.editMode != undefined)   newStateObj.editMode = newState.editMode
        if (newState.editTask != undefined)   newStateObj.editTask = newState.editTask

        /* drag */
        if (newState.dragSrc != undefined)     newStateObj.dragSrc = newState.dragSrc

        /* context menu */
        if (newState.contextMenu != undefined)       newStateObj.contextMenu = newState.contextMenu

        return newStateObj
    }
}