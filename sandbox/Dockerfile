# OneScript sandbox image for executing 1C scripts
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV OSCRIPT_VERSION=2.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget ca-certificates unzip libicu70 \
    && rm -rf /var/lib/apt/lists/*

# Download and install OneScript 2.0.0 (self-contained .NET, no Mono required)
RUN wget -q "https://github.com/EvilBeaver/OneScript/releases/download/v${OSCRIPT_VERSION}/OneScript-${OSCRIPT_VERSION}-linux-x64.zip" \
    -O /tmp/oscript.zip \
    && unzip -q /tmp/oscript.zip -d /opt/oscript \
    && rm /tmp/oscript.zip \
    && OSCRIPT_BIN=$(find /opt/oscript -name "oscript" -type f | head -1) \
    && chmod +x "$OSCRIPT_BIN" \
    && ln -s "$OSCRIPT_BIN" /usr/local/bin/oscript \
    && oscript --version

WORKDIR /code

# Non-root user for security
RUN useradd -m -u 1001 sandbox
USER sandbox

ENTRYPOINT ["oscript"]
