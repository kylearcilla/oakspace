import { db } from "./drizzle"
import { eq, and } from "drizzle-orm"
import { homeView, notes, textEntries, todos } from "./general-schema"
import { getNotes } from "./bulletin"

type HomeViewDB = {
  id: string
  headerView: string
  leftMargin: boolean
  bannerSrc: string | null
  bannerCenter: number | null
  iconSrc: string | null
  iconType: string | null
  showBanner: boolean
  showEntry: boolean
  showIcon: boolean
  bulletinImgSrc: string | null
  bulletinHeight: number
  bulletinHasNotes: boolean
  bulletinContentsOnHover: boolean
  bulletinNoteIdx: number
  userId: string
}

type TextEntryDB = Omit<TextEntry, "icon"> & {
  iconType: string | null
  iconSrc: string | null
  iconSize: string | null
}

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

export async function updateHomeViewData(userId: string, data: Partial<HomeViewDB>): Promise<void> {
  await db
    .update(homeView)
    .set(data)
    .where(eq(homeView.userId, userId))
    .execute()
}

/* appearance data */

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