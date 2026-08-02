import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { KANBAN_STATUSES } from '../../validation/taskSchemas';
import { useUpdateTask } from '../../hooks/useTasks';

const KanbanBoard = ({ tasks, onTaskClick }) => {
  const [activeTask, setActiveTask] = useState(null);
  const updateMutation = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const topLevelTasks = tasks.filter((task) => !task.parentTask);

  const subtaskStatsMap = tasks.reduce((acc, task) => {
    if (task.parentTask) {
      const key = typeof task.parentTask === 'string' ? task.parentTask : task.parentTask._id;
      acc[key] = acc[key] || { total: 0, completed: 0 };
      acc[key].total += 1;
      if (task.status === 'done') acc[key].completed += 1;
    }
    return acc;
  }, {});

  const columns = KANBAN_STATUSES.reduce((acc, status) => {
    acc[status] = topLevelTasks
      .filter((task) => task.status === status)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return acc;
  }, {});

  const findTask = (id) => topLevelTasks.find((task) => task._id === id);
  const findColumnOfTask = (id) =>
    KANBAN_STATUSES.find((status) => columns[status].some((task) => task._id === id));

  const handleDragStart = (event) => {
    setActiveTask(findTask(event.active.id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeTaskData = findTask(active.id);
    if (!activeTaskData) return;

    const overIsColumn = KANBAN_STATUSES.includes(over.id);
    const targetStatus = overIsColumn ? over.id : findColumnOfTask(over.id);
    if (!targetStatus) return;

    const targetColumnTasks = columns[targetStatus].filter((task) => task._id !== active.id);
    let overIndex = overIsColumn
      ? targetColumnTasks.length
      : targetColumnTasks.findIndex((task) => task._id === over.id);
    if (overIndex === -1) overIndex = targetColumnTasks.length;

    const prevTask = targetColumnTasks[overIndex - 1];
    const nextTask = targetColumnTasks[overIndex];
    let newPosition;
    if (!prevTask && !nextTask) newPosition = 0;
    else if (!prevTask) newPosition = (nextTask.position ?? 0) - 1;
    else if (!nextTask) newPosition = (prevTask.position ?? 0) + 1;
    else newPosition = ((prevTask.position ?? 0) + (nextTask.position ?? 0)) / 2;

    const statusChanged = activeTaskData.status !== targetStatus;
    if (!statusChanged && newPosition === activeTaskData.position) return;

    updateMutation.mutate({
      id: active.id,
      data: statusChanged ? { status: targetStatus, position: newPosition } : { position: newPosition },
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columns[status]}
            subtaskStatsMap={subtaskStatsMap}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            subtaskStats={subtaskStatsMap[activeTask._id]}
            onClick={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
