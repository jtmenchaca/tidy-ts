import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card.tsx";

export function StatsModuleReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats Module Reference</CardTitle>
        <CardDescription>
          Comprehensive statistical functions available in mutate
          operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Statistics</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>stats.sum()</code> - Sum of values
              </li>
              <li>
                • <code>stats.mean()</code> - Arithmetic mean
              </li>
              <li>
                • <code>stats.median()</code> - Median value
              </li>
              <li>
                • <code>stats.mode()</code> - Most frequent value
              </li>
              <li>
                • <code>stats.min()</code> - Minimum value
              </li>
              <li>
                • <code>stats.max()</code> - Maximum value
              </li>
              <li>
                • <code>stats.product()</code> - Product of values
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Spread & Distribution</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>stats.range()</code> - Range (max - min)
              </li>
              <li>
                • <code>stats.variance()</code> - Variance
              </li>
              <li>
                • <code>stats.stdev()</code> - Standard deviation
              </li>
              <li>
                • <code>stats.iqr()</code> - Interquartile range
              </li>
              <li>
                • <code>stats.quantile()</code>{" "}
                - Quantiles and percentiles
              </li>
              <li>
                • <code>stats.quartiles()</code>{" "}
                - First, second, third quartiles
              </li>
              <li>
                • <code>stats.percentileRank()</code> - Percentile rank
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Advanced Functions</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>stats.rank()</code> - Ranking values
              </li>
              <li>
                • <code>stats.denseRank()</code> - Dense ranking
              </li>
              <li>
                • <code>stats.cumsum()</code> - Cumulative sum
              </li>
              <li>
                • <code>stats.cummean()</code> - Cumulative mean
              </li>
              <li>
                • <code>stats.cumprod()</code> - Cumulative product
              </li>
              <li>
                • <code>stats.cummin()</code> - Cumulative minimum
              </li>
              <li>
                • <code>stats.cummax()</code> - Cumulative maximum
              </li>
              <li>
                • <code>stats.lag()</code> - Lag values
              </li>
              <li>
                • <code>stats.lead()</code> - Lead values
              </li>
              <li>
                • <code>stats.normalize()</code> - Normalize values
              </li>
              <li>
                • <code>stats.round()</code> - Round to decimal places
              </li>
              <li>
                • <code>stats.floor()</code> - Floor values
              </li>
              <li>
                • <code>stats.ceiling()</code> - Ceiling values
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Bivariate Statistics</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>stats.covariance()</code> - Covariance
              </li>
              <li>
                • <code>stats.corr()</code> - Correlation coefficient
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Count & Unique</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>stats.unique()</code> - Unique values
              </li>
              <li>
                • <code>stats.uniqueCount()</code>{" "}
                - Count of unique values
              </li>
              <li>
                • <code>stats.countValue()</code> - Count specific value
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
