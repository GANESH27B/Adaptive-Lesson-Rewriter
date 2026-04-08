import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
            } else {
              next();
            }
          });
        }
      }
    ],
  }
})
