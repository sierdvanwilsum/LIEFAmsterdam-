# DESIGN SYSTEM SPECIFICATION: LIEF CREW PLANNER
**Brand & Visual Identity Reference:** [LIEF Amsterdam](https://liefamsterdam.nl/)  
**Document Version:** 1.0.0  
**Target Platform:** Mobile-First Web Application (Crew App: ~390px) & Desktop Workspace (Manager Dashboard: ~1440px)

---

## 1. BRAND IDENTITY & DESIGN PHILOSOPHY

The **LIEF Crew Planner** bridges the raw, industrial warehouse energy of LIEF Amsterdam (1.500 m² indoor venue + expansive outdoor grounds) with high-efficiency, intuitive staff planning. It rejects generic, cold enterprise SaaS and clinical HR dashboards in favor of:
- **Editorial Atmosphere**: Expressive, high-contrast serif headlines paired with functional sans-serif mechanics.
- **Vibrant Nightlife Contrast**: Delicate, atmospheric lilac/lavender canvases punctuated by razor-sharp neon lime-green highlights and punchy pitch-black elements.
- **Speed & Usability**: Glancable shift information, oversized touch targets for late-night mobile checks, and unambiguous staffing deficit alerts.

---

## 2. EXACT COLOR PALETTE

All color tokens are extracted directly from the active interface screens and the LIEF brand palette.

### 2.1 Core Surfaces & Canvas
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `color-surface-canvas` | `#CDB8F9` | Dominant global viewport background (signature LIEF lilac / soft purple). |
| `color-surface-canvas-subtle` | `#D8C7FA` | Slightly lifted or muted lilac for container fills and background tags. |
| `color-surface-card` | `#FFFFFF` | Primary content card surface (white). Maximum contrast for key shift lists. |
| `color-surface-container-soft`| `#F3EDFD` | Secondary card fills, input backgrounds, sub-panels, and preference highlights. |
| `color-surface-container-dark`| `#111111` | Jet black cards (e.g. Manager desk banners, policy callouts, header bars). |

### 2.2 Brand & Accents
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `color-accent-lime` | `#C2F939` | Primary action accent, active tab pill, confirmed shift badges, primary CTA button. |
| `color-accent-lime-hover` | `#AEEA29` | Hover state for interactive lime buttons and controls. |
| `color-accent-lime-muted` | `#E5FBA2` | Soft lime fill used for secondary badges and subtle status tags. |
| `color-accent-black` | `#0A0A0A` | Deep contrast text, solid pill buttons, circular iconography, bottom app bars. |

### 2.3 Status & Functional Feedback
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `color-status-confirmed` | `#C2F939` | Shift confirmed / fully staffed role (lime green). |
| `color-status-pending` | `#E8DDFD` | In treatment / waiting for allocation ("Wacht op indeling"). |
| `color-status-warning` | `#FEE2E2` | Understaffed warning container / allocation closing alert. |
| `color-status-warning-text`| `#991B1B` | Urgent text & countdowns within warning banners. |
| `color-status-open-pill` | `#FEE4D6` | Role open counter / urgent need tag (warm peachy salmon). |
| `color-status-closed` | `#8C7FA2` | Filled position ("VOL"), inactive / disabled role tag. |

### 2.4 Typography & Text Colors
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `color-text-primary` | `#000000` | Headlines, titles, key shift hours, primary body text. |
| `color-text-secondary` | `#4A4554` | Labels, role descriptions, shift guidelines, helper notes. |
| `color-text-tertiary` | `#7C748C` | Meta timestamps, breadcrumbs, placeholder text. |
| `color-text-inverse` | `#FFFFFF` | Text on dark buttons, dark cards, and header toolbars. |
| `color-text-on-lime` | `#0A0A0A` | Text on lime pill buttons and badges (strictly black for AAA contrast). |

---

## 3. TYPOGRAPHY SYSTEM

Typography creates the distinct tension between LIEF's artistic, late-night identity and industrial operational rigor.

### 3.1 Font Families
- **Editorial Headings**: `'Playfair Display', serif` (Fallbacks: *Italiana*, *Georgia*, *serif*)
  - Character: Expressive, editorial, italicized flourishes for display titles (`Wanneer ben jij erbij?`, `Mijn Planning`, `Kies waar jij het liefst staat`).
- **Functional UI & Data**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
  - Character: Monospaced-clean clarity, high legibility for 24-hour time ranges, counters, crew counts, and buttons.

### 3.2 Type Hierarchy
| Level | Font Family | Size | Weight | Tracking / Leading | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 1** | Playfair Display | `38px`–`42px` | 700 / Italic | `tracking-tight`, `leading-[1.05]` | Hero questions (`Wanneer ben jij erbij?`) |
| **Headline 1**| Playfair Display | `28px`–`32px` | 700 | `tracking-tight`, `leading-snug` | Screen titles (`Mijn Planning`, `Event Detail`) |
| **Headline 2**| Playfair Display | `22px`–`24px` | 700 | `leading-tight` | Event card titles (`Intercell x LIEF Weekender`) |
| **Section Title**| Playfair Display | `18px`–`20px` | 700 | `leading-normal` | Section headers (`Kies waar jij het liefst staat`) |
| **Subheader / Eyebrow** | Inter | `11px`–`12px` | 800 | `tracking-widest`, `uppercase` | Eyebrow tags (`PERSOONLIJK ROSTER`, `STATUS BESCHIKBAARHEID`) |
| **Metric / Number** | Inter | `22px`–`28px` | 700 / 800 | `tabular-nums` | Stats counters (`31.5`, `3`, `21:30 - 07:00`) |
| **Body Large** | Inter | `15px`–`16px` | 600 | `leading-snug` | Role names (`BAR`, `RUNNER`, `DEBRAS`) |
| **Body Regular** | Inter | `13px`–`14px` | 400 / 500 | `leading-relaxed` | Descriptions, shift guidelines, event summaries |
| **Caption / Meta** | Inter | `11px`–`12px` | 500 / 600 | `leading-normal` | Sub-labels, role availability notes |

---

## 4. BORDER RADIUS & CORNER SHAPING

LIEF Amsterdam strictly utilizes an organic, pill-forward, ultra-rounded physical geometry. Sharp rectangles are completely forbidden.

- **Pill / Fully Rounded (`rounded-full`, `9999px`)**:
  - Primary & secondary CTA buttons (`height: 48px` to `56px`)
  - Status badges, category pills, filter chips
  - Floating circular buttons & avatar frames
  - Navigation tab highlights
- **Outer Card Containers (`rounded-[28px]` / `rounded-3xl`)**:
  - Major event cards
  - Role selection cards
  - Summary metric overview cards
- **Inner Sub-containers (`rounded-[18px]` to `rounded-[20px]`)**:
  - Time/role sub-panels inside event cards
  - Alert notification banners
  - Input textareas

---

## 5. BUTTONS & INTERACTIVE CONTROLS

### 5.1 Primary Action CTA (Lime Pill with Circular Arrow)
- **Geometry**: `height: 52px`–`56px`, `border-radius: 9999px`, `width: 100%` on mobile.
- **Background**: `#C2F939` (Neon Lime).
- **Text**: `font-weight: 800`, `font-size: 13px`–`14px`, `uppercase`, `tracking-wider`, `#000000`.
- **Icon**: Pitch black circular badge (`w-9 h-9`, `#000000`) containing a white or lime right arrow (`→` or Lucide `ArrowRight`).
- **Shadow**: `shadow-[0_4px_16px_rgba(194,249,57,0.35)]` or crisp black drop shadow.

### 5.2 Secondary Action CTA (Jet Black Pill)
- **Geometry**: `height: 48px`–`52px`, `border-radius: 9999px`.
- **Background**: `#0A0A0A`.
- **Text**: `font-weight: 700`, `font-size: 13px`, `uppercase`, `tracking-wider`, `#FFFFFF`.
- **Optional trailing icon**: Checklist, external link, or bookmark icon.

### 5.3 Muted / Neutral Button
- **Geometry**: `height: 44px`, `border-radius: 9999px`.
- **Background**: `#E8DDFD` or `#FFFFFF`.
- **Text**: `#0A0A0A`, semi-bold.

### 5.4 Segmented Filter Bar
- **Pill track container**: Black or translucent dark purple pill (`#000000` or `#E2D3FF`), `p-1`.
- **Active pill**: Solid black (`#000000`) with lime/white text OR solid lime (`#C2F939`) with black text.
- **Inactive pill**: Transparent background with muted purple/white text.

---

## 6. CARDS & ELEVATION

### 6.1 Event Card Architecture
- **Outer Shell**: `bg-white`, `rounded-[28px]`, `p-5`, `shadow-[0_8px_30px_rgba(40,20,80,0.06)]`.
- **Header Asset**: 16:9 or 21:9 atmospheric industrial concert/lighting photo with rounded top inner corners (`rounded-[20px]`).
- **Event Identity**: Large editorial serif headline (`Playfair Display`), accompanied by calendar icon and formatted date.
- **Data Sub-panel**: `bg-[#F3EDFD]` rounded box displaying time range (`WERKTIJDEN`) and capacity (`BEZETTING`).
- **Footer Action**: Direct full-width primary CTA button.

### 6.2 Role Selection Card (Event Sign-up)
- **Default State**:
  - `bg-white`, `border: 2px solid transparent`, `rounded-[24px]`, `p-4`.
  - Icon in soft purple circular frame.
  - Role title (`font-bold`, uppercase).
  - Open spot pill (`2 OPEN` in `#C2F939`, or `3 OPEN` in peach).
- **Selected State (1e Voorkeur)**:
  - `border: 2px solid #C2F939` with glowing accent ring.
  - Attached Lime Badge: `★ 1e VOORKEUR` (`bg-[#C2F939]`, text `#000000`).
- **Selected State (2e Voorkeur)**:
  - Attached Black Badge: `⇄ 2e VOORKEUR` (`bg-[#0A0A0A]`, text `#FFFFFF`).
- **Disabled / Sold Out State ("VOL")**:
  - `bg-white/60`, muted text, `opacity: 0.6`.
  - Badge: `VOL (5/5)` (`bg-[#8C7FA2]`, text `#FFFFFF`).
  - Selection disallowed.

---

## 7. ICONOGRAPHY & GRAPHIC ACCENTS

### 7.1 Icon Style
- **Line Weight**: Consistent `1.75px` to `2px` stroke with soft rounded joints.
- **Visual Motif**:
  - LIEF Signature Outline Heart (`♡`)
  - Sparkle / Starburst (`✻` / `✦`)
  - QR Code scanner badge with lime accents
  - Industrial iconography: Beer mug/cocktail glass (Bar), Box/pallet (Runner), Broom/recycle (Debras), Smile/VIP (Hospitality), Wrench/FOH (Productie).

### 7.2 Header & Brand Mark
- **Wordmark**: `LIEF` in bold editorial serif, followed by the red/coral outline heart (`♡`), followed by a black pill badge `CREW`.

---

## 8. NAVIGATION SCHEMES

### 8.1 Mobile Navigation (Crew Employee)
- **Top App Bar**:
  - Left: `LIEF ♡ CREW` brand lockup.
  - Center/Right: Role Switcher toggle (`CREW` vs `MANAGER`) + Profile avatar with active green status dot.
- **Bottom Navigation Bar**:
  - Fixed dock at `bottom-4` with floating inset margins (`left-4 right-4`).
  - Background: Jet black (`#0A0A0A`), `rounded-full`, `h-16`, flex row with equal spacing.
  - Active Tab: Neon lime pill (`bg-[#C2F939]`, text `#000000`, `font-bold`), rounded pill enclosure.
  - Inactive Tab: White icon and label with muted opacity (`text-white/70`).
  - Badge Indicator: Red/orange numerical dot (`3`) for unread shifts/updates.

### 8.2 Desktop Navigation (Manager Dashboard)
- **Top Bar**: Persistent global header with event filter presets, manager notifications, shift export CTAs, and employee quick-search.
- **Tabbed Structure**: Split views between `Dashboard Overview`, `Event Detail Crew Grid`, and `Nieuw Event Aanmaken`.

---

## 9. RESPONSIVE BEHAVIOUR & DEVICE RULES

### 9.1 Mobile Rules (Max width: 430px, optimized for 390px)
- **Touch Targets**: Minimum `48px × 48px` tappable footprint for all buttons and role selection items.
- **Scroll Behavior**: Smooth single-column vertical flow with generous bottom padding (`pb-28`) so bottom app dock never obscures the primary CTA.
- **Thumb Reachability**: Primary action buttons positioned along the lower half of the screen.

### 9.2 Desktop Rules (Manager Desk: 1024px – 1440px+)
- **Two & Three Column Grids**:
  - Left: Event selector and high-level shift deficit KPI cards.
  - Right / Main: Detailed staffing roster grid (`Medewerker | Beschikbaar | 1e Keuze | 2e Keuze | Status`).
- **Data Density**: Compact row heights, instant inline dropdowns for role assignments (`Bar`, `Runner`, `Debras`, `Hospitality`), and color-coded status pills.

---

## 10. INTERACTION STATES

| Component | Default | Hover (Desktop) | Active / Press | Disabled |
| :--- | :--- | :--- | :--- | :--- |
| **Primary CTA** | `#C2F939`, arrow icon | `#AEEA29`, scale(1.01) | `#9BD61E`, scale(0.98) | `#E2E8F0`, muted text |
| **Secondary CTA** | `#0A0A0A`, text white | `#222222` | `#000000`, scale(0.98) | `#666666` |
| **Role Card** | White card, shadow-sm | Border `#CDB8F9` | Scale(0.99) | Opacity 50%, no click |
| **Availability Pill** | Soft lilac container | Lift shadow | Solid Lime (`Ja`) or Slate (`Nee`)| Muted |
| **Bottom Tab** | Transparent, white text| Text white, hover bg | Active lime pill container | — |

---

## 11. DO'S AND DON'TS

### DO:
- ✅ **DO** keep the signature soft lilac (`#CDB8F9`) as the primary background wash.
- ✅ **DO** use neon lime green (`#C2F939`) purposefully for actions, confirmations, and primary visual anchors.
- ✅ **DO** use Dutch copy with an upbeat, confident, informal nightlife tone (*"Lekker. Je staat op de lijst."*, *"Kies waar jij het liefst staat"*).
- ✅ **DO** maintain pill-shaped buttons (`rounded-full`) and generously rounded card corners (`rounded-3xl`).
- ✅ **DO** display staffing counts clearly with numerical clarity (e.g. `8 / 10 aangemeld • 2 OPEN`).

### DON'T:
- ❌ **DON'T** use corporate SaaS blues, teal, or clinical hospital slate themes.
- ❌ **DON'T** use sharp 90-degree rectangle corners on cards or buttons.
- ❌ **DON'T** use generic traffic-light red/yellow/green alerts; use LIEF-themed peach/salmon for open slots and lime for confirmed.
- ❌ **DON'T** bury key working hours in long text paragraphs; always isolate shift times (`21:30 – 07:00`) in high-contrast data tags.
- ❌ **DON'T** crowd mobile layouts without at least `16px`–`20px` lateral margin breathing room.

