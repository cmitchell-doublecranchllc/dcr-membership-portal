import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Award, FileText, Target, Heart, Phone, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function InstructorStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    horseManagementLevel: "" as "d1" | "d2" | "d3" | "c1" | "c2" | "c3" | "hb" | "ha" | "",
    ridingCertifications: "",
    otherCertifications: "",
    ridingGoals: "",
    medicalNotes: "",
  });

  const { data: students, isLoading } = trpc.members.getAllStudentsWithRidingInfo.useQuery();
  const updateRidingInfoMutation = trpc.profile.updateRidingInfo.useMutation();

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      horseManagementLevel: student.horseManagementLevel || "",
      ridingCertifications: student.ridingCertifications || "",
      otherCertifications: student.otherCertifications || "",
      ridingGoals: student.ridingGoals || "",
      medicalNotes: student.medicalNotes || "",
    });
  };

  const handleSave = async () => {
    if (!editingStudent) return;

    try {
      await updateRidingInfoMutation.mutateAsync({
        memberId: editingStudent.memberId,
        horseManagementLevel: editForm.horseManagementLevel || undefined,
        ridingCertifications: editForm.ridingCertifications || undefined,
        otherCertifications: editForm.otherCertifications || undefined,
        ridingGoals: editForm.ridingGoals || undefined,
        medicalNotes: editForm.medicalNotes || undefined,
      });
      setEditingStudent(null);
    } catch (error) {
      console.error("Failed to update student info:", error);
    }
  };

  const filteredStudents =
    students?.filter((student) => {
      const query = searchQuery.toLowerCase();
      return (
        student.userName?.toLowerCase().includes(query) ||
        student.userEmail?.toLowerCase().includes(query) ||
        student.horseManagementLevel?.toLowerCase().includes(query) ||
        student.ridingCertifications?.toLowerCase().includes(query)
      );
    }) || [];

  const getHMLevelBadgeColor = (level: string) => {
    const colors: Record<string, string> = {
      d1: "bg-blue-100 text-blue-800",
      d2: "bg-blue-200 text-blue-900",
      d3: "bg-blue-300 text-blue-950",
      c1: "bg-purple-100 text-purple-800",
      c2: "bg-purple-200 text-purple-900",
      c3: "bg-purple-300 text-purple-950",
      hb: "bg-amber-100 text-amber-800",
      ha: "bg-amber-200 text-amber-900",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const formatHMLevel = (level: string) => {
    const formats: Record<string, string> = {
      d1: "D-1",
      d2: "D-2",
      d3: "D-3",
      c1: "C-1",
      c2: "C-2",
      c3: "C-3",
      hb: "H-B",
      ha: "H-A",
    };
    return formats[level] || level.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Link href="/staff/dashboard">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Staff Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Student Riding Profiles</CardTitle>
          <CardDescription>
            View and manage your students' Pony Club certifications, goals, and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, HM level, or certifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Student Count */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">All Students ({filteredStudents.length})</h3>
            <p className="text-sm text-muted-foreground">
              Click on a student to view detailed Pony Club certification information
            </p>
          </div>

          {/* Students Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>HM Level</TableHead>
                  <TableHead>Riding Certifications</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.memberId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.userName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{student.userName || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{student.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            student.membershipTier === "gold"
                              ? "bg-yellow-100 text-yellow-800"
                              : student.membershipTier === "silver"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {student.membershipTier?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.horseManagementLevel ? (
                          <Badge className={getHMLevelBadgeColor(student.horseManagementLevel)}>
                            {formatHMLevel(student.horseManagementLevel)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate">
                          {student.ridingCertifications || "None listed"}
                        </p>
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
                            onClick={() => handleEdit(student)}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {selectedStudent?.userName?.charAt(0) || "?"}
                </span>
              </div>
              <div>
                <DialogTitle>{selectedStudent?.userName || "Unknown Student"}</DialogTitle>
                <DialogDescription>{selectedStudent?.userEmail}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Membership Tier</p>
                  <Badge
                    variant="secondary"
                    className={
                      selectedStudent.membershipTier === "gold"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedStudent.membershipTier === "silver"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {selectedStudent.membershipTier?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Member Since</p>
                  <p className="text-sm">
                    {new Date(selectedStudent.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Horse Management Level */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Horse Management Level
                </p>
                {selectedStudent.horseManagementLevel ? (
                  <Badge className={getHMLevelBadgeColor(selectedStudent.horseManagementLevel)}>
                    {formatHMLevel(selectedStudent.horseManagementLevel)}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Not set</p>
                )}
              </div>

              {/* Riding Certifications */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Riding Certifications
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedStudent.ridingCertifications || "None listed"}
                </p>
              </div>

              {/* Other Certifications */}
              {selectedStudent.otherCertifications && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Other Certifications & Achievements
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{selectedStudent.otherCertifications}</p>
                </div>
              )}

              {/* Riding Goals */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Riding Goals
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedStudent.ridingGoals || "None specified"}
                </p>
              </div>

              {/* Medical Notes */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Medical Notes
                </p>
                {selectedStudent.medicalNotes ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-900 whitespace-pre-wrap">
                      {selectedStudent.medicalNotes}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="space-y-2">
                  {selectedStudent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Phone: {selectedStudent.phone}</span>
                    </div>
                  )}
                  {selectedStudent.emergencyContact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Emergency Contact: {selectedStudent.emergencyContact}</span>
                    </div>
                  )}
                  {selectedStudent.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Date of Birth: {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Certifications</DialogTitle>
            <DialogDescription>
              Update {editingStudent?.userName}'s Pony Club certifications and riding information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-hm-level">Horse Management Level</Label>
              <Select
                value={editForm.horseManagementLevel}
                onValueChange={(value: "d1" | "d2" | "d3" | "c1" | "c2" | "c3" | "hb" | "ha") =>
                  setEditForm({ ...editForm, horseManagementLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select HM level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="d1">D-1</SelectItem>
                  <SelectItem value="d2">D-2</SelectItem>
                  <SelectItem value="d3">D-3</SelectItem>
                  <SelectItem value="c1">C-1</SelectItem>
                  <SelectItem value="c2">C-2</SelectItem>
                  <SelectItem value="c3">C-3</SelectItem>
                  <SelectItem value="hb">H-B</SelectItem>
                  <SelectItem value="ha">H-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-riding-certs">Riding Certifications</Label>
              <Textarea
                id="edit-riding-certs"
                placeholder="e.g., D-2 Eventing, C-1 Dressage, D-3 Show Jumping"
                value={editForm.ridingCertifications}
                onChange={(e) =>
                  setEditForm({ ...editForm, ridingCertifications: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                List riding discipline certifications (Eventing, Dressage, Show Jumping, Hunter Seat, Western Dressage, Western)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-other-certs">Other Certifications & Achievements</Label>
              <Textarea
                id="edit-other-certs"
                placeholder="Non-Pony Club certifications (e.g., BHS, USDF medals, etc.)"
                value={editForm.otherCertifications}
                onChange={(e) =>
                  setEditForm({ ...editForm, otherCertifications: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-goals">Riding Goals</Label>
              <Textarea
                id="edit-goals"
                placeholder="Student's riding goals and aspirations"
                value={editForm.ridingGoals}
                onChange={(e) => setEditForm({ ...editForm, ridingGoals: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-medical">Medical Notes</Label>
              <Textarea
                id="edit-medical"
                placeholder="Important medical information, allergies, or special considerations"
                value={editForm.medicalNotes}
                onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateRidingInfoMutation.isPending}>
                {updateRidingInfoMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
