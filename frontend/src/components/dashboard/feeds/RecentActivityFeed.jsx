import { PlusCircle, Pencil, Trash2, RotateCcw, ArrowRightLeft, UserPlus, MessageSquare, Upload, LogIn, LogOut } from 'lucide-react';
import FeedCard from '../FeedCard';
import Avatar from '../../ui/Avatar';
import { formatRelativeTime } from '../../../utils/formatters';

const ACTION_META = {
  create: { icon: PlusCircle, verb: 'created', color: 'text-emerald-500' },
  update: { icon: Pencil, verb: 'updated', color: 'text-primary-500' },
  delete: { icon: Trash2, verb: 'deleted', color: 'text-red-500' },
  restore: { icon: RotateCcw, verb: 'restored', color: 'text-primary-500' },
  status_change: { icon: ArrowRightLeft, verb: 'changed the status of', color: 'text-amber-500' },
  assign: { icon: UserPlus, verb: 'updated assignees on', color: 'text-primary-500' },
  comment: { icon: MessageSquare, verb: 'commented on', color: 'text-primary-500' },
  upload: { icon: Upload, verb: 'uploaded a file to', color: 'text-primary-500' },
  login: { icon: LogIn, verb: 'logged in', color: 'text-foreground/50' },
  logout: { icon: LogOut, verb: 'logged out', color: 'text-foreground/50' },
};

const entityLabel = (entityType) => (entityType || 'item').toLowerCase();

const RecentActivityFeed = ({ items, isLoading }) => (
  <FeedCard title="Recent activity" isLoading={isLoading} isEmpty={!items?.length}>
    {items?.map((entry) => {
      const meta = ACTION_META[entry.action] || ACTION_META.update;
      const Icon = meta.icon;
      const actorName = entry.user?.name || 'Someone';
      const isSelfAction = meta.verb === 'logged in' || meta.verb === 'logged out';

      return (
        <li key={entry._id} className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-border">
            <Icon size={14} className={meta.color} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground/80">
              <span className="font-medium text-foreground">{actorName}</span>{' '}
              {meta.verb}
              {!isSelfAction && ` a ${entityLabel(entry.entityType)}`}
            </p>
            <p className="text-xs text-foreground/40">{formatRelativeTime(entry.createdAt)}</p>
          </div>
          <Avatar name={entry.user?.name} src={entry.user?.avatar?.url} size="sm" />
        </li>
      );
    })}
  </FeedCard>
);

export default RecentActivityFeed;
