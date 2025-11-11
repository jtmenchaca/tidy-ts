---
allowed-tools: Bash(git log:*), Bash(gh release create:*), Read
argument-hint: [version]
description: Create a GitHub release with auto-generated notes from git commits
---

# Release Process

Create a new GitHub release for version $1 by:

1. Read the current version from src/dataframe/deno.jsonc. If it is not the same
   version as the one provided, ask the user if they'd like for you to update it
   to the version they specified. Do note if there are surprising discrepancies
   (providing version not an increment of the existing version, etc)
2. Get all git commits since the last release tag (v0.2.X format)
3. Summarize the commits into a bulleted list following this format:
   - Added: New features and functionality
   - Fixed: Bug fixes and corrections
   - Updated/Changed: Modifications to existing features
   - Removed: Deprecated or removed features
4. Create the GitHub release with `gh release create` using the format:

```
## Changes

- Added `feature()` description
- Fixed bug in `component`
- Updated behavior of `method()`
- Removed unnecessary exports
```

5. Use the version from step 1 as the tag (format: v0.2.X)
6. Set the title to match the tag

Important:

- Be concise but descriptive in the bullet points
- Group similar changes together
- Focus on user-facing changes
- Include method/function names in backticks when relevant EOF

````
## Usage

```bash
# Auto-detect version from deno.jsonc and create release
/release

# Or specify a version explicitly
/release 0.2.12
````

## Manual Process

If you need to run this manually without the slash command:

1. Check current version:

```bash
cat src/dataframe/deno.jsonc | grep version
```

2. Get commits since last release:

```bash
# Replace LAST_TAG with the previous release tag (e.g., v0.2.5)
git log --oneline LAST_TAG..HEAD
```

3. Create release:

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(cat <<'EOF'
## Changes

- Item 1
- Item 2
EOF
)"
```

## Release Notes Format

Follow this structure for consistency:

```markdown
## Changes

- Added `methodName()` - brief description of new functionality
- Fixed bug in `componentName` that caused [specific issue]
- Updated `feature` to support [new capability]
- Removed unnecessary exports for cleaner API
- Reorganized [files/tests/structure] for better [reason]
```

## Tips

- Read recent commits to understand the scope of changes
- Look at previous releases for formatting consistency
- Group related changes together
- Be specific about what was fixed or added
- Include function/method names in backticks
- Keep descriptions concise but informative
