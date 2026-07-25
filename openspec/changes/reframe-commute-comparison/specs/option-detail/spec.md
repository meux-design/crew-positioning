## ADDED Requirements

### Requirement: Open Detail Without Leaving Comparison
The system SHALL open a detail view for any commute option without unmounting the comparison context.

#### Scenario: User opens award option
- **WHEN** the user activates an award option
- **THEN** a slide-over opens and the comparison remains mounted behind it

### Requirement: Type-Specific Detail Breakdown
The system SHALL show detail fields appropriate to the selected option type.

#### Scenario: User opens standby option
- **WHEN** the selected option is standby
- **THEN** the detail shows load inputs, clearance band explanation, timing, taxes, cabin, and seeded-data provenance

#### Scenario: User opens award option
- **WHEN** the selected option is award
- **THEN** the detail shows program, carrier, flight number, mileage cost, taxes, seats remaining, source freshness, timing, and cabin

### Requirement: Accessible Slide-Over Behavior
The system SHALL trap focus inside the detail slide-over while open, close on Escape, and restore focus to the opener on close.

#### Scenario: User closes detail with Escape
- **WHEN** the user presses Escape while the slide-over is open
- **THEN** the slide-over closes and focus returns to the option that opened it

### Requirement: Explain Ranking Factors
The system SHALL show the per-column ranking factors that placed the option where it appears.

#### Scenario: User opens cash fare detail
- **WHEN** the selected option is a cash fare
- **THEN** the detail explains arrival buffer, cost within cash options, cabin match, and any tight-buffer flag
