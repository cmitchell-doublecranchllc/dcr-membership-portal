import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Camera, CameraOff } from "lucide-react";

export default function StaffQRScanner() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{
    success: boolean;
    studentName: string;
    message: string;
  } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scanMutation = trpc.qrCode.scan.useMutation({
    onSuccess: (data) => {
      setLastScan({
        success: true,
        studentName: data.user.name,
        message: `${data.user.name} checked in successfully!`,
      });
      // Auto-clear after 3 seconds
      setTimeout(() => setLastScan(null), 3000);
    },
    onError: (error) => {
      setLastScan({
        success: false,
        studentName: "",
        message: error.message || "Invalid QR code",
      });
      setTimeout(() => setLastScan(null), 3000);
    },
  });

  const startScanning = async () => {
    try {
      setCameraError(null);
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Process QR code
          scanMutation.mutate({ qrCode: decodedText });
        },
        (errorMessage) => {
          // Ignore scan errors (happens continuously when no QR in view)
        }
      );

      setScanning(true);
    } catch (err: any) {
      setCameraError(err.message || "Failed to start camera");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            QR Code Check-In Scanner
          </CardTitle>
          <CardDescription>
            Scan student QR codes to record lesson attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scanner Area */}
          <div className="relative">
            <div
              id="qr-reader"
              className={`w-full ${scanning ? "block" : "hidden"}`}
              style={{ minHeight: "300px" }}
            />
            {!scanning && (
              <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <div className="text-center space-y-4">
                  <CameraOff className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Error */}
          {cameraError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}

          {/* Last Scan Result */}
          {lastScan && (
            <Alert variant={lastScan.success ? "default" : "destructive"}>
              {lastScan.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {lastScan.success && (
                  <div>
                    <div className="font-semibold text-lg">{lastScan.studentName}</div>
                    <div className="text-sm">{lastScan.message}</div>
                  </div>
                )}
                {!lastScan.success && lastScan.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4">
            {!scanning ? (
              <Button onClick={startScanning} className="flex-1" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1" size="lg">
                <CameraOff className="mr-2 h-5 w-5" />
                Stop Scanning
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p className="font-semibold">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Start Scanning" to activate the camera</li>
              <li>Hold the student's QR code card in front of the camera</li>
              <li>Wait for the scan confirmation</li>
              <li>Student is automatically checked in!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
