# Kelifax Docker Deployment System Documentation

## Overview
The Kelifax Docker Deployment System provides automated build and deployment of the static Astro site to S3 using AWS Lambda containers. This system allows dynamic deployment of new resources without manual rebuilds while maintaining cost-effectiveness and security.

## Architecture Overview

```
Admin Panel → API Gateway → Lambda Function → D3. **Set up AWS Parameter Store** with deployment credentialscker Container → GitHub → Build → S3/CloudFront
     ↓              ↓              ↓              ↓           ↓        ↓         ↓
  Trigger      Route to      Fetch Secrets    Pull from   Clone    Build     Deploy
  Deploy       Lambda        from AWS        Docker Hub   Repo     Astro     Site
```

## Cost Analysis (100 deployments/month)
- **AWS Lambda**: ~$1.08/month (Most cost-effective)
- **ECS Fargate**: ~$4.74/month  
- **EC2 On-Demand**: ~$4.67/month

**Selected: AWS Lambda Container** ✅

### Parameter Store vs Secrets Manager Cost Comparison
| Service | Cost per 10,000 API calls | Monthly Cost (100 deployments) |
|---------|---------------------------|--------------------------------|
| **Parameter Store** | **$0.05** | **~$0.005/month** |
| Secrets Manager | $0.40 | ~$0.04/month |

**Parameter Store is 8x cheaper** for deployment secrets that don't require automatic rotation.

## Authentication Strategy

### GitHub Deploy Keys (Recommended)
- **Security**: Repository-specific, read-only access
- **Container**: Public on Docker Hub (no sensitive data)
- **Setup**: SSH key pair with public key as GitHub Deploy Key

### Security Flow
```
AWS Parameter Store (SecureString) → Lambda Runtime → Container Environment → Git Clone → Build → Deploy
```

## Container Workspace Structure

```
kelifax-deploy-container/
├── Dockerfile                    # Multi-stage container build
├── docker-compose.yml           # Local testing setup
├── README.md                    # Container documentation
├── .dockerignore               # Exclude unnecessary files
├── .gitignore                  # Git exclusions
├── package.json                # Container-specific dependencies
├── entrypoint.sh              # Main container entry point
├── scripts/
│   ├── git-setup.sh           # Configure SSH keys for GitHub
│   ├── build-astro.sh         # Astro build process
│   ├── deploy-dev.sh          # Deploy to dev environment
│   ├── deploy-prod.sh         # Deploy to prod environment
│   ├── sync-s3.sh            # S3 sync utilities
│   └── cloudfront-invalidate.sh # CloudFront cache invalidation
├── configs/
│   ├── aws-dev.json          # Dev environment configuration
│   ├── aws-prod.json         # Prod environment configuration
│   └── git-config.json       # Git repository settings
├── templates/
│   ├── env.dev.template      # Dev environment variables template
│   └── env.prod.template     # Prod environment variables template
└── src/
    └── health-check.js       # Container health check endpoint
```

## Container Security Model

### What's IN the Public Container:
- ✅ Node.js, npm, AWS CLI (build tools)
- ✅ Build and deployment scripts
- ✅ Configuration templates (no secrets)
- ✅ Git clone logic

### What's NOT in the Container:
- ❌ GitHub SSH keys or tokens
- ❌ AWS credentials
- ❌ Application source code
- ❌ Environment secrets

### Runtime Security:
1. **Container is useless without secrets** - Public but requires runtime authentication
2. **Ephemeral secrets** - SSH keys exist only during Lambda execution
3. **No persistent access** - Container dies after deployment
4. **Audit trail** - All operations logged in CloudWatch

## Application Code Flow

### 1. Container Startup (Lambda Runtime)
```bash
# Environment variables injected by Lambda:
GITHUB_SSH_KEY=<private-ssh-key-from-secrets-manager>
GITHUB_REPO_URL=git@github.com:yourusername/kelifax.git
ENVIRONMENT=dev|prod
AWS_REGION=us-east-1
```

### 2. Git Authentication Setup
```bash
# Container creates SSH key from environment variable
echo "$GITHUB_SSH_KEY" > /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa
ssh-keyscan github.com >> /root/.ssh/known_hosts
```

### 3. Code Cloning
```bash
# Clone Kelifax repository into container
git clone $GITHUB_REPO_URL /tmp/kelifax-app
```

### 4. Build Process
```bash
cd /tmp/kelifax-app
npm install                    # Install project dependencies
cp env.${ENVIRONMENT}.config .env  # Load environment config
npm run build                  # Build Astro static site
```

### 5. Deployment
```bash
# Deploy to S3 and invalidate CloudFront
aws s3 sync /tmp/kelifax-app/dist/ s3://${S3_BUCKET}/ --delete
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
```

## AWS Parameter Store Configuration

