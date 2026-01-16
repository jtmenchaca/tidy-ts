// deno-lint-ignore-file no-explicit-any
/**
 * Telemetry and tracing infrastructure for DataFrame operations
 */

export interface Span {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  children: Span[];
  parent?: Span;
}

export interface TraceContext {
  enabled: boolean;
  rootSpan?: Span;
  currentSpan?: Span;
  spans: Span[];
}

class Tracer {
  private static instance: Tracer;
  private contexts: WeakMap<object, TraceContext> = new WeakMap();

  static getInstance(): Tracer {
    if (!Tracer.instance) {
      Tracer.instance = new Tracer();
    }
    return Tracer.instance;
  }

  /**
   * Initialize tracing for a DataFrame instance
   */
  initContext(df: object, enabled: boolean = false): void {
    this.contexts.set(df, {
      enabled,
      spans: [],
    });
  }

  /**
   * Auto-initialize and start a span if tracing is enabled
   * Returns undefined if tracing is disabled
   */
  autoStart(
    df: any,
    name: string,
    metadata?: Record<string, unknown>,
  ): Span | undefined {
    if (!df.__options?.trace) return undefined;

    // Auto-initialize if needed
    if (!this.getContext(df)) {
      this.initContext(df, true);
    }

    return this._startSpan(df, name, metadata);
  }

  /**
   * Start a span for a DataFrame operation with automatic metadata extraction
   */
  startSpan(df: any, operationName: string, spec?: any): Span | undefined {
    if (!df.__options?.trace) return undefined;

    // Auto-initialize trace context if missing
    if (!this.getContext(df)) {
      this.initContext(df, true);
    }

    const metadata: Record<string, unknown> = {
      rows: df.nrows?.() || 0,
      grouped: !!df.__groups,
    };

    // Extract columns from spec if it's an object
    if (spec && typeof spec === "object") {
      metadata.columns = Object.keys(spec);
    }

    // Add group count if grouped
    if (df.__groups) {
      metadata.groupCount = df.__groups.size;
    }

    return this._startSpan(df, operationName, metadata);
  }

  /**
   * Get trace context for a DataFrame
   */
  getContext(df: object): TraceContext | undefined {
    return this.contexts.get(df);
  }

  /**
   * Start a new span (internal method)
   */
  _startSpan(
    df: object,
    name: string,
    metadata?: Record<string, unknown>,
  ): Span | undefined {
    const context = this.contexts.get(df);
    if (!context?.enabled) {
      return undefined;
    }

    const span: Span = {
      name,
      startTime: performance.now(),
      metadata,
      children: [],
      parent: context.currentSpan,
    };

    if (context.currentSpan) {
      context.currentSpan.children.push(span);
    } else {
      context.rootSpan = span;
      context.spans.push(span);
    }

    context.currentSpan = span;
    return span;
  }

  /**
   * End the current span
   */
  endSpan(df: object, span?: Span): void {
    const context = this.contexts.get(df);
    if (!context?.enabled || !span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;

    // Move back to parent span
    if (context.currentSpan === span) {
      context.currentSpan = span.parent;
    }
  }

  /**
   * Execute a function with tracing
   */
  trace<T>(
    df: object,
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): T {
    const span = this._startSpan(df, name, metadata);
    try {
      const result = fn();
      this.endSpan(df, span);
      return result;
    } catch (error) {
      this.endSpan(df, span);
      throw error;
    }
  }

  /**
   * Execute a function within a span (only if tracing is enabled)
   */
  withSpan<T>(
    df: any,
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): T {
    if (!df.__options?.trace) return fn();
    return this.trace(df, name, fn, metadata);
  }

  /**
   * Get all spans for a DataFrame
   */
  getSpans(df: object): Span[] {
    const context = this.contexts.get(df);
    return context?.spans || [];
  }

  /**
   * Clear trace data for a DataFrame
   */
  clearTrace(df: object): void {
    const context = this.contexts.get(df);
    if (context) {
      context.spans = [];
      context.rootSpan = undefined;
      context.currentSpan = undefined;
    }
  }

  /**
   * Add an event to the current span
   */
  addEvent(
    span: Span | undefined,
    eventName: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (!span) return;

    if (!span.metadata) {
      span.metadata = {};
    }

    if (!span.metadata.events) {
      span.metadata.events = [];
    }

    (span.metadata.events as any[]).push({
      name: eventName,
      timestamp: performance.now(),
      metadata,
    });
  }

  /**
   * Copy trace context from one DataFrame to another
   */
  copyContext(source: object, target: object): void {
    const sourceContext = this.contexts.get(source);
    if (sourceContext) {
      // Copy the entire context including spans
      this.contexts.set(target, {
        enabled: sourceContext.enabled,
        spans: [...sourceContext.spans], // Copy the spans array
        rootSpan: sourceContext.rootSpan,
        currentSpan: sourceContext.currentSpan,
      });
    }
  }

  /**
   * Format spans as a tree for display
   */
  formatSpanTree(spans: Span[], indent: number = 0): string {
    let output = "";
    for (const span of spans) {
      const indentStr = "  ".repeat(indent);
      const duration = span.duration?.toFixed(3) || "...";
      output += `${indentStr}├─ ${span.name}: ${duration}ms`;

      if (span.metadata) {
        const metaStr = Object.entries(span.metadata)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        if (metaStr) output += ` (${metaStr})`;
      }

      output += "\n";

      if (span.children.length > 0) {
        output += this.formatSpanTree(span.children, indent + 1);
      }
    }
    return output;
  }

  /**
   * Print trace summary for a DataFrame
   */
  printTrace(df: object): void {
    const context = this.contexts.get(df);
    if (
      !context?.enabled || (!context.rootSpan && context.spans.length === 0)
    ) {
      console.log("No trace data available");
      return;
    }

    console.log("\n📊 DataFrame Operation Trace:");

    // If we have a root span, show it and its children
    if (context.rootSpan) {
      console.log(this.formatSpanTree([context.rootSpan]));
      console.log(
        `Total time: ${(context.rootSpan.duration || 0).toFixed(3)}ms\n`,
      );
    } else {
      // Fallback to spans array
      console.log(this.formatSpanTree(context.spans));
      const totalTime = context.spans.reduce(
        (sum, span) => sum + (span.duration || 0),
        0,
      );
      console.log(`Total time: ${totalTime.toFixed(3)}ms\n`);
    }
  }
}

export const tracer = Tracer.getInstance();
