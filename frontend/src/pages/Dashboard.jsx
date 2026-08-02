import { useSelector } from 'react-redux';
import { motion, MotionConfig } from 'framer-motion';
import {
  FolderKanban,
  Activity,
  CheckCircle2,
  ListTodo,
  CheckCircle,
  AlertTriangle,
  CalendarDays,
  UserCheck,
  Flame,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import TaskStatusDonut from '../components/dashboard/charts/TaskStatusDonut';
import ProjectProgressBars from '../components/dashboard/charts/ProjectProgressBars';
import MonthlyProductivityArea from '../components/dashboard/charts/MonthlyProductivityArea';
import TeamPerformanceBars from '../components/dashboard/charts/TeamPerformanceBars';
import RecentActivityFeed from '../components/dashboard/feeds/RecentActivityFeed';
import NotificationsFeed from '../components/dashboard/feeds/NotificationsFeed';
import UpcomingDeadlinesFeed from '../components/dashboard/feeds/UpcomingDeadlinesFeed';
import RecentCommentsFeed from '../components/dashboard/feeds/RecentCommentsFeed';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const CARDS = [
  { key: 'totalProjects', label: 'Total projects', icon: FolderKanban, accent: 'blue' },
  { key: 'activeProjects', label: 'Active projects', icon: Activity, accent: 'violet' },
  { key: 'completedProjects', label: 'Completed projects', icon: CheckCircle2, accent: 'green' },
  { key: 'myTasks', label: 'My tasks', icon: UserCheck, accent: 'blue' },
  { key: 'pendingTasks', label: 'Pending tasks', icon: ListTodo, accent: 'amber' },
  { key: 'completedTasks', label: 'Completed tasks', icon: CheckCircle, accent: 'green' },
  { key: 'highPriorityTasks', label: 'High priority tasks', icon: Flame, accent: 'red' },
  { key: 'overdueTasks', label: 'Overdue tasks', icon: AlertTriangle, accent: 'red' },
  { key: 'todaysDeadlines', label: "Today's deadlines", icon: CalendarDays, accent: 'blue' },
];

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const { data: summary, isLoading } = useDashboardSummary();

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  const isTeamMember = summary?.scope === 'member' && summary.charts.teamPerformance.length === 0;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-7xl flex-col gap-6"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-foreground/50">
            {summary?.scope === 'admin'
              ? "Here's how things are going across the whole organization."
              : "Here's what's happening across your projects."}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {CARDS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={summary?.cards?.[card.key] ?? 0}
              icon={card.icon}
              accent={card.accent}
              isLoading={isLoading}
            />
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Task status" subtitle="Breakdown across all your tasks" isLoading={isLoading}>
            <TaskStatusDonut data={summary?.charts?.taskStatus} />
          </ChartCard>

          <ChartCard
            title="Project progress"
            subtitle="Percentage of tasks completed per project"
            isLoading={isLoading}
            empty={summary?.charts?.projectProgress?.length === 0}
            emptyTitle="No active projects"
            emptyMessage="Create a project to start tracking progress."
          >
            <ProjectProgressBars data={summary?.charts?.projectProgress} />
          </ChartCard>

          <ChartCard
            title="Monthly productivity"
            subtitle="Tasks completed over the last 6 months"
            isLoading={isLoading}
          >
            <MonthlyProductivityArea data={summary?.charts?.monthlyProductivity} />
          </ChartCard>

          <ChartCard
            title="Team performance"
            subtitle="Assigned vs. completed tasks per teammate"
            isLoading={isLoading}
            empty={summary?.charts?.teamPerformance?.length === 0}
            emptyTitle={isTeamMember ? 'Not available' : 'No team data yet'}
            emptyMessage={
              isTeamMember
                ? 'Team performance is visible to project managers and admins.'
                : 'Assign tasks to teammates to see performance here.'
            }
          >
            <TeamPerformanceBars data={summary?.charts?.teamPerformance} />
          </ChartCard>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <RecentActivityFeed items={summary?.feeds?.recentActivity} isLoading={isLoading} />
          <NotificationsFeed />
          <UpcomingDeadlinesFeed items={summary?.feeds?.upcomingDeadlines} isLoading={isLoading} />
          <RecentCommentsFeed items={summary?.feeds?.recentComments} isLoading={isLoading} />
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
};

export default Dashboard;
