import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookLesson() {
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Lesson</CardTitle>
          <CardDescription>
            Schedule or reschedule your riding lesson using our calendar below.
            Select an available time slot that works for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ minHeight: '700px' }}>
            <iframe
              src="https://doublecranch.as.me/groupridinglesson"
              width="100%"
              height="700"
              frameBorder="0"
              title="Schedule a Lesson"
              style={{ border: 'none' }}
            />
          </div>
          
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">Booking Information</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• All lessons are 60 minutes long</li>
              <li>• Please arrive 10 minutes early for tacking up</li>
              <li>• Cancellations must be made at least 24 hours in advance</li>
              <li>• You will receive email confirmation and reminders</li>
              <li>• SMS reminders are sent 30 minutes before your lesson</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
