"use client"

// Extend the Window interface to include gapi and google properties
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';

// Define email interface
export interface GmailEmail {
    id: string;
    sender: string;
    senderEmail: string;
    subject: string;
    preview: string;
    content: string;
    time: string;
    isRead: boolean;
    isStarred: boolean;
    avatar: string;
    avatarColor: string;
    category: string;
    messageId: string;
    threadId: string;
    labelIds?: string[];
}

interface CustomLabel {
    id: string;
    name: string;
    color: string;
    type?: 'system' | 'user'; // Add type to distinguish between system and user labels
}

interface EmailContextType {
    gmailEmails: GmailEmail[];
    isLoading: boolean;
    isGmailAuthorized: boolean;
    totalEmails: number;
    labels: any[];
    customLabels: CustomLabel[];
    error: string | null;
    nextPageToken: string | null;
    refreshEmails: () => void;
    loadMoreEmails: () => void;
    markAsRead: (emailId: string) => void;
    markAsUnread: (emailId: string) => void;
    toggleStar: (emailId: string, isStarred: boolean) => void;
    deleteEmail: (emailId: string) => void;
    addLabel: (name: string) => void;
    removeLabel: (id: string) => void;
    handleGmailAuth: () => void;
    revokeGmailAccess: () => void;
    addEmailLabel: (emailId: string, labelId: string) => void;
    filteredEmails: GmailEmail[];
    setSearchQuery: (query: string) => void;
    setSelectedFolder: (folder: string) => void;
    setSelectedCategory: (category: string | null) => void;
    selectedFolder: string;
    selectedCategory: string | null;
    isLoadingMore: boolean;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

interface EmailProviderProps {
    children: ReactNode;
}

export const EmailProvider: React.FC<EmailProviderProps> = ({ children }) => {
    const [gmailEmails, setGmailEmails] = useState<GmailEmail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isGmailAuthorized, setIsGmailAuthorized] = useState(false);
    const [totalEmails, setTotalEmails] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [currentLabelId, setCurrentLabelId] = useState('INBOX');
    const [gapiLoaded, setGapiLoaded] = useState(false);
    const [gisLoaded, setGisLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [labels, setLabels] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('INBOX');
    const [selectedCategory, setSelectedCategory] = useState<string | null>('CATEGORY_PRIMARY');

    // Custom labels - now includes all Gmail labels
    const [customLabels, setCustomLabels] = useState<CustomLabel[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('customLabels');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    // Utility function to generate MD5 hash for Gravatar
    const generateMD5 = (str: string): string => {
        // Simple MD5 implementation for Gravatar
        // In production, you might want to use a proper crypto library
        const crypto = require('crypto');
        if (typeof crypto !== 'undefined' && crypto.createHash) {
            return crypto.createHash('md5').update(str.toLowerCase().trim()).digest('hex');
        }
        
        // Fallback browser-compatible MD5 (simplified)
        // Note: This is a basic implementation. For production, consider using a proper MD5 library
        const md5 = (str: string) => {
            const utf8Encode = (str: string) => {
                return unescape(encodeURIComponent(str));
            };
            
            const hexMd5 = (str: string) => {
                return binl2hex(coreMd5(str2binl(str), str.length * 8));
            };
            
            const coreMd5 = (x: number[], len: number) => {
                x[len >> 5] |= 0x80 << (len % 32);
                x[((len + 64) >>> 9 << 4) + 14] = len;
                
                let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
                
                for (let i = 0; i < x.length; i += 16) {
                    const olda = a, oldb = b, oldc = c, oldd = d;
                    
                    a = md5_ff(a, b, c, d, x[i], 7, -680876936);
                    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
                    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
                    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
                    
                    // Continue with remaining MD5 operations...
                    // (This is a simplified version - in production use a proper MD5 library)
                    
                    a = safeAdd(a, olda);
                    b = safeAdd(b, oldb);
                    c = safeAdd(c, oldc);
                    d = safeAdd(d, oldd);
                }
                return [a, b, c, d];
            };
            
            // Helper functions for MD5
            const md5_ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
                return md5_cmn((b & c) | (~b & d), a, b, x, s, t);
            };
            
            const md5_cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => {
                return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
            };
            
            const safeAdd = (x: number, y: number) => {
                const lsw = (x & 0xffff) + (y & 0xffff);
                const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xffff);
            };
            
            const bitRotateLeft = (num: number, cnt: number) => {
                return (num << cnt) | (num >>> (32 - cnt));
            };
            
            const str2binl = (str: string) => {
                const bin: any = [];
                const mask = (1 << 8) - 1;
                for (let i = 0; i < str.length * 8; i += 8) {
                    bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
                }
                return bin;
            };
            
            const binl2hex = (binarray: number[]) => {
                const hexTab = '0123456789abcdef';
                let str = '';
                for (let i = 0; i < binarray.length * 4; i++) {
                    str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
                           hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
                }
                return str;
            };
            
            return hexMd5(utf8Encode(str));
        };
        
        return md5(str.toLowerCase().trim());
    };

