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