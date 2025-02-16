import { get, writable, type Writable } from "svelte/store"

import { APIError } from "./errors"
import { TEST_TASKS } from "$lib/mock-data"
import { APIErrorCode, LogoIcon } from "./enums"

import { toast } from "./utils-toast"
import { getCheerEmoji, removeItemFromArray, toastApiErrorHandler } from "./utils-general"
import { 
        addTodoistTask, authTodoistAPI, deleteTodoistTask, didTodoistAPIRedirect, 
        initTodoistAPI, syncTodoistUserItems, updateTodoistTask, 
        updateTodoistTaskCompletion 
} from "./api-todoist"

type TaskRemoveContext = {
    tasks: Task[]
    context: "inbox" | "todoist"
}

/**
 * State handler for tasks view in the right side bar.
 * Is itself a svelte store that Tasks component listens to for changes.
 */
export class TodosManager {
    /* groups */
    todoistTasks: Task[] | null = null
    currTasks: Task[] = []
    inboxTasks: Task[] = []
    renderFlag = false

    // tasks to be init when undo
    tasksBeforeRemove: TaskRemoveContext = { tasks: [], context: "inbox" }

    /* todoists */
    onTodoist = false
    todoistInboxProjectId = ""
    todoistLinked = false
    todoistAccessToken = ""
    todoistSyncToken = ""
    
    fullSyncCount = 0
    partialSyncCount = 0
    refreshDebounceTimeout: NodeJS.Timeout | null = null
    lastFullSyncTime: number | null = null    

    autoSyncTimeStamp = new Date()
    lastSyncTimeStamp = new Date()
    lastSyncWindowStart = Date.now()

    loading: "init" | "sync" | "none" = "none"
    store!: Writable<TodosManager>
    
    private readonly DEBOUNCE_MS = 500
    private readonly FULL_SYNC_COOLDOWN_MS = 5000
    
    private readonly MAX_FULL_SYNCS = 90     
    private readonly MAX_PARTIAL_SYNCS = 900 
    private readonly SYNC_WINDOW_MS = 15 * 60 * 1000
    private LOADING_TOAST_DURATION = 15_000
    private AUTO_REFRESH_INTERVAL_MINS = 5

    constructor() {
        this.inboxTasks = TEST_TASKS
        this.store = writable(this)

        const todoistRedirect = didTodoistAPIRedirect()

        if (this.hasTodoistSession()) {
            this.loadTodoistData()
        }
        if (!todoistRedirect) {
            this.currTasks = this.inboxTasks
        }
        if (todoistRedirect) {
            this.continueTodoistAPIOAuthFlow()
        }
    }

    update(newState: Partial<TodosManager>) {
        let state = get(this.store)
        
        this.store.update((data: TodosManager | null) => {
            state = this.getNewStateObj(data!, newState)!
            return state
        })

        this.saveTodoistData()
    }

    toggleView() {
        if (!this.todoistLinked) return
        this.onTodoist = !this.onTodoist

        if (this.onTodoist) {
            this.currTasks = this.todoistTasks!
        }
        else {
            this.currTasks = this.inboxTasks
        }
        this.update({ onTodoist: this.onTodoist })
    }

    /* todoist */

    loginTodoist(redirectBackUrl: string) {
        localStorage.setItem("redirect-back-url", redirectBackUrl)
        toast("promise", { loading: 'Logging in...' }, this.initTodoist())
    }

    logoutTodoist() {
        this.todoistInboxProjectId = ""
        this.onTodoist = false
        this.todoistLinked = false
        this.todoistAccessToken = ""
        this.todoistSyncToken = ""
        this.todoistTasks = []
        this.currTasks = this.inboxTasks

        this.initToast({
            icon: LogoIcon.Todoist,
            message: "Account disconnected"
        })
        this.update({
            onTodoist: false,
            todoistInboxProjectId: "",
            todoistLinked: false,
            todoistAccessToken: "",
            todoistSyncToken: ""
        })
        localStorage.removeItem("todoist")
    }

    private async initTodoist() {
        await initTodoistAPI()
        
        // navigation to consent screen takes time
        return new Promise<void>((resolve) => setTimeout(() => resolve(), this.LOADING_TOAST_DURATION))
    }

