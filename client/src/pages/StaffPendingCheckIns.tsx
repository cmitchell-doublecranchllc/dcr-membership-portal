import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

export default function StaffPendingCheckIns() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: pendingCheckIns, refetch } = trpc.checkIns.getPendingCheckIns.useQuery(
    undefined,
    { 
      enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    }
  );

  const approveMutation = trpc.checkIns.approveCheckIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in approved!");
      utils.checkIns.getPendingCheckIns.invalidate();
      utils.checkIns.getTodayCheckIns.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to approve check-in", {
        description: error.message,
      });
    },
  });

  const rejectMutation = trpc.checkIns.rejectCheckIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in rejected");
      utils.checkIns.getPendingCheckIns.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to reject check-in", {
        description: error.message,
      });
    },
  });

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  if (!isAuthenticated || !isStaffOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is only accessible to staff and administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApprove = async (checkInId: number) => {
    await approveMutation.mutateAsync({ checkInId });
  };

  const handleReject = async (checkInId: number) => {
    const reason = window.prompt("Reason for rejection (optional):");
    await rejectMutation.mutateAsync({ checkInId, reason: reason || undefined });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        <PageHeader 
          title="Pending Check-Ins"
          description="Review and verify student check-ins"
          backLink="/staff"
          backLabel="Back to Staff Dashboard"
          action={
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Pending Verifications
              {pendingCheckIns && pendingCheckIns.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCheckIns.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Check-ins submitted by students awaiting staff approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!pendingCheckIns || pendingCheckIns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No pending check-ins</p>
                <p className="text-sm">All check-ins have been verified!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCheckIns.map((item) => (
                    <TableRow key={item.checkIn.id}>
                      <TableCell className="font-medium">
                        {item.user.name}
                      </TableCell>
                      <TableCell>
                        {new Date(item.checkIn.checkInTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.checkIn.checkInType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.checkIn.program}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.checkIn.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(item.checkIn.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(item.checkIn.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
