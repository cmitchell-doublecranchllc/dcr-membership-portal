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
import { Search, Award, FileText, Target, Heart, Phone, Calendar, ArrowLeft, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Link } from "wouter";

export default function InstructorStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const { data: students, isLoading, refetch } = trpc.members.getAllStudentsWithRidingInfo.useQuery();
  
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully');
      refetch();
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    }
  });

  const handleDelete = async () => {
    if (!userToDelete) return;
    await deleteUserMutation.mutateAsync({ userId: userToDelete });
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
      <Link href="/staff">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Staff Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Student Riding Profiles</CardTitle>
          <CardDescription>
            View your students' Pony Club certifications, goals, and progress
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
                  <TableHead>HM Level</TableHead>
                  <TableHead>Certifications</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableRow
                      key={student.userId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.userName}</p>
                          <p className="text-sm text-muted-foreground">{student.userEmail}</p>
                        </div>
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
                        <p className="text-sm line-clamp-2">
                          {student.ridingCertifications || "None listed"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setUserToDelete(student.userId)}
                          >
                            <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{selectedStudent?.userName}</DialogTitle>
            <DialogDescription>{selectedStudent?.userEmail}</DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6 mt-4">
              {/* Membership Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Membership Tier</p>
                  <Badge
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user and their member profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
