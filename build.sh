#!/bin/sh

# Usage: ./build.sh 1.0.9

HUB=zitros/analytics-saviour

docker build --rm -t image .

if [ $# -eq 1 ]
  then
    docker tag image $HUB:$1
fi
docker tag image $HUB:latest

docker push $HUB:latest
if [ $# -eq 1 ]
  then
    docker push $HUB:$1
fi