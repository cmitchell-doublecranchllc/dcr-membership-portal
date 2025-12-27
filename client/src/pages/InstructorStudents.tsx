import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Search, User, Award, Target, Heart, Calendar, Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Link } from "wouter";

export default function InstructorStudents() {
  const { user, isAuthenticated } = useAuth();
  const { data: students, isLoading } = trpc.members.getAllStudentsWithRidingInfo.useQuery();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    ridingExperienceLevel: "" as "beginner" | "intermediate" | "advanced" | "expert" | "",
    certifications: "",
    ridingGoals: "",
    medicalNotes: "",
  });

  const updateRidingInfoMutation = trpc.profile.updateStudentRidingInfo.useMutation();
  const utils = trpc.useUtils();

  const handleEditClick = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      ridingExperienceLevel: student.ridingExperienceLevel || "",
      certifications: student.certifications || "",
      ridingGoals: student.ridingGoals || "",
      medicalNotes: student.medicalNotes || "",
    });
  };

  const handleSaveRidingInfo = async () => {
    if (!editingStudent) return;
    
    try {
      await updateRidingInfoMutation.mutateAsync({
        memberId: editingStudent.memberId,
        ridingExperienceLevel: editForm.ridingExperienceLevel || undefined,
        certifications: editForm.certifications || undefined,
        ridingGoals: editForm.ridingGoals || undefined,
        medicalNotes: editForm.medicalNotes || undefined,
      });
      
      await utils.members.getAllStudentsWithRidingInfo.invalidate();
      toast.success("Student riding information updated successfully!");
      setEditingStudent(null);
    } catch (error) {
      toast.error("Failed to update riding information", {
        description: "Please try again",
      });
    }
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.userName?.toLowerCase().includes(query) ||
        student.userEmail?.toLowerCase().includes(query) ||
        student.ridingExperienceLevel?.toLowerCase().includes(query) ||
        student.certifications?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const getExperienceBadgeColor = (level?: string | null) => {
    switch (level) {
      case "expert":
        return "bg-purple-500 text-white";
      case "advanced":
        return "bg-blue-500 text-white";
      case "intermediate":
        return "bg-green-500 text-white";
      case "beginner":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-500 text-white";
      case "silver":
        return "bg-gray-400 text-white";
      case "bronze":
        return "bg-amber-700 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "staff")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need instructor privileges to view this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/staff">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Student Riding Profiles</h1>
          <p className="text-muted-foreground">
            View and manage your students' riding experience, goals, and progress
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, experience level, or certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Students ({filteredStudents?.length || 0})</CardTitle>
            <CardDescription>
              Click on a student to view detailed riding information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading students...</p>
              </div>
            ) : filteredStudents && filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Experience Level</TableHead>
                      <TableHead>Certifications</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.memberId} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {student.profilePhotoUrl ? (
                              <img
                                src={student.profilePhotoUrl}
                                alt={student.userName || "Student"}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{student.userName || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{student.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierColor(student.membershipTier)}>
                            {student.membershipTier?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.ridingExperienceLevel ? (
                            <Badge className={getExperienceBadgeColor(student.ridingExperienceLevel)}>
                              {student.ridingExperienceLevel.toUpperCase()}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm">
                            {student.certifications || (
                              <span className="text-muted-foreground">None listed</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEditClick(student)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No students found matching your search" : "No students found"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedStudent?.profilePhotoUrl ? (
                  <img
                    src={selectedStudent.profilePhotoUrl}
                    alt={selectedStudent.userName || "Student"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p>{selectedStudent?.userName}</p>
                  <p className="text-sm font-normal text-muted-foreground">
                    {selectedStudent?.userEmail}
                  </p>
                </div>
              </DialogTitle>
              <DialogDescription>
                Complete riding profile and experience information
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <div className="space-y-6 mt-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Membership Tier</p>
                    <Badge className={getTierColor(selectedStudent.membershipTier)}>
                      {selectedStudent.membershipTier?.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Member Since</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedStudent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Experience Level
                  </p>
                  {selectedStudent.ridingExperienceLevel ? (
                    <Badge className={getExperienceBadgeColor(selectedStudent.ridingExperienceLevel)}>
                      {selectedStudent.ridingExperienceLevel.toUpperCase()}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground">Not specified</p>
                  )}
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications & Achievements
                  </p>
                  {selectedStudent.certifications ? (
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {selectedStudent.certifications}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No certifications listed</p>
                  )}
                </div>

                {/* Riding Goals */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Riding Goals
                  </p>
                  {selectedStudent.ridingGoals ? (
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {selectedStudent.ridingGoals}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No goals specified</p>
                  )}
                </div>

                {/* Medical Notes */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Medical Notes
                  </p>
                  {selectedStudent.medicalNotes ? (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{selectedStudent.medicalNotes}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No medical notes</p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Contact Information</p>
                  <div className="space-y-2 text-sm">
                    {selectedStudent.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedStudent.phone}
                      </div>
                    )}
                    {selectedStudent.emergencyContact && (
                      <div>
                        <span className="font-medium">Emergency Contact:</span>
                        <p className="text-muted-foreground whitespace-pre-wrap mt-1">
                          {selectedStudent.emergencyContact}
                        </p>
                      </div>
                    )}
                    {selectedStudent.dateOfBirth && (
                      <div>
                        <span className="font-medium">Date of Birth:</span>{" "}
                        {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Student Riding Experience Dialog */}
        <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Riding Experience - {editingStudent?.userName}</DialogTitle>
              <DialogDescription>
                Update this student's riding profile information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-experience-level">Experience Level</Label>
                <Select
                  value={editForm.ridingExperienceLevel}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced" | "expert") =>
                    setEditForm({ ...editForm, ridingExperienceLevel: value })
                  }
                >
                  <SelectTrigger id="edit-experience-level">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - New to riding</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                    <SelectItem value="advanced">Advanced - Experienced rider</SelectItem>
                    <SelectItem value="expert">Expert - Professional level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-certifications">Certifications & Achievements</Label>
                <Textarea
                  id="edit-certifications"
                  placeholder="List any riding certifications, competition wins, or achievements..."
                  value={editForm.certifications}
                  onChange={(e) => setEditForm({ ...editForm, certifications: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-goals">Riding Goals</Label>
                <Textarea
                  id="edit-goals"
                  placeholder="What would this student like to achieve?"
                  value={editForm.ridingGoals}
                  onChange={(e) => setEditForm({ ...editForm, ridingGoals: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-medical">Medical Notes</Label>
                <Textarea
                  id="edit-medical"
                  placeholder="Any medical conditions or physical considerations..."
                  value={editForm.medicalNotes}
                  onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Confidential information to help provide appropriate guidance
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingStudent(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRidingInfo} disabled={updateRidingInfoMutation.isPending}>
                  {updateRidingInfoMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
