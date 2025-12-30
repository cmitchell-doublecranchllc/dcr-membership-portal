import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Schedule() {
  const { user, isAuthenticated } = useAuth();
  const { data: member } = trpc.members.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: upcomingAppointments } = trpc.appointments.getMyAppointments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: allAppointments } = trpc.appointments.getAllMyAppointments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card>
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be logged in to view your schedule</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const now = Date.now();
  const pastAppointments = allAppointments?.filter(apt => apt.startTime < now) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">My Schedule</h1>
              <p className="text-muted-foreground">View your upcoming riding lessons and appointments</p>
            </div>
            <Button variant="outline" asChild>
              <a href="https://doublecrancch.as.me/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Book on Acuity
              </a>
            </Button>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Lessons
            </CardTitle>
            <CardDescription>
              Your scheduled riding lessons and appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No upcoming lessons scheduled</p>
                <p className="text-sm">Book your next lesson through Acuity Scheduling</p>
                <Button variant="outline" className="mt-4" asChild>
                  <a href="https://doublecrancch.as.me/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Book Now
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Lessons</CardTitle>
              <CardDescription>
                Your lesson history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastAppointments.slice(0, 10).map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} past />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Integration Notice */}
        <Card className="mt-8 border-2 border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg">Acuity Scheduling Integration</CardTitle>
            <CardDescription>
              This portal displays your lesson schedule. To book, reschedule, or cancel lessons, please use Acuity Scheduling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✓ View your upcoming lessons here</p>
              <p>✓ Check-in for lessons using the home page</p>
              <p>✓ Book and manage appointments through Acuity</p>
              <p className="text-muted-foreground mt-4">
                <strong>Note:</strong> Automatic sync with Acuity will be available in a future update. 
                Currently, appointments are managed by staff.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, past = false }: { appointment: any; past?: boolean }) {
  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'scheduled':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-600';
      case 'completed':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className={`flex items-start gap-4 p-4 border rounded-lg ${past ? 'opacity-60' : 'hover:bg-muted/50'} transition-colors`}>
      <div className="flex-shrink-0 text-center">
        <div className="bg-primary text-primary-foreground rounded-lg p-3 min-w-[70px]">
          <div className="text-2xl font-bold">{startDate.getDate()}</div>
          <div className="text-xs uppercase">
            {startDate.toLocaleDateString('en-US', { month: 'short' })}
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-lg">{appointment.appointmentType || 'Riding Lesson'}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(startDate)}</p>
          </div>
          {appointment.status && (
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="h-4 w-4" />
          <span>{formatTime(startDate)} - {formatTime(endDate)}</span>
          <span className="text-xs">
            ({Math.round((appointment.endTime - appointment.startTime) / (1000 * 60))} min)
          </span>
        </div>

        {appointment.notes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {appointment.notes}
          </p>
        )}
      </div>
    </div>
  );
}
