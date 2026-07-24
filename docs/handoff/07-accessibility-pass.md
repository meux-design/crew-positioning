# Unit 07: Accessibility pass

Read `CONTEXT.md` first. This file specifies one unit only.

**Prerequisite:** Unit 06 complete.

## Intent

Audit the whole application against §10 and remediate. This is a distinct unit, not a step folded into earlier ones.

## Requirements

1. The system shall meet WCAG 2.0 AA across every surface.
2. The system shall score at least 95 on Lighthouse accessibility for search and results.
3. The system shall convey no state through colour alone.
4. The system shall present all interactive targets at 44×44px or larger.
5. The system shall be fully operable by keyboard on every surface.
6. The system shall associate every form error with its input programmatically.

## Scenarios

**Given** any availability state indicator
**When** rendered in greyscale
**Then** its meaning remains distinguishable by icon or text

**Given** a keyboard-only user
**When** they traverse search, results, detail, and saved searches
**Then** every action is reachable and every focus stop visible

**Given** an invalid form submission
**When** a screen reader reaches the field
**Then** the error is announced as part of the field's description

## Tasks

1. Verify every §9 contrast pair with a checker; correct any failures and update the token table
2. Run automated audits on every route
3. Full manual keyboard traverse; log every trap or dead end
4. Screen reader pass on all primary flows
5. Verify touch target sizes at 375px
6. Remediate findings
7. Re-run audits and record final scores in the README

## Out of scope

New features of any kind. If the audit surfaces a design flaw needing a new capability, log it as future work rather than building it.

## On completion

Append to `PROGRESS.md`: what was built, what was skipped and why, anything unresolved, and what the next session needs to know.
