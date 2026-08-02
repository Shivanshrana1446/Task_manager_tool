import { Server, Cpu, MemoryStick, Database, Clock, CircleDot } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { useSystemHealth } from '../../hooks/useAdmin';

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
};

const AdminSystemHealth = () => {
  const { data: health, isLoading } = useSystemHealth();

  const memoryPercent = health
    ? Math.min(Math.round((health.memory.rssMB / health.memory.systemTotalMB) * 100), 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">System health</h2>
          <p className="mt-1 text-sm text-foreground/50">
            Live snapshot of the server, database, and process. Refreshes automatically.
          </p>
        </div>
        {!isLoading && health && (
          <Badge variant={health.status === 'ok' ? 'success' : 'danger'}>
            <CircleDot size={11} />
            {health.status === 'ok' ? 'All systems normal' : 'Degraded'}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-foreground/60">
              <Database size={16} />
              <span className="text-sm font-medium">Database</span>
            </div>
            <p className="text-2xl font-semibold capitalize text-foreground">{health.database.status}</p>
            <p className="mt-1 truncate text-xs text-foreground/40">{health.database.name || '—'}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-foreground/60">
              <Clock size={16} />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{formatUptime(health.uptimeSeconds)}</p>
            <p className="mt-1 text-xs text-foreground/40">Since last restart</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-foreground/60">
              <Server size={16} />
              <span className="text-sm font-medium">Environment</span>
            </div>
            <p className="text-2xl font-semibold capitalize text-foreground">{health.environment}</p>
            <p className="mt-1 text-xs text-foreground/40">
              Node {health.node.version} &middot; {health.node.platform}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:col-span-2">
            <div className="mb-3 flex items-center justify-between text-foreground/60">
              <div className="flex items-center gap-2">
                <MemoryStick size={16} />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-xs tabular-nums text-foreground/40">
                {health.memory.rssMB} MB / {health.memory.systemTotalMB} MB
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${memoryPercent}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-foreground/50 sm:grid-cols-4">
              <span>Heap used: {health.memory.heapUsedMB} MB</span>
              <span>Heap total: {health.memory.heapTotalMB} MB</span>
              <span>System free: {health.memory.systemFreeMB} MB</span>
              <span>System total: {health.memory.systemTotalMB} MB</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-foreground/60">
              <Cpu size={16} />
              <span className="text-sm font-medium">CPU</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{health.cpu.cores} cores</p>
            <p className="mt-1 truncate text-xs tabular-nums text-foreground/40">
              Load avg: {health.cpu.loadAverage.map((value) => value.toFixed(2)).join(' / ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemHealth;