    /** 
     * Continues the Todoist API OAuth 2.0 flow after a successful redirect.
     */
    async continueTodoistAPIOAuthFlow() {
        try {
            this.update({ loading: "init" })
            const authRes = await authTodoistAPI()
            this.todoistAccessToken = authRes.access_token
            await this.initTodoistUserItems()

            this.onTodoist = true
            this.todoistLinked = true
            this.currTasks = this.todoistTasks!
            
            this.update({ 
                loading: "none",
                onTodoist: true,
                todoistLinked: true
            })
            this.initToast({
                icon: LogoIcon.Todoist,
                message: "Todoist",
                description: "Todoist sync successful!"
            })
            this.autoSyncTimeStamp = new Date()
        }
        catch(error: any) {
            this.currTasks = this.inboxTasks
            this.update({ 
                currTasks: this.currTasks, 
                loading: "none",
                renderFlag: !this.renderFlag
            })

            this.onTodistError(error)
        }
    }

    /**
     * Gets Todoist user tasks and data through a full sync.
     */
    async initTodoistUserItems(continueSession?: boolean) {
        try {
            const { tasks, syncToken, projectId } = await syncTodoistUserItems({ 
                accessToken: this.todoistAccessToken,
                inboxProjectId: this.todoistInboxProjectId,
                syncToken: "*"
            })

            // sort tasks alphabetically
            this.todoistTasks = TodosManager.sortTasks(tasks)
            this.todoistSyncToken = syncToken
            this.lastSyncTimeStamp = new Date()
            
            if (projectId) {
                this.todoistInboxProjectId = projectId
            }
            if (continueSession) {
                this.currTasks = this.onTodoist ? this.todoistTasks! : this.currTasks
                this.update({ renderFlag: !this.renderFlag })
            }

            this.autoSyncTimeStamp = new Date()

        }
        catch(error: any) {
            this.onTodistError(error)
        }
    }

    /**
     * Initalize a partial sync. 
     * Incorporates changes last made after a full or last partial sync.
     */
    private async initPartialSync() {
        try {
            const { tasks: syncTasks, syncToken } = await syncTodoistUserItems({ 
                accessToken: this.todoistAccessToken,
                syncToken: this.todoistSyncToken,
                inboxProjectId: this.todoistInboxProjectId
            })
            const todoistTasks = this.todoistTasks!
            const newTasks: Task[] = []
            
            // check to see tasks were updated (if one of the sync tasks)
            for (let i = 0; i < todoistTasks.length; i++) {
                const task = todoistTasks[i]
                const { action, syncTask, idx } = this.getTaskSyncAction(syncTasks, task)

                if (syncTask) {
                    removeItemFromArray(idx, syncTasks)
                }
                if (action === "deleted") {
                    continue
                }
                else if (action === "updated" && !syncTask!.isChecked) {
                    newTasks.push({ ...syncTask! })
                }
                else if (action === "none") {
                    newTasks.push({ ...task })
                }
            }
            
            // incorporate any new tasks from the sync
            syncTasks.forEach(t => newTasks.push(t))
    
            this.todoistSyncToken = syncToken
            this.todoistTasks = TodosManager.sortTasks(newTasks)
            this.lastSyncTimeStamp = new Date()

            if (this.onTodoist) {
                this.currTasks = this.todoistTasks!
                this.update({ renderFlag: !this.renderFlag })
            }
        }
        catch(e) {
            this.onTodistError(new APIError(APIErrorCode.GENERAL, "There was an error syncing your Todoist data."))
        }
    }

    /* refreshes */

    async refreshTodoist() {
        if (this.refreshDebounceTimeout || !this.todoistLinked) {
            return
        }

        this.refreshDebounceTimeout = setTimeout(async () => {
            this.update({ loading: "sync" })
            this.resetSyncCountsIfNeeded()

            try {
                const canPartialSync = this.canDoPartialSync()
                const canFullSync = this.canDoFullSync()

                if (!canPartialSync && !canFullSync) {
                    this.onTodistError(new APIError(APIErrorCode.RATE_LIMIT_HIT))
                    return
                }
                
                this.autoSyncTimeStamp = new Date()
                await this.performSync(canFullSync)
            } 
            finally {
                this.saveTodoistData()
                this.update({ loading: "none" })
                this.refreshDebounceTimeout = null
            }
        }, this.DEBOUNCE_MS)
    }

