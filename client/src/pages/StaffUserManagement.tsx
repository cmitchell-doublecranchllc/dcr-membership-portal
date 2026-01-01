import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, UserCheck, UserX, Shield, UserPlus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function StaffUserManagement() {
  const [, setLocation] = useLocation();
  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery();
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();
  const createProfileMutation = trpc.admin.createMemberProfile.useMutation();
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUserMutation.mutateAsync({ userId: userToDelete });
      toast.success('User deleted successfully');
      refetch();
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'staff':
        return <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Staff</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><UserCheck className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><UserX className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation('/staff')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Staff Dashboard
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all user accounts in the system. Delete users and their associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users && users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
            
            {users && users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name || 'No name'}</span>
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.accountStatus)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.email || 'No email'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {user.id} • Created: {new Date(user.createdAt).toLocaleDateString()}
                    {user.memberId && ` • Member ID: ${user.memberId}`}
                    {!user.memberId && ' • No member profile'}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!user.memberId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await createProfileMutation.mutateAsync({ userId: user.id, membershipTier: 'bronze' });
                          toast.success('Member profile created');
                          refetch();
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to create profile');
                        }
                      }}
                      disabled={createProfileMutation.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Profile
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setUserToDelete(user.id)}
                    disabled={deleteUserMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={userToDelete !== null} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Member profile</li>
                <li>Check-in history</li>
                <li>All related records</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
