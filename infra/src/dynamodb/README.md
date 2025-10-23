# DynamoDB Resource Batch Uploader

This directory contains a script to batch upload resources to a DynamoDB table using the AWS CLI. The script splits the input data into batches of 25 items (the DynamoDB batch-write-item limit) and uploads each batch sequentially.

## Usage

```sh
./upload-resources.sh <environment> <input_file>
```

- `<environment>`: The environment to upload to. Must be `dev` or `prod`.
- `<input_file>`: The JSON file containing the resources to upload. The file must have a top-level key `Table_name` with an array of items.

### Example

```sh
./upload-resources.sh dev data.json
```

## Input File Format

The input JSON file must have the following structure:

```json
{
  "Table_name": [
    { "PutRequest": { "Item": { ... } } },
    { "PutRequest": { "Item": { ... } } }
    // ... up to N items ...
  ]
}
```

- Replace `Table_name` with the actual key in your file (the script expects this key).
- Each item should be a valid DynamoDB batch-write-item request item.

## What the Script Does

1. Validates input parameters and file.
2. Extracts the array under `Table_name` from the input file.
3. Splits the array into batches of 25 items.
4. For each batch:
    - Creates a temporary JSON file in a temp directory.
    - Uploads the batch to DynamoDB using `aws dynamodb batch-write-item`.
5. Cleans up all temporary files.

## Requirements

- AWS CLI installed and configured with appropriate permissions.
- `jq` installed for JSON processing.
- macOS or Linux with `zsh`.

## Notes

- The script will stop and clean up if any error occurs.
- All temporary files are deleted after the process completes.
- The script prints progress and error messages for each batch.

## Troubleshooting

- Ensure your AWS credentials and region are set up (`aws configure`).
- Make sure the input file is valid JSON and matches the required format.
- Check that you have permission to write to the DynamoDB table.

---
