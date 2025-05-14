import { db } from "./drizzle"
import { eq } from "drizzle-orm"
import { users } from "./general-schema"

type UserDB = Omit<User, "stats"> & {
    goalsReached: number
    habitsDone: number
    sessions: number
    focusTime: number
    routinesMade: number
  }
  
export async function getUserById(userId: string): Promise<UserDB | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute()
    
    return result[0] as UserDB | undefined
  }  

export async function createUser(userData: Omit<UserDB, "id">) {
    const result = await db
      .insert(users)
      .values(userData)
      .returning()
      .execute()

    return result[0] as UserDB
}

export async function updateUser({ userId, data }: {
    userId: string, 
    data: Partial<Omit<UserDB, "id">>
}) {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning()
      .execute()

    return result[0] as UserDB
}

export async function deleteUser(userId: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .execute()
    
    return result.length > 0
}