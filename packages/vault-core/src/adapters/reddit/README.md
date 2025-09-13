# Reddit Adapter

This serves as a test-bench for our first integration test for Epicenter's adapter system.

> Once the spec is determined and implemented, this documentation will be replaced with an official README.

## Implementation Details

This takes in a GDPR-compliant export, available only from the [Reddit website](https://www.reddit.com/settings/data-request).

> As of writing, Reddit only allows you to export data once every ~30 days(?). Please be cognizant of this when testing the adapter.

The zip file is processed directly in-memory, and the contained CSV files are then parsed and validated against a schema.

### Dev

To migrate:

- `cd` project directory
- `bun run migrate`
