#!/bin/zsh
# Script to upload resources to DynamoDB table in batches of 25
# Usage: ./upload-resources.sh <environment> <input_file>
# Environment: dev or prod

set -e

echo "DynamoDB Resource Uploader"
echo "--------------------------"

# Check if parameters are provided
if [ $# -lt 2 ]; then
    echo "❌ Error: Missing required parameters."
    echo "Usage: ./upload-resources.sh <environment> <input_file>"
    echo "Example: ./upload-resources.sh dev data.json"
    exit 1
fi

ENV=$1
INPUT_FILE=$2

# Map environment to table name
if [ "$ENV" = "dev" ]; then
    TABLE_NAME="kelifax-SubmittedResources-Dev"
    echo "-Using development environment: $TABLE_NAME"
elif [ "$ENV" = "prod" ]; then
    TABLE_NAME="kelifax-resources-prod"
    echo "-Using production environment: $TABLE_NAME"
else
    echo "❌ Error: Invalid environment. Use 'dev' or 'prod'."
    echo "Usage: ./upload-resources.sh <environment> <input_file>"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: Input file '$INPUT_FILE' not found."
    exit 1
fi

echo "--Configuration:"
echo "   - Environment: $ENV"
echo "   - Table: $TABLE_NAME"
echo "   - Input: $INPUT_FILE"

# Create a temporary directory for batch files
TEMP_DIR="temp_batches_$(date +%s)"
mkdir -p "$TEMP_DIR"
echo "📁 Created temporary directory: $TEMP_DIR"

# Process the input file and create batches
echo "🔄 Processing input file..."

# Extract the items from the Table_name field in the JSON file
ITEMS_JSON="$TEMP_DIR/items.json"

# Check if Table_name exists in the input file
if ! jq -e '.Table_name' "$INPUT_FILE" > /dev/null 2>&1; then
    echo "❌ Error: 'Table_name' key not found in the input file."
    echo "    The input file must contain a 'Table_name' key with an array of items."
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Extract items from Table_name
jq '.Table_name' "$INPUT_FILE" > "$ITEMS_JSON"
echo "📄 Found items under 'Table_name' key"

# Check if we got any items
if [ "$(jq 'length' "$ITEMS_JSON")" -eq 0 ]; then
    echo "❌ Error: No items found under 'Table_name' in the input file."
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Get the total number of items
TOTAL_ITEMS=$(jq 'length' "$ITEMS_JSON")
BATCH_SIZE=25
TOTAL_BATCHES=$(( (TOTAL_ITEMS + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Total items: $TOTAL_ITEMS"
echo "Creating $TOTAL_BATCHES batches..."

# Create batches
for ((i=0; i<TOTAL_BATCHES; i++)); do
    START_IDX=$((i * BATCH_SIZE))
    BATCH_NUM=$(printf "%02d" $((i + 1)))
    BATCH_FILE="$TEMP_DIR/batch_${BATCH_NUM}.json"
    if [ "$((START_IDX + BATCH_SIZE))" -gt "$TOTAL_ITEMS" ]; then
        COUNT=$((TOTAL_ITEMS - START_IDX))
    else
        COUNT=$BATCH_SIZE
    fi
    jq -c ".[$START_IDX:$((START_IDX+COUNT))]" "$ITEMS_JSON" > "$TEMP_DIR/batch_items_${BATCH_NUM}.json"
    echo "{\"$TABLE_NAME\": $(cat "$TEMP_DIR/batch_items_${BATCH_NUM}.json")}" > "$BATCH_FILE"
    echo "Batch $((i+1))/$TOTAL_BATCHES: $COUNT items -> $BATCH_FILE"
done

rm -f "$ITEMS_JSON"
rm -f "$TEMP_DIR/batch_items_"*

TOTAL_BATCHES=$(ls -1 "$TEMP_DIR"/batch_*.json | wc -l | xargs)
echo "✅ Successfully created $TOTAL_BATCHES batches"

# Upload each batch to DynamoDB
echo "Uploading batches to DynamoDB..."
SUCCESS_COUNT=0

for BATCH_FILE in "$TEMP_DIR"/batch_*.json; do
    BATCH_NUM=$(basename "$BATCH_FILE" | sed 's/batch_\\([0-9]*\\)\\.json/\\1/')
    echo "   Uploading batch $BATCH_NUM/$TOTAL_BATCHES..."
    if aws dynamodb batch-write-item --request-items file://"$BATCH_FILE"; then
        echo "   ✅ Batch $BATCH_NUM uploaded successfully"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "   ❌ Error uploading batch $BATCH_NUM"
    fi
done

if [ $SUCCESS_COUNT -eq $TOTAL_BATCHES ]; then
    echo "🎉 All $TOTAL_BATCHES batches uploaded successfully!"
else
    echo "⚠️  Warning: Only $SUCCESS_COUNT of $TOTAL_BATCHES batches were uploaded successfully."
fi

echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"
echo "✅ Temporary directory removed"

echo "✅ Process completed!"