import React, { useState, useEffect } from 'react';
import { Users, Mail, Shield, MoreHorizontal, UserPlus, Check, X, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import socket from '@/lib/socket';

interface TeamProps {
  user: any;
}

export default function Team({ user }: TeamProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    try {
      const [membersRes, pendingRes] = await Promise.all([
        api.team.list(),
        isAdmin ? api.team.listPending() : Promise.resolve([])
      ]);
      setMembers(membersRes);
      setPending(pendingRes);
    } catch (error) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const users = await api.users.list();
      // Filter out users already in members or pending
      const existingIds = new Set([...members, ...pending].map(m => m.id));
      setAllUsers(users.filter((u: any) => !existingIds.has(u.id)));
    } catch (error) {
      // Silent error
    }
  };

  useEffect(() => {
    fetchData();
    socket.on('team:updated', fetchData);
    return () => {
      socket.off('team:updated', fetchData);
    };
  }, [isAdmin]);

  const handleInvite = async (userId: number) => {
    setInviteLoading(true);
    try {
      await api.team.invite(userId);
      toast.success('Invitation sent!');
      setIsInviteOpen(false);
      fetchData();
    } catch (error: any) {
      // Silent error
    } finally {
      setInviteLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      await api.team.approve(userId);
      toast.success('Member approved');
      fetchData();
    } catch (error: any) {
      // Silent error
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (userId: number) => {
    setActionLoading(userId);
    try {
      await api.team.remove(userId);
      toast.success('Member removed');
      fetchData();
    } catch (error: any) {
      // Silent error
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    try {
      await api.team.leave();
      toast.success('You have left the team');
      window.location.reload(); // Refresh to update UI state
    } catch (error: any) {
      // Silent error
    }
  };

  const isUserInTeam = members.some(m => m.id === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-neutral-500">Collaborate with your team members.</p>
        </div>
        <div className="flex gap-2">
          {isUserInTeam && (
            <Button variant="outline" onClick={handleLeave} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" /> Leave Team
            </Button>
          )}
          <Dialog open={isInviteOpen} onOpenChange={(open) => {
            setIsInviteOpen(open);
            if (open) fetchAllUsers();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-neutral-900 text-white gap-2">
                <UserPlus className="w-4 h-4" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite to Team</DialogTitle>
                <DialogDescription>
                  Search for users to invite to your workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4">
                {allUsers.length === 0 ? (
                  <p className="text-center text-neutral-500 py-4">No users available to invite.</p>
                ) : (
                  allUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-neutral-500">{u.email}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleInvite(u.id)} disabled={inviteLoading}>
                        Invite
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-4 h-4" /> Members ({members.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" /> Pending ({pending.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="border-neutral-200 animate-pulse">
                  <div className="h-32 bg-neutral-50" />
                </Card>
              ))
            ) : members.length === 0 ? (
              <Card className="col-span-full p-12 flex flex-col items-center justify-center border-dashed border-2">
                <Users className="w-12 h-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">No team members yet</h3>
                <p className="text-neutral-500">Invite someone to start collaborating.</p>
              </Card>
            ) : (
              members.map((member) => (
                <Card key={member.id} className="border-neutral-200 hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-neutral-100">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-neutral-50 text-neutral-600">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-bold">{member.name}</CardTitle>
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </p>
                      </div>
                    </div>
                    {isAdmin && member.id !== user?.id && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-600"
                        onClick={() => handleRemove(member.id)}
                        disabled={actionLoading === member.id}
                      >
                        {actionLoading === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 border-none font-medium">
                        <Shield className="w-3 h-3 mr-1" /> {member.role || 'Member'}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pending.length === 0 ? (
                <Card className="col-span-full p-12 flex flex-col items-center justify-center border-dashed border-2">
                  <Clock className="w-12 h-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900">No pending requests</h3>
                  <p className="text-neutral-500">New join requests will appear here.</p>
                </Card>
              ) : (
                pending.map((member) => (
                  <Card key={member.id} className="border-neutral-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border border-neutral-100">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base font-bold">{member.name}</CardTitle>
                          <p className="text-xs text-neutral-500">{member.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex gap-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={() => handleApprove(member.id)}
                        disabled={actionLoading === member.id}
                      >
                        {actionLoading === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-2"
                        onClick={() => handleRemove(member.id)}
                        disabled={actionLoading === member.id}
                      >
                        {actionLoading === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        Reject
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

