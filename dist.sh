#!/usr/bin/env bash
set -e

# Copy all files into dist folder except for the dist folder itself, this script and README
mkdir -p dist
rm -rf dist/*

cp -r src/ dist/

