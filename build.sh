#!/bin/sh

HUB=zitros/analytics-saviour

docker build --rm -t image .

if [ $# -eq 1 ]
  then
    docker tag image $HUB:$1
fi
docker tag image $HUB:latest

docker push $HUB