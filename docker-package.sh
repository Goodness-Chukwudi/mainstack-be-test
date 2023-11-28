#!/bin/bash
npm ci
npm run tsc
timestamp=`date "+%Y%m%d-%H%M%S"`
BULD_DIR=./builds/
rm -rf ${BULD_DIR}
mkdir  ${BULD_DIR}
echo $timestamp

#zip -v -r ./_builds/"${timestamp}".zip  ./dist/* ./package.json
zip -v -r ./builds/arkland-erp.zip  ./dist/* ./package.json ./package-lock.json ./.ebextensions/* ./.platform/* ./docker-compose.yml ./.dockerignore ./Dockerfile

#ls -la ./_builds
#ls -la  ./dist
