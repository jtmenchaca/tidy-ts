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
                • <code>s.sum()</code> - Sum of values
              </li>
              <li>
                • <code>s.mean()</code> - Arithmetic mean
              </li>
              <li>
                • <code>s.median()</code> - Median value
              </li>
              <li>
                • <code>s.mode()</code> - Most frequent value
              </li>
              <li>
                • <code>s.min()</code> - Minimum value
              </li>
              <li>
                • <code>s.max()</code> - Maximum value
              </li>
              <li>
                • <code>s.product()</code> - Product of values
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Spread & Distribution</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>s.range()</code> - Range (max - min)
              </li>
              <li>
                • <code>s.variance()</code> - Variance
              </li>
              <li>
                • <code>s.stdev()</code> - Standard deviation
              </li>
              <li>
                • <code>s.iqr()</code> - Interquartile range
              </li>
              <li>
                • <code>s.quantile()</code>{" "}
                - Quantiles and percentiles
              </li>
              <li>
                • <code>s.quartiles()</code>{" "}
                - First, second, third quartiles
              </li>
              <li>
                • <code>s.percentileRank()</code> - Percentile rank
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Advanced Functions</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>s.rank()</code> - Ranking values
              </li>
              <li>
                • <code>s.denseRank()</code> - Dense ranking
              </li>
              <li>
                • <code>s.cumsum()</code> - Cumulative sum
              </li>
              <li>
                • <code>s.cummean()</code> - Cumulative mean
              </li>
              <li>
                • <code>s.cumprod()</code> - Cumulative product
              </li>
              <li>
                • <code>s.cummin()</code> - Cumulative minimum
              </li>
              <li>
                • <code>s.cummax()</code> - Cumulative maximum
              </li>
              <li>
                • <code>s.lag()</code> - Lag values
              </li>
              <li>
                • <code>s.lead()</code> - Lead values
              </li>
              <li>
                • <code>s.normalize()</code> - Normalize values
              </li>
              <li>
                • <code>s.round()</code> - Round to decimal places
              </li>
              <li>
                • <code>s.floor()</code> - Floor values
              </li>
              <li>
                • <code>s.ceiling()</code> - Ceiling values
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Bivariate Statistics</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>s.covariance()</code> - Covariance
              </li>
              <li>
                • <code>s.corr()</code> - Correlation coefficient
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Count & Unique</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <code>s.unique()</code> - Unique values
              </li>
              <li>
                • <code>s.uniqueCount()</code>{" "}
                - Count of unique values
              </li>
              <li>
                • <code>s.countValue()</code> - Count specific value
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