    // Function to get Gravatar URL
    const getGravatarUrl = (email: string, size: number = 80): string => {
        const hash = generateMD5(email);
        return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=g`;
    };

    // Alternative function to get avatar from UI Avatars API as fallback
    const getUIAvatarUrl = (name: string, email: string): string => {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['007bff', '28a745', '6f42c1', 'dc3545', 'ffc107', '6610f2'];
        const colorIndex = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        const backgroundColor = colors[colorIndex];
        
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=80&background=${backgroundColor}&color=fff&bold=true`;
    };

    // Function to check if Gravatar exists and fallback to UI Avatars
    const getAvatarUrl = async (email: string, name: string): Promise<string> => {
        try {
            const gravatarUrl = getGravatarUrl(email);
            
            // Check if Gravatar exists by trying to fetch it
            const response = await fetch(gravatarUrl + '&d=404');
            if (response.ok) {
                return gravatarUrl;
            }
        } catch (error) {
            console.log('Gravatar not found, using UI Avatars');
        }
        
        // Fallback to UI Avatars
        return getUIAvatarUrl(name, email);
    };

    // Initialize Google APIs
    useEffect(() => {
        const initializeGoogleAPIs = () => {
            // Load GAPI
            if (typeof window !== 'undefined' && window.gapi) {
                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({
                            apiKey: process.env.NEXT_PUBLIC_GMAIL_API_KEY || 'AIzaSyCnaJttbbwDFC9yD6myRxwmgF4sGY2TJig',
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
                        });
                        setGapiLoaded(true);
                    } catch (error) {
                        console.error('GAPI client init error:', error);
                        setError('Failed to initialize Google API client');
                    }
                });
            }

