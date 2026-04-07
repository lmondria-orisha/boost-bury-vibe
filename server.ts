import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy endpoint to handle CORS
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    const configOverride = req.headers["twn-config-override"] as string;

    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    console.log('--- Proxy Request ---');
    console.log('Target URL:', targetUrl);
    console.log('Incoming Headers:', req.headers);

    try {
      const forwardHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'Tweakwise-Explorer-Proxy'
      };

      if (configOverride) {
        forwardHeaders["TWN-Config-Override"] = configOverride;
      }

      console.log('Forwarding Headers:', forwardHeaders);

      const response = await fetch(targetUrl, { 
        headers: forwardHeaders 
      });
      const data = await response.json();
      
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
