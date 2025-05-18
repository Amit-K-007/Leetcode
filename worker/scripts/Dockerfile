FROM jrei/systemd-ubuntu:22.04

# Basic packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libcap-dev \
    git \
    pkg-config \
    libsystemd-dev \
    nano \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Isolate Installation
RUN git clone https://github.com/ioi/isolate.git && \
    cd isolate && \
    cp systemd/* /etc/systemd/system/ && \
    make isolate && make install && \
    rm -rf /isolate/*

COPY /scripts/startup-isolate-service.sh /usr/local/bin/

# Java Installation
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Node Installtion
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \ 
    && apt-get install -y nodejs \                             
    && rm -rf /var/lib/apt/lists/*

# Copying worker
COPY . /worker