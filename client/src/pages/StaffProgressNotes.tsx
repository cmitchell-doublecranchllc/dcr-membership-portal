import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Plus, FileText } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function StaffProgressNotes() {
  const { user, isAuthenticated } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [category, setCategory] = useState<"skill_progress" | "behavior" | "achievement" | "goal" | "concern" | "general">("general");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isVisibleToParent, setIsVisibleToParent] = useState(true);

  const { data: members } = trpc.members.getAllMembers.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') }
  );

  const { data: notes, refetch } = trpc.lessons.getStudentProgressNotes.useQuery(
    { memberId: selectedMemberId! },
    { enabled: !!selectedMemberId }
  );

  const addNoteMutation = trpc.lessons.addProgressNote.useMutation({
    onSuccess: () => {
      alert("Progress note added successfully!");
      setShowAddDialog(false);
      setTitle("");
      setContent("");
      setCategory("general");
      setIsVisibleToParent(true);
      refetch();
    },
    onError: (error) => {
      alert("Error adding note: " + error.message);
    },
  });

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  if (!isAuthenticated || !isStaffOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is only accessible to staff and administrators.
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

  const handleAddNote = () => {
    if (!selectedMemberId || !title || !content) {
      alert("Please fill in all required fields");
      return;
    }

    addNoteMutation.mutate({
      memberId: selectedMemberId,
      category,
      title,
      content,
      isVisibleToParent,
    });
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Student Progress Notes</h1>
              <p className="text-muted-foreground">Document student achievements and skill progression</p>
            </div>
            <div className="flex gap-2">
              <Link href="/staff">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button onClick={() => setShowAddDialog(true)} disabled={!selectedMemberId}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Student Selection */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Select Student</CardTitle>
              <CardDescription>Choose a student to view their progress notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members?.map((member) => (
                  <Button
                    key={member.id}
                    variant={selectedMemberId === member.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedMemberId(member.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {member.user?.name || "Unknown"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Notes List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Progress Notes</CardTitle>
              <CardDescription>
                {selectedMemberId
                  ? `Notes for ${members?.find(m => m.id === selectedMemberId)?.user?.name || "selected student"}`
                  : "Select a student to view their notes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedMemberId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Select a student from the left to view their progress notes</p>
                </div>
              ) : notes && notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No progress notes yet</p>
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Note
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes?.map((note) => (
                    <div key={note.note.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{note.note.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            By {note.instructor.name} on{" "}
                            {new Date(note.note.noteDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getCategoryBadge(note.note.category)}
                          {note.note.isVisibleToParent && (
                            <Badge variant="outline">Visible to Parent</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Note Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Progress Note</DialogTitle>
              <DialogDescription>
                Document student progress, achievements, or areas for improvement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill_progress">Skill Progress</SelectItem>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="goal">Goal</SelectItem>
                    <SelectItem value="concern">Concern</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the note"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Detailed notes about student progress, skills practiced, achievements, or areas for improvement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visible"
                  checked={isVisibleToParent}
                  onCheckedChange={(checked) => setIsVisibleToParent(checked as boolean)}
                />
                <Label htmlFor="visible" className="text-sm font-normal">
                  Visible to parent/student
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={addNoteMutation.isPending}>
                {addNoteMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
