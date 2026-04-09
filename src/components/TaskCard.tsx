import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, MoreVertical, Trash2, Edit2, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ConfirmDialog from './ConfirmDialog';

interface TaskCardProps {
  task: any;
  view: 'grid' | 'list';
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function TaskCard({ task, view, isSelected, onSelect }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await api.tasks.update(task.id, { status: newStatus });
    } catch (error: any) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.tasks.delete(task.id);
      toast.success('Task deleted');
    } catch (error: any) {
      // Silent error
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const priorityColors = {
    low: 'bg-blue-50 text-blue-600 border-blue-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    high: 'bg-red-50 text-red-600 border-red-100',
  };

  if (view === 'list') {
    return (
      <div className={cn(
        "p-4 rounded-xl border transition-all flex items-center gap-4 group",
        isSelected ? "bg-neutral-900 border-neutral-800 shadow-lg" : "bg-white border-neutral-200 hover:shadow-md"
      )}>
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onSelect}
          className={cn("w-5 h-5", isSelected ? "border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-neutral-900" : "")}
        />
        <Separator orientation="vertical" className={cn("h-6", isSelected ? "bg-neutral-800" : "bg-neutral-100")} />
        <Checkbox 
          checked={task.status === 'done'} 
          onCheckedChange={toggleStatus}
          disabled={loading}
          className={cn("w-5 h-5", isSelected ? "border-white/50" : "")}
        />
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold truncate",
            task.status === 'done' ? 'line-through opacity-50' : '',
            isSelected ? "text-white" : "text-neutral-900"
          )}>
            {task.title}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className={cn(
              "text-[10px] uppercase tracking-wider",
              isSelected ? "bg-white/10 text-white border-white/20" : priorityColors[task.priority as keyof typeof priorityColors]
            )}>
              {task.priority}
            </Badge>
            {task.due_date && (
              <span className={cn("text-xs flex items-center gap-1", isSelected ? "text-neutral-400" : "text-neutral-400")}>
                <Calendar className="w-3 h-3" /> {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className={cn("h-8 w-8", isSelected ? "text-neutral-400 hover:text-white hover:bg-white/10" : "text-neutral-400 hover:text-neutral-900")}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsConfirmOpen(true)} 
            className={cn("h-8 w-8", isSelected ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : "text-neutral-400 hover:text-red-600")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 border-neutral-200 overflow-hidden relative",
      isSelected ? "bg-neutral-900 border-neutral-800 ring-2 ring-neutral-900 ring-offset-2" : "bg-white"
    )}>
      {/* Selection Overlay */}
      <div className={cn(
        "absolute top-3 left-3 z-10 transition-opacity",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onSelect}
          className={cn("w-5 h-5 shadow-sm", isSelected ? "border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-neutral-900" : "bg-white border-neutral-300")}
        />
      </div>

      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 pl-12">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cn(
            "text-[10px] uppercase tracking-wider font-bold",
            isSelected ? "bg-white/10 text-white border-white/20" : priorityColors[task.priority as keyof typeof priorityColors]
          )}>
            {task.priority}
          </Badge>
          {task.category && (
            <Badge variant="secondary" className={cn(
              "text-[10px] uppercase tracking-wider",
              isSelected ? "bg-white/5 text-neutral-300 border-none" : "bg-neutral-100 text-neutral-600"
            )}>
              {task.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsConfirmOpen(true)} 
            className={cn("h-8 w-8", isSelected ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : "text-neutral-400 hover:text-red-600 hover:bg-red-50")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8", isSelected ? "text-neutral-400 hover:text-white" : "text-neutral-400")}>
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={isSelected ? "bg-neutral-900 border-neutral-800 text-white" : ""}>
              <DropdownMenuItem className={isSelected ? "hover:bg-neutral-800 focus:bg-neutral-800" : ""}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsConfirmOpen(true)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-start gap-3">
          <Checkbox 
            checked={task.status === 'done'} 
            onCheckedChange={toggleStatus}
            disabled={loading}
            className={cn("mt-1", isSelected ? "border-white/50" : "")}
          />
          <div className="space-y-1">
            <h4 className={cn(
              "font-bold text-lg leading-tight",
              task.status === 'done' ? 'line-through opacity-50' : '',
              isSelected ? "text-white" : "text-neutral-900"
            )}>
              {task.title}
            </h4>
            {task.description && (
              <p className={cn(
                "text-sm line-clamp-2 leading-relaxed",
                isSelected ? "text-neutral-400" : "text-neutral-500"
              )}>
                {task.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className={cn(
        "p-4 pt-0 flex items-center justify-between border-t mt-2",
        isSelected ? "border-neutral-800 bg-white/5" : "border-neutral-50 bg-neutral-50/30"
      )}>
        <div className={cn("flex items-center gap-3 text-xs", isSelected ? "text-neutral-400" : "text-neutral-500")}>
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </div>
          )}
          {task.assigned_to_name && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assigned_to_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsConfirmOpen(true)} 
            className={cn("h-8 w-8", isSelected ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : "text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="flex -space-x-2">
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
              isSelected ? "bg-neutral-800 border-neutral-900 text-white" : "bg-neutral-200 border-white text-neutral-600"
            )}>
              {task.assigned_to_name?.charAt(0) || '?'}
            </div>
          </div>
        </div>
      </CardFooter>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
        title="Delete Task"
        description={`Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        variant="destructive"
      />
    </Card>
  );
}
