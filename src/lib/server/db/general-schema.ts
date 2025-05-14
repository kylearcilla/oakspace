import { pgSchema } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { id, str, int, date, bool, text, fk } from './utils'

export const schema = pgSchema('general')

export const users = schema.table('users', {
  id: id(),
  name: str({ name: "name" }),
  profileImg: str({ name: "profile_img" }),
  email: str({ name: "email" }),
  description: text({ name: "description" }),
  created: date({ name: "created", defaultNow: true }),
  pro: bool({ name: "pro" }),
  
  // stats
  goalsReached: int({ name: "goals_reached", val: 0 }),
  habitsDone: int({ name: "habits_done", val: 0 }),
  sessions: int({ name: "sessions", val: 0 }),
  focusTime: int({ name: "focus_time", val: 0 }),
  routinesMade: int({ name: "routines_made", val: 0 })
})

export const lastLogins = schema.table('last_logins', {
  id: id(),
  userId: fk({ name: 'user_id', refs: users.id }),
  date: date({ name: 'date', defaultNow: true }),
})

export const tags = schema.table('tags', {
  id: id(),
  name: str({ name: "name" }),
  idx: int({ name: "idx" }),
  emoji: str({ name: 'emoji', length: 10 }), 
  colorId: str({ name: 'color_id' }),
  userId: fk({ name: 'user_id', refs: users.id }),
})

/* appearance */

export const appearance = schema.table('appearance', {
  id: id(),
  theme: str({ name: 'theme', val: 'dark', req: false }),
  fontStyle: str({ name: 'font_style', val: "system" }),

  barBanner: str({ name: 'bar_banner', req: false }),
  barBannerCenter: int({ name: 'bar_banner_center', req: false }),
  barBannerShow: bool({ name: 'bar_banner_show', req: false }),

  userId: fk({ name: 'user_id', refs: users.id }),
})

export const homeView = schema.table('home_view', {
  id: id(),

  headerView: str({ name: 'header_view' }), // top | side
  leftMargin: bool({ name: 'left_margin' }),
  
  bannerSrc: str({ name: 'banner_src', req: false }),
  bannerCenter: int({ name: 'banner_center', req: false }),

  iconSrc: str({ name: 'icon_src', req: false }),
  iconType: str({ name: 'icon_type', req: false }),

  showBanner: bool({ name: 'show_banner' }),
  showEntry: bool({ name: 'show_entry' }),
  showIcon: bool({ name: 'show_icon', req: false }),
  
  
  bulletinImgSrc: str({ name: 'bulletin_img_src', req: false }),
  bulletinHeight: int({ name: 'bulletin_height', req: false }),
  bulletinHasNotes: bool({ name: 'bulletin_has_notes', req: false }),
  bulletinContentsOnHover: bool({ name: 'bulletin_contents_on_hover', req: false }),
  bulletinNoteIdx: int({ name: 'bulletin_note_idx', req: false }),

  userId: fk({ name: 'user_id', refs: users.id }),
})

export const notes = schema.table('notes', {
  id: id(),
  idx: int({ name: 'idx' }),
  text: text({ name: 'text' }),

  userId: fk({ name: 'user_id', refs: users.id })
})

/* text data (year, quarter, month) */

export const textEntries = schema.table('text_entries', {
  id: id(),
  text: text({ name: "text" }),
  styling: str({ name: "styling", val: "default" }),
  truncate: bool({ name: "truncate", val: false }),
  iconType: str({ name: "icon_type", req: false }),
  iconSrc: str({ name: "icon_src", req: false }),
  iconSize: str({ name: "icon_size" , req: false }),
  userId: fk({ name: 'user_id', refs: users.id }),
  period: str({ name: "period", req: false }), // year, quarter, month
  isoDate: str({ name: "iso_date", req: false }) // 2025-01-01
})

/* misc */

export const spaces = schema.table('spaces', {
  id: id(),
  title: str({ name: 'title' }),
  subtitle: str({ name: 'subtitle' }),
  thumbnail: str({ name: 'thumbnail' }),
  sourceId: str({ name: 'source_id' }),
  type: str({ name: 'type' }),
  group: str({ name: 'group' }),
})

export const sessions = schema.table('sessions', {
  id: id(),
  name: str({ name: 'name' }),
  mode: str({ name: 'mode' }),
  focusTime: int({ name: 'focus_time' }),
  breakTime: int({ name: 'break_time' }),
  startTime: date({ name: 'start_time' }),
  endTime: date({ name: 'end_time' }),
  focusCount: int({ name: 'focus_count' }),
  breakCount: int({ name: 'break_count' }),
  pauseCount: int({ name: 'pause_count' }),
  elapsedSecs: int({ name: 'elapsed_secs' }),
  totalFocusTime: int({ name: 'total_focus_time' }),
  totalBreakTime: int({ name: 'total_break_time' }),
  periods: int({ name: 'periods' }),

  userId: fk({ name: 'user_id', refs: users.id }),
})

export const todos = schema.table('todos', {
  id: id(),
  idx: int({ name: 'idx' }),
  title: str({ name: 'title' }),
  description: text({ name: 'description' }),
  isChecked: bool({ name: 'is_checked', val: false }),
  parentId: str({ name: 'parent_id', req: false }),
  userId: fk({ name: 'user_id', refs: users.id }),
  sessionId: fk({ name: 'session_id', refs: sessions.id, req: false })
})

/* quotes */

export const quotes = schema.table('quotes', {
  id: id(),
  text: text({ name: 'text' }),
  bgImgSrc: text({ name: 'bg_img_src' }),
  artCredit: text({ name: 'art_credit' }),
  quoteCredit: text({ name: 'quote_credit' }),
  portrait: bool({ name: 'portrait', req: false}),
  dark: bool({ name: 'dark', req: false })
})

export const quoteLikes = schema.table('quote_likes', {
  id: id(),
  created: date({ name: 'created', defaultNow: true }),
  quoteId: fk({ name: 'quote_id', refs: quotes.id }),
  userId: fk({ name: 'user_id', refs: users.id }),
})

export const currentQuotes = schema.table('current_quotes', {
  id: id(),
  date: date({ name: 'date', defaultNow: true }),
  quoteId: fk({ name: 'quote_id', refs: quotes.id }),
  userId: fk({ name: 'user_id', refs: users.id })
})

/* relations */

export const lastLoginsRelations = relations(lastLogins, ({ one }) => ({
  user: one(users, {
    fields: [lastLogins.userId],
    references: [users.id]
  })
}))

export const usersRelations = relations(users, ({ many }) => ({
  tags: many(tags),
  appearance: many(appearance),
  notes: many(notes),
  textEntries: many(textEntries),
  lastLogins: many(lastLogins)
}))

export const tagsRelations = relations(tags, ({ one }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id]
  })
}))

export const todosRelations = relations(todos, ({ one }) => ({
  session: one(sessions, {
    fields: [todos.sessionId],
    references: [sessions.id]
  })
}))

export const appearanceRelations = relations(appearance, ({ one }) => ({
  user: one(users, {
    fields: [appearance.userId],
    references: [users.id]
  })
}))

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id]
  })
}))

export const textEntriesRelations = relations(textEntries, ({ one }) => ({
  user: one(users, {
    fields: [textEntries.userId],
    references: [users.id]
  })
}))