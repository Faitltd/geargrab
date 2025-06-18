static async getCommentsByArticleId(
  articleId: string,
  filters: Omit<CommentFilters, 'articleId'> = {},
  context: SecurityContext
): Promise<PaginatedResponse<CommentResponse>> {
  // Validate articleId
  if (!articleId || typeof articleId !== 'string' || articleId.length < 1) {
    throw new Error('Invalid article ID');
  }

  // Verify article exists and is accessible
  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      OR: [
        { isPublished: true },
        { authorId: context.userId }, // Author can see their own drafts
        ...(context.userRole === 'ADMIN' || context.userRole === 'MODERATOR' 
          ? [{}] // Admins/moderators can see all
          : []
        )
      ]
    }
  });