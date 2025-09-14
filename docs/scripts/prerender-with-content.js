import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routes = [
  '/',
  '/getting-started',
  '/creating-dataframes',
  '/dataframe-basics',
  '/selecting-columns',
  '/filtering-rows',
  '/transforming-data',
  '/sorting-arranging',
  '/grouping-aggregation',
  '/joining-dataframes',
  '/reshaping-data',
  '/missing-data',
  '/async-operations',
  '/stats-module',
  '/performance-benchmarks',
  '/combining-dataframes',
  '/transposing-data',
  '/examples/jupyter-notebooks',
  '/examples/comprehensive-workflows'
];

async function prerender() {
  console.log('🚀 Starting prerendering with Playwright...');
  
  // Start a local server
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { port: 5173 },
    root: path.join(__dirname, '..'),
  });
  
  await vite.listen();
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  for (const route of routes) {
    try {
      const url = `http://localhost:5173/tidy-ts${route}`;
      console.log(`📄 Rendering: ${url}`);
      
      // Navigate and wait for content to load
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait a bit more for any async content
      await page.waitForTimeout(1000);
      
      // Get the fully rendered HTML
      const html = await page.content();
      
      // Determine output path
      const outputPath = route === '/' 
        ? path.join(__dirname, '..', 'dist', 'index.html')
        : path.join(__dirname, '..', 'dist', ...route.split('/'), 'index.html');
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write the fully rendered HTML
      fs.writeFileSync(outputPath, html);
      console.log(`✅ Saved: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Error rendering ${route}:`, error.message);
    }
  }
  
  await browser.close();
  await vite.close();
  
  console.log('🎉 Prerendering complete!');
}

prerender().catch(console.error);