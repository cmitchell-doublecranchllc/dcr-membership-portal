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
import { CheckCircle, Clock, XCircle, RefreshCw, Calendar } from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";

export default function StaffAttendance() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: recentCheckIns, refetch } = trpc.checkIns.getRecentCheckIns.useQuery(
    { limit: 100 },
    { 
      enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    }
  );

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        <PageHeader 
          title="Attendance Log"
          description="View all student check-in records"
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
              <Calendar className="h-5 w-5" />
              Check-In Records
            </CardTitle>
            <CardDescription>
              Complete history of student check-ins with verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!recentCheckIns || recentCheckIns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No check-in records</p>
                <p className="text-sm">Check-ins will appear here once students start checking in</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Check-In Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified By</TableHead>
                      <TableHead>Verified At</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCheckIns.map((checkIn: any) => (
                      <TableRow key={checkIn.id}>
                        <TableCell className="font-medium">
                          {checkIn.member?.user?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {new Date(checkIn.checkInTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {checkIn.checkInType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {checkIn.program}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(checkIn.status || 'pending')}
                        </TableCell>
                        <TableCell>
                          {checkIn.verifiedBy ? (
                            <span className="text-sm">
                              {checkIn.verifier?.name || `User #${checkIn.verifiedBy}`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {checkIn.verifiedAt ? (
                            <span className="text-sm">
                              {new Date(checkIn.verifiedAt).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {checkIn.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-Ins</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCheckIns?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Recent records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {recentCheckIns?.filter((ci: any) => ci.status === 'approved').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Verified check-ins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {recentCheckIns?.filter((ci: any) => ci.status === 'pending').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
