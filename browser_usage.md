# Browser Usage Guide

This guide explains how to use `@tidy-ts/dataframe` in browser environments.

## Installation

### Using Import Maps (Recommended)

Add an import map to your HTML file to use tidy-ts from a CDN:

```html
<!DOCTYPE html>
<html>
<head>
    <script type="importmap">
    {
        "imports": {
            "@tidy-ts/dataframe": "https://esm.sh/@jsr/tidy-ts__dataframe@1.0.28"
        }
    }
    </script>
</head>
<body>
    <script type="module">
        // Your code here
    </script>
</body>
</html>
```

### Using Direct ESM Import

You can also import directly from a CDN without an import map:

```javascript
import { createDataFrame, stats, setupTidyTS } from 'https://esm.sh/@jsr/tidy-ts__dataframe@1.0.28';
```

## Browser Setup

**Important**: Before using statistical functions or distributions in the browser, you must call `setupTidyTS()` once. This initializes the WebAssembly module required for statistical computations.

```javascript
import { setupTidyTS, createDataFrame, stats } from '@tidy-ts/dataframe';

// Required: Initialize WASM module (call once at app startup)
await setupTidyTS();

// Now you can use tidy-ts normally
const df = createDataFrame([{a: 1, b: 2}, {a: 3, b: 4}]);
const sum = stats.sum(df.a);
```

### When to Call `setupTidyTS()`

- **Required**: Before using `stats.*` functions or statistical distributions (`s.dist.*`)
- **Optional**: For basic DataFrame operations (create, filter, mutate, groupBy, etc.) - these work without setup
- **Call once**: Initialize at application startup, not before each operation

## Basic Usage Examples

### Minimal Example

```html
<!DOCTYPE html>
<html>
<head>
    <script type="importmap">
    {
        "imports": {
            "@tidy-ts/dataframe": "https://esm.sh/@jsr/tidy-ts__dataframe@1.0.28"
        }
    }
    </script>
</head>
<body>
    <div id="output"></div>
    <script type="module">
        const { createDataFrame, stats } = await import('@tidy-ts/dataframe');
        
        // Create a DataFrame
        const sales = createDataFrame([
            { product: "Widget", quantity: 10, price: 100, region: "North" },
            { product: "Gadget", quantity: 5, price: 200, region: "South" },
            { product: "Widget", quantity: 20, price: 100, region: "South" },
        ]);
        
        // Analyze data
        const analysis = sales
            .mutate({ revenue: (r) => r.quantity * r.price })
            .groupBy("region")
            .summarize({
                total_revenue: (df) => stats.sum(df.revenue),
                avg_quantity: (df) => stats.mean(df.quantity),
                product_count: (df) => df.nrows(),
            })
            .arrange("total_revenue", "desc");
        
        // Display results
        document.getElementById('output').textContent = 
            JSON.stringify(analysis.toArray(), null, 2);
    </script>
</body>
</html>
```

### With Statistical Functions

```html
<!DOCTYPE html>
<html>
<head>
    <script type="importmap">
    {
        "imports": {
            "@tidy-ts/dataframe": "https://esm.sh/@jsr/tidy-ts__dataframe@1.0.28"
        }
    }
    </script>
</head>
<body>
    <div id="output"></div>
    <script type="module">
        const { createDataFrame, stats, setupTidyTS } = await import('@tidy-ts/dataframe');
        
        // Initialize WASM (required for stats functions)
        await setupTidyTS();
        
        // Create DataFrame
        const df = createDataFrame([
            { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }
        ]);
        
        // Use statistical functions
        const mean = stats.mean(df.value);
        const stdDev = stats.std(df.value);
        const median = stats.median(df.value);
        
        document.getElementById('output').innerHTML = `
            <p>Mean: ${mean}</p>
            <p>Standard Deviation: ${stdDev}</p>
            <p>Median: ${median}</p>
        `;
    </script>
</body>
</html>
```

### With Statistical Distributions

```html
<!DOCTYPE html>
<html>
<head>
    <script type="importmap">
    {
        "imports": {
            "@tidy-ts/dataframe": "https://esm.sh/@jsr/tidy-ts__dataframe@1.0.28"
        }
    }
    </script>
</head>
<body>
    <div id="output"></div>
    <script type="module">
        const { createDataFrame, s, setupTidyTS } = await import('@tidy-ts/dataframe');
        
        // Initialize WASM (required for distributions)
        await setupTidyTS();
        
        // Generate normal distribution PDF data
        const normalPDFData = s.dist.normal.data({
            mean: 0,
            standardDeviation: 1,
            type: "pdf",
            range: [-4, 4],
            points: 50
        });
        
        // Display first few rows
        const preview = normalPDFData.toArray().slice(0, 5);
        document.getElementById('output').textContent = 
            JSON.stringify(preview, null, 2);
    </script>
</body>
</html>
```

