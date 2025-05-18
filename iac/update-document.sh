#!/usr/bin/env bash

# prerequisites
# environment variables:
# applicationName
# environment

documentName="${applicationName}-${environment}"
documentFile="ssmDocument/${applicationName}.yml"

output=$(aws ssm update-document --name "${documentName}" --content "file://${documentFile}" --region us-west-2 --document-version '$LATEST')
latestVersion=$(echo $output|jq -r ".DocumentDescription.LatestVersion")

aws ssm update-document-default-version --name "${documentName}" --document-version "${latestVersion}" --region us-west-2
