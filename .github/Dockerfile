FROM rocker/r-ver:latest

# Install R packages
RUN Rscript -e "install.packages(c('jsonlite', 'geepack', 'dplyr', 'tidyr', 'nortest', 'moments', 'fBasics', 'effsize'), repos='https://cloud.r-project.org/', Ncpus=2)"

# Install system dependencies and Playwright browser dependencies
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    # Playwright Chromium dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@10

# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh -s v2.5.3
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

WORKDIR /workspace

# Note: Deno dependencies will be cached on first run in CI
# Pre-caching them here would require copying import_map.json and deno.jsonc
# which adds complexity to the build context

# Create output directories for tests
RUN mkdir -p packages/examples/dataframe/output packages/testing/bugs/output
