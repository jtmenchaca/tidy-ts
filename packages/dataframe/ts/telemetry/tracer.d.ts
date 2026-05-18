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
declare class Tracer {
    private static instance;
    private contexts;
    static getInstance(): Tracer;
    /**
     * Initialize tracing for a DataFrame instance
     */
    initContext(df: object, enabled?: boolean): void;
    /**
     * Auto-initialize and start a span if tracing is enabled
     * Returns undefined if tracing is disabled
     */
    autoStart(df: any, name: string, metadata?: Record<string, unknown>): Span | undefined;
    /**
     * Start a span for a DataFrame operation with automatic metadata extraction
     */
    startSpan(df: any, operationName: string, spec?: any): Span | undefined;
    /**
     * Get trace context for a DataFrame
     */
    getContext(df: object): TraceContext | undefined;
    /**
     * Start a new span (internal method)
     */
    _startSpan(df: object, name: string, metadata?: Record<string, unknown>): Span | undefined;
    /**
     * End the current span
     */
    endSpan(df: object, span?: Span): void;
    /**
     * Execute a function with tracing
     */
    trace<T>(df: object, name: string, fn: () => T, metadata?: Record<string, unknown>): T;
    /**
     * Execute a function within a span (only if tracing is enabled)
     */
    withSpan<T>(df: any, name: string, fn: () => T, metadata?: Record<string, unknown>): T;
    /**
     * Get all spans for a DataFrame
     */
    getSpans(df: object): Span[];
    /**
     * Clear trace data for a DataFrame
     */
    clearTrace(df: object): void;
    /**
     * Add an event to the current span
     */
    addEvent(span: Span | undefined, eventName: string, metadata?: Record<string, unknown>): void;
    /**
     * Copy trace context from one DataFrame to another
     */
    copyContext(source: object, target: object): void;
    /**
     * Format spans as a tree for display
     */
    formatSpanTree(spans: Span[], indent?: number): string;
    /**
     * Print trace summary for a DataFrame
     */
    printTrace(df: object): void;
}
export declare const tracer: Tracer;
export {};
