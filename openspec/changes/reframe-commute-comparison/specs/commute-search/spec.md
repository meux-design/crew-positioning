## ADDED Requirements

### Requirement: Commute Search Inputs
The system SHALL accept origin, destination, departure window, arrive-before report deadline, minimum report-time buffer, cabin, seat count, and crew standby profile inputs for a commute search.

#### Scenario: Submit complete commute search
- **WHEN** a user submits valid route, deadline, buffer, cabin, seat count, onload category, and seniority inputs
- **THEN** the system accepts the request and starts a commute comparison search

#### Scenario: Reject impossible deadline
- **WHEN** a user submits an arrive-before deadline earlier than the departure window start
- **THEN** the system rejects the request with a field-associated validation error

### Requirement: Shared Boundary Validation
The system SHALL validate commute search input with one shared Zod schema at client and server boundaries.

#### Scenario: Server receives invalid seat count
- **WHEN** the API receives a commute search with `seatCount` outside 1 through 4
- **THEN** the API returns an invalid-input error without calling seats.aero

### Requirement: Arrival Deadline Hard Filter
The system SHALL exclude every option that arrives after the arrive-before deadline.

#### Scenario: Option arrives after report deadline
- **WHEN** a standby, staff fare, cash, or award option arrives after `arriveBefore`
- **THEN** the option is absent from the comparison response

### Requirement: Buffer Flag
The system SHALL flag, not hide, options that arrive before the deadline but inside the user's minimum buffer.

#### Scenario: Option lands inside buffer
- **WHEN** an option arrives before `arriveBefore` but with less than `bufferMinutes` slack
- **THEN** the option remains visible and is labelled as tight

### Requirement: Partial Comparison State
The system SHALL distinguish a partially populated comparison from an error when some columns have no data because user-entered values are missing.

#### Scenario: Manual fares absent
- **WHEN** standby and award data exist but no staff fare or cash fare has been entered
- **THEN** the comparison shows populated standby and award columns and prompts for manual fare entry in the empty manual columns
