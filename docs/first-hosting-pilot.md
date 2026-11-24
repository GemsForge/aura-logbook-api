# First hosting pilot: a $0 deployment investigation

**Status:** Decision guide, not a deployment runbook  
**Reviewed:** 2026-11-24  
**Scope:** Host the current Aura Logbook web UI, API, SQLite database, and private mood photos for a small trial without committing to a monthly bill.

## ✅ Recommendation in one minute

For a strict $0 monthly budget while keeping the current application, the closest fit is **Oracle Cloud Infrastructure (OCI) _Always Free_** with one **`VM.Standard.A1.Flex` Compute** instance and its persistent **Boot Volume**. Put the React UI, .NET 10 (LTS) API, SQLite database, and private photo directory on that computer. This avoids a separate paid database or Blob Storage service.

This is a **learning pilot**, not hosting with a dependable uptime or support guarantee. OCI may reclaim low-use Always Free compute, Free Tier has no SLA, and you are responsible for server maintenance and tested backups. If even occasional downtime or hands-on server care is unacceptable, the responsible choice under a $0 constraint is to keep the trial private/local until a budget or a suitable managed free service is available.

Ten end users is a sensible first pilot size for usability feedback. It is not too many for the proposed small instance, but user count alone does not make private journal data safe. Tell participants it is a trial and set expectations about availability and recovery.

## 🧩 Why this matches the current application

Aura Logbook currently uses:

- **UI:** React 19, TypeScript, and Vite.
- **API:** .NET 10 (LTS) and ASP.NET Core.
- **Database:** SQLite via Dapper and ordered SQL migrations.
- **Private photos:** image files outside the static web root, with attachment metadata in SQLite.

Production requires an explicitly configured durable SQLite file. The SQLite database and private photo directory must be kept together and backed up together. SQLite is intended to be served by one API instance, not several replicas sharing the same database file.

