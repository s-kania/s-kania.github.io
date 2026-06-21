# Agent Instructions

## Local Runtime

- Run this project only through Docker Compose.
- Do not start host-based development or preview servers, including `python3 -m http.server`, `bundle exec jekyll serve`, `jekyll serve`, `npm run dev`, `npx vite`, or similar host commands.
- Use `docker compose up site` for the local preview server.
- Use `docker compose run --rm build` for production builds.
- Use `docker compose run --rm test` for validation.
- Do not install Ruby gems, Node packages, Playwright browsers, or other project runtime dependencies on the host machine. Dependencies must stay inside Docker or existing project-local tooling.
- If Docker is unavailable or the Docker daemon is blocked, stop and ask the user instead of using a host fallback.

## Content Conventions

- Post front matter `summary` is the teaser shown on the home page cards. Prefer a natural excerpt from the first sentence or first few sentences of the post, and keep it aligned with the opening paragraph instead of writing a separate promotional blurb.
- Images in post content should use meaningful `alt` text that describes the actual subject of the image. Avoid generic labels such as file names, numbers, "image", or vague gallery counters unless the image is purely decorative.
- Prefer descriptive image file names for new assets. For important posts, keep `image` front matter populated so SEO/social metadata can point at a representative preview image; `preview_image` is for card presentation only and should not be treated as a replacement for SEO metadata.

## SEO Notes

- Keep `_config.yml` `url` without a trailing slash, for example `https://brickfiction.pl`. A trailing slash causes Jekyll SEO and sitemap output to generate double slashes in canonical URLs and sitemap entries.
