# GitHub Copilot Instructions — Kelifax Project

## 🧩 Project Overview
Kelifax is a **curated tech resources platform** designed to provide verified and categorized digital tools, platforms, and learning materials for developers, students, and technology enthusiasts.

The platform combines a **static frontend** built with Astro and a **serverless backend** powered by AWS Lambda and API Gateway to deliver a scalable, SEO-optimized, and globally available site at minimal cost.

### 🔧 Technologies Used
| Component | Technology | Description |
|------------|-------------|--------------|
| Frontend | **Astro + Tailwind CSS** | Static site generation with responsive design |
| Backend | **AWS Lambda (Python)** | Serverless functions for resource retrieval and contact submissions |
| API Layer | **AWS API Gateway** | Routes frontend API requests to Lambda |
| Hosting | **Amazon S3 + CloudFront** | Static site hosting and CDN distribution |
| Infra-as-Code | **CloudFormation** | Automates deployment of Lambda, API Gateway, and permissions |
| Analytics | **Google Analytics / Plausible** | For SEO and engagement tracking |
| Deployment | **AWS CLI / GitHub Actions** | Build and deploy automation |

---

## ⚙️ Development Flow

1. **Frontend Setup**
   - Use **Astro** for static site generation.
   - Use **Tailwind CSS** for styling.
   - Define SEO metadata, sitemap, and robots.txt.
   - Local testing is done with:
     ```bash
     npm run dev
     ```
     which runs on `http://localhost:4321/`.

2. **Backend Setup**
   - Each Lambda function has its own folder with `handler.py`.
   - Code in **Python 3.12+**, following PEP 8 standards.
   - Use **AWS CLI** or **CloudFormation** for deployment.
   - APIs are served from API Gateway and consumed directly by the frontend (no local mocks).

3. **Integration**
   - The frontend uses `/src/utils/api.js` to call API Gateway endpoints.
   - Enable CORS in API Gateway for frontend access.
   - Handle API errors gracefully in both frontend and backend.

4. **Deployment Workflow**
   ```bash
   npm run build
   aws s3 sync ./dist s3://kelifax-site --delete
   aws cloudfront create-invalidation --distribution-id <id> --paths "/*"

Proposed foleder structure:
 Can be seen in reference-materials/proposed_structure.md



---

## 🧩 Tasks To Do First
1. Create the initial Astro homepage (`src/pages/index.astro`).
2. Add a basic `MainLayout.astro` with header and footer components.
3. Build the `ResourceCard.astro` to display mock resources.
4. Test `npm run dev` locally and confirm static site rendering.
5. Prepare the `dev-get-resources/handler.py` Lambda to return JSON.

---

## 🔒 Notes
- Never commit AWS credentials.
- Keep `.env` files ignored.
- Use descriptive commit messages following the format:
