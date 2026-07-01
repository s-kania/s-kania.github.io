---
name: white-background-cutout
description: Remove white or near-white backgrounds from product photos, create transparent PNG cutouts, and trim transparent image margins. Use when asked to cut out white backgrounds, make LEGO/COBI product images transparent, clean product-photo mattes, crop transparent top/bottom/edge padding, or QA cutout artifacts.
---

# White Background Cutout

Use this repo-local skill for product images where a white or almost-white background should become transparent, and for transparent PNGs that need empty margins trimmed.

## Workflow

1. Inspect the original image first with `view_image`.
   - Check whether the background is connected to the image edge.
   - Note white details inside the subject that must be preserved.
   - Do not use global white removal when the model itself has large white parts unless the user explicitly accepts that risk.
2. Run the bundled script from the repo root.
   - Prefer the default edge-connected flood fill for product photos.
   - Use `--dry-run` first when tuning thresholds.
   - Use `--trim-alpha` when the result needs transparent margins cropped.
3. Inspect the original and output with `view_image`.
   - Check jagged edges, gray/JPEG halo fragments, semitransparent smears, missing subject details, and cropped-off shadows or parts.
   - Iterate thresholds instead of accepting visible artifacts.
4. Clean generated artifacts before finishing.
   - Remove `__pycache__/`, `.pyc`, and unused intermediate images.
   - Keep only the chosen final output when working in a post asset directory.

## Script

Run:

```bash
python3 .agents/skills/white-background-cutout/scripts/white_to_alpha.py <image-or-directory>
```

Useful options:

- `--tolerance 24-36` for clean white backgrounds.
- `--tolerance 45-70` for light gray shadows.
- `--cleanup-tolerance 140-180` to remove small leftover matte fragments.
- `--feather-radius 0.4-0.8` for JPEG product photos with hard white halos.
- `--trim-alpha` to crop transparent margins after background removal.
- `--trim-padding N` to keep `N` pixels of transparent padding around the subject.
- `--alpha-threshold N` to ignore very faint transparent-edge pixels while trimming.
- `--output <path>` for a specific PNG output path.
- `--overwrite` only when replacing an existing generated output is intentional.

Examples:

```bash
python3 .agents/skills/white-background-cutout/scripts/white_to_alpha.py assets/posts/example/product.jpg --dry-run
python3 .agents/skills/white-background-cutout/scripts/white_to_alpha.py assets/posts/example/product.jpg --tolerance 42 --cleanup-tolerance 150 --feather-radius 0.5 --trim-alpha --trim-padding 8
```

The script requires Pillow. Do not install Pillow or project runtime dependencies on the host for this repo. If Pillow is unavailable, report the blocker or use an environment where it is already present.
