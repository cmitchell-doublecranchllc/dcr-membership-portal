import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Users, Trash2, Eye, Edit, Copy } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

export default function StaffLessons() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [lessonType, setLessonType] = useState<"private" | "group" | "horsemanship">("private");
  const [maxStudents, setMaxStudents] = useState(1);
  const [instructorName, setInstructorName] = useState("");
  const [location, setLocation] = useState("Main Arena");
  const [notes, setNotes] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: slots = [] } = trpc.lessons.getAllSlots.useQuery();
  const createSlot = trpc.lessons.createSlot.useMutation({
    onSuccess: () => {
      utils.lessons.getAllSlots.invalidate();
      toast.success("Lesson slot created successfully");
      resetForm();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create lesson slot");
    },
  });

  const updateSlot = trpc.lessons.updateSlot.useMutation({
    onSuccess: () => {
      utils.lessons.getAllSlots.invalidate();
      toast.success("Lesson slot updated successfully");
      setEditDialogOpen(false);
      setSelectedSlot(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lesson slot");
    },
  });

  const deleteSlot = trpc.lessons.deleteSlot.useMutation({
    onSuccess: () => {
      utils.lessons.getAllSlots.invalidate();
      toast.success("Lesson slot deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete lesson slot");
    },
  });

  const { data: bookings = [] } = trpc.lessons.getBookingsBySlot.useQuery(
    { slotId: selectedSlot?.id || 0 },
    { enabled: !!selectedSlot && viewDialogOpen }
  );

  const resetForm = () => {
    setSelectedDate("");
    setSelectedTime("");
    setLessonType("private");
    setMaxStudents(1);
    setInstructorName("");
    setLocation("Main Arena");
    setNotes("");
  };

  const handleCreateSlot = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    // Combine date and time in local timezone
    // Parse as local time by splitting and using Date constructor
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(year, month - 1, day, hours, minutes);
    const startTime = dateTime.getTime();
    const endTime = startTime + (60 * 60 * 1000); // 1 hour lesson

    createSlot.mutate({
      startTime,
      endTime,
      lessonType,
      maxStudents,
      instructorName: instructorName || null,
      location: location || null,
      notes: notes || null,
    });
  };

  const handleEditSlot = () => {
    if (!selectedSlot || !selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(year, month - 1, day, hours, minutes);
    const startTime = dateTime.getTime();
    const endTime = startTime + (60 * 60 * 1000);

    updateSlot.mutate({
      slotId: selectedSlot.id,
      startTime,
      endTime,
      lessonType,
      maxStudents,
      instructorName: instructorName || undefined,
      location: location || undefined,
      notes: notes || undefined,
    });
  };

  const openEditDialog = (slot: any) => {
    setSelectedSlot(slot);
    const startDate = new Date(slot.startTime);
    setSelectedDate(startDate.toISOString().split('T')[0]);
    setSelectedTime(startDate.toTimeString().slice(0, 5));
    setLessonType(slot.lessonType);
    setMaxStudents(slot.maxStudents);
    setInstructorName(slot.instructorName || "");
    setLocation(slot.location || "Main Arena");
    setNotes(slot.notes || "");
    setEditDialogOpen(true);
  };

  const openDuplicateDialog = (slot: any) => {
    const startDate = new Date(slot.startTime);
    setSelectedDate(startDate.toISOString().split('T')[0]);
    setSelectedTime(startDate.toTimeString().slice(0, 5));
    setLessonType(slot.lessonType);
    setMaxStudents(slot.maxStudents);
    setInstructorName(slot.instructorName || "");
    setLocation(slot.location || "Main Arena");
    setNotes(slot.notes || "");
    setCreateDialogOpen(true);
  };

  const openViewDialog = (slot: any) => {
    setSelectedSlot(slot);
    setViewDialogOpen(true);
  };

  const handleDeleteSlot = (slotId: number) => {
    if (confirm("Are you sure you want to delete this lesson slot?")) {
      deleteSlot.mutate({ id: slotId });
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc: Record<string, any[]>, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  return (
    <div className="container py-8">
      <PageHeader 
        title="Lesson Slot Management"
        description="Create and manage available lesson time slots"
        backLink="/staff"
        backLabel="Back to Dashboard"
        action={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-red-900 hover:bg-red-800">
              + Create Lesson Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lesson Slot</DialogTitle>
              <DialogDescription>Set up a new available lesson time slot</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonType">Lesson Type</Label>
                  <Select value={lessonType} onValueChange={(value: any) => setLessonType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="horsemanship">Horsemanship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    min="1"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor Name (Optional)</Label>
                <Input
                  id="instructor"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Leave blank if not assigned"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Main Arena, Round Pen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Introductory or reschedule slot"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSlot} disabled={createSlot.isPending}>
                {createSlot.isPending ? "Creating..." : "Create Slot"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson Slot</DialogTitle>
            <DialogDescription>Update lesson slot details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Start Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lessonType">Lesson Type</Label>
                <Select value={lessonType} onValueChange={(value: any) => setLessonType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="horsemanship">Horsemanship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxStudents">Max Students</Label>
                <Input
                  id="edit-maxStudents"
                  type="number"
                  min="1"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instructor">Instructor Name (Optional)</Label>
              <Input
                id="edit-instructor"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Leave blank if not assigned"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Main Arena, Round Pen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Introductory or reschedule slot"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSlot} disabled={updateSlot.isPending}>
              {updateSlot.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lesson Slot Details</DialogTitle>
            <DialogDescription>View bookings and slot information</DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at {new Date(selectedSlot.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(selectedSlot.endTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lesson Type</p>
                  <p className="font-medium capitalize">{selectedSlot.lessonType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">
                    {selectedSlot.currentStudents}/{selectedSlot.maxStudents} students
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedSlot.location || "Not specified"}</p>
                </div>
              </div>
              {selectedSlot.instructorName && (
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">{selectedSlot.instructorName}</p>
                </div>
              )}
              {selectedSlot.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{selectedSlot.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Booked Students</p>
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No bookings yet</p>
                ) : (
                  <div className="space-y-2">
                    {bookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{booking.user?.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{booking.user?.email}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {Object.keys(slotsByDate).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No lesson slots created yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Create Lesson Slot" to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {date}
                </CardTitle>
                <CardDescription>{dateSlots.length} lesson slot{dateSlots.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dateSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => openViewDialog(slot)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(slot.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(slot.endTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {slot.currentStudents}/{slot.maxStudents} students
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            slot.lessonType === "private"
                              ? "bg-pink-100 text-pink-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {slot.lessonType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>Location: {slot.location || "Not specified"}</span>
                      </div>
                      {slot.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{slot.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openViewDialog(slot);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(slot);
                        }}
                        title="Edit Slot"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDuplicateDialog(slot);
                        }}
                        title="Duplicate Slot"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlot(slot.id);
                        }}
                        className="text-destructive hover:text-destructive"
                        title="Delete Slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
