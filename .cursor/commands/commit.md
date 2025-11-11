---
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git diff:*), Read
description: Create a well-formatted git commit with auto-generated message from git changes
---

# Commit Process

Create a new git commit with a well-formatted message by:

1. Check the current git status to see what files have been modified
2. Review the changes using `git diff` to understand what has been modified

NOTE: run 'deno fmt' prior to the committing in the next step

3. **Check and bump package versions if needed:**
   - For each package in `src/*/deno.jsonc`, check the latest published version
     on JSR using `deno task check-versions`
   - Compare the current version in `deno.jsonc` with the latest published
     version
   - If the current version is NOT at least 1 patch version greater than the
     latest published version, increment it:
     - For `@tidy-ts/dataframe`: Check `src/dataframe/deno.jsonc`
     - For `@tidy-ts/ai`: Check `src/ai/deno.jsonc`
   - Version should follow semantic versioning (MAJOR.MINOR.PATCH)
   - Example: If latest is `1.0.29`, current should be at least `1.0.30` (or
     higher)
   - Only bump versions if there are actual changes to commit for that package

4. If no files are staged, stage all modified files with `git add .`
5. Analyze the changes to determine:
   - Type: feat, fix, docs, style, refactor, test, chore, etc.
   - Scope: component or module affected (optional)
   - Description: concise description of changes
6. Generate an appropriate commit message based on the changes
7. Create the commit with `git commit -m "message"`

## Commit Message Format

Follow conventional commit format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:

```
feat(dataframe): add count() method for grouped operations
fix(io): handle undefined values in readJSON
docs: update API documentation for new methods
test: add unit tests for percent transformation
```

## Usage

```bash
# Auto-generate commit message from git changes
/commit
```

## Manual Process

If you need to run this manually without the slash command:

1. Check git status:

```bash
git status
```

2. Review changes:

```bash
git diff
```

3. Check and bump package versions:

```bash
# Check latest published versions on JSR
deno task check-versions @tidy-ts/dataframe @tidy-ts/ai

# Compare with current versions in deno.jsonc files
# If current version <= latest published, increment the patch version
# Example: If latest is 1.0.29, ensure current is at least 1.0.30
```

4. Stage changes:

```bash
# Stage all modified files
git add .

# Or stage specific files
git add src/dataframe/ts/verbs/aggregate/count.verb.ts
```

5. Create commit with appropriate message:

```bash
git commit -m "feat(dataframe): add count() method for grouped operations"
```

## Commit Message Guidelines

Follow these best practices:

```markdown
# Good commit messages:

feat(dataframe): add count() method for grouped operations fix(io): handle
undefined values in readJSON docs: update API documentation for new methods
test: add unit tests for percent transformation refactor(verbs): simplify
aggregate function structure

# Bad commit messages:

- "fix stuff"
- "updates"
- "WIP"
- "asdf"
```

## Tips

- Use present tense ("add feature" not "added feature")
- Keep the first line under 50 characters
- Be specific about what changed
- Include scope when it helps clarify the change
- Use conventional commit types for consistency
- Write the body in imperative mood
- Reference issues/PRs in the footer if relevant
