# Caption Generator

A small static tool that turns one filled-in story into three channel-ready
captions, following a 12-question story framework:

| # | Question | What to write |
|---|----------|----------------|
| 1 | Who | Name or pseudonym, and age or role |
| 2 | Where | City, country — not just "a camp" or "the field" |
| 3 | What — the issue | What was wrong before |
| 4 | What — involvement | Our involvement |
| 5 | What — changed | After our involvement, what happened |
| 6 | Why | Why this matters now |
| 7 | Quote | One sentence in their own words |
| 8 | How many | People, households reached |
| 9 | Timeframe | When it started and for how long |
| 10 | Results | Percentage, before and after |
| 11 | Donor | Donor's name |
| 12 | Partners | Local partner name |

## Why it doesn't read like AI copy

The generator never invents content — it only stitches together the exact
clauses you type, in the order the guidelines specify per channel. There's no
language model in the loop, so there's nothing to hallucinate or pad with
stock phrasing. On top of that, every generated caption is run through a
built-in scanner that flags:

- **Hard flags** — stock AI/marketing phrases ("delve into", "in today's
  world", "a testament to", "game-changer", etc.) that should be cut or
  replaced with a concrete detail.
- **Soft cautions** — overused nonprofit shorthand ("vulnerable", "resilient",
  "empower"...) that reads more honestly when swapped for the specific fact
  that made it true in this case.

The result is a strong first draft in your own words, sized correctly for
each channel — meant to be skimmed and lightly hand-polished, not published
verbatim without a read-through.

## Channels

- **Instagram & Facebook** — short, 2–3 sentences, for the general engaged
  public.
- **LinkedIn** — medium, 3–5+ sentences with data (numbers, project phase),
  for sector peers, media, donors, and partners.
- **Website** — long, 5–8+ sentences, the full framework — the anchor the
  other channels link back to.

## Mentions, hashtags & programme tagging

Optional boxes under **Mentions & tags** let you add real social handles for
your organization, the donor, and the partner (e.g. `@drc_ngo`, `@EU_ECHO`).
Handles are only ever used to build the `@mention` line exactly as typed —
nothing is guessed, since an invented handle could tag the wrong account.

Hashtags are generated automatically and appended under each caption, built
from (in order): the selected **Programme** (see below), the organization/
donor/partner handles or names, the location, and keywords found in the
story itself (school → `#Education`, water/sanitation → `#WASH`, and so on).

The optional **Programme** dropdown covers the standard programme areas
(Protection, Economic Recovery, Humanitarian Disarmament and Peacebuilding,
Shelter/WASH/Infrastructure, Innovation, Civil Society Engagement) and feeds
a matching hashtag (e.g. Child Protection → `#ChildProtection`) — it doesn't
alter the caption prose itself.

## Regenerate

Each caption has a **Regenerate** button that cycles through different
phrasing (different connecting words and transitions) while keeping every
fact in the same order the guidelines specify — a quick way to see a few
options and pick the one that reads best, without changing any content.

## Using it

Open `index.html` in a browser (or serve the folder with any static file
server). Fill in the boxes on the left; the three captions on the right
update as you type. As you start typing in the story boxes (issue,
involvement, changed, why, quote), a row of clickable example phrasings
appears underneath to help if you're stuck — click one to drop it into the
box. Each caption has a **Copy** button and a live sentence counter against
the channel's target length. Two optional boxes — **project phase** and
**website link** — strengthen the LinkedIn caption specifically, per the
guidelines' note to add project phase and a link back to the full story.

No build step, no dependencies, no data leaves the browser.
