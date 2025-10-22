# Kelifax Lambda Deployment

This directory contains the CloudFormation/SAM template for deploying the Kelifax API Lambda function.

## Prerequisites

1. Install AWS CLI and configure your credentials:
   ```bash
   aws configure
   ```

2. Install AWS SAM CLI:
   ```bash
   brew install aws/tap/aws-sam-cli
   ```
   
   For other operating systems, follow the [official installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).

## Deployment Steps

1. **First-time deployment**:
   ```bash
   # Create a deployment bucket if you don't have one
   aws s3 mb s3://kelifax-deployment-bucket

   # Navigate to the lambda directory
   cd infra/cloudformation/lambda

   # Build the Lambda package
   sam build

   # Deploy the stack for development (default)
   sam deploy
   
   # Or for production
   sam deploy --config-env prod
   ```

2. **Subsequent deployments**:
   ```bash
   # For development (default)
   sam build
   sam deploy
   
   # For production
   sam build
   sam deploy --config-env prod
   ```

## Environment Specific Deployments

This project supports different environments:

### Development Deployment (Default)
```bash
sam build
sam deploy
```

### Production Deployment
```bash
sam build
sam deploy --config-env prod
```

## Parameters

The template accepts the following parameters:

- `Environment`: Deployment environment (dev, prod)
- `FunctionPrefix`: Prefix for the Lambda function name

DynamoDB table names are automatically determined based on the environment:
- `prod`: Uses the table name `kelifax-resources-prod`
- `dev`: Uses the table name `kelifax-SubmittedResources-Dev`

You can override parameters during deployment:

```bash
sam deploy --parameter-overrides Environment=dev FunctionPrefix=kelifax
```

## Accessing the API

After deployment, the Lambda function ARN and name will be available in the CloudFormation stack outputs.
You can retrieve them using:

```bash
# For development (default)
aws cloudformation describe-stacks --stack-name kelifax-lambda-stack-dev --query "Stacks[0].Outputs[?OutputKey=='FunctionArn'].OutputValue" --output text

# For production
aws cloudformation describe-stacks --stack-name kelifax-lambda-stack --query "Stacks[0].Outputs[?OutputKey=='FunctionArn'].OutputValue" --output text
```

## Note

The default environment is now development. To deploy to production, you must explicitly specify `--config-env prod`.
