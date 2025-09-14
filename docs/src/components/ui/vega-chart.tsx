import React from "react";
import { VegaEmbed } from "react-vega";

export interface VegaChartProps {
  spec: any;
  data?: any[];
  className?: string;
  width?: number | "container";
  height?: number;
}

export function VegaChart({
  spec,
  data,
  className = "",
  width,
  height,
}: VegaChartProps) {
  const vegaSpec = React.useMemo(() => {
    const finalSpec = { ...spec };

    // Set dimensions if provided
    if (width !== undefined) {
      finalSpec.width = width;
    }
    if (height !== undefined) {
      finalSpec.height = height;
    }

    // Add data if provided
    if (data) {
      finalSpec.data = { values: data };
    }

    return finalSpec;
  }, [spec, data, width, height]);

  const options = {
    actions: false,
    renderer: "svg" as const,
  };

  return (
    <div className={`vega-chart-container ${className}`}>
      <VegaEmbed
        spec={vegaSpec}
        options={options}
        onError={(error) => console.error("Vega chart error:", error)}
      />
    </div>
  );
}
