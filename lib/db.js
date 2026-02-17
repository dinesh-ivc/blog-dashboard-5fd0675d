import { createAdminClient } from '@/lib/supabase/server';

/**
 * Generate a unique slug from a title
 * @param {string} title - Title to generate slug from
 * @param {string} table - Table name to check for uniqueness
 * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} Unique slug
 */
export async function generateSlug(title, table = 'posts', excludeId = null) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const supabase = createAdminClient();
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    let query = supabase
      .from(table)
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return slug;
}

/**
 * Get posts with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} { posts, total, page, pageSize }
 */
export async function getPaginatedPosts(options = {}) {
  const {
    page = 1,
    pageSize = 12,
    status = 'published',
    authorId = null,
    categoryId = null,
    search = null,
  } = options;

  const supabase = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, avatar_url),
        category:categories!posts_category_id_fkey(id, name, slug),
        post_tags(tag:tags(id, name, slug))
      `, { count: 'exact' })
      .eq('status', status)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching paginated posts:', error);
      return {
        posts: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    return {
      posts: posts || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error('Error in getPaginatedPosts:', error);
    return {
      posts: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Get post by slug with all relations
 * @param {string} slug - Post slug
 * @returns {Promise<Object|null>} Post data or null
 */
export async function getPostBySlug(slug) {
  const supabase = createAdminClient();

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, email, avatar_url, bio),
        category:categories!posts_category_id_fkey(id, name, slug),
        post_tags(tag:tags(id, name, slug))
      `)
      .eq('slug', slug)
      .single();

    if (error || !post) {
      return null;
    }

    return post;
  } catch (error) {
    console.error('Error in getPostBySlug:', error);
    return null;
  }
}

/**
 * Get categories with post count
 * @returns {Promise<Array>} Categories with post count
 */
export async function getCategoriesWithCount() {
  const supabase = createAdminClient();

  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        posts(count)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return categories || [];
  } catch (error) {
    console.error('Error in getCategoriesWithCount:', error);
    return [];
  }
}

/**
 * Get tags with post count
 * @returns {Promise<Array>} Tags with post count
 */
export async function getTagsWithCount() {
  const supabase = createAdminClient();

  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select(`
        *,
        post_tags(count)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return tags || [];
  } catch (error) {
    console.error('Error in getTagsWithCount:', error);
    return [];
  }
}

/**
 * Get comments for a post
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} Comments
 */
export async function getPostComments(postId) {
  const supabase = createAdminClient();

  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    return comments || [];
  } catch (error) {
    console.error('Error in getPostComments:', error);
    return [];
  }
}

/**
 * Create a new comment
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object|null>} Created comment or null
 */
export async function createComment(commentData) {
  const supabase = createAdminClient();
  const { post_id, user_id, content } = commentData;

  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id,
          user_id,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return null;
    }

    return comment;
  } catch (error) {
    console.error('Error in createComment:', error);
    return null;
  }
}

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} userRole - User role (for authorization)
 * @returns {Promise<boolean>} Success status
 */
export async function deleteComment(commentId, userId, userRole) {
  const supabase = createAdminClient();

  try {
    // Get comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return false;
    }

    // Check authorization
    if (userRole !== 'admin' && comment.user_id !== userId) {
      return false;
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return false;
  }
}