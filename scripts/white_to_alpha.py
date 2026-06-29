#!/usr/bin/env python3
"""Turn white image backgrounds into transparent PNGs.

The script removes only white-ish pixels connected to the image border by
default. That keeps white model details inside the subject intact while still
clearing the usual product-photo background.

Examples:
  python3 scripts/white_to_alpha.py assets/posts/example/product.png
  python3 scripts/white_to_alpha.py assets/posts/example --recursive
  python3 scripts/white_to_alpha.py image.jpg --tolerance 42 --output image-cutout.png
  python3 scripts/white_to_alpha.py product.jpg --tolerance 110 --cleanup-tolerance 150 --feather-radius 0.5
"""

from __future__ import annotations

import argparse
import math
from collections import deque
from pathlib import Path
from typing import Iterable

try:
    from PIL import Image, ImageFilter
except ImportError as exc:  # pragma: no cover - depends on local tooling
    raise SystemExit(
        "This script requires Pillow. Do not install it on the host for the site runtime; "
        "use an environment that already has Pillow available."
    ) from exc


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Replace white backgrounds with transparency and write PNG output."
    )
    parser.add_argument("inputs", nargs="+", help="Image files or directories to process.")
    parser.add_argument(
        "-o",
        "--output",
        help="Output PNG path for a single input file, or output directory for multiple inputs.",
    )
    parser.add_argument(
        "--suffix",
        default="-transparent",
        help="Suffix for generated files when --output is not a file path. Default: %(default)s",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="When an input is a directory, process images recursively.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow overwriting generated output files.",
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=32.0,
        help=(
            "RGB distance from pure white to treat as background. "
            "Use 24-36 for clean white, 45-70 for gray shadows. Default: %(default)s"
        ),
    )
    parser.add_argument(
        "--global-white",
        action="store_true",
        help="Remove every white-ish pixel, not only pixels connected to image edges.",
    )
    parser.add_argument(
        "--max-step",
        type=float,
        default=12.0,
        help=(
            "Maximum RGB distance between neighboring pixels while flood-filling. "
            "This helps cross soft shadows but blocks hard object edges. "
            "Set to 0 to disable. Default: %(default)s"
        ),
    )
    parser.add_argument(
        "--min-edge-white-ratio",
        type=float,
        default=0.12,
        help=(
            "Skip edge-based processing if fewer border pixels look white. "
            "Set to 0 to process every file. Default: %(default)s"
        ),
    )
    parser.add_argument(
        "--cleanup-tolerance",
        type=float,
        default=0.0,
        help=(
            "Optional second-pass RGB distance from white for cleaning small shadow/JPEG halo "
            "fragments. Set higher than --tolerance, e.g. 140-180. Default: disabled."
        ),
    )
    parser.add_argument(
        "--cleanup-max-step",
        type=float,
        default=0.0,
        help=(
            "Neighbor color step for the second-pass cleanup mask. "
            "Default 0 disables the step limit for cleanup."
        ),
    )
    parser.add_argument(
        "--cleanup-max-area",
        type=int,
        default=2500,
        help=(
            "Maximum disputed component area to remove during second-pass cleanup. "
            "Larger components, such as white product faces, are preserved. Default: %(default)s"
        ),
    )
    parser.add_argument(
        "--cleanup-max-thickness",
        type=int,
        default=32,
        help=(
            "Remove disputed components whose narrower side is at most this many pixels. "
            "Default: %(default)s"
        ),
    )
    parser.add_argument(
        "--feather-radius",
        type=float,
        default=0.0,
        help=(
            "Slightly blur the alpha mask edge and remove white matte from partially "
            "transparent pixels. Use 0.4-0.8 for JPG product photos. Default: disabled."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned changes without writing files.",
    )
    return parser.parse_args()


def iter_images(paths: Iterable[str], recursive: bool) -> list[Path]:
    images: list[Path] = []
    for raw_path in paths:
        path = Path(raw_path)
        if path.is_dir():
            iterator = path.rglob("*") if recursive else path.glob("*")
            images.extend(
                item for item in iterator if item.is_file() and item.suffix.lower() in SUPPORTED_EXTENSIONS
            )
        elif path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            images.append(path)
        else:
            print(f"skip: {path} is not a supported image file")
    return sorted(dict.fromkeys(images))


def output_path_for(input_path: Path, output: str | None, total_inputs: int, suffix: str) -> Path:
    if output:
        output_path = Path(output)
        if total_inputs == 1 and output_path.suffix:
            return output_path.with_suffix(".png")
        return output_path / f"{input_path.stem}{suffix}.png"
    return input_path.with_name(f"{input_path.stem}{suffix}.png")


def distance_from_white(pixel: tuple[int, int, int, int]) -> float:
    red, green, blue, alpha = pixel
    if alpha == 0:
        return 0.0
    return math.sqrt((255 - red) ** 2 + (255 - green) ** 2 + (255 - blue) ** 2)


def color_distance_squared(
    first: tuple[int, int, int, int],
    second: tuple[int, int, int, int],
) -> int:
    return (
        (first[0] - second[0]) ** 2
        + (first[1] - second[1]) ** 2
        + (first[2] - second[2]) ** 2
    )


def is_whiteish(pixel: tuple[int, int, int, int], tolerance: float) -> bool:
    return pixel[3] > 0 and distance_from_white(pixel) <= tolerance


def edge_indices(width: int, height: int) -> list[int]:
    if width == 0 or height == 0:
        return []

    indices: list[int] = []
    for x in range(width):
        indices.append(x)
        if height > 1:
            indices.append((height - 1) * width + x)
    for y in range(1, height - 1):
        indices.append(y * width)
        if width > 1:
            indices.append(y * width + width - 1)
    return indices


def connected_white_mask(
    pixels: list[tuple[int, int, int, int]],
    width: int,
    height: int,
    tolerance: float,
    max_step: float,
) -> bytearray:
    total = width * height
    mask = bytearray(total)
    visited = bytearray(total)
    queue: deque[int] = deque()
    max_step_squared = max_step * max_step

    for index in edge_indices(width, height):
        if not visited[index] and is_whiteish(pixels[index], tolerance):
            visited[index] = 1
            mask[index] = 1
            queue.append(index)

    while queue:
        index = queue.popleft()
        x = index % width
        y = index // width
        neighbors = []
        if x > 0:
            neighbors.append(index - 1)
        if x + 1 < width:
            neighbors.append(index + 1)
        if y > 0:
            neighbors.append(index - width)
        if y + 1 < height:
            neighbors.append(index + width)

        for neighbor in neighbors:
            if visited[neighbor]:
                continue
            visited[neighbor] = 1
            step_ok = (
                max_step <= 0
                or color_distance_squared(pixels[index], pixels[neighbor]) <= max_step_squared
            )
            if step_ok and is_whiteish(pixels[neighbor], tolerance):
                mask[neighbor] = 1
                queue.append(neighbor)

    return mask


def all_white_mask(
    pixels: list[tuple[int, int, int, int]],
    tolerance: float,
) -> bytearray:
    return bytearray(1 if is_whiteish(pixel, tolerance) else 0 for pixel in pixels)


def cleanup_disputed_components(
    base_mask: bytearray,
    cleanup_mask: bytearray,
    width: int,
    height: int,
    *,
    max_area: int,
    max_thickness: int,
) -> int:
    """Merge small/skinny second-pass components into the base background mask."""

    total = width * height
    visited = bytearray(total)
    removed = 0

    for start in range(total):
        if visited[start] or base_mask[start] or not cleanup_mask[start]:
            continue

        queue: deque[int] = deque([start])
        visited[start] = 1
        component: list[int] = []
        min_x = max_x = start % width
        min_y = max_y = start // width

        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % width
            y = index // width
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

            neighbors = []
            if x > 0:
                neighbors.append(index - 1)
            if x + 1 < width:
                neighbors.append(index + 1)
            if y > 0:
                neighbors.append(index - width)
            if y + 1 < height:
                neighbors.append(index + width)

            for neighbor in neighbors:
                if visited[neighbor] or base_mask[neighbor] or not cleanup_mask[neighbor]:
                    continue
                visited[neighbor] = 1
                queue.append(neighbor)

        component_width = max_x - min_x + 1
        component_height = max_y - min_y + 1
        should_remove = (
            len(component) <= max_area
            or min(component_width, component_height) <= max_thickness
        )
        if should_remove:
            for index in component:
                base_mask[index] = 1
            removed += len(component)

    return removed


def apply_feathered_alpha(
    image: Image.Image,
    alpha_mask: bytearray,
    width: int,
    height: int,
    radius: float,
) -> Image.Image:
    alpha = Image.new("L", (width, height))
    alpha.putdata([0 if value else 255 for value in alpha_mask])
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=radius))

    get_alpha_values = getattr(alpha, "get_flattened_data", alpha.getdata)
    get_pixels = getattr(image, "get_flattened_data", image.getdata)
    alpha_values = list(get_alpha_values())
    pixels = list(get_pixels())
    output_pixels = []
    for (red, green, blue, _old_alpha), new_alpha in zip(pixels, alpha_values):
        if new_alpha == 0:
            output_pixels.append((red, green, blue, 0))
            continue
        if new_alpha < 255:
            # Estimate the original foreground color from a white-matte composite.
            red = round((red * 255 - (255 - new_alpha) * 255) / new_alpha)
            green = round((green * 255 - (255 - new_alpha) * 255) / new_alpha)
            blue = round((blue * 255 - (255 - new_alpha) * 255) / new_alpha)
            red = max(0, min(255, red))
            green = max(0, min(255, green))
            blue = max(0, min(255, blue))
        output_pixels.append((red, green, blue, new_alpha))

    output = Image.new("RGBA", (width, height))
    output.putdata(output_pixels)
    return output


