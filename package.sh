#!/bin/bash
npm ci
npm run tsc
timestamp=`date "+%Y%m%d-%H%M%S"`
BULD_DIR=./builds/
rm -rf ${BULD_DIR}
mkdir  ${BULD_DIR}
echo $timestamp

#zip -v -r ./_builds/"${timestamp}".zip  ./dist/* ./package.json
zip -v -r ./builds/mainstack-test.zip  ./dist/* ./package.json ./.ebextensions/* ./.platform/*

#ls -la ./_builds
#ls -la  ./dist
