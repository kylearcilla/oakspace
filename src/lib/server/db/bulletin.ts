import { db } from "./drizzle"
import { notes } from "./general-schema"
import { and, eq, gt, sql, gte } from "drizzle-orm"

export async function getNotes(userId: string): Promise<Note[]> {
    const result = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(notes.idx)
      .execute()
    
    return result as Note[]
}

export async function createNote({ idx, text, userId }: { idx: number, text: string, userId: string }): Promise<string | null> {
  let newId: string | null = null

  await db.transaction(async (trx) => {
    await trx
        .update(notes)
        .set({ idx: sql`idx + 1` })
        .where(and(gte(notes.idx, idx), eq(notes.userId, userId)))
        .execute()

    const result = await trx
        .insert(notes)
        .values({ idx, text, userId })
        .returning()
        .execute()

    newId = result[0].id
  })

  return newId
}

export async function deleteNote({ noteId, idx, userId }: { noteId: string, idx: number, userId: string }) {
    console.log(idx)
    await db.transaction(async (trx) => {
        await trx
            .delete(notes)
            .where(and(eq(notes.idx, idx), eq(notes.userId, userId)))
            .execute()

        await trx
            .update(notes)
            .set({ idx: sql`idx - 1` })
            .where(and(gt(notes.idx, idx), eq(notes.userId, userId)))
            .execute()
    })

    return true
}

export async function updateNote({ noteId, text }: { noteId: string, text: string }): Promise<Note | undefined> {
  const result = await db
    .update(notes)
    .set({ text })
    .where(eq(notes.id, noteId))
    .returning()
    .execute()

  return result[0] as Note | undefined
}
  