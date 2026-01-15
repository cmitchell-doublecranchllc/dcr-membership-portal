import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function StaffStudentEdit() {
  const [, params] = useRoute("/staff/students/:id/edit");
  const [, setLocation] = useLocation();
  const studentId = params?.id ? parseInt(params.id) : null;

  const [horseManagementLevel, setHorseManagementLevel] = useState<string>("");
  const [ridingCertifications, setRidingCertifications] = useState("");
  const [otherCertifications, setOtherCertifications] = useState("");
  const [ridingGoals, setRidingGoals] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const { data: students, isLoading } = trpc.members.getAllStudentsWithRidingInfo.useQuery();
  const student = students?.find(s => s.memberId === studentId);

  const updateMutation = trpc.profile.updateStudentRidingInfo.useMutation({
    onSuccess: () => {
      toast.success('Student profile updated successfully!');
      setLocation('/staff/students');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update student profile');
    }
  });

  useEffect(() => {
    if (student) {
      setHorseManagementLevel(student.horseManagementLevel || "");
      setRidingCertifications(student.ridingCertifications || "");
      setOtherCertifications(student.otherCertifications || "");
      setRidingGoals(student.ridingGoals || "");
      setMedicalNotes(student.medicalNotes || "");
    }
  }, [student]);

  const handleSave = async () => {
    if (!studentId) {
      toast.error('No student selected');
      return;
    }

    await updateMutation.mutateAsync({
      memberId: studentId,
      horseManagementLevel: horseManagementLevel || undefined,
      ridingCertifications: ridingCertifications || undefined,
      otherCertifications: otherCertifications || undefined,
      ridingGoals: ridingGoals || undefined,
      medicalNotes: medicalNotes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Student not found</p>
            <div className="flex justify-center mt-4">
              <Link href="/staff/students">
                <Button variant="outline">Back to Students</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Link href="/staff/students">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Student Profile</CardTitle>
          <CardDescription>
            Update {student.userName}'s Pony Club certifications and riding information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-medium">{student.userName}</p>
            <p className="text-sm text-muted-foreground">{student.userEmail}</p>
          </div>

          {/* Horse Management Level */}
          <div className="space-y-2">
            <Label htmlFor="hm-level">Horse Management Level</Label>
            <Select value={horseManagementLevel} onValueChange={setHorseManagementLevel}>
              <SelectTrigger id="hm-level">
                <SelectValue placeholder="Select HM level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
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

          {/* Riding Certifications */}
          <div className="space-y-2">
            <Label htmlFor="riding-certs">Riding Certifications</Label>
            <Textarea
              id="riding-certs"
              placeholder="List riding certifications..."
              value={ridingCertifications}
              onChange={(e) => setRidingCertifications(e.target.value)}
              rows={4}
            />
          </div>

          {/* Other Certifications */}
          <div className="space-y-2">
            <Label htmlFor="other-certs">Other Certifications & Achievements</Label>
            <Textarea
              id="other-certs"
              placeholder="List other certifications and achievements..."
              value={otherCertifications}
              onChange={(e) => setOtherCertifications(e.target.value)}
              rows={4}
            />
          </div>

          {/* Riding Goals */}
          <div className="space-y-2">
            <Label htmlFor="riding-goals">Riding Goals</Label>
            <Textarea
              id="riding-goals"
              placeholder="Describe riding goals..."
              value={ridingGoals}
              onChange={(e) => setRidingGoals(e.target.value)}
              rows={4}
            />
          </div>

          {/* Medical Notes */}
          <div className="space-y-2">
            <Label htmlFor="medical-notes">Medical Notes</Label>
            <Textarea
              id="medical-notes"
              placeholder="Important medical information..."
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              rows={4}
              className="border-yellow-300 bg-yellow-50"
            />
            <p className="text-xs text-muted-foreground">
              Include allergies, medications, or medical conditions instructors should know about
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-maroon-600 hover:bg-maroon-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/staff/students">
              <Button variant="outline" disabled={updateMutation.isPending}>
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
