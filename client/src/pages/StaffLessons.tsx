import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, Users, Plus, Trash2, Eye } from "lucide-react";

export default function StaffLessons() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [lessonType, setLessonType] = useState<"private" | "group" | "horsemanship">("private");
  const [maxStudents, setMaxStudents] = useState("1");
  const [instructorName, setInstructorName] = useState("");
  const [location, setLocation] = useState("Main Arena");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: slots = [], isLoading } = trpc.lessons.getAllSlots.useQuery();
  const { data: slotBookings = [] } = trpc.lessons.getBookingsBySlot.useQuery(
    { slotId: selectedSlot! },
    { enabled: !!selectedSlot }
  );
  
  const createSlot = trpc.lessons.createSlot.useMutation({
    onSuccess: () => {
      toast.success("Lesson slot created successfully");
      utils.lessons.getAllSlots.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create lesson slot");
    },
  });

  const deleteSlot = trpc.lessons.deleteSlot.useMutation({
    onSuccess: () => {
      toast.success("Lesson slot deleted");
      utils.lessons.getAllSlots.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete lesson slot");
    },
  });

  const resetForm = () => {
    setSelectedDate("");
    setSelectedTime("");
    setLessonType("private");
    setMaxStudents("1");
    setInstructorName("");
    setLocation("Main Arena");
    setNotes("");
  };

  const handleCreateSlot = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    // Combine date and time
    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    const startTime = dateTime.getTime();
    const endTime = startTime + (60 * 60 * 1000); // 1 hour lesson

    createSlot.mutate({
      startTime,
      endTime,
      lessonType,
      maxStudents: parseInt(maxStudents),
      instructorName: instructorName || undefined,
      location: location || undefined,
      notes: notes || undefined,
    });
  };

  const handleDeleteSlot = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail dialog
    if (confirm("Are you sure you want to delete this lesson slot?")) {
      deleteSlot.mutate({ slotId });
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = format(new Date(slot.startTime), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);

  const sortedDates = Object.keys(slotsByDate).sort();

  const selectedSlotData = slots.find(s => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lesson Slot Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage available lesson time slots</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Lesson Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Lesson Slot</DialogTitle>
                <DialogDescription>
                  Add a new available time slot for students to book
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                <div>
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">All lessons are 60 minutes</p>
                </div>

                <div>
                  <Label htmlFor="lessonType">Lesson Type</Label>
                  <Select value={lessonType} onValueChange={(value: any) => {
                    setLessonType(value);
                    if (value === "private") setMaxStudents("1");
                    else if (value === "horsemanship") setMaxStudents("20");
                    else setMaxStudents("4");
                  }}>
                    <SelectTrigger id="lessonType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (1 student)</SelectItem>
                      <SelectItem value="group">Group (2-4 students)</SelectItem>
                      <SelectItem value="horsemanship">Horsemanship Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    min="1"
                    max="20"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="instructor">Instructor Name (Optional)</Label>
                  <Input
                    id="instructor"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="e.g., Christine Mitchell"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Main Arena"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleCreateSlot} 
                  className="w-full"
                  disabled={createSlot.isPending}
                >
                  {createSlot.isPending ? "Creating..." : "Create Lesson Slot"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading lesson slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Lesson Slots Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first lesson slot to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Slot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <CardDescription>
                    {slotsByDate[date].length} lesson slot{slotsByDate[date].length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {slotsByDate[date]
                      .sort((a, b) => a.startTime - b.startTime)
                      .map((slot) => (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {slot.currentStudents}/{slot.maxStudents} students
                                </span>
                              </div>
                              <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">
                                {slot.lessonType}
                              </span>
                            </div>
                            {slot.instructorName && (
                              <p className="text-sm text-muted-foreground">
                                Instructor: {slot.instructorName}
                              </p>
                            )}
                            {slot.location && (
                              <p className="text-sm text-muted-foreground">
                                Location: {slot.location}
                              </p>
                            )}
                            {slot.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {slot.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSlot(slot.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteSlot(slot.id, e)}
                              disabled={deleteSlot.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Slot Detail Dialog */}
        <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lesson Slot Details</DialogTitle>
              <DialogDescription>
                View bookings and manage this lesson slot
              </DialogDescription>
            </DialogHeader>
            
            {selectedSlotData && (
              <div className="space-y-6">
                {/* Slot Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-accent/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {format(new Date(selectedSlotData.startTime), "EEEE, MMM d, yyyy")}
                    </p>
                    <p className="text-sm">
                      {format(new Date(selectedSlotData.startTime), "h:mm a")} - {format(new Date(selectedSlotData.endTime), "h:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lesson Type</p>
                    <p className="font-medium capitalize">{selectedSlotData.lessonType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-medium">
                      {selectedSlotData.currentStudents}/{selectedSlotData.maxStudents} students
                    </p>
                  </div>
                  {selectedSlotData.instructorName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Instructor</p>
                      <p className="font-medium">{selectedSlotData.instructorName}</p>
                    </div>
                  )}
                  {selectedSlotData.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedSlotData.location}</p>
                    </div>
                  )}
                </div>

                {/* Bookings */}
                <div>
                  <h3 className="font-semibold mb-3">Booked Students</h3>
                  {slotBookings.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {slotBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{booking.member?.user?.name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.member?.user?.email}
                            </p>
                          </div>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
