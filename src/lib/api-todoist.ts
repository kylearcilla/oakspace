import { APIError } from "./errors"
import { v4 as uuidv4 } from 'uuid'
import { APIErrorCode } from "./enums"
import { PUBLIC_TODOIST_CLIENT_ID, PUBLIC_TODOIST_CLIENT_SECRET } from "$env/static/public"

const REDIRECT_URI = "http://localhost:5173/home/oauth-callback"
const TODOIST_SYNC_API_URL = "https://api.todoist.com/sync/v9/sync"
const STATE_ID = "0783d180-ab4e-4a76-9047-431e4cf919ce"

type UpdateTodoistTaskOptions = {
    accessToken: string
    taskId: string
    action: TaskUpdateActions
    name?: string
    parentId?: string | null
    description?: string
    idx?: number
    completeCommand?: any
}

type UpdateTodoistTaskCompletionOptions = {
    accessToken: string
    taskId: string
    complete: boolean
    isRecurring?: boolean
    dueDate?: string
}

/* auth */

export async function initTodoistAPI() {
    const url = new URL("https://todoist.com/oauth/authorize")
    
    url.searchParams.append('client_id', PUBLIC_TODOIST_CLIENT_ID)
    url.searchParams.append('scope', "data:read_write,data:delete")
    url.searchParams.append('state', STATE_ID)

    window.location.href = url.toString()
    localStorage.setItem("tapi-state", STATE_ID)
}

/**
 * Runs after a successful user authorization and redirect.
 * Parses auth code from the redirect uri and requests for OAuth 2.0 access token if successful.
 */
export async function authTodoistAPI(): Promise<{ access_token: string, token_type: string }> {
    try {
        const { code } = verifyRedirect()
        const oAuthURL = new URL("https://todoist.com/oauth/access_token")

        const headers = new Headers()
        headers.append("Content-Type", "application/json")

        const body = {
            client_id: PUBLIC_TODOIST_CLIENT_ID,
            client_secret: PUBLIC_TODOIST_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code
        }

        const res = await fetch(oAuthURL.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
        const data = await res.json()

        if (!res.ok) {
            console.error(`There was an error finishing OAuth 2.0 Flow. Status: ${res.status}. Error: ${data.error}.`)
            throwTodoistAPIError({ status: res.status, error: data.error })
        }
        return data
    }
    catch(e: any) {
        console.error(e)
        throw e
    }
    finally {
        localStorage.removeItem("tapi-state")
        localStorage.removeItem("tapi-code")
        localStorage.removeItem("tapi-error")
        localStorage.removeItem("tapi-ostate")
    }
}

/* redirect */

function verifyRedirect() {
    const initState = localStorage.getItem("tapi-state")
    const code = localStorage.getItem("tapi-code")
    const error = localStorage.getItem("tapi-error")
    const state = localStorage.getItem("tapi-ostate")

    if (error === "access_denied") {
        console.error("Access Denied.")
        throw new APIError(APIErrorCode.AUTH_DENIED)
    }
    else if (error) {
        console.error("There was an error initializing Todoist API OAuth 2.0 Flow.")
        throw new Error
    }
    else if (state != initState) {
        // if state returned from redirect does not match the state param in the init request
        console.error("Request to start Todoist API OAuth 2.0 flow has been compromised by other parties.")
        throw new Error
    }
    else {
        return { code, state }
    }
}

export function didTodoistAPIRedirect() {
    return Boolean(localStorage.getItem("tapi-state"))
}

/* updates  */

/**
 * Returns users' tasks or changed tasks from a partial sync.
 * First request is a full sync, subsequent requests are partial syncs.
 * Only inbox tasks are extracted.
 * 
 * @param options 
 * @returns  Tasks with sync token.
 */
export async function syncTodoistUserItems({ accessToken, syncToken, inboxProjectId }: {
     accessToken: string 
     syncToken: string
     inboxProjectId: string
}): Promise<{ tasks: TodoistTask[], syncToken: string, projectId?: string }> {
    try {
        // will get inbox project id if no project id is passed
        const url = new URL(TODOIST_SYNC_API_URL)
        const partialSync = syncToken != "*"
        const headers = new Headers()
        headers.append("Content-Type", "application/json")
        headers.append("Authorization", `Bearer ${accessToken}`)

        const body = {
            sync_token: syncToken,
            resource_types: inboxProjectId ? ["items"] : ["user", "items"]
        }
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
        const data = await res.json()

        if (!res.ok) {
            console.error(`There was an error fetching user items. Status: ${res.status}. Error: ${data.error}.`)
            throwTodoistAPIError({ status: res.status, error: data.error })
        }

        // need the project id on the first full sync
        const resId = data.user?.inbox_project_id
        const projectId = inboxProjectId ? inboxProjectId : resId ? resId : ""
        const tasks: TodoistTask[] = []


        // on partial syncs, get the updated tasks
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i]

            // do not include completed tasks on initial syncs
            // project is "0" on partial syncs
            const shouldInclude = (projectId === item.project_id && !partialSync && !item.checked) || partialSync
            if (!shouldInclude) continue

            const task = {
                id: item.id,
                parentId: item.parent_id ?? null,
                idx: item.child_order,
                isChecked: item.checked,
                title: item.content,
                description: item.description,
                isDeleted: item.is_deleted,
                isRecurring: item.due?.is_recurring ?? false,
                due: item.due?.date ?? ""
            }
            tasks.push(task)
        }

        if (partialSync) {
            return {
                tasks,
                syncToken: data.sync_token
            }
        }
        return {
            tasks,
            syncToken: data.sync_token,
            projectId
        }
    }
    catch(e: any) {
        console.error(e)
        throw e
    }
}

