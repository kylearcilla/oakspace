import { PUBLIC_TODOIST_CLIENT_ID, PUBLIC_TODOIST_CLIENT_SECRET } from "$env/static/public"
import { APIErrorCode } from "./enums"
import { APIError } from "./errors"
import { v4 as uuidv4 } from 'uuid'
import { TasksViewManager } from "./tasks-view-manager"

const REDIRECT_URI = "http://localhost:5173/home"
const TODOIST_SYNC_API_URL = "https://api.todoist.com/sync/v9/sync"

export async function initTodoistAPI() {
    const url = new URL("https://todoist.com/oauth/authorize")
    
    url.searchParams.append('client_id', PUBLIC_TODOIST_CLIENT_ID)
    url.searchParams.append('scope', "data:read_write,data:delete")
    url.searchParams.append('state', "d4c1a4d4-ac4b-45ea-898a-7b8fa6a189f5")

    window.location.href = url.toString()

    localStorage.setItem("tapi-state", "d4c1a4d4-ac4b-45ea-898a-7b8fa6a189f5")
}

/**
 * Runs after a successful user authorization and redirect.
 * Parses auth code from the redirect uri and requests for OAuth 2.0 access token if successful.
 */
export async function authTodoistAPI(): Promise<{ access_token: string, token_type: string }> {
    try {
        const { code, state } = verifyRedirect()
        const oAuthURL = new URL("https://todoist.com/oauth/access_token")

        const headers = new Headers()
        headers.append("Content-Type", "application/json")

        const body = {
            client_id: PUBLIC_TODOIST_CLIENT_ID,
            client_secret: PUBLIC_TODOIST_CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI
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
        throw e
    }
    finally {
        localStorage.removeItem("tapi-state")
    }
}

function verifyRedirect() {
    const url =  new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const initState = localStorage.getItem("tapi-state")

    if (error === "access_denied") {
        console.error("Access Denied.")
        throw new APIError(APIErrorCode.AUTH_DENIED)
    }
    else if (error) {
        console.error("There was an error initializing Todoist API OAuth 2.0 Flow.")
        throw new Error
    }
    else if (state != initState) {
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

export async function syncTodoistUserItems(options: {
     accessToken: string 
     syncToken: string
     inboxProjectId: string
}): Promise<{ tasks: TodoistTask[], syncToken: string, projectId?: string }> {

    try {
        // will get inbox project id if no project id is passed
        const { accessToken, syncToken, inboxProjectId } = options
        const partialSync = syncToken != "*"
        const url = new URL(TODOIST_SYNC_API_URL)

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

        // only inbox tasks are extracted
        const resId = data.user?.inbox_project_id
        const projectId = inboxProjectId ? inboxProjectId : resId ? resId : ""
        const tasks: TodoistTask[] = []
        const childTasks: TodoistTask[] = []

        // filter the parent and child tasks
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i]

            // if inbox or an updated task returned from a partial sync request
            const shouldInclude = (!partialSync && projectId === item.project_id) || (partialSync && !item.checked)

            if (!shouldInclude) continue

            const task = {
                id: item.id,
                parentId: item.parent_id ?? "",
                idx: -1,
                isChecked: item.checked,
                title: item.content,
                description: item.description,
                isDeleted: item.is_deleted,
                subtasks: [],
                isRecurring: item.due?.is_recurring ?? false,
                due: item.due?.date ?? ""
            }

            if (item.parent_id) {
                childTasks.push(task)
            }
            else {
                tasks.push(task)
            }
        }

        if (partialSync) {
            console.log([...tasks, ...childTasks])
            return {
                tasks: [...tasks, ...childTasks],
                syncToken: data.sync_token
            }
        }


        // do not include children of children
        for (let child of childTasks) {
            const parentIdx = tasks.findIndex((task) => task.id === child.parentId)

            // will be a subtask
            if (!tasks[parentIdx]?.subtasks) continue

            tasks[parentIdx].subtasks!.push(child)
        }

        return {
            tasks: TasksViewManager.sortTasks(tasks) as TodoistTask[],
            syncToken: data.sync_token,
            projectId
        }
    }
    catch(e: any) {
        console.error(e)
        throw e
    }
}

export async function updateTodoistTask(options: {
    accessToken: string 
    syncToken: string
    taskId: string
    name?: string
    description?: string
    command?: any,
}): Promise<void> {
   try {
       const { accessToken, taskId, name, description, command } = options
       const url = new URL(TODOIST_SYNC_API_URL)

       const headers = new Headers()
       headers.append("Content-Type", "application/json")
       headers.append("Authorization", `Bearer ${accessToken}`)

       const body = {
            commands: [command ? command : {
                type: "item_update",
                uuid: uuidv4(), 
                args: {
                    id: taskId,
                    ...(name && { content: name }),
                    ...(description && { description }),
                    ...(description && { description }),
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
           console.error(`There was an error updating the item. Status: ${res.status}. Error: ${data.error}.`)
           throwTodoistAPIError({ status: res.status, error: data.error })
       }
   }
   catch(e: any) {
       console.error(e)
       throw e
   }
}

export async function updateTodoistTaskCompletion(options: {
    accessToken: string 
    syncToken: string
    taskId: string
    complete: boolean
    isRecurring?: boolean
    dueDate?: string
}): Promise<void> {
   try {
       const { accessToken, taskId, syncToken, complete, isRecurring, dueDate } = options


       if (isRecurring && !complete) {
            return await updateTodoistTask({
                accessToken,
                syncToken,
                taskId,
                command: {
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

export async function addTodoistTask(options: {
    accessToken: string
    projectId: string
    name: string
    parentId?: string
}): Promise<{ taskId: string }> {
    try {
        const { accessToken, projectId, name, parentId } = options
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
                    ...(parentId && { parent_id: parentId }),
                   content: name
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

export async function deleteTodoistTask(options: {
    accessToken: string
    taskId: string

}): Promise<void> {
    try {
        const { accessToken, taskId } = options
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

const throwTodoistAPIError = (context: {
    status: number,
    error?: string
  }) => {
      const { error, status } = context

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