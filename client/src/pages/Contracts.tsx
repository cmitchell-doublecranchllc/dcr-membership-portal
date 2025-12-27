import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { FileText, CheckCircle, PenTool } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import SignatureCanvas from "react-signature-canvas";
import { storagePut } from "../../../server/storage";

export default function Contracts() {
  const { user, isAuthenticated } = useAuth();
  const { data: member } = trpc.members.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: assignments, refetch: refetchAssignments } = trpc.contracts.getMyAssignments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: signatures } = trpc.contracts.getMySignatures.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isSigningDialogOpen, setIsSigningDialogOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const signContractMutation = trpc.contracts.signContract.useMutation();
  const getContractQuery = trpc.contracts.getContract.useQuery(
    { contractId: selectedContract?.contractId || 0 },
    { enabled: !!selectedContract }
  );

  const handleSignContract = async (assignment: any) => {
    setSelectedContract(assignment);
    setIsSigningDialogOpen(true);
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmitSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    if (!selectedContract || !member) {
      toast.error("Missing contract or member information");
      return;
    }

    setIsSigning(true);
    try {
      const signatureData = signatureRef.current.toDataURL();
      
      await signContractMutation.mutateAsync({
        contractId: selectedContract.contractId,
        assignmentId: selectedContract.id,
        signatureData,
      });

      toast.success("Contract signed successfully!", {
        description: "Your signature has been recorded",
      });

      setIsSigningDialogOpen(false);
      setSelectedContract(null);
      await refetchAssignments();
    } catch (error) {
      toast.error("Failed to sign contract", {
        description: "Please try again",
      });
    } finally {
      setIsSigning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card>
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be logged in to view contracts</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const unsignedAssignments = assignments?.filter(a => !a.isSigned) || [];
  const signedAssignments = assignments?.filter(a => a.isSigned) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-5xl">
        <PageHeader 
          title="Contracts & Documents"
          description="View and sign required contracts"
          backLink="/"
          backLabel="Back to Home"
        />

        {/* Unsigned Contracts */}
        {unsignedAssignments.length > 0 && (
          <Card className="mb-8 border-2 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <FileText className="h-5 w-5" />
                Pending Signatures ({unsignedAssignments.length})
              </CardTitle>
              <CardDescription>
                These contracts require your signature before you can participate in lessons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {unsignedAssignments.map((assignment) => (
                <ContractAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onSign={handleSignContract}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Signed Contracts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Signed Contracts ({signedAssignments.length})
            </CardTitle>
            <CardDescription>
              Contracts you have already signed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signedAssignments.length > 0 ? (
              signedAssignments.map((assignment) => (
                <ContractAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  signed
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No signed contracts yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Dialog */}
        <Dialog open={isSigningDialogOpen} onOpenChange={setIsSigningDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sign Contract</DialogTitle>
              <DialogDescription>
                Please review the contract and provide your signature below
              </DialogDescription>
            </DialogHeader>

            {/* Contract Content */}
            {getContractQuery.data && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{getContractQuery.data.title}</CardTitle>
                    {getContractQuery.data.description && (
                      <CardDescription>{getContractQuery.data.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                    <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
                      <p className="text-sm">
                        {getContractQuery.data.description || "Contract content will be displayed here."}
                      </p>
                      {getContractQuery.data.googleDocUrl && (
                        <p className="text-sm text-muted-foreground mt-4">
                          <a 
                            href={getContractQuery.data.googleDocUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View full contract in Google Docs →
                          </a>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Signature Pad */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Signature</label>
                  <div className="border-2 border-dashed border-border rounded-md bg-background">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: "w-full h-48 cursor-crosshair",
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Sign above using your mouse or touchscreen
                    </p>
                    <Button variant="ghost" size="sm" onClick={handleClearSignature}>
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Agreement Text */}
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">
                    By signing this contract, I acknowledge that I have read and agree to the terms and conditions outlined above.
                    I understand that this electronic signature has the same legal effect as a handwritten signature.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Signed by: {user?.name} ({user?.email})
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSigningDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitSignature} disabled={isSigning}>
                    <PenTool className="mr-2 h-4 w-4" />
                    {isSigning ? "Signing..." : "Sign Contract"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ContractAssignmentCard({ 
  assignment, 
  signed = false,
  onSign 
}: { 
  assignment: any; 
  signed?: boolean;
  onSign?: (assignment: any) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">Contract #{assignment.contractId}</h3>
          {signed ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Signed
            </Badge>
          ) : (
            <Badge variant="destructive">Pending</Badge>
          )}
        </div>
        {assignment.dueDate && (
          <p className="text-sm text-muted-foreground">
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Assigned: {new Date(assignment.createdAt).toLocaleDateString()}
        </p>
      </div>
      {!signed && onSign && (
        <Button onClick={() => onSign(assignment)}>
          <PenTool className="mr-2 h-4 w-4" />
          Sign Now
        </Button>
      )}
      {signed && (
        <Button variant="outline" disabled>
          View Signed
        </Button>
      )}
    </div>
  );
}
