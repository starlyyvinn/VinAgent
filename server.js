import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Groq API config
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ============= VINAGENTS IDENTITY =============
const VINAGENTS_IDENTITY = `Kamu adalah VinAgents, asisten coding AI dari Vinn's Community.
IDENTITAS MU:
- Nama: VinAgents
- Asal: Vinn's Community
- Tujuan: Membantu coding, generate website, dan problem solving
- Karakter: Ramah, santai, tapi profesional

ATURAN WAJIB:
1. WAJIB memperkenalkan diri sebagai VinAgents jika ditanya
2. JANGAN PERNAH mengaku sebagai model lain
3. Gunakan bahasa Indonesia yang santai
4. Berikan contoh kode jika relevan`;

// ============= GROQ MODELS =============
const GROQ_MODELS = {
    'llama-70b': {
        id: 'llama-3.3-70b-versatile',
        name: 'VinAgents (Llama 70B)',
        icon: '🦙',
        context: '128K',
        provider: 'Groq',
        speed: '300+ t/s'
    },
    'llama-8b': {
        id: 'llama-3.1-8b-instant',
        name: 'VinAgents (Llama 8B)',
        icon: '⚡',
        context: '128K',
        provider: 'Groq',
        speed: '800+ t/s'
    }
};

// ============= SYSTEM PROMPTS =============
const SYSTEM_PROMPTS = {
    'llama-70b': VINAGENTS_IDENTITY + '\n\nKamu menggunakan backend Llama 70B.',
    'llama-8b': VINAGENTS_IDENTITY + '\n\nKamu menggunakan backend Llama 8B.'
};

// ============= TEST ENDPOINT =============
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'VinAgents API is running',
        time: new Date().toISOString()
    });
});

// ============= CHAT ENDPOINT =============
app.post('/api/chat', async (req, res) => {
    try {
        const { message, model = 'llama-8b', history = [] } = req.body;
        
        const modelConfig = GROQ_MODELS[model];
        if (!modelConfig) {
            return res.status(400).json({ 
                success: false, 
                error: 'Model tidak dikenal' 
            });
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPTS[model] || VINAGENTS_IDENTITY },
            ...history.slice(-6),
            { role: 'user', content: message }
        ];

        const response = await axios.post(GROQ_URL, {
            model: modelConfig.id,
            messages: messages,
            temperature: 0.3,
            max_tokens: 4000
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const aiResponse = response.data.choices[0].message.content;
        
        res.json({
            success: true,
            message: aiResponse,
            model: model,
            modelName: modelConfig.name
        });

    } catch (error) {
        console.error('Chat Error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Gagal memproses permintaan' 
        });
    }
});

