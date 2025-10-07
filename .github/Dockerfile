FROM rocker/r-ver:latest

# Install R packages
RUN Rscript -e "install.packages(c('jsonlite', 'geepack', 'dplyr', 'tidyr', 'nortest', 'moments', 'fBasics'), repos='https://cloud.r-project.org/', Ncpus=2)"

# Install system dependencies for Deno
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh -s v2.5.3
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

WORKDIR /workspace

# Copy import_map.json and deno.jsonc to cache dependencies
COPY ../import_map.json ./import_map.json
COPY ../deno.jsonc ./deno.jsonc

# Pre-cache Deno dependencies by running a dummy command that loads the import map
RUN deno install --entrypoint https://deno.land/x/blank/mod.ts || true

# Cache specific dependencies from import_map
RUN deno cache --import-map=import_map.json \
    npm:zod@^4.1.8 \
    npm:hyparquet@^1.17.8 \
    npm:hyparquet-writer@^0.6.1 \
    npm:@uwdata/flechette@^2.2.3 \
    npm:hyparquet-compressors@^1.1.1 \
    jsr:@deno/wasmbuild@^0.19.2 \
    jsr:@hono/hono@^4.8.3 \
    jsr:@std/csv@^1.0.6 \
    jsr:@std/dotenv@^0.225.5 \
    jsr:@std/expect@^1.0.15 \
    jsr:@std/path@^1.0.8 \
    jsr:@std/random@^0.1.2 \
    jsr:@cliffy/command@^1.0.0-rc.7 \
    npm:playwright@^1.54.1 \
    npm:vega-lite@^6.4.1 \
    npm:vega@^6.2.0 \
    npm:vega-embed@^7.0.2 \
    npm:apache-arrow@^17.0.0

# Clean up copied files (they'll be mounted from the repo during CI)
RUN rm -f import_map.json deno.jsonc

# Create output directories for tests
RUN mkdir -p examples/dataframe/output tests/bugs/output
