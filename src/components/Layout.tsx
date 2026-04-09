import React from 'react';
import { LogOut, LayoutDashboard, CheckCircle2, ListTodo, Users, Settings, Bell, Search, Info, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Layout({ children, user, onLogout, currentView, onViewChange }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => onViewChange('dashboard')}>
          <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">TaskFlow</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard className="w-4 h-4" />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')}
          />
          <NavItem 
            icon={<ListTodo className="w-4 h-4" />} 
            label="My Tasks" 
            active={currentView === 'tasks'} 
            onClick={() => onViewChange('tasks')}
          />
          <NavItem 
            icon={<Users className="w-4 h-4" />} 
            label="Team" 
            active={currentView === 'team'} 
            onClick={() => onViewChange('team')}
          />
          <NavItem 
            icon={<Settings className="w-4 h-4" />} 
            label="Settings" 
            active={currentView === 'settings'} 
            onClick={() => onViewChange('settings')}
          />
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
            <Avatar className="w-9 h-9 border border-neutral-200">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-neutral-100 text-neutral-600 font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.role || 'Member'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                placeholder="Search tasks, teams..." 
                className="pl-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-neutral-600" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4 border-b border-neutral-100">
                  <h3 className="font-bold">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <NotificationItem 
                    title="New task assigned" 
                    desc="You have been assigned to 'Design Landing Page'" 
                    time="2m ago" 
                    unread 
                  />
                  <NotificationItem 
                    title="Task completed" 
                    desc="Sarah finished 'API Integration'" 
                    time="1h ago" 
                  />
                  <NotificationItem 
                    title="System Update" 
                    desc="TaskFlow Pro v2.1 is now live!" 
                    time="5h ago" 
                  />
                </div>
                <div className="p-2 border-t border-neutral-100 text-center">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-neutral-500">View all notifications</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="p-0 hover:bg-transparent cursor-pointer outline-none ring-0 focus:ring-0">
                <Avatar className="w-8 h-8 border border-neutral-200">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="font-bold text-neutral-900">{user?.name || 'User'}</span>
                  <span className="text-[10px] text-neutral-500 font-normal">{user?.email || ''}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewChange('settings')}>
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewChange('settings')}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${active 
          ? 'bg-neutral-900 text-white shadow-sm' 
          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function NotificationItem({ title, desc, time, unread = false }: { title: string; desc: string; time: string; unread?: boolean }) {
  return (
    <div className={cn(
      "p-4 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-50 last:border-0",
      unread && "bg-blue-50/30"
    )}>
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-sm font-bold">{title}</h4>
        <span className="text-[10px] text-neutral-400 whitespace-nowrap">{time}</span>
      </div>
      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{desc}</p>
      {unread && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />}
    </div>
  );
}
