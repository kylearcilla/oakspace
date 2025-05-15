import { db } from "./drizzle"
import { eq, and } from "drizzle-orm"
import { uiOptions, homeView, notes, textEntries, todos } from "./general-schema"
import { getNotes } from "./bulletin"

/* home view data */

export async function getHomeViewData(userId: string): Promise<{ homeView: HomeViewDB, notes: Note[] } | undefined> {
  const result = await db
    .select()
    .from(homeView)
    .where(eq(homeView.userId, userId))
    .execute() as HomeViewDB[]

  const notes = await getNotes(userId)

  if (!result.length || !result[0] || !notes) {
    return undefined
  }

  return { homeView: result[0], notes }
}

export async function updateHomeViewData(userId: string, data: Partial<HomeViewDB>): Promise<boolean> {
  await db
    .update(homeView)
    .set(data)
    .where(eq(homeView.userId, userId))
    .execute()

  return true
}

/* ui options data */

export async function getUiOptions(userId: string): Promise<UiOptionsDB | undefined> {
  const result = await db
    .select()
    .from(uiOptions)
    .where(eq(uiOptions.userId, userId))
    .execute()

  return result[0] as UiOptionsDB
}

export async function updateUiOptions(userId: string, data: Partial<UiOptionsDB>): Promise<boolean> {
  await db
    .update(uiOptions)
    .set(data)
    .where(eq(uiOptions.userId, userId))
    .execute()

  return true
}

/* bulletin notes data */

export async function getNoteById(noteId: string): Promise<Note | undefined> {
  const result = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .execute()
  
  return result[0] as Note | undefined
}

/* text entries data */

export async function getTextEntryById(entryId: string): Promise<TextEntryDB> {
    const result = await db
      .select()
      .from(textEntries)
      .where(eq(textEntries.id, entryId))
      .execute()
    
    return result[0] as TextEntryDB
}

export async function getTextEntries({ 
  userId, 
  period, 
  isoDate 
}: { 
  userId: string, 
  period?: string, 
  isoDate?: string 
}): Promise<TextEntryDB[]> {
  let conditions = eq(textEntries.userId, userId)
  
  if (period) {
    conditions = and(conditions, eq(textEntries.period, period))
  }
  
  if (isoDate) {
    conditions = and(conditions, eq(textEntries.isoDate, isoDate))
  }
  
  const result = await db
    .select()
    .from(textEntries)
    .where(conditions)
    .execute()
  
  return result as TextEntryDB[]
}