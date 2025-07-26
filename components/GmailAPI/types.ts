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
}

export interface GmailServiceInterface {
    handleAuth: () => Promise<boolean>;
    checkExistingAuth: () => Promise<boolean>;
    fetchEmails: (maxResults?: number) => Promise<GmailEmail[]>;
}