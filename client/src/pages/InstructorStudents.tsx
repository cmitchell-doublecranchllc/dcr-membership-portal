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
import { Search, ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function InstructorStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [, setLocation] = useLocation();

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
            Manage your students' Pony Club certifications, goals, and progress
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
              Click Edit to modify student certifications and riding information
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
                    <TableRow key={student.userId}>
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-maroon-600 hover:bg-maroon-700"
                            onClick={() => setLocation(`/staff/students/${student.memberId}/edit`)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
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
