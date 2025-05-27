FROM jrei/systemd-ubuntu:22.04

# Basic packages + Java + Node.js
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libcap-dev \
    libsystemd-dev \
    nano \
    pkg-config \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && set -xe && \
    curl -fSsL "https://download.java.net/java/GA/jdk13.0.1/cec27d702aa74d5a8630c65ae61e4305/9/GPL/openjdk-13.0.1_linux-x64_bin.tar.gz" -o /tmp/openjdk13.tar.gz && \
    mkdir /usr/local/openjdk13 && \
    tar -xf /tmp/openjdk13.tar.gz -C /usr/local/openjdk13 --strip-components=1 && \
    rm /tmp/openjdk13.tar.gz && \
    ln -s /usr/local/openjdk13/bin/javac /usr/local/bin/javac && \
    ln -s /usr/local/openjdk13/bin/java /usr/local/bin/java && \
    ln -s /usr/local/openjdk13/bin/jar /usr/local/bin/jar \
    && rm -rf /var/lib/apt/lists/*

# Isolate Installation
RUN git clone https://github.com/ioi/isolate.git && \
    cd isolate && \
    cp systemd/* /etc/systemd/system/ && \
    make isolate && make install && \
    cd .. && rm -rf isolate

WORKDIR /engine

# Copy dependency definitions
COPY package*.json .
COPY tsconfig.json .

# Install dependencies inside the container
RUN npm install

# Copy isolate service startup script
COPY scripts/startup-isolate-service.sh /usr/local/bin/

# Copying engine
COPY src/ ./src/