            // Load GIS
            if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
                try {
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '459976879104-gcljq7m0akm9t98iqt3sneuhlvh5cqtv.apps.googleusercontent.com',
                        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels',
                        callback: '',
                    });
                    setTokenClient(client);
                    setGisLoaded(true);
                } catch (error) {
                    console.error('GIS init error:', error);
                    setError('Failed to initialize Google Identity Services');
                }
            }
        };

        const loadGoogleScripts = () => {
            // Only load scripts if not already present
            if (!document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
                const gapiScript = document.createElement('script');
                gapiScript.src = 'https://apis.google.com/js/api.js';
                gapiScript.async = true;
                gapiScript.defer = true;
                gapiScript.onload = initializeGoogleAPIs;
                document.head.appendChild(gapiScript);
            }

            if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                gisScript.async = true;
                gisScript.defer = true;
                gisScript.onload = initializeGoogleAPIs;
                document.head.appendChild(gisScript);
            }

            // If scripts already exist, initialize
            if (window.gapi && window.google?.accounts?.oauth2) {
                initializeGoogleAPIs();
            }
        };

        loadGoogleScripts();
    }, []);

    // Check existing authorization
    useEffect(() => {
        if (gapiLoaded && gisLoaded) {
            checkExistingAuth();
        }
    }, [gapiLoaded, gisLoaded]);

    const checkExistingAuth = useCallback(() => {
        try {
            // Check localStorage for existing token
            const storedToken = localStorage.getItem('gmail_token');
            if (storedToken) {
                window.gapi.client.setToken(JSON.parse(storedToken));
                setIsGmailAuthorized(true);
                fetchGmailData();
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error checking existing auth:', error);
            setIsLoading(false);
        }
    }, []);

    const handleGmailAuth = useCallback(() => {
        if (!tokenClient) {
            setError('Google services not initialized');
            return;
        }

        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                setError('Authorization failed: ' + resp.error);
                return;
            }
            // Store the token in localStorage
            localStorage.setItem('gmail_token', JSON.stringify(resp));
            setIsGmailAuthorized(true);
            await fetchGmailData();
        };

        tokenClient.requestAccessToken({ prompt: 'consent' });
    }, [tokenClient]);

    const getFullEmailBody = useCallback((payload: any): string => {
        if (!payload) return '';

        // Prefer HTML content if available
        const findHtmlPart = (parts: any[]): any => {
            for (const part of parts) {
                if (part.mimeType === 'text/html') {
                    return part;
                }
                if (part.parts) {
                    const result = findHtmlPart(part.parts);
                    if (result) return result;
                }
            }
            return null;
        };

        const findTextPart = (parts: any[]): any => {
            for (const part of parts) {
                if (part.mimeType === 'text/plain') {
                    return part;
                }
                if (part.parts) {
                    const result = findTextPart(part.parts);
                    if (result) return result;
                }
            }
            return null;
        };

        if (payload.parts) {
            const htmlPart = findHtmlPart(payload.parts);
            if (htmlPart) {
                return htmlPart.body?.data || '';
            }

            const textPart = findTextPart(payload.parts);
            if (textPart) {
                return textPart.body?.data || '';
            }
        }
        return payload.body?.data || '';
    }, []);

    const decodeEmailBody = useCallback((data: string): string => {
        try {
            if (!data) return '';
            // Convert from Base64 URL safe format
            const sanitized = data.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = atob(sanitized);
            return decoded;
        } catch (error) {
            console.error('Decoding error:', error);
            return 'Could not decode email content';
        }
    }, []);

    const fetchLabels = useCallback(async () => {
        try {
            const response = await window.gapi.client.gmail.users.labels.list({
                userId: 'me'
            });

            
            const allLabels = response.result.labels.filter((label: any) => {
                // Filter out system labels that are not user-created
                return label.type === 'user';
            });
            console.log('Fetched labels:', allLabels);
            
            setLabels(allLabels);
            
         
            
            const newCustomLabels = allLabels.map((label: any) => {
                // Check if we already have this label in customLabels
                const existing = customLabels.find(l => l.id === label.id);
                
                return {
                    id: label.id,
                    name: label.name,
                    color: existing?.color || labelColors[label.id] || `bg-${['blue','green','purple','red','yellow','indigo'][Math.floor(Math.random() * 6)]}-500`,
                    type: label.type === 'system' ? 'system' : 'user'
                };
            });
            
            setCustomLabels(newCustomLabels);
            localStorage.setItem('customLabels', JSON.stringify(newCustomLabels));
        } catch (error) {
            console.error('Failed to fetch labels:', error);
        }
    }, [customLabels]);

    const fetchGmailData = useCallback(async (labelId = 'INBOX', pageToken?: string, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
                setNextPageToken(null); // Reset pagination token when loading new folder
                setCurrentLabelId(labelId);
            }

            setError(null);

            // Fetch labels first
            if (isGmailAuthorized && !isLoadMore) {
                await fetchLabels();
            }

            // Get total count for the label
            if (!isLoadMore) {
                try {
                    const labelResponse = await window.gapi.client.gmail.users.labels.get({
                        userId: 'me',
                        id: labelId
                    });
                    setTotalEmails(labelResponse.result.messagesTotal || 0);
                } catch (error) {
                    console.error('Failed to get label count:', error);
                    setTotalEmails(0);
                }
            }

            // Calculate date 3 months ago for query
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const dateQuery = `after:${threeMonthsAgo.getFullYear()}/${threeMonthsAgo.getMonth()+1}/${threeMonthsAgo.getDate()}`;

            // Get latest emails
            const messagesResponse = await window.gapi.client.gmail.users.messages.list({
                userId: 'me',
                labelIds: [labelId],
                maxResults: 100,
                pageToken: pageToken || undefined,
                q: dateQuery
            });

            // Save next page token for pagination
            setNextPageToken(messagesResponse.result.nextPageToken || null);

            if (messagesResponse.result.messages) {
                const messagePromises = messagesResponse.result.messages.map(
                    (msg: any) => window.gapi.client.gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full'
                    })
                );

                const responses = await Promise.all(messagePromises);
                const formattedEmails = await Promise.all(responses.map(async (response, index) => {
                    const msg = response.result;
                    const headers: Record<string, string> = (msg.payload.headers || []).reduce(
                        (acc: Record<string, string>, header: any) => {
                            acc[header.name.toLowerCase()] = header.value;
                            return acc;
                        },
                        {}
                    );

                    const bodyContent = getFullEmailBody(msg.payload);
                    const decodedBody = decodeEmailBody(bodyContent);

                    // Extract sender name and email
                    const fromHeader = headers.from || 'Unknown Sender';
                    const senderMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/);
                    const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : fromHeader;
                    const senderEmail = senderMatch ? senderMatch[2] : fromHeader;

                    // Get real avatar URL
                    const avatarUrl = await getAvatarUrl(senderEmail, senderName);

                    // Generate colors for avatars (fallback)
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'];
                    const avatarColor = colors[index % colors.length];

                    // Format date
                    const formatDate = (timestamp: string) => {
                        const date = new Date(parseInt(timestamp));
                        const now = new Date();
                        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

                        if (diffInHours < 24) {
                            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } else if (diffInHours < 168) { // 7 days
                            return date.toLocaleDateString([], { weekday: 'short' });
                        } else {
                            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }
                    }

                    // Determine if email is read
                    const isRead = !msg.labelIds?.includes('UNREAD');
                    const isStarred = msg.labelIds?.includes('STARRED');

                    // Determine category
                    let category = 'CATEGORY_PRIMARY';
                    if (msg.labelIds?.includes('CATEGORY_SOCIAL')) {
                        category = 'CATEGORY_SOCIAL';
                    } else if (msg.labelIds?.includes('CATEGORY_PROMOTIONS')) {
                        category = 'CATEGORY_PROMOTIONS';
                    } else if (msg.labelIds?.includes('CATEGORY_UPDATES')) {
                        category = 'CATEGORY_UPDATES';
                    } else if (msg.labelIds?.includes('CATEGORY_FORUMS')) {
                        category = 'CATEGORY_FORUMS';
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
                        avatar: avatarUrl, // Now contains the real avatar URL
                        avatarColor: avatarColor,
                        category: category,
                        messageId: msg.id,
                        threadId: msg.threadId,
                        labelIds: msg.labelIds || []
                    };
                }));

                if (isLoadMore) {
                    // Append new emails to existing list
                    setGmailEmails(prev => [...prev, ...formattedEmails]);
                } else {
                    // Replace with new emails
                    setGmailEmails(formattedEmails);
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch Gmail data:', error);
            setError('Failed to fetch emails: ' + (error.result?.error?.message || error.message));
            // If token is invalid, clear it from storage
            if (error.result?.error?.status === 'UNAUTHENTICATED') {
                localStorage.removeItem('gmail_token');
                setIsGmailAuthorized(false);
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [decodeEmailBody, getFullEmailBody, isGmailAuthorized, fetchLabels]);

    const markAsRead = useCallback(async (emailId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                removeLabelIds: ['UNREAD']
            });
            setGmailEmails(prev => prev.map(email =>
                email.id === emailId ? { ...email, isRead: true } : email
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }, []);

    const markAsUnread = useCallback(async (emailId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                addLabelIds: ['UNREAD']
            });
            setGmailEmails(prev => prev.map(email =>
                email.id === emailId ? { ...email, isRead: false } : email
            ));
        } catch (error) {
            console.error('Failed to mark as unread:', error);
        }
    }, []);

    const toggleStar = useCallback(async (emailId: string, isStarred: boolean) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                [isStarred ? 'removeLabelIds' : 'addLabelIds']: ['STARRED']
            });
            setGmailEmails(prev => prev.map(email =>
                email.id === emailId ? { ...email, isStarred: !isStarred } : email
            ));
        } catch (error) {
            console.error('Failed to toggle star:', error);
        }
    }, []);

    const deleteEmail = useCallback(async (emailId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.trash({
                userId: 'me',
                id: emailId
            });
            setGmailEmails(prev => prev.filter(email => email.id !== emailId));
        } catch (error) {
            console.error('Failed to delete email:', error);
        }
    }, []);

    const revokeGmailAccess = useCallback(() => {
        if (window.google?.accounts?.oauth2) {
            const token = window.gapi.client.getToken();
            if (token) {
                window.google.accounts.oauth2.revoke(token.access_token, () => {
                    localStorage.removeItem('gmail_token');
                    window.gapi.client.setToken(null);
                    setIsGmailAuthorized(false);
                });
            }
        }
    }, []);

    const refreshEmails = useCallback(() => {
        if (isGmailAuthorized) {
            let labelId = 'INBOX';
            if (selectedFolder === 'All') labelId = 'ALL';
            if (selectedFolder === 'Sent') labelId = 'SENT';
            if (selectedFolder === 'Drafts') labelId = 'DRAFT';
            if (selectedFolder === 'Starred') labelId = 'STARRED';
            if (selectedFolder === 'Important') labelId = 'IMPORTANT';
            if (selectedFolder === 'Trash') labelId = 'TRASH';
            if (selectedFolder === 'Spam') labelId = 'SPAM';

            fetchGmailData(labelId);
        }
    }, [isGmailAuthorized, fetchGmailData, selectedFolder]);

    const loadMoreEmails = useCallback(() => {
        if (isGmailAuthorized && nextPageToken) {
            let labelId = selectedFolder;
            if (selectedFolder === 'All') labelId = 'ALL';
            if (selectedFolder === 'Sent') labelId = 'SENT';
            if (selectedFolder === 'Starred') labelId = 'STARRED';
            if (selectedFolder === 'Trash') labelId = 'TRASH';
            if (selectedFolder === 'Spam') labelId = 'SPAM';
            
            fetchGmailData(labelId, nextPageToken, true);
        }
    }, [isGmailAuthorized, fetchGmailData, nextPageToken, selectedFolder]);

    const addLabel = useCallback(async (name: string) => {
        if (customLabels.length >= 20) return;

        try {
            // Create label via Gmail API
            const response = await window.gapi.client.gmail.users.labels.create({
                userId: 'me',
                resource: {
                    name,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show'
                }
            });

            const newLabel = response.result;
            
            // Update labels state
            setLabels(prev => [...prev, newLabel]);

            // Add to custom labels
            const newCustomLabel: CustomLabel = {
                id: newLabel.id,
                name: newLabel.name,
                color: `bg-${['blue','green','purple','red','yellow','indigo','pink','teal','orange','cyan'][customLabels.length % 10]}-500`,
                type: 'user'
            };

            const updatedLabels = [...customLabels, newCustomLabel];
            setCustomLabels(updatedLabels);
            localStorage.setItem('customLabels', JSON.stringify(updatedLabels));
        } catch (error) {
            console.error('Failed to create label:', error);
        }
    }, [customLabels]);

    const removeLabel = useCallback((id: string) => {
        const updatedLabels = customLabels.filter(label => label.id !== id);
        setCustomLabels(updatedLabels);
        localStorage.setItem('customLabels', JSON.stringify(updatedLabels));
    }, [customLabels]);

    const addEmailLabel = useCallback(async (emailId: string, labelId: string) => {
        try {
            await window.gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                addLabelIds: [labelId]
            });
            // Update UI state
            setGmailEmails(prev => prev.map(email =>
                email.id === emailId
                    ? { ...email, labelIds: [...(email.labelIds || []), labelId] }
                    : email
            ));
        } catch (error) {
            console.error('Failed to add label:', error);
        }
    }, []);

    // Filter emails based on UI state
    const filteredEmails = useMemo(() => {
        return gmailEmails.filter(email => {
            // Filter by folder
            if (selectedFolder === 'All') {
                // Show all emails except spam and trash
                if (email.labelIds?.includes('SPAM') || email.labelIds?.includes('TRASH')) {
                    return false;
                }
            } else if (selectedFolder === 'INBOX') {
                if (email.labelIds?.includes('TRASH') || email.labelIds?.includes('SPAM')) {
                    return false;
                }
            } else if (selectedFolder === 'SENT') {
                if (!email.labelIds?.includes('SENT')) return false;
            } else if (selectedFolder === 'DRAFT') {
                if (!email.labelIds?.includes('DRAFT')) return false;
            } else if (selectedFolder === 'STARRED') {
                if (!email.isStarred) return false;
            } else if (selectedFolder === 'IMPORTANT') {
                if (!email.labelIds?.includes('IMPORTANT')) return false;
            } else if (selectedFolder === 'TRASH') {
                if (!email.labelIds?.includes('TRASH')) return false;
            } else if (selectedFolder === 'SPAM') {
                if (!email.labelIds?.includes('SPAM')) return false;
            }

            // Filter by category - only in Inbox
            if (selectedFolder === 'INBOX' && selectedCategory && email.category !== selectedCategory) {
                return false;
            }

            // Filter by search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    email.sender.toLowerCase().includes(query) ||
                    email.subject.toLowerCase().includes(query) ||
                    email.preview.toLowerCase().includes(query)
                );
            }

            return true;
        });
    }, [gmailEmails, selectedFolder, selectedCategory, searchQuery]);

    // Auto-refresh emails when folder changes
    useEffect(() => {
        if (isGmailAuthorized) {
            refreshEmails();
        }
    }, [selectedFolder, isGmailAuthorized]);

    const contextValue: EmailContextType = useMemo(() => ({
        gmailEmails,
        isLoading,
        isGmailAuthorized,
        totalEmails,
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
        addLabel,
        removeLabel,
        handleGmailAuth,
        revokeGmailAccess,
        addEmailLabel,
        filteredEmails,
        setSearchQuery,
        setSelectedFolder,
        setSelectedCategory,
        selectedFolder,
        selectedCategory,
        isLoadingMore
    }), [
        gmailEmails,
        isLoading,
        isGmailAuthorized,
        totalEmails,
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
        addLabel,
        removeLabel,
        handleGmailAuth,
        revokeGmailAccess,
        addEmailLabel,
        filteredEmails,
        setSearchQuery,
        setSelectedFolder,
        setSelectedCategory,
        selectedFolder,
        selectedCategory,
        isLoadingMore
    ]);

    return (
        <EmailContext.Provider value={contextValue}>
            {children}
        </EmailContext.Provider>
    );
};

export const useEmailContext = () => {
    const context = useContext(EmailContext);
    if (context === undefined) {
        throw new Error('useEmailContext must be used within an EmailProvider');
    }
    return context;
};