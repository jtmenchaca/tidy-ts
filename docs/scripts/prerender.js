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

const distPath = path.join(__dirname, '..', 'dist');
const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

routes.forEach(route => {
  if (route === '/') return;
  
  const routePath = path.join(distPath, ...route.split('/'));
  
  if (!fs.existsSync(routePath)) {
    fs.mkdirSync(routePath, { recursive: true });
  }
  
  fs.writeFileSync(path.join(routePath, 'index.html'), indexHtml);
  console.log(`Created: ${routePath}/index.html`);
});

console.log(`✅ Prerendered ${routes.length} routes`);