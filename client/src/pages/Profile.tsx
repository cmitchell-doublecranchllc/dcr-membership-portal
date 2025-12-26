import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: member, refetch } = trpc.members.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const upsertMutation = trpc.members.upsertProfile.useMutation();

  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [membershipTier, setMembershipTier] = useState<"bronze" | "silver" | "gold">("bronze");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setPhone(member.phone || "");
      setEmergencyContact(member.emergencyContact || "");
      setMembershipTier(member.membershipTier);
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
          <p className="text-muted-foreground mt-2">Manage your membership information</p>
        </div>

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
              <p className="text-lg capitalize">{user?.role || "member"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Membership Details */}
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
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link href="/">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

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
