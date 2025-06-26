import { NextApiRequest, NextApiResponse } from 'next';
import { checkSocialFeatures } from '../../lib/checkSocialFeatures';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = await checkSocialFeatures();
    res.status(200).json(status);
  } catch (error) {
    console.error('Error checking social features:', error);
    res.status(500).json({ error: 'Error checking social features' });
  }
}
