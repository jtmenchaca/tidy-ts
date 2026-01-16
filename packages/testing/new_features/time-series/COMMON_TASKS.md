# Common Time-Series Analysis Tasks

This document outlines the most common and essential tasks in time-series data analysis, organized by frequency of use and importance.

## 🎯 Core Workflow: The 80/20 Rule

Most time-series analyses follow this pattern:
1. **Clean & Prepare** (40% of time) - Handle missing data, gaps, duplicates
2. **Transform** (30% of time) - Resample, aggregate, calculate features
3. **Analyze** (20% of time) - Rolling stats, comparisons, joins
4. **Visualize/Export** (10% of time) - Format for reporting

---

## 📊 Category 1: Data Cleaning & Quality (CRITICAL - Do First)

These are the **most common** tasks you'll do on every time-series dataset:

### 1.1 Handle Missing Values ⭐⭐⭐⭐⭐
**Frequency**: Every dataset
**Why**: Real-world data always has gaps

**Common Patterns**:
- **Forward fill** (carry last known value forward) - Most common for prices, sensor readings
- **Backward fill** (carry next known value backward) - Common for end-of-period values
- **Interpolation** - For continuous measurements (temperature, stock prices)
- **Remove** - When gaps indicate data quality issues

**Example Use Cases**:
- Stock prices: Forward fill (last known price)
- Sensor data: Interpolate or forward fill
- Financial data: Forward fill for missing trading days

**Your Implementation**: ✅ `fillForward()`, `fillBackward()` - **DONE**

---

### 1.2 Detect & Handle Gaps ⭐⭐⭐⭐
**Frequency**: Most datasets
**Why**: Need to know if data is reliable

**Common Patterns**:
- Detect missing time periods
- Identify irregular intervals
- Flag gaps larger than expected
- Find missing dates in expected sequence

**Example Use Cases**:
- Trading data: Detect missing trading days
- IoT sensors: Identify sensor failures
- Log data: Find missing log entries

**Your Implementation**: ⏳ `detect-gaps.test.ts` - **NEEDS IMPLEMENTATION**

---

### 1.3 Handle Duplicates ⭐⭐⭐
**Frequency**: Common
**Why**: Data collection can create duplicates

**Common Patterns**:
- Detect duplicate timestamps
- Keep first/last/all duplicates
- Aggregate duplicates (sum, mean, etc.)

**Example Use Cases**:
- API logs: Multiple requests at same timestamp
- Trading data: Multiple trades at same millisecond
- Sensor data: Duplicate readings

**Your Implementation**: ⏳ Not yet planned

---

## 🔄 Category 2: Time-Based Transformations (VERY COMMON)

These operations change the time granularity or structure:

### 2.1 Resampling ⭐⭐⭐⭐⭐
**Frequency**: Very common
**Why**: Need different time granularities for analysis

**Common Patterns**:
- **Downsample**: Hourly → Daily, Daily → Weekly (aggregate)
- **Upsample**: Daily → Hourly (interpolate/fill)
- **Custom frequencies**: 15-min, 30-min intervals

**Example Use Cases**:
- Stock data: Minute → Hourly → Daily
- Sensor data: Second → Minute → Hourly
- Sales data: Daily → Weekly → Monthly

**Aggregation Functions**:
- **Mean/Median**: For continuous values (prices, temperatures)
- **Sum**: For counts/volumes (sales, transactions)
- **First/Last**: For point-in-time values
- **Min/Max**: For ranges

**Your Implementation**: ⏳ `resample.test.ts` - **NEEDS IMPLEMENTATION**

---

### 2.2 Time Grouping ⭐⭐⭐⭐⭐
**Frequency**: Very common
**Why**: Aggregate by time periods

**Common Patterns**:
- Group by: hour, day, week, month, quarter, year
- Custom periods: business days, 15-minute intervals
- Timezone-aware grouping

**Example Use Cases**:
- Sales: Group by day/week/month
- Web traffic: Group by hour/day
- Financial: Group by trading day/month

**Your Implementation**: ⏳ `time-group.test.ts` - **NEEDS IMPLEMENTATION** (can use existing `groupBy` + date helpers)

---

### 2.3 Time Filtering ⭐⭐⭐⭐
**Frequency**: Very common
**Why**: Focus on specific time periods

