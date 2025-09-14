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
  
  // Start a local server serving the built dist folder
  const { preview } = await import('vite');
  const server = await preview({
    root: path.join(__dirname, '..'),
    preview: {
      port: 5173,
      host: true
    }
  });
  
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
  await server.close();
  
  console.log('🎉 Prerendering complete!');
}

prerender().catch(console.error);