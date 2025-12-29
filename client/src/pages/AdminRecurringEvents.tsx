import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Repeat, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminRecurringEvents() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: series, refetch } = trpc.recurringEvents.getAllSeries.useQuery();
  const createSeries = trpc.recurringEvents.createSeries.useMutation();
  const deleteSeries = trpc.recurringEvents.deleteSeries.useMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "clinic" as "competition" | "show" | "clinic" | "social" | "riding_lesson" | "horsemanship_lesson" | "other",
    location: "",
    capacity: "",
    requiresRsvp: true,
    recurrencePattern: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
    daysOfWeek: "",
    startTimeOfDay: "09:00:00",
    durationMinutes: "60",
    seriesStartDate: "",
    seriesEndDate: "",
    maxOccurrences: "",
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.startTimeOfDay || !formData.seriesStartDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const startDate = new Date(formData.seriesStartDate);
      const endDate = formData.seriesEndDate ? new Date(formData.seriesEndDate) : undefined;

      const result = await createSeries.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        eventType: formData.eventType,
        location: formData.location || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        requiresRsvp: formData.requiresRsvp,
        recurrencePattern: formData.recurrencePattern,
        daysOfWeek: formData.daysOfWeek || undefined,
        startTimeOfDay: formData.startTimeOfDay,
        durationMinutes: parseInt(formData.durationMinutes),
        seriesStartDate: startDate.getTime(),
        seriesEndDate: endDate?.getTime(),
        maxOccurrences: formData.maxOccurrences ? parseInt(formData.maxOccurrences) : undefined,
      });

      toast.success(`Series created! Generated ${result.eventsGenerated} events.`);
      setIsCreateOpen(false);
      refetch();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        eventType: "clinic",
        location: "",
        capacity: "",
        requiresRsvp: true,
        recurrencePattern: "weekly",
        daysOfWeek: "",
        startTimeOfDay: "09:00:00",
        durationMinutes: "60",
        seriesStartDate: "",
        seriesEndDate: "",
        maxOccurrences: "",
      });
    } catch (error) {
      toast.error("Failed to create recurring series");
      console.error(error);
    }
  };

  const handleDelete = async (seriesId: number, title: string) => {
    if (!confirm(`Delete recurring series "${title}" and all its events?`)) {
      return;
    }

    try {
      await deleteSeries.mutateAsync({ seriesId });
      toast.success("Series deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete series");
      console.error(error);
    }
  };

  const getPatternLabel = (pattern: string, daysOfWeek?: string | null) => {
    switch (pattern) {
      case "daily":
        return "Daily";
      case "weekly":
        return `Weekly${daysOfWeek ? ` (${getDaysLabel(daysOfWeek)})` : ""}`;
      case "biweekly":
        return `Bi-weekly${daysOfWeek ? ` (${getDaysLabel(daysOfWeek)})` : ""}`;
      case "monthly":
        return "Monthly";
      default:
        return pattern;
    }
  };

  const getDaysLabel = (daysStr: string) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = daysStr.split(",").map(d => dayNames[parseInt(d)]);
    return days.join(", ");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/staff">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Recurring Events</h1>
            <p className="text-muted-foreground mt-1">
              Manage recurring lessons and clinics
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Repeat className="mr-2 h-4 w-4" />
                Create Recurring Series
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Recurring Event Series</DialogTitle>
                <DialogDescription>
                  Set up a recurring pattern for weekly lessons or monthly clinics
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Weekly Riding Lessons"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description of the recurring event..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(value: any) => setFormData({ ...formData, eventType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="show">Show</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="riding_lesson">Riding Lesson</SelectItem>
                        <SelectItem value="horsemanship_lesson">Horsemanship Lesson</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Arena 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capacity (optional)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
                    <Input
                      id="durationMinutes"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recurrencePattern">Recurrence Pattern *</Label>
                  <Select
                    value={formData.recurrencePattern}
                    onValueChange={(value: any) => setFormData({ ...formData, recurrencePattern: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.recurrencePattern === "weekly" || formData.recurrencePattern === "biweekly") && (
                  <div>
                    <Label htmlFor="daysOfWeek">Days of Week (comma-separated) *</Label>
                    <Input
                      id="daysOfWeek"
                      value={formData.daysOfWeek}
                      onChange={(e) => setFormData({ ...formData, daysOfWeek: e.target.value })}
                      placeholder="1,3,5 (Mon, Wed, Fri) - 0=Sun, 1=Mon, 2=Tue, etc."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="startTimeOfDay">Start Time *</Label>
                  <Input
                    id="startTimeOfDay"
                    type="time"
                    step="60"
                    value={formData.startTimeOfDay.substring(0, 5)}
                    onChange={(e) => setFormData({ ...formData, startTimeOfDay: e.target.value + ":00" })}
                  />
                </div>

                <div>
                  <Label htmlFor="seriesStartDate">Series Start Date *</Label>
                  <Input
                    id="seriesStartDate"
                    type="date"
                    value={formData.seriesStartDate}
                    onChange={(e) => setFormData({ ...formData, seriesStartDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="seriesEndDate">Series End Date (optional)</Label>
                  <Input
                    id="seriesEndDate"
                    type="date"
                    value={formData.seriesEndDate}
                    onChange={(e) => setFormData({ ...formData, seriesEndDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="maxOccurrences">Max Occurrences (optional)</Label>
                  <Input
                    id="maxOccurrences"
                    type="number"
                    value={formData.maxOccurrences}
                    onChange={(e) => setFormData({ ...formData, maxOccurrences: e.target.value })}
                    placeholder="Leave empty for ongoing series"
                  />
                </div>

                <Button onClick={handleCreate} className="w-full" disabled={createSeries.isPending}>
                  {createSeries.isPending ? "Creating..." : "Create Series"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {series && series.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recurring event series yet. Create one to get started!
              </CardContent>
            </Card>
          )}

          {series?.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{s.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {s.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id, s.title)}
                    disabled={deleteSeries.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span>{getPatternLabel(s.recurrencePattern, s.daysOfWeek)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{s.startTimeOfDay.substring(0, 5)} ({s.durationMinutes}min)</span>
                  </div>
                  {s.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{s.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(s.seriesStartDate), "MMM d, yyyy")}
                      {s.seriesEndDate && ` - ${format(new Date(s.seriesEndDate), "MMM d, yyyy")}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
