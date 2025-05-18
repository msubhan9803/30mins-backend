#!/usr/bin/env bash

# prerequisites
# environment variables:
# CI_COMMIT_SHA
# instanceId
# documentName
# environment
# secretId
# s3Bucket

apt update && apt install -y jq

commitId=${CI_COMMIT_SHA:0:8}
commandId=$(aws ssm send-command --instance-ids "${instanceId}" --document-name "${documentName}" --parameters "env=${environment},secretId=${secretId},commitId=${commitId},s3Bucket=${s3Bucket}" | jq -r '.Command.CommandId')
echo ${commandId}

sleep 60

#aws ssm get-command-invocation --command-id ${commandId} --instance-id ${instanceId}
status=$(aws ssm get-command-invocation --command-id ${commandId} --instance-id ${instanceId} | jq -r '.Status')

while [ "${status}" == "InProgress" ] || [ "${status}" == "Pending" ];
do
  echo "ssm command  ${commandId} is ${status}, sleep and check again later ... "
  sleep 60
  status=$(aws ssm get-command-invocation --command-id ${commandId} --instance-id ${instanceId} | jq -r '.Status')
done

echo "ssm command  ${commandId} is ${status}... "

echo "======== deploy command output ======== "
aws ssm get-command-invocation --command-id ${commandId} --instance-id ${instanceId} | jq -r ".StandardOutputContent"
echo ""
echo "======== deploy command error ======== "
aws ssm get-command-invocation --command-id ${commandId} --instance-id ${instanceId} | jq -r ".StandardErrorContent"
echo "======== the end ======== "
echo ""

if [ "${status}" == "Success" ]; then
  exit 0
else
  exit 1
fi
