import { CommentReadReceiptRepository } from "../repositories/document.repository";

const hasUnreadComments = async ({
  comments = [],
  documentId,
  projectId,
  userId,
} = {}) => {
  if (!Array.isArray(comments) || comments.length === 0) {
    return false;
  }
  if (!documentId || !userId) {
    return true;
  }

  const receipts = await CommentReadReceiptRepository.getByUserAndDocument(
    userId,
    documentId,
  );
  const projectReceipts = projectId
    ? receipts.filter((receipt) => !receipt.projectId || receipt.projectId === projectId)
    : receipts;
  const readCommentIds = new Set(projectReceipts.map((receipt) => receipt.commentId));

  return comments.some((comment) => comment?.id && !readCommentIds.has(comment.id));
};

const markCommentsAsRead = async ({
  comments = [],
  documentId,
  projectId,
  userId,
} = {}) => {
  const readableComments = comments.filter((comment) => comment?.id);

  if (readableComments.length === 0) {
    return;
  }
  if (!documentId || !userId) {
    throw new Error("User and document are required to save comment read status.");
  }

  await CommentReadReceiptRepository.markCommentsAsRead({
    comments: readableComments,
    documentId,
    projectId,
    readAt: new Date().toISOString(),
    userId,
  });
};

export const CommentReadService = {
  hasUnreadComments,
  markCommentsAsRead,
};

export default CommentReadService;
