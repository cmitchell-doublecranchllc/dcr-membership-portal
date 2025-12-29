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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
export default function StaffAttendance() {
  const { user, isAuthenticated } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "late">("present");
  const [attendanceNotes, setAttendanceNotes] = useState("");

  const { data: allSlots, refetch } = trpc.lessons.getAllSlots.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') }
  );

  const markAttendanceMutation = trpc.lessons.markAttendance.useMutation({
    onSuccess: () => {
      alert("Attendance marked successfully!");
      setSelectedBooking(null);
      setAttendanceNotes("");
      setAttendanceStatus("present");
      refetch();
    },
    onError: (error) => {
      alert("Error marking attendance: " + error.message);
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

  // Filter past lessons that need attendance marking
  const now = Date.now();
  const pastLessons = allSlots?.filter(slot => slot.endTime < now && slot.currentStudents > 0) || [];

  const handleMarkAttendance = () => {
    if (!selectedBooking) return;

    markAttendanceMutation.mutate({
      bookingId: selectedBooking.id,
      attendanceStatus,
      notes: attendanceNotes || undefined,
    });
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Present</Badge>;
      case "absent":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Absent</Badge>;
      case "late":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Late</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Lesson Attendance</h1>
              <p className="text-muted-foreground">Mark attendance for completed lessons</p>
            </div>
            <div className="flex gap-2">
              <Link href="/staff">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Past Lessons Needing Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lessons</CardTitle>
            <CardDescription>
              Mark attendance for lessons that have already occurred
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastLessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No recent lessons requiring attendance</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pastLessons.map((slot) => (
                  <div key={slot.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {slot.lessonType.charAt(0).toUpperCase() + slot.lessonType.slice(1)} Lesson
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(slot.startTime).toLocaleString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        {slot.instructorName && (
                          <p className="text-sm text-muted-foreground">
                            Instructor: {slot.instructorName}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {slot.currentStudents} student{slot.currentStudents !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Show bookings for this slot */}
                    <LessonBookings
                      slotId={slot.id}
                      onMarkAttendance={(booking) => {
                        setSelectedBooking(booking);
                        setAttendanceStatus(booking.attendanceStatus === "pending" ? "present" : booking.attendanceStatus);
                      }}
                      getAttendanceBadge={getAttendanceBadge}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mark Attendance Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>
                Record attendance for {selectedBooking?.user?.name || "this student"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Attendance Status</Label>
                <Select value={attendanceStatus} onValueChange={(value: any) => setAttendanceStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this lesson..."
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAttendance} disabled={markAttendanceMutation.isPending}>
                {markAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Component to fetch and display bookings for a slot
function LessonBookings({ 
  slotId, 
  onMarkAttendance, 
  getAttendanceBadge 
}: { 
  slotId: number; 
  onMarkAttendance: (booking: any) => void;
  getAttendanceBadge: (status: string) => React.ReactNode;
}) {
  const { data: bookings } = trpc.lessons.getSlotBookings.useQuery({ slotId });

  if (!bookings || bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No students booked</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">
              {booking.user?.name || "Unknown Student"}
            </TableCell>
            <TableCell>
              {getAttendanceBadge(booking.attendanceStatus)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkAttendance(booking)}
              >
                {booking.attendanceStatus === "pending" ? "Mark" : "Update"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
