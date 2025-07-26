"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Settings, Grid3X3, Mic, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import axios from "axios"

interface ChatMessage {
  id: number
  type: "user" | "assistant"
  message: string
  timestamp: string
}

interface ChatProps {
  messages?: ChatMessage[]
  onSendMessage?: (message: string) => void
  className?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isGmailAuthorized?: boolean
}

export default function Chat({
  messages = [],
  onSendMessage,
  className = "",
  isCollapsed = false,
  onToggleCollapse,
  isGmailAuthorized = false,
}: ChatProps) {
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    // Add user message to chat
    if (onSendMessage) {
      onSendMessage(message);
    }
    setInputMessage("");

    // Only call API if Gmail is authorized
    try {
      setIsLoading(true);

      // Get Gmail token data
      const tokenData = window.gapi.client.getToken();
      if (!tokenData) {
        console.error("No Gmail token found");
        return;
      }

      // Prepare payload
      const payload = {
        token_data: {
          token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          token_uri: "https://oauth2.googleapis.com/token",
          client_id: '459976879104-gcljq7m0akm9t98iqt3sneuhlvh5cqtv.apps.googleusercontent.com',
          client_secret: 'AIzaSyCnaJttbbwDFC9yD6myRxwmgF4sGY2TJig',
          scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
          expiry: tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : "",
        },
        user_query: message,
        context: {},
      };

      console.log("Sending payload to API:", payload);

      // Call your API endpoint using Axios
      const response = await axios.post(
        'https://6842-2402-a00-408-2632-485b-a8fe-3acf-22c4.ngrok-free.app/process',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true' // Bypass ngrok warning
          },
          timeout: 30000, // 30 seconds timeout
          withCredentials: false
        }
      );

      console.log("API response:", response.data);

      // Add assistant response to chat
      if (onSendMessage && response.data) {
        onSendMessage(response.data.response || response.data.message || "Here's what I found...");
      }
    } catch (error) {
      console.error("Failed to get assistant response:", error);
      if (onSendMessage) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            // Server responded with error status
            onSendMessage(`Error: ${error.response.status} - ${error.response.data?.message || 'Request failed'}`);
          } else if (error.request) {
            // Request was made but no response received
            onSendMessage("The server didn't respond. Please try again later.");
          } else {
            // Something happened in setting up the request
            onSendMessage("Failed to send request. Please check your connection.");
          }
        } else {
          onSendMessage("Sorry, I couldn't process your request. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedAction = (action: string) => {
    setInputMessage(action)
  }

  const suggestedActions = [
    { text: "Organize my inbox", selected: true },
    { text: "Find urgent emails", selected: false },
    { text: "Plan my day", selected: false },
  ]

  if (isCollapsed) {
    return (
      <div className={`w-16 h-full bg-slate-900 border-r border-slate-800 flex flex-col ${className}`}>
        <div className="p-4 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full bg-slate-900 text-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
            <div className="size-4 bg-white rounded-sm opacity-80"></div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {messages.length === 0 ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl font-medium text-slate-300 mb-8">How can I help you today?</h1>
            </div>

            <div className="w-full max-w-2xl mb-8">
              <div className="relative">
                <Textarea
                  placeholder="Find, write, schedule, organize, ask anything..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none min-h-[60px] text-base px-12 py-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />

                <div className="absolute left-4 bottom-4 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
                  >
                    <Paperclip className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
                  >
                    <Settings className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
                  >
                    <Grid3X3 className="size-4" />
                  </Button>
                </div>

                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
                  >
                    <Mic className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
                    onClick={() => handleSendMessage()}
                  // disabled={!inputMessage.trim() || isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {suggestedActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`rounded-full px-6 py-2 text-sm transition-all ${action.selected
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    : "bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
                    }`}
                  onClick={() => handleSuggestedAction(action.text)}
                >
                  {action.text}
                </Button>
              ))}
            </div>

            <div className="text-slate-500 text-sm mb-12">What can I ask?</div>
          </>
        ) : (
          <ScrollArea className="flex-1 w-full max-w-4xl" ref={scrollAreaRef}>
            <div className="space-y-6 p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-100 border border-slate-700"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                    <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-slate-800 text-slate-100 border border-slate-700">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {messages.length > 0 && (
        <div className="p-4 border-t border-slate-800">
          <div className="relative max-w-4xl mx-auto">
            <Textarea
              placeholder="Find, write, schedule, organize, ask anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none min-h-[50px] px-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />

            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-white">
                <Paperclip className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-white">
                <Settings className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-white">
                <Grid3X3 className="size-4" />
              </Button>
            </div>

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-white">
                <Mic className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-slate-400 hover:text-white"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ArrowRight className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Press 1 for saved prompts</p>
        </div>
      )}
    </div>
  )
}