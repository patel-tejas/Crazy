import { CheckCircle, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GmailAccessPromptProps {
  onConnect: () => void;
  isLoading: boolean;
  error: string | null;
}

export const GmailAccessPrompt = ({ 
  onConnect, 
  isLoading, 
  error 
}: GmailAccessPromptProps) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Connect Your Gmail</h2>
        <p className="text-muted-foreground mb-6">
          To view your emails, we need permission to access your Gmail account.
          Your data will be handled securely and we only read your messages.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>Read-only access to your emails</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Shield className="w-5 h-5 text-green-600" />
          <span>Secure OAuth 2.0 authentication</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>No emails stored on our servers</span>
        </div>
      </div>

      <Button
        onClick={onConnect}
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect Gmail Account'}
      </Button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}
    </div>
  </div>
);