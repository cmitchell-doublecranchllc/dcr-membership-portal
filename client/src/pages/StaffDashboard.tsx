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
import { CheckCircle2, Clock, Users, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function StaffDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: todayCheckIns, refetch: refetchCheckIns } = trpc.checkIns.getTodayCheckIns.useQuery(
    undefined,
    { 
      enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    }
  );
  const { data: allMembers } = trpc.members.getAllMembers.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') }
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

  const checkedInToday = todayCheckIns?.length || 0;
  const totalMembers = allMembers?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Staff Dashboard</h1>
              <p className="text-muted-foreground">Real-time check-in status and member management</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetchCheckIns()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Link href="/admin/contracts">
                <Button variant="default">Manage Contracts</Button>
              </Link>
              <Link href="/admin/recurring-events">
                <Button variant="outline">Recurring Events</Button>
              </Link>
              <Link href="/staff/lessons">
                <Button variant="default">Manage Lessons</Button>
              </Link>
              <Link href="/staff/attendance">
                <Button variant="outline">Attendance</Button>
              </Link>
              <Link href="/staff/progress-notes">
                <Button variant="outline">Progress Notes</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-Ins</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{checkedInToday}</div>
              <p className="text-xs text-muted-foreground">
                Members checked in today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Active members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="default" className="bg-green-500">LIVE</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-refreshing every 10s
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Check-Ins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Check-Ins</CardTitle>
            <CardDescription>
              Real-time view of members who have checked in today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayCheckIns && todayCheckIns.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Check-In Time</TableHead>
                      <TableHead>Checked In By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayCheckIns.map((checkIn) => (
                      <TableRow key={checkIn.id}>
                        <TableCell className="font-medium">
                          Member #{checkIn.memberId}
                        </TableCell>
                        <TableCell>
                          {new Date(checkIn.checkInTime).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          User #{checkIn.checkedInBy}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {checkIn.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No check-ins yet today</p>
                <p className="text-sm">Check-ins will appear here in real-time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Directory */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Member Directory</CardTitle>
            <CardDescription>
              All registered members and their membership tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allMembers && allMembers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Membership Tier</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          #{member.id}
                        </TableCell>
                        <TableCell>
                          User #{member.userId}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            member.membershipTier === 'gold' ? 'default' :
                            member.membershipTier === 'silver' ? 'secondary' :
                            'outline'
                          }>
                            {member.membershipTier?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.phone || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(member.user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
