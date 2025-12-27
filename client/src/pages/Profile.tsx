import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Save, User, Upload, Camera, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: member, refetch } = trpc.members.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const upsertMutation = trpc.members.upsertProfile.useMutation();
  const uploadPhotoMutation = trpc.profile.uploadProfilePhoto.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic profile state
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [membershipTier, setMembershipTier] = useState<"bronze" | "silver" | "gold">("bronze");
  
  // Pony Club certifications state
  const [horseManagementLevel, setHorseManagementLevel] = useState<"d1" | "d2" | "d3" | "c1" | "c2" | "c3" | "hb" | "ha" | "">("");
  const [ridingCertifications, setRidingCertifications] = useState("");
  const [otherCertifications, setOtherCertifications] = useState("");
  const [ridingGoals, setRidingGoals] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (member) {
      setPhone(member.phone || "");
      setEmergencyContact(member.emergencyContact || "");
      setMembershipTier(member.membershipTier);
      setHorseManagementLevel(member.horseManagementLevel || "");
      setRidingCertifications(member.ridingCertifications || "");
      setOtherCertifications(member.otherCertifications || "");
      setRidingGoals(member.ridingGoals || "");
      setMedicalNotes(member.medicalNotes || "");
    }
  }, [member]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertMutation.mutateAsync({
        phone,
        emergencyContact,
        membershipTier,
      });
      await refetch();
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile", {
        description: "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };



  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64String = base64Data.split(',')[1]; // Remove data:image/...;base64, prefix

        await uploadPhotoMutation.mutateAsync({
          photoData: base64String,
          mimeType: file.type,
        });

        // Refetch user data to get new photo URL
        window.location.reload(); // Simple reload to update auth context
        toast.success("Profile photo updated successfully!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload photo", {
        description: "Please try again",
      });
      setIsUploadingPhoto(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be logged in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-3xl">
        <PageHeader 
          title="My Profile"
          description={(user?.role === 'admin' || user?.role === 'staff') && !member
            ? 'Manage your account information'
            : 'Manage your membership information'}
          backLink="/"
          backLabel="Back to Home"
        />

        {/* Profile Photo Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>Upload a profile photo to personalize your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                {user?.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-4 border-border">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your basic account details from authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-lg">{user?.name || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-lg">{user?.email || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Role</Label>
              <p className="text-lg capitalize">
                {user?.role === 'staff' ? 'Instructor' : (user?.role || "member")}
              </p>
            </div>
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={async () => {
                  await logoutMutation.mutateAsync();
                  window.location.href = '/';
                }}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Membership Details - Only for members */}
        {member && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Membership Details</CardTitle>
            <CardDescription>Your riding center membership information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="membershipTier">Membership Tier</Label>
              <Select value={membershipTier} onValueChange={(value: "bronze" | "silver" | "gold") => setMembershipTier(value)}>
                <SelectTrigger id="membershipTier">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Your membership tier determines your access level and benefits
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact Information</Label>
              <Textarea
                id="emergencyContact"
                placeholder="Name, relationship, and phone number of emergency contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                This information will be used in case of emergency during lessons
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Membership Details"}
              </Button>
            </div>
          </CardContent>
        </Card>

        )}

        {/* Pony Club Certifications - Only for members */}
        {member && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pony Club Certifications</CardTitle>
            <CardDescription>
              Your Pony Club certification levels as assessed by your instructor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Horse Management Level</Label>
              {horseManagementLevel ? (
                <p className="text-lg font-semibold">{horseManagementLevel.toUpperCase().replace(/(\w)(\d)/, "$1-$2")}</p>
              ) : (
                <p className="text-muted-foreground">Not yet assessed by instructor</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Riding Certifications</Label>
              {ridingCertifications ? (
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{ridingCertifications}</p>
              ) : (
                <p className="text-muted-foreground">None recorded</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Other Certifications & Achievements</Label>
              {otherCertifications ? (
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{otherCertifications}</p>
              ) : (
                <p className="text-muted-foreground">None recorded</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Riding Goals</Label>
              {ridingGoals ? (
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{ridingGoals}</p>
              ) : (
                <p className="text-muted-foreground">Not specified</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Medical Notes</Label>
              {medicalNotes ? (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{medicalNotes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">None recorded</p>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-md border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Riding experience information is managed by your instructor. 
                If you need to update any of these fields, please speak with your instructor.
              </p>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Member Since */}
        {member && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Member since {new Date(member.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
