import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Trophy, Star, GraduationCap, PartyPopper, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function EventDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const eventId = parseInt(id || "0");
  
  const { user, isAuthenticated } = useAuth();
  const { data: event } = trpc.events.getEvent.useQuery(
    { eventId },
    { enabled: isAuthenticated && eventId > 0 }
  );
  const { data: myRsvp, refetch: refetchRsvp } = trpc.events.getMyRsvpForEvent.useQuery(
    { eventId },
    { enabled: isAuthenticated && eventId > 0 }
  );
  const { data: attendeeCount } = trpc.events.getEventAttendeeCount.useQuery(
    { eventId },
    { enabled: isAuthenticated && eventId > 0 }
  );

  const [isRsvpDialogOpen, setIsRsvpDialogOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<"attending" | "not_attending" | "maybe">("attending");
  const [guestCount, setGuestCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rsvpMutation = trpc.events.rsvpToEvent.useMutation();
  const cancelRsvpMutation = trpc.events.cancelRsvp.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card>
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be logged in to view event details</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card>
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
            <CardDescription>This event may have been removed or doesn't exist</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/events">
              <Button>Back to Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRsvp = () => {
    if (myRsvp) {
      // Edit existing RSVP
      setRsvpStatus(myRsvp.status as any);
      setGuestCount(myRsvp.guestCount || 0);
      setNotes(myRsvp.notes || "");
    } else {
      // New RSVP
      setRsvpStatus("attending");
      setGuestCount(0);
      setNotes("");
    }
    setIsRsvpDialogOpen(true);
  };

  const handleSubmitRsvp = async () => {
    setIsSubmitting(true);
    try {
      const result = await rsvpMutation.mutateAsync({
        eventId,
        status: rsvpStatus,
        guestCount,
        notes,
      });

      if (result.waitlisted) {
        toast.success("Added to waitlist", {
          description: "The event is at capacity. You've been added to the waitlist.",
        });
      } else {
        toast.success("RSVP submitted successfully!");
      }

      setIsRsvpDialogOpen(false);
      await refetchRsvp();
    } catch (error) {
      toast.error("Failed to submit RSVP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!confirm("Are you sure you want to cancel your RSVP?")) return;

    try {
      await cancelRsvpMutation.mutateAsync({ eventId });
      toast.success("RSVP cancelled");
      await refetchRsvp();
    } catch (error) {
      toast.error("Failed to cancel RSVP");
    }
  };

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'competition':
        return <Trophy className="h-6 w-6" />;
      case 'show':
        return <Star className="h-6 w-6" />;
      case 'clinic':
        return <GraduationCap className="h-6 w-6" />;
      case 'social':
        return <PartyPopper className="h-6 w-6" />;
      default:
        return <Calendar className="h-6 w-6" />;
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

  const getRsvpStatusIcon = (status: string) => {
    switch (status) {
      case 'attending':
        return <CheckCircle className="h-4 w-4" />;
      case 'not_attending':
        return <XCircle className="h-4 w-4" />;
      case 'maybe':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRsvpStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
        return 'bg-green-600';
      case 'not_attending':
        return 'bg-red-600';
      case 'maybe':
        return 'bg-yellow-600';
      case 'waitlist':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  const spotsRemaining = event.capacity ? event.capacity - (attendeeCount || 0) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/events">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        {/* Event Image */}
        {event.imageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden h-64 md:h-80 bg-muted">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Event Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <Badge className={getEventTypeColor(event.eventType)}>
                <span className="mr-1">{getEventIcon(event.eventType)}</span>
                {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
              </Badge>
              {myRsvp && (
                <Badge className={getRsvpStatusColor(myRsvp.status)}>
                  <span className="mr-1">{getRsvpStatusIcon(myRsvp.status)}</span>
                  {myRsvp.status === 'waitlist' ? 'Waitlisted' : myRsvp.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </div>
            <CardTitle className="text-3xl md:text-4xl">{event.title}</CardTitle>
            {event.description && (
              <CardDescription className="text-base mt-4">
                {event.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Event Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {startDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">
                    {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    {' - '}
                    {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}

              {event.capacity && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-sm text-muted-foreground">
                      {attendeeCount || 0} / {event.capacity} registered
                      {spotsRemaining !== null && spotsRemaining > 0 && (
                        <span className="text-green-600 ml-2">
                          ({spotsRemaining} spots remaining)
                        </span>
                      )}
                      {spotsRemaining !== null && spotsRemaining <= 0 && (
                        <span className="text-red-600 ml-2">(Event Full)</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RSVP Card */}
          <Card>
            <CardHeader>
              <CardTitle>RSVP</CardTitle>
              <CardDescription>
                {myRsvp ? "Update your response" : "Let us know if you're coming"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myRsvp ? (
                <>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm font-medium mb-2">Your RSVP</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getRsvpStatusColor(myRsvp.status)}>
                        {myRsvp.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    {myRsvp.guestCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        + {myRsvp.guestCount} guest{myRsvp.guestCount > 1 ? 's' : ''}
                      </p>
                    )}
                    {myRsvp.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Note: {myRsvp.notes}
                      </p>
                    )}
                  </div>
                  <Button className="w-full" onClick={handleRsvp}>
                    Update RSVP
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleCancelRsvp}
                  >
                    Cancel RSVP
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={handleRsvp}>
                  RSVP Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RSVP Dialog */}
        <Dialog open={isRsvpDialogOpen} onOpenChange={setIsRsvpDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{myRsvp ? "Update RSVP" : "RSVP to Event"}</DialogTitle>
              <DialogDescription>
                Let us know if you'll be attending {event.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Response</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={rsvpStatus === "attending" ? "default" : "outline"}
                    onClick={() => setRsvpStatus("attending")}
                    className="w-full"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    variant={rsvpStatus === "maybe" ? "default" : "outline"}
                    onClick={() => setRsvpStatus("maybe")}
                    className="w-full"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Maybe
                  </Button>
                  <Button
                    variant={rsvpStatus === "not_attending" ? "default" : "outline"}
                    onClick={() => setRsvpStatus("not_attending")}
                    className="w-full"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    No
                  </Button>
                </div>
              </div>

              {rsvpStatus === "attending" && (
                <div className="space-y-2">
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="0"
                    max="10"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    How many additional guests will you bring?
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements or questions?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRsvpDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitRsvp} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit RSVP"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
