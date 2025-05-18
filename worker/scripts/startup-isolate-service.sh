#!/bin/bash

echo "Starting isolate service..."

systemctl daemon-reload
systemctl enable --now isolate.service