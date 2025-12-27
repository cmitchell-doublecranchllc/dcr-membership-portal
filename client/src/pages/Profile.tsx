import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, User, Upload, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: member, refetch } = trpc.members.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const upsertMutation = trpc.members.upsertProfile.useMutation();
  const uploadPhotoMutation = trpc.profile.uploadProfilePhoto.useMutation();
  const updateRidingInfoMutation = trpc.profile.updateRidingInfo.useMutation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic profile state
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [membershipTier, setMembershipTier] = useState<"bronze" | "silver" | "gold">("bronze");
  
  // Riding experience state
  const [ridingExperienceLevel, setRidingExperienceLevel] = useState<"beginner" | "intermediate" | "advanced" | "expert" | "">("");
  const [certifications, setCertifications] = useState("");
  const [ridingGoals, setRidingGoals] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (member) {
      setPhone(member.phone || "");
      setEmergencyContact(member.emergencyContact || "");
      setMembershipTier(member.membershipTier);
      setRidingExperienceLevel(member.ridingExperienceLevel || "");
      setCertifications(member.certifications || "");
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

  const handleSaveRidingInfo = async () => {
    setIsSaving(true);
    try {
      await updateRidingInfoMutation.mutateAsync({
        ridingExperienceLevel: ridingExperienceLevel || undefined,
        certifications: certifications || undefined,
        ridingGoals: ridingGoals || undefined,
        medicalNotes: medicalNotes || undefined,
      });
      await refetch();
      toast.success("Riding experience updated successfully!");
    } catch (error) {
      toast.error("Failed to update riding experience", {
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
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            {(user?.role === 'admin' || user?.role === 'staff') && !member
              ? 'Manage your account information'
              : 'Manage your membership information'}
          </p>
        </div>

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

        {/* Riding Experience - Only for members */}
        {member && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Riding Experience</CardTitle>
            <CardDescription>Help us understand your riding background and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ridingExperienceLevel">Experience Level</Label>
              <Select 
                value={ridingExperienceLevel} 
                onValueChange={(value: "beginner" | "intermediate" | "advanced" | "expert") => setRidingExperienceLevel(value)}
              >
                <SelectTrigger id="ridingExperienceLevel">
                  <SelectValue placeholder="Select your experience level" />
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
              <Label htmlFor="certifications">Certifications & Achievements</Label>
              <Textarea
                id="certifications"
                placeholder="List any riding certifications, competition wins, or achievements..."
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Include any relevant riding qualifications or accomplishments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ridingGoals">Riding Goals</Label>
              <Textarea
                id="ridingGoals"
                placeholder="What would you like to achieve in your riding journey?"
                value={ridingGoals}
                onChange={(e) => setRidingGoals(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Share your aspirations - competitions, skill development, or recreational goals
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Medical Notes</Label>
              <Textarea
                id="medicalNotes"
                placeholder="Any medical conditions or physical considerations we should know about..."
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Confidential information to help instructors provide appropriate guidance
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveRidingInfo} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Riding Experience"}
              </Button>
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
