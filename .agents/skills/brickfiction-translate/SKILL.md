---
name: brickfiction-translate
description: Translate Brick Fiction repository content from Polish to natural English while preserving the author's voice. Use when translating blog posts, post front matter, summaries, category/UI copy, BF_BROWSER text, or future English versions under the Jekyll/Polyglot setup in this repo.
---

# Brick Fiction Translation

Use this repo-local skill for Polish-to-English translation work in Brick Fiction. The goal is not literal word-for-word translation. Preserve the author's meaning, rhythm, dry humor, informality, and technical clarity while making the English read as if it was originally written in English.

Before translating substantial content, read [references/voice-and-workflow.md](references/voice-and-workflow.md).

## Workflow

1. Read the source content and nearby context before editing:
   - posts: `_posts/*.md`
   - UI strings: `_data/locales/pl.yml`, `_data/locales/en.yml`
   - layouts/includes only when the string usage is unclear
2. Preserve Markdown, Liquid, HTML embeds, image paths, front matter structure, dates, categories, and technical terms unless the user explicitly asks for structural changes.
3. Translate meaning and tone, not surface syntax:
   - keep the casual first-person voice
   - avoid marketing polish and generic AI phrasing
   - keep jokes and throwaway lines, but adapt them into idiomatic English
   - do not add facts, claims, or explanations that are not in the original
4. For post translations, prepare English post metadata along with body text:
   - `title`: natural English title, not a calque
   - `summary`: natural excerpt aligned with the opening paragraph
   - `lang: en`
   - stable `page_id` shared with the Polish original when creating a paired translation
   - English permalink/slug only when the user asks for English URLs; otherwise preserve current repo conventions
5. For posts with hidden translation notes, use them but do not copy them:
   - Read `<!-- EN price note: ... -->` comments in the Polish source.
   - Use those prices as translation guidance after verifying they still fit the English market context.
   - Do not include the HTML comments in the final English post.
6. After edits, run validation through Docker only:
   - `docker compose run --rm test`
   - never use host Jekyll or host dependency installs

## Translation Rules

- Keep Polish brand/product/game names when they are names.
- Translate category labels according to `_data/locales/en.yml`; current preferred labels include `Brick Bits` for `Ciekawostki` and `Misc` for `Inne`.
- Keep `LEGO`, `COBI`, `Defold`, game names, APIs, class names, file names, and code identifiers unchanged unless grammar requires surrounding words to change.
- Keep profanity/roughness only when it is part of the author's style, but choose a natural English equivalent instead of a literal swear-word mapping.
- Translate "gierka" based on tone: usually "the game" or "my pirate game"; use "little game" only if it sounds intentional in context.
- Translate "updejt/updejty" as "update/updates" unless the user wants the Polish-English joke preserved.

## Quality Bar

Before finalizing, reread the English alone and check:

- Would this sound natural to an English-speaking blog reader?
- Does it still sound like the same author, just writing in English?
- Did any sentence become stiffer, longer, or more corporate than the Polish?
- Did the translation preserve concrete details, caveats, humor, and pacing?
- Are titles, summaries, and UI labels concise enough for the layout?
