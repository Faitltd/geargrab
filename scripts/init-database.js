#!/usr/bin/env node

/**
 * Database initialization script for GearGrab
 * This script sets up the database with initial data and configurations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing GearGrab database...');

  try {
    // Create admin user if it doesn't exist
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@geargrab.co' },
      update: {},
      create: {
        email: 'admin@geargrab.co',
        username: 'admin',
        name: 'GearGrab Admin',
        role: 'ADMIN',
        isActive: true,
        bio: 'System administrator for GearGrab platform'
      }
    });

    console.log('✅ Admin user created/updated:', adminUser.email);

    // Create sample article if none exist
    const articleCount = await prisma.article.count();
    
    if (articleCount === 0) {
      const sampleArticle = await prisma.article.create({
        data: {
          title: 'Welcome to GearGrab Comments',
          slug: 'welcome-to-geargrab-comments',
          content: `
            <h2>Welcome to the new GearGrab comment system!</h2>
            <p>We've implemented a comprehensive comment system with the following features:</p>
            <ul>
              <li>Nested comments and replies</li>
              <li>Content moderation and approval</li>
              <li>Rate limiting for spam protection</li>
              <li>Like system for engagement</li>
              <li>Report system for community moderation</li>
            </ul>
            <p>This system is built with security and user experience in mind.</p>
          `,
          excerpt: 'Introduction to the new GearGrab comment system with advanced features.',
          status: 'PUBLISHED',
          isPublished: true,
          publishedAt: new Date(),
          authorId: adminUser.id,
          tags: ['announcement', 'features', 'comments'],
          metaTitle: 'Welcome to GearGrab Comments',
          metaDescription: 'Learn about the new comment system features on GearGrab.'
        }
      });

      console.log('✅ Sample article created:', sampleArticle.title);

      // Create a sample comment
      const sampleComment = await prisma.comment.create({
        data: {
          content: 'This is a great addition to the platform! Looking forward to engaging with the community.',
          status: 'APPROVED',
          articleId: sampleArticle.id,
          authorId: adminUser.id
        }
      });

      console.log('✅ Sample comment created');

      // Update article comment count
      await prisma.article.update({
        where: { id: sampleArticle.id },
        data: { commentCount: 1 }
      });
    }

    console.log('🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
