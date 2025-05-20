import { db } from "./drizzle"
import { todos } from "./general-schema"
import type { PgTransaction } from "drizzle-orm/pg-core"
import { and, eq, gt, gte, isNull, sql, type ExtractTablesWithRelations, type SQLWrapper } from "drizzle-orm"
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js"
import { nullEq } from "./utils"

type Transaction = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>

export async function getTodos(userId: string): Promise<Task[]> {
    const result = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .execute()
    
    return result as Task[]
}

export async function updateTodo(id: string, todo: Partial<Omit<Task, "id" | "parentId" | "idx">>): Promise<Task[]> {
    const result = await db
      .update(todos)
      .set({ ...todo })
      .where(eq(todos.id, id))
      .returning()
      .execute()
    
    return result as Task[]
}

export async function addTodo(todo: Task) {
  await db.transaction(async (trx) => {
    await shiftDown({ idx: todo.idx, parentId: todo.parentId, trx })

    await trx
      .insert(todos)
      .values(todo)
      .returning()
      .execute()
  })

  return true
}

export async function deleteTodo(todo: Task): Promise<boolean> {
  const { id, userId, parentId, idx } = todo

  await db.transaction(async (trx) => {
    await shiftUp({ parentId, idx, trx })

    await trx
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .execute()
  })

  return true
}

export async function reorderTodo({ task, target }: TaskReorderPayload) { 
  const { id, idx: srcIdx, parentId: srcPid, userId } = task
  let { toIdx, toPid } = target

  await db.transaction(async (trx) => {
    // remove from parent grouip
    await shiftUp({
      parentId: srcPid,
      idx: srcIdx,
      trx
    })
    // add to new parent group
    await shiftDown({
      idx: toIdx,
      parentId: toPid,
      trx
    })
    await trx
      .update(todos)
      .set({ parentId: toPid, idx: toIdx })
      .where(eq(todos.id, id))
      .returning()
      .execute()
  })

  return true
}

/* utils */

async function shiftDown({ idx, parentId, trx }: { idx: number, parentId: string | null, trx: Transaction }) {
  await trx
    .update(todos)
    .set({ idx: sql`idx + 1` })
    .where(
      and(
        nullEq(todos.parentId, parentId),
        gte(todos.idx, idx)
      )
    )
    .execute()
}

async function shiftUp({ parentId, idx, trx }: {
  parentId: string | null
  idx: number
  trx: Transaction
}) {
  await trx
    .update(todos)
    .set({ idx: sql`idx - 1` })
    .where(
      and(
        nullEq(todos.parentId, parentId),
        gt(todos.idx, idx)
      )
    )
    .execute()
}