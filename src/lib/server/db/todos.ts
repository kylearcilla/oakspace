import { db } from "./drizzle"
import { eq } from "drizzle-orm"
import { todos } from "./general-schema"

export async function getTodos(userId: string): Promise<Task[]> {
    const result = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .execute()
    
    return result as Task[]
}

export async function updateTodo(id: string, todo: Partial<Omit<Task, "id">>): Promise<Task[]> {
    const result = await db
      .update(todos)
      .set({ ...todo })
      .where(eq(todos.id, id))
      .execute()
    
    return result as Task[]
}

export async function deleteTodo(id: string): Promise<Task[]> {
    const result = await db
      .delete(todos)
      .where(eq(todos.id, id))
      .execute()
    
    return result as Task[]
}