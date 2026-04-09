import { Router } from 'express';
import { Mistral } from '@mistralai/mistralai';

export const ocrRouter = Router();

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });

ocrRouter.post('/', async (req, res) => {
  try {
    const { imageUrl, imageBase64 } = req.body;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ error: 'imageUrl or imageBase64 required' });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return res.status(500).json({ error: 'Mistral API key not configured' });
    }

    const imageContent = imageUrl
      ? { type: 'image_url', imageUrl: imageUrl }
      : { type: 'image_url', imageUrl: `data:image/jpeg;base64,${imageBase64}` };

    const response = await mistral.chat.complete({
      model: 'pixtral-12b-2409',
      messages: [
        {
          role: 'system',
          content: `You are a medical prescription OCR assistant. Extract the following from the prescription image and return ONLY valid JSON (no markdown, no explanation):
{
  "doctor_name": "string - the prescribing doctor's name",
  "diagnosis": "string - the disease or condition diagnosed",
  "date": "string - date in YYYY-MM-DD format",
  "medicines": [
    {
      "name": "string - medicine name",
      "mg": "string - dosage e.g. '500mg'",
      "frequency": "string - how often e.g. '3x daily' or 'twice daily'",
      "duration": "string - how long e.g. '5 days' or '1 week'"
    }
  ]
}

If you cannot read a field, use an empty string. Always return valid JSON.`,
        },
        {
          role: 'user',
          content: [
            imageContent,
            { type: 'text', text: 'Extract the prescription details from this image.' },
          ],
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text;
    if (typeof jsonStr === 'string') {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      jsonStr = jsonStr.trim();
    }

    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'Failed to process prescription image' });
  }
});
