import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Megaphone, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Announcements() {
  const { user, isAuthenticated } = useAuth();
  const { data: announcements, refetch: refetchAnnouncements } = trpc.announcements.getAnnouncements.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetTiers, setTargetTiers] = useState<("bronze" | "silver" | "gold")[]>([]);
  const [publishNow, setPublishNow] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createAnnouncementMutation = trpc.announcements.createAnnouncement.useMutation();

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      await createAnnouncementMutation.mutateAsync({
        title,
        content,
        targetTiers: targetTiers.length > 0 ? targetTiers : undefined,
        publish: publishNow,
      });

      toast.success(publishNow ? "Announcement published!" : "Announcement created as draft");
      setIsCreateDialogOpen(false);
      setTitle("");
      setContent("");
      setTargetTiers([]);
      setPublishNow(false);
      await refetchAnnouncements();
    } catch (error) {
      toast.error("Failed to create announcement");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTier = (tier: "bronze" | "silver" | "gold") => {
    setTargetTiers(prev => 
      prev.includes(tier) 
        ? prev.filter(t => t !== tier)
        : [...prev, tier]
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card>
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be logged in to view announcements</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Announcements</h1>
              <p className="text-muted-foreground">
                Stay updated with the latest news from the riding center
              </p>
            </div>
            {isStaffOrAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>
                      Share news and updates with members
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Announcement title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Write your announcement here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Membership Tiers (Optional)</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bronze"
                            checked={targetTiers.includes("bronze")}
                            onCheckedChange={() => toggleTier("bronze")}
                          />
                          <label htmlFor="bronze" className="text-sm cursor-pointer">
                            Bronze
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="silver"
                            checked={targetTiers.includes("silver")}
                            onCheckedChange={() => toggleTier("silver")}
                          />
                          <label htmlFor="silver" className="text-sm cursor-pointer">
                            Silver
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="gold"
                            checked={targetTiers.includes("gold")}
                            onCheckedChange={() => toggleTier("gold")}
                          />
                          <label htmlFor="gold" className="text-sm cursor-pointer">
                            Gold
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave empty to show to all members
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="publish"
                        checked={publishNow}
                        onCheckedChange={(checked) => setPublishNow(checked as boolean)}
                      />
                      <label htmlFor="publish" className="text-sm cursor-pointer">
                        Publish immediately
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAnnouncement} disabled={isCreating}>
                        {isCreating ? "Creating..." : publishNow ? "Publish" : "Save Draft"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {announcement.publishedAt 
                            ? new Date(announcement.publishedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Draft'}
                        </span>
                        {announcement.targetTiers && (
                          <>
                            <span>•</span>
                            <span>
                              For: {JSON.parse(announcement.targetTiers).map((t: string) => 
                                t.charAt(0).toUpperCase() + t.slice(1)
                              ).join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No announcements yet</p>
                {isStaffOrAdmin && (
                  <p className="text-sm">Create your first announcement to get started</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
