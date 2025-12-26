import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminEvents() {
  const { user, isAuthenticated } = useAuth();
  const { data: events, refetch: refetchEvents } = trpc.events.getAllEvents.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') }
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"competition" | "show" | "clinic" | "social" | "other">("other");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [requiresRsvp, setRequiresRsvp] = useState(true);
  const [publishNow, setPublishNow] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createEventMutation = trpc.events.createEvent.useMutation();

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

  const handleCreateEvent = async () => {
    if (!title.trim() || !startDate || !startTime || !endDate || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
    const endDateTime = new Date(`${endDate}T${endTime}`).getTime();

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    setIsCreating(true);
    try {
      await createEventMutation.mutateAsync({
        title,
        description,
        eventType,
        location,
        startTime: startDateTime,
        endTime: endDateTime,
        capacity: capacity ? parseInt(capacity) : undefined,
        requiresRsvp,
        publish: publishNow,
      });

      toast.success(publishNow ? "Event created and published!" : "Event created as draft");
      setIsCreateDialogOpen(false);
      resetForm();
      await refetchEvents();
    } catch (error) {
      toast.error("Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventType("other");
    setLocation("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setCapacity("");
    setRequiresRsvp(true);
    setPublishNow(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/staff">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Event Management</h1>
              <p className="text-muted-foreground">Create and manage events and competitions</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Add a new event or competition for members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Summer Show 2024"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Event details and information..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type *</Label>
                      <Select value={eventType} onValueChange={(v: any) => setEventType(v)}>
                        <SelectTrigger id="eventType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="competition">Competition</SelectItem>
                          <SelectItem value="show">Show</SelectItem>
                          <SelectItem value="clinic">Clinic</SelectItem>
                          <SelectItem value="social">Social Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Event venue"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (Optional)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      placeholder="Leave empty for unlimited"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of attendees (including guests)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresRsvp"
                      checked={requiresRsvp}
                      onCheckedChange={(checked) => setRequiresRsvp(checked as boolean)}
                    />
                    <label htmlFor="requiresRsvp" className="text-sm cursor-pointer">
                      Requires RSVP
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="publish"
                      checked={publishNow}
                      onCheckedChange={(checked) => setPublishNow(checked as boolean)}
                    />
                    <label htmlFor="publish" className="text-sm cursor-pointer">
                      Publish immediately
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent} disabled={isCreating}>
                      {isCreating ? "Creating..." : publishNow ? "Create & Publish" : "Create Draft"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
            <CardDescription>
              Manage published and draft events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {events && events.length > 0 ? (
              events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events created yet</p>
                <p className="text-sm">Create your first event to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: any }) {
  const startDate = new Date(event.startTime);
  const isPast = event.startTime < Date.now();

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">{event.title}</h3>
          {event.isPublished ? (
            <Badge variant="default" className="bg-green-600">Published</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
          {isPast && <Badge variant="outline">Past</Badge>}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{startDate.toLocaleDateString()}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {event.eventType}
          </Badge>
          {event.capacity && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Capacity: {event.capacity}</span>
            </div>
          )}
        </div>
        {event.location && (
          <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
        )}
      </div>
      <Link href={`/events/${event.id}`}>
        <Button variant="outline">View Details</Button>
      </Link>
    </div>
  );
}
