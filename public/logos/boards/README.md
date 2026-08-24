# Job board logos

Drop the official mark for each board here and it appears automatically —
in the publish wizard, on each board posting row, and beside the matching
channel in the recruiter dashboard's sourcing breakdown.

Until a file is present, `BoardLogo` renders a neutral monogram instead of a
broken image, so the interface is complete either way.

| Board | Filename | Where to get it |
|---|---|---|
| PNet | `pnet.svg` | pnet.co.za press / media kit |
| CareerJunction | `careerjunction.svg` | careerjunction.co.za media resources |
| LinkedIn | `linkedin.svg` | brand.linkedin.com — downloads page |
| Indeed | `indeed.svg` | indeed.com press resources |

`.png` works too — change the filename in `BOARD_ASSETS` in
`src/components/BoardLogo.tsx` to match.

## Rules these files have to follow

**Use the official asset.** Not a screenshot, not a trace, not something a
generator produced. All four are registered trademarks, and a redrawn
approximation is a distorted trademark rather than a missing one.

**Do not modify them.** No recolouring to fit the palette, no cropping the
mark out of a lockup, no adding effects. Each brand's guidelines prohibit it,
and LinkedIn's are explicit.

**Square-ish, transparent background.** They render into a 20–36px box with
`object-contain`. A wordmark with wide margins will look tiny next to a square
mark; prefer the icon/badge form where a brand offers one.

**Local only.** Never hotlink from the brand's CDN. The published demo has to
work with no network, and the Content-Security-Policy blocks external hosts
anyway.

## Where these logos may and may not appear

They identify a channel, which is nominative use — the same basis as the Dots
Africa mark in `BackgroundCheckPanel`. That holds only while each logo sits
next to the *function* it describes: "Publish to", a posting row, a sourcing
channel.

It stops holding if one is placed beside the ShumelaHire or Arthmatic mark, on
a login or marketing page, or under a heading like "Partners" or "Trusted by".
Placed that way it stops identifying a channel and starts implying an
endorsement none of these boards has given.
