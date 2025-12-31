import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function QRCheckIn() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [memberName, setMemberName] = useState('');

  const scanMutation = trpc.qrCode.publicCheckIn.useMutation({
    onSuccess: (data) => {
      setStatus('success');
      setMemberName(data.user.name || 'Student');
      setMessage(`Welcome, ${data.user.name || 'Student'}! You've been checked in successfully.`);
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        setLocation('/');
      }, 3000);
    },
    onError: (error) => {
      setStatus('error');
      setMessage(error.message || 'Invalid QR code or check-in failed');
    },
  });

  useEffect(() => {
    if (params.token) {
      // Auto-check in using the QR code token
      scanMutation.mutate({
        qrCode: params.token,
      });
    }
  }, [params.token]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Checking In...'}
            {status === 'success' && 'Check-In Successful!'}
            {status === 'error' && 'Check-In Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Please wait while we process your check-in'}
            {status === 'success' && 'Redirecting you to the portal...'}
            {status === 'error' && 'There was a problem with your check-in'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-center">
                  <strong>{memberName}</strong>
                  <br />
                  {message}
                </AlertDescription>
              </Alert>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <Alert variant="destructive">
                <AlertDescription className="text-center">
                  {message}
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
