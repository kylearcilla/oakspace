import { db } from "./drizzle"
import { eq, and, sql } from "drizzle-orm"
import { currentQuotes, quoteLikes, quotes } from "./general-schema"

/* fetch quote */

type QuoteDB = Omit<Quote, 'liked' | 'likes'>
type QuoteData = { quote: QuoteDB, date: Date }

export async function getQuote({ userId }: { userId: string }): Promise<{ quote: Omit<Quote, 'likes'>, date: Date }>  {  
  const { quote, date } = await getCurrQuote(userId) || await setNewCurrQuote(userId)

  return { 
    quote: {
      ...quote, 
      liked: await userLiked({ quoteId: quote.id, userId }),
    },
    date
  }
}

async function getCurrQuote(userId: string): Promise<QuoteData> {
  const res = await db
    .select()
    .from(currentQuotes)
    .where(eq(currentQuotes.userId, userId))
    .execute()

  if (!res.length) {
    return await setNewCurrQuote(userId)
  }

  return { 
    quote: await getQuoteById(res[0].quoteId!), 
    date: res[0].date!
  }
}

async function setNewCurrQuote(userId: string): Promise<QuoteData> {
  const quote = await getNewQuote()
  const date = new Date()

  await db
    .insert(currentQuotes)
    .values({ quoteId: quote.id, userId, date })
    .execute()

  return { quote, date }
}

async function getNewQuote(): Promise<QuoteDB> {
  const quote = await db
    .select()
    .from(quotes)
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .execute()

  return quote[0]! as QuoteDB
}

async function getQuoteById(quoteId: string): Promise<QuoteDB> {
  const res = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .execute()

  return res[0] as QuoteDB
}

/* likes */

async function userLiked({ quoteId, userId }: { quoteId: string, userId: string }) {
  const existingLike = await db
    .select()
    .from(quoteLikes)
    .where(and(eq(quoteLikes.quoteId, quoteId), eq(quoteLikes.userId, userId)))
    .execute()

  return existingLike.length > 0
}

export async function getLikes({ quoteId }: { quoteId: string }) {
  const result = await db
    .select()
    .from(quoteLikes)
    .where(eq(quoteLikes.quoteId, quoteId))
    .execute()

  return result.length
}

async function likeQuote({ quoteId, userId }: { quoteId: string, userId: string }) {
  const existingLike = await db
    .select()
    .from(quoteLikes)
    .where(and(eq(quoteLikes.quoteId, quoteId), eq(quoteLikes.userId, userId)))
    .execute()
  
  if (!existingLike.length) {
    await db
      .insert(quoteLikes)
      .values({ quoteId, userId })
      .execute()
  }
}

async function unlikeQuote({ quoteId, userId }: { quoteId: string, userId: string }) {
  await db
    .delete(quoteLikes)
    .where(and(eq(quoteLikes.quoteId, quoteId), eq(quoteLikes.userId, userId)))
    .execute()
}

export async function toggleLike({ quoteId, userId }: { quoteId: string, userId: string }) {
  const existingLike = await db
    .select()
    .from(quoteLikes)
    .where(and(eq(quoteLikes.quoteId, quoteId), eq(quoteLikes.userId, userId)))
    .execute()
  
  if (existingLike.length > 0) {
    return await unlikeQuote({ quoteId, userId })
  } 
  else {
    return await likeQuote({ quoteId, userId })
  }
}