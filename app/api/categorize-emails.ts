import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Type definitions
interface EmailForCategorization {
    id: string;
    content: string;
}

interface CategorizationRequest {
    emails: EmailForCategorization[];
    labels: string[];
}

interface ExternalAPIRequest {
    emails: [string, number][]; // [content, id]
    categories: string[];
}

interface ClassificationResult {
    id: number;
    category: string;
}

interface ExternalAPIResponse {
    classifications: ClassificationResult[];
}

interface CategorizationResult {
    emailId: string;
    labelName: string;
}

interface CategorizationResponse {
    categorizations: CategorizationResult[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CategorizationResponse>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const body = req.body as CategorizationRequest;

        if (!body.emails || !body.labels) {
            return res.status(400).json({ categorizations: [] });
        }

        // Prepare data for external API in required format
        const externalRequest: ExternalAPIRequest = {
            emails: body.emails.map(email => [
                email.content,
                parseInt(email.id) || Date.now() // Fallback to timestamp if invalid ID
            ]),
            categories: body.labels
        };

        console.log('External API Request:', externalRequest);

        // Call external classification API using Axios
        const response = await axios.post<ExternalAPIResponse>(
            'https://ecf1-2402-a00-408-2632-3059-beb-8821-7452.ngrok-free.app/classify',
            externalRequest,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000 // 30 seconds timeout
            }
        );

        // Convert external API response to our format
        const categorizations: CategorizationResult[] = response.data.classifications.map(c => ({
            emailId: c.id.toString(),
            labelName: c.category
        }));

        res.status(200).json({ categorizations });
    } catch (error: any) {
        console.error('Categorization error:', error);

        // Provide detailed error information
        let errorMessage = 'Internal server error';
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('External API responded with error:', error.response.status, error.response.data);
                errorMessage = `External API error: ${error.response.status} ${error.response.statusText}`;
            } else if (error.request) {
                console.error('No response received from external API');
                errorMessage = 'No response from classification service';
            } else {
                console.error('Request setup error:', error.message);
                errorMessage = `Request error: ${error.message}`;
            }
        }

        // Return empty categorizations with 500 status
        res.status(500).json({
            categorizations: [],
            error: errorMessage // Optional: include error message in response
        });
    }
}