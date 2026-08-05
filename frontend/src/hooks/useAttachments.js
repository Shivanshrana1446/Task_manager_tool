import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAttachments, uploadAttachment, deleteAttachment } from '../services/attachmentsApi';

export const useAttachmentsList = (taskId) =>
  useQuery({
    queryKey: ['attachments', 'list', taskId],
    queryFn: () => listAttachments(taskId),
    enabled: Boolean(taskId),
  });

export const useUploadAttachment = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onUploadProgress }) => uploadAttachment(taskId, file, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', 'list', taskId] });
    },
  });
};

export const useDeleteAttachment = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttachment,
    onMutate: async (attachmentId) => {
      await queryClient.cancelQueries({ queryKey: ['attachments', 'list', taskId] });
      const previous = queryClient.getQueryData(['attachments', 'list', taskId]);
      queryClient.setQueryData(['attachments', 'list', taskId], (old) =>
        old ? old.filter((attachment) => attachment._id !== attachmentId) : old
      );
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['attachments', 'list', taskId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['attachments', 'list', taskId] }),
  });
};
