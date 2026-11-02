# Worth It Global

A custom-built streetwear pre-launch website. GitHub is the source of truth; the intended production frontend is the existing Azure Static Web App `wothitglobal`. The public Java API is intended to run on the existing Azure App Service `worthit-api`. There is no Shopify dependency.

## Pre-launch scope

The authentic welcome film leads to the brand home, forthcoming WORTHIT OG and WORTHIT ANIME collections, and member-access-coming-at-launch information. The site is responsive, supports keyboard navigation and reduced motion, and provides video pause controls. Collection teasers are editorial previews, not merchandise for sale.

Customer registration, checkout, newsletter submissions, inventory and orders are intentionally not enabled. The API returns an empty pre-launch catalog rather than invented products. This release does not collect passwords, card information or customer submissions.

## Local development

Serve the repository root with `python3 -m http.server 8000`, then open `http://localhost:8000`. The API requires a Java 17 JDK and Maven:

```sh
mvn -B -f api/pom.xml verify
PORT=8080 java -jar api/target/worthit-api.jar
curl http://localhost:8080/api/health
curl http://localhost:8080/api/products
node --check script.js
node --check site-config.js
```

For local catalog integration, temporarily set `apiBaseUrl` in `site-config.js` to the local API origin and launch Java with `WORTHIT_CORS_ORIGINS=http://localhost:8000`. Never commit a localhost endpoint as production configuration. Shared JS appends `/api/products`, so configure an origin rather than that endpoint's full path.

## Configuration and deployment

`site-config.js` is public browser configuration. Never put passwords, private API keys, database URLs or deployment credentials there. Empty account URLs intentionally disable sign-in until the commerce release.

The API targets Java 17, packages an executable Spring Boot JAR, honors `PORT` with default 8080, exposes minimal public health information, and restricts catalog CORS to explicitly configured origins. Override the origins with `WORTHIT_CORS_ORIGINS` when needed. Public catalog requests do not use credentials.

`.github/workflows/main_worthit-api.yml` builds/tests `api/`, uploads the exact `api/target/worthit-api.jar`, and deploys using the existing Azure federated identity. Pull requests build but never deploy. Keep the existing `AZUREAPPSERVICE_*` values in GitHub secrets; long-lived Azure credentials do not belong in source.

The frontend workflow constructs a static-only output folder so Java source, tests and internal project documents are not published to Azure. `staticwebapp.config.json` defines browser security headers and a real 404 page. A passing check or artifact upload is not a successful deployment: confirm the deployed version and request its public pages and assets before calling it live.

GitHub Pages is a separate historical deployment path while Azure/domain configuration is reconciled. Do not point one custom domain at competing hosts. Choose the intended canonical frontend, configure its domain binding and DNS, and verify HTTPS before setting canonical metadata.

## Future secure custom-commerce direction

Keep the custom frontend and Java API. Evaluate hosted payment checkout, with Stripe Checkout as a recommended option, so payment-card entry stays with the provider. This reduces exposure but does not remove all compliance responsibilities. The API owns prices, stock validation and checkout creation. Verify signed webhooks and handle retries idempotently before marking orders paid; a success URL or browser total is not proof of payment.

Use a managed relational database for catalog, variants, stock reservations, customers and orders; evaluate Azure Database for PostgreSQL after requirements and budget are known. Store product media in object storage such as Azure Blob Storage, not the API filesystem. Use schema migrations, transaction-safe inventory changes, backups and tested restoration.

Evaluate Microsoft Entra External ID for customer identity rather than inventing password storage. Protect admin functions separately with least-privilege roles and MFA. Use managed identity and a secret manager for server credentials, restrict API permissions, and keep private customer records out of frontend assets and logs. Add rate limits, input validation, operational logging and alerts.

Before accepting sales, implement and test variants/stock, hosted checkout, verified payment webhooks, authorized order history, refunds, shipping/fulfillment, receipts, privacy/terms, backups and recovery. Choose providers and recurring costs with the owner before provisioning. These are future recommendations, not functionality present in pre-launch.

## References

- [Azure Java SE deployment](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java-deploy-run)
- [Azure App Service GitHub Actions deployment](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions)
- [GitHub Pages domain configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
