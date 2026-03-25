const { eq, desc, asc, sql } = require('drizzle-orm');
const db = require('../config/db');
const { forumPosts, forumLikes, forumReplies, users } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');
const { invalidateCache } = require('../middleware/cache');

const getPosts = asyncHandler(async (req, res) => {
    const rawPosts = await db.select({
        id: forumPosts.id,
        user_id: forumPosts.user_id,
        title: forumPosts.title,
        body: forumPosts.body,
        likes_count: forumPosts.likes_count,
        replies_count: forumPosts.replies_count,
        created_at: forumPosts.created_at,
        updated_at: forumPosts.updated_at,
        author_name: users.full_name,
        author_avatar: users.avatar_url,
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.user_id, users.id))
    .orderBy(desc(forumPosts.created_at))
    .limit(50);

    res.json({ posts: rawPosts });
});

const createPost = asyncHandler(async (req, res) => {
    const { title, body } = req.body;
    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required.' });
    }

    const [post] = await db.insert(forumPosts).values({
        user_id: req.user.id,
        title,
        body,
    }).returning();

    await invalidateCache('cache:/api/v1/forum');
    res.status(201).json({ post });
});

const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const [existingLike] = await db.select({ id: forumLikes.id })
        .from(forumLikes)
        .where(sql`${forumLikes.user_id} = ${userId} AND ${forumLikes.post_id} = ${id}`);

    if (existingLike) {
        await db.delete(forumLikes).where(eq(forumLikes.id, existingLike.id));
        await db.update(forumPosts)
            .set({ likes_count: sql`GREATEST(${forumPosts.likes_count} - 1, 0)` })
            .where(eq(forumPosts.id, id));
        res.json({ liked: false });
    } else {
        await db.insert(forumLikes).values({ user_id: userId, post_id: id });
        await db.update(forumPosts)
            .set({ likes_count: sql`${forumPosts.likes_count} + 1` })
            .where(eq(forumPosts.id, id));
        res.json({ liked: true });
    }

    await invalidateCache('cache:/api/v1/forum');
});

const getReplies = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rawReplies = await db.select({
        id: forumReplies.id,
        post_id: forumReplies.post_id,
        user_id: forumReplies.user_id,
        body: forumReplies.body,
        created_at: forumReplies.created_at,
        author_name: users.full_name,
        author_avatar: users.avatar_url,
    })
    .from(forumReplies)
    .leftJoin(users, eq(forumReplies.user_id, users.id))
    .where(eq(forumReplies.post_id, id))
    .orderBy(asc(forumReplies.created_at));

    res.json({ replies: rawReplies });
});

const createReply = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { body } = req.body;
    if (!body) {
        return res.status(400).json({ error: 'Reply body is required.' });
    }

    const [reply] = await db.insert(forumReplies).values({
        post_id: id,
        user_id: req.user.id,
        body,
    }).returning();

    // Increment replies_count
    await db.update(forumPosts)
        .set({ replies_count: sql`${forumPosts.replies_count} + 1` })
        .where(eq(forumPosts.id, id));

    await invalidateCache('cache:/api/v1/forum');
    res.status(201).json({ reply });
});

module.exports = { getPosts, createPost, toggleLike, getReplies, createReply };
