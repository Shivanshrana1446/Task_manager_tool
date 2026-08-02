import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listComments, createComment, updateComment, deleteComment } from '../services/commentsApi';
import { DASHBOARD_SUMMARY_KEY } from './useDashboardSummary';

export const useCommentsList = (taskId) =>
  useQuery({
    queryKey: ['comments', 'list', taskId],
    queryFn: () => listComments(taskId),
    enabled: Boolean(taskId),
  });

export const useCreateComment = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'list', taskId] });
      // New comments show up in the dashboard's "recent comments" feed.
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

export const useUpdateComment = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => updateComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'list', taskId] });
    },
  });
};

export const useDeleteComment = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comments', 'list', taskId] });
      const previous = queryClient.getQueryData(['comments', 'list', taskId]);
      queryClient.setQueryData(['comments', 'list', taskId], (old) =>
        old ? old.filter((comment) => comment._id !== commentId) : old
      );
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['comments', 'list', taskId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['comments', 'list', taskId] }),
  });
};
