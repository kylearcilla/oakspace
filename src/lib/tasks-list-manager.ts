import { writable, type Writable } from "svelte/store"

import { Tasks } from "./Tasks"
import { TextEditorManager } from "./inputs"
import { 
        elemHasClasses, findAncestor, getElemById, initFloatElemPos, 
        isEditTextElem, isNearBorderAndShouldScroll
} from "./utils-general"

/**
 * Reusable task list manager component.
 * Supports movable tasks, movalbe subtasks
 * Contains reactive store.
 */
export class TasksListManager {
    tasks: Tasks
    options: TasksListOptions
    state: Writable<Omit<TasksListManager, "tasks">>

    /* options */
    settings: {
        numbered: boolean
        reorder: boolean
        subtasks: boolean
        allowDuplicate: boolean
        removeOnComplete: boolean
        progress: "perc" | "count"
        maxTitleLines: number
        maxDescrLines: number
        max: number
        subtaskMax: number
        maxToastMsg: string | null
        subtaskMaxToastMsg: string | null
        addBtn: {
            iconScale: number
            doShow: boolean
            style?: StylingOptions
            text: string
            pos: "top" | "bottom"
        }
    }
    ui: {
        maxHeight: string
        sidePadding: CSSUnitVal
        hasTaskDivider: boolean
        listHeight: string
        checkboxDim: string
    }

    containerRef : HTMLElement | null = null
    tasksListContainer: HTMLElement | null = null
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

    /* drag and drop */
    isDragging = false
    dragSrc: Task | null = null
    dragTarget: Task | null = null
    targetElem: HTMLElement | null = null

    targetParentId: string | null = null
    isTargetEnd = false
    dragAsChild = false
    
    /* context menu */
    hasJustClosedContextMenu = false
    isContextMenuOpen = false
    contextMenu: OffsetPoint = { left: -1000, top: -1000 }

    /* ui */
    cursorPos: OffsetPoint = { left: 0, top: 0 }
    scrollWindowCursorPos: OffsetPoint = { left: 0, top: 0 }
    scrollInterval: NodeJS.Timer | null = null
    debounceTimer: NodeJS.Timer | null = null
    
    /* constants */
    DEFAULT_STYLES = {
        CHECK_BOX_DIM: "16px",
        SIDE_PADDING: "18px",
        MAX_TITLE_LINES: 1,
        MAX_DESC_LINES: 1
    }
    
    FLOATING_WIDTH_PERCENT = 0.8
    CONTEXT_MENU_WIDTH = 180
    TRANS_IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="

    DROP_AS_CHILD_X_THRESHOLD = 100
    DEFAULT_MAX_TASKS = 25
    DEFAULT_MAX_SUBTASKS = 25
    MAX_DEPTH = 3

    MAX_TITLE_LENGTH = 200
    MAX_DESCRIPTION_LENGTH = 350
    MAX_X_CONTEXT_MENU_POS = 70

    constructor(options: TasksListOptions) {
        this.options = options
        this.tasks = options.tasks

        const { settings, ui } = options
        const { DEFAULT_MAX_TASKS, DEFAULT_MAX_SUBTASKS } = this
        const { MAX_TITLE_LINES, MAX_DESC_LINES, SIDE_PADDING, CHECK_BOX_DIM } = this.DEFAULT_STYLES

        this.containerRef = options.containerRef

        this.settings = {
            numbered: settings?.numbered ?? false,
            subtasks: settings?.subtasks ?? true,
            reorder:          settings?.reorder ?? true,
            allowDuplicate:   settings?.allowDuplicate ?? true,
            removeOnComplete: settings?.removeOnComplete ?? false,
            progress:         settings?.progress ?? "perc",
            maxTitleLines: settings?.maxTitleLines ??  MAX_TITLE_LINES,
            maxDescrLines: settings?.maxDescrLines ??  MAX_DESC_LINES,
            max:           settings?.max ?? DEFAULT_MAX_TASKS,
            subtaskMax:    settings?.subtaskMax ?? DEFAULT_MAX_SUBTASKS,
            maxToastMsg:   settings?.maxToastMsg ?? `Task number exceeded.`,
            subtaskMaxToastMsg: settings?.subtaskMaxToastMsg ?? `Subtasks number exceeded.`,
            addBtn: {
                doShow: settings?.addBtn?.doShow ?? true,
                style:  settings?.addBtn?.style,
                text:   settings?.addBtn?.text ?? "Add an Item",
                pos:    settings?.addBtn?.pos ?? "bottom",
                iconScale: settings?.addBtn?.iconScale ?? 0.96
            }
        }

        this.ui = {
            maxHeight: ui?.maxHeight ?? "auto",
            sidePadding:    ui?.sidePadding    ?? SIDE_PADDING as CSSUnitVal,
            hasTaskDivider: ui?.hasTaskDivider ?? true,
            listHeight:     ui?.listHeight     ?? "auto",
            checkboxDim:   ui?.checkboxDim     ?? CHECK_BOX_DIM,
        }

        this.state = writable(this)
    }

