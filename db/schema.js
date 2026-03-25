const { pgTable, uuid, text, varchar, boolean, integer, real, timestamp, date, pgEnum, uniqueIndex, index } = require('drizzle-orm/pg-core');

// ── Enums ────────────────────────────────────────────────────────
const roleEnum = pgEnum('role', ['student', 'admin', 'faculty']);
const itemTypeEnum = pgEnum('item_type', ['lost', 'found']);
const itemStatusEnum = pgEnum('item_status', ['open', 'resolved', 'closed']);
const priorityEnum = pgEnum('priority', ['low', 'normal', 'medium', 'high']);
const dayOfWeekEnum = pgEnum('day_of_week', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

// ── Users ────────────────────────────────────────────────────────
const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password_hash: text('password_hash').notNull(),
    full_name: varchar('full_name', { length: 255 }).notNull(),
    department: varchar('department', { length: 255 }),
    year: varchar('year', { length: 50 }),
    semester: varchar('semester', { length: 50 }),
    roll_number: varchar('roll_number', { length: 100 }),
    bio: text('bio').default(''),
    avatar_url: text('avatar_url'),
    avatar_public_id: text('avatar_public_id'),
    role: roleEnum('role').default('student'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ── Forum Posts ──────────────────────────────────────────────────
const forumPosts = pgTable('forum_posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => users.id),
    title: varchar('title', { length: 500 }).notNull(),
    body: text('body').notNull(),
    likes_count: integer('likes_count').default(0),
    replies_count: integer('replies_count').default(0),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('forum_posts_created_at_idx').on(table.created_at),
]);

// ── Forum Likes ──────────────────────────────────────────────────
const forumLikes = pgTable('forum_likes', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => users.id),
    post_id: uuid('post_id').notNull().references(() => forumPosts.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    uniqueIndex('forum_likes_user_post_idx').on(table.user_id, table.post_id),
]);

// ── Forum Replies ────────────────────────────────────────────────
const forumReplies = pgTable('forum_replies', {
    id: uuid('id').defaultRandom().primaryKey(),
    post_id: uuid('post_id').notNull().references(() => forumPosts.id),
    user_id: uuid('user_id').notNull().references(() => users.id),
    body: text('body').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('forum_replies_post_created_idx').on(table.post_id, table.created_at),
]);

// ── Events ───────────────────────────────────────────────────────
const events = pgTable('events', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    event_date: timestamp('event_date').notNull(),
    venue: varchar('venue', { length: 255 }),
    category: varchar('category', { length: 100 }).default('general'),
    image_url: text('image_url'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('events_date_idx').on(table.event_date),
]);

// ── Circulars ────────────────────────────────────────────────────
const circulars = pgTable('circulars', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    published_date: varchar('published_date', { length: 10 }).default(new Date().toISOString().split('T')[0]),
    is_important: boolean('is_important').default(false),
    attachment_url: text('attachment_url'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('circulars_published_idx').on(table.published_date),
]);

// ── Alerts ───────────────────────────────────────────────────────
const alerts = pgTable('alerts', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(),
    priority: priorityEnum('priority').default('normal'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('alerts_cat_created_idx').on(table.category, table.created_at),
]);

// ── Lost & Found Items ──────────────────────────────────────────
const lostFoundItems = pgTable('lost_found_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    reported_by: uuid('reported_by').notNull().references(() => users.id),
    item_type: itemTypeEnum('item_type').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 100 }).default('general'),
    item_name: varchar('item_name', { length: 255 }),
    location: varchar('location', { length: 255 }),
    found_lost_date: timestamp('found_lost_date'),
    contact_info: varchar('contact_info', { length: 255 }),
    image_url: text('image_url'),
    status: itemStatusEnum('status').default('open'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('lf_type_created_idx').on(table.item_type, table.created_at),
]);

// ── Results ──────────────────────────────────────────────────────
const results = pgTable('results', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => users.id),
    semester: integer('semester').notNull(),
    subject_code: varchar('subject_code', { length: 50 }).notNull(),
    subject_name: varchar('subject_name', { length: 255 }).notNull(),
    credits: integer('credits').default(0),
    grade: varchar('grade', { length: 10 }),
    grade_point: real('grade_point').default(0),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('results_user_sem_idx').on(table.user_id, table.semester),
]);

// ── Timetable ────────────────────────────────────────────────────
const timetable = pgTable('timetable', {
    id: uuid('id').defaultRandom().primaryKey(),
    day_of_week: dayOfWeekEnum('day_of_week').notNull(),
    subject_name: varchar('subject_name', { length: 255 }).notNull(),
    subject_code: varchar('subject_code', { length: 50 }),
    instructor: varchar('instructor', { length: 255 }),
    room: varchar('room', { length: 100 }),
    start_time: varchar('start_time', { length: 10 }).notNull(),
    end_time: varchar('end_time', { length: 10 }).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('timetable_day_start_idx').on(table.day_of_week, table.start_time),
]);

// ── Services ─────────────────────────────────────────────────────
const services = pgTable('services', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).default('general'),
    contact_info: varchar('contact_info', { length: 255 }),
    location: varchar('location', { length: 255 }),
    website_url: text('website_url'),
    timings: varchar('timings', { length: 255 }),
    is_active: boolean('is_active').default(true),
    sort_order: integer('sort_order').default(0),
    icon_name: varchar('icon_name', { length: 100 }),
    subtitle: varchar('subtitle', { length: 255 }),
    gradient_start: varchar('gradient_start', { length: 50 }),
    gradient_end: varchar('gradient_end', { length: 50 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('services_active_order_idx').on(table.is_active, table.sort_order),
]);

module.exports = {
    roleEnum, itemTypeEnum, itemStatusEnum, priorityEnum, dayOfWeekEnum,
    users, forumPosts, forumLikes, forumReplies,
    events, circulars, alerts, lostFoundItems,
    results, timetable, services,
};