## Complete Example with Error Handling

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tidy-TS Browser Example</title>
    <script type="importmap">
    {
        "imports": {
            "@tidy-ts/dataframe": "https://esm.sh/@jsr/tidy-ts__dataframe@1.0.28"
        }
    }
    </script>
    <style>
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .output {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .error {
            background: #fee;
            color: #c00;
        }
    </style>
</head>
<body>
    <h1>Tidy-TS Browser Example</h1>
    <div id="status">Loading...</div>
    <div id="output" class="output"></div>
    
    <script type="module">
        const statusDiv = document.getElementById('status');
        const outputDiv = document.getElementById('output');
        
        function log(message) {
            outputDiv.textContent += message + '\n';
            console.log(message);
        }
        
        try {
            // Import the library
            const { createDataFrame, stats, setupTidyTS } = await import('@tidy-ts/dataframe');
            log("✅ Library imported successfully");
            
            // Initialize WASM (required for stats)
            await setupTidyTS();
            log("✅ WASM initialized");
            
            // Create DataFrame
            const df = createDataFrame([
                { name: "Alice", age: 30, score: 85 },
                { name: "Bob", age: 25, score: 92 },
                { name: "Charlie", age: 35, score: 78 },
            ]);
            log("✅ DataFrame created");
            
            // Perform analysis
            const analysis = df
                .mutate({ 
                    grade: (r) => r.score >= 90 ? "A" : r.score >= 80 ? "B" : "C" 
                })
                .groupBy("grade")
                .summarize({
                    count: (df) => df.nrows(),
                    avg_age: (df) => stats.mean(df.age),
                    avg_score: (df) => stats.mean(df.score),
                })
                .arrange("avg_score", "desc");
            
            log("\n📊 Analysis Results:");
            log(JSON.stringify(analysis.toArray(), null, 2));
            
            statusDiv.textContent = "✅ Success!";
            statusDiv.style.color = "green";
            
        } catch (error) {
            log(`❌ Error: ${error.message}`);
            log(`Stack: ${error.stack}`);
            statusDiv.textContent = "❌ Error occurred";
            statusDiv.style.color = "red";
            outputDiv.classList.add("error");
        }
    </script>
</body>
</html>
```

## Key Points

1. **Import Maps**: Use import maps for cleaner imports and better compatibility
2. **ESM Modules**: Always use `<script type="module">` for ES module support
3. **setupTidyTS()**: Call once before using statistical functions or distributions
4. **Async/Await**: Use async/await for `setupTidyTS()` and imports
5. **CDN**: Use `esm.sh` or `jsr.io` CDN for browser distribution
6. **Version Pinning**: Pin to a specific version (e.g., `@1.0.28`) for production

## Supported Browsers

tidy-ts works in all modern browsers that support:
- ES Modules (`import`/`export`)
- WebAssembly
- Async/await

Tested browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (WebKit)

## Troubleshooting

### "WASM not loaded yet" Error

Make sure you've called `await setupTidyTS()` before using statistical functions:

```javascript
// ❌ Wrong
const df = createDataFrame([{x: 1}]);
const mean = stats.mean(df.x); // Error!

// ✅ Correct
await setupTidyTS();
const df = createDataFrame([{x: 1}]);
const mean = stats.mean(df.x); // Works!
```

### Import Errors

Ensure your import map is correct and the CDN URL is accessible:

```javascript
// Check if import map is properly formatted
<script type="importmap">
{
    "imports": {
        "@tidy-ts/dataframe": "https://esm.sh/@jsr/tidy-ts__dataframe@1.0.28"
    }
}
</script>
```

### CORS Issues

If hosting locally, make sure your server supports CORS for the WASM file. Using a CDN (like `esm.sh`) typically handles this automatically.

## Advanced Usage

### Custom WASM URL

If you need to host the WASM file yourself:

```javascript
await setupTidyTS("https://your-cdn.com/path/to/tidy_ts_dataframe.wasm");
```

### Using with Build Tools

If using a bundler (Vite, Webpack, etc.), you can import normally:

```javascript
import { createDataFrame, stats, setupTidyTS } from '@tidy-ts/dataframe';

await setupTidyTS();
// Use tidy-ts...
```

The bundler will handle the WASM file automatically.

## Resources

- [JSR Package Page](https://jsr.io/@tidy-ts/dataframe)
- [GitHub Repository](https://github.com/jtmenchaca/tidy-ts)
- [Documentation](https://jtmenchaca.github.io/tidy-ts/)

