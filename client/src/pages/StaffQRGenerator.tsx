import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, QrCode, Printer, Download } from "lucide-react";
import QRCode from "qrcode";

export default function StaffQRGenerator() {
  const [qrCodes, setQrCodes] = useState<Array<{
    memberId: number;
    memberName: string;
    qrCode: string;
    qrImageUrl: string;
  }>>([]);

  const { data: membersWithQR, isLoading: loadingMembers } = trpc.qrCode.getAllWithQR.useQuery();
  
  const generateAllMutation = trpc.qrCode.generateAll.useMutation({
    onSuccess: async (data) => {
      alert(`Generated ${data.generated} new QR codes!`);
      // Reload the page to show new QR codes
      window.location.reload();
    },
  });

  const generateQRImages = async () => {
    if (!membersWithQR) return;

    const codes = await Promise.all(
      membersWithQR.map(async (member) => {
        const qrImageUrl = await QRCode.toDataURL(member.members.qrCode!, {
          width: 300,
          margin: 2,
        });
        
        return {
          memberId: member.members.id,
          memberName: member.users.name || 'Unknown',
          qrCode: member.members.qrCode!,
          qrImageUrl,
        };
      })
    );

    setQrCodes(codes);
  };

  const printAll = () => {
    window.print();
  };

  const downloadQRCode = (qrImageUrl: string, memberName: string) => {
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${memberName.replace(/\s+/g, "_")}_QRCode.png`;
    link.click();
  };

  return (
    <div className="container py-8">
      <Card className="mb-8 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate and print QR codes for student check-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => generateAllMutation.mutate()}
              disabled={generateAllMutation.isPending}
            >
              {generateAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate QR Codes for All Members
            </Button>

            <Button
              onClick={generateQRImages}
              disabled={!membersWithQR || membersWithQR.length === 0}
              variant="secondary"
            >
              Load QR Codes for Printing
            </Button>

            {qrCodes.length > 0 && (
              <Button onClick={printAll} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print All
              </Button>
            )}
          </div>

          {loadingMembers && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Loading members...</AlertDescription>
            </Alert>
          )}

          {membersWithQR && membersWithQR.length === 0 && (
            <Alert>
              <AlertDescription>
                No QR codes found. Click "Generate QR Codes for All Members" to create them.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Printable QR Codes */}
      {qrCodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2">
          {qrCodes.map((code) => (
            <Card key={code.memberId} className="break-inside-avoid">
              <CardContent className="p-6 text-center space-y-4">
                <div className="font-bold text-xl">{code.memberName}</div>
                <img
                  src={code.qrImageUrl}
                  alt={`QR Code for ${code.memberName}`}
                  className="w-full max-w-[250px] mx-auto"
                />
                <div className="text-xs text-muted-foreground font-mono break-all">
                  {code.qrCode}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadQRCode(code.qrImageUrl, code.memberName)}
                  className="print:hidden"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Print Instructions */}
      {qrCodes.length > 0 && (
        <Alert className="mt-8 print:hidden">
          <AlertDescription>
            <strong>Printing Tips:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use cardstock paper for durability</li>
              <li>Laminate cards after printing</li>
              <li>Cut around each card</li>
              <li>Store laminated cards at the barn entrance</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
