import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const uploadRouter = Router();

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

uploadRouter.post('/prescription', async (req, res) => {
  try {
    const { fileData, fileName, userId } = req.body;

    if (!fileData || !fileName || !userId) {
      return res.status(400).json({ error: 'fileData, fileName, and userId are required' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Supabase service role not configured' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Upload using service role (bypasses RLS)
    const uploadPath = `${userId}/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from('prescription-images')
      .upload(uploadPath, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('prescription-images')
      .getPublicUrl(data.path);

    res.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    });
  } catch (err) {
    console.error('Upload route error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});
