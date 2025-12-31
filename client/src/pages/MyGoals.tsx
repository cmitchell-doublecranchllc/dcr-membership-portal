import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Trophy, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MyGoals() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalTitle: "",
    goalDescription: "",
    category: "riding_skill" as "riding_skill" | "horse_care" | "competition" | "certification" | "other",
    targetDate: "",
  });

  const { data: member } = trpc.members.getMyProfile.useQuery();
  const { data: activeGoals, refetch: refetchActive } = trpc.goals.getByMember.useQuery(
    { memberId: member?.id || 0, status: "active" },
    { enabled: !!member }
  );
  const { data: completedGoals, refetch: refetchCompleted } = trpc.goals.getByMember.useQuery(
    { memberId: member?.id || 0, status: "completed" },
    { enabled: !!member }
  );

  const createGoalMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Goal created successfully!");
      setCreateDialogOpen(false);
      setNewGoal({
        goalTitle: "",
        goalDescription: "",
        category: "riding_skill",
        targetDate: "",
      });
      refetchActive();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteGoalMutation = trpc.goals.delete.useMutation({
    onSuccess: () => {
      toast.success("Goal deleted");
      refetchActive();
      refetchCompleted();
    },
  });

  const handleCreateGoal = () => {
    if (!member) return;
    if (!newGoal.goalTitle.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    createGoalMutation.mutate({
      memberId: member.id,
      ...newGoal,
      targetDate: newGoal.targetDate || undefined,
    });
  };

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

  if (!member) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Riding Goals</h1>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new riding goal to work towards
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalTitle">Goal Title *</Label>
                <Input
                  id="goalTitle"
                  placeholder="e.g., Learn to canter"
                  value={newGoal.goalTitle}
                  onChange={(e) => setNewGoal({ ...newGoal, goalTitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="goalDescription">Description</Label>
                <Textarea
                  id="goalDescription"
                  placeholder="Add details about your goal..."
                  value={newGoal.goalDescription}
                  onChange={(e) => setNewGoal({ ...newGoal, goalDescription: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value: any) => setNewGoal({ ...newGoal, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riding_skill">Riding Skill</SelectItem>
                    <SelectItem value="horse_care">Horse Care</SelectItem>
                    <SelectItem value="competition">Competition</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} disabled={createGoalMutation.isPending}>
                {createGoalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-6 w-6" />
          Active Goals
        </h2>
        {!activeGoals || activeGoals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No active goals yet. Create your first goal to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.goalTitle}</CardTitle>
                      <CardDescription className="mt-1">
                        {goal.goalDescription || "No description"}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoalMutation.mutate({ goalId: goal.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getCategoryColor(goal.category || "other")}>
                      {getCategoryLabel(goal.category || "other")}
                    </Badge>
                    {goal.targetDate && (
                      <Badge variant="outline">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </Badge>
                    )}
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

      {/* Completed Goals (Achievements) */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Achievements
        </h2>
        {!completedGoals || completedGoals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No achievements yet. Keep working on your goals!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {goal.goalTitle}
                  </CardTitle>
                  <CardDescription>
                    Completed {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : ""}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
