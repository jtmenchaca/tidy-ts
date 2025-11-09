# Graph/Visualization System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Create visualizations easily** | `df.graph()` method provides simple API. Just specify x, y, and type. |
| **Vector graphics output** | SVG format - scalable, crisp at any size. Good for publications and presentations. |
| **Fast rendering** | WASM-based rendering (resvg) for performance. Handles large datasets efficiently. |
| **Jupyter integration** | Works in Jupyter notebooks via anywidget. Interactive widgets supported. |
| **Customizable styling** | Configurable colors, sizes, labels. Make plots look how you want. |

## Components

| Component | Purpose |
|-----------|---------|
| **Graph API** | `df.graph()` method for creating visualizations |
| **Scatter plots** | Point plots with configurable styling |
| **SVG export** | Vector graphics output |
| **Widget support** | Jupyter/anywidget integration for notebooks |

## Usage

```typescript
df.graph({
  x: "age",
  y: "height",
  type: "scatter"
})
```

## Implementation

| Goal | Implementation |
|------|----------------|
| **Fast rendering** | Uses resvg WASM for SVG rendering. Near-native performance. |
| **Custom fonts** | Inter font embedded. Consistent typography. |
| **Styling** | Configurable colors, sizes, labels. Flexible appearance. |

## Benefits

- **Vector graphics**: Scalable, crisp output
- **Fast**: WASM rendering handles large datasets
- **Jupyter support**: Works in notebooks
- **Customizable**: Control appearance
