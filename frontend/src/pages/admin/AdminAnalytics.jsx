import { motion, MotionConfig } from 'framer-motion';
import {
  Users,
  UserCheck,
  FolderKanban,
  Activity,
  CheckCircle2,
  AlertTriangle,
  UsersRound,
  ListTodo,
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import UsersByRoleDonut from '../../components/dashboard/charts/UsersByRoleDonut';
import ProjectsByStatusDonut from '../../components/dashboard/charts/ProjectsByStatusDonut';
import TaskStatusDonut from '../../components/dashboard/charts/TaskStatusDonut';
import UserGrowthArea from '../../components/dashboard/charts/UserGrowthArea';
import MonthlyProductivityArea from '../../components/dashboard/charts/MonthlyProductivityArea';
import TeamPerformanceBars from '../../components/dashboard/charts/TeamPerformanceBars';
import { useAdminAnalytics } from '../../hooks/useAdmin';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const CARDS = [
  { key: 'totalUsers', label: 'Total users', icon: Users, accent: 'blue' },
  { key: 'activeUsers', label: 'Active users', icon: UserCheck, accent: 'green' },
  { key: 'totalProjects', label: 'Total projects', icon: FolderKanban, accent: 'blue' },
  { key: 'activeProjects', label: 'Active projects', icon: Activity, accent: 'violet' },
  { key: 'totalTasks', label: 'Total tasks', icon: ListTodo, accent: 'amber' },
  { key: 'completedTasks', label: 'Completed tasks', icon: CheckCircle2, accent: 'green' },
  { key: 'overdueTasks', label: 'Overdue tasks', icon: AlertTriangle, accent: 'red' },
  { key: 'totalTeams', label: 'Total teams', icon: UsersRound, accent: 'slate' },
];

const AdminAnalytics = () => {
  const { data: analytics, isLoading } = useAdminAnalytics();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {CARDS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={analytics?.cards?.[card.key] ?? 0}
              icon={card.icon}
              accent={card.accent}
              isLoading={isLoading}
            />
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Users by role" subtitle="How your organization's roles break down" isLoading={isLoading}>
            <UsersByRoleDonut data={analytics?.charts?.usersByRole} />
          </ChartCard>

          <ChartCard title="Projects by status" subtitle="Where every project stands" isLoading={isLoading}>
            <ProjectsByStatusDonut data={analytics?.charts?.projectsByStatus} />
          </ChartCard>

          <ChartCard title="Tasks by status" subtitle="Breakdown across every task in the system" isLoading={isLoading}>
            <TaskStatusDonut data={analytics?.charts?.tasksByStatus} />
          </ChartCard>

          <ChartCard title="New users" subtitle="Signups over the last 6 months" isLoading={isLoading}>
            <UserGrowthArea data={analytics?.charts?.monthlyUserGrowth} />
          </ChartCard>

          <ChartCard title="Task completion" subtitle="Tasks completed over the last 6 months" isLoading={isLoading}>
            <MonthlyProductivityArea data={analytics?.charts?.monthlyTaskCompletion} />
          </ChartCard>

          <ChartCard
            title="Top contributors"
            subtitle="Assigned vs. completed tasks, system-wide"
            isLoading={isLoading}
            empty={analytics?.charts?.topContributors?.length === 0}
            emptyTitle="No task activity yet"
            emptyMessage="Assign tasks to teammates to see contributors here."
          >
            <TeamPerformanceBars data={analytics?.charts?.topContributors} />
          </ChartCard>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
};

export default AdminAnalytics;
