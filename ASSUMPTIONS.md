# Architectural Assumptions & Hardware Constraints

This document outlines the strict engineering assumptions and deliberate compromises made to enforce the extreme hardware boundaries applied to this project.

## Constraint 1: Sub-150MB Disk Space Limit
The primary development machine was running Windows with critically low disk space (`<150MB`). 
**Concessions Made:**
- **Refusal to install PyTorch/Tensorflow:** Native Deep Learning training environments require 2.5GB+ of binaries. We designed a Pure-Python deterministic inference (`backend/main.py`) to bypass this.
- **Refusal to install Playwright locally:** Installing `@playwright/test` downloads ~800MB of WebKit/Chromium browser binaries. We configured all E2E testing to strictly execute on GitHub Actions Cloud Runners via `e2e_tests.yml`. Local `.spec.ts` files exist solely as text artifacts.
- **Refusal to download physical `.onnx` models:** To prove browser ML integration via `onnxruntime-web`, we built the structural loading interface (`onnxRunner.ts`) but deliberately stubbed the real binary load to prevent space exhaustion.
- **Pure CSS Hydrographs:** Blocked the installation of `recharts` or `chart.js` to preserve exact frontend bundle limits. The 48h trend curves in the Station Popups are purely rendered using `<div>` heights and flexbox logic.

## Constraint 2: "Zero-Server" Mandate
To ensure rural and widespread availability without relying on fragile server infrastructure (or expensive AWS hosting costs):
**Concessions Made:**
- **No traditional Python scraping backend deployed:** The Python scripts designed to poll internal NDMA/CWC/IMD endpoints are shifted to GitHub Actions Cron Jobs (`telemetry_sync.yml`).
- These cron jobs write raw JSON responses directly to `frontend/public/mock/*.json`, creating a static data-lake that requires exactly $0 to host globally.
- **React Frontend statically rendered:** The Vite build pipeline executes through `deploy.yml` completely decoupling the site from dynamically rendered server costs.

## Constraint 3: Mock Public APIs
Because actual IMD and CWC critical-infrastructure APIs have strict CORS protections, rate-limits, or require National NIC VPN clearances:
**Concessions Made:**
- The TanStack Query hooks fetch strictly from the `public/mock/` data lake.
- The structural Zod schemas are rigorously defined. Should the site eventually gain clearance to the live CWC APIs, only the URL strings inside `useTelemetry.ts` need to change. The architecture will flawlessly adapt to the real shapes.
