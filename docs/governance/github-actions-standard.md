# Shared GitHub Actions Standard

Issue: #284

This repository participates in the GemsForge shared Actions standard. The standard defines the contract; this repository remains the adapter.

## Shared contract

- Validate pull requests before merge.
- Keep policy checks for branch names, commit subjects, issue linkage, labels, and required metadata.
- Pin action major versions intentionally and review upgrades.
- Use least-privilege permissions; never expose secrets to untrusted pull-request code.
- Keep checks deterministic, visible, and documented.
- Require the repository's existing checks to pass before merge.
- Treat deployment, production data, secrets, and project-board mutations as separately approved operations.

## Repository adapter

- Preserve the existing split policy workflows and the UI checks workflow.
- Keep the current Node 20 UI validation and the repository's .NET/API conventions.
- Keep issue metadata and Project synchronization repository-specific.
- Do not replace this adapter with a shared workflow if doing so would weaken existing policy enforcement.
- Production deployment runs from `master` through `.github/workflows/deploy.yml`: validation and artifact packaging finish before the `prod` environment gate, then one serialized job deploys the API before the UI and invokes the post-deployment smoke workflow.
- The release workflow refuses to deploy while the API projects still target .NET 9; merge the .NET 10 runtime prerequisite (#461) first.
- Keep `VITE_API_BASE_URL`, `AZURE_API_URL`, and `AZURE_UI_URL` as non-secret repository variables so build and smoke jobs can read them before the deployment approval. Keep `AZURE_API_PUBLISH_PROFILE` and `AZURE_SWA_TOKEN` as secrets scoped to the `prod` environment.
- Restrict the `prod` environment to `master` and configure required reviewers there when approval before production deployment is desired. Do not expose deployment credentials to pull-request jobs.

## Change process

Actions changes follow the normal issue → branch → commit → pull request → checks → review flow. Each Actions PR must state which shared contract item it implements, which local checks it touches, and how security was verified.


## Project synchronization

Aura’s existing Project synchronization uses the shared PROJECTS_TOKEN secret and Aura-specific Project/status identifiers. Do not copy GemsForgeAPI Project numbers, fields, or tokens.

Project changes remain repository-specific and require the existing approval and secret boundaries.
