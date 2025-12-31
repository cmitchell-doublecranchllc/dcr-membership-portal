import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Calendar, FileText, MessageSquare, Users, LogIn, Target, TrendingUp, Facebook, Instagram } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: member } = trpc.members.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: unsignedContracts } = trpc.contracts.getUnsignedContracts.useQuery(undefined, { enabled: isAuthenticated });
  const { data: announcements } = trpc.announcements.getAnnouncements.useQuery(undefined, { enabled: isAuthenticated });
  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery(undefined, { enabled: isAuthenticated });
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const checkInMutation = trpc.checkIns.checkIn.useMutation();

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await checkInMutation.mutateAsync({});
      toast.success("Checked in successfully! ✓", {
        description: `Welcome to your lesson, ${user?.name || 'rider'}!`,
      });
    } catch (error) {
      toast.error("Failed to check in", {
        description: "Please try again or contact staff",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case "gold": return "bg-yellow-500 text-white";
      case "silver": return "bg-gray-400 text-white";
      case "bronze": return "bg-amber-700 text-white";
      default: return "bg-gray-300 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Hero Section */}
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <img src="/logo-cc.png" alt="Double C Ranch" className="h-32" />
              <img src="/logo-pony-club.png" alt="United States Pony Clubs" className="h-32" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Double C Ranch
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Welcome to your membership portal
            </p>
            <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
              Manage your membership, check in for lessons, sign contracts, view your schedule, and stay connected with our riding community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/signup">
                  <Users className="mr-2 h-5 w-5" />
                  Sign Up
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                <a href={getLoginUrl()}>
                  <LogIn className="mr-2 h-5 w-5" />
                  Member Login
                </a>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Portal Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Quick Check-In</CardTitle>
                <CardDescription>
                  Fast and easy check-in system for your riding lessons
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Digital Contracts</CardTitle>
                <CardDescription>
                  Sign and manage all your contracts electronically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lesson Schedule</CardTitle>
                <CardDescription>
                  View your upcoming lessons and appointments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Communication</CardTitle>
                <CardDescription>
                  Message staff and receive important announcements
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Family Management</CardTitle>
                <CardDescription>
                  Manage profiles for all family members
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Badge className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Membership Tiers</CardTitle>
                <CardDescription>
                  Bronze, Silver, and Gold membership options
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo-cc.png" alt="Double C Ranch" className="h-16" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, {user?.name || 'Rider'}!
                </h1>
              {member && (
                <div className="flex items-center gap-2">
                  <Badge className={getTierColor(member.membershipTier)}>
                    {member.membershipTier?.toUpperCase()} MEMBER
                  </Badge>
                </div>
              )}
              {!member && (user?.role === 'admin' || user?.role === 'staff') && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">
                    {user?.role === 'admin' ? 'ADMIN' : 'INSTRUCTOR'}
                  </Badge>
                </div>
              )}
              </div>
            </div>
            <div className="flex gap-2">
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Link href="/staff">
                  <Button variant="default">Staff Dashboard</Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="outline">View Profile</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Big Check-In Button - For all authenticated users */}
        {isAuthenticated && (
          <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready for your lesson?</h2>
              <Button 
                size="lg" 
                className="text-xl px-12 py-8 h-auto"
                onClick={handleCheckIn}
                disabled={isCheckingIn}
              >
                <CheckCircle2 className="mr-3 h-8 w-8" />
                {isCheckingIn ? "Checking In..." : "CHECK IN"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lesson Rescheduling Info */}
        {isAuthenticated && (
          <Card className="mb-8 border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Need to Reschedule a Lesson?
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can reschedule your lessons up to 24 hours in advance.
              </p>
              <p className="text-sm font-medium text-blue-900">
                📧 Check your lesson confirmation email - it contains a direct link to reschedule your appointment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Alerts and Notifications */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Unsigned Contracts */}
          {unsignedContracts && unsignedContracts.length > 0 && (
            <Card className="border-2 border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pending Contracts
                </CardTitle>
                <CardDescription>
                  You have {unsignedContracts.length} contract{unsignedContracts.length !== 1 ? 's' : ''} waiting for your signature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/contracts">
                  <Button variant="destructive" className="w-full">
                    Sign Contracts Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Unread Messages */}
          {unreadCount !== undefined && unreadCount > 0 && (
            <Card className="border-2 border-accent/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  New Messages
                </CardTitle>
                <CardDescription>
                  You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/messages">
                  <Button variant="default" className="w-full">
                    View Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/documents">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>My Documents</CardTitle>
                <CardDescription>Sign contracts & upload documents</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/messages">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Messages</CardTitle>
                <CardDescription>Contact staff</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/events">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Events</CardTitle>
                <CardDescription>Competitions & activities</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/my-progress">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>My Progress</CardTitle>
                <CardDescription>View attendance & achievements</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/my-goals">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle>My Goals</CardTitle>
                <CardDescription>Track your riding goals</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/my-progress">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>My Progress</CardTitle>
                <CardDescription>View instructor notes</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Announcements */}
        {announcements && announcements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Latest Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-primary pl-4 py-2">
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer with Social Media Links */}
      <footer className="mt-16 border-t bg-muted/30">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Double C Ranch Pony Club. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Follow us:</span>
              <a
                href="https://www.facebook.com/doublecranchllccville"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Visit our Facebook page"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/doublecranch2015/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Visit our Instagram profile"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
