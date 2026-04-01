# OneScript sandbox image for executing 1C scripts
FROM --platform=linux/amd64 ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV OSCRIPT_VERSION=1.9.4

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download and install OneScript
RUN wget -q "https://github.com/EvilBeaver/OneScript/releases/download/v${OSCRIPT_VERSION}/onescript-engine_${OSCRIPT_VERSION}_all.deb" \
    -O /tmp/oscript.deb \
    && dpkg -i /tmp/oscript.deb \
    && rm /tmp/oscript.deb \
    && oscript --version

WORKDIR /code

# Non-root user for security
RUN useradd -m -u 1001 sandbox
USER sandbox

ENTRYPOINT ["oscript"]
