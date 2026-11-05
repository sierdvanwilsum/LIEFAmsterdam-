# LIEF Crew Planner

## Project goal

Build an internal crew planning application for LIEF Amsterdam.

Employees mainly use the application on mobile to:
- view upcoming events
- indicate availability
- select a preferred role
- register for events
- view confirmed shifts

Event managers mainly use the application on desktop to:
- create events
- specify required crew per role
- view employee registrations
- assign employees to roles
- identify understaffed roles
- confirm the final crew planning

## Design instructions

Before creating or changing any UI:
- Always read `DESIGN.md`.
- Use the screenshots in `design-references/` as visual references.
- Treat `DESIGN.md` as the main visual source of truth.
- Preserve the LIEF Amsterdam visual identity.
- Do not replace the design with generic SaaS dashboard styling.
- Do not redesign approved Stitch screens unless specifically requested.

Employee interfaces must be mobile-first.

Manager interfaces must be optimized for desktop while remaining responsive.

All visible interface copy must be Dutch.

## Development approach

Build incrementally.

Start with frontend and mock data.

Do not add Supabase, authentication, APIs or other backend functionality unless specifically requested.

Reuse existing components where possible.

Do not remove existing working functionality when implementing a new feature.

Inspect the existing project before making large structural changes.

## Visual quality

Match the Stitch designs as closely as possible.

Pay particular attention to:
- typography
- spacing
- colours
- button shapes
- layout proportions
- hierarchy
- mobile responsiveness
- interaction states

If there is a conflict between generic UI conventions and the approved LIEF design, prefer the approved LIEF design unless it causes a usability or accessibility problem.