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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: `You are a world geography and travel expert. Analyze this image and identify the location shown. Respond ONLY with a valid JSON object, no markdown, no backticks:
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
If you cannot identify it, set identified to false and use empty strings for all other fields.` }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);

  } catch (err) {
    console.error('FULL ERROR:', JSON.stringify(err.message));
res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
