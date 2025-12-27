import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your registration is under review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              Thank you for registering, <strong>{user?.name || "there"}</strong>! 
              Your account is currently pending approval from our staff.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Our team will review your registration</li>
              <li>You'll receive an email once your account is approved</li>
              <li>This typically takes 1-2 business days</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Need immediate access?</p>
              <p>Contact us at <a href="mailto:c.mitchell@doublecranchllc.com" className="underline">c.mitchell@doublecranchllc.com</a></p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={logout}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
