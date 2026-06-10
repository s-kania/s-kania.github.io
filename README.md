# Brick Fiction

Static blog built with Jekyll.

## Development

Run the local server with Docker:

```sh
docker compose up site
```

Open <http://localhost:4000>.

## Build

```sh
docker compose run --rm build
```

## Test

```sh
docker compose run --rm test
```

The production deploy is handled by GitHub Actions from `main` and `master`.
