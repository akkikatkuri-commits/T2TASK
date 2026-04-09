import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { gemini } from '@/lib/gemini';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskForm({ open, onOpenChange }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    due_date: undefined as Date | undefined,
    assigned_to: '',
  });

  useEffect(() => {
    if (open) {
      api.users.list().then(setUsers).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.tasks.create({
        ...formData,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        due_date: formData.due_date?.toISOString(),
      });
      toast.success('Task created successfully');
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        due_date: undefined,
        assigned_to: '',
      });
    } catch (error: any) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!formData.title) {
      toast.info('Please enter a title first');
      return;
    }
    setAiLoading(true);
    try {
      const [priorityRes, categoryRes] = await Promise.all([
        gemini.suggestPriority(formData.title, formData.description),
        gemini.categorizeTask(formData.title)
      ]);
      
      setFormData(prev => ({
        ...prev,
        priority: priorityRes.priority,
        category: categoryRes.category
      }));
      
      toast.success('AI suggestions applied!', {
        description: priorityRes.reason
      });
    } catch (error) {
      // Silent error
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-neutral-900 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create New Task</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Fill in the details below to add a new task to your flow.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Task Title</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-neutral-900"
                onClick={handleAiSuggest}
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                AI Suggest
              </Button>
            </div>
            <Input
              id="title"
              placeholder="e.g., Design new landing page"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-neutral-200 focus:ring-neutral-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details about this task..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none border-neutral-200 focus:ring-neutral-900"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
              >
                <SelectTrigger className="border-neutral-200">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="e.g., Work"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="border-neutral-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal border-neutral-200",
                    !formData.due_date && "text-neutral-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, 'PPP') : <span>Pick a date</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(d) => setFormData({ ...formData, due_date: d })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select 
                value={formData.assigned_to} 
                onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
              >
                <SelectTrigger className="border-neutral-200">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-neutral-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
