import { GmailEmail } from "./GmailAPI/types";
import { 
  Star, Archive, Trash2, MoreHorizontal, Share, Settings, 
  Reply, ReplyAll, Forward, ChevronRight, ChevronLeft, 
  Maximize, Minimize, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import DOMPurify from 'dompurify';

interface EmailDetailProps {
  email: GmailEmail;
  onClose: () => void;
  onStarToggle: (emailId: string) => void;
  isFullView: boolean;
  onToggleFullView: () => void;
}

export const EmailDetail = ({ 
  email, 
  onClose, 
  onStarToggle,
  isFullView,
  onToggleFullView
}: EmailDetailProps) => {
  return (
    <>
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="ml-6"
          >
            <X className="size-4" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <Button variant="ghost" size="icon">
              <Archive className="size-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onStarToggle(email.id)}
            >
              <Star className={`size-4 ${email.isStarred ? "text-yellow-500 fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share className="size-4" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleFullView}
            title={isFullView ? "Minimize" : "Expand"}
          >
            {isFullView ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">{email.subject}</h2>

        <div className="flex items-center gap-3 mb-6">
          <Avatar className="size-10">
            <AvatarFallback className={`${email.avatarColor} text-white`}>
              {email.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{email.sender}</div>
            <div className="text-sm text-muted-foreground">&lt;{email.senderEmail}&gt;</div>
          </div>
          <div className="text-sm text-muted-foreground">{email.time}</div>
        </div>

        <div className="prose max-w-none dark:prose-invert">
          <div
            className="email-content text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(email.content || email.preview)
            }}
          />
        </div>

        <Separator className="my-6" />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Reply className="size-4" />
            Reply
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ReplyAll className="size-4" />
            Reply all
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Forward className="size-4" />
            Forward
          </Button>
        </div>
      </div>
    </>
  );
};