// File ini berjalan murni di Server Vercel, tersembunyi dari user
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Image } = req.body;

    const response = await fetch("https://api.mistral.ai/v1/ocr", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Membaca API Key dengan aman di sisi server
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