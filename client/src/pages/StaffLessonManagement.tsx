import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { format, addWeeks, startOfWeek, addDays } from 'date-fns';

export default function StaffLessonManagement() {

  const utils = trpc.useUtils();

  // Recurring lesson form state
  const [lessonType, setLessonType] = useState<'private' | 'group' | 'horsemanship'>('private');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // Monday
  const [startTime, setStartTime] = useState('14:00');
  const [duration, setDuration] = useState('60');
  const [weeks, setWeeks] = useState('12');
  const [maxStudents, setMaxStudents] = useState('1');
  const [instructorName, setInstructorName] = useState('');
  const [location, setLocation] = useState('Main Arena');

  const createRecurringSlots = trpc.lessons.createRecurringSlots.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success!',
        description: `Created ${data.count} lesson slots`,
      });
      utils.lessons.getAvailableSlots.invalidate();
      // Reset form
      setWeeks('12');
      setInstructorName('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateRecurring = () => {
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from next Monday
    const targetDay = parseInt(dayOfWeek);
    const firstSlotDate = addDays(startDate, targetDay - 1);

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(firstSlotDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    // If the first slot is in the past, start from next week
    if (startDateTime < new Date()) {
      startDateTime.setDate(startDateTime.getDate() + 7);
    }

    createRecurringSlots.mutate({
      lessonType,
      startDateTime: startDateTime.getTime(),
      durationMinutes: parseInt(duration),
      weekCount: parseInt(weeks),
      maxStudents: parseInt(maxStudents),
      instructorName: instructorName || null,
      location: location || null,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lesson Slot Management</h1>
        <p className="text-muted-foreground">Create and manage lesson slots for students to book</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recurring Lesson Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create Recurring Lesson Slots
            </CardTitle>
            <CardDescription>
              Quickly create multiple lesson slots with a weekly pattern
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lessonType">Lesson Type</Label>
              <Select value={lessonType} onValueChange={(v: any) => setLessonType(v)}>
                <SelectTrigger id="lessonType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private Lesson</SelectItem>
                  <SelectItem value="group">Group Lesson</SelectItem>
                  <SelectItem value="horsemanship">Horsemanship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
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
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeks">Number of Weeks</Label>
                <Input
                  id="weeks"
                  type="number"
                  min="1"
                  max="52"
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input
                id="maxStudents"
                type="number"
                min="1"
                max="10"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructorName">Instructor Name (Optional)</Label>
              <Input
                id="instructorName"
                placeholder="e.g., Christine Mitchell"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Main Arena, Round Pen"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <p className="text-sm text-muted-foreground">
                  {weeks} {lessonType} lesson slots will be created
                  <br />
                  Every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(dayOfWeek)]} at {startTime}
                  <br />
                  Duration: {duration} minutes
                  <br />
                  Max students per slot: {maxStudents}
                </p>
              </div>

              <Button
                onClick={handleCreateRecurring}
                disabled={createRecurringSlots.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createRecurringSlots.isPending ? 'Creating...' : `Create ${weeks} Lesson Slots`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Recurring Slots</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Use this to create your weekly lesson schedule. For example, "Every Monday 2-3pm for 12 weeks" creates 12 slots automatically.
                </p>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="font-medium text-green-900 dark:text-green-100 mb-1">Lesson Types</p>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Private:</strong> One-on-one instruction<br />
                  <strong>Group:</strong> Multiple students together<br />
                  <strong>Horsemanship:</strong> Ground work and horse care
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Best Practices</p>
                <p className="text-amber-700 dark:text-amber-300">
                  • Create slots at least 1 week in advance<br />
                  • Leave buffer time between lessons<br />
                  • Set realistic max students for group lessons<br />
                  • Add instructor names for clarity
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">Calendar Integration</p>
                <p className="text-purple-700 dark:text-purple-300">
                  When students book lessons, you'll receive an email with a calendar file (.ics) that you can click to add to your Google Calendar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
