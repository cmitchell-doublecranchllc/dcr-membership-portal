import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, User, Users } from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse: (str: string) => new Date(str),
  startOfWeek: () => startOfWeek(new Date()),
  getDay,
  locales,
});

export default function BrowseLessons() {
  const { user, isAuthenticated } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<View>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const utils = trpc.useUtils();
  
  // Get available lesson slots starting from now
  const { data: availableSlots = [], isLoading } = trpc.lessons.getAvailableSlots.useQuery(
    { fromTime: Date.now() },
    { enabled: isAuthenticated }
  );

  const bookLesson = trpc.lessons.bookLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson booked successfully!");
      utils.lessons.getAvailableSlots.invalidate();
      utils.lessons.getMyLessons.invalidate();
      setIsBookingDialogOpen(false);
      setSelectedSlot(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to book lesson");
    },
  });

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot);
    setIsBookingDialogOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedSlot) return;
    bookLesson.mutate({ slotId: selectedSlot.id });
  };

  // Transform slots into calendar events
  const calendarEvents = availableSlots.map((slot: any) => ({
    id: slot.id,
    title: `${slot.lessonType} Lesson`,
    start: new Date(slot.startTime),
    end: new Date(slot.endTime),
    resource: slot,
  }));

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case 'private':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'group':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'horsemanship':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'private':
        return <User className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You need to be logged in to browse and book lessons.
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
          title="Browse Available Lessons"
          description="View and book available riding lesson slots"
          backLink="/my-lessons"
          backLabel="Back to My Lessons"
        />

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading available lessons...</p>
          </div>
        ) : availableSlots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Available Lessons</h3>
              <p className="text-muted-foreground mb-4">
                There are no lesson slots available for booking at this time.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check back later or contact staff for more information.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Lesson Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Private Lesson</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Group Lesson</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm">Horsemanship</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
              <CardContent className="p-6">
                <div style={{ height: '600px' }}>
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    view={calendarView}
                    onView={setCalendarView}
                    date={currentDate}
                    onNavigate={setCurrentDate}
                    onSelectEvent={(event) => handleSelectSlot(event.resource)}
                    eventPropGetter={(event) => {
                      const lessonType = event.resource.lessonType;
                      let backgroundColor = '#3b82f6'; // blue for private
                      if (lessonType === 'group') backgroundColor = '#22c55e'; // green
                      if (lessonType === 'horsemanship') backgroundColor = '#a855f7'; // purple
                      
                      return {
                        style: {
                          backgroundColor,
                          borderRadius: '4px',
                          opacity: 0.9,
                          color: 'white',
                          border: 'none',
                          display: 'block',
                        },
                      };
                    }}
                    style={{ height: '100%' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* List View */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Available Slots</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableSlots.map((slot: any) => {
                  const spotsLeft = slot.maxStudents - slot.currentStudents;
                  const isFull = spotsLeft <= 0;

                  return (
                    <Card key={slot.id} className={`hover:shadow-lg transition-shadow ${isFull ? 'opacity-60' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge className={getLessonTypeColor(slot.lessonType)}>
                            <span className="flex items-center gap-1">
                              {getLessonTypeIcon(slot.lessonType)}
                              {slot.lessonType}
                            </span>
                          </Badge>
                          {isFull && <Badge variant="destructive">Full</Badge>}
                        </div>
                        <CardTitle className="text-lg capitalize">
                          {slot.lessonType} Lesson
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(slot.startTime), 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                          </span>
                        </div>
                        {slot.instructorName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{slot.instructorName}</span>
                          </div>
                        )}
                        {slot.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{slot.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} available
                          </span>
                        </div>
                        {slot.notes && (
                          <p className="text-sm text-muted-foreground">{slot.notes}</p>
                        )}
                        <Button 
                          className="w-full" 
                          onClick={() => handleSelectSlot(slot)}
                          disabled={isFull}
                        >
                          {isFull ? 'Fully Booked' : 'Book This Lesson'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Confirmation Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lesson Booking</DialogTitle>
            <DialogDescription>
              Please review the lesson details before confirming your booking.
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lesson Type:</span>
                  <Badge className={getLessonTypeColor(selectedSlot.lessonType)}>
                    {selectedSlot.lessonType}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{format(new Date(selectedSlot.startTime), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time:</span>
                  <span className="text-sm">
                    {format(new Date(selectedSlot.startTime), 'h:mm a')} - {format(new Date(selectedSlot.endTime), 'h:mm a')}
                  </span>
                </div>
                {selectedSlot.instructorName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Instructor:</span>
                    <span className="text-sm">{selectedSlot.instructorName}</span>
                  </div>
                )}
                {selectedSlot.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm">{selectedSlot.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBooking} disabled={bookLesson.isPending}>
              {bookLesson.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