**Common Patterns**:
- Date range filtering
- Last N days/hours
- Business hours only
- Weekdays vs weekends
- Specific months/quarters

**Example Use Cases**:
- "Show last 30 days"
- "Filter to business hours (9am-5pm)"
- "Only weekdays"
- "Q4 2023 only"

**Your Implementation**: ⏳ `time-filter.test.ts` - **CAN USE EXISTING `filter()`**

---

## 📈 Category 3: Feature Engineering (COMMON)

These create new columns for analysis:

### 3.1 Lag & Lead ⭐⭐⭐⭐⭐
**Frequency**: Very common
**Why**: Compare current vs past/future values

**Common Patterns**:
- **Lag**: Previous period's value
- **Lead**: Next period's value
- **Period-over-period changes**: `(current - lag(1)) / lag(1)`
- **Within groups**: Lag by symbol/category

**Example Use Cases**:
- Stock prices: Compare to yesterday
- Sales: Week-over-week growth
- Temperature: Compare to previous hour

**Your Implementation**: ✅ `stats.lag()`, `stats.lead()` - **DONE**

---

### 3.2 Rolling Windows ⭐⭐⭐⭐⭐
**Frequency**: Very common
**Why**: Smooth data, calculate moving averages

**Common Patterns**:
- **Rolling mean**: Moving average (most common)
- **Rolling sum**: Cumulative sums over window
- **Rolling min/max**: Rolling ranges
- **Rolling std dev**: Volatility measures

**Window Types**:
- **Row-based**: Last N rows (e.g., last 7 rows)
- **Time-based**: Last N hours/days (e.g., last 7 days)

**Example Use Cases**:
- Stock prices: 7-day, 30-day moving averages
- Sales: 4-week rolling average
- Temperature: 24-hour rolling mean

**Your Implementation**: ✅ `stats.rolling()` - **DONE**

---

### 3.3 Time Differences ⭐⭐⭐⭐
**Frequency**: Common
**Why**: Understand time intervals

**Common Patterns**:
- Time between consecutive rows
- Time since first observation
- Time until next observation
- Within groups

**Example Use Cases**:
- Log analysis: Time between events
- Sensor data: Sampling intervals
- User behavior: Time between actions

**Your Implementation**: ⏳ `time-diff.test.ts` - **CAN USE EXISTING `mutate()`**

---

### 3.4 Cumulative Operations ⭐⭐⭐
**Frequency**: Common
**Why**: Running totals, cumulative metrics

**Common Patterns**:
- Cumulative sum
- Cumulative mean
- Cumulative min/max

**Example Use Cases**:
- Sales: Running total
- Stock: Cumulative returns
- Users: Cumulative signups

**Your Implementation**: ✅ `stats.cumsum()`, `stats.cummean()`, etc. - **DONE**

---

## 🔗 Category 4: Joins & Merges (COMMON)

### 4.1 As-of Joins ⭐⭐⭐⭐⭐
**Frequency**: Very common in financial/trading data
**Why**: Match events to nearest prior/future state

**Common Patterns**:
- **Backward**: Match to last known value (most common)
- **Forward**: Match to next known value
- **Nearest**: Match to closest value
- **With tolerance**: Within time window
- **Grouped**: By symbol/category

**Example Use Cases**:
- Trading: Match trades to last known quote
- Events: Match events to nearest measurement
- Logs: Match errors to system state

**Your Implementation**: ✅ `asofJoin()` - **DONE**

---

## 🎨 Category 5: Advanced Operations (LESS COMMON)

### 5.1 Interpolation ⭐⭐⭐
**Frequency**: Less common
**Why**: Fill gaps with estimated values

**Common Patterns**:
- Linear interpolation
- Spline interpolation
- Forward/backward fill (already have)

**Example Use Cases**:
- Sensor data: Fill missing readings
- Stock prices: Fill missing trading days
- Temperature: Fill missing measurements

**Your Implementation**: ⏳ `interpolate.test.ts` - **NEEDS IMPLEMENTATION**

---

### 5.2 Timezone Handling ⭐⭐
**Frequency**: Less common (but critical when needed)
**Why**: Multi-timezone data

