"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail,
  Search,
  Plus,
  RefreshCw,
  ChevronDown,
  Star,
  Archive,
  Trash2,
  MoreHorizontal,
  Paperclip,
  Send,
  Mic,
  History,
  Edit,
  Reply,
  ReplyAll,
  Forward,
  X,
  Settings,
  Calendar,
  Activity,
  ChevronLeft,
  Share,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export default function DashboardPage() {
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("Inbox")
  const [leftPanelSize, setLeftPanelSize] = useState(30)
  const [rightPanelSize, setRightPanelSize] = useState(70)

  // Mock chat history
  const chatHistory = [
    {
      id: 1,
      type: "user",
      message: "give my yesterday mails",
      timestamp: "2 min ago",
    },
    {
      id: 2,
      type: "assistant",
      message: "I'll search for your emails from yesterday to show you what you received.",
      timestamp: "2 min ago",
    },
    {
      id: 3,
      type: "assistant",
      message: "Found 11 threads after:2025/06/01 before:2025/06/03",
      timestamp: "2 min ago",
    },
    {
      id: 4,
      type: "assistant",
      message:
        "I found 11 emails from yesterday (June 2nd, 2025). Here's a summary of your emails:\n\nPromotional/Marketing emails (6):\n• CSS if(), Seamless SVG Te... CodePen newsletter about CSS if() functions, SVG text animations, and web development tutorials\n• NEW - Take Your Amazon Bu... Helium 10 promoting TikTok Shop integration for Amazon sellers\n• Win 2 Tickets to Anubh... AllEvents contest to win tickets to Anubhav Bassi comedy show in Ahmedabad\n• Good news alert! Canva highlighting their teacher support initiative and donation program\n• Welcome to Lightblock! Welcome email from Lightblock",
      timestamp: "1 min ago",
    },
  ]

  // Mock emails data
  const emails = [
    {
      id: 1,
      sender: "Google Cloud Platform, Firebase, and APIs",
      senderEmail: "CloudPlatform-noreply@google.com",
      subject: "Action required: your billing account 01D713-1C431D-7BF2CB has been suspended.",
      preview: "Google Cloud Platform account suspended due to unpaid past due amounts or errors.",
      time: "Apr 1, 5:17 AM",
      isStarred: true,
      isRead: false,
      category: "Updates",
      avatar: "G",
      avatarColor: "bg-red-500",
      content: `Dear Google customer,

You are receiving this email because you are a Google Cloud Platform, Firebase, or API customer.

Your billing account 01D713-1C431D-7BF2CB has been suspended for failure to pay past due amounts or invalid payment information. During suspension, you may experience an impact to your billing account and related Project(s) or services.

To resolve this issue, please update your payment method or pay any outstanding balance in the Google Cloud Console.`,
    },
    {
      id: 2,
      sender: "Google Cloud Support",
      senderEmail: "support@googlecloud.com",
      subject: "[Case Action Advised] Your Google Cloud Support case #58560564: General inquiry",
      preview: "Hello, Your Case #58560564 has been updated with a new message from our support team...",
      time: "Apr 3",
      isStarred: true,
      isRead: true,
      category: "Updates",
      avatar: "G",
      avatarColor: "bg-blue-500",
      content:
        "Hello, We have received your support case and our team is working on it. We will get back to you within 24 hours with an update.",
    },
    {
      id: 3,
      sender: "Google Cloud Support",
      senderEmail: "support@googlecloud.com",
      subject: "Google Cloud Support #58560564: General inquiry - Case Closed",
      preview: "Hello, We have resolved your Google Cloud Support case and it has been closed...",
      time: "Apr 3",
      isStarred: true,
      isRead: true,
      category: "Updates",
      avatar: "G",
      avatarColor: "bg-blue-500",
      content:
        "Hello, We have successfully resolved your support case. If you have any further questions, please don't hesitate to contact us.",
    },
    {
      id: 4,
      sender: "Codeforces",
      senderEmail: "codeforces@codeforces.com",
      subject: "Educational Codeforces Round 179 (Rated for Div. 2)",
      preview: "Hello, pateltejas.200...",
      time: "1:51 AM",
      isStarred: false,
      isRead: true,
      category: "Updates",
      avatar: "C",
      avatarColor: "bg-orange-500",
      content:
        "Hello, Educational Codeforces Round 179 (Rated for Div. 2) will start on June 3, 2025 at 17:35 (UTC). The round will be rated for participants with rating lower than 2100.",
    },
    {
      id: 5,
      sender: "CodePen",
      senderEmail: "hello@codepen.io",
      subject: "CSS if(), Seamless SVG Text, and a Custom Scrollbar",
      preview: "View this issue on...",
      time: "Yesterday",
      isStarred: false,
      isRead: true,
      category: "Promotions",
      avatar: "C",
      avatarColor: "bg-black",
      content:
        "View this issue on CodePen. This week we're featuring CSS if() functions, seamless SVG text animations, and custom scrollbar designs.",
    },
    {
      id: 6,
      sender: "Helium 10",
      senderEmail: "support@helium10.com",
      subject: "NEW - Take Your Amazon Business to TikTok Shop",
      preview: "Hi Tejas, With love...",
      time: "Yesterday",
      isStarred: false,
      isRead: true,
      category: "Promotions",
      avatar: "H",
      avatarColor: "bg-blue-600",
      content:
        "Hi Tejas, With love from the Helium 10 team! We're excited to announce our new TikTok Shop integration for Amazon sellers.",
    },
    {
      id: 7,
      sender: "nse_alerts",
      senderEmail: "alerts@nse.com",
      subject: "Funds/Securities Balance",
      preview: "Dear Investor, With reference to...",
      time: "Yesterday",
      isStarred: false,
      isRead: true,
      category: "Updates",
      avatar: "N",
      avatarColor: "bg-purple-500",
      content:
        "Dear Investor, With reference to your trading account, please find your current funds and securities balance statement.",
    },
    {
      id: 8,
      sender: "AllEvents",
      senderEmail: "noreply@allevents.in",
      subject: "Win 2 Tickets to Anubhav Bassi Live Comedy Show",
      preview: "Enter to Win Free Tickets...",
      time: "Yesterday",
      isStarred: false,
      isRead: true,
      category: "Promotions",
      avatar: "A",
      avatarColor: "bg-green-500",
      content: "Enter to Win Free Tickets to Anubhav Bassi Live Comedy Show in Ahmedabad. Limited time offer!",
    },
    {
      id: 9,
      sender: "Google",
      senderEmail: "security@google.com",
      subject: "Security alert for tejas.patel408@gmail.com",
      preview: "This is a copy of a security alert...",
      time: "Yesterday",
      isStarred: false,
      isRead: true,
      category: "Updates",
      avatar: "G",
      avatarColor: "bg-red-500",
      content:
        "This is a copy of a security alert we sent to your recovery email. We detected a new sign-in to your Google Account.",
    },
    {
      id: 10,
      sender: "Canva",
      senderEmail: "hello@canva.com",
      subject: "Good news alert!",
      preview: "Five teachers get the surprise of a lifetime...",
      time: "Yesterday",
      isStarred: false,
      isRead: true,
      category: "Promotions",
      avatar: "C",
      avatarColor: "bg-purple-600",
      content:
        "Five teachers get the surprise of a lifetime with our new education initiative. Learn more about our teacher support program.",
    },
    {
      id: 11,
      sender: "Notion Team",
      senderEmail: "team@notion.so",
      subject: "A new device logged into your account",
      preview: "Review a recent login from a new device...",
      time: "Yesterday",
      isStarred: false,
      isRead: true,
      category: "Updates",
      avatar: "N",
      avatarColor: "bg-black",
      content: "Review a recent login from a new device. If this wasn't you, please secure your account immediately.",
    },
  ]

  const handleEmailClick = (email) => {
    setSelectedEmail(email)
    setIsEmailSheetOpen(true)
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Add user message to chat history
      setChatMessage("")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content with Resizable Panels */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - AI Chat */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <div className="h-full bg-slate-900 text-white flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <History className="size-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Chat History</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-slate-800 gap-2">
                    <Plus className="size-4" />
                    New chat
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-100 border border-slate-700"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Find, write, schedule, organize, ask anything..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 resize-none min-h-[40px] pr-20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-white">
                        <Paperclip className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-white">
                        <Mic className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-400 hover:text-white"
                        onClick={handleSendMessage}
                      >
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Press 1 for saved prompts</p>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Email Management */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <header className="h-16 border-b bg-background flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="size-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 flex-1 max-w-2xl mx-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <Mail className="size-4" />
                        {selectedFolder}
                        <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedFolder("Inbox")}>
                        <Mail className="size-4 mr-2" />
                        Inbox
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFolder("Sent")}>
                        <Send className="size-4 mr-2" />
                        Sent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFolder("Drafts")}>
                        <Edit className="size-4 mr-2" />
                        Drafts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFolder("Starred")}>
                        <Star className="size-4 mr-2" />
                        Starred
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFolder("Archive")}>
                        <Archive className="size-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      placeholder="Search emails, contacts, labels..."
                      className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="size-4" />
                  </Button>
                  <Button className="gap-2">
                    <Edit className="size-4" />
                    Compose
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="size-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Profile</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/">Sign out</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              {/* Email List */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  {/* Email Categories */}
                  <div className="border-b bg-muted/30">
                    <div className="flex items-center gap-6 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Primary</span>
                        <Badge variant="secondary" className="text-xs">
                          99+
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Todos</span>
                        <div className="size-2 rounded-full bg-blue-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* Starred Section */}
                  <div className="border-b bg-muted/20">
                    <div className="flex items-center gap-2 px-4 py-2">
                      <span className="text-sm font-medium">STARRED</span>
                      <div className="size-2 rounded-full bg-blue-500"></div>
                    </div>
                  </div>

                  {/* Email List */}
                  <ScrollArea className="flex-1">
                    <div className="divide-y">
                      {emails.slice(0, 3).map((email) => (
                        <div
                          key={email.id}
                          className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            !email.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""
                          }`}
                          onClick={() => handleEmailClick(email)}
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
                            >
                              <Star className={`size-4 ${email.isStarred ? "fill-current" : ""}`} />
                            </Button>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{email.time}</span>
                          </div>
                        </div>
                      ))}

                      {/* Last 7 Days Section */}
                      <div className="bg-muted/20 px-4 py-2 border-y">
                        <span className="text-sm font-medium text-muted-foreground">LAST 7 DAYS</span>
                      </div>

                      {emails.slice(3).map((email) => (
                        <div
                          key={email.id}
                          className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            !email.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""
                          }`}
                          onClick={() => handleEmailClick(email)}
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
                            >
                              <Star className={`size-4 ${email.isStarred ? "fill-current" : ""}`} />
                            </Button>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{email.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Right Sidebar - Toolkit */}
      <div className="w-[5vw] min-w-[60px] bg-muted/30 border-l flex flex-col items-center py-4 gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10">
                <Settings className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10">
                <Calendar className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Calendar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10">
                <Activity className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Activity Feed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Email Detail Sheet */}
      <Sheet open={isEmailSheetOpen} onOpenChange={setIsEmailSheetOpen}>
        <SheetContent side="right" className="w-[600px] sm:w-[700px] p-0">
          {selectedEmail && (
            <>
              <SheetHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsEmailSheetOpen(false)}>
                      <X className="size-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Archive className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Star className={`size-4 ${selectedEmail.isStarred ? "text-yellow-500 fill-current" : ""}`} />
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
                    <Button variant="ghost" size="icon">
                      <Settings className="size-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  <SheetTitle className="text-xl font-semibold mb-4">{selectedEmail.subject}</SheetTitle>

                  <div className="flex items-center gap-3 mb-6">
                    <Avatar className="size-10">
                      <AvatarFallback className={`${selectedEmail.avatarColor} text-white`}>
                        {selectedEmail.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{selectedEmail.sender}</div>
                      <div className="text-sm text-muted-foreground">&lt;{selectedEmail.senderEmail}&gt;</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{selectedEmail.time}</div>
                  </div>

                  {/* Google Logo for Google emails */}
                  {selectedEmail.sender.includes("Google") && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-center mb-4">
                        <div className="text-4xl font-bold">
                          <span className="text-blue-500">G</span>
                          <span className="text-red-500">o</span>
                          <span className="text-yellow-500">o</span>
                          <span className="text-blue-500">g</span>
                          <span className="text-green-500">l</span>
                          <span className="text-red-500">e</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-blue-600 mb-2">Action required</h3>
                        <Button variant="link" className="text-blue-600">
                          Go to my console »
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedEmail.content || selectedEmail.preview}
                    </div>
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
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
