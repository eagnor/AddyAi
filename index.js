const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/identify', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` }
            },
            {
              type: 'text',
              text: `You are a world geography and travel expert. Analyze this image and identify the location shown. Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "identified": true,
  "place_name": "specific landmark or area name",
  "city": "nearest city",
  "country": "country",
  "continent": "continent",
  "best_time_to_visit": "e.g. October to March",
  "known_for": "one sentence about what it is famous for",
  "description": "2-3 sentences about the place",
  "google_maps_query": "search string for Google Maps",
  "confidence": "high or medium or low"
}
If you cannot identify it, set identified to false and use empty strings for all other fields.`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    console.error('GROQ RESPONSE:', JSON.stringify(data));
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);

  } catch (err) {
    console.error('FULL ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