    update(newState: Partial<Omit<TasksListManager, "tasks">>) {
        this.state.update((data: Omit<TasksListManager, "tasks"> | null) => this.getNewStateObj(data!, newState))
    }

    initAfterLoaded(taskListContainerRef: HTMLElement, taskListRef: HTMLElement) {
        this.tasksListContainer = taskListContainerRef
        this.tasksList = taskListRef
    }

    /* event handlers  */

    /**
     * Toggle expand a task that has been clicked.
     * Does not run while on edit mode.
     */
    onTaskClicked(args: { event: Event, id: string, isChild: boolean }) { 
        const { event, id, isChild } = args
        const target = event.target as HTMLElement
        const isEditElem = isEditTextElem(target)

        if (this.justEdited || isEditElem || target.tagName === "BUTTON" || target.tagName === "I") {
            this.justEdited = false
            return
        }

        this.initFocusTask(id, isChild)
        this.toggleExpandTask(id, isChild)
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

        this.editMode = "description"
        this.editTask = this.tasks.getTask(id)!
        this.update({ editTask: this.editTask, editMode: "description" })

        this.initTaskEdit("description")
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
        const windowRect = this.tasksListContainer!.getBoundingClientRect()
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
            this.tasks.toggleSubtaskOpen(id)
            return
        }
        if (id === this.pickedTask?.id) {
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
        this.pickedTask = null
        this.update({ pickedTask: null })
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

        // if (this.pickedTaskIdx < 0) return
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
        const { [field]: value, id } = this.editTask!
        const elem = this.getElemById(`task-${field}-id--${id}`) as HTMLElement
    
        const handlers = {
            onInputHandler: (_: InputEvent, value: string) => this.inputTextHandler(value),
            onBlurHandler:  this.onInputBlurHandler,
            onFocusHandler: this.onInputFocusHandler
        }
    
        const editor = new TextEditorManager({
            initValue: value,
            placeholder:  field === "title" ? "Title goes here..." : "No description",
            doAllowEmpty: field === "title" ? false : true,
            maxLength:    field === "title" ? this.MAX_TITLE_LENGTH : this.MAX_DESCRIPTION_LENGTH,
            id: `${this.options.id}--task-${field}-id--${id}`,
            handlers
        })
    
        elem.onpaste = (e) => editor.onPaste(e)
        elem.oninput = (e) => editor.onInputHandler(e)
        elem.onfocus = (e) => editor.onFocusHandler(e)
        elem.onblur = (e) => editor.onBlurHandler(e)
        elem.focus()
    }

    saveNewTitle = async () => {
        if (this.editTask?.title === this.newText) return

        this.tasks.editTaskText({ 
            type: "title", 
            id: this.editTask!.id, 
            text: this.newText 
        })

        this.finalizeEditTask(this.tasks.getTask(this.editTask!.id)!, "name")
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
        if (!this.isDragging) {
            e.preventDefault()
            return
        }

        this.dragSrc = task
        this.update({ dragSrc: task })
    }

