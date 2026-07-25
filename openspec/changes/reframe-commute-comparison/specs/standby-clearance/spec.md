## ADDED Requirements

### Requirement: Seeded Standby Options
The system SHALL generate staff standby options from seeded demo load data in v1.

#### Scenario: Seeded route has load data
- **WHEN** a commute search matches a seeded route and date window
- **THEN** the standby column includes options from seeded load records

### Requirement: Clearance Band Derivation
The system SHALL derive `LIKELY`, `UNCERTAIN`, or `UNLIKELY` clearance bands from seats capacity, seats booked, non-revs listed, onload category, and seniority input.

#### Scenario: More seats than non-revs ahead
- **WHEN** seats likely open comfortably exceeds adjusted non-revs ahead
- **THEN** the standby option receives a `LIKELY` clearance band

#### Scenario: Fewer seats than non-revs ahead
- **WHEN** adjusted non-revs ahead exceeds likely open seats
- **THEN** the standby option receives an `UNLIKELY` clearance band

### Requirement: Clearance Explanation
The system SHALL expose the load inputs used to derive the clearance band.

#### Scenario: User opens standby detail
- **WHEN** the user opens a standby option detail
- **THEN** the detail shows seats capacity, seats booked, seats likely open, non-revs listed, adjusted non-revs ahead, onload category, and seniority input

### Requirement: No Probability Claims
The system MUST NOT display standby clearance as a numeric probability or percentage.

#### Scenario: Standby band is likely
- **WHEN** a standby option has a `LIKELY` clearance band
- **THEN** the UI displays the band and explanation without a percentage probability

### Requirement: Seeded Data Notice
The system SHALL show a persistent seeded-data notice wherever standby load data appears.

#### Scenario: Standby column renders
- **WHEN** any seeded standby option is visible
- **THEN** the UI shows a non-dismissible label stating that load figures are demo data
