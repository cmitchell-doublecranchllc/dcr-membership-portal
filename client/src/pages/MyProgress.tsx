import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Award, Target, Flame, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MyProgress() {
  const { user } = useAuth();
  const { data: member } = trpc.members.getMyProfile.useQuery();
  const { data: attendanceStats } = trpc.studentStats.getAttendance.useQuery(
    { memberId: member?.id || 0 },
    { enabled: !!member }
  );
  const { data: activeGoals } = trpc.goals.getByMember.useQuery(
    { memberId: member?.id || 0, status: "active" },
    { enabled: !!member }
  );
  const { data: completedGoals } = trpc.goals.getByMember.useQuery(
    { memberId: member?.id || 0, status: "completed" },
    { enabled: !!member }
  );
  const { data: myCheckIns } = trpc.checkIns.getMyCheckIns.useQuery(
    undefined,
    { enabled: !!member }
  );
  // const { data: recentNotes } = trpc.progressNotes.getByMember.useQuery(
  //   { memberId: member?.id || 0 },
  //   { enabled: !!member }
  // );
  const recentNotes: any[] = [];

  if (!member) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      riding_skill: "bg-blue-500",
      horse_care: "bg-green-500",
      competition: "bg-purple-500",
      certification: "bg-orange-500",
      other: "bg-gray-500",
    };
    return colors[category] || colors.other;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      riding_skill: "Riding Skill",
      horse_care: "Horse Care",
      competition: "Competition",
      certification: "Certification",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Progress</h1>
        <p className="text-muted-foreground">Track your riding journey and achievements</p>
      </div>

      {/* Attendance Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All-time attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats?.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Lessons attended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats?.streak || 0}</div>
            <p className="text-xs text-muted-foreground">Consecutive weeks</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Current Goals
          </h2>
          <Link href="/my-goals">
            <Button variant="outline" size="sm">View All Goals</Button>
          </Link>
        </div>
        {!activeGoals || activeGoals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No active goals. <Link href="/my-goals"><a className="text-primary underline">Create your first goal</a></Link></p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.slice(0, 4).map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{goal.goalTitle}</CardTitle>
                      <CardDescription className="mt-1">
                        {goal.goalDescription || "No description"}
                      </CardDescription>
                    </div>
                    <Badge className={getCategoryColor(goal.category || "other")}>
                      {getCategoryLabel(goal.category || "other")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-semibold">{goal.progressPercentage}%</span>
                    </div>
                    <Progress value={goal.progressPercentage} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Award className="h-6 w-6 text-yellow-500" />
          Recent Achievements
        </h2>
        {!completedGoals || completedGoals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No achievements yet. Keep working on your goals!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            {completedGoals.slice(0, 4).map((goal) => (
              <Card key={goal.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="pt-6 text-center">
                  <Award className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <p className="font-semibold">{goal.goalTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Check-In History */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Check-In History
        </h2>
        {!myCheckIns || myCheckIns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No check-ins yet. Use the CHECK IN button on the home page to record your attendance.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {myCheckIns.slice(0, 10).map((checkIn: any) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {new Date(checkIn.checkInTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {checkIn.program} - {checkIn.checkInType}
                      </p>
                    </div>
                    <div>
                      {checkIn.status === 'approved' && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      )}
                      {checkIn.status === 'pending' && (
                        <Badge className="bg-orange-600">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                      {checkIn.status === 'rejected' && (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Progress Notes */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Instructor Notes</h2>
        {!recentNotes || recentNotes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No progress notes yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentNotes.slice(0, 5).map((note: any) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription>
                        Instructor: {note.instructorName || "Unknown"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{note.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
