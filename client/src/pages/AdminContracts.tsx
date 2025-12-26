import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, FileText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminContracts() {
  const { user, isAuthenticated } = useAuth();
  const { data: contracts, refetch: refetchContracts } = trpc.contracts.getAllContracts.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') }
  );
  const { data: allMembers } = trpc.members.getAllMembers.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') }
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const [newContractTitle, setNewContractTitle] = useState("");
  const [newContractDescription, setNewContractDescription] = useState("");
  const [newContractGoogleDocUrl, setNewContractGoogleDocUrl] = useState("");

  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const createContractMutation = trpc.contracts.createContract.useMutation();
  const assignContractMutation = trpc.contracts.assignContract.useMutation();

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  const handleCreateContract = async () => {
    if (!newContractTitle.trim()) {
      toast.error("Please enter a contract title");
      return;
    }

    try {
      await createContractMutation.mutateAsync({
        title: newContractTitle,
        description: newContractDescription,
        googleDocUrl: newContractGoogleDocUrl || undefined,
      });

      toast.success("Contract created successfully!");
      setIsCreateDialogOpen(false);
      setNewContractTitle("");
      setNewContractDescription("");
      setNewContractGoogleDocUrl("");
      await refetchContracts();
    } catch (error) {
      toast.error("Failed to create contract");
    }
  };

  const handleAssignContract = async () => {
    if (!selectedMemberId) {
      toast.error("Please select a member");
      return;
    }

    if (!selectedContract) {
      toast.error("No contract selected");
      return;
    }

    try {
      await assignContractMutation.mutateAsync({
        contractId: selectedContract.id,
        memberId: parseInt(selectedMemberId),
      });

      toast.success("Contract assigned successfully!");
      setIsAssignDialogOpen(false);
      setSelectedMemberId("");
      setSelectedContract(null);
    } catch (error) {
      toast.error("Failed to assign contract");
    }
  };

  if (!isAuthenticated || !isStaffOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is only accessible to staff and administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/staff">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Contract Management</h1>
              <p className="text-muted-foreground">Create and assign contracts to members</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Contract
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Contract</DialogTitle>
                  <DialogDescription>
                    Add a new contract template to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Contract Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Liability Waiver 2024"
                      value={newContractTitle}
                      onChange={(e) => setNewContractTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description / Contract Text</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter the full contract text here..."
                      value={newContractDescription}
                      onChange={(e) => setNewContractDescription(e.target.value)}
                      rows={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleDocUrl">Google Docs URL (Optional)</Label>
                    <Input
                      id="googleDocUrl"
                      placeholder="https://docs.google.com/document/d/..."
                      value={newContractGoogleDocUrl}
                      onChange={(e) => setNewContractGoogleDocUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Link to the Google Doc version for future integration
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateContract}>
                      Create Contract
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Contracts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Contracts</CardTitle>
            <CardDescription>
              Manage contract templates and assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contracts && contracts.length > 0 ? (
              contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{contract.title}</h3>
                    </div>
                    {contract.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {contract.description}
                      </p>
                    )}
                    {contract.googleDocUrl && (
                      <a
                        href={contract.googleDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        View in Google Docs →
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(contract.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedContract(contract);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Assign to Member
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contracts created yet</p>
                <p className="text-sm">Create your first contract to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Contract Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Contract to Member</DialogTitle>
              <DialogDescription>
                Select a member to assign this contract to
              </DialogDescription>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-semibold">{selectedContract.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedContract.description?.substring(0, 100)}...
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member">Select Member</Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger id="member">
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {allMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          Member #{member.id} - User #{member.userId} ({member.membershipTier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignContract}>
                    <Send className="mr-2 h-4 w-4" />
                    Assign Contract
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