/**
 * Updates a Todoist task.
 * Used to update a task's name, description, or due date (checking off a recurring task).
 * 
 * @param options 
 */
export async function updateTodoistTask({
    accessToken,
    taskId,
    name,
    parentId,
    description,
    idx,
    completeCommand,
    action,
}: UpdateTodoistTaskOptions): Promise<void> {
   try {
       const url = new URL(TODOIST_SYNC_API_URL)
       const headers = new Headers()
       headers.append("Content-Type", "application/json")
       headers.append("Authorization", `Bearer ${accessToken}`)

       const commands = []

       // completion updates
       if (action === "completion") {
           commands.push(completeCommand)
        }
        // reorder updates
       if (action === "reorder") {
            // commands.push({
            //     type: "item_reorder",
            //     uuid: uuidv4(),
            //     args: {
            //         id: taskId,
            //         items: [{ id: taskId, child_order: idx }]
            //     }
            // })
            commands.push({
                type: "item_move",
                uuid: uuidv4(),
                args: {
                    id: taskId, parent_id: parentId
                }
            })
       }
       // text updates
       else {
            commands.push({
                type: "item_update",
                uuid: uuidv4(),
                args: {
                    id: taskId,
                    ...(name && { content: name }),
                    ...(description !== undefined && { description }),
                }
            })
       }

       const res = await fetch(url.toString(), {
           method: 'POST',
           headers,
           body: JSON.stringify({ commands })
       })
       const data = await res.json()
       if (!res.ok) {
           console.error(`There was an error updating the item. Status: ${res.status}. Error: ${data.error}.`)
           throwTodoistAPIError({ status: res.status, error: data.error })
       }
   }
   catch(e: any) {
       console.error(e)
       throw e
   }
}

/**
 * Updates a Todoist task's completion status.
 * Used to check off a task or uncheck a task.
 * If a recurring task is checked off, it will be updated to the next due date.
 * 
 * @param options 
 */
export async function updateTodoistTaskCompletion({
    accessToken, 
    taskId, 
    complete, 
    isRecurring, 
    dueDate
}: UpdateTodoistTaskCompletionOptions): Promise<void> {
   try {       
       // recurring task
       if (isRecurring && !complete) {
            return await updateTodoistTask({
                accessToken,
                taskId,
                action: "completion",
                completeCommand: {
                    type: "item_update",
                    uuid: uuidv4(), 
                    args: {
                        id: taskId,
                        due: { date: dueDate! }
                    }
                }
            })
       }

       const url = new URL(TODOIST_SYNC_API_URL)
       const headers = new Headers()
       headers.append("Content-Type", "application/json")
       headers.append("Authorization", `Bearer ${accessToken}`)

       const body = {
            commands: [{ 
                type: complete ? "item_close" : "item_uncomplete",
                uuid: uuidv4(),
                args: {
                    id: taskId
                }
            }]
       }
       const res = await fetch(url.toString(), {
           method: 'POST',
           headers,
           body: JSON.stringify(body)
       })

       const data = await res.json()
       if (!res.ok) {
           console.error(`There was an error updating the task completion. Status: ${res.status}. Error: ${data.error}.`)
           throwTodoistAPIError({ status: res.status, error: data.error })
       }
   }
   catch(e: any) {
       console.error(e)
       throw e
   }
}

export async function addTodoistTask({ accessToken, name, parentId }: {
    accessToken: string 
    name: string 
    parentId?: string | null
}): Promise<{ taskId: string }> {
    try {
        const url = new URL(TODOIST_SYNC_API_URL)
        const headers = new Headers()
        headers.append("Content-Type", "application/json")
        headers.append("Authorization", `Bearer ${accessToken}`)

        const TEMP_ID = "tempId"
        const body = {
            commands: [{
                type: "item_add",
                temp_id: TEMP_ID,
                uuid: uuidv4(),
                args: {
                   content: name,
                   parent_id: parentId
                }
            }]
        }
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
 
        const data = await res.json()
        if (!res.ok) {
            console.error(`There was an error adding task. Status: ${res.status}. Error: ${data.error}.`)
            throwTodoistAPIError({ status: res.status, error: data.error })
        }
 
        return { taskId: data.temp_id_mapping[TEMP_ID] }
    }
    catch(e: any) {
        console.error(e)
        throw e
    }
}

export async function deleteTodoistTask({ accessToken, taskId}: {
    accessToken: string, taskId: string
}) {
    try {
        const url = new URL(TODOIST_SYNC_API_URL)
 
        const headers = new Headers()
        headers.append("Content-Type", "application/json")
        headers.append("Authorization", `Bearer ${accessToken}`)
 
        const body = {
            commands: [{
                type: "item_delete",
                uuid: uuidv4(), 
                args: {
                   id: taskId
                }
            }]
        }
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
 
        const data = await res.json()
        if (!res.ok) {
            console.error(`There was an error deleting the task. Status: ${res.status}. Error: ${data.error}.`)
            throwTodoistAPIError({ status: res.status, error: data.error })
        }
    }
    catch(e: any) {
        console.error(e)
        throw e
    }
}

/**
 * https://developer.todoist.com/rest/v2
 */
const throwTodoistAPIError = ({ status, error }: {
    status: number,
    error?: string
}) => {
    if (status === 404) {
        throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND)
    }
    else if (status == 429) {
        throw new APIError(APIErrorCode.RATE_LIMIT_HIT)
    }
    else if (status === 500 || status === 503) {
        throw new APIError(APIErrorCode.API_SERVER)
    }
    else {
        throw new APIError(APIErrorCode.GENERAL, "There was an error with Todoist. Please try again later.")
    }
}