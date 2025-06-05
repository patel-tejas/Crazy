"use client"
// Extend the Window interface for gapi and google.accounts.oauth2
declare global {
    interface Window {
        gapi?: any;
        google?: any;
    }
}

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SignOutButton, useUser } from "@clerk/nextjs"
import { Mail, Search, RefreshCw, ChevronDown, Star, Archive, Send, Edit, X, Trash2, MoreHorizontal, Share, Settings, Reply, ReplyAll, Forward, Shield, CheckCircle, ChevronRight, ChevronLeft, Maximize, Minimize, Plus, Check, Bookmark, BookOpen, Filter, MailPlus, Save, Paperclip, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable'
import { Separator } from './ui/separator'
import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

// Gmail API configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '459976879104-gcljq7m0akm9t98iqt3sneuhlvh5cqtv.apps.googleusercontent.com'
const API_KEY = process.env.NEXT_PUBLIC_GMAIL_API_KEY || 'AIzaSyCnaJttbbwDFC9yD6myRxwmgF4sGY2TJig'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.send'

// Custom hook for Gmail integration logic
const useGmail = () => {
    const [isGmailAuthorized, setIsGmailAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [gmailEmails, setGmailEmails] = useState<GmailEmail[]>([])
    const [totalEmails, setTotalEmails] = useState(0)
    const [gapiLoaded, setGapiLoaded] = useState(false)
    const [gisLoaded, setGisLoaded] = useState(false)
    const [tokenClient, setTokenClient] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [labels, setLabels] = useState<any[]>([])
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)
    const [currentLabelId, setCurrentLabelId] = useState('INBOX')
    const [threads, setThreads] = useState<any[]>([])
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
    const [drafts, setDrafts] = useState<GmailEmail[]>([])
    const { toast } = useToast()

    // Initialize Google APIs
    useEffect(() => {
        const initializeGoogleAPIs = () => {
            // Load GAPI
            if (typeof window !== 'undefined' && window.gapi) {
                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({
                            apiKey: API_KEY,
                            discoveryDocs: [DISCOVERY_DOC],
                        })
                        setGapiLoaded(true)
                    } catch (error) {
                        console.error('GAPI client init error:', error)
                        setError('Failed to initialize Google API client')
                    }
                })
            }

            // Load GIS
            if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
                try {
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: '',
                    })
                    setTokenClient(client)
                    setGisLoaded(true)
                } catch (error) {
                    console.error('GIS init error:', error)
                    setError('Failed to initialize Google Identity Services')
                }
            }
        }

        const loadGoogleScripts = () => {
            // Only load scripts if not already present
            if (!document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
                const gapiScript = document.createElement('script')
                gapiScript.src = 'https://apis.google.com/js/api.js'
                gapiScript.async = true
                gapiScript.defer = true
                gapiScript.onload = initializeGoogleAPIs
                document.head.appendChild(gapiScript)
            }

            if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
                const gisScript = document.createElement('script')
                gisScript.src = 'https://accounts.google.com/gsi/client'
                gisScript.async = true
                gisScript.defer = true
                gisScript.onload = initializeGoogleAPIs
                document.head.appendChild(gisScript)
            }

            // If scripts already exist, initialize
            if (window.gapi && window.google?.accounts?.oauth2) {
                initializeGoogleAPIs()
            }
        }

        loadGoogleScripts()
    }, [])

    // Check existing authorization
    useEffect(() => {
        if (gapiLoaded && gisLoaded) {
            checkExistingAuth()
        }
    }, [gapiLoaded, gisLoaded])

    const checkExistingAuth = useCallback(() => {
        try {
            // Check localStorage for existing token
            const storedToken = localStorage.getItem('gmail_token')
            if (storedToken) {
                window.gapi.client.setToken(JSON.parse(storedToken))
                setIsGmailAuthorized(true)
                fetchGmailData()
            } else {
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Error checking existing auth:', error)
            setIsLoading(false)
        }
    }, [])

    const handleGmailAuth = useCallback(() => {
        if (!tokenClient) {
            setError('Google services not initialized')
            return
        }

        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                setError('Authorization failed: ' + resp.error)
                return
            }
            // Store the token in localStorage
            localStorage.setItem('gmail_token', JSON.stringify(resp))
            setIsGmailAuthorized(true)
            await fetchGmailData()
        }

        tokenClient.requestAccessToken({ prompt: 'consent' })
    }, [tokenClient])

    const getFullEmailBody = useCallback((payload: any): string => {
        if (!payload) return ''

        // Prefer HTML content if available
        const findHtmlPart = (parts: any[]): any => {
            for (const part of parts) {
                if (part.mimeType === 'text/html') {
                    return part
                }
                if (part.parts) {
                    const result = findHtmlPart(part.parts)
                    if (result) return result
                }
            }
            return null
        }

        const findTextPart = (parts: any[]): any => {
            for (const part of parts) {
                if (part.mimeType === 'text/plain') {
                    return part
                }
                if (part.parts) {
                    const result = findTextPart(part.parts)
                    if (result) return result
                }
            }
            return null
        }

        if (payload.parts) {
            const htmlPart = findHtmlPart(payload.parts)
            if (htmlPart) {
                return htmlPart.body?.data || ''
            }

            const textPart = findTextPart(payload.parts)
            if (textPart) {
                return textPart.body?.data || ''
            }
        }
        return payload.body?.data || ''
    }, [])

    const decodeEmailBody = useCallback((data: string): string => {
        try {
            if (!data) return ''
            // Convert from Base64 URL safe format
            const sanitized = data.replace(/-/g, '+').replace(/_/g, '/')
            const decoded = atob(sanitized)
            return decoded
        } catch (error) {
            console.error('Decoding error:', error)
            return 'Could not decode email content'
        }
    }, [])

    const fetchLabels = useCallback(async () => {
        try {
            const response = await window.gapi.client.gmail.users.labels.list({
                userId: 'me'
            })
            setLabels(response.result.labels || [])
        } catch (error) {
            console.error('Failed to fetch labels:', error)
        }
    }, [])

    const createLabel = useCallback(async (labelName: string, backgroundColor?: string) => {
        try {
            const response = await window.gapi.client.gmail.users.labels.create({
                userId: 'me',
                resource: {
                    name: labelName,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show',
                    color: backgroundColor ? {
                        backgroundColor,
                        textColor: '#ffffff'
                    } : undefined
                }
            })
            
            // Update labels list
            await fetchLabels()
            
            toast({
                title: "Label created",
                description: `Label "${labelName}" was successfully created`,
            })
            
            return response.result
        } catch (error) {
            console.error('Failed to create label:', error)
            toast({
                title: "Error creating label",
                description: error.message,
                variant: "destructive"
            })
        }
    }, [fetchLabels, toast])

    const fetchDrafts = useCallback(async () => {
        try {
            const response = await window.gapi.client.gmail.users.drafts.list({
                userId: 'me'
            })
            
            if (response.result.drafts) {
                const draftMessages = await Promise.all(
                    response.result.drafts.map((draft: any) => 
                        window.gapi.client.gmail.users.drafts.get({
                            userId: 'me',
                            id: draft.id,
                            format: 'full'
                        })
                    )
                )
                
                const formattedDrafts = draftMessages.map((res: any) => {
                    const draft = res.result
                    const message = draft.message
                    const headers: Record<string, string> = (message.payload.headers || []).reduce(
                        (acc: Record<string, string>, header: any) => {
                            acc[header.name.toLowerCase()] = header.value
                            return acc
                        },
                        {}
                    )
                    
                    const bodyContent = getFullEmailBody(message.payload)
                    const decodedBody = decodeEmailBody(bodyContent)
                    
                    const fromHeader = headers.from || 'Unknown Sender'
                    const senderMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/)
                    const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : fromHeader
                    
                    return {
                        id: draft.id,
                        sender: senderName,
                        senderEmail: headers.from || '',
                        subject: headers.subject || '(No Subject)',
                        preview: decodedBody.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
                        content: decodedBody,
                        time: new Date(parseInt(message.internalDate)).toLocaleDateString(),
                        isRead: true,
                        isStarred: false,
                        avatar: senderName[0]?.toUpperCase() || '?',
                        avatarColor: 'bg-gray-500',
                        category: 'Draft',
                        messageId: message.id,
                        threadId: message.threadId,
                        labelIds: message.labelIds || []
                    }
                })
                
                setDrafts(formattedDrafts)
            }
        } catch (error) {
            console.error('Failed to fetch drafts:', error)
        }
    }, [decodeEmailBody, getFullEmailBody])

    const fetchThreads = useCallback(async (labelId = 'INBOX', pageToken?: string, isLoadMore = false) => {
        try {
            setIsLoading(true)
            setError(null)

            // Fetch threads
            const response = await window.gapi.client.gmail.users.threads.list({
                userId: 'me',
                labelIds: [labelId],
                maxResults: 20,
                pageToken: pageToken || undefined
            })

            // Save next page token for pagination
            setNextPageToken(response.result.nextPageToken || null)

            if (response.result.threads) {
                const threadPromises = response.result.threads.map(
                    (thread: any) => window.gapi.client.gmail.users.threads.get({
                        userId: 'me',
                        id: thread.id,
                        format: 'full'
                    })
                )

                const responses = await Promise.all(threadPromises)
                const formattedThreads = responses.map(res => res.result)
                
                if (isLoadMore) {
                    setThreads(prev => [...prev, ...formattedThreads])
                } else {
                    setThreads(formattedThreads)
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch threads:', error)
            setError('Failed to fetch threads: ' + (error.result?.error?.message || error.message))
            if (error.result?.error?.status === 'UNAUTHENTICATED') {
                localStorage.removeItem('gmail_token')
                setIsGmailAuthorized(false)
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    const fetchGmailData = useCallback(async (labelId = 'INBOX', pageToken?: string, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setIsLoadingMore(true)
            } else {
                setIsLoading(true)
                setNextPageToken(null)
                setCurrentLabelId(labelId)
            }
            
            setError(null)

            // Fetch labels first
            if (isGmailAuthorized && !isLoadMore) {
                await fetchLabels()
                await fetchDrafts()
            }

            // Get total count for the label
            if (!isLoadMore) {
                const labelResponse = await window.gapi.client.gmail.users.labels.get({
                    userId: 'me',
                    id: labelId
                })
                setTotalEmails(labelResponse.result.messagesTotal || 0)
            }

            // Get latest threads
            await fetchThreads(labelId, pageToken, isLoadMore)
        } catch (error: any) {
            console.error('Failed to fetch Gmail data:', error)
            setError('Failed to fetch emails: ' + (error.result?.error?.message || error.message))
            if (error.result?.error?.status === 'UNAUTHENTICATED') {
                localStorage.removeItem('gmail_token')
                setIsGmailAuthorized(false)
            }
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [isGmailAuthorized, fetchLabels, fetchDrafts, fetchThreads])

    const formatThreadToEmails = useCallback((thread: any): GmailEmail[] => {
        if (!thread.messages) return []
        
        const emails = thread.messages.map((msg: any) => {
            const headers: Record<string, string> = (msg.payload.headers || []).reduce(
                (acc: Record<string, string>, header: any) => {
                    acc[header.name.toLowerCase()] = header.value
                    return acc
                },
                {}
            )

            const bodyContent = getFullEmailBody(msg.payload)
            const decodedBody = decodeEmailBody(bodyContent)

            // Extract sender name and email
            const fromHeader = headers.from || 'Unknown Sender'
            const senderMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/)
            const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : fromHeader
            const senderEmail = senderMatch ? senderMatch[2] : fromHeader

            // Generate avatar initials
            const getInitials = (name: string) => {
                return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            }

            // Generate colors for avatars
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500']
            const avatarColor = colors[Math.floor(Math.random() * colors.length)]

            // Format date
            const formatDate = (timestamp: string) => {
                const date = new Date(parseInt(timestamp))
                const now = new Date()
                const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

                if (diffInHours < 24) {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                } else if (diffInHours < 168) { // 7 days
                    return date.toLocaleDateString([], { weekday: 'short' })
                } else {
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
                }
            }

            // Determine if email is read
            const isRead = !msg.labelIds?.includes('UNREAD')
            const isStarred = msg.labelIds?.includes('STARRED')

            // Determine category
            let category = 'Primary'
            if (msg.labelIds?.includes('CATEGORY_SOCIAL')) {
                category = 'Social'
            } else if (msg.labelIds?.includes('CATEGORY_PROMOTIONS')) {
                category = 'Promotions'
            } else if (msg.labelIds?.includes('CATEGORY_UPDATES')) {
                category = 'Updates'
            } else if (msg.labelIds?.includes('CATEGORY_FORUMS')) {
                category = 'Forums'
            }

            return {
                id: msg.id,
                sender: senderName,
                senderEmail: senderEmail,
                subject: headers.subject || '(No Subject)',
                preview: decodedBody.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
                content: decodedBody,
                time: formatDate(msg.internalDate),
                isRead: isRead,
                isStarred: isStarred,
                avatar: getInitials(senderName),
                avatarColor: avatarColor,
                category: category,
                messageId: msg.id,
                threadId: msg.threadId,
                labelIds: msg.labelIds || []
            }
        })
        
        return emails
    }, [decodeEmailBody, getFullEmailBody])

    const markAsRead = useCallback(async (emailId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                removeLabelIds: ['UNREAD']
            })
            setThreads(prev => prev.map(thread => ({
                ...thread,
                messages: thread.messages.map((msg: any) => 
                    msg.id === emailId ? { ...msg, labelIds: msg.labelIds?.filter((id: string) => id !== 'UNREAD') } : msg
                )
            })))
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }, [])

    const markAsUnread = useCallback(async (emailId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                addLabelIds: ['UNREAD']
            })
            setThreads(prev => prev.map(thread => ({
                ...thread,
                messages: thread.messages.map((msg: any) => 
                    msg.id === emailId ? { ...msg, labelIds: [...(msg.labelIds || []), 'UNREAD'] } : msg
                )
            })))
        } catch (error) {
            console.error('Failed to mark as unread:', error)
        }
    }, [])

    const toggleStar = useCallback(async (emailId: string, isStarred: boolean) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                [isStarred ? 'removeLabelIds' : 'addLabelIds']: ['STARRED']
            })
            setThreads(prev => prev.map(thread => ({
                ...thread,
                messages: thread.messages.map((msg: any) => 
                    msg.id === emailId ? { 
                        ...msg, 
                        labelIds: isStarred 
                            ? msg.labelIds?.filter((id: string) => id !== 'STARRED') 
                            : [...(msg.labelIds || []), 'STARRED']
                    } : msg
                )
            })))
        } catch (error) {
            console.error('Failed to toggle star:', error)
        }
    }, [])

    const deleteEmail = useCallback(async (emailId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.trash({
                userId: 'me',
                id: emailId
            })
            setThreads(prev => prev.filter(thread => 
                !thread.messages.some((msg: any) => msg.id === emailId)
            ))
        } catch (error) {
            console.error('Failed to delete email:', error)
        }
    }, [])

    const deleteThread = useCallback(async (threadId: string) => {
        try {
            await window.gapi.client.gmail.users.threads.trash({
                userId: 'me',
                id: threadId
            })
            setThreads(prev => prev.filter(thread => thread.id !== threadId))
        } catch (error) {
            console.error('Failed to delete thread:', error)
        }
    }, [])

    const applyLabelToEmail = useCallback(async (emailId: string, labelId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                addLabelIds: [labelId]
            })
            setThreads(prev => prev.map(thread => ({
                ...thread,
                messages: thread.messages.map((msg: any) => 
                    msg.id === emailId ? { 
                        ...msg, 
                        labelIds: [...(msg.labelIds || []), labelId] 
                    } : msg
                )
            })))
        } catch (error) {
            console.error('Failed to apply label:', error)
        }
    }, [])

    const removeLabelFromEmail = useCallback(async (emailId: string, labelId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                removeLabelIds: [labelId]
            })
            setThreads(prev => prev.map(thread => ({
                ...thread,
                messages: thread.messages.map((msg: any) => 
                    msg.id === emailId ? { 
                        ...msg, 
                        labelIds: msg.labelIds?.filter((id: string) => id !== labelId) 
                    } : msg
                )
            })))
        } catch (error) {
            console.error('Failed to remove label:', error)
        }
    }, [])

    const sendEmail = useCallback(async (to: string, subject: string, body: string) => {
        try {
            // Format email according to RFC 2822
            const emailLines = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/html; charset=utf-8',
                '',
                body
            ]
            
            const email = emailLines.join('\r\n').trim()
            
            // Base64 encode and make URL-safe
            const base64EncodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
            
            const response = await window.gapi.client.gmail.users.messages.send({
                userId: 'me',
                resource: {
                    raw: base64EncodedEmail
                }
            })
            
            toast({
                title: "Email sent",
                description: "Your message has been sent successfully",
            })
            
            return response.result
        } catch (error) {
            console.error('Failed to send email:', error)
            toast({
                title: "Error sending email",
                description: error.message,
                variant: "destructive"
            })
        }
    }, [toast])

    const saveDraft = useCallback(async (to: string, subject: string, body: string) => {
        try {
            // Format email according to RFC 2822
            const emailLines = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/html; charset=utf-8',
                '',
                body
            ]
            
            const email = emailLines.join('\r\n').trim()
            
            // Base64 encode and make URL-safe
            const base64EncodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
            
            const response = await window.gapi.client.gmail.users.drafts.create({
                userId: 'me',
                resource: {
                    message: {
                        raw: base64EncodedEmail
                    }
                }
            })
            
            toast({
                title: "Draft saved",
                description: "Your draft has been saved successfully",
            })
            
            // Refresh drafts list
            await fetchDrafts()
            
            return response.result
        } catch (error) {
            console.error('Failed to save draft:', error)
            toast({
                title: "Error saving draft",
                description: error.message,
                variant: "destructive"
            })
        }
    }, [fetchDrafts, toast])

    const revokeGmailAccess = useCallback(() => {
        if (window.google?.accounts?.oauth2) {
            const token = window.gapi.client.getToken()
            if (token) {
                window.google.accounts.oauth2.revoke(token.access_token, () => {
                    localStorage.removeItem('gmail_token')
                    window.gapi.client.setToken(null)
                    setIsGmailAuthorized(false)
                })
            }
        }
    }, [])

    return {
        isGmailAuthorized,
        isLoading,
        isLoadingMore,
        threads,
        formatThreadToEmails,
        drafts,
        totalEmails,
        labels,
        error,
        nextPageToken,
        currentLabelId,
        handleGmailAuth,
        fetchGmailData,
        revokeGmailAccess,
        markAsRead,
        markAsUnread,
        toggleStar,
        deleteEmail,
        deleteThread,
        applyLabelToEmail,
        removeLabelFromEmail,
        sendEmail,
        saveDraft,
        createLabel,
        gapiLoaded,
        gisLoaded
    }
}

