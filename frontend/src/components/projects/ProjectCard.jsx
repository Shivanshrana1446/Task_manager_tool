import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MoreVertical, Pencil, UserCog, Users, Archive, ArchiveRestore, Trash2, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProjectTimeline from './ProjectTimeline';
import ProjectProgressBar from './ProjectProgressBar';
import Avatar from '../ui/Avatar';
import DropdownMenu from '../ui/DropdownMenu';
import { formatDueLabel } from '../../utils/formatters';

const MAX_VISIBLE_MEMBERS = 4;

const ProjectCard = ({ project, onEdit, onDelete, onArchiveToggle, onAssignManager, onAssignMembers }) => {
  const isArchived = project.status === 'archived';
  const isOverdue =
    project.dueDate && new Date(project.dueDate) < new Date() && !['completed', 'archived'].includes(project.status);

  const visibleMembers = project.members.slice(0, MAX_VISIBLE_MEMBERS);
  const extraMemberCount = project.members.length - visibleMembers.length;

  const menuItems = [
    { key: 'edit', label: 'Edit project', icon: <Pencil size={15} />, onClick: () => onEdit(project) },
    {
      key: 'manager',
      label: 'Assign manager',
      icon: <UserCog size={15} />,
      onClick: () => onAssignManager(project),
    },
    {
      key: 'members',
      label: 'Assign members',
      icon: <Users size={15} />,
      onClick: () => onAssignMembers(project),
    },
    { key: 'divider-1', divider: true },
    {
      key: 'archive',
      label: isArchived ? 'Unarchive' : 'Archive',
      icon: isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />,
      onClick: () => onArchiveToggle(project),
    },
    {
      key: 'delete',
      label: 'Delete project',
      icon: <Trash2 size={15} />,
      danger: true,
      onClick: () => onDelete(project),
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            <Link to={`/projects/${project._id}`} className="hover:underline">
              {project.name}
            </Link>
          </h3>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-sm text-foreground/50">{project.description}</p>
          )}
        </div>
        <DropdownMenu
          trigger={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950">
              <MoreVertical size={18} />
            </span>
          }
          items={menuItems}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={project.status} />
        <PriorityBadge priority={project.priority} />
        {project.dueDate && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-foreground/50'}`}
          >
            <Clock size={12} />
            {formatDueLabel(project.dueDate)}
          </span>
        )}
      </div>

      <ProjectProgressBar
        progress={project.taskStats?.progress ?? 0}
        completed={project.taskStats?.completed ?? 0}
        total={project.taskStats?.total ?? 0}
      />

      <ProjectTimeline startDate={project.startDate} dueDate={project.dueDate} />

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <Avatar name={project.owner?.name} src={project.owner?.avatar?.url} size="sm" />
          <span className="truncate">{project.owner?.name}</span>
        </div>

        {project.members.length > 0 && (
          <div className="flex items-center -space-x-2">
            {visibleMembers.map((member) => (
              <div key={member._id} className="ring-2 ring-surface rounded-full">
                <Avatar name={member.name} src={member.avatar?.url} size="sm" />
              </div>
            ))}
            {extraMemberCount > 0 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-border text-[10px] font-medium text-foreground/60 ring-2 ring-surface">
                +{extraMemberCount}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectCard;
