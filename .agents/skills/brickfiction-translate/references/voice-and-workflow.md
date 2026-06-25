# Voice And Workflow

## Author Voice

Brick Fiction voice is casual, direct, slightly self-deprecating, and specific. It can be technical, but should not sound like product copy. The author often writes like a person explaining what actually happened: what worked, what was annoying, what took longer than expected, and what is worth showing.

Prefer:

- natural first-person phrasing
- short and medium sentences mixed together
- concrete verbs
- understated humor
- idiomatic English that keeps the original intent

Avoid:

- literal Polish syntax in English
- "I am excited to announce", "journey", "deep dive", "stay tuned", "seamless", "robust", "leverage"
- over-explaining jokes
- smoothing away all personality
- making the post more confident or promotional than the source

## Common Choices

Use these as defaults unless the source context clearly needs something else:

- `wpis` -> `post`
- `devlog` -> `devlog`
- `gierka` -> `the game`, `my pirate game`
- `updejt` -> `update`
- `klocki` -> `bricks` when casual, `LEGO sets` when about sets/products
- `ciekawostki` -> `Brick Bits` for category labels
- `inne` -> `Misc` for category labels
- `piracka gierka` -> `my pirate game`
- `poszło wolniej niż zakładałem` -> `moved more slowly than I expected`

## Post Translation Checklist

When creating an English version of a post:

1. Read the whole Polish post first. Do not translate paragraph-by-paragraph blindly.
2. Identify the post's point: status update, tutorial, review, gallery, devlog, or loose note.
3. Translate the title and summary after translating or at least understanding the body.
4. Preserve front matter keys and media metadata. Improve English `summary` as a natural excerpt from the opening paragraph.
5. Preserve image markdown, captions, embeds, code blocks, and Liquid includes exactly unless text inside them needs translation.
6. Keep links unchanged unless the target has a known English equivalent.
7. For code-heavy devlogs, translate explanations around code but keep identifiers unchanged.
8. Run `docker compose run --rm test` after editing repository content.

## Examples

Polish:

> Blog trochę odżył wizualnie. Od dawna chciałem, żeby miał więcej własnego charakteru i lepiej pasował do tego, co chcę tu wrzucać częściej - wpisów o tworzeniu gier.

Good English:

> The blog has had a bit of a visual refresh. For a long time I wanted it to feel more like its own thing and fit better with what I want to post here more often: notes about making games.

Polish:

> Dobre miejsce, żeby sprawdzić, co kiedy powstawało i jak blog zmieniał się po drodze. Kurz w pakiecie, alergicy ostrożnie.

Good English:

> A good place to see what was published when and how the blog has changed over time. Expect a bit of dust; allergy sufferers, proceed with caution.
