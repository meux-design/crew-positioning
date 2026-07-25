## ADDED Requirements

### Requirement: Domain Framing Copy
The system SHALL describe Reposition as a self-funded commuting/subload decision tool rather than airline-directed deadheading software.

#### Scenario: User reads README
- **WHEN** the README explains the product problem
- **THEN** it distinguishes personal crew commuting from airline-directed space-positive deadheading

### Requirement: Competitive Landscape
The system SHALL document the adjacent incumbent products and the product gap Reposition addresses.

#### Scenario: Reviewer reads case-study positioning
- **WHEN** the README discusses market context
- **THEN** it names StaffTraveler, Staff Airlines, and FlyStandby as load-focused incumbents and positions Reposition as a decision tool

### Requirement: Award Role Honesty
The system SHALL explain that seats.aero award availability is one supporting route, not the whole product.

#### Scenario: User reads award source note
- **WHEN** award results are shown or documented
- **THEN** the app states that award data comes from seats.aero and may be cached

### Requirement: Seeded Load Limitation
The system SHALL state that standby load data is seeded demo data in v1 and not live airline-system data.

#### Scenario: User sees standby data
- **WHEN** standby load figures appear in the UI or README
- **THEN** they are labelled as seeded demo data and no live airline data claim is made

### Requirement: No Cross-Column Score Rationale
The system SHALL document why standby, cash, staff fare, and award options are not combined into one score.

#### Scenario: Reviewer reads tradeoffs
- **WHEN** the README explains ranking
- **THEN** it states that points, cash, and standby risk are ranked within columns because cross-column conversion requires personal assumptions