### SecureString Parameters Structure
```bash
# GitHub SSH Deploy Key (SecureString)
/kelifax/deploy/github-ssh-key
Value: -----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----

# AWS Access Credentials (SecureString)  
/kelifax/deploy/aws-access-key-id
Value: AKIA...

/kelifax/deploy/aws-secret-access-key
Value: <secret-access-key>

# CloudFront Distribution IDs (String)
/kelifax/deploy/cloudfront-distribution-id-dev
Value: E1234567890

/kelifax/deploy/cloudfront-distribution-id-prod
Value: E0987654321

# S3 Bucket Names (String)
/kelifax/deploy/s3-bucket-dev
Value: dev.kelifax.com

/kelifax/deploy/s3-bucket-prod
Value: kelifax.com

# GitHub Repository URL (String)
/kelifax/deploy/github-repo-url
Value: git@github.com:yourusername/kelifax.git
```

### Parameter Store Benefits
- **Cost-effective**: $0.05 per 10,000 API calls (vs Secrets Manager $0.40 per 10,000)
- **Built-in KMS encryption**: SecureString parameters encrypted with AWS KMS
- **IAM integration**: Fine-grained access control
- **No rotation complexity**: Simple key-value storage for deployment secrets

## Lambda Function Configuration

### Environment Variables
```bash
PARAMETER_PREFIX=/kelifax/deploy
DOCKER_IMAGE=yourusername/kelifax-deploy:latest
AWS_REGION=us-east-1
```

### Lambda Function Flow
1. Receive deployment request from API Gateway
2. Parse environment (dev/prod) from request
3. Fetch parameters from AWS Parameter Store (SecureString decryption)
4. Run Docker container with injected environment variables
5. Stream build logs to CloudWatch
6. Return deployment status (success/failure)

## Docker Hub Setup

### Repository Configuration
- **Visibility**: Public (no authentication costs)
- **Repository**: `yourusername/kelifax-deploy`
- **Tags**: `latest`, `v1.0.0`, etc.
- **Automated Builds**: Optional GitHub integration

### Image Optimization
- **Base Image**: Node.js Alpine Linux (~50MB)
- **Multi-stage Build**: Separate build and runtime stages
- **Layer Caching**: Optimize for faster builds
- **Security Scanning**: Enable vulnerability scanning

## Integration with Admin Panel

### Admin Panel Button
```javascript
// Admin panel deployment trigger
async function triggerDeployment(environment) {
  const response = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      environment: environment,  // 'dev' or 'prod'
      buildId: generateBuildId()
    })
  });
  
  const result = await response.json();
  return result;
}
```

### Deployment Status
- **Real-time Updates**: WebSocket or polling for build status
- **Build Logs**: Stream CloudWatch logs to admin interface
- **Success/Failure Feedback**: Visual indicators in admin panel
- **Build Duration**: Track and display deployment time

## Directory Structure Inside Running Container

```
/ (container root)
├── app/                        # Container tools & scripts
│   ├── scripts/               # Deployment scripts
│   ├── configs/               # Configuration templates
│   └── entrypoint.sh         # Container entry point
├── tmp/
│   └── kelifax-app/          # YOUR CODE (cloned at runtime)
│       ├── astro.config.mjs  # Your project files
│       ├── src/              # Your source code
│       ├── dist/             # Built site (created during build)
│       ├── package.json      # Your dependencies
│       └── env.dev.config    # Environment config
└── root/.ssh/
    └── id_rsa                # SSH key (injected at runtime)
```

## Implementation Steps

### Phase 1: Container Development
1. **Create container workspace** with proper structure
2. **Develop Dockerfile** with multi-stage build
3. **Create deployment scripts** for dev/prod environments
4. **Test locally** with docker-compose
5. **Push to Docker Hub** as public repository

### Phase 2: AWS Infrastructure
1. **Generate SSH key pair** for GitHub deployment
2. **Add public key** as GitHub Deploy Key (read-only)
3. **Store private key** and credentials in AWS Parameter Store (SecureString)
4. **Create Lambda function** to run container
5. **Configure IAM roles** for Lambda and Parameter Store access

### Parameter Store Setup Commands
```bash
# Store GitHub SSH private key (SecureString)
aws ssm put-parameter \
  --name "/kelifax/deploy/github-ssh-key" \
  --value "$(cat ~/.ssh/kelifax_deploy)" \
  --type "SecureString" \
  --description "GitHub Deploy Key for Kelifax repository"

# Store AWS credentials (SecureString)
aws ssm put-parameter \
  --name "/kelifax/deploy/aws-access-key-id" \
  --value "AKIA..." \
  --type "SecureString"

aws ssm put-parameter \
  --name "/kelifax/deploy/aws-secret-access-key" \
  --value "your-secret-key" \
  --type "SecureString"

# Store configuration values (String - no encryption needed)
aws ssm put-parameter \
  --name "/kelifax/deploy/s3-bucket-dev" \
  --value "dev.kelifax.com" \
  --type "String"

aws ssm put-parameter \
  --name "/kelifax/deploy/s3-bucket-prod" \
  --value "kelifax.com" \
  --type "String"

aws ssm put-parameter \
  --name "/kelifax/deploy/cloudfront-distribution-id-dev" \
  --value "E1234567890" \
  --type "String"

aws ssm put-parameter \
  --name "/kelifax/deploy/cloudfront-distribution-id-prod" \
  --value "E0987654321" \
  --type "String"

aws ssm put-parameter \
  --name "/kelifax/deploy/github-repo-url" \
  --value "git@github.com:yourusername/kelifax.git" \
  --type "String"
```

