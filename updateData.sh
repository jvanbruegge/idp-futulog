#!/usr/bin/env bash

POD_ID=$(kubectl get pods -l=app=futulog -o json | jq -r '.items[].metadata.name')

kubectl exec -it $POD_ID -- bash -c \
  "psql \$DB_URL -c \"\\copy (SELECT * FROM registrations WHERE date <= CURRENT_DATE AND workmode = 'Office') TO STDOUT WITH csv\"" \
  > generator/registrations.csv

gpg --output generator/registrations.csv.gpg --symmetric --cipher-algo AES256 generator/registrations.csv
