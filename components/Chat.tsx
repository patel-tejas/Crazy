import React, { useState } from 'react'
import { ResizablePanel } from './ui/resizable'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Button } from './ui/button'
import { History, Mic, Paperclip, Plus, Send } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { Textarea } from './ui/textarea'
import { chatHistory } from "@/dummy_data/dashboard"

const Chat = () => {
    const [chatMessage, setChatMessage] = useState("")

    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            // Add user message to chat history
            setChatMessage("")
        }
    }

    return (
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
                                    className={`max-w-[80%] rounded-lg p-3 ${message.type === "user"
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
    )
}

export default Chat