The proposed single-machine setup fits those existing boundaries and avoids a database migration for this pilot. It does not remove the need to configure production settings, secrets, HTTPS, firewall rules, backups, deployment, and monitoring. See [Runtime environments](runtime-environments.md#production-cutover-from-json-files) and [Private mood media attachments](private-media-attachments.md) for the application’s storage contract.

## ☁️ OCI product list

| Need | Product | Pilot use |
| --- | --- | --- |
| Run the UI and API | **OCI Compute**, shape **`VM.Standard.A1.Flex`** | One Linux computer within the Always Free A1 allowance (currently up to 2 OCPUs and 12 GB memory for Always Free accounts). |
| Persist database and photos | **OCI Block Volume**, using the instance’s **Boot Volume** | Store the SQLite database and private photo directory on a persistent disk. OCI lists 200 GB of combined boot and block volume storage and five volume backups in the home region. The default boot volume is 50 GB; the 200 GB is a shared allowance, not automatically 200 GB assigned to the app. |
| Public networking | **OCI Virtual Cloud Network (VCN)** and the VM’s public IP | Let browsers reach the site. Restrict inbound traffic to what the site needs; keep administration access limited. OCI lists up to 10 TB/month outbound transfer in Always Free. |
| Optional secondary file copy | **OCI Object Storage – Standard** | Optional later backup target, within the current Always Free object-storage allowance. It is not required for the initial single-VM design. |
| CI/CD | **GitHub Actions** | Build/test in GitHub and deploy to the VM. Actions usage allowances depend on whether the repository is public or private and on the GitHub plan; check the account’s current minutes and storage. |
| Domain and HTTPS | Your existing registrar/DNS provider plus a free TLS certificate, such as **Let’s Encrypt** | Point a subdomain to the VM and serve the site over HTTPS. The domain itself remains subject to whatever renewal fee you already pay your registrar. |

OCI also offers two **`VM.Standard.E2.1.Micro`** AMD instances at 1 GB memory each. They are an alternative compute shape, but the A1 option has more headroom for this combined .NET/UI host. Arm requires choosing compatible Linux and .NET packages or container images; Microsoft supports .NET on Linux Arm64, but the exact repository build/deployment path still needs to be prepared and verified before deployment.

**Account and billing caveat:** OCI asks for a credit/debit card for identity verification. Oracle says it will not charge the card unless you upgrade, though a temporary verification hold can appear. Do not upgrade to Pay As You Go, and select only resources explicitly marked Always Free in your home region. Free-tier quotas and availability can change; check the console’s cost/usage view before creating resources. [OCI Free Tier account terms](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)

## 🛠️ What “manage a server” means

It is a cloud computer that you control remotely. You install the operating system and app runtime, make the site reachable, configure secure access, and keep software updated. You also need to notice outages, restore backups, rotate secrets if exposed, and make sure each release leaves the database and photo files in place.

That is valuable CI/CD and infrastructure learning, but it is more responsibility than connecting a repository to a managed website host. Do not put the database or photo folder inside a disposable application container. They must be stored on the persistent disk and mounted at known paths.

## 📷 Data and photo capacity

The browser code downsamples photos to a maximum 2400-pixel long edge, converts browser-decodable images to JPEG, and retries compression until the file is at most 10 MB. A mood entry may have up to 10 attachments. The 10 MB figure is an upload ceiling, not a prediction of the final photo size; actual size depends on image content and browser compression.

Planning examples (not a forecast):

| Trial behavior | Approximate photos | If each averages 0.5 MB | If each averages 2 MB |
| --- | ---: | ---: | ---: |
| 10 people × 1 photo/day × 30 days | 300 | 150 MB | 600 MB |
| 10 people × 10 photos/day × 30 days | 3,000 | 1.5 GB | 6 GB |

These rough totals exclude journal data, operating-system files, logs, and backups. Start with a storage alert/check and review actual usage during the pilot. Keep a separate copy of backups; a second copy on the same VM disk does not protect against losing that VM or account.

## 🌐 Staging on your domain

Yes. Use separate subdomains, for example:

| Address | Purpose |
| --- | --- |
| `app.yourdomain.com` | Trial environment used by participants |
| `staging.yourdomain.com` | Browser-accessible version for your changes and checks |
| `api.yourdomain.com` *(optional)* | API hostname if you choose to separate it from the UI hostname |

Staging must use a **separate database file, photo directory, and credentials**. Never let test migrations or test uploads touch participant data. Protect staging with sign-in or an access rule, and do not assume that a hard-to-guess URL is private. The same VM could host both environments for this small experiment, but that means one server outage affects both.

Another option for **static UI previews only** is **Cloudflare Pages**. It can create branch preview URLs and can map a custom domain to a branch when the domain uses Cloudflare’s proxied DNS. That does not host the .NET API or give the API a durable SQLite/photo store; those remain separate. [Pages preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/), [custom domain for a branch](https://developers.cloudflare.com/pages/how-to/custom-branch-aliases/)

## 🔎 Alternatives checked

| Option | What is free | Why it is not my primary recommendation for this app |
| --- | --- | --- |
| **Azure Static Web Apps Free** | Static UI hosting, custom domains, SSL, and a limited number of staging environments. | Does not supply the durable SQLite database and private photo directory. The Free plan has no SLA. |
| **Azure Container Apps Consumption** | Monthly free allowance currently includes 180,000 vCPU-seconds, 360,000 GiB-seconds, and 2 million requests per subscription. | Its local container files are temporary. Durable data needs separate storage, and excess compute usage is billed. A budget alert is not itself a hard spending stop. |
| **Cloudflare Pages + Workers + D1 + R2** | Free static hosting and included quotas across Workers/D1/R2. | The current backend is .NET/SQLite; this path would mean adapting or rewriting backend and persistence for Cloudflare’s platform. R2 requires adding an R2 subscription and bills usage beyond the free allowance, so it does not give a guaranteed $0 bill. |
| **Render Free** | Free static sites and limited free services. | Render documents free web services as unsuitable for production: filesystem data such as SQLite and uploads is lost on restart/redeploy, and free Postgres expires after 30 days. |
| **GitHub Pages** | Static files, useful for documentation or a UI demo. | It cannot run the API/database and is not a host for an app that collects participant passwords or journal data. |

Provider free allowances are not equivalent to an SLA, a backup guarantee, or a spending cap. For a strict no-charge requirement, avoid products that can bill over their free quota, avoid trial credits as the long-term plan, and don’t upgrade an account to a paid billing plan.

## 📋 Known follow-up work before inviting trial users

This document is an investigation, not evidence that a deployment is configured or ready. Before a public trial, the deployment work should at least:

1. Confirm the hosting account, selected region, and every resource are within Always Free limits; confirm no paid upgrade is enabled.
2. Prepare and verify the app’s Linux/Arm64 build or select a compatible x64 option; the repository currently has no confirmed OCI deployment workflow.
3. Configure Production with a dedicated durable SQLite path and private-media path on persistent storage; use one API instance.
4. Supply JWT and provider secrets through protected deployment configuration; never commit them or bake them into the UI bundle.
5. Configure HTTPS, firewall access, health checks, and an isolated staging database/media directory.
6. Create a database-and-photos backup procedure, keep a copy off the VM, and perform a restore rehearsal before storing trial entries.
7. Document how participants can request deletion/export and what happens to their trial data at the end of the test.

## 🔗 Current source references

- [Project overview](../AURA_PROJECT_OVERVIEW.md)
- [Runtime environments and production storage requirements](runtime-environments.md)
- [Private mood media attachments](private-media-attachments.md)
- [Database recovery](database-recovery.md)
- [OCI Always Free resource limits](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI account and trial behavior](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)
- [Azure Container Apps pricing](https://azure.microsoft.com/en-us/pricing/details/container-apps/)
- [Azure Container Apps storage behavior](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts)
- [Azure Static Web Apps plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare R2 subscription setup](https://developers.cloudflare.com/r2/get-started/)
- [Render free service limits](https://render.com/docs/free)