def edge_white_ratio(
    pixels: list[tuple[int, int, int, int]],
    width: int,
    height: int,
    tolerance: float,
) -> float:
    indices = edge_indices(width, height)
    if not indices:
        return 0.0
    white_edges = sum(1 for index in indices if is_whiteish(pixels[index], tolerance))
    return white_edges / len(indices)


def remove_white_background(
    input_path: Path,
    output_path: Path,
    *,
    tolerance: float,
    global_white: bool,
    max_step: float,
    min_edge_white_ratio: float,
    cleanup_tolerance: float,
    cleanup_max_step: float,
    cleanup_max_area: int,
    cleanup_max_thickness: int,
    feather_radius: float,
    overwrite: bool,
    dry_run: bool,
) -> bool:
    if output_path.exists() and not overwrite:
        print(f"skip: {output_path} already exists; use --overwrite")
        return False

    image = Image.open(input_path).convert("RGBA")
    width, height = image.size
    get_pixels = getattr(image, "get_flattened_data", image.getdata)
    pixels = list(get_pixels())

    ratio = edge_white_ratio(pixels, width, height, tolerance)
    if not global_white and ratio < min_edge_white_ratio:
        print(
            f"skip: {input_path} edge white ratio {ratio:.1%} "
            f"is below {min_edge_white_ratio:.1%}"
        )
        return False

    mask = all_white_mask(pixels, tolerance) if global_white else connected_white_mask(
        pixels, width, height, tolerance, max_step
    )
    cleanup_removed = 0
    if not global_white and cleanup_tolerance > tolerance:
        second_pass_mask = connected_white_mask(
            pixels, width, height, cleanup_tolerance, cleanup_max_step
        )
        cleanup_removed = cleanup_disputed_components(
            mask,
            second_pass_mask,
            width,
            height,
            max_area=cleanup_max_area,
            max_thickness=cleanup_max_thickness,
        )
    removed = sum(mask)
    if removed == 0:
        print(f"skip: {input_path} has no removable white background")
        return False

    cleanup_text = f", cleanup +{cleanup_removed / len(pixels):.1%}" if cleanup_removed else ""
    print(
        f"{'would write' if dry_run else 'write'}: {output_path} "
        f"({removed / len(pixels):.1%} pixels transparent{cleanup_text}, edge white {ratio:.1%})"
    )
    if dry_run:
        return True

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if feather_radius > 0:
        output_image = apply_feathered_alpha(image, mask, width, height, feather_radius)
    else:
        new_pixels = [
            (red, green, blue, 0) if mask[index] else (red, green, blue, alpha)
            for index, (red, green, blue, alpha) in enumerate(pixels)
        ]
        output_image = image.copy()
        output_image.putdata(new_pixels)
    output_image.save(output_path, "PNG", optimize=True)
    return True


def main() -> int:
    args = parse_args()
    images = iter_images(args.inputs, args.recursive)
    if not images:
        print("No supported images found.")
        return 1

    changed = 0
    for image_path in images:
        output_path = output_path_for(image_path, args.output, len(images), args.suffix)
        if remove_white_background(
            image_path,
            output_path,
            tolerance=args.tolerance,
            global_white=args.global_white,
            max_step=args.max_step,
            min_edge_white_ratio=args.min_edge_white_ratio,
            cleanup_tolerance=args.cleanup_tolerance,
            cleanup_max_step=args.cleanup_max_step,
            cleanup_max_area=args.cleanup_max_area,
            cleanup_max_thickness=args.cleanup_max_thickness,
            feather_radius=args.feather_radius,
            overwrite=args.overwrite,
            dry_run=args.dry_run,
        ):
            changed += 1

    print(f"Processed {len(images)} file(s), wrote/planned {changed}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
