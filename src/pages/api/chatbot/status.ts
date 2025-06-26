import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to connect to the chatbot backend
    const response = await fetch('http://localhost:3001/api/chatbot/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      return res.status(200).json(data);
    }

    // If we can't connect to the backend, return a fallback status
    return res.status(200).json({
      initialized: false,
      available: false,
      model_id: 'unavailable',
      note: 'Backend service is not running'
    });
  } catch (error) {
    console.error('Error checking chatbot status:', error);
    return res.status(500).json({
      initialized: false,
      available: false,
      model_id: 'error',
      note: 'Error connecting to backend service'
    });
  }
}
