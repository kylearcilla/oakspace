import { drizzle } from 'drizzle-orm/postgres-js'
import { SUPABASE_POOL_URL } from "$env/static/private"
import postgres from 'postgres'

const connectionString = SUPABASE_POOL_URL
export const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client)
