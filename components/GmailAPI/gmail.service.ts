import { GmailEmail } from "./types";

const CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || 'your-client-id';
const API_KEY = process.env.NEXT_PUBLIC_GMAIL_API_KEY || 'your-api-key';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

export class GmailService {
  private isGapiLoaded = false;
  private isGisLoaded = false;
  private tokenClient: any = null;

  constructor() {
    this.loadGoogleScripts();
  }

  private loadGoogleScripts() {
    if (!document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => this.initializeGapi();
      document.head.appendChild(gapiScript);
    }

    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = () => this.initializeGis();
      document.head.appendChild(gisScript);
    }
  }

  private initializeGapi() {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        this.isGapiLoaded = true;
      } catch (error) {
        console.error('GAPI client init error:', error);
      }
    });
  }

  private initializeGis() {
    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
      });
      this.isGisLoaded = true;
    } catch (error) {
      console.error('GIS init error:', error);
    }
  }

  public async handleAuth(): Promise<boolean> {
    if (!this.tokenClient) {
      throw new Error('Google services not initialized');
    }

    return new Promise((resolve) => {
      this.tokenClient.callback = async (resp: any) => {
        if (resp.error) {
          console.error('Authorization failed:', resp.error);
          resolve(false);
          return;
        }
        resolve(true);
      };
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  public async checkExistingAuth(): Promise<boolean> {
    try {
      const token = window.gapi?.client?.getToken();
      return !!token;
    } catch (error) {
      console.error('Error checking existing auth:', error);
      return false;
    }
  }

  public async fetchEmails(maxResults = 20): Promise<GmailEmail[]> {
    if (!this.isGapiLoaded) {
      throw new Error('GAPI client not loaded');
    }

    // Get messages list
    const messagesResponse = await window.gapi.client.gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults,
    });

    if (!messagesResponse.result.messages) {
      return [];
    }

    // Get full message details for each
    const messagePromises = messagesResponse.result.messages.map((msg: any) =>
      window.gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })
    );

    const responses = await Promise.all(messagePromises);
    return responses.map(this.formatEmail);
  }

  private formatEmail(response: any, index: number): GmailEmail {
    const msg = response.result;
    const headers = this.extractHeaders(msg);
    const bodyContent = this.getFullEmailBody(msg.payload);
    const decodedBody = this.decodeEmailBody(bodyContent);
    const { senderName, senderEmail } = this.extractSenderInfo(headers.from);
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500'];

    return {
      id: msg.id,
      sender: senderName,
      senderEmail: senderEmail,
      subject: headers.subject || '(No Subject)',
      preview: decodedBody.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      content: decodedBody,
      time: this.formatDate(msg.internalDate),
      isRead: !msg.labelIds?.includes('UNREAD'),
      isStarred: msg.labelIds?.includes('STARRED'),
      avatar: this.getInitials(senderName),
      avatarColor: colors[index % colors.length],
      category: senderName.includes('noreply') ? 'Updates' : 'Primary',
      messageId: msg.id,
      threadId: msg.threadId,
    };
  }

  private extractHeaders(msg: any): Record<string, string> {
    return (msg.payload.headers || []).reduce((acc: Record<string, string>, header: any) => {
      acc[header.name.toLowerCase()] = header.value;
      return acc;
    }, {});
  }

  private extractSenderInfo(fromHeader: string): { senderName: string; senderEmail: string } {
    const from = fromHeader || 'Unknown Sender';
    const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
    return {
      senderName: senderMatch ? senderMatch[1].trim().replace(/"/g, '') : from,
      senderEmail: senderMatch ? senderMatch[2] : from,
    };
  }

  private getFullEmailBody(payload: any): string {
    if (!payload) return '';

    const findPart = (parts: any[], mimeType: string): any => {
      for (const part of parts) {
        if (part.mimeType === mimeType) return part;
        if (part.parts) {
          const result = findPart(part.parts, mimeType);
          if (result) return result;
        }
      }
      return null;
    };

    const htmlPart = findPart(payload.parts || [], 'text/html');
    if (htmlPart?.body?.data) return htmlPart.body.data;

    const textPart = findPart(payload.parts || [], 'text/plain');
    if (textPart?.body?.data) return textPart.body.data;

    return payload.body?.data || '';
  }

  private decodeEmailBody(data: string): string {
    try {
      if (!data) return '';
      const sanitized = data.replace(/-/g, '+').replace(/_/g, '/');
      return atob(sanitized);
    } catch (error) {
      console.error('Decoding error:', error);
      return 'Could not decode email content';
    }
  }

  private formatDate(timestamp: string): string {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}