// ============= GENERATE WEBSITE - FIXED PARSING =============
app.post('/api/generate-website', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        console.log('🎨 Generating website:', prompt);

        // Deteksi konteks dari prompt
        const lowerPrompt = prompt.toLowerCase();
        let contextStyle = 'modern';
        
        if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('toko') || lowerPrompt.includes('jualan')) {
            contextStyle = 'ecommerce';
        } else if (lowerPrompt.includes('ai') || lowerPrompt.includes('tech') || lowerPrompt.includes('teknologi')) {
            contextStyle = 'tech';
        } else if (lowerPrompt.includes('portofolio') || lowerPrompt.includes('portfolio') || lowerPrompt.includes('fotografer')) {
            contextStyle = 'portfolio';
        } else if (lowerPrompt.includes('kreatif') || lowerPrompt.includes('creative') || lowerPrompt.includes('art')) {
            contextStyle = 'creative';
        }

        const systemPrompt = `Kamu adalah VinAgents Web Generator, spesialis membuat website modern.

KONTEKS: ${contextStyle}

BUAT WEBSITE LENGKAP DENGAN:
- HTML: struktur semantic (header, main, section, footer)
- CSS: modern, responsive (mobile first), warna netral, rounded corners, hover efek
- JavaScript: minimal (untuk interaksi jika perlu)

PENTING: Output HARUS JSON MURNI, TANPA TEKS LAIN, TANPA MARKDOWN, TANPA \`\`\`!

FORMAT JSON WAJIB:
{
    "html": "kode HTML lengkap (tanpa <html><body>)",
    "css": "kode CSS lengkap dengan media queries",
    "js": "kode JavaScript (bisa kosong)",
    "title": "judul website",
    "description": "deskripsi singkat"
}

CONTOH:
{
    "html": "<header>...</header><main>...</main><footer>...</footer>",
    "css": "body { font-family: sans-serif; } .container { max-width: 1200px; }",
    "js": "console.log('hello');",
    "title": "Website Portfolio",
    "description": "Portfolio fotografer minimalis"
}`;

        const aiResponse = await axios.post(GROQ_URL, {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 6000
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        // Ambil response text
        let content = aiResponse.data.choices[0].message.content;
        
        console.log('📝 Raw AI response:', content.substring(0, 200) + '...');
        
        // Bersihin response dari markdown atau teks tambahan
        content = content.trim();
        
        // Hapus ```json atau ``` jika ada
        content = content.replace(/```json\n?/g, '');
        content = content.replace(/```\n?/g, '');
        
        // Coba extract JSON object (ambil dari { pertama sampai } terakhir)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }
        
        console.log('📝 Cleaned content:', content.substring(0, 200) + '...');
        
        // Parse JSON
        let websiteData;
        try {
            websiteData = JSON.parse(content);
        } catch (e) {
            console.error('JSON Parse Error:', e.message);
            
            // Fallback: coba benerin JSON umum
            try {
                // Hapus trailing commas
                content = content.replace(/,(\s*[}\]])/g, '$1');
                // Ganti single quote dengan double quote
                content = content.replace(/'/g, '"');
                websiteData = JSON.parse(content);
            } catch (e2) {
                console.error('Fallback parse juga gagal');
                
                // Return error detail
                return res.status(500).json({ 
                    success: false, 
                    error: 'Gagal parse response AI. Coba lagi dengan prompt yang lebih spesifik.' 
                });
            }
        }

        // Validasi struktur
        if (!websiteData.html || !websiteData.css) {
            return res.status(500).json({ 
                success: false, 
                error: 'AI gagal generate struktur lengkap (html/css tidak lengkap)' 
            });
        }

        // Generate preview HTML
        const previewHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${websiteData.title || 'VinAgents Preview'}</title>
    <style>
        /* Reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        ${websiteData.css}
    </style>
</head>
<body>
    ${websiteData.html}
    <script>${websiteData.js || ''}</script>
</body>
</html>`;

        res.json({
            success: true,
            html: websiteData.html,
            css: websiteData.css,
            js: websiteData.js || '',
            title: websiteData.title || 'Website Preview',
            description: websiteData.description || '',
            preview: previewHtml,
            context: contextStyle
        });

    } catch (error) {
        console.error('Generate website error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Terjadi kesalahan saat generate website' 
        });
    }
});

// ============= MODELS ENDPOINT =============
app.get('/api/models', (req, res) => {
    const modelsList = Object.entries(GROQ_MODELS).map(([id, config]) => ({
        id,
        name: config.name,
        icon: config.icon,
        context: config.context,
        provider: config.provider,
        free: true
    }));
    
    res.json({
        success: true,
        models: modelsList
    });
});

// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'VinAgents API running',
        time: new Date().toISOString()
    });
});

// ============= TEST GENERATE (DEBUG) =============
app.post('/api/test-generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const aiResponse = await axios.post(GROQ_URL, {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'Kamu adalah asisten. Output JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        res.json({
            success: true,
            raw: aiResponse.data.choices[0].message.content
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 VinAgents running on http://localhost:${PORT}`);
    console.log(`✅ Generate website dengan parsing fix!`);
});
