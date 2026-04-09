import { Router } from 'express';
import { Mistral } from '@mistralai/mistralai';
import { createClient } from '@supabase/supabase-js';

export const embedRouter = Router();

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

embedRouter.post('/', async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text || !userId) {
      return res.status(400).json({ error: 'text and userId required' });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return res.status(500).json({ error: 'Mistral API key not configured' });
    }

    // Generate embedding
    const embeddingResponse = await mistral.embeddings.create({
      model: 'mistral-embed',
      inputs: [text],
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Find the most recent prescription for this user without an embedding
    const { data: prescription, error: fetchError } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('user_id', userId)
      .is('embedding', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !prescription) {
      return res.json({ success: true, message: 'No prescription to update' });
    }

    // Update the prescription with the embedding
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({ embedding })
      .eq('id', prescription.id);

    if (updateError) {
      console.error('Embedding update error:', updateError);
      return res.status(500).json({ error: 'Failed to store embedding' });
    }

    res.json({ success: true, prescriptionId: prescription.id });
  } catch (error) {
    console.error('Embed error:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});
