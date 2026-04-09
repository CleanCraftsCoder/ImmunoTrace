import { Router } from 'express';
import { Mistral } from '@mistralai/mistralai';
import { createClient } from '@supabase/supabase-js';

export const chatRouter = Router();

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SYSTEM_PROMPT = `You are ImmunoTrace AI — a caring, knowledgeable health assistant.

RULES:
1. You ONLY answer based on the user's own medical records provided in the context below. NEVER invent or hallucinate medical information.
2. If the user's records don't contain enough information, say: "I don't have enough data in your records to answer this. Please upload more prescriptions."
3. NEVER prescribe medicines. If asked "what medicine should I take?", respond: "Please consult your doctor for prescriptions. I can suggest some home remedies and comfort care tips instead."
4. You CAN suggest:
   - Ayurvedic home remedies (tulsi, ginger, kadha recipes)
   - Comfort care tips (rest, hydration, warm water)
   - Lifestyle changes based on patterns you see in their records
5. Be warm, encouraging, and empathetic. Use simple language.
6. When you detect patterns (e.g., recurring illness), mention them helpfully.
7. Format responses with clear sections and bullet points when appropriate.

CONTEXT FROM USER'S MEDICAL RECORDS:
{context}`;

chatRouter.post('/', async (req, res) => {
  try {
    const { message, userId, conversationHistory = [] } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'message and userId required' });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return res.status(500).json({ error: 'Mistral API key not configured' });
    }

    // 1. Embed the user's query
    let context = '';
    try {
      const embeddingResponse = await mistral.embeddings.create({
        model: 'mistral-embed',
        inputs: [message],
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // 2. Search pgvector for matching prescriptions (RPC call)
      const { data: matches, error: matchError } = await supabase.rpc(
        'match_prescriptions',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 5,
          p_user_id: userId,
        }
      );

      if (!matchError && matches?.length) {
        context = matches
          .map(
            (m, i) =>
              `[Record ${i + 1}] Date: ${m.date || 'Unknown'} | Doctor: ${m.doctor_name || 'Unknown'} | Diagnosis: ${m.diagnosis || 'Unknown'} | Medicines: ${JSON.stringify(m.medicines) || 'None'}`
          )
          .join('\n');
      }
    } catch (embError) {
      console.warn('Embedding/search failed, falling back to text search:', embError.message);
    }

    // Fallback: fetch recent prescriptions if vector search failed
    if (!context) {
      const { data: recent } = await supabase
        .from('prescriptions')
        .select('doctor_name, diagnosis, date, medicines')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recent?.length) {
        context = recent
          .map(
            (r, i) =>
              `[Record ${i + 1}] Date: ${r.date || 'Unknown'} | Doctor: ${r.doctor_name || 'Unknown'} | Diagnosis: ${r.diagnosis || 'Unknown'} | Medicines: ${JSON.stringify(r.medicines) || 'None'}`
          )
          .join('\n');
      } else {
        context = 'No medical records found for this user.';
      }
    }

    // 3. Build messages
    const systemMessage = SYSTEM_PROMPT.replace('{context}', context);
    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    // 4. Chat completion
    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages,
      temperature: 0.7,
      maxTokens: 1024,
    });

    const reply = response.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';

    res.json({ reply, context_used: context ? true : false });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});
