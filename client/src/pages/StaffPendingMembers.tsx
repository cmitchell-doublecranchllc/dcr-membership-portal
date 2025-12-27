import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import { CheckCircle, XCircle, Mail, Calendar, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StaffPendingMembers() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: pendingUsers, refetch } = trpc.admin.getPendingUsers.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') }
  );

  const approveMutation = trpc.admin.approveUser.useMutation({
    onSuccess: () => {
      toast.success("User approved successfully! Welcome email sent.");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve user: ${error.message}`);
    },
  });

  const rejectMutation = trpc.admin.rejectUser.useMutation({
    onSuccess: () => {
      toast.success("User rejected. Notification email sent.");
      setShowRejectDialog(false);
      setSelectedUser(null);
      setRejectReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reject user: ${error.message}`);
    },
  });

  const handleApprove = (userId: number) => {
    if (confirm("Are you sure you want to approve this user? They will receive a welcome email and gain full portal access.")) {
      approveMutation.mutate({ userId });
    }
  };

  const handleReject = (user: any) => {
    setSelectedUser(user);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedUser) {
      rejectMutation.mutate({
        userId: selectedUser.id,
        reason: rejectReason || undefined,
      });
    }
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] py-8">
      <div className="container max-w-6xl">
        <PageHeader 
          title="Pending Member Registrations"
          description="Review and approve new member applications"
          backLink="/staff"
          backLabel="Back to Dashboard"
        />

        {!pendingUsers || pendingUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Registrations</h3>
              <p className="text-muted-foreground">
                All new member applications have been reviewed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map((pendingUser) => (
              <Card key={pendingUser.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {pendingUser.name}
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending Approval
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {pendingUser.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Registered: {format(new Date(pendingUser.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(pendingUser.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(pendingUser)}
                        disabled={rejectMutation.isPending}
                        variant="destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Member Application</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject {selectedUser?.name}'s application? 
                They will receive an email notification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a reason for rejection (will be included in the email)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedUser(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
