import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url);
const multiparty = require('multiparty');
const pdf = require('pdf-parse');

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'hf-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/generate-image' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { prompt } = JSON.parse(body);
                  const hfResponse = await fetch(
                    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-2",
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${env.VITE_HF_API_KEY}`,
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({ inputs: prompt })
                    }
                  );

                  if (!hfResponse.ok) {
                    const errText = await hfResponse.text();
                    throw new Error(`HF API error: ${hfResponse.status} - ${errText}`);
                  }

                  const buffer = await hfResponse.arrayBuffer();
                  const base64 = Buffer.from(buffer).toString("base64");

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    image: `data:image/png;base64,${base64}`
                  }));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
            } else if (req.url.startsWith('/search-video') && req.method === 'GET') {
              const urlObj = new URL(req.url, 'http://localhost');
              const query = urlObj.searchParams.get('q') || 'educational video';
              const pipedInstances = [
                'https://pipedapi.kavin.rocks',
                'https://piped-api.garudalinux.org',
                'https://api.piped.yt',
              ];
              let videoId = null;
              for (const instance of pipedInstances) {
                try {
                  const r = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=videos`);
                  if (!r.ok) continue;
                  const d = await r.json();
                  const first = d.items?.find(i => i.url?.includes('watch'));
                  if (first) {
                    videoId = new URL('https://youtube.com' + first.url).searchParams.get('v');
                    if (videoId) break;
                  }
                } catch { continue; }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ videoId }));
            } else if (req.url === '/extract-text' && req.method === 'POST') {
              const form = new multiparty.Form();
              form.parse(req, async (err, fields, files) => {
                if (err || !files.file) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Upload failed' }));
                  return;
                }
                
                try {
                  const file = files.file[0];
                  const dataBuffer = fs.readFileSync(file.path);
                  const data = await pdf(dataBuffer);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ text: data.text }));
                } catch (pdfErr) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'PDF parsing failed' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
  }
})
