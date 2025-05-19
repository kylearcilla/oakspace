import { db } from "./drizzle"
import { eq, and, gte, lte, or, SQL, not } from "drizzle-orm"
import { uiOptions, homeView, notes, textEntries, todos } from "./general-schema"
import { getNotes } from "./bulletin"

/* home view data */

export async function getHomeViewData(userId: string): Promise<{ homeView: HomeViewDB, entry: TextEntry | null, notes: Note[] } | undefined> {
    // main
    const homeDataRes = await db
      .select()
      .from(homeView)
      .where(eq(homeView.userId, userId))
      .execute()

    if (!homeDataRes) {
      return undefined
    }

    const homeData = homeDataRes[0] as HomeViewDB
    const entry = await getHomeEntry(homeData.entryId)
    const notes = await getNotes(userId) || []

    return { homeView: homeData, entry, notes }
}

async function getHomeEntry(entryId: string | null): Promise<TextEntry | null> {
  if (!entryId) return null

  const entryRes = await db
    .select()
    .from(textEntries)
    .where(eq(textEntries.id, entryId))
    .execute()

  if (!entryRes.length) return null

  const { iconType, iconSrc, iconSize, ...rest } = entryRes[0] as TextEntryDB

  return {
    ...rest, icon: iconSrc ? { type: iconType!, src: iconSrc!, size: iconSize! } : null
  }
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

/**
 * Fetch text entries from a given range.
 * By default it will fetch the quarters and months of the range, including the corresponding parent years.
 * 
 * Can also fetch strictly by period only inside a range.
 * 
 * @param userId - user id
 * @param start - start date
 * @param end - end date
 * @param period - 
 * @param catchAll - 
 * @param getYear - * if all entries, then that range's parent year is also returned
 * 
 * @returns Existing entries within that range.
 */
export async function fetchTextEntries({ 
  userId, 
  start, 
  end,
  period,
  catchAll = true,
  getYear = true
}: { 
  userId: string, start: string, end: string, period: PeriodType, catchAll?: boolean, getYear?: boolean
}): Promise<TextEntryDB[]> {

  const { isoDate, period: periodCol, userId: userIdCol } = textEntries
  const startYear = `${start.split('-')[0]}-01-01`
  const endYear = `${end.split('-')[0]}-01-01`

  const conditions = [eq(userIdCol, userId)]

  if (period === "month" && catchAll && getYear) {
      conditions.push(
        or(
          and(gte(isoDate, start), lte(isoDate, end)),
          and(
            or(
              and(eq(periodCol!, "year"), eq(isoDate!, startYear)),
              and(eq(periodCol!, "year"), eq(isoDate!, endYear))
            )
          )
        )!
      )
  }
  else if (period === "month" && catchAll) {
    conditions.push(gte(isoDate, start), lte(isoDate, end))
  }
  else {
    conditions.push(eq(periodCol!, period), gte(isoDate, start), lte(isoDate, end))
  }

  const result = await db
    .select()
    .from(textEntries)
    .where(and(...conditions))
    .execute()
  
  return result as TextEntryDB[]
}

export async function updateTextEntry(entryId: string, data: Partial<TextEntryDB>): Promise<boolean> {
  await db
    .update(textEntries)
    .set(data)
    .where(eq(textEntries.id, entryId))
    .execute()

  return true
}

export async function createTextEntry(entry: TextEntry) {
    await db
      .insert(textEntries)
      .values(entry)
      .execute()

    return true
}
