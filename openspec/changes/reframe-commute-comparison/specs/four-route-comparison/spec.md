## ADDED Requirements

### Requirement: Four Route Columns
The system SHALL present commute options in separate staff standby, staff confirmed fare, cash fare, and award redemption columns.

#### Scenario: Comparison loads with all option types
- **WHEN** the system returns options for all four route types
- **THEN** the UI displays each type in its own labelled column

### Requirement: Independent Column Ranking
The system SHALL rank options independently within each column and MUST NOT compute a single cross-column score.

#### Scenario: Cash fare cheaper than award option
- **WHEN** a cash option costs less than an award option's taxes
- **THEN** the system does not rank the cash option above the award option across columns

### Requirement: Certainty Labels
The system SHALL label every option as confirmed, speculative, expired, or seeded-estimated using text and an icon, not color alone.

#### Scenario: Standby option appears beside confirmed fare
- **WHEN** a standby option and a staff confirmed fare appear in the comparison
- **THEN** the standby option is labelled as standby/speculative and the staff fare is labelled as confirmed

### Requirement: Mobile Column Navigation
The system SHALL use a mobile-friendly segmented control to navigate option columns on 375px viewports.

#### Scenario: User views comparison on mobile
- **WHEN** the comparison is rendered at a 375px viewport
- **THEN** one column is active at a time and the user can switch columns with accessible controls

### Requirement: Column Provenance
The system SHALL show the source of data for each column.

#### Scenario: Award and standby columns render
- **WHEN** award and standby columns are visible
- **THEN** award data is labelled as seats.aero sourced and standby data is labelled as seeded demo data
