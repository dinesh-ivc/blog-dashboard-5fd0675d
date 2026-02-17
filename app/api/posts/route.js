/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all published posts with optional filters
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag slug
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, and excerpt
 *     responses:
 *       200:
 *         description: List of posts
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new post (admin/author only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               featured_image:
 *                 type: string
 *               category_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validatePost } from '@/lib/validation';
import { verifyToken } from '@/lib/jwt';
import { generateSlug } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const tagSlug = searchParams.get('tag');
    const search = searchParams.get('search');

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, email, avatar_url),
        category:categories!posts_category_id_fkey(id, name, slug),
        post_tags(tag:tags(id, name, slug))
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Apply category filter
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Filter by tag if specified (post-query filtering)
    let filteredPosts = posts;
    if (tagSlug && posts) {
      filteredPosts = posts.filter(post => 
        post.post_tags?.some(pt => pt.tag?.slug === tagSlug)
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: filteredPosts || [],
        count: filteredPosts?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'author')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validatePost(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { title, content, excerpt, featured_image, category_id, status, tags } = body;

    const supabase = createAdminClient();

    // Generate unique slug
    const slug = await generateSlug(title, 'posts');

    // Create post
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert([
        {
          author_id: decoded.id,
          title,
          slug,
          content,
          excerpt: excerpt || null,
          featured_image: featured_image || null,
          category_id: category_id || null,
          status: status || 'draft',
          published_at: status === 'published' ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
        { status: 500 }
      );
    }

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        post_id: newPost.id,
        tag_id: tagId,
        created_at: new Date().toISOString(),
      }));

      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(tagInserts);

      if (tagError) {
        console.error('Error adding tags:', tagError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: newPost,
        message: 'Post created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}