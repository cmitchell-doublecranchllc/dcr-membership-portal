import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, AlertTriangle, RefreshCw, CheckCircle, XCircle, User } from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";

export default function MyLessons() {
  const { user, isAuthenticated } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: myLessons = [], isLoading } = trpc.lessons.getMyLessons.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: availableSlots = [] } = trpc.lessons.getAvailableSlots.useQuery(
    { fromTime: Date.now() },
    { enabled: isRescheduleDialogOpen }
  );

  const rescheduleLesson = trpc.lessons.rescheduleLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson rescheduled successfully");
      utils.lessons.getMyLessons.invalidate();
      setIsRescheduleDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reschedule lesson");
    },
  });

  const cancelLesson = trpc.lessons.cancelLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson cancelled");
      utils.lessons.getMyLessons.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel lesson");
    },
  });

  const handleReschedule = (booking: any, slot: any) => {
    setSelectedBooking({ booking, slot });
    setIsRescheduleDialogOpen(true);
  };

  const confirmReschedule = (newSlotId: number) => {
    if (!selectedBooking) return;
    rescheduleLesson.mutate({
      bookingId: selectedBooking.booking.id,
      newSlotId,
    });
  };

  const handleCancel = (bookingId: number, slot: any) => {
    const timeUntil = slot.startTime - Date.now();
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));

    if (hours < 24) {
      toast.error("Cannot cancel lessons within 24 hours of start time");
      return;
    }

    if (confirm("Are you sure you want to cancel this lesson?")) {
      cancelLesson.mutate({ bookingId });
    }
  };

  const canReschedule = (startTime: number) => {
    const timeUntil = startTime - Date.now();
    return timeUntil >= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  };

  const getTimeUntilLesson = (startTime: number) => {
    const timeUntil = startTime - Date.now();
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} away`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} away`;
    } else {
      return "Less than 1 hour";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You need to be logged in to view your lessons.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        <PageHeader 
          title="My Lessons"
          description="View and manage your upcoming riding lessons"
          backLink="/"
          backLabel="Back to Home"
        />

        {/* 24-Hour Rule Notice */}
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Rescheduling Policy:</strong> Lessons can only be rescheduled or cancelled at least 24 hours in advance.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your lessons...</p>
          </div>
        ) : myLessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Lessons</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any lessons scheduled yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact staff to schedule your weekly riding lesson.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myLessons.map(({ booking, slot }) => {
              if (!slot) return null;
              const canRescheduleThis = canReschedule(slot.startTime);
              const timeUntil = getTimeUntilLesson(slot.startTime);

              return (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                              </span>
                            </div>
                            <Badge variant={slot.lessonType === "private" ? "default" : "secondary"}>
                              {slot.lessonType}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {timeUntil}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      {!canRescheduleThis && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Within 24h
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {slot.instructorName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Instructor: {slot.instructorName}</span>
                        </div>
                      )}
                      {slot.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{slot.location}</span>
                        </div>
                      )}
                      {slot.notes && (
                        <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                          {slot.notes}
                        </p>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => handleReschedule(booking, slot)}
                          disabled={!canRescheduleThis || rescheduleLesson.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reschedule
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancel(booking.id, slot)}
                          disabled={!canRescheduleThis || cancelLesson.isPending}
                        >
                          Cancel Lesson
                        </Button>
                      </div>

                      {!canRescheduleThis && (
                        <p className="text-xs text-destructive">
                          This lesson cannot be rescheduled or cancelled (less than 24 hours away)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reschedule Lesson</DialogTitle>
              <DialogDescription>
                Choose a new time slot for your lesson
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Current Lesson:</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedBooking.slot.startTime), "EEEE, MMMM d 'at' h:mm a")}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {availableSlots.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No available slots at this time. Please check back later.
                </p>
              ) : (
                availableSlots.map((slot) => (
                  <Card key={slot.id} className="hover:bg-accent/50 cursor-pointer transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{slot.lessonType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {slot.currentStudents}/{slot.maxStudents} students
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => confirmReschedule(slot.id)}
                          disabled={rescheduleLesson.isPending}
                        >
                          {rescheduleLesson.isPending ? "Rescheduling..." : "Select"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
