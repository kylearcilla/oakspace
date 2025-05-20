import { schema, users } from "./general-schema";
import { str, id, int, bool, text, fk } from "./utils";

export const goalTasks = schema.table('goal_tasks', {
    id: id(),
    idx: int({ name: 'idx' }),
    title: str({ name: 'title' }),
    description: text({ name: 'description' }),
    isChecked: bool({ name: 'is_checked', val: false }),
    parentId: str({ name: 'parent_id', req: false }),
    userId: fk({ name: 'user_id', refs: users.id })
})