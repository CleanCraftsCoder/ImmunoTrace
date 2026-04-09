import { Router } from 'express';
import { Mistral } from '@mistralai/mistralai';
import { createClient } from '@supabase/supabase-js';

export const dietRouter = Router();

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const DIET_SYSTEM_PROMPT = `You are ImmunoTrace Diet Advisor — an AI nutritionist that creates personalized diet plans based on the user's medical history.

RULES:
1. Base your advice on the user's prescription history and health profile.
2. NEVER prescribe medicines. Only suggest food, drinks, and lifestyle changes.
3. Include Indian home remedies, kadha recipes, and ayurvedic tips where appropriate.
4. Be specific with quantities, timings, and preparation methods.

For "ill" mode (user is currently sick):
- Focus on foods that help with their current symptoms
- Suggest healing kadha recipes
- Include what to eat AND what to avoid
- Keep meals light and easy to digest

For "well" mode (user is currently healthy):
- Focus on prevention based on their illness patterns
- Boost immunity based on recurring conditions
- Suggest balanced meals for their profile

ALWAYS return your response in this JSON format (no markdown, no explanation):
{
  "mode": "ill" or "well",
  "title": "string - plan title",
  "summary": "string - brief plan overview",
  "eat": ["string - foods to eat with details"],
  "avoid": ["string - foods/drinks to avoid with reason"],
  "kadha_recipe": {
    "name": "string",
    "ingredients": ["string"],
    "method": "string - preparation steps",
    "when_to_drink": "string"
  },
  "meal_plan": {
    "morning": "string",
    "breakfast": "string",
    "mid_morning": "string",
    "lunch": "string",
    "evening_snack": "string",
    "dinner": "string",
    "before_bed": "string"
  },
  "tips": ["string - additional lifestyle tips"]
}`;

dietRouter.post('/', async (req, res) => {
  try {
    const { mode, symptoms, userId } = req.body;

    if (!mode || !userId) {
      return res.status(400).json({ error: 'mode and userId required' });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return res.status(500).json({ error: 'Mistral API key not configured' });
    }

    // Fetch user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch prescription history
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('diagnosis, medicines, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(15);

    const historyContext = prescriptions?.length
      ? prescriptions
          .map(
            (p, i) =>
              `${i + 1}. Date: ${p.date} | Diagnosis: ${p.diagnosis} | Medicines: ${JSON.stringify(p.medicines)}`
          )
          .join('\n')
      : 'No medical history available.';

    const userContext = user
      ? `Age: ${user.age}, Blood Group: ${user.blood_group}, Height: ${user.height_cm}cm, Weight: ${user.weight_kg}kg, Allergies: ${user.allergies?.join(', ') || 'None'}, Location: ${user.location}`
      : 'No profile data.';

    const userMessage =
      mode === 'ill'
        ? `I am currently feeling unwell. My symptoms: ${symptoms || 'general illness'}. 
           
My profile: ${userContext}
My medical history:
${historyContext}

Please create a healing diet plan for me.`
        : `I am currently healthy and want a preventive diet plan.

My profile: ${userContext}
My medical history:
${historyContext}

Based on my illness patterns, create a prevention-focused diet plan.`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: DIET_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.6,
      maxTokens: 2048,
    });

    const text = response.choices?.[0]?.message?.content || '{}';

    // Parse JSON
    let jsonStr = text;
    if (typeof jsonStr === 'string') {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      jsonStr = jsonStr.trim();
    }

    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (error) {
    console.error('Diet error:', error);
    res.status(500).json({ error: 'Failed to generate diet plan' });
  }
});
