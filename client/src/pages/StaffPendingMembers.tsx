import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import { CheckCircle, XCircle, Mail, Calendar, User, Eye, Phone, AlertCircle, Heart, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StaffPendingMembers() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);

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

  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully.");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
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

  const handleDelete = (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to permanently delete ${userName}'s registration? This action cannot be undone.`)) {
      deleteMutation.mutate({ userId });
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
                        onClick={() => {
                          setSelectedUserDetails(pendingUser);
                          setShowDetailsDialog(true);
                        }}
                        variant="outline"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
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
                      <Button
                        onClick={() => handleDelete(pendingUser.id, pendingUser.name || 'User')}
                        disabled={deleteMutation.isPending}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* View Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Application Details</DialogTitle>
              <DialogDescription>
                Complete information submitted by {selectedUserDetails?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUserDetails?.member && (
              <div className="space-y-6 py-4">
                {/* Student Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-muted-foreground">Full Name</Label>
                      <p className="font-medium">{selectedUserDetails.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">
                        {selectedUserDetails.member.dateOfBirth 
                          ? format(new Date(selectedUserDetails.member.dateOfBirth), 'MMM d, yyyy')
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Medical Information
                  </h3>
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-muted-foreground">Allergies</Label>
                      <p className="font-medium">{selectedUserDetails.member.allergies || 'None reported'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Current Medications</Label>
                      <p className="font-medium">{selectedUserDetails.member.medications || 'None reported'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Special Medical Conditions</Label>
                      <p className="font-medium">{selectedUserDetails.member.medicalNotes || 'None reported'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedUserDetails.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedUserDetails.member.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedUserDetails.member.emergencyContactName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedUserDetails.member.emergencyContactPhone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Relationship</Label>
                      <p className="font-medium">{selectedUserDetails.member.emergencyContactRelationship || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Riding Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Riding Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-muted-foreground">Membership Tier</Label>
                      <p className="font-medium capitalize">{selectedUserDetails.member.membershipTier || 'Not selected'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Horse Management Level</Label>
                      <p className="font-medium capitalize">{selectedUserDetails.member.horseManagementLevel || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Consents */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Consents & Agreements</h3>
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedUserDetails.member.liabilityWaiverSigned ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span>Liability Waiver Signed</span>
                      {selectedUserDetails.member.liabilityWaiverSignedAt && (
                        <span className="text-sm text-muted-foreground">
                          ({format(new Date(selectedUserDetails.member.liabilityWaiverSignedAt), 'MMM d, yyyy h:mm a')})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedUserDetails.member.photoConsent ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span>Photo/Media Consent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedUserDetails.member.smsConsent ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span>SMS/Text Message Consent</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setSelectedUserDetails(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsDialog(false);
                  handleApprove(selectedUserDetails.id);
                }}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
