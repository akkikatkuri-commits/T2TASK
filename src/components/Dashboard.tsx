import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import socket from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { ListTodo, Plus, Filter, LayoutGrid, List as ListIcon, Sparkles, Check, Trash2 } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import ConfirmDialog from './ConfirmDialog';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    loading: false,
  });

  useEffect(() => {
    fetchTasks();

    socket.on('tasks:updated', () => {
      fetchTasks();
    });

    socket.on('task:created', (newTask) => {
      setTasks(prev => [newTask, ...prev]);
      if (newTask.created_by !== user.id) {
        toast.info(`New task added: ${newTask.title}`);
      }
    });

    socket.on('task:updated', (updatedTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    });

    socket.on('task:deleted', (deletedId) => {
      setTasks(prev => prev.filter(t => t.id !== Number(deletedId)));
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await api.tasks.list();
      setTasks(data);
    } catch (error: any) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterStatus && task.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    pending: tasks.filter(t => t.status !== 'done').length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
  };

  const handleClearCompleted = async () => {
    setConfirmConfig(prev => ({ ...prev, loading: true }));
    try {
      await api.tasks.clearCompleted();
      toast.success('Completed tasks deleted permanently');
      fetchTasks();
    } catch (error) {
      // Silent error
    } finally {
      setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const handleBulkDelete = async () => {
    setConfirmConfig(prev => ({ ...prev, loading: true }));
    try {
      await api.tasks.deleteMultiple(selectedIds);
      toast.success(`${selectedIds.length} tasks deleted`);
      setSelectedIds([]);
      fetchTasks();
    } catch (error) {
      // Silent error
    } finally {
      setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const handleBulkUpdate = async (data: any) => {
    try {
      await api.tasks.updateMultiple(selectedIds, data);
      toast.success(`Updated ${selectedIds.length} tasks`);
      setSelectedIds([]);
      fetchTasks();
    } catch (error) {
      // Silent error
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {/* Selection Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-neutral-800"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-neutral-800">
              <span className="text-sm font-bold">{selectedIds.length} selected</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedIds([])}
                className="text-neutral-400 hover:text-white h-7 px-2"
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-neutral-800 h-9">
                    Update Status
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2 bg-neutral-900 border-neutral-800">
                  <div className="space-y-1">
                    {['todo', 'in-progress', 'done'].map(s => (
                      <Button 
                        key={s}
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-white hover:bg-neutral-800 capitalize"
                        onClick={() => handleBulkUpdate({ status: s })}
                      >
                        {s.replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-neutral-800 h-9">
                    Set Priority
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2 bg-neutral-900 border-neutral-800">
                  <div className="space-y-1">
                    {['low', 'medium', 'high'].map(p => (
                      <Button 
                        key={p}
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-white hover:bg-neutral-800 capitalize"
                        onClick={() => handleBulkUpdate({ priority: p })}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Separator orientation="vertical" className="h-4 bg-neutral-800 mx-2" />

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setConfirmConfig({
                  isOpen: true,
                  title: 'Delete Selected Tasks',
                  description: `Are you sure you want to permanently delete ${selectedIds.length} selected tasks? This action cannot be undone.`,
                  onConfirm: handleBulkDelete,
                  loading: false
                })}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-9"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        loading={confirmConfig.loading}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant="destructive"
        confirmText="Delete Permanently"
      />

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Good morning, {user?.name?.split(' ')[0] || 'User'}!</h2>
          <p className="text-neutral-500 mt-1">You have {stats.pending} tasks pending for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex border-neutral-200">
                <Filter className="w-4 h-4 mr-2" /> 
                Filter
                {(filterPriority || filterStatus) && (
                  <span className="ml-2 w-2 h-2 bg-neutral-900 rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Priority</h4>
                <div className="space-y-1">
                  {['low', 'medium', 'high'].map(p => (
                    <button 
                      key={p}
                      onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                        filterPriority === p ? "bg-neutral-100 font-medium" : "hover:bg-neutral-50"
                      )}
                    >
                      <span className="capitalize">{p}</span>
                      {filterPriority === p && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
              <Separator className="bg-neutral-100" />
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Status</h4>
                <div className="space-y-1">
                  {['todo', 'in-progress', 'done'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                        filterStatus === s ? "bg-neutral-100 font-medium" : "hover:bg-neutral-50"
                      )}
                    >
                      <span className="capitalize">{s.replace('-', ' ')}</span>
                      {filterStatus === s && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
              {(filterPriority || filterStatus) && (
                <>
                  <Separator className="bg-neutral-100" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setFilterPriority(null);
                      setFilterStatus(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
              <Separator className="bg-neutral-100" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 justify-start px-2"
                onClick={() => setConfirmConfig({
                  isOpen: true,
                  title: 'Clear Completed Tasks',
                  description: 'Are you sure you want to permanently delete all completed tasks? This action cannot be undone.',
                  onConfirm: handleClearCompleted,
                  loading: false
                })}
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Clear Completed
              </Button>
            </PopoverContent>
          </Popover>
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1">
            <Button 
              variant={view === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setView('list')}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="bg-neutral-900 text-white hover:bg-neutral-800">
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats.total} color="bg-blue-50 text-blue-700" />
        <StatCard label="Completed" value={stats.completed} color="bg-green-50 text-green-700" />
        <StatCard label="Pending" value={stats.pending} color="bg-amber-50 text-amber-700" />
        <StatCard label="High Priority" value={stats.highPriority} color="bg-red-50 text-red-700" />
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-neutral-100 animate-pulse rounded-xl border border-neutral-200"></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-neutral-300">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
            <ListTodo className="w-8 h-8 text-neutral-300" />
          </div>
          <h3 className="text-lg font-semibold">No tasks yet</h3>
          <p className="text-neutral-500 mb-6">Get started by creating your first task.</p>
          <Button onClick={() => setIsFormOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Create Task
          </Button>
        </div>
      ) : (
        <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <TaskCard 
                  task={task} 
                  view={view} 
                  isSelected={selectedIds.includes(task.id)}
                  onSelect={() => toggleSelection(task.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <TaskForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <div className={`px-2 py-1 rounded-md text-xs font-bold ${color}`}>
          {value > 0 ? '+12%' : '0%'}
        </div>
      </div>
    </div>
  );
}
