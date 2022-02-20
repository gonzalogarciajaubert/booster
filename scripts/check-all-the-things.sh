#!/usr/bin/env sh

lerna clean --yes \
&& lerna bootstrap \
&& lerna run clean --stream \
&& lerna run compile --stream