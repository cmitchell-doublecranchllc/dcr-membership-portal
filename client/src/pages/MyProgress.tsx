import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, MessageSquare, FileText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MyProgress() {
  const { isAuthenticated } = useAuth();
  const { data: notes = [], isLoading } = trpc.lessonNotes.getMyNotes.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You need to be logged in to view your progress notes.
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">My Progress</h1>
              <p className="text-muted-foreground">
                View your lesson notes and track your riding journey
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notes.length}</div>
              <p className="text-xs text-muted-foreground">Lessons recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notes.length > 0
                  ? new Date(notes[0].lessonDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : "No lessons yet"}
              </div>
              <p className="text-xs text-muted-foreground">Last lesson date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress Tracking</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">Continuous improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* Lesson Notes Timeline */}
        {notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Lesson Notes Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Your instructor will add notes after each lesson to track your progress,
                achievements, and areas for improvement.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Lesson History</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

              {/* Lesson notes */}
              <div className="space-y-6">
                {notes.map((note, index) => (
                  <div key={note.id} className="relative pl-16">
                    {/* Timeline dot */}
                    <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>

                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              {new Date(note.lessonDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {note.lessonType.charAt(0).toUpperCase() + note.lessonType.slice(1)} Lesson
                              {note.instructorName && ` • Instructor: ${note.instructorName}`}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            Lesson #{notes.length - index}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* What Was Covered */}
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" />
                            What We Covered
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {note.whatWasCovered}
                          </p>
                        </div>

                        {/* Achievements */}
                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-2 text-green-700 dark:text-green-400">
                            <TrendingUp className="h-4 w-4" />
                            Achievements & Strengths
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                            {note.achievements}
                          </p>
                        </div>

                        {/* Areas for Improvement */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                            <Target className="h-4 w-4" />
                            Areas for Improvement
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                            {note.areasForImprovement}
                          </p>
                        </div>

                        {/* Instructor Comments */}
                        {note.instructorComments && (
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4" />
                              Instructor Comments
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {note.instructorComments}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
