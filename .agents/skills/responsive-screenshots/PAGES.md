# Responsive Screenshot Page Targets

Use these ids with:

```bash
node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page <id> --label <label>
```

Use `--page all` for every listed target, or `--path /some/url/` for an ad hoc route.

## Core Pages

| id | path | when to use |
| --- | --- | --- |
| `home` | `/` | Homepage: hero, post cards, BF_BROWSER, categories, system panel. |
| `archives` | `/archives/` | Archive tab. |
| `categories` | `/categories/` | Categories index tab. |
| `about` | `/about/` | About page. |
| `privacy-policy` | `/privacy-policy/` | Hidden privacy policy page. |

## Category Archives

| id | path |
| --- | --- |
| `category-ciekawostki` | `/categories/ciekawostki/` |
| `category-devlog` | `/categories/devlog/` |
| `category-galerie` | `/categories/galerie/` |
| `category-inne` | `/categories/inne/` |
| `category-piraci` | `/categories/piraci/` |
| `category-poradniki` | `/categories/poradniki/` |
| `category-recenzje` | `/categories/recenzje/` |

## Posts

| id | path | coverage note |
| --- | --- | --- |
| `post-piraci-4` | `/posts/piraci-4/` | Latest post; devlog with image. |
| `post-aukcja-duch-kijowa` | `/posts/aukcja-duch-kijowa/` | Short post with image. |
| `post-klockowe-ciekawostki-3` | `/posts/klockowe-ciekawostki-3/` | Long post with images. |
| `post-piraci-3` | `/posts/piraci-3/` | Devlog with YouTube embed. |
| `post-klockowe-ciekawostki-2` | `/posts/klockowe-ciekawostki-2/` | Object-fit image metadata. |
| `post-piraci-2` | `/posts/piraci-2/` | Devlog with YouTube embed. |
| `post-bricks-and-figs-masters` | `/posts/bricks-and-figs-masters/` | Long gallery/event post. |
| `post-piraci-1` | `/posts/piraci-1/` | Piraci devlog post. |
| `post-astronauci-w-stratosferze` | `/posts/astronauci-w-stratosferze/` | Post page. |
| `post-fiat-500-galeria` | `/posts/fiat-500-galeria/` | Gallery post. |
| `post-zamek-w-czchowie` | `/posts/zamek-w-czchowie/` | Post page. |
| `post-recenzja-jagdpanther` | `/posts/recenzja-jagdpanther/` | Review post. |
| `post-wizyta-w-bricks-and-figs` | `/posts/wizyta-w-bricks-and-figs/` | Long post with image gallery. |
| `post-cashback` | `/posts/cashback/` | Guide post. |
| `post-klockowe-ciekawostki-1` | `/posts/klockowe-ciekawostki-1/` | Ciekawostki post. |
| `post-ciekawostki` | `/posts/ciekawostki/` | Post page. |
| `post-klockowe-urodziny` | `/posts/klockowe-urodziny-i-marzenia-o-tworzeniu-gier/` | First post; long text without post image. |

## Recommended Sets

| command target | use |
| --- | --- |
| `--page home` | Homepage-only visual iteration. |
| `--page post-piraci-4` | Current/latest post layout. |
| `--page categories,category-devlog,archives` | Navigation and listing pages. |
| `--page home,post-piraci-4,categories,category-devlog,archives` | Fast broad regression pass. |
| `--page all` | Full site route pass. This creates many screenshots. |
