#!/usr/bin/env bash

set -euo pipefail

# You need to setup a kubeconfig according to https://welcome.play.futurice.com/
POD_ID=$(kubectl get pods -l=app=futulog -o json | jq -r '.items[].metadata.name')

kubectl exec -t $POD_ID -- bash -c \
  "psql \$DB_URL -c \"\\copy (SELECT * FROM registrations WHERE date <= CURRENT_DATE AND workmode = 'Office') TO STDOUT WITH csv\"" \
  > generator/registrations.csv
