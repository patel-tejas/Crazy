// app/dashboard/page.tsx
"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import Chat from "@/components/Chat"
import MailSection from "@/components/MailSection"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Activity, Calendar1, Settings } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Main Content with Resizable Panels */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - AI Chat */}
          <ResizablePanel defaultSize={30} minSize={20} className="min-w-[300px]">
            <Chat />
          </ResizablePanel>

          <ResizableHandle withHandle className="z-10" />

          {/* Right Panel - Email Management */}
          <ResizablePanel defaultSize={70} minSize={30}>
            <MailSection />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Right Sidebar - Toolkit */}
      <div className="bg-muted/30 border-l flex flex-col items-center py-4 gap-4 z-20">
        {/* ... (keep toolkit buttons unchanged) */}
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
                <Calendar1 className="size-5" />
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
    </div>
  )
} 