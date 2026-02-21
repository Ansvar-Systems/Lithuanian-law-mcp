# Lithuanian Law MCP

[![npm](https://img.shields.io/npm/v/@ansvar/lithuanian-law-mcp)](https://www.npmjs.com/package/@ansvar/lithuanian-law-mcp)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/Ansvar-Systems/Lithuanian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Lithuanian-law-mcp/actions/workflows/ci.yml)

A Model Context Protocol (MCP) server providing access to Lithuanian legislation covering data protection, cybersecurity, e-commerce, and criminal law provisions.

**MCP Registry:** `eu.ansvar/lithuanian-law-mcp`
**npm:** `@ansvar/lithuanian-law-mcp`

## Quick Start

### Claude Desktop / Cursor (stdio)

```json
{
  "mcpServers": {
    "lithuanian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/lithuanian-law-mcp"]
    }
  }
}
```

### Remote (Streamable HTTP)

```
lithuanian-law-mcp.vercel.app/mcp
```

## Data Sources

| Source | Authority | License |
|--------|-----------|---------|
| [TAR (Teisės aktų registras)](https://www.e-tar.lt) | Seimas of the Republic of Lithuania | Lithuanian Government Open Data (public domain under Lithuanian Copyright Law Art. 5) |

> Full provenance: [`sources.yml`](./sources.yml)

## Tools

| Tool | Description |
|------|-------------|
| `search_legislation` | Full-text search across provisions |
| `get_provision` | Retrieve specific article/section |
| `validate_citation` | Validate legal citation |
| `check_currency` | Check if statute is in force |
| `get_eu_basis` | EU legal basis cross-references |
| `get_lithuanian_implementations` | National EU implementations |
| `search_eu_implementations` | Search EU documents |
| `validate_eu_compliance` | EU compliance check |
| `build_legal_stance` | Comprehensive legal research |
| `format_citation` | Citation formatting |
| `list_sources` | Data provenance |
| `about` | Server metadata |

## License

Apache-2.0
