# General Approach: Documentation Structure

This document outlines the standardized approach for creating and maintaining documentation pages in the tidy-ts documentation system.

## File Structure Pattern

Each documentation topic follows a consistent three-file pattern:

```
/dataframe/
├── {topic-name}.tsx           # React component for the documentation page
├── {topic-name}.examples.ts   # Code examples and snippets
└── {topic-name}.test.ts       # Test cases that validate examples
```

## File Responsibilities

### 1. `.tsx` Files - Documentation Pages

**Purpose**: React components that render the actual documentation page

**Structure**:
- Uses `DocPageLayout` wrapper for consistent page structure
- Imports examples from corresponding `.examples.ts` file
- Uses `CodeBlock` components to display code snippets
- May include additional `Card` components for supplementary information

**Key Components**:
- `DocPageLayout`: Provides page title, description, and navigation
- `CodeBlock`: Displays code with title, description, and explanation
- `Card`: Groups related content with headers and descriptions

**Example Pattern**:
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../../components/ui/code-block.tsx";
import { DocPageLayout } from "../../components/layout/DocPageLayout.tsx";
import { topicExamples } from "./topic-name.examples.ts";

export const Route = createFileRoute("/dataframe/topic-name" as any)({
  component: TopicComponent,
});

function TopicComponent() {
  return (
    <DocPageLayout
      title="Topic Name"
      description="Brief description of the topic"
      currentPath="/dataframe/topic-name"
    >
      <CodeBlock
        title="Example 1"
        description="What this example demonstrates"
        explanation="Detailed explanation of the concept"
        code={topicExamples.example1}
      />
      {/* More CodeBlocks... */}
    </DocPageLayout>
  );
}
```

### 2. `.examples.ts` Files - Code Examples

**Purpose**: Centralized repository of code examples and snippets

**Structure**:
- Exports a single object containing all examples
- Each example is a template literal string with complete, runnable code
- Examples should be self-contained and include necessary imports
- Code should be production-ready and follow best practices

**Naming Convention**:
- Use descriptive names that explain what the example demonstrates
- Group related examples with similar prefixes
- Examples should be ordered from simple to complex

**Example Pattern**:
```typescript
// Code examples for {topic-name}
export const topicExamples = {
  basicExample: `import { createDataFrame } from "@tidy-ts/dataframe";

// Complete, runnable example
const df = createDataFrame([...]);
df.print("Result:");`,

  advancedExample: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// More complex example with additional features
const result = df
  .mutate({...})
  .filter(...)
  .groupBy(...)
  .summarise({...});

result.print("Advanced result:");`,
};
```

### 3. `.test.ts` Files - Test Validation

**Purpose**: Test cases that validate the examples work correctly

**IMPORTANT**:
**Structure**:
- Uses Bun test framework (`describe`, `it`, `expect`)
- Tests should mirror the examples from `.examples.ts`
- Each test validates both functionality and type safety
- TESTS ARE NOT SUPPOSED TO BE COMPRENSIVE, THEY ARE TO DEMONSTRATE THE TUTORIAL CODE WORKS AS INTENDED

**Testing Approach**:
- Test the actual functionality, not just that code runs
- Include type checking with explicit type annotations
- Test edge cases and error conditions
- Use descriptive test names that explain what's being tested

**Example Pattern**:
```typescript
import { describe, it, expect } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Topic Name", () => {
  it("should handle basic example correctly", () => {
    // Replicate the example code
    const df = createDataFrame([...]);
    
    // Type check
    const _typeCheck: DataFrame<{...}> = df;
    void _typeCheck;
    
    // Test functionality
    expect(df.nrows()).toBe(expected);
    expect(df.columns()).toEqual([...]);
  });
});
```

## Best Practices

### Code Quality

- Use meaningful variable names
- Include type annotations where helpful
- Follow consistent formatting
- Use realistic, engaging data (Star Wars characters, etc.)

### Documentation Quality

- Write for developers at different skill levels
- Explain the "why" not just the "what"
- Use consistent terminology across all pages
- This is not to identify edge cases, it's to test the tutorial code
- Type demonstrations are important to the demo.  The typechecks are important. 

## File Naming Conventions

- Use kebab-case for file names
- Be descriptive but concise
- Group related topics with similar prefixes
- Use consistent terminology across the codebase

## Integration Points

### With React Router

- Each `.tsx` file exports a route using `createFileRoute`
- Routes follow the pattern `/dataframe/{topic-name}`
- Components are properly typed for TypeScript

### With UI Components

- Uses shared `CodeBlock` component for consistent styling
- Leverages `DocPageLayout` for page structure
- Integrates with `Card` components for supplementary content

This approach ensures consistency, maintainability, and quality across all documentation pages while providing a clear structure for contributors to follow.
