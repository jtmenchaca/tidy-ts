#!/bin/bash

# Save the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🧪 Testing @tidy-ts/dataframe and @tidy-ts/shims across JavaScript runtimes..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Test shims first
echo -e "${BLUE}🔧 Testing @tidy-ts/shims...${NC}"

# Test Node.js shims
if command -v node &> /dev/null; then
    echo -e "${YELLOW}  Testing shims with Node.js...${NC}"
    if (cd "$SCRIPT_DIR" && NODE_OPTIONS="--disable-warning=ExperimentalWarning" npx tsx shims-test.test.ts 2>&1 | grep -q "All shims tests passed"); then
        echo -e "${GREEN}  ✅ Node.js shims test passed${NC}"
    else
        echo -e "${RED}  ❌ Node.js shims test failed${NC}"
        (cd "$SCRIPT_DIR" && NODE_OPTIONS="--disable-warning=ExperimentalWarning" npx tsx shims-test.test.ts 2>&1 | tail -5)
    fi
fi

# Test Bun shims
if command -v bun &> /dev/null; then
    echo -e "${YELLOW}  Testing shims with Bun...${NC}"
    if (cd "$SCRIPT_DIR" && bun shims-test.test.ts 2>&1 | grep -q "All shims tests passed"); then
        echo -e "${GREEN}  ✅ Bun shims test passed${NC}"
    else
        echo -e "${RED}  ❌ Bun shims test failed${NC}"
        (cd "$SCRIPT_DIR" && bun shims-test.test.ts 2>&1 | tail -5)
    fi
fi

# Test Deno shims
if command -v deno &> /dev/null; then
    echo -e "${YELLOW}  Testing shims with Deno...${NC}"
    if (cd "$SCRIPT_DIR" && deno run --allow-read --allow-write --allow-env --allow-net shims-test.test.ts 2>&1 | grep -q "All shims tests passed"); then
        echo -e "${GREEN}  ✅ Deno shims test passed${NC}"
    else
        echo -e "${RED}  ❌ Deno shims test failed${NC}"
        (cd "$SCRIPT_DIR" && deno run --allow-read --allow-write --allow-env --allow-net shims-test.test.ts 2>&1 | tail -5)
    fi
fi

echo ""

# Test Node.js
echo -e "${BLUE}🟢 Testing @tidy-ts/dataframe with Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${YELLOW}  Running minimal test...${NC}"
    if (cd "$SCRIPT_DIR" && NODE_OPTIONS="--disable-warning=ExperimentalWarning" npx tsx minimal.test.ts); then
        echo -e "${GREEN}  ✅ Node.js minimal test passed${NC}"
    else
        echo -e "${RED}  ❌ Node.js minimal test failed${NC}"
    fi
    
    echo -e "${YELLOW}  Running comprehensive test...${NC}"
    if (cd "$SCRIPT_DIR" && NODE_OPTIONS="--disable-warning=ExperimentalWarning" npx tsx getting-started-runtime-test.ts); then
        echo -e "${GREEN}  ✅ Node.js comprehensive test passed${NC}"
    else
        echo -e "${RED}  ❌ Node.js comprehensive test failed${NC}"
    fi
else
    echo -e "${RED}❌ Node.js not installed${NC}"
fi
echo ""

# Test Bun
echo -e "${BLUE}🥖 Testing @tidy-ts/dataframe with Bun...${NC}"
if command -v bun &> /dev/null; then
    echo -e "${YELLOW}  Running minimal test...${NC}"
    if (cd "$SCRIPT_DIR" && bun minimal.test.ts); then
        echo -e "${GREEN}  ✅ Bun minimal test passed${NC}"
    else
        echo -e "${RED}  ❌ Bun minimal test failed${NC}"
    fi
    
    echo -e "${YELLOW}  Running comprehensive test...${NC}"
    if (cd "$SCRIPT_DIR" && bun getting-started-runtime-test.ts); then
        echo -e "${GREEN}  ✅ Bun comprehensive test passed${NC}"
    else
        echo -e "${RED}  ❌ Bun comprehensive test failed${NC}"
    fi
else
    echo -e "${RED}❌ Bun not installed${NC}"
fi
echo ""

# Test Browser
echo -e "${BLUE}🌐 Testing with Browser...${NC}"
if command -v npx &> /dev/null; then
    echo -e "${YELLOW}  Running browser tests...${NC}"
    if npm run test:browser > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Browser tests passed${NC}"
    else
        echo -e "${RED}  ❌ Browser tests failed${NC}"
    fi
else
    echo -e "${RED}❌ npm/npx not available${NC}"
fi
echo ""

echo "🎉 Runtime testing complete!"
