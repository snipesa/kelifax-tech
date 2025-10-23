# Kelifax Lambda Deployment

This directory contains the CloudFormation template for deploying the Kelifax API Lambda function.

## Prerequisites

1. Install AWS CLI and configure your credentials:
   ```bash
   aws configure
   ```

2. Create the deployment S3 bucket (if it doesn't exist):
   ```bash
   aws s3 mb s3://cf-kelifax-deployment-bucket
   ```

## Deployment Process

### All-in-One Deployment

Use the provided script to package your Lambda function, upload it to S3, and deploy the CloudFormation stack in one step:

```bash
# For development environment (default)
./package-lambda.sh dev

# For production environment
./package-lambda.sh prod
```

This script will:
1. Package your Lambda code and dependencies
2. Create a ZIP file named `lambda-function.zip`
3. Upload it to S3 with the appropriate prefix:
   - `lambda-zip-dev` for development
   - `lambda-zip-prod` for production
4. Deploy the CloudFormation stack with the correct parameters
5. Display the stack outputs when complete

You'll be prompted to confirm before the deployment starts, giving you a chance to skip the CloudFormation deployment if you only want to package the Lambda code.

## Updating Lambda Function

To update an existing Lambda function:

1. Make your code changes in the Lambda source directory
2. Run the package script again with the appropriate environment:
   ```bash
   ./package-lambda.sh dev  # or prod
   ```

The script will package your updated code, upload it to S3, and redeploy the CloudFormation stack. This will update your Lambda function with the new code.

## Accessing Stack Outputs

After deployment, you can retrieve information about your Lambda function:

```bash
# Get Lambda ARN for development environment
aws cloudformation describe-stacks \
  --stack-name kelifax-lambda-stack-dev \
  --query "Stacks[0].Outputs[?OutputKey=='FunctionArn'].OutputValue" \
  --output text

# Get Lambda Function Name for production environment
aws cloudformation describe-stacks \
  --stack-name kelifax-lambda-stack \
  --query "Stacks[0].Outputs[?OutputKey=='FunctionName'].OutputValue" \
  --output text
```

## Template Parameters

The CloudFormation template accepts the following parameters:

- `Environment`: Deployment environment (dev, prod)
- `FunctionPrefix`: Prefix for the Lambda function name
- `DeploymentBucket`: S3 bucket containing the Lambda function code
- `S3KeyPrefix`: Prefix path within the bucket where the Lambda ZIP file is located

DynamoDB table names are automatically determined based on the environment:
- `prod`: Uses the table name `kelifax-resources-prod`
- `dev`: Uses the table name `kelifax-SubmittedResources-Dev`

## Directory Structure in S3

The deployment creates the following structure in your S3 bucket:

```
cf-kelifax-deployment-bucket/
├── lambda-zip-dev/           # Lambda code for dev environment
│   └── lambda-function.zip
├── lambda-zip-prod/          # Lambda code for prod environment
│   └── lambda-function.zip
├── cloudformation-dev/       # CloudFormation artifacts for dev
│   └── [template files]
└── cloudformation-prod/      # CloudFormation artifacts for prod
    └── [template files]
```

## Understanding S3 Bucket Usage

The deployment uses a single S3 bucket (`cf-kelifax-deployment-bucket`) for two distinct purposes, separated by prefixes:

1. **Lambda Code Storage**:
   - Prefix: `lambda-zip-dev` or `lambda-zip-prod`
   - Contains the Lambda function ZIP file (`lambda-function.zip`)
   - Referenced by the CloudFormation template via the `S3KeyPrefix` parameter
   - Example path: `s3://cf-kelifax-deployment-bucket/lambda-zip-dev/lambda-function.zip`

2. **CloudFormation Template Storage**:
   - Prefix: `cloudformation-dev` or `cloudformation-prod`
   - Used by the CloudFormation service to store the packaged template
   - Specified via the `--s3-prefix` parameter in the CloudFormation deploy command
   - Example path: `s3://cf-kelifax-deployment-bucket/cloudformation-dev/[template-files]`

### Important Notes:

- The `DeploymentBucket` referenced in the CloudFormation template must already exist before deployment
- The package-lambda.sh script must upload the Lambda ZIP file before you deploy the CloudFormation stack
- If you change the S3 bucket name in one place, make sure to update it in all relevant locations:
  - The package-lambda.sh script
  - The CloudFormation deploy command
  - Any parameter overrides
