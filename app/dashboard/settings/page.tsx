"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    ChevronLeft,
    User,
    Eye,
    Mail,
    Palette,
    Edit,
    Bell,
    Sparkles,
    Zap,
    Tag,
    Filter,
    Calendar,
    MoreHorizontal,
    Users,
    CreditCard,
    UserPlus,
    Bot,
    Star,
    Download,
    ArrowRight,
    ChevronDown,
} from "lucide-react"

interface SettingsProps {
    onClose?: () => void
    className?: string
}

export default function Settings({ onClose, className = "" }: SettingsProps) {
    const [activeSection, setActiveSection] = useState("overview")

    const menuItems = [
        { id: "account", label: "My account", icon: User },
        { id: "overview", label: "Overview", icon: Eye },
        { id: "inbox", label: "Inbox setup", icon: Mail },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "compose", label: "Compose", icon: Edit },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "ai-personalization", label: "AI Personalization", icon: Sparkles },
        { id: "ai-integrations", label: "AI Integrations", icon: Zap, badge: "BETA" },
        { id: "labels", label: "Labels", icon: Tag },
        { id: "filters", label: "Filters", icon: Filter },
        { id: "calendar", label: "Calendar", icon: Calendar },
        { id: "miscellaneous", label: "Miscellaneous", icon: MoreHorizontal },
    ]

    const teamItems = [
        { id: "create-team", label: "Create team", icon: Users, highlight: true },
        { id: "members", label: "Members & Billing", icon: CreditCard },
        { id: "collaboration", label: "Team collaboration", icon: UserPlus },
        { id: "team-ai", label: "Team AI Assistant", icon: Bot },
    ]

    const gettingStartedCards = [
        {
            icon: Mail,
            title: "Set up your Inbox",
            description: "Configure when and how threads appear in your inbox",
            action: "Inbox setup settings",
            actionIcon: ArrowRight,
        },
        {
            icon: Sparkles,
            title: "Personalize your AI Assistant",
            description: "Tailor the AI to your specific needs and common workflows",
            action: "AI Assistant settings",
            actionIcon: ArrowRight,
        },
        {
            icon: Download,
            title: "Download apps",
            description: "Stay organized everywhere with desktop, iOS & Android apps",
            action: "Download apps",
            actionIcon: ArrowRight,
        },
        {
            icon: Bell,
            title: "Enable notifications",
            description: "Push notifications are not enabled for this browser / device",
            action: "Turn on",
            actionIcon: null,
            actionVariant: "destructive" as const,
        },
        {
            icon: Star,
            title: "Upgrade your account",
            description: "Unlock premium features and get priority support",
            action: null,
            actionIcon: null,
        },
    ]

    return (
        <div className={`h-full bg-slate-900 text-white flex ${className}`}>
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <ChevronLeft className="size-4" />
                    </Button>
                    <h1 className="text-lg font-semibold">Settings</h1>
                </div>

                {/* Menu Items */}
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {menuItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activeSection === item.id ? "secondary" : "ghost"}
                                className={`w-full justify-start gap-3 mb-1 ${activeSection === item.id
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                                    }`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <item.icon className="size-4" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.badge && (
                                    <Badge variant="secondary" className="text-xs bg-blue-600 text-white">
                                        {item.badge}
                                    </Badge>
                                )}
                            </Button>
                        ))}

                        {/* Team Section */}
                        <div className="mt-6 mb-2">
                            <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Team</div>
                        </div>
                        {teamItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={item.highlight ? "secondary" : "ghost"}
                                className={`w-full justify-start gap-3 mb-1 ${item.highlight
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                                    }`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <item.icon className="size-4" />
                                <span className="flex-1 text-left">{item.label}</span>
                            </Button>
                        ))}

                        <div className="p-2 mt-4">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Start free trial</Button>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        {/* User Profile Section */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Avatar className="size-16">
                                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Tejas Patel" />
                                    <AvatarFallback className="bg-slate-700 text-white text-lg">TP</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-semibold">Tejas Patel</h2>
                                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                            FREE
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400">pateltejas.2005@gmail.com</p>
                                    <Button variant="ghost" className="text-blue-400 hover:text-blue-300 p-0 h-auto mt-1">
                                        Add account
                                        <ChevronDown className="size-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                                Make default mail app
                            </Button>
                        </div>

                        {/* Free Plan Banner */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Star className="size-5 text-blue-400" />
                                <div>
                                    <span className="font-medium">You are on the Free plan.</span>
                                    <span className="text-slate-400 ml-1">
                                        Upgrade to unlock AI search, personalized AI writing, multi-account and more
                                    </span>
                                </div>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Start free trial</Button>
                        </div>

                        {/* Getting Started Section */}
                        <div>
                            <h3 className="text-xl font-semibold mb-6">Getting started</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {gettingStartedCards.map((card, index) => (
                                    <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-slate-700 rounded-lg">
                                                    <card.icon className="size-5 text-slate-300" />
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-white text-base mb-1">{card.title}</CardTitle>
                                                    <CardDescription className="text-slate-400 text-sm">{card.description}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        {card.action && (
                                            <CardContent className="pt-0">
                                                <Button
                                                    variant={card.actionVariant || "ghost"}
                                                    className={`text-sm gap-2 ${card.actionVariant === "destructive"
                                                            ? "bg-red-600 hover:bg-red-700 text-white"
                                                            : "text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                                                        }`}
                                                >
                                                    {card.action}
                                                    {card.actionIcon && <card.actionIcon className="size-3" />}
                                                </Button>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
