# Redesign: IDC Careers Portal — Premium Corporate Look

## Context
The current `/jobs` pages look basic — flat solid-color hero, minimal card styling, generic layout. The IDC website uses a polished corporate aesthetic: generous whitespace, decorative geometric elements, subtle shadows, structured grid layouts, and strategic gold accent placement. This redesign brings the careers portal up to that standard.

## Design Decisions
- **White header** with official IDC logo (already downloaded to `/public/idc-logo.png`)
- **Hero section**: Deep navy (#05527E) background with subtle CSS geometric pattern overlay (no images needed), large headline, descriptive copy, and an inline search bar
- **Stats bar**: Gold-accented metrics strip below hero showing open positions, departments, locations
- **Job cards**: Richer cards with left gold accent border on hover, department pill badge, structured info grid, subtle shadow elevation
- **Filters**: Always-visible horizontal filter bar (no toggle), styled as pill selectors
- **Detail page**: Two-column layout (main content + sidebar with key details card), breadcrumb, and a sticky apply CTA
- **Footer**: Richer multi-column footer matching IDC's style — social links, ethics hotline, structured link groups

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/jobs/IDCCareersHeader.tsx` | Redesign with proper nav, search icon, responsive hamburger |
| `src/components/jobs/IDCCareersFooter.tsx` | Richer multi-column footer with social links, ethics info |
| `src/components/jobs/IDCJobListClient.tsx` | Complete redesign: hero with pattern, stats bar, horizontal filters, premium job cards |
| `src/app/(app)/jobs/[slug]/page.tsx` | Two-column layout, sidebar key-details card, improved CTA section, breadcrumb polish |
| `src/app/(app)/jobs/layout.tsx` | No changes (already clean) |
| `src/app/(app)/jobs/page.tsx` | No changes (server component, just passes data) |

## Component Design Details

### Header (`IDCCareersHeader.tsx`)
- White background, subtle bottom shadow
- IDC logo left, "Careers" nav center-right with gold underline active state
- Optional "Back to IDC" link on far right
- Gold 2px accent strip below

### Hero (inside `IDCJobListClient.tsx`)
- Full-width navy (#05527E) with repeating subtle CSS diagonal line pattern (via `background-image: repeating-linear-gradient`)
- Headline: "Build Your Career at the IDC" — 48px bold, white, tight tracking
- Subtext: 2 lines about IDC mission — white/80 opacity
- Embedded search bar: white rounded input with search icon, right inside the hero
- Bottom edge: subtle curved clip-path or angled divider for visual interest

### Stats Bar
- Light background (#F8FAFC) strip below hero
- 3 stats: "X Open Positions", "Y Departments", "Z Locations" — extracted from job data
- Each stat: large bold number in gold, label in navy, separated by vertical dividers

### Filter Bar
- Horizontal row: Location dropdown, Department dropdown, Employment Type dropdown, Clear button
- Always visible (no toggle), compact, pill-style dropdowns
- Sits in a white card below stats

### Job Cards
- White card, 2px border-radius, left 3px gold border accent on hover
- **Row 1**: Job title (bold, navy, linked) + employment type pill badge (right)
- **Row 2**: Department · Location · Closing date — icon-prefixed, muted text
- **Row 3 (optional)**: Salary range if available
- **Right side**: "View Position →" text link in primary blue
- Hover: slight shadow elevation + left gold border appears
- Featured jobs get a small gold "Featured" badge

### Detail Page (`[slug]/page.tsx`)
- **Breadcrumb**: Careers > Department > Job Title
- **Two-column layout**:
  - Main (2/3): Job title, description HTML
  - Sidebar (1/3): Sticky card with key details (location, type, department, salary, closing date) + "Apply Now" gold CTA button
- **About IDC** section at bottom of main column
- Remove the current center-aligned CTA block — the sidebar handles it

### Footer (`IDCCareersFooter.tsx`)
- Dark navy (#0F172A) background
- 4 columns: About IDC, Quick Links, Contact, Ethics & Fraud
- Social media icons row (LinkedIn, Twitter, Facebook)
- Bottom bar: copyright + "Powered by ShumelaHire"
- Gold top border accent (2px)

## Tailwind Utilities Used
- Existing config has `shumelahire` color scale, `gold` accent, `navy`, `charcoal`, custom shadows
- Border-radius: `rounded-control` (2px), `rounded-button` (9999px)
- Use `tracking-[-0.03em]` for headlines, `tracking-[0.05em]` for labels

## Verification
1. Visit `http://localhost:3000/jobs` — should show polished hero with pattern, stats, filters, premium cards
2. Click a job → detail page with two-column layout, sidebar, breadcrumb
3. Responsive: hero stacks, sidebar moves below content on mobile, filters scroll horizontally
4. No auth required for any page
