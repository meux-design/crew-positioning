## ADDED Requirements

### Requirement: Staff Fare Entry
The system SHALL let the user enter staff confirmed fare options with fare amount, currency, optional carrier and flight number, departure and arrival times, cabin, booking deadline, and note.

#### Scenario: Add valid staff fare
- **WHEN** the user submits a complete staff fare option
- **THEN** the staff fare column includes the option with user-entered provenance

### Requirement: Cash Fare Entry
The system SHALL let the user enter cash fare options with fare amount, currency, optional carrier and flight number, departure and arrival times, cabin, and note.

#### Scenario: Add valid cash fare
- **WHEN** the user submits a complete cash fare option
- **THEN** the cash fare column includes the option with user-entered provenance

### Requirement: Booking Deadline Expiry
The system SHALL show staff fare options whose `bookByAt` deadline has passed as expired rather than silently dropping them.

#### Scenario: Staff fare booking window has closed
- **WHEN** a staff fare option has a `bookByAt` value earlier than the search run time
- **THEN** the option remains visible and is labelled expired

### Requirement: Manual Data Provenance
The system SHALL distinguish user-entered manual fare data from live or seeded data.

#### Scenario: Manual cash fare appears
- **WHEN** a user-entered cash fare appears in the comparison
- **THEN** the option is labelled as user-entered

### Requirement: Manual Fare Validation
The system SHALL validate manual fare amounts, currencies, times, cabin, and booking deadlines before including them in comparison results.

#### Scenario: Manual fare arrives too late
- **WHEN** a user-entered fare arrives after the arrive-before deadline
- **THEN** the option is excluded and the UI explains that it missed the deadline
