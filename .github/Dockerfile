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

# Note: Deno dependencies will be cached on first run in CI
# Pre-caching them here would require copying import_map.json and deno.jsonc
# which adds complexity to the build context

# Create output directories for tests
RUN mkdir -p examples/dataframe/output tests/bugs/output