    async autoRefreshHandler(date: Date) {
        if (!this.autoSyncTimeStamp || !this.todoistLinked) {
            this.autoSyncTimeStamp = new Date()
        }
        const diff = date.getTime() - this.autoSyncTimeStamp.getTime()

        if (diff >= this.AUTO_REFRESH_INTERVAL_MINS * 60 * 1000) {
            this.update({ loading: "sync" })
            await this.initTodoistUserItems(true)
            console.log("auto refresh")

            this.saveTodoistData()
            this.update({ loading: "none" })

            this.autoSyncTimeStamp = new Date()
        }
    }

    private async performSync(isFullSync: boolean) {
        if (isFullSync) {
            await this.initTodoistUserItems(true)
            this.lastFullSyncTime = Date.now()
            this.fullSyncCount++

            console.log("full sync")
        } 
        else {
            await this.initPartialSync()
            this.partialSyncCount++

            console.log("partial sync")
        }
    }

    private canDoFullSync(): boolean {
        const now = Date.now()
        const isPastCooldown = !this.lastFullSyncTime || 
                              (now - this.lastFullSyncTime) >= this.FULL_SYNC_COOLDOWN_MS
        
        return isPastCooldown && this.fullSyncCount < this.MAX_FULL_SYNCS
    }

    private canDoPartialSync(): boolean {
        return this.partialSyncCount < this.MAX_PARTIAL_SYNCS
    }

    /**
     * Checks if the 15-minute rate limit window has expired and resets sync counters if needed.
     * Todoist API limits:
     * - 100 full syncs per 15 minutes
     * - 1000 partial syncs per 15 minutes
     */
    private resetSyncCountsIfNeeded(): boolean {
        const now = Date.now()
        if (now - this.lastSyncWindowStart >= this.SYNC_WINDOW_MS) {
            this.fullSyncCount = 0
            this.partialSyncCount = 0
            this.lastSyncWindowStart = now
            return true
        }
        return false
    }

    /**
     * Find the corresponding updated item from the returned sync tasks from partial sync.
     * @param syncTasks  Updated items from last sync.
     * @param task       The updated item's correspond local item.
     * @returns          Update context from the patial sync.
     */
    getTaskSyncAction(syncTasks: TodoistTask[], task: Task): TodoistItemPartialSyncOntext {
        const idx = syncTasks.findIndex((s) => s.id === task.id)

        if (idx < 0) {
            return { action: "none", syncTask: null, idx: -1 }
        }

        const syncTask = structuredClone(syncTasks[idx])

        if (syncTask.isDeleted) {
            return { action: "deleted", syncTask, idx }
        }
        else {
            return { action: "updated", syncTask, idx }
        }
    }
    
    /* client handlers */

    onTaskUpdate = async (context: TaskUpdateContext) => {
        const { action, payload: { task, tasks }, undoFunction, removeOnComplete } = context
        const { title: name, isChecked: complete, idx } = task

        const description = "description" in task ? task.description : ""
        const isRecurring = "isRecurring" in task ? task.isRecurring as boolean : undefined
        const dueDate     = "due" in task ? task.due as string : undefined
        const todoist     = this.onTodoist

        this.autoSyncTimeStamp = new Date()

        try {
            if (action === "completion") {
                // const couldOccurSameDay = isRecurring && dueDate?.includes("T")
                if (todoist) {
                    await updateTodoistTaskCompletion({
                        accessToken: this.todoistAccessToken,
                        taskId: task.id,
                        isRecurring,
                        dueDate,
                        complete: complete!
                    })

                    // completed recurring tasks can be shown again if due shortly after on the same day
                    // todos shown are for "today"
                    // for now recurring tasks are treated as normal tasks
    
                    // if (couldOccurSameDay) {
                    //     this.initPartialSync()
                    // }
                    this.todoistTasks = tasks
                }
                if (complete && removeOnComplete) {
                    this.initActionToast({ 
                        action: "completion", 
                        name, 
                        func: undoFunction 
                    })
                }

            }
            else if (todoist) {
                await updateTodoistTask({
                    accessToken: this.todoistAccessToken,
                    taskId: task.id,
                    action,
                    ...(action === "name" && { name }),
                    ...(action === "description" && { description }),
                    ...(action === "reorder" && { idx, parentId: task.parentId })
                })
            }

            if (!todoist) {
                this.inboxTasks = tasks
            }
        }
        catch(error: any) {
            this.onTodistError(error)
        }
        finally {
            this.autoSyncTimeStamp = new Date()
        }
    }
    