// Component for Gmail access permission UI
const GmailAccessPrompt = ({
    handleGmailAuth,
    gapiLoaded,
    gisLoaded,
    error
}: {
    handleGmailAuth: () => void;
    gapiLoaded: boolean;
    gisLoaded: boolean;
    error: string | null;
}) => (
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
                disabled={!gapiLoaded || !gisLoaded}
            >
                {!gapiLoaded || !gisLoaded ? 'Loading...' : 'Connect Gmail Account'}
            </Button>

            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}
        </div>
    </div>
)

// Component for email list item with hover actions
const EmailItem = ({
    email,
    onClick,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
    onToggleStar,
    customLabels,
    onApplyLabel,
    onRemoveLabel,
    isSelected,
    onSelect,
    isThread
}: {
    email: GmailEmail;
    onClick: (email: GmailEmail) => void;
    onMarkAsRead: (emailId: string) => void;
    onMarkAsUnread: (emailId: string) => void;
    onDelete: (emailId: string) => void;
    onToggleStar: (emailId: string, isStarred: boolean) => void;
    customLabels: CustomLabel[];
    onApplyLabel: (emailId: string, labelId: string) => void;
    onRemoveLabel: (emailId: string, labelId: string) => void;
    isSelected: boolean;
    onSelect: (emailId: string, selected: boolean) => void;
    isThread?: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false)
    
    return (
        <div
            className={`flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors relative ${!email.isRead ? "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/50" : ""
                } ${isSelected ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
            onClick={() => onClick(email)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Selection checkbox */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(email.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="size-4"
                />
            </div>

            {/* Hover actions */}
            {isHovered && (
                <div className="absolute left-8 top-0 h-full flex items-center bg-background border-r z-10">
                    <div className="flex items-center gap-1 px-2">
                        {email.isRead ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 hover:bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkAsUnread(email.id)
                                }}
                                title="Mark as unread"
                            >
                                <Mail className="size-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 hover:bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkAsRead(email.id)
                                }}
                                title="Mark as read"
                            >
                                <Check className="size-4" />
                            </Button>
                        )}
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`size-6 hover:bg-transparent ${email.isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                                }`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleStar(email.id, email.isStarred)
                            }}
                            title={email.isStarred ? "Unstar" : "Star"}
                        >
                            <Star className={`size-4 ${email.isStarred ? "fill-current" : ""}`} />
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 hover:bg-transparent"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Labels"
                                >
                                    <Bookmark className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Labels</DropdownMenuLabel>
                                {customLabels.map(label => {
                                    const isApplied = email.labelIds?.includes(label.id)
                                    return (
                                        <DropdownMenuItem 
                                            key={label.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (isApplied) {
                                                    onRemoveLabel(email.id, label.id)
                                                } else {
                                                    onApplyLabel(email.id, label.id)
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                                                {label.name}
                                                {isApplied && <Check className="size-4 ml-auto" />}
                                            </div>
                                        </DropdownMenuItem>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 hover:bg-transparent"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(email.id)
                            }}
                            title="Delete"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="flex items-center gap-2 ml-2">
                <Avatar className="size-8 flex-shrink-0">
                    <AvatarFallback className={`${email.avatarColor} text-white text-sm`}>
                        {email.avatar}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="grid grid-cols-5 gap-2 w-full overflow-hidden">
                <div className="col-span-1 overflow-hidden flex items-center">
                    <p className={`text-sm truncate ${!email.isRead ? "font-bold" : ""}`}>
                        {email.sender}
                    </p>
                </div>
                <div className="col-span-3 overflow-hidden">
                    <p className="text-sm text-muted-foreground truncate">
                        {isThread && email.subject.length > 50 
                            ? `${email.subject.substring(0, 50)}...` 
                            : email.subject}
                    </p>
                    {isThread && (
                        <p className="text-xs text-muted-foreground truncate">
                            {email.preview}
                        </p>
                    )}
                </div>
                <div className="col-span-1 text-right mr-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {email.time}
                    </span>
                </div>
            </div>
        </div>
    )
}

// Custom label manager hook
const useCustomLabels = () => {
    const [customLabels, setCustomLabels] = useState<CustomLabel[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('customLabels')
            return saved ? JSON.parse(saved) : []
        }
        return []
    })

    const addLabel = useCallback((name: string, color: string) => {
        if (customLabels.length >= 5) return
        
        const newLabel: CustomLabel = {
            id: `custom-${Date.now()}`,
            name,
            color: `bg-${color}-500`
        }
        
        const updatedLabels = [...customLabels, newLabel]
        setCustomLabels(updatedLabels)
        localStorage.setItem('customLabels', JSON.stringify(updatedLabels))
        return newLabel
    }, [customLabels])

    const removeLabel = useCallback((id: string) => {
        const updatedLabels = customLabels.filter(label => label.id !== id)
        setCustomLabels(updatedLabels)
        localStorage.setItem('customLabels', JSON.stringify(updatedLabels))
    }, [customLabels])

    return {
        customLabels,
        addLabel,
        removeLabel
    }
}

// Compose email component
const ComposeEmail = ({
    open,
    onOpenChange,
    onSend,
    onSaveDraft,
    initialEmail
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSend: (to: string, subject: string, body: string) => Promise<void>;
    onSaveDraft: (to: string, subject: string, body: string) => Promise<void>;
    initialEmail?: { to?: string; subject?: string; body?: string };
}) => {
    const [to, setTo] = useState(initialEmail?.to || '')
    const [subject, setSubject] = useState(initialEmail?.subject || '')
    const [body, setBody] = useState(initialEmail?.body || '')
    const [isSending, setIsSending] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleSend = async () => {
        if (!to.trim()) return
        setIsSending(true)
        try {
            await onSend(to, subject, body)
            onOpenChange(false)
        } finally {
            setIsSending(false)
        }
    }

    const handleSaveDraft = async () => {
        setIsSaving(true)
        try {
            await onSaveDraft(to, subject, body)
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col gap-4">
                    <div>
                        <Label htmlFor="to">To</Label>
                        <Input
                            id="to"
                            placeholder="recipient@example.com"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                        <Label htmlFor="body">Message</Label>
                        <Textarea
                            id="body"
                            className="flex-1 h-full min-h-[300px] font-sans"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your message here..."
                        />
                    </div>
                </div>
                
                <DialogFooter className="flex justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon">
                            <Paperclip className="size-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleSaveDraft}
                            disabled={isSaving || isSending}
                        >
                            {isSaving ? "Saving..." : "Save Draft"}
                        </Button>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={isSending || isSaving}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSend}
                            disabled={isSending || isSaving || !to.trim()}
                        >
                            {isSending ? "Sending..." : "Send"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Thread view component
const ThreadView = ({
    thread,
    onClose,
    onMarkAsRead,
    onMarkAsUnread,
    onToggleStar,
    onDelete,
    customLabels,
    onApplyLabel,
    onRemoveLabel
}: {
    thread: any;
    onClose: () => void;
    onMarkAsRead: (emailId: string) => void;
    onMarkAsUnread: (emailId: string) => void;
    onToggleStar: (emailId: string, isStarred: boolean) => void;
    onDelete: (emailId: string) => void;
    customLabels: CustomLabel[];
    onApplyLabel: (emailId: string, labelId: string) => void;
    onRemoveLabel: (emailId: string, labelId: string) => void;
}) => {
    const [isFullView, setIsFullView] = useState(false)
    const emails = useMemo(() => {
        if (!thread.messages) return []
        
        return thread.messages.map((msg: any) => {
            const headers: Record<string, string> = (msg.payload.headers || []).reduce(
                (acc: Record<string, string>, header: any) => {
                    acc[header.name.toLowerCase()] = header.value
                    return acc
                },
                {}
            )

            const bodyContent = msg.payload.parts?.find((p: any) => p.mimeType === 'text/html')?.body?.data || 
                               msg.payload.body?.data || ''
            
            let decodedBody = ''
            try {
                const sanitized = bodyContent.replace(/-/g, '+').replace(/_/g, '/')
                decodedBody = atob(sanitized)
            } catch (error) {
                decodedBody = 'Could not decode email content'
            }

            const fromHeader = headers.from || 'Unknown Sender'
            const senderMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/)
            const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : fromHeader
            
            const getInitials = (name: string) => {
                return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            }
            
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500']
            const avatarColor = colors[Math.floor(Math.random() * colors.length)]

            const formatDate = (timestamp: string) => {
                const date = new Date(parseInt(timestamp))
                return date.toLocaleString([], { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            }

            return {
                id: msg.id,
                sender: senderName,
                senderEmail: headers.from || '',
                subject: headers.subject || '(No Subject)',
                preview: decodedBody.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
                content: decodedBody,
                time: formatDate(msg.internalDate),
                isRead: !msg.labelIds?.includes('UNREAD'),
                isStarred: msg.labelIds?.includes('STARRED'),
                avatar: getInitials(senderName),
                avatarColor: avatarColor,
                messageId: msg.id,
                threadId: msg.threadId,
                labelIds: msg.labelIds || []
            }
        })
    }, [thread])

    return (
        <div className="h-full flex flex-col bg-background border-l">
            <div className="p-2 border-b flex items-center justify-between bg-background">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
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

            <ScrollArea className="flex-1">
                <div className="p-6 max-w-4xl mx-auto w-full">
                    <h2 className="text-xl font-semibold mb-4">{emails[0]?.subject}</h2>
                    
                    {emails.map((email, index) => (
                        <div key={email.id} className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
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

                            <div className="prose max-w-none dark:prose-invert prose-headings:font-sans prose-p:font-sans prose-li:font-sans prose-a:text-blue-600 hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-400 prose-img:rounded-lg prose-img:shadow-md">
                                <div
                                    className="email-content text-base leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(email.content || email.preview)
                                    }}
                                />
                            </div>

                            {index < emails.length - 1 && (
                                <Separator className="my-6" />
                            )}
                        </div>
                    ))}

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
            </ScrollArea>
        </div>
    )
}

const MailSection = () => {
    const { user } = useUser();
    const [selectedThread, setSelectedThread] = useState<any | null>(null)
    const [isComposeOpen, setIsComposeOpen] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState("Inbox")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [newLabelName, setNewLabelName] = useState("")
    const [showLabelCreator, setShowLabelCreator] = useState(false)
    const [selectedEmails, setSelectedEmails] = useState<string[]>([])
    const [isBulkActionMode, setIsBulkActionMode] = useState(false)
    const [labelToApply, setLabelToApply] = useState<string | null>(null)
    const [labelToRemove, setLabelToRemove] = useState<string | null>(null)
    const [draftToEdit, setDraftToEdit] = useState<{ to?: string; subject?: string; body?: string } | null>(null)
    
    const { 
        customLabels, 
        addLabel: addCustomLabel, 
        removeLabel: removeCustomLabel 
    } = useCustomLabels()

    const {
        isGmailAuthorized,
        isLoading,
        isLoadingMore,
        threads,
        formatThreadToEmails,
        drafts,
        totalEmails,
        labels,
        error,
        nextPageToken,
        currentLabelId,
        handleGmailAuth,
        fetchGmailData,
        revokeGmailAccess,
        markAsRead,
        markAsUnread,
        toggleStar,
        deleteEmail,
        deleteThread,
        applyLabelToEmail,
        removeLabelFromEmail,
        sendEmail,
        saveDraft,
        createLabel,
        gapiLoaded,
        gisLoaded
    } = useGmail()

    const refreshEmails = useCallback(() => {
        if (isGmailAuthorized) {
            let labelId = 'INBOX'
            if (selectedFolder === 'Sent') labelId = 'SENT'
            if (selectedFolder === 'Drafts') labelId = 'DRAFT'
            if (selectedFolder === 'Starred') labelId = 'STARRED'
            if (selectedFolder === 'Important') labelId = 'IMPORTANT'
            if (selectedFolder === 'Trash') labelId = 'TRASH'
            if (selectedFolder === 'Spam') labelId = 'SPAM'
            
            fetchGmailData(labelId)
            setSelectedEmails([])
            setIsBulkActionMode(false)
        }
    }, [isGmailAuthorized, fetchGmailData, selectedFolder])

    const loadMoreEmails = useCallback(() => {
        if (isGmailAuthorized && nextPageToken) {
            fetchGmailData(currentLabelId, nextPageToken, true)
        }
    }, [isGmailAuthorized, fetchGmailData, nextPageToken, currentLabelId])

    useEffect(() => {
        refreshEmails()
    }, [selectedFolder, refreshEmails])

    const handleThreadClick = useCallback((thread: any) => {
        setSelectedThread(thread)
        // Mark all messages in thread as read
        thread.messages.forEach((msg: any) => {
            if (!msg.labelIds?.includes('UNREAD')) return
            markAsRead(msg.id)
        })
    }, [markAsRead])

    const handleDraftClick = useCallback((draft: any) => {
        setDraftToEdit({
            to: draft.senderEmail,
            subject: draft.subject,
            body: draft.content
        })
        setIsComposeOpen(true)
    }, [])

    const filteredThreads = useMemo(() => {
        return threads.filter(thread => {
            const emails = formatThreadToEmails(thread)
            if (emails.length === 0) return false
            
            // Filter by folder
            if (selectedFolder === 'Inbox' && emails[0].labelIds?.includes('TRASH')) return false
            if (selectedFolder === 'Sent' && !emails[0].labelIds?.includes('SENT')) return false
            if (selectedFolder === 'Drafts' && !emails[0].labelIds?.includes('DRAFT')) return false
            if (selectedFolder === 'Starred' && !emails.some(e => e.isStarred)) return false
            if (selectedFolder === 'Important' && !emails[0].labelIds?.includes('IMPORTANT')) return false
            if (selectedFolder === 'Trash' && !emails[0].labelIds?.includes('TRASH')) return false
            if (selectedFolder === 'Spam' && !emails[0].labelIds?.includes('SPAM')) return false
            
            // Filter by category
            if (selectedCategory && emails[0].category !== selectedCategory) return false
            
            // Filter by search
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                return emails.some(email => 
                    email.sender.toLowerCase().includes(query) ||
                    email.subject.toLowerCase().includes(query) ||
                    email.preview.toLowerCase().includes(query)
                )
            }
            
            return true
        })
    }, [threads, formatThreadToEmails, selectedFolder, selectedCategory, searchQuery])

    const filteredDrafts = useMemo(() => {
        if (selectedFolder !== 'Drafts') return []
        return drafts.filter(draft => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                return (
                    draft.sender.toLowerCase().includes(query) ||
                    draft.subject.toLowerCase().includes(query) ||
                    draft.preview.toLowerCase().includes(query)
                )
            }
            return true
        })
    }, [drafts, selectedFolder, searchQuery])

    const categories = [
        { id: 'Primary', name: 'Primary', icon: <Inbox className="size-4" /> },
        { id: 'Social', name: 'Social', icon: <Users className="size-4" /> },
        { id: 'Promotions', name: 'Promotions', icon: <Tag className="size-4" /> },
        { id: 'Updates', name: 'Updates', icon: <AlertCircle className="size-4" /> },
        { id: 'Forums', name: 'Forums', icon: <FileText className="size-4" /> }
    ]

    const folders = [
        { id: 'Inbox', name: 'Inbox', icon: <Inbox className="size-4" /> },
        { id: 'Starred', name: 'Starred', icon: <Star className="size-4" /> },
        { id: 'Sent', name: 'Sent', icon: <Send className="size-4" /> },
        { id: 'Drafts', name: 'Drafts', icon: <Edit className="size-4" /> },
        { id: 'Important', name: 'Important', icon: <Folder className="size-4" /> },
        { id: 'Trash', name: 'Trash', icon: <Trash2 className="size-4" /> },
        { id: 'Spam', name: 'Spam', icon: <AlertCircle className="size-4" /> }
    ]

    const handleAddLabel = useCallback((emailId: string, labelId: string) => {
        applyLabelToEmail(emailId, labelId)
    }, [applyLabelToEmail])

    const handleRemoveLabel = useCallback((emailId: string, labelId: string) => {
        removeLabelFromEmail(emailId, labelId)
    }, [removeLabelFromEmail])

    const handleCreateLabel = () => {
        if (newLabelName.trim() && customLabels.length < 5) {
            const colors = ['blue', 'green', 'purple', 'red', 'yellow']
            const newLabel = addCustomLabel(newLabelName.trim(), colors[customLabels.length % 5])
            if (newLabel) {
                createLabel(newLabel.name, newLabel.color.replace('bg-', '').replace('-500', ''))
            }
            setNewLabelName("")
            setShowLabelCreator(false)
        }
    }

    const handleEmailSelect = useCallback((emailId: string, selected: boolean) => {
        if (selected) {
            setSelectedEmails(prev => [...prev, emailId])
            setIsBulkActionMode(true)
        } else {
            setSelectedEmails(prev => prev.filter(id => id !== emailId))
            if (selectedEmails.length === 1) {
                setIsBulkActionMode(false)
            }
        }
    }, [selectedEmails])

    const handleBulkMarkAsRead = useCallback(() => {
        selectedEmails.forEach(emailId => markAsRead(emailId))
        setSelectedEmails([])
        setIsBulkActionMode(false)
    }, [selectedEmails, markAsRead])

    const handleBulkMarkAsUnread = useCallback(() => {
        selectedEmails.forEach(emailId => markAsUnread(emailId))
        setSelectedEmails([])
        setIsBulkActionMode(false)
    }, [selectedEmails, markAsUnread])

    const handleBulkDelete = useCallback(() => {
        selectedEmails.forEach(emailId => deleteEmail(emailId))
        setSelectedEmails([])
        setIsBulkActionMode(false)
    }, [selectedEmails, deleteEmail])

    const handleBulkApplyLabel = useCallback((labelId: string) => {
        selectedEmails.forEach(emailId => applyLabelToEmail(emailId, labelId))
        setSelectedEmails([])
        setIsBulkActionMode(false)
        setLabelToApply(null)
    }, [selectedEmails, applyLabelToEmail])

    const handleBulkRemoveLabel = useCallback((labelId: string) => {
        selectedEmails.forEach(emailId => removeLabelFromEmail(emailId, labelId))
        setSelectedEmails([])
        setIsBulkActionMode(false)
        setLabelToRemove(null)
    }, [selectedEmails, removeLabelFromEmail])

    return (
        <div className='h-full w-full flex flex-col overflow-hidden'>
            {/* Header */}
            <header className="h-16 border-b bg-background flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon">
                        <Menu className="size-5" />
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
                            {folders.map((folder) => (
                                <DropdownMenuItem 
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder.id)}
                                >
                                    {folder.icon}
                                    <span className="ml-2">{folder.name}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                        <Input
                            placeholder="Search emails, contacts, labels..."
                            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={refreshEmails}>
                        <RefreshCw className="size-4" />
                    </Button>
                    <Button className="gap-2" onClick={() => {
                        setDraftToEdit(null)
                        setIsComposeOpen(true)
                    }}>
                        <MailPlus className="size-4" />
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

            {/* Bulk Actions Bar */}
            {isBulkActionMode && (
                <div className="bg-muted/50 border-b p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {selectedEmails.length} selected
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedEmails([])
                            setIsBulkActionMode(false)
                        }}>
                            <X className="size-4 mr-1" /> Cancel
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleBulkMarkAsRead}>
                            <Check className="size-4 mr-1" /> Mark as read
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleBulkMarkAsUnread}>
                            <Mail className="size-4 mr-1" /> Mark as unread
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Bookmark className="size-4 mr-1" /> Labels
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Apply Label</DropdownMenuLabel>
                                {customLabels.map(label => (
                                    <DropdownMenuItem 
                                        key={label.id}
                                        onClick={() => handleBulkApplyLabel(label.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                                            {label.name}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuLabel>Remove Label</DropdownMenuLabel>
                                {customLabels.map(label => (
                                    <DropdownMenuItem 
                                        key={label.id}
                                        onClick={() => handleBulkRemoveLabel(label.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                                            {label.name}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button variant="ghost" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="size-4 mr-1" /> Delete
                        </Button>
                    </div>
                </div>
            )}

            {/* Main content area */}
            <ResizablePanelGroup direction="horizontal" className="h-full flex-1 overflow-hidden">

                {/* Email List Section */}
                <ResizablePanel defaultSize={40} minSize={30} className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col h-full">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2">
                                    <Skeleton className="h-6 w-6 rounded" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !isGmailAuthorized ? (
                        <GmailAccessPrompt
                            handleGmailAuth={handleGmailAuth}
                            gapiLoaded={gapiLoaded}
                            gisLoaded={gisLoaded}
                            error={error}
                        />
                    ) : (
                        <div className="h-full flex flex-col">
                            {/* Categories Tabs */}
                            <div className="border-b bg-muted/30">
                                <div className="flex items-center gap-6 px-4 py-2">
                                    {categories.map((category) => (
                                        <div 
                                            key={category.id}
                                            className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded-lg ${selectedCategory === category.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium' : 'text-muted-foreground hover:bg-muted'}`}
                                            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                                        >
                                            {category.icon}
                                            <span>{category.name}</span>
                                            {selectedCategory === category.id && (
                                                <div className="size-2 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {/* Label Management */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="ml-auto gap-1">
                                                <Plus className="size-4" />
                                                Labels
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Custom Labels</DropdownMenuLabel>
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
                                                            e.stopPropagation()
                                                            removeCustomLabel(label.id)
                                                        }}
                                                    >
                                                        <X className="size-3" />
                                                    </Button>
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                            <div className="px-2 py-1">
                                                {showLabelCreator ? (
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            value={newLabelName}
                                                            onChange={(e) => setNewLabelName(e.target.value)}
                                                            placeholder="Label name"
                                                            className="h-8"
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
                                </div>
                            </div>

                            {/* Email List */}
                            <ScrollArea className="flex-1">
                                <div className="divide-y">
                                    {selectedFolder === 'Drafts' && filteredDrafts.length === 0 && filteredThreads.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No emails found in {selectedFolder.toLowerCase()}.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Drafts Section */}
                                            {selectedFolder === 'Drafts' && filteredDrafts.length > 0 && (
                                                <div className="border-b bg-muted/20">
                                                    <div className="flex items-center gap-2 px-4 py-2">
                                                        <span className="text-sm font-medium">DRAFTS</span>
                                                    </div>
                                                    {filteredDrafts.map((draft) => (
                                                        <EmailItem
                                                            key={draft.id}
                                                            email={draft}
                                                            onClick={() => handleDraftClick(draft)}
                                                            onMarkAsRead={markAsRead}
                                                            onMarkAsUnread={markAsUnread}
                                                            onDelete={deleteEmail}
                                                            onToggleStar={toggleStar}
                                                            customLabels={customLabels}
                                                            onApplyLabel={handleAddLabel}
                                                            onRemoveLabel={handleRemoveLabel}
                                                            isSelected={selectedEmails.includes(draft.id)}
                                                            onSelect={handleEmailSelect}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Threads Section */}
                                            {filteredThreads.map((thread) => {
                                                const emails = formatThreadToEmails(thread)
                                                if (emails.length === 0) return null
                                                
                                                return (
                                                    <div 
                                                        key={thread.id} 
                                                        className={`hover:bg-muted/50 cursor-pointer transition-colors relative ${emails.some(e => !e.isRead) ? "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/50" : ""}`}
                                                        onClick={() => handleThreadClick(thread)}
                                                    >
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEmails.includes(emails[0].id)}
                                                                onChange={(e) => handleEmailSelect(emails[0].id, e.target.checked)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="size-4"
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={`size-6 hover:bg-transparent ${emails.some(e => e.isStarred) ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        toggleStar(emails[0].id, emails[0].isStarred)
                                                                    }}
                                                                >
                                                                    <Star className={`size-4 ${emails.some(e => e.isStarred) ? "fill-current" : ""}`} />
                                                                </Button>
                                                            </div>
                                                            <Avatar className="size-8 flex-shrink-0">
                                                                <AvatarFallback className={`${emails[0].avatarColor} text-white text-sm`}>
                                                                    {emails[0].avatar}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="grid grid-cols-5 gap-2 w-full overflow-hidden">
                                                                <div className="col-span-1 overflow-hidden flex items-center">
                                                                    <p className={`text-sm truncate ${emails.some(e => !e.isRead) ? "font-bold" : ""}`}>
                                                                        {emails[0].sender}
                                                                    </p>
                                                                </div>
                                                                <div className="col-span-3 overflow-hidden">
                                                                    <p className="text-sm text-muted-foreground truncate">
                                                                        {emails[0].subject}
                                                                        {emails.length > 1 && (
                                                                            <span className="text-xs ml-2 text-muted-foreground">
                                                                                ({emails.length})
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        {emails[0].preview}
                                                                    </p>
                                                                </div>
                                                                <div className="col-span-1 text-right mr-1">
                                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                        {emails[0].time}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            
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

                {selectedThread && (
                    <>
                        <ResizableHandle withHandle className="bg-border" />
                        <ResizablePanel defaultSize={60} minSize={40}>
                            <ThreadView
                                thread={selectedThread}
                                onClose={() => setSelectedThread(null)}
                                onMarkAsRead={markAsRead}
                                onMarkAsUnread={markAsUnread}
                                onToggleStar={toggleStar}
                                onDelete={deleteEmail}
                                customLabels={customLabels}
                                onApplyLabel={handleAddLabel}
                                onRemoveLabel={handleRemoveLabel}
                            />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
            
            {/* Compose Email Dialog */}
            <ComposeEmail
                open={isComposeOpen}
                onOpenChange={setIsComposeOpen}
                onSend={sendEmail}
                onSaveDraft={saveDraft}
                initialEmail={draftToEdit}
            />
        </div>
    )
}

export default MailSection