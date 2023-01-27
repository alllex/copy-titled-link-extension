#!/usr/bin/env bash
set -e

CHROME_DIST="dist/copy-titled-link-chrome"

mkdir -p "$CHROME_DIST"
rm -rf "$CHROME_DIST"/*
cp -r src/ "$CHROME_DIST"/