    onAddTask = async (context: TaskAddContext) => {
        const { payload: { task, tasks }  } = context
        let id: string = crypto.randomUUID()
        this.autoSyncTimeStamp = new Date()

        try {
            if (this.onTodoist) {
                 id = (await addTodoistTask({
                    accessToken: this.todoistAccessToken,
                    parentId: task.parentId,
                    name: task.title
                })).taskId

                this.todoistTasks = tasks
            }
            else {
                this.inboxTasks = tasks
            }

            this.currTasks = tasks
        }
        catch(error: any) {
            this.onTodistError(error)
        }
        finally {
            return { id }
        }
    }

    onDeleteTask = async ({ payload: { tasks, task, removed }, undoFunction }: TaskDeleteContext) => {
        const action = task ? "delete" : "removed-completed"
        if (this.onTodoist && action === "removed-completed") {
            return
        }
        this.autoSyncTimeStamp = new Date()
        
        try {
            this.tasksBeforeRemove = {
                tasks: this.currTasks,
                context: this.onTodoist ? "todoist" : "inbox"
            }
            if (this.onTodoist && action === "delete") {
                await deleteTodoistTask({
                    accessToken: this.todoistAccessToken,
                    taskId: task!.id
                })
                this.todoistTasks = tasks
            } 
            else {
                this.inboxTasks = tasks
            }
            this.initActionToast({
                action, 
                name: task?.title,
                removedCount: task ? undefined : removed.length,
                func: this.onTodoist ? undefined : undoFunction
            })
            this.currTasks = tasks
            this.update({ renderFlag: !this.renderFlag })
        }
        catch(error: any) {
            this.onTodistError(error)
        }
    }

    /* toasts */

    /**
     * Initializes a toast element with an undo function.
     * @param context 
     */
    initActionToast({
        action,
        name,
        removedCount,
        func
    }: {
        action: TaskUpdateActions | "add" | "delete" | "removed-completed",
        name?: string,
        removedCount?: number,
        func?: FunctionParam
    }) {
        const resetTasks = () => {
            const { tasks: tasksToRestore, context } = this.tasksBeforeRemove
            const onTodoist = this.onTodoist
            
            if (context === "todoist") {
                this.todoistTasks = tasksToRestore

                if (onTodoist) this.currTasks = this.todoistTasks!
            } 
            else {
                this.inboxTasks = tasksToRestore

                if (!onTodoist) this.currTasks = this.inboxTasks
            }
            this.update({ renderFlag: !this.renderFlag })
            this.tasksBeforeRemove = { tasks: [], context: "inbox" }
        }

        if (action === "add" && this.onTodoist) {
            this.initToast({
                icon: LogoIcon.Todoist,
                message: `"${name}" added to from your ${this.onTodoist ? "Todoist" : ""} Inbox`
            })
        } 
        else if (action === "completion") {
            this.initUndoToast({
                icon: getCheerEmoji(),
                description: `"${name}" completed!`,
                func: func
            })
        }

        // removals
        const undoFunc = () => {
            func!()
            resetTasks()
        }

        if (action === "delete" && this.onTodoist) {
            this.initToast({
                icon: LogoIcon.Todoist,
                message: "Todoist",
                description: `"${name}" deleted from your Todoist Inbox`
            })
        }
        else if (action === "delete") {
            this.initUndoToast({
                description: `"${name}" deleted from your Inbox`,
                func: undoFunc
            })
        }
        else if (action === "removed-completed") {
            const removed = removedCount!
            this.initUndoToast({
                icon: this.onTodoist ? LogoIcon.Todoist : undefined,
                description: `Completed tasks removed ${removed ? `(${removed})` : ""}.`,
                func: undoFunc
            })
        }
    }