    onDrag(e: DragEvent, id: string) {
        e.preventDefault()

        if (id != this.dragSrc?.id) {
            this.shouldDropAsChildHandler(e)
        }
        
        this.scrollWhenNearContainerBounds()
    }

    onDragEnter(e: DragEvent, parentId: string | null, targetId: string | null) {
        this.targetParentId = parentId

        if (!targetId && !this.isTargetEnd) {
            this.isTargetEnd = true
            this.toggleDragClass({ type: "nbr-add", de: e })
        }
        else {
            this.isTargetEnd = false
            const target = this.tasks.getTask(targetId!)
            const isNewTarget = target?.id != this.dragTarget?.id && target?.id != this.dragSrc!.id

            if (isNewTarget && target) {
                this.dragTarget = target
                this.toggleDragClass({ type: "nbr-add", de: e })
            }
        }
    }

    onDragLeave(e: DragEvent) {
        const relatedTarget = e.relatedTarget as HTMLElement
        if (!relatedTarget) return
            
        // on drag leave triggers on child elements
        // only leave when moving on to parent elems
        const shouldLeave    = elemHasClasses(relatedTarget, ["task__top-content", "task"])
        if (!shouldLeave) return

        this.toggleDragClass({ type: "remove", de: e })
        this.dragTarget = null
        
    }

    onDragEnd(e: DragEvent) {
        // sometimes the dragTarget is null even there is a visible target
        if (this.dragSrc && this.targetElem && !this.dragTarget) {
            const id        = this.getTaskIdFromElem(this.targetElem)!
            this.dragTarget = this.tasks.getTask(id)!
        }
        if (this.dragSrc && (this.dragTarget || this.isTargetEnd)) {
            this.completeDragAction()
        }

        this.toggleDragClass({ type: "drag-end", de: e })
        
        this.dragSrc = null
        this.dragTarget = null
        this.isDragging = false        
        this.dragAsChild = false

        this.update({ dragSrc: null })
    }

    completeDragAction() {
        if (this.dragAsChild && this.dragTarget!.id === this.dragSrc?.parentId) {
            return
        }

        this.tasks.reorderTask({ 
            src: this.dragSrc!,
            target: this.dragTarget,
            targetParentId: this.dragAsChild ? this.dragTarget!.id : this.targetParentId
        })

        this.finalizeEditTask(this.dragSrc!, "reorder")
    }

    /**
     * Should dragging task be dropped as a target's sibling or child.
     */
    shouldDropAsChildHandler(e: DragEvent) {
        if (!e.clientX || !e.clientY) return

        const target = e.target as HTMLElement
        const targetRect = target.getBoundingClientRect()
        const relativeX = e.clientX - targetRect.left

        this.dragAsChild = relativeX >= this.DROP_AS_CHILD_X_THRESHOLD

        this.toggleDragClass({ 
            type: this.dragAsChild ? "child-add" : "remove-child", 
            de: e 
        })
    }

    toggleDragClass(args: { 
        type: "nbr-add" | "child-add" | "remove" | "remove-child" | "drag-end", 
        de: DragEvent 
    }) {
        const { type, de } = args
        const target = de.target as HTMLElement
        const taskElem = target.parentElement!.parentElement as HTMLElement
        const isDummy = elemHasClasses(target, ["task__top-content--dummy"])
        
        if (type === "drag-end" && this.targetElem) {
            this.closeDragElemOnEnd()

            return
        }
        if (elemHasClasses(target, ["task__checkbox", "task__left"])) {
            return
        }

        if (type === "nbr-add") {
            taskElem.classList.add("dg-over-el--over")

            if (isDummy) {
                taskElem.style.height = "25px"
            }
        }
        else if (type === "child-add") {
            target.style.background = "rgba(var(--textColor1), 0.025)"
            taskElem.classList.remove("dg-over-el--over")
        }
        else if (type === "remove-child") {
            target.style.background = "none"
            taskElem.classList.add("dg-over-el--over")

            if (isDummy) {
                taskElem.style.height = "0px"
            }
        }
        else {
            target.style.background = "none"
            taskElem.classList.remove("dg-over-el--over")

            if (isDummy) {
                taskElem.style.height = "0px"
            }
        }

        this.targetElem = target
    }

