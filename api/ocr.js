import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Image, turnstileToken } = req.body;
    const authHeader = req.headers.authorization;

    let isAuthorized = false;

    // 1. Validasi jika diakses oleh Admin yang sudah login (membawa Supabase JWT)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        isAuthorized = true;
      }
    }

    // 2. Validasi jika diakses oleh Tim Lapangan (Publik membawa Turnstile Token)
    if (!isAuthorized && turnstileToken) {
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: turnstileToken,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Akses ditolak: Verifikasi bot gagal atau Anda belum login.' });
    }

    if (!base64Image) {
      return res.status(400).json({ error: 'Gambar tidak ditemukan.' });
    }

    // Panggil Mistral OCR API secara aman di server
    const response = await fetch("https://api.mistral.ai/v1/ocr", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` 
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: { type: "image_url", image_url: base64Image },
        include_image_base64: true,
        include_blocks: true
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Mistral API Error' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}