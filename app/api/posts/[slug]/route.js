/**
 * @swagger
 * /api/posts/{slug}:
 *   get:
 *     summary: Get a single post by slug
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Post slug
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a post (admin/author only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Post slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Post updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a post (admin/author only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Post slug
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/jwt';
import { generateSlug } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    const supabase = createAdminClient();

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, email, avatar_url, bio),
        category:categories!posts_category_id_fkey(id, name, slug),
        post_tags(tag:tags(id, name, slug))
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: post,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/posts/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = params;
    const body = await request.json();

    const supabase = createAdminClient();

    // Get existing post
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (decoded.role !== 'admin' && existingPost.author_id !== decoded.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to edit this post' },
        { status: 401 }
      );
    }

    const { title, content, excerpt, featured_image, category_id, status, tags } = body;

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (title) {
      updateData.title = title;
      // Generate new slug if title changed
      if (title !== existingPost.title) {
        updateData.slug = await generateSlug(title, 'posts', existingPost.id);
      }
    }
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featured_image !== undefined) updateData.featured_image = featured_image;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at if changing to published
      if (status === 'published' && existingPost.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', existingPost.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating post:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update post' },
        { status: 500 }
      );
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', existingPost.id);

      // Add new tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tagId => ({
          post_id: existingPost.id,
          tag_id: tagId,
          created_at: new Date().toISOString(),
        }));

        await supabase
          .from('post_tags')
          .insert(tagInserts);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedPost,
        message: 'Post updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/posts/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = params;
    const supabase = createAdminClient();

    // Get existing post
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (decoded.role !== 'admin' && existingPost.author_id !== decoded.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this post' },
        { status: 401 }
      );
    }

    // Delete post tags first (foreign key constraint)
    await supabase
      .from('post_tags')
      .delete()
      .eq('post_id', existingPost.id);

    // Delete comments (foreign key constraint)
    await supabase
      .from('comments')
      .delete()
      .eq('post_id', existingPost.id);

    // Delete post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', existingPost.id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Post deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/posts/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}