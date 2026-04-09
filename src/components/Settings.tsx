import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Save, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import ConfirmDialog from './ConfirmDialog';

interface SettingsProps {
  user: any;
  onUpdateUser: (user: any) => void;
}

export default function Settings({ user, onUpdateUser }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'User',
    avatar_url: user.avatar_url || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await api.users.updateProfile({
        name: formData.name,
        avatar_url: formData.avatar_url,
      });
      onUpdateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      await api.tasks.clearAll();
      toast.success('All tasks have been permanently deleted');
    } catch (error) {
      // Silent error
    } finally {
      setDeleteLoading(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-neutral-500">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and how others see you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center overflow-hidden">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-3xl font-bold text-neutral-400">{user.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatar_url">Profile Picture URL</Label>
                  <Input 
                    id="avatar_url" 
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="border-neutral-200"
                  />
                  <p className="text-xs text-neutral-500">Enter a URL for your profile image (JPG, PNG, GIF).</p>
                </div>
              </div>

              <Separator className="bg-neutral-100" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-neutral-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    disabled
                    className="border-neutral-200 bg-neutral-50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role" 
                    value={formData.role} 
                    disabled
                    className="border-neutral-200 bg-neutral-50" 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-100 bg-neutral-50/50 flex justify-end p-4">
              <Button onClick={handleSave} disabled={loading} className="bg-neutral-900 text-white">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive alerts and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-neutral-500">Receive daily summaries of your tasks.</p>
                </div>
                <div className="h-6 w-11 bg-neutral-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all translate-x-5"></div>
                </div>
              </div>
              <Separator className="bg-neutral-100" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Real-time Updates</Label>
                  <p className="text-sm text-neutral-500">Get notified instantly when tasks are updated.</p>
                </div>
                <div className="h-6 w-11 bg-neutral-900 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all translate-x-5"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="••••••••" className="border-neutral-200" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="••••••••" className="border-neutral-200" />
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-100 bg-neutral-50/50 flex justify-end p-4">
              <Button variant="outline">Update Password</Button>
            </CardFooter>
          </Card>

          <Card className="border-red-200 shadow-sm border-2">
            <CardHeader className="bg-red-50/50">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-red-700">
                Irreversible and destructive actions for your account data.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base text-red-900">Delete All Tasks</Label>
                  <p className="text-sm text-red-600/80">Permanently remove every task from the database.</p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of TaskFlow.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="aspect-video bg-white border-2 border-neutral-900 rounded-md p-2 flex flex-col gap-1">
                  <div className="h-2 w-full bg-neutral-100 rounded"></div>
                  <div className="h-2 w-2/3 bg-neutral-100 rounded"></div>
                </div>
                <p className="text-xs text-center font-medium">Light</p>
              </div>
              <div className="space-y-2 opacity-50 grayscale">
                <div className="aspect-video bg-neutral-900 border border-neutral-800 rounded-md p-2 flex flex-col gap-1">
                  <div className="h-2 w-full bg-neutral-800 rounded"></div>
                  <div className="h-2 w-2/3 bg-neutral-800 rounded"></div>
                </div>
                <p className="text-xs text-center font-medium">Dark (Coming Soon)</p>
              </div>
              <div className="space-y-2 opacity-50 grayscale">
                <div className="aspect-video bg-neutral-100 border border-neutral-200 rounded-md p-2 flex flex-col gap-1">
                  <div className="h-2 w-full bg-neutral-200 rounded"></div>
                  <div className="h-2 w-2/3 bg-neutral-200 rounded"></div>
                </div>
                <p className="text-xs text-center font-medium">System</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        loading={deleteLoading}
        title="CRITICAL: Delete All Tasks"
        description="This will permanently delete EVERY task in the system. This action is irreversible and cannot be undone. Are you absolutely sure you want to proceed?"
        confirmText="Yes, Delete Everything"
        variant="destructive"
      />
    </div>
  );
}
