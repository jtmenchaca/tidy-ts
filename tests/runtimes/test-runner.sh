#!/bin/bash

echo "🧪 Testing @tidy-ts/dataframe across JavaScript runtimes..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color


# Test Node.js
echo -e "${BLUE}🟢 Testing with Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${YELLOW}  Running minimal test...${NC}"
    if NODE_OPTIONS="--disable-warning=ExperimentalWarning" node minimal.test.ts; then
        echo -e "${GREEN}  ✅ Node.js minimal test passed${NC}"
    else
        echo -e "${RED}  ❌ Node.js minimal test failed${NC}"
    fi
    
    echo -e "${YELLOW}  Running comprehensive test...${NC}"
    if NODE_OPTIONS="--disable-warning=ExperimentalWarning" node getting-started-runtime-test.ts; then
        echo -e "${GREEN}  ✅ Node.js comprehensive test passed${NC}"
    else
        echo -e "${RED}  ❌ Node.js comprehensive test failed${NC}"
    fi
else
    echo -e "${RED}❌ Node.js not installed${NC}"
fi
echo ""

# Test Bun
echo -e "${BLUE}🥖 Testing with Bun...${NC}"
if command -v bun &> /dev/null; then
    echo -e "${YELLOW}  Running minimal test...${NC}"
    if bun minimal.test.ts; then
        echo -e "${GREEN}  ✅ Bun minimal test passed${NC}"
    else
        echo -e "${RED}  ❌ Bun minimal test failed${NC}"
    fi
    
    echo -e "${YELLOW}  Running comprehensive test...${NC}"
    if bun getting-started-runtime-test.ts; then
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
