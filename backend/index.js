const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Coffee Wilt Expert Backend' });
});

async function getWeatherData(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'your_weather_key_here') {
    return { temp: 22, humidity: 70, description: 'High Altitude Mist (Simulated)' };
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    return { temp: data.main.temp, humidity: data.main.humidity, description: data.weather[0].description };
  } catch (e) { return null; }
}

app.post('/api/detect', async (req, res) => {
  const { imageBase64, fieldName, notes, soilMoisture, temperature, location } = req.body;
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Gemini Key Missing' });
  if (!imageBase64) return res.status(400).json({ error: 'Missing Image' });

  try {
    let weather = null;
    if (location?.latitude) weather = await getWeatherData(location.latitude, location.longitude);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a World-Class Coffee Agronomist and Pathologist.
      Analyze this coffee plant (Arabica/Robusta) for diseases like:
      - Coffee Leaf Rust (Hemileia vastatrix)
      - Coffee Wilt Disease (Gibberella xylarioides)
      - Coffee Berry Borer
      - Nutrient deficiencies (N, P, K, Zinc)

      Data:
      - Section: ${fieldName || 'Unknown'}
      - Soil Moist: ${soilMoisture}%
      - Weather: ${weather ? `${weather.temp}C, ${weather.description}` : 'N/A'}
      - Note: ${notes}

      Return JSON:
      {
        "label": "Disease Name",
        "confidence": 0.95,
        "severity": "low|medium|high",
        "reasoning": "Explain visual signs like orange pustules or branch dieback.",
        "advice": "Specific coffee management steps."
      }
    `;

    const result = await model.generateContent([prompt, { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    const detection = JSON.parse(response.text().match(/\{[\s\S]*\}/)[0]);

    return res.json({
      status: 'success',
      detection: { ...detection, id: Date.now().toString(), field: fieldName, timestamp: new Date().toISOString(), weather }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { question, previousDiagnosis, imageBase64 } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let contextPrompt = "You are a World-Class Coffee Agronomist. Provide helpful, professional, and practical advice to coffee farmers.";
    if (previousDiagnosis) {
      contextPrompt += ` The farmer is asking about a previous diagnosis: ${previousDiagnosis.label}.`;
    }

    const prompt = `${contextPrompt}\n\nFarmer's Question: "${question}"`;

    const parts = [prompt];
    if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: "image/jpeg" } });

    const result = await model.generateContent(parts);
    res.json({ status: 'success', answer: (await result.response).text().trim() });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ status: 'error', message: 'Failed to reach AI agronomist.' });
  }
});

app.listen(port, () => console.log(`CW PRO Backend on ${port}`));
