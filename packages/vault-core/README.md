# Vault Core

This package houses the interfaces & supporting code for Epicenter's upcoming adapter ecosystem.

> This spec is in alpha, and will likely change significantly in the near future. Breaking changes will occur up until the 1.0 release.

## Goal

The goal of the adapter system is two-fold.

1. Create a modular, extensible, centralized hub for your exported third-party data
2. Expose available tables/features/metadata for access via SQLite explorers, LLMs, MCP, and other tools

## Summary

Adapters are build on [Drizzle ORM](https://orm.drizzle.team/) and [ArkType](https://arktype.dev/). They expose:

- SQLite table schema for persisting data
  - Natural language mappings for tables and columns
- ArkType schema for data parsing
- Supporting parse and upsert functions

> Formal specs for standardizing adapter behavior and capabilities are forthcoming.

## Lifecycle

> This may change as drastically as we determine our requirements.

A core concept of adapters is modularity. Since we are relying on Drizzle for our schemas, we can easily add/remove/migrate tables at runtime, allowing for greater flexibility and adaptability to changing data requirements.

> It hasn't been decided yet how adapters can be added/removed, but we are considering options such as configuration files, admin interfaces, or programmatic APIs.

## Future Concerns

- Virtual tables via Drizzle
- Type-safety to prevent table-name collisions

## Status

- [x] Primitive interfaces
- [ ] Supporting code
- [ ] Finalized interfaces
