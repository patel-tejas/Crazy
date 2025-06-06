"use client"

import React, { useState, useRef } from 'react'
import { SignOutButton, useUser } from "@clerk/nextjs"
import { Mail, Search, RefreshCw, ChevronDown, Star, Archive, Send, Edit, X, Trash2, MoreHorizontal, Share, Settings, Reply, ReplyAll, Forward, Shield, CheckCircle, ChevronRight, ChevronLeft, Maximize, Minimize, Plus, Check, Bookmark, BookOpen, Clock, Bell, Mailbox, Inbox, AlertCircle, FileText, Tag, Folder, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable'
import { Separator } from './ui/separator'
import DOMPurify from 'dompurify';
import { useEmailContext } from '@/context/EmailContext';
import Image from 'next/image'

const MailSection = () => {
    const { user } = useUser();
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [isFullView, setIsFullView] = useState(false);
    const [hoveredEmailId, setHoveredEmailId] = useState<string | null>(null);
    const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
    const labelInputRef = useRef<HTMLInputElement>(null);

    // Use context for email data and functions
    const {
        isGmailAuthorized,
        isLoading,
        isLoadingMore,
        gmailEmails,
        labels,
        customLabels,
        error,
        nextPageToken,
        refreshEmails,
        loadMoreEmails,
        markAsRead,
        markAsUnread,
        toggleStar,
        deleteEmail,
        handleGmailAuth,
        revokeGmailAccess,
        addLabel,
        removeLabel,
        addEmailLabel,
        filteredEmails,
        setSearchQuery,
        setSelectedFolder,
        setSelectedCategory,
        selectedFolder,
        selectedCategory
    } = useEmailContext();

    const [newLabelName, setNewLabelName] = useState("");
    const [showLabelCreator, setShowLabelCreator] = useState(false);

    const categories = [
        { id: 'CATEGORY_PRIMARY', name: 'Primary', icon: <Inbox className="size-4" /> },
        { id: 'CATEGORY_SOCIAL', name: 'Social', icon: <Users className="size-4" /> },
        { id: 'CATEGORY_PROMOTIONS', name: 'Promotions', icon: <Tag className="size-4" /> },
        { id: 'CATEGORY_UPDATES', name: 'Updates', icon: <AlertCircle className="size-4" /> },
        { id: 'CATEGORY_FORUMS', name: 'Forums', icon: <FileText className="size-4" /> }
    ];

    const folders = [
        { id: 'All', name: 'All Mail', icon: <Mailbox className="size-4" /> },
        { id: 'INBOX', name: 'Inbox', icon: <Inbox className="size-4" /> },
        { id: 'STARRED', name: 'Starred', icon: <Star className="size-4" /> },
        { id: 'SENT', name: 'Sent', icon: <Send className="size-4" /> },
        { id: 'DRAFT', name: 'Drafts', icon: <Edit className="size-4" /> },
        { id: 'IMPORTANT', name: 'Important', icon: <Folder className="size-4" /> },
        { id: 'TRASH', name: 'Trash', icon: <Trash2 className="size-4" /> },
        { id: 'SPAM', name: 'Spam', icon: <AlertCircle className="size-4" /> }
    ];

    const handleEmailClick = (email: any) => {
        setSelectedEmail(email);
        // Mark as read when opened
        if (!email.isRead) {
            markAsRead(email.id);
        }
    };

    const handleCreateLabel = () => {
        if (newLabelName.trim() && customLabels.length < 5) {
            addLabel(newLabelName.trim());
            setNewLabelName("");
            setShowLabelCreator(false);
        }
    };

    const handleAddLabelToEmail = (emailId: string, labelId: string) => {
        addEmailLabel(emailId, labelId);
        setSelectedLabelId(null);
    };

    const handleSnooze = (emailId: string) => {
        // Dummy function for snooze
        console.log(`Snoozing email ${emailId}`);
    };

    const handleAddToTodo = (emailId: string) => {
        // Dummy function for adding to todo
        console.log(`Adding email ${emailId} to todo`);
    };

    const handleFolderChange = (folderId: string) => {
        setSelectedFolder(folderId);
        // Reset category when switching folders
        setSelectedCategory(null);
    };

    // Get label name by ID
    const getLabelName = (labelId: string) => {
        const allLabels = [...labels, ...customLabels];
        const label = allLabels.find(l => l.id === labelId);
        return label?.name || labelId.replace('CATEGORY_', '');
    };

    // Get badge color for label
    const getBadgeColor = (labelId: string) => {
        if (labelId.startsWith('CATEGORY_')) {
            switch (labelId) {
                case 'CATEGORY_SOCIAL': return 'bg-blue-100 text-blue-800';
                case 'CATEGORY_PROMOTIONS': return 'bg-green-100 text-green-800';
                case 'CATEGORY_UPDATES': return 'bg-yellow-100 text-yellow-800';
                case 'CATEGORY_FORUMS': return 'bg-purple-100 text-purple-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className='h-full w-full flex flex-col overflow-hidden'>
            {/* Header */}
            <header className="h-16 border-b bg-background flex items-center justify-between px-4 py-2">
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
                                {folders.find(f => f.id === selectedFolder)?.name || 'Inbox'}
                                <ChevronDown className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                            <DropdownMenuLabel>Folders</DropdownMenuLabel>
                            {folders.map((folder) => (
                                <DropdownMenuItem
                                    key={folder.id}
                                    onClick={() => handleFolderChange(folder.id)}
                                >
                                    {folder.icon}
                                    <span className="ml-2">{folder.name}</span>
                                </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel>Categories</DropdownMenuLabel>
                            {categories.map((category) => (
                                <DropdownMenuItem
                                    key={category.id}
                                    onClick={() => {
                                        setSelectedFolder('INBOX');
                                        setSelectedCategory(category.id);
                                    }}
                                >
                                    {category.icon}
                                    <span className="ml-2">{category.name}</span>
                                </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel>Labels</DropdownMenuLabel>
                            {customLabels.map(label => (
                                <DropdownMenuItem
                                    key={label.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                                        {label.name}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 hover:bg-transparent"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeLabel(label.id);
                                        }}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </DropdownMenuItem>
                            ))}
                            <div className="px-2 py-1">
                                {showLabelCreator ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={newLabelName}
                                            onChange={(e) => setNewLabelName(e.target.value)}
                                            placeholder="Label name"
                                            className="h-8"
                                            ref={labelInputRef}
                                            autoFocus
                                        />
                                        <Button
                                            size="sm"
                                            disabled={!newLabelName.trim() || customLabels.length >= 5}
                                            onClick={handleCreateLabel}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start"
                                        disabled={customLabels.length >= 5}
                                        onClick={() => setShowLabelCreator(true)}
                                    >
                                        <Plus className="size-4 mr-2" />
                                        Create new label
                                    </Button>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                        <Input
                            placeholder="Search emails, contacts, labels..."
                            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={refreshEmails}>
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
                                    <AvatarImage src={user?.imageUrl} alt="User" />
                                    <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            {isGmailAuthorized && (
                                <DropdownMenuItem onClick={revokeGmailAccess}>
                                    Disconnect Gmail
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className='w-full'>
                                <SignOutButton />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main content area */}
            <ResizablePanelGroup direction="horizontal" className="h-full flex-1 overflow-hidden">

                {/* Email List Section */}
                <ResizablePanel defaultSize={40} minSize={30} className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Loading your emails...</p>
                            </div>
                        </div>
                    ) : !isGmailAuthorized ? (
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
                                    onClick={handleGmailAuth}
                                    className="w-full"
                                >
                                    Connect Gmail Account
                                </Button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {/* Starred Section */}
                            <div className="border-b bg-muted/20">
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <span className="text-sm font-medium">STARRED</span>
                                    {filteredEmails.filter((e: any) => e.isStarred).length > 0 && (
                                        <div className="size-2 rounded-full bg-yellow-500"></div>
                                    )}
                                </div>
                            </div>

                            {/* Email List */}
                            <ScrollArea className="flex-1">
                                <div className="">
                                    {filteredEmails.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No emails found.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {filteredEmails.map((email: any) => {
                                                // Get the first non-primary label to display as badge
                                                const nonPrimaryLabel = email.labelIds?.find((id: string) => 
                                                    id !== 'CATEGORY_PRIMARY' && 
                                                    !['INBOX', 'UNREAD', 'STARRED', 'IMPORTANT'].includes(id)
                                                );
                                                
                                                return (
                                                <div
                                                    key={email.id}
                                                    className={`group flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer relative ${!email.isRead ? "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/50" : ""
                                                        }`}
                                                    onClick={() => handleEmailClick(email)}
                                                    onMouseEnter={() => setHoveredEmailId(email.id)}
                                                    onMouseLeave={() => setHoveredEmailId(null)}
                                                >
                                                    <Avatar className="size-8 flex-shrink-0">
                                                        <Image 
                                                            alt='User_Avtar' 
                                                            height={32} 
                                                            width={32} 
                                                            src={email.avatar} 
                                                            className={`${email.avatarColor} text-white text-sm`}
                                                        />
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline">
                                                            <p className={`text-sm truncate ${!email.isRead ? "font-bold" : ""}`}>
                                                                {email.sender}
                                                            </p>
                                                            <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                                                                {email.time}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {email.subject.length > 50 ? `${email.subject.slice(0, 50)}...` : email.subject}
                                                            </p>
                                                            {nonPrimaryLabel && (
                                                                <span className={`text-xs px-1.5 py-0.5 rounded ${getBadgeColor(nonPrimaryLabel)}`}>
                                                                    {getLabelName(nonPrimaryLabel)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Hover Actions */}
                                                    <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 bg-background rounded-lg shadow-md p-1 transition-opacity ${hoveredEmailId === email.id ? 'opacity-100' : 'opacity-0'}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 hover:bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleStar(email.id, email.isStarred);
                                                            }}
                                                        >
                                                            <Star className={`size-4 ${email.isStarred ? "text-yellow-500 fill-current" : "text-muted-foreground"}`} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 hover:bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                email.isRead ? markAsUnread(email.id) : markAsRead(email.id);
                                                            }}
                                                        >
                                                            {email.isRead ? (
                                                                <Mail className="size-4 text-muted-foreground" />
                                                            ) : (
                                                                <BookOpen className="size-4 text-blue-500" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 hover:bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSnooze(email.id);
                                                            }}
                                                        >
                                                            <Clock className="size-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 hover:bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddToTodo(email.id);
                                                            }}
                                                        >
                                                            <Bookmark className="size-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 hover:bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteEmail(email.id);
                                                            }}
                                                        >
                                                            <Trash2 className="size-4 text-muted-foreground" />
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-6 hover:bg-muted">
                                                                    <MoreHorizontal className="size-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Add Label</DropdownMenuLabel>
                                                                {customLabels.map(label => (
                                                                    <DropdownMenuItem
                                                                        key={label.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleAddLabelToEmail(email.id, label.id);
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                                                                            {label.name}
                                                                        </div>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            )})}

                                            {/* Load More Button */}
                                            {nextPageToken && (
                                                <div className="py-4 flex justify-center">
                                                    <Button
                                                        variant="outline"
                                                        onClick={loadMoreEmails}
                                                        disabled={isLoadingMore}
                                                    >
                                                        {isLoadingMore ? (
                                                            <>
                                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            "Load More"
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </ResizablePanel>

                {selectedEmail && (
                    <>
                        <ResizableHandle withHandle className="bg-border" />
                        <ResizablePanel defaultSize={60} minSize={40} className="bg-background border-l flex flex-col">
                            <div className="flex flex-col h-full">
                                {/* Detail header */}
                                <div className="p-2 flex items-center justify-between bg-background">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedEmail(null)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsFullView(!isFullView)}
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

                                {/* Email content */}
                                <ScrollArea className="flex-1">
                                    <div className="p-6 max-w-4xl mx-auto w-full">
                                        <h2 className="text-xl font-semibold mb-4">{selectedEmail.subject}</h2>

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
                                        {selectedEmail.sender.toLowerCase().includes("google") && (
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
                                                    <h3 className="text-lg font-semibold text-blue-600 mb-2">Google Account</h3>
                                                    <Button variant="link" className="text-blue-600">
                                                        View in Gmail »
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="prose max-w-none dark:prose-invert prose-headings:font-sans prose-p:font-sans prose-li:font-sans prose-a:text-blue-600 hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-400 prose-img:rounded-lg prose-img:shadow-md">
                                            <div
                                                className="email-content text-base leading-relaxed"
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurify.sanitize(selectedEmail.content || selectedEmail.preview)
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
                                            <Button variant="outline" size="sm" className="gap-2 ml-auto">
                                                <BookOpen className="size-4" />
                                                Add to To-Do
                                            </Button>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    )
}

export default MailSection