**Common Patterns**:
- Convert between timezones
- Handle daylight saving time
- Localize naive timestamps

**Example Use Cases**:
- Global applications: Convert to local time
- Trading: Convert to market timezone
- Logs: Standardize to UTC

**Your Implementation**: ⏳ Not yet planned

---

## 📋 Priority Ranking (By Real-World Usage)

### Must Have (Implement First):
1. ✅ **Fill Forward/Backward** - DONE
2. ✅ **Lag/Lead** - DONE
3. ✅ **Rolling Windows** - DONE
4. ✅ **As-of Joins** - DONE
5. ⏳ **Resampling** - NEEDS IMPLEMENTATION
6. ⏳ **Time Grouping** - NEEDS IMPLEMENTATION (can use existing groupBy)
7. ⏳ **Time Filtering** - CAN USE EXISTING filter()

### Should Have (Implement Next):
8. ⏳ **Gap Detection** - NEEDS IMPLEMENTATION
9. ⏳ **Time Differences** - CAN USE EXISTING mutate()
10. ⏳ **Interpolation** - NEEDS IMPLEMENTATION

### Nice to Have (Lower Priority):
11. ⏳ **Timezone Handling** - NEEDS IMPLEMENTATION
12. ⏳ **Duplicate Detection** - NEEDS IMPLEMENTATION
13. ⏳ **Time Sorting** - CAN USE EXISTING arrange()

---

## 🎯 Real-World Workflow Examples

### Example 1: Stock Price Analysis
```typescript
// 1. Clean: Forward fill missing prices
df.fillForward("price")

// 2. Transform: Resample to daily
df.resample("timestamp", "1D", { price: "last", volume: "sum" })

// 3. Feature Engineering: Rolling averages
df.mutate({
  ma7: stats.rolling({ column: "price", windowSize: 7, fn: stats.mean }),
  ma30: stats.rolling({ column: "price", windowSize: 30, fn: stats.mean }),
  prev_price: stats.lag("price", 1)
})

// 4. Analysis: Calculate returns
df.mutate({
  return: (row) => (row.price - row.prev_price) / row.prev_price
})
```

### Example 2: IoT Sensor Data
```typescript
// 1. Clean: Detect gaps, interpolate
df.mutate({ gap: detectGaps("timestamp") })
df.filter(row => row.gap === null)
df.interpolate("temperature")

// 2. Transform: Resample to hourly
df.resample("timestamp", "1H", { temperature: "mean" })

// 3. Feature Engineering: Rolling stats
df.mutate({
  temp_24h_avg: stats.rolling({ column: "temperature", windowSize: 24, fn: stats.mean }),
  temp_change: (row) => row.temperature - stats.lag("temperature", 1)
})
```

### Example 3: Sales Data
```typescript
// 1. Transform: Group by day
df.mutate({ day: dateString("timestamp") })
  .groupBy("day")
  .summarize({ daily_sales: (g) => stats.sum(g.amount) })

// 2. Feature Engineering: Week-over-week
df.mutate({
  prev_week: stats.lag("daily_sales", 7),
  wow_growth: (row) => (row.daily_sales - row.prev_week) / row.prev_week
})

// 3. Filter: Last 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
df.filter(row => row.day >= thirtyDaysAgo)
```

---

## 💡 Key Insights

1. **80% of time-series work** uses: fill, lag/lead, rolling windows, resampling, grouping
2. **Most operations** can be done with existing DataFrame methods + date helpers
3. **Resampling** is the most complex operation that likely needs dedicated implementation
4. **Time-based grouping** is very common but can use existing `groupBy()` with date extraction
5. **As-of joins** are critical for financial/trading data but less common elsewhere

---

## 🚀 Recommended Implementation Order

Based on real-world usage patterns:

1. ✅ **Fill Forward/Backward** - DONE
2. ✅ **Lag/Lead** - DONE  
3. ✅ **Rolling Windows** - DONE
4. ✅ **As-of Joins** - DONE
5. **Next**: **Resampling** (most complex, very common)
6. **Then**: **Time Grouping** (very common, can use groupBy)
7. **Then**: **Gap Detection** (important for data quality)
8. **Then**: **Interpolation** (useful for missing data)
9. **Finally**: Advanced features (timezone, duplicates, etc.)

