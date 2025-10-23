#!/bin/zsh
# Script to upload resources to DynamoDB table
# Usage: ./upload-resources.sh [dev|prod]

# Exit on error
set -e

# Check if environment parameter is provided
if [ $# -eq 0 ]; then
    echo "Error: No environment specified."
    echo "Usage: ./upload-resources.sh [dev|prod]"
    exit 1
fi

# Set table name based on environment
if [ "$1" = "dev" ]; then
    TABLE_NAME="kelifax-SubmittedResources-Dev"
    echo "Using development environment: $TABLE_NAME"
elif [ "$1" = "prod" ]; then
    TABLE_NAME="kelifax-resources-prod"
    echo "Using production environment: $TABLE_NAME"
else
    echo "Error: Invalid environment. Use 'dev' or 'prod'."
    echo "Usage: ./upload-resources.sh [dev|prod]"
    exit 1
fi

# Create temporary file
TEMP_FILE="temp-data-$1.json"
echo "Creating temporary file: $TEMP_FILE"

# Replace "Resources" with the actual table name
jq ".Table_name | {\"$TABLE_NAME\": .}" data.json > $TEMP_FILE

# Upload data to DynamoDB
echo "Uploading resources to $TABLE_NAME..."
aws dynamodb batch-write-item --request-items file://$TEMP_FILE

# Check if upload was successful
if [ $? -eq 0 ]; then
    echo "Upload completed successfully."
else
    echo "Error: Upload failed."
    exit 1
fi

# Delete temporary file
echo "Cleaning up..."
rm $TEMP_FILE
echo "Temporary file deleted."

echo "Process completed successfully!"
