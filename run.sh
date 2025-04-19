#!/bin/sh

export ENV_ZIP_FILENAME=./sample.d/sample.zip

mkdir -p sample.d

echo hw1 > sample.d/hw1.txt
echo hw2 > sample.d/hw2.txt

ls sample.d/*.txt |
	zip \
		-0 \
		-@ \
		-T \
		-v \
		-o \
		"${ENV_ZIP_FILENAME}"

unzip -lv "${ENV_ZIP_FILENAME}"

time node zip2names.mjs