    /**
     * Creates a toast with an undo function.
     * @param options  Toast details (description + function).
     */
    initUndoToast({ icon, description, func = () => {} }: { 
        icon?: string | LogoIcon, description: string, func?: FunctionParam 
    }) {
        toast("default", {
            icon,
            message: description,
            contextId: "todos",
            groupExclusive: true,
            action: {
                label: "Undo", 
                onClick: () => func()
            }
        })
    }

    initToast({ icon, message, description }: { 
        icon?: string | LogoIcon, message: string, description?: string 
    }) {
        toast("default", {
            icon,
            message,
            description,
            contextId: "todos",
            groupExclusive: true
        })
    }

    /* handlers */

    static sortTasks(tasks: Task[]) {
        const taskGroups = new Map<string | null, Task[]>()
        
        tasks.forEach(task => {
            const parentId = task.parentId
            if (!taskGroups.has(parentId)) {
                taskGroups.set(parentId, [])
            }
            taskGroups.get(parentId)!.push(task)
        })

        // Recursive function to sort a group of tasks and their children
        const sortGroup = (parentId: string | null, orderIdx: number): [Task[], number] => {
            const group = taskGroups.get(parentId) || []
            const result: Task[] = []
            
            // Sort current level
            group.sort((a, b) => a.title.localeCompare(b.title))
            
            // Process each task and its children recursively
            for (const task of group) {
                task.idx = orderIdx++
                result.push(task)
                
                // Recursively sort and add all descendants
                if (taskGroups.has(task.id)) {
                    const [childTasks, newIdx] = sortGroup(task.id, orderIdx)
                    result.push(...childTasks)
                }
            }
            
            return [result, orderIdx]
        }

        const [sortedTasks] = sortGroup(null, 0)
        return sortedTasks
    }

    onTodistError(error: any) {
        console.error(error)
        toastApiErrorHandler({ 
            error, 
            logoIcon: LogoIcon.Todoist,
            title: "Todoist"
        })
    }

    /* state */
    
    hasTodoistSession() {
        return localStorage.getItem("todoist") != null
    }

    saveTodoistData() {
        localStorage.setItem("todoist", JSON.stringify({
            onTodoist: this.onTodoist!,
            todoistLinked: this.todoistLinked!,
            fullSyncCount: this.fullSyncCount,
            partialSyncCount: this.partialSyncCount,
            todoistAccessToken: this.todoistAccessToken!,
            lastFullSyncTime: this.lastFullSyncTime,
            lastSyncWindowStart: this.lastSyncWindowStart
        }))
    }

    loadTodoistData() {
        const savedData = JSON.parse(localStorage.getItem("todoist")!)! as Partial<TodosManager>
        
        this.onTodoist = savedData.onTodoist!
        this.todoistLinked = savedData.todoistLinked!

        this.fullSyncCount = savedData.fullSyncCount!
        this.partialSyncCount = savedData.partialSyncCount!
        
        this.lastFullSyncTime = savedData.lastFullSyncTime!
        this.lastSyncWindowStart = savedData.lastSyncWindowStart!
        this.todoistAccessToken = savedData.todoistAccessToken!

        this.initTodoistUserItems(true)

        if (this.onTodoist) {
            this.currTasks = this.todoistTasks!
        }
        else {
            this.currTasks = this.inboxTasks
        }

        this.update({ 
            currTasks: this.currTasks,
            onTodoist: this.onTodoist,
            todoistLinked: this.todoistLinked
        })
    }

    getNewStateObj(oldState: TodosManager, newState: Partial<TodosManager>): TodosManager {
        if (newState.todoistLinked != undefined) oldState.todoistLinked = newState.todoistLinked
        if (newState.onTodoist != undefined)     oldState.onTodoist = newState.onTodoist
        if (newState.renderFlag != undefined)    oldState.renderFlag = newState.renderFlag
        if (newState.loading != undefined)       oldState.loading = newState.loading

        return oldState
    }
}