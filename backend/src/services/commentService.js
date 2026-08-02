const Comment = require('../models/Comment');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');

const createComment = (authorId, data) =>
  Comment.create({
    content: data.content,
    task: data.task,
    author: authorId,
    parentComment: data.parentComment || null,
    mentions: data.mentions || [],
  });

const listComments = (query) =>
  paginateQuery({
    Model: Comment,
    filter: pickFilter(query, ['task', 'parentComment']),
    query,
    searchFields: ['content'],
    defaultSort: 'createdAt',
  });

const updateComment = async (comment, content) => {
  comment.content = content;
  comment.editedAt = new Date();
  await comment.save();
  return comment;
};

const softDeleteComment = (comment) => comment.softDelete();

module.exports = { createComment, listComments, updateComment, softDeleteComment };
