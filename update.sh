#!/bin/bash

docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build nginx
