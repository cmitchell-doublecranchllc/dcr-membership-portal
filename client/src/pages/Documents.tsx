import { useState, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Upload, Download, Trash2, FileCheck, AlertCircle, PenTool, CheckCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DOCUMENT_TYPES = [
  { value: 'medical_form', label: 'Medical Form' },
  { value: 'insurance_certificate', label: 'Insurance Certificate' },
  { value: 'photo_release', label: 'Photo Release' },
  { value: 'emergency_contact', label: 'Emergency Contact Form' },
  { value: 'other', label: 'Other Document' },
];

export default function Documents() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isSigningDialogOpen, setIsSigningDialogOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.documents.getMyDocuments.useQuery();
  const { data: contracts } = trpc.contracts.myContracts.useQuery();
  const { data: assignments, refetch: refetchAssignments } = trpc.contracts.getMyAssignments.useQuery();
  const { data: member } = trpc.members.getMyProfile.useQuery();
  const { user } = useAuth();
  const uploadMutation = trpc.documents.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      setSelectedFile(null);
      setDocumentType('');
      setNotes('');
      utils.documents.getMyDocuments.invalidate();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.documents.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success('Document deleted successfully');
      utils.documents.getMyDocuments.invalidate();
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const signContractMutation = trpc.contracts.signContract.useMutation();
  const getContractQuery = trpc.contracts.getContract.useQuery(
    { contractId: selectedContract?.contractId || 0 },
    { enabled: !!selectedContract }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/png;base64, prefix

        await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileData: base64Data,
          documentType: documentType as any,
          notes: notes || undefined,
        });
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setUploading(false);
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = (documentId: number) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate({ documentId: documentToDelete });
    }
  };

  const handleSignContract = async (assignment: any) => {
    setSelectedContract(assignment);
    setIsSigningDialogOpen(true);
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmitSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    if (!selectedContract || !member) {
      toast.error('Missing contract or member information');
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

      toast.success('Contract signed successfully!', {
        description: 'Your signature has been recorded',
      });

      setIsSigningDialogOpen(false);
      setSelectedContract(null);
      await refetchAssignments();
      utils.contracts.myContracts.invalidate();
    } catch (error) {
      toast.error('Failed to sign contract', {
        description: 'Please try again',
      });
    } finally {
      setIsSigning(false);
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDocumentType = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  // Separate signed and unsigned contracts
  const signedContracts = contracts?.filter(c => c.isSigned) || [];
  const unsignedContracts = contracts?.filter(c => !c.isSigned) || [];
  const unsignedAssignments = assignments?.filter(a => !a.isSigned) || [];
  const signedAssignments = assignments?.filter(a => a.isSigned) || [];

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading documents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Documents</h1>
        <p className="text-muted-foreground">
          Sign contracts, view signed documents, and upload required files
        </p>
      </div>

      {/* Unsigned Contracts Section */}
      {unsignedAssignments.length > 0 && (
        <Card className="mb-6 border-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <FileText className="h-5 w-5" />
              Contracts Requiring Signature ({unsignedAssignments.length})
            </CardTitle>
            <CardDescription>
              These contracts require your signature before you can participate in lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {unsignedAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Contract #{assignment.contractId}</h3>
                    <Badge variant="destructive">Pending</Badge>
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
                <Button onClick={() => handleSignContract(assignment)}>
                  <PenTool className="mr-2 h-4 w-4" />
                  Sign Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Document Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Upload medical forms, insurance certificates, or other required documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File (Max 10MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={uploading}>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this document..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={uploading}
                rows={3}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !documentType || uploading}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </CardContent>
        </Card>

        {/* Signed Contracts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Signed Contracts
            </CardTitle>
            <CardDescription>
              View and download your signed contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {signedContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No signed contracts yet
              </p>
            ) : (
              <div className="space-y-3">
                {signedContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{contract.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Signed {new Date(contract.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <a href="/contracts" target="_blank">
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Documents Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Uploaded Documents
          </CardTitle>
          <CardDescription>
            All documents you've uploaded to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No documents uploaded yet. Upload your first document above.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.fileName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatDocumentType(doc.documentType)}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {getContractQuery.data.content || getContractQuery.data.description || "Contract content will be displayed here."}
                    </pre>
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
  );
}
