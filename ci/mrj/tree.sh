#!/bin/sh
# tree.sh <sha> <dir> : LF tree of a commit (git archive, autocrlf=false)
set -e; rm -rf "$2"; mkdir -p "$2"; git -c core.autocrlf=false archive "$1" | tar -x -C "$2"
