import { GmailEmail } from "../components/GmailAPI/types";
import { Mail, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EmailItemProps {
  email: GmailEmail;
  onClick: (email: GmailEmail) => void;
  onStarToggle: (emailId: string) => void;
}

export const EmailItem = ({ email, onClick, onStarToggle }: EmailItemProps) => {
  return (
    <div
      className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
        !email.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""
      }`}
      onClick={() => onClick(email)}
    >
      <Avatar className="size-8">
        <AvatarFallback className={`${email.avatarColor} text-white text-sm`}>
          {email.avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium truncate ${!email.isRead ? "font-bold" : ""}`}>
            {email.sender}
          </span>
          <Badge variant="outline" className="text-xs">
            {email.category}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground truncate">{email.subject}</div>
        <div className="text-xs text-muted-foreground truncate mt-1">{email.preview}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`size-6 ${email.isStarred ? "text-yellow-500" : "text-muted-foreground"}`}
          onClick={(e) => {
            e.stopPropagation();
            onStarToggle(email.id);
          }}
        >
          <Star className={`size-4 ${email.isStarred ? "fill-current" : ""}`} />
        </Button>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{email.time}</span>
      </div>
    </div>
  );
};