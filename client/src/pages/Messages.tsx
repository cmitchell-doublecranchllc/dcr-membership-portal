import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Send, Mail, MailOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const { data: messages, refetch: refetchMessages } = trpc.messages.getMyMessages.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendMessageMutation = trpc.messages.sendMessage.useMutation();
  const markAsReadMutation = trpc.messages.markAsRead.useMutation();

  const handleSendMessage = async () => {
    if (!recipientId || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        recipientId: parseInt(recipientId),
        subject: subject || undefined,
        content,
      });

      toast.success("Message sent successfully!");
      setIsComposeDialogOpen(false);
      setRecipientId("");
      setSubject("");
      setContent("");
      await refetchMessages();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ messageId });
      await refetchMessages();
    } catch (error) {
      console.error("Failed to mark message as read");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card>
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be logged in to view messages</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const unreadMessages = messages?.filter(m => !m.isRead) || [];
  const readMessages = messages?.filter(m => m.isRead) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 max-w-5xl">
        <PageHeader 
          title="Messages"
          description="Communicate with staff and view announcements"
          backLink="/"
          backLabel="Back to Home"
          action={
            <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compose Message</DialogTitle>
                  <DialogDescription>
                    Send a message to staff or another member
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient User ID</Label>
                    <Input
                      id="recipient"
                      type="number"
                      placeholder="Enter user ID"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact staff to get the correct user ID
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Input
                      id="subject"
                      placeholder="Message subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Message</Label>
                    <Textarea
                      id="content"
                      placeholder="Type your message here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsComposeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendMessage} disabled={isSending}>
                      <Send className="mr-2 h-4 w-4" />
                      {isSending ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Unread Messages */}
        {unreadMessages.length > 0 && (
          <Card className="mb-8 border-2 border-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Unread Messages ({unreadMessages.length})
              </CardTitle>
              <CardDescription>
                New messages that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {unreadMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onMarkAsRead={handleMarkAsRead}
                  currentUserId={user?.id}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Read Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailOpen className="h-5 w-5" />
              All Messages
            </CardTitle>
            <CardDescription>
              Your message history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onMarkAsRead={handleMarkAsRead}
                  currentUserId={user?.id}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation with staff</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MessageCard({ 
  message, 
  onMarkAsRead,
  currentUserId 
}: { 
  message: any; 
  onMarkAsRead: (id: number) => void;
  currentUserId?: number;
}) {
  const isReceived = message.recipientId === currentUserId;
  const sentDate = new Date(message.sentAt);

  return (
    <div 
      className={`p-4 border rounded-lg ${!message.isRead && isReceived ? 'bg-accent/10 border-accent' : 'hover:bg-muted/50'} transition-colors`}
      onClick={() => {
        if (!message.isRead && isReceived) {
          onMarkAsRead(message.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {!message.isRead && isReceived && (
              <Badge variant="default" className="text-xs">New</Badge>
            )}
            <Badge variant={isReceived ? "secondary" : "outline"} className="text-xs">
              {isReceived ? "Received" : "Sent"}
            </Badge>
          </div>
          {message.subject && (
            <h3 className="font-semibold">{message.subject}</h3>
          )}
        </div>
        <div className="text-xs text-muted-foreground text-right">
          <div>{sentDate.toLocaleDateString()}</div>
          <div>{sentDate.toLocaleTimeString()}</div>
        </div>
      </div>

      <p className="text-sm mb-2">{message.content}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {isReceived ? (
            <span>From: User #{message.senderId}</span>
          ) : (
            <span>To: User #{message.recipientId}</span>
          )}
        </div>
        {!message.isRead && isReceived && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(message.id);
            }}
          >
            Mark as read
          </Button>
        )}
      </div>
    </div>
  );
}
