"use client"

import React, { useState, useRef, useCallback } from 'react'
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
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import axios from 'axios';

const MailSection = () => {
    const { user } = useUser();
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [isFullView, setIsFullView] = useState(false);
    const [hoveredEmailId, setHoveredEmailId] = useState<string | null>(null);
    const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
    const labelInputRef = useRef<HTMLInputElement>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: ''
    });
    const [isSending, setIsSending] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isCategorizing, setIsCategorizing] = useState(false);

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

    const handleEmailClick = useCallback((email: any) => {
        setSelectedEmail(email);
        if (!email.isRead) {
            markAsRead(email.id);
        }
    }, [markAsRead]);

    const handleCreateLabel = useCallback(() => {
        if (newLabelName.trim() && customLabels.length < 5) {
            addLabel(newLabelName.trim());
            setNewLabelName("");
            setShowLabelCreator(false);
        }
    }, [newLabelName, customLabels, addLabel]);

    const handleAddLabelToEmail = useCallback((emailId: string, labelId: string) => {
        addEmailLabel(emailId, labelId);
        setSelectedLabelId(null);
    }, [addEmailLabel]);

    const handleSnooze = useCallback((emailId: string) => {
        console.log(`Snoozing email ${emailId}`);
    }, []);

    const handleAddToTodo = useCallback((emailId: string) => {
        console.log(`Adding email ${emailId} to todo`);
    }, []);

    const handleFolderChange = useCallback((folderId: string) => {
        setSelectedFolder(folderId);
        setSelectedCategory(null);
    }, [setSelectedFolder, setSelectedCategory]);

    // Get label name by ID
    const getLabelName = useCallback((labelId: string) => {
        const categoryMap: Record<string, string> = {
            'CATEGORY_UPDATES': 'Updates',
            'CATEGORY_PROMOTIONS': 'Promotions',
            'CATEGORY_SOCIAL': 'Social',
            'CATEGORY_FORUMS': 'Forums',
            'CATEGORY_PRIMARY': 'Primary'
        };

        if (labelId in categoryMap) return categoryMap[labelId];

        const allLabels = [...labels, ...customLabels];
        const label = allLabels.find(l => l.id === labelId);
        // console.log(`Label ID: ${labelId}, Found Label:`, label);

        return label?.name.replace('CATEGORY_', '') || labelId.replace('CATEGORY_', '');
    }, [labels, customLabels]);

    // Get badge color for label
    const getBadgeColor = useCallback((labelId: string) => {
        const colorMap: Record<string, string> = {
            'CATEGORY_SOCIAL': 'bg-blue-100 text-blue-800 border border-blue-200',
            'CATEGORY_PROMOTIONS': 'bg-green-100 text-green-800 border border-green-200',
            'CATEGORY_UPDATES': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            'CATEGORY_FORUMS': 'bg-purple-100 text-purple-800 border border-purple-200',
            'CATEGORY_PRIMARY': 'bg-gray-100 text-gray-800 border border-gray-200'
        };
        return colorMap[labelId] || 'bg-gray-100 text-gray-800 border border-gray-200';
    }, []);

    const handleComposeChange = useCallback((field: string, value: string) => {
        setComposeData(prev => ({ ...prev, [field]: value }));
    }, []);

   const handleCategorizeEmails = useCallback(async () => {
    if (!gmailEmails.length) {
        setToast({ message: 'No emails to categorize', type: 'error' });
        return;
    }
    
    if (!customLabels.length) {
        setToast({ message: 'Create at least one label first', type: 'error' });
        return;
    }

    setIsCategorizing(true);
    const BATCH_SIZE = 5; // Define batch size
    let totalCategorized = 0;
    let errorOccurred = false;

    try {
        // Prepare categories once (same for all batches)
        const categories = customLabels.map(label => label.name);
        
        // Process emails in batches
        for (let i = 0; i < gmailEmails.length; i += BATCH_SIZE) {
            if (errorOccurred) break;
            
            const batch = gmailEmails.slice(i, i + BATCH_SIZE);
            const payload = {
                emails: batch.map(email => [
                    email.content || email.preview,
                    parseInt(email.id) || Date.now()
                ]),
                categories
            };

            const response = await axios.post(
                'https://0916-2402-a00-408-2632-3059-beb-8821-7452.ngrok-free.app/classify',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    timeout: 30000,
                    withCredentials: false
                }
            );

            // Process batch results
            let batchCategorized = 0;
            for (const classification of response.data.classifications) {
                const emailId = classification.id.toString();
                const label = customLabels.find(l => l.name === classification.category);

                if (label) {
                    addEmailLabel(emailId, label.id);
                    batchCategorized++;
                }
            }
            totalCategorized += batchCategorized;
        }

        setToast({
            message: `Categorized ${totalCategorized} emails`,
            type: 'success'
        });
    } catch (error: any) {
        errorOccurred = true;
        let errorMessage = 'Failed to categorize emails';
        
        if (axios.isAxiosError(error)) {
            if (error.response) {
                errorMessage = `API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
            } else if (error.request) {
                errorMessage = 'No response from classification service';
            } else {
                errorMessage = `Request error: ${error.message}`;
            }
        } else {
            errorMessage = error.message || errorMessage;
        }

        setToast({
            message: errorMessage,
            type: 'error'
        });
    } finally {
        setIsCategorizing(false);
    }
}, [gmailEmails, customLabels, addEmailLabel]);

    const sendEmail = useCallback(async () => {
        if (!composeData.to || !composeData.subject) {
            setToast({ message: 'Recipient and subject are required', type: 'error' });
            return;
        }

        setIsSending(true);
        try {
            const email = [
                `To: ${composeData.to}`,
                `Subject: ${composeData.subject}`,
                'Content-Type: text/plain; charset=utf-8',
                '',
                composeData.body
            ].join('\n');

            const base64EncodedEmail = btoa(email)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await window.gapi.client.gmail.users.messages.send({
                userId: 'me',
                resource: { raw: base64EncodedEmail }
            });

            setToast({ message: 'Email sent successfully!', type: 'success' });
            setTimeout(() => {
                setIsComposeOpen(false);
                setComposeData({ to: '', subject: '', body: '' });
            }, 1500);
        } catch (error) {
            console.error('Send email error:', error);
            setToast({ message: 'Failed to send email', type: 'error' });
        } finally {
            setIsSending(false);
        }
    }, [composeData]);

    // Memoized Email Item Component
    const EmailItem = React.memo(({
        email,
        style,
        onEmailClick,
        onToggleStar,
        onMarkAsRead,
        onMarkAsUnread,
        onDelete,
        getBadgeColor,
        getLabelName,
        setHoveredEmailId
    }: {
        email: any,
        style: React.CSSProperties,
        onEmailClick: (email: any) => void,
        onToggleStar: (emailId: string, isStarred: boolean) => void,
        onMarkAsRead: (emailId: string) => void,
        onMarkAsUnread: (emailId: string) => void,
        onDelete: (emailId: string) => void,
        getBadgeColor: (labelId: string) => string,
        getLabelName: (labelId: string) => string,
        setHoveredEmailId: (id: string | null) => void
    }) => {
        // Get the first non-primary label to display as badge
        const nonPrimaryLabel = email.labelIds?.find((id: string) =>
            id !== 'CATEGORY_PRIMARY' &&
            !['INBOX', 'UNREAD', 'STARRED', 'IMPORTANT'].includes(id)
        );

        return (
            <div
                style={style}
                className={`group flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer relative ${!email.isRead ? "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/50" : ""
                    }`}
                onClick={() => onEmailClick(email)}
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
                    <div className="flex items-baseline justify-between">
                        <p className={`text-sm truncate ${!email.isRead ? "font-bold" : ""}`}>
                            {email.sender}
                        </p>
                        <div className='flex items-center gap-5'>

                            {nonPrimaryLabel && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadgeColor(nonPrimaryLabel)}`}>
                                    {getLabelName(nonPrimaryLabel)}
                                </span>
                            )}
                            <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                                {email.time}
                            </div>
                        </div>

                    </div>
                    <div className="flex items-center gap-2 justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                            {email.subject.length > 50 ? `${email.subject.slice(0, 50)}...` : email.subject}
                        </p>

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
                            onToggleStar(email.id, email.isStarred);
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
                            email.isRead ? onMarkAsUnread(email.id) : onMarkAsRead(email.id);
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
                            onDelete(email.id);
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
        );
    });

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
                    <Button
                        className="gap-2 bg-yellow-300 hover:bg-yellow-500"
                        onClick={handleCategorizeEmails}
                        
                    >
                        {isCategorizing ? (
                            <RefreshCw className="size-4 animate-spin" />
                        ) : (
                            <Edit className="size-4" />
                        )}
                        {isCategorizing ? 'Categorizing...' : 'Categorize'}
                    </Button>
                    <Button className="gap-2" onClick={() => setIsComposeOpen(true)}>
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

            {/* Toast notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold">New Message</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)}>
                                <X className="size-4" />
                            </Button>
                        </div>

                        <div className="p-4 flex-1 flex flex-col gap-4">
                            <Input
                                placeholder="Recipients"
                                value={composeData.to}
                                onChange={(e) => handleComposeChange('to', e.target.value)}
                            />
                            <Input
                                placeholder="Subject"
                                value={composeData.subject}
                                onChange={(e) => handleComposeChange('subject', e.target.value)}
                            />
                            <textarea
                                className="flex-1 p-2 border rounded-md min-h-[300px]"
                                value={composeData.body}
                                onChange={(e) => handleComposeChange('body', e.target.value)}
                            />
                        </div>

                        <div className="p-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={sendEmail} disabled={isSending}>
                                {isSending ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : 'Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="flex-1">
                                {filteredEmails.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No emails found.</p>
                                    </div>
                                ) : (
                                    <>
                                        <AutoSizer>
                                            {({ height, width }) => (
                                                <List
                                                    height={height}
                                                    width={width}
                                                    itemCount={filteredEmails.length}
                                                    itemSize={80}
                                                    itemData={filteredEmails}
                                                >
                                                    {({ index, style }) => (
                                                        <EmailItem
                                                            key={filteredEmails[index].id}
                                                            email={filteredEmails[index]}
                                                            style={style}
                                                            onEmailClick={handleEmailClick}
                                                            onToggleStar={toggleStar}
                                                            onMarkAsRead={markAsRead}
                                                            onMarkAsUnread={markAsUnread}
                                                            onDelete={deleteEmail}
                                                            getBadgeColor={getBadgeColor}
                                                            getLabelName={getLabelName}
                                                            setHoveredEmailId={setHoveredEmailId}
                                                        />
                                                    )}
                                                </List>
                                            )}
                                        </AutoSizer>


                                    </>
                                )}
                            </div>

                            {/* Load More Button */}
                            {
                                nextPageToken && (
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