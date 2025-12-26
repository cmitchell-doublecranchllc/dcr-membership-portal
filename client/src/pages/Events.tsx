import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Trophy, Star, GraduationCap, PartyPopper } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Events() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: upcomingEvents } = trpc.events.getUpcomingEvents.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: myRsvps } = trpc.events.getMyRsvps.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card>
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be logged in to view events</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const myRsvpEventIds = new Set(myRsvps?.map(r => r.eventId) || []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-6xl">
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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Events & Competitions</h1>
              <p className="text-muted-foreground">
                Upcoming shows, clinics, and club activities
              </p>
            </div>
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <Link href="/admin/events">
                <Button>Manage Events</Button>
              </Link>
            )}
          </div>
        </div>

        {/* My RSVPs Summary */}
        {myRsvps && myRsvps.length > 0 && (
          <Card className="mb-8 border-2 border-accent/50 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg">My RSVPs</CardTitle>
              <CardDescription>
                You're registered for {myRsvps.filter(r => r.status === 'attending').length} upcoming events
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Events Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents && upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                hasRsvp={myRsvpEventIds.has(event.id)}
                onClick={() => setLocation(`/events/${event.id}`)}
              />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming events scheduled</p>
                {(user?.role === 'admin' || user?.role === 'staff') && (
                  <p className="text-sm mt-2">Create your first event to get started</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, hasRsvp, onClick }: { event: any; hasRsvp: boolean; onClick: () => void }) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'competition':
        return <Trophy className="h-5 w-5" />;
      case 'show':
        return <Star className="h-5 w-5" />;
      case 'clinic':
        return <GraduationCap className="h-5 w-5" />;
      case 'social':
        return <PartyPopper className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'competition':
        return 'bg-yellow-600';
      case 'show':
        return 'bg-purple-600';
      case 'clinic':
        return 'bg-blue-600';
      case 'social':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] relative overflow-hidden"
      onClick={onClick}
    >
      {event.imageUrl && (
        <div className="h-40 overflow-hidden bg-muted">
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={getEventTypeColor(event.eventType)}>
            <span className="mr-1">{getEventIcon(event.eventType)}</span>
            {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
          </Badge>
          {hasRsvp && (
            <Badge variant="default" className="bg-green-600">
              RSVP'd
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl line-clamp-2">{event.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{formatDate(startDate)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{formatTime(startDate)} - {formatTime(endDate)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          
          {event.capacity && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>Capacity: {event.capacity}</span>
            </div>
          )}
        </div>
        
        <Button className="w-full mt-4" variant={hasRsvp ? "outline" : "default"}>
          {hasRsvp ? "View Details" : "RSVP Now"}
        </Button>
      </CardContent>
    </Card>
  );
}
