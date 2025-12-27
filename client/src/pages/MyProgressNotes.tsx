import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function MyProgressNotes() {
  const { user, isAuthenticated } = useAuth();

  const { data: notes, isLoading } = trpc.lessons.getMyProgressNotes.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      skill_progress: "bg-blue-500",
      behavior: "bg-purple-500",
      achievement: "bg-green-500",
      goal: "bg-yellow-500",
      concern: "bg-red-500",
      general: "bg-gray-500",
    };
    return <Badge className={colors[cat] || "bg-gray-500"}>{cat.replace("_", " ")}</Badge>;
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">My Progress Notes</h1>
              <p className="text-muted-foreground">
                View your riding progress and instructor feedback
              </p>
            </div>
          </div>
        </div>

        {/* Progress Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Progress History</CardTitle>
            <CardDescription>
              Notes from your instructors about your riding progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading...</p>
              </div>
            ) : !notes || notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No progress notes yet</p>
                <p className="text-sm mt-2">
                  Your instructors will add notes here as you progress in your riding journey
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.note.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{note.note.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          By {note.instructor.name} on{" "}
                          {new Date(note.note.noteDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {getCategoryBadge(note.note.category)}
                    </div>
                    <p className="text-sm whitespace-pre-wrap mt-3">{note.note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