### Required IAM Permissions for Lambda
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:us-east-1:*:parameter/kelifax/deploy/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:kms:us-east-1:*:key/alias/aws/ssm"
      ]
    }
  ]
}
```

### Phase 3: API Integration
1. **Create deployment API endpoint** in API Gateway
2. **Integrate with admin panel** deployment buttons
3. **Implement build status tracking** and logging
4. **Add error handling** and retry logic
5. **Test end-to-end deployment** flow

### Phase 4: Monitoring & Optimization
1. **Set up CloudWatch dashboards** for monitoring
2. **Configure alerts** for deployment failures
3. **Optimize container size** and build time
4. **Implement deployment rollback** mechanism
5. **Add deployment analytics** and metrics

## Security Considerations

### Access Control
- **GitHub Deploy Key**: Read-only repository access
- **AWS IAM Roles**: Minimal required permissions
- **Parameter Store SecureString**: KMS-encrypted parameter storage
- **Container Isolation**: Ephemeral execution environment

### Audit & Compliance
- **CloudWatch Logs**: All deployment activities logged
- **AWS CloudTrail**: API calls and resource access tracked
- **Build Artifacts**: Deployment history and rollback capability
- **Security Scanning**: Regular container vulnerability assessment

## Troubleshooting

### Common Issues
1. **SSH Key Authentication**: Verify Deploy Key is properly configured
2. **Build Failures**: Check Node.js version compatibility
3. **S3 Sync Issues**: Validate AWS credentials and bucket permissions
4. **CloudFront Invalidation**: Confirm distribution ID configuration
5. **Lambda Timeouts**: Monitor execution time and memory usage

### Debug Commands
```bash
# Test container locally
docker run -it --rm \
  -e GITHUB_SSH_KEY="$(cat ~/.ssh/kelifax_deploy)" \
  -e ENVIRONMENT=dev \
  yourusername/kelifax-deploy:latest

# Check Lambda logs
aws logs tail /aws/lambda/kelifax-deploy --follow

# Validate parameters
aws ssm get-parameters --names "/kelifax/deploy/github-ssh-key" --with-decryption
aws ssm get-parameters-by-path --path "/kelifax/deploy" --recursive
```

## Cost Optimization

### Container Optimization
- **Image Size**: Use Alpine Linux base (~50MB vs 200MB+)
- **Layer Caching**: Optimize Dockerfile for layer reuse
- **Multi-stage Builds**: Separate build and runtime dependencies

### Lambda Optimization
- **Memory Allocation**: Test with 1024MB vs 2048MB
- **Execution Time**: Optimize build scripts for faster execution
- **Cold Start**: Keep container warm with scheduled invocations

### Network Optimization
- **Regional Deployment**: Same region as S3 bucket
- **Image Registry**: Use ECR instead of Docker Hub for faster pulls
- **Build Caching**: Cache npm dependencies between builds

## Monitoring & Analytics

### Key Metrics
- **Deployment Success Rate**: Track successful vs failed deployments
- **Build Duration**: Monitor average build times
- **Resource Usage**: Lambda memory and CPU utilization
- **Cost Tracking**: Monitor monthly Lambda execution costs

### Alerting
- **Deployment Failures**: Immediate notification for failed builds
- **Build Duration**: Alert for unusually long build times
- **Cost Thresholds**: Warning when approaching budget limits
- **Security Issues**: Alert for authentication or access failures

## Future Enhancements

### Possible Improvements
1. **Blue-Green Deployments**: Zero-downtime deployment strategy
2. **Rollback Mechanism**: Quick revert to previous deployment
3. **Multi-Region Support**: Deploy to multiple AWS regions
4. **Build Caching**: Cache dependencies and artifacts
5. **Deployment Scheduling**: Schedule deployments for off-peak hours

### Scaling Considerations
- **Concurrent Deployments**: Handle multiple deployment requests
- **Build Queue**: Queue system for sequential deployments
- **Resource Limits**: Monitor and scale Lambda concurrency
- **Cost Management**: Implement deployment quotas and budgets

---

## Next Steps

1. **Review and approve** this deployment strategy
2. **Create container workspace** with proper structure
3. **Generate GitHub Deploy Key** and configure repository
4. **Set up AWS Secrets Manager** with deployment credentials
5. **Develop and test** container locally
6. **Deploy Lambda function** and test integration
7. **Integrate with admin panel** for one-click deployments

This system provides a secure, cost-effective, and automated deployment solution that eliminates the need for manual builds while maintaining the benefits of static site hosting.
