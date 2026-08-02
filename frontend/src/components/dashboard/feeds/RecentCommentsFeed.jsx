import FeedCard from '../FeedCard';
import Avatar from '../../ui/Avatar';
import { formatRelativeTime } from '../../../utils/formatters';

const RecentCommentsFeed = ({ items, isLoading }) => (
  <FeedCard
    title="Recent comments"
    isLoading={isLoading}
    isEmpty={!items?.length}
    emptyMessage="No comments yet."
  >
    {items?.map((comment) => (
      <li key={comment._id} className="flex items-start gap-3">
        <Avatar name={comment.author?.name} src={comment.author?.avatar?.url} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground/80">
            <span className="font-medium text-foreground">{comment.author?.name}</span>{' '}
            on <span className="text-foreground/70">{comment.task?.title}</span>
          </p>
          <p className="truncate text-sm text-foreground/50">&ldquo;{comment.content}&rdquo;</p>
          <p className="text-xs text-foreground/40">{formatRelativeTime(comment.createdAt)}</p>
        </div>
      </li>
    ))}
  </FeedCard>
);

export default RecentCommentsFeed;
