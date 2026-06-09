# E2E Tests

Playwright regression suite that runs against the published Cornerman URL.

## Run locally

```bash
bunx playwright install --with-deps chromium
bunx playwright test
```

Override the target:

```bash
E2E_BASE_URL=https://brs39.lovable.app bunx playwright test
```

## Real-AI tests

Tests that consume LLM quota or real auth are gated by `E2E_FULL=1`. Routine CI
runs skip them so we don't burn AI credits on every push.

```bash
E2E_FULL=1 TEST_EMAIL=... TEST_PASSWORD=... bunx playwright test
```

## Env vars

| Var             | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `E2E_BASE_URL`  | Target origin (defaults to the published URL).                          |
| `E2E_FULL`      | When `1`, enables real-AI and authenticated flows.                      |
| `TEST_EMAIL`    | Cornerman test account email — set as a GitHub Actions secret.          |
| `TEST_PASSWORD` | Cornerman test account password — set as a GitHub Actions secret.       |