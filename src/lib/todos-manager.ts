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
    tasksBeforeRemove: Task[] = []

    /* todoists */
    onTodoist = false
    todoistInboxProjectId = ""
    todoistLinked = false
    todoistAccessToken = ""
    todoistSyncToken = ""
    
    store!: Writable<TodosManager>

    LOADING_TOAST_DURATION = 15_000

    constructor() {
        this.inboxTasks = TEST_TASKS
        this.store = writable(this)

        const todoistRedirect = didTodoistAPIRedirect()

        if (this.hasTodoistSession()) {
            this.loadTodoistData()
        }
        else if (!todoistRedirect) {
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

        this.saveTodoistData(state)
    }
    
    /* todoist */
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

    loginTodoist() {
        toast("promise", { loading: 'Logging in...' }, this.initTodoist())
    }

    private async initTodoist() {
        await initTodoistAPI()
        
        // navigation to consent screen takes time
        return new Promise<void>((resolve) => setTimeout(() => resolve(), this.LOADING_TOAST_DURATION))
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

    /**
     * Continues the Todoist API OAuth 2.0 flow after a successful redirect.
     */
    async continueTodoistAPIOAuthFlow() {
        try {
            const authRes = await authTodoistAPI()
            this.todoistAccessToken = authRes.access_token
            await this.initTodistUserItems()

            this.onTodoist = true
            this.todoistLinked = true
            this.currTasks = this.todoistTasks!
            
            this.update({ 
                onTodoist: true,
                todoistLinked: true
            })
            
            this.initToast({
                icon: LogoIcon.Todoist,
                message: "Todoist",
                description: "Todoist sync successful!"
            })
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /**
     * Gets Todoist user tasks and data through a full sync.
     */
    async initTodistUserItems(continueSession?: boolean) {
        try {
            const { tasks, syncToken, projectId } = await syncTodoistUserItems({ 
                accessToken: this.todoistAccessToken,
                inboxProjectId: this.todoistInboxProjectId,
                syncToken: "*"
            })

            // sort tasks alphabetically
            this.todoistTasks = TodosManager.sortTasks(tasks)
            this.todoistSyncToken = syncToken
            
            if (projectId) {
                this.todoistInboxProjectId = projectId
            }
            if (continueSession) {
                this.currTasks = this.onTodoist ? this.todoistTasks! : this.currTasks

                this.update({ renderFlag: !this.renderFlag })
            }
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    async refreshTodoist() {
        await this.initPartialSync()
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

            if (this.onTodoist) {
                this.currTasks = this.todoistTasks!
                this.update({ renderFlag: !this.renderFlag })
            }
        }
        catch(e) {
            this.onError(new APIError(APIErrorCode.GENERAL, "There was an error syncing your Todoist data."))
        }
    }
    
    /* client handlers */

    onTaskUpdate = async (context: TaskUpdateContext) => {
        const { action, payload: { task, tasks }, undoFunction } = context

        const { title: name, isChecked: complete } = task
        const description = "description" in task ? task.description : ""
        const isRecurring = "isRecurring" in task ? task.isRecurring as boolean : undefined
        const dueDate     = "due" in task ? task.due as string : undefined
        const todoist     = this.todoistLinked

        try {
            if (todoist && action === "completion") {
                // const couldOccurSameDay = isRecurring && dueDate?.includes("T")

                await updateTodoistTaskCompletion({
                    accessToken: this.todoistAccessToken,
                    syncToken: this.todoistSyncToken,
                    taskId: task.id,
                    isRecurring,
                    dueDate,
                    complete: complete!
                })

                // unwritten understanding that todos are for today
                // so completed recurring tasks can be shown again if due shortly after on the same day
                // for now recurring tasks are treated as normal tasks

                // if (couldOccurSameDay) {
                //     this.initPartialSync()
                // }
                this.todoistTasks = tasks

                if (complete) {
                    this.initActionToast({ 
                        action: "completion", 
                        name, 
                        func: undoFunction 
                    })
                }

            }
            else if (todoist && action != "reorder") {
                // reorders are local and not synced to Todoist
                await updateTodoistTask({
                    accessToken: this.todoistAccessToken,
                    syncToken: this.todoistSyncToken,
                    taskId: task.id,
                    ...(action === "new-parent" && { parentId: task.parentId }),
                    ...(action === "name" && { name }),
                    ...(action === "description" && { description })
                })
            }
        }
        catch(error: any) {
            this.onError(error)
        }
    }
    
    onAddTask = async (context: TaskAddContext) => {
        const { payload: { task, tasks }  } = context
        let id = undefined

        try {
            if (this.todoistLinked) {
                 id = (await addTodoistTask({
                    accessToken: this.todoistAccessToken,
                    projectId: this.todoistInboxProjectId,
                    parentId: task.parentId,
                    name: task.title
                })).taskId

                this.todoistTasks = tasks
            }
            else {
                id = crypto.randomUUID()
            }

            this.currTasks = tasks
        }
        catch(error: any) {
            this.onError(error)
        }
        finally {
            return { id }
        }
    }

    onDeleteTask = async (context: TaskDeleteContext) => {
        // "task" (singular parent task) is null if completed tasks were removed
        const { payload: { tasks, task, removed }, undoFunction } = context
        const todoist = this.todoistLinked
        
        try {
            // undo action not available for Todoist
            if (todoist) {
                await deleteTodoistTask({
                    accessToken: this.todoistAccessToken,
                    taskId: task!.id
                })
            }
            
            this.tasksBeforeRemove = this.currTasks
            this.initActionToast({
                name:         task?.title,
                action:       task ? "delete" : "removed-completed", 
                removedCount: task ? undefined : removed.length,
                func:         todoist ? undefined : undoFunction
            })

            this.currTasks = tasks
        }
        catch(error: any) {
            this.onError(error)
        }
    }

    /* toasts */

    /**
     * Initializes a toast element with an undo function.
     * @param context 
     */
    initActionToast(context: {
        action: TaskUpdateActions | "add" | "delete" | "removed-completed",
        name?: string,
        removedCount?: number,
        func?: FunctionParam
    }) {
        const { action, name, func, removedCount } = context
        const todoist = this.todoistLinked
        const resetTasks = () => {
            if (this.todoistLinked) {
                this.todoistTasks = this.tasksBeforeRemove
            }
            
            this.currTasks = this.tasksBeforeRemove
            this.tasksBeforeRemove = []
        }

        if (action === "add" && todoist) {
            this.initToast({
                icon: LogoIcon.Todoist,
                message: `"${name}" added to from your ${todoist ? "Todoist" : ""} Inbox`
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
        const _func = () => {
            func!()
            resetTasks()
        }

        if (action === "delete" && todoist) {
            this.initToast({
                icon: LogoIcon.Todoist,
                message: "Todoist",
                description: `"${name}" deleted from your Todoist Inbox`
            })
        }
        else if (action === "delete") {
            this.initUndoToast({
                description: `"${name}" deleted from your Inbox`,
                func: _func
            })
        }
        else if (action === "removed-completed") {
            const removed = removedCount!
            this.initUndoToast({
                icon: todoist ? LogoIcon.Todoist : undefined,
                description: `Completed tasks removed ${removed ? `(${removed})` : ""}.`,
                func: _func
            })
        }
    }

    /**
     * Creates a toast with an undo function.
     * @param options  Toast details (description + function).
     */
    initUndoToast(options: { icon?: string | LogoIcon, description: string, func?: FunctionParam }) {
        const { description, func, icon } = options
        if (!func) return

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

    initToast(options: { icon?: string | LogoIcon, message: string, description?: string }) {
        const { description, message, icon } = options

        toast("default", {
            icon,
            message,
            description,
            contextId: "todos"
        })
    }

    /* handlers */
    onError(error: any) {
        console.error(error)
        toastApiErrorHandler({ 
            error, 
            logoIcon: LogoIcon.Todoist,
            title: "Todoist"
        })
    }

    /**
     * Sort by alphabetical order
     * 
     * @param tasks 
     * @returns     Sorted tasks
     */
    static sortTasks(tasks: Task[]) {
        let orderIdx = 0
        tasks.sort((a, b) => a.title.localeCompare(b.title))
        tasks.forEach(task => task.idx = orderIdx++)
        return tasks
    }

    /* state */
    
    hasTodoistSession() {
        return localStorage.getItem("todoist") != null
    }

    saveTodoistData(state: TodosManager) {
        localStorage.setItem("todoist", JSON.stringify({
            onTodoist: state.onTodoist!,
            todoistLinked: state.todoistLinked!,
            todoistAccessToken: state.todoistAccessToken!
        }))
    }

    loadTodoistData() {
        const savedData = JSON.parse(localStorage.getItem("todoist")!)! as Partial<TodosManager>
        
        this.onTodoist = savedData.onTodoist!
        this.todoistLinked = savedData.todoistLinked!

        if (this.todoistLinked) {
            this.todoistAccessToken = savedData.todoistAccessToken!
            this.initTodistUserItems(true)
        }

        this.update({ 
            onTodoist: this.onTodoist,
            todoistLinked: this.todoistLinked
        })
    }

    getNewStateObj(oldState: TodosManager, newState: Partial<TodosManager>): TodosManager {
        if (newState.todoistLinked != undefined) oldState.todoistLinked = newState.todoistLinked
        if (newState.onTodoist != undefined)     oldState.onTodoist = newState.onTodoist
        if (newState.renderFlag != undefined)     oldState.renderFlag = newState.renderFlag

        return oldState
    }
}