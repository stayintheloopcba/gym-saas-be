# google-oauth Specification

## Purpose

Google OAuth sign-in: consent initiation, callback authentication with user provisioning/linking, and post-login redirect to the frontend.

## Requirements

### Requirement: Google sign-in initiation
The system SHALL expose `GET /auth/google` that redirects the client to Google's OAuth consent screen using the configured `GOOGLE_CLIENT_ID` and `GOOGLE_CALLBACK_URL`.

#### Scenario: Start Google flow
- **WHEN** a client navigates to `GET /auth/google`
- **THEN** the system redirects to Google's OAuth authorization URL requesting the email and profile scopes

### Requirement: Google callback authentication
The system SHALL expose `GET /auth/google/callback` that exchanges the Google authorization code, then provisions or links a `User` and issues the same session cookies as local login.

#### Scenario: New Google user
- **WHEN** the callback receives a valid Google profile whose email and Google id match no existing user
- **THEN** a `GOOGLE` user is created with the profile's email, name, and Google id, and session cookies are set

#### Scenario: Returning Google user
- **WHEN** the callback receives a valid Google profile whose Google id matches an existing user
- **THEN** no new user is created and session cookies are set for that user

#### Scenario: Existing local account with same email
- **WHEN** the callback receives a Google profile whose email matches an existing `LOCAL` user that has no Google id
- **THEN** the system links the Google id to that existing user and sets session cookies

#### Scenario: Failed or denied authorization
- **WHEN** the callback receives an error or denied consent from Google
- **THEN** the system responds with an unauthorized error and sets no cookies

### Requirement: Post-login redirect
After a successful Google callback the system SHALL redirect the client to the frontend using `FRONTEND_URL`, relying on the session cookies for the authenticated session.

#### Scenario: Redirect to frontend after Google login
- **WHEN** the Google callback succeeds and sets cookies
- **THEN** the client is redirected to the configured frontend URL