    closeDragElemOnEnd() {
        const task = this.targetElem!.parentElement!.parentElement!
        this.targetElem!.style.background = "none"
        task!.classList.remove("dg-over-el--over")

        const isDummy = elemHasClasses(this.targetElem!, ["task__top-content--dummy"])
        if (isDummy)  {
            task!.style.height = "0px"
        }
    }

    /**
     * If cursor is near the borders while a block is being lifted do a scroll to the direction of the border the block is going to.
     * If far from the borders, avoid scrolling.
     */
    scrollWhenNearContainerBounds() {
        if (this.scrollInterval) return
        
        this.scrollInterval = setInterval(() => {
            let moveDirection = isNearBorderAndShouldScroll(this.tasksListContainer!, this.scrollWindowCursorPos)
            
            if (moveDirection === "up") {
                this.tasksListContainer!.scrollTop -= 10
            }
            else if (moveDirection === "down") {
                this.tasksListContainer!.scrollTop += 10
            }
            else if (moveDirection === "right") {
                this.tasksListContainer!.scrollLeft += 10
            }
            else if (moveDirection === "left") {
                this.tasksListContainer!.scrollLeft -= 10
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
    async addNewTask(args: { 
        idx?: number, 
        parentId: string | null,
        type:  "sibling" | "child"
    }) {
        const { idx, parentId, type } = args
        const newId   = crypto.randomUUID()
        const newIdx  = idx ?? this.tasks.getSubtasks(parentId).length
        const isChild = type === "child"

        const task = {
            id: newId,
            idx: newIdx,
            isChecked: false,
            title: "",
            description: "",
            parentId: parentId ?? null
        }

        this.tasks.addTask({ task, type: "new" })
        
        this.onTaskJustAdded({
            expandId:      isChild ? parentId! : undefined,
            isExpandChild: isChild ? !this.tasks.isRootTask(parentId!) : undefined,
            focusId:       newId,
            isFocusChild:  !this.tasks.isRootTask(newId!)
        })

        this.finalizeAddTask(task, "add", [task])
    }

    duplicateTask(dupId: string) {
        const added = this.tasks.duplicateTask(dupId)
        this.finalizeAddTask(this.tasks.getTask(dupId)!, "duplicate", added)
    }

    async removeTask(id: string) {
        const task = this.tasks.getTask(id)!
        const removed = this.tasks.removeTask(id)
        this.finalizeRemoveTask(task, removed!)

        // move focus up
        this.handleArrowkeyPressed("ArrowUp")
    }

    async toggleTaskComplete(taskId: string) {
        this.tasks.toggleTaskComplete(taskId)

        this.finalizeEditTask(this.tasks.getTask(taskId)!, "completion")
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

    async finalizeAddTask(task: Task, action: "add" | "duplicate", added: Task[]) {
        if (!this.options.handlers?.onAddTask) return
        const tasks = this.tasks.getAllTasks()

        const res = await this.options.handlers.onAddTask({
            action: action,
            payload: { task, tasks, added }
        })

        // if api returns its own id for the new task
        // if (action === "add" && res && "id" in res) {
        //     this.tasks.updateNewTaskId(task.id, res.id)
        // }
    }

    async finalizeRemoveTask(task: Task, removed: Task[]) {
        if (!this.options.handlers?.onDeleteTask) return

        const tasks = this.tasks.getAllTasks()
        const undoFunction = () => this.tasks.onRemoveUndo(task, removed)

        this.options.handlers.onDeleteTask({
            payload: { 
                task, 
                removed,
                tasks 
            },
            undoFunction
        })
    }

    async finalizeEditTask(task: Task, action: TaskUpdateActions) {
        if (!this.options?.handlers?.onTaskUpdate) return
        const tasks = this.tasks.getAllTasks()

        this.options.handlers.onTaskUpdate({
            action,
            payload: { task, tasks },
        })
    }

    /* context menu */

    openContextMenu = (e: Event, taskId: string, isChild: boolean) => {
        const pe = e as PointerEvent
        const target = pe.target as HTMLElement

        if (isEditTextElem(target) || target.tagName === "BUTTON") {  
            this.contextMenu = { left: -1000, top: -1000 }
            return
        }
        
        const containerElem = this.tasksListContainer!
        const scrollTop     = this.tasksListContainer!.scrollTop
        
        const cursorPos = {
            left: this.cursorPos.left,
            top: this.cursorPos.top - scrollTop
        }
        const { left, top } = initFloatElemPos({
            dims: { 
                height: 220,
                width: this.CONTEXT_MENU_WIDTH + 25
            }, 
            containerDims: { 
                height: containerElem.clientHeight, width: containerElem.clientWidth 
            },
            cursorPos
        })
        
        this.initFocusTask(taskId, isChild)
        this.update({
            contextMenu: { left, top },
            isContextMenuOpen: true
        })
    }

    onContextMenuClickedOutside() {
        if (this.isContextMenuOpen) {
            this.closeContextMenu()
        }
    }

    /**
     * Called when user clicks an option from Task or Subtask dropdown menu
     * 
     * @param optionIdx   Click Event
     */
    contextMenuHandler (context: DropdownItemClickedContext) {
        if (!this.focusTask) return

        const option = context.name
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
        this.isContextMenuOpen = false
        this.update({ isContextMenuOpen: false })
        
        // allow for dmenu fade out animation to finish
        setTimeout(() => {
            this.contextMenu = { left: -1000, top: -1000 }
            this.hasJustClosedContextMenu = true

            this.update({
                contextMenu: this.contextMenu,
                isContextMenuOpen: false
            })
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

        const taskElem = taskElems[this.focusElemIdx]
        const isChild = taskElem.classList.contains("task--subtask")
        const id = taskElem.id.split("task-id--")[1]
        const task = this.tasks.getTask(id)

        if (task) {
            this.focusTask = { ...task!, isChild }
        }

        this.update({ focusTask: this.focusTask })
    }

    /**
     * Shortcut handler for tasks view component.
     * @param event   Keyboard event
     */
    keyboardShortcutHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const isEditing = isEditTextElem(target)
        const { key, metaKey, shiftKey, ctrlKey, code } = event

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
        const { id, isChild, idx, parentId } = this.focusTask
        
        if (event.code === "Space") {
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
        const taskContainer = this.getElemById("tasks-list-container")!
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
        if (!this.focusTask || this.isContextMenuOpen || !event.detail?.target) {
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

        this.focusTask = null
        this.focusElemIdx = -1
        this.update({ focusTask: null })

        if (this.pickedTask) {
            this.minimizeExpandedTask()
        }
    }

    onError(error: any) {
        console.error(error)
    }

    /**
     * Get the context menu options for both tasks and subtasks.
     * @returns 
     */
    getContextMenuOptions() {
        const { subtasks, allowDuplicate } = this.settings
        const addSubtaskOptn = subtasks ? [{
            name: "Add Subtask",
            rightIcon: {
                type: "hotkey",
                icon: ["shift", "plus"]
            }
        } as DropdownOption] : []

       return [
            {
                options: [...addSubtaskOptn]
            },
            {
                options: [
                    { 
                        name: "Add Task Above",
                        rightIcon: {
                            type: "hotkey",
                            icon: ["shift", "up"]
                        }
                    },
                    { 
                        name: "Add Task Below",
                        rightIcon: {
                            type: "hotkey",
                            icon: ["shift", "down"]
                        }
                    },
                    ...(allowDuplicate ? [{ 
                        name: "Duplicate Task",
                        rightIcon: {
                            type: "hotkey",
                            icon: ["ctrl", "d"]
                        }
                    }] : [])
                ]
            },
            { 
                name: "Delete Task",
                rightIcon: {
                    type: "hotkey",
                    icon: ["ctrl", "delete"]
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
        if (newState.isContextMenuOpen != undefined) newStateObj.isContextMenuOpen = newState.isContextMenuOpen

        return newStateObj
    }
}