## ADDED Requirements

### Requirement: Save Commute
The system SHALL let a demo user save a commute definition with label, origin, destination, cabin, seat count, buffer minutes, and standby profile defaults.

#### Scenario: Save completed commute
- **WHEN** the user saves a completed commute comparison with a label
- **THEN** the saved commute appears in the saved commutes list

### Requirement: Re-run Commute
The system SHALL let the user re-run a saved commute against current award availability and current seeded/manual inputs.

#### Scenario: Re-run saved commute
- **WHEN** the user activates a saved commute
- **THEN** the system runs a new comparison and updates the saved commute last-run timestamp

### Requirement: Delete Commute
The system SHALL let the user delete a saved commute after confirmation.

#### Scenario: Delete saved commute
- **WHEN** the user confirms deletion of a saved commute
- **THEN** the commute is removed from the saved list and is not offered for re-run

### Requirement: Demo User Scope
The system SHALL scope saved commutes to the seeded demo user in v1.

#### Scenario: Direct access to another user's commute
- **WHEN** a saved commute identifier outside the demo user's scope is requested
- **THEN** the system returns not found and does not disclose its existence
