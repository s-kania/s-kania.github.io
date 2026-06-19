# Agent Instructions

## Local Runtime

- Run this project only through Docker Compose.
- Do not start host-based development or preview servers, including `python3 -m http.server`, `bundle exec jekyll serve`, `jekyll serve`, `npm run dev`, `npx vite`, or similar host commands.
- Use `docker compose up site` for the local preview server.
- Use `docker compose run --rm build` for production builds.
- Use `docker compose run --rm test` for validation.
- Do not install Ruby gems, Node packages, Playwright browsers, or other project runtime dependencies on the host machine. Dependencies must stay inside Docker or existing project-local tooling.
- If Docker is unavailable or the Docker daemon is blocked, stop and ask the user instead of using a host fallback.
