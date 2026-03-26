# Lithuanian Law MCP Server

**The e-Seimas alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Flithuanian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/lithuanian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Lithuanian-law-mcp?style=social)](https://github.com/Ansvar-Systems/Lithuanian-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Lithuanian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Lithuanian-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/Lithuanian-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/Lithuanian-law-mcp/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](docs/EU_INTEGRATION_GUIDE.md)
[![Provisions](https://img.shields.io/badge/provisions-89%2C705-blue)](docs/EU_INTEGRATION_GUIDE.md)

Query **12,045 Lithuanian statutes** -- from the Asmens duomenų teisinės apsaugos įstatymas and Baudžiamasis kodeksas to the Civilinis kodeksas, Darbo kodeksas, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Lithuanian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Lithuanian legal research is scattered across e-Seimas, TAR (Teisės aktų registras), and EUR-Lex. Whether you're:
- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking if a statute is still in force
- A **legal tech developer** building tools on Lithuanian law
- A **researcher** tracing legislative provisions across 12,045 statutes

...you shouldn't need dozens of browser tabs and manual cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Lithuanian law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://lithuanian-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add lithuanian-law --transport http https://lithuanian-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lithuanian-law": {
      "type": "url",
      "url": "https://lithuanian-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "lithuanian-law": {
      "type": "http",
      "url": "https://lithuanian-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/lithuanian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "lithuanian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/lithuanian-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"Ieškoti 'asmens duomenų apsauga' -- kokias pareigas nustato ADTAĮ?"*
- *"Ar Baudžiamojo kodekso 196 straipsnis vis dar galioja?"*
- *"Rask nuostatas apie darbuotojų apsaugą Darbo kodekse"*
- *"Kokie ES teisės aktai įgyvendinti per Civilinį kodeksą?"*
- *"Kurie Lietuvos įstatymai įgyvendina BDAR?"*
- *"Patikrink nuorodą: DK 38 str. 1 d."*
- *"Pateik teisinę poziciją dėl duomenų apsaugos pažeidimų pagal ADTAĮ"*
- *"Ar Lietuvos kibernetinio saugumo įstatymas atitinka NIS2?"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes** | 12,045 statutes | Comprehensive Lithuanian legislation from TAR |
| **Provisions** | 89,705 sections | Full-text searchable with FTS5 |
| **EU Cross-References** | Included | Directives and regulations linked to Lithuanian law |
| **Database Size** | 262 MB | Optimized SQLite, portable |
| **Daily Updates** | Automated | Freshness checks against TAR (e-tar.lt) |

**Verified data only** -- every citation is validated against official sources (TAR, e-Seimas). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from TAR (Teisės aktų registras) official sources
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains regulation text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by statute number + article/section
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
TAR API → Parse → SQLite → FTS5 snippet() → MCP response
            ↑                     ↑
     Provision parser      Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search e-Seimas by statute number | Search by plain Lithuanian: *"asmens duomenys sutikimas"* |
| Navigate multi-chapter statutes manually | Get the exact provision with context |
| Manual cross-referencing between laws | `build_legal_stance` aggregates across sources |
| "Is this statute still in force?" → check manually | `check_currency` tool → answer in seconds |
| Find EU basis → dig through EUR-Lex | `get_eu_basis` → linked EU directives instantly |
| Check multiple sites for updates | Daily automated freshness checks |
| No API, no integration | MCP protocol → AI-native |

**Traditional:** Search TAR → Download PDF → Ctrl+F → Cross-reference with other statutes → Check EUR-Lex for EU basis → Repeat

**This MCP:** *"Kokie ES teisės aktai yra ADTAĮ 3 str. pagrindas?"* → Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 89,705 provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by statute identifier + article/section |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple statutes for a legal topic |
| `format_citation` | Format citations per Lithuanian conventions (full/short/pinpoint) |
| `check_currency` | Check if statute is in force, amended, or repealed |
| `list_sources` | List all available statutes with metadata and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### EU Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations that underpin a Lithuanian statute |
| `get_lithuanian_implementations` | Find Lithuanian laws implementing a specific EU act |
| `search_eu_implementations` | Search EU documents with Lithuanian implementation counts |
| `get_provision_eu_basis` | Get EU law references for a specific provision |
| `validate_eu_compliance` | Check implementation status of Lithuanian statutes against EU directives |

---

## EU Law Integration

Lithuania is an EU member state. Lithuanian legislation directly transposes EU directives and implements EU regulations, creating a tight mapping between Lithuanian and EU law.

Key areas of EU-Lithuanian law alignment:

- **GDPR (2016/679)** -- implemented via the Asmens duomenų teisinės apsaugos įstatymas (ADTAĮ, Law No. XI-1374)
- **NIS2 Directive (2022/2555)** -- implemented via the Kibernetinio saugumo įstatymas
- **eIDAS Regulation (910/2014)** -- applicable directly; supplemented by national e-signature rules
- **DORA (2022/2554)** -- financial sector digital resilience obligations
- **AI Act (2024/1689)** -- EU regulation applicable directly across all member states

The EU bridge tools provide bi-directional lookup: find which Lithuanian statutes implement a given EU act, or find which EU acts underpin a given Lithuanian provision.

| Metric | Value |
|--------|-------|
| **EU Member State** | Since 2004 |
| **Legal System** | Civil law (continental European tradition) |
| **Official Gazette** | TAR (Teisės aktų registras) |
| **EUR-Lex Integration** | Automated metadata fetching |

See [EU_INTEGRATION_GUIDE.md](docs/EU_INTEGRATION_GUIDE.md) for detailed documentation.

---

## Data Sources & Freshness

All content is sourced from authoritative Lithuanian legal databases:

- **[TAR](https://www.e-tar.lt/)** -- Teisės aktų registras (Register of Legal Acts), the official Lithuanian legal database
- **[e-Seimas](https://e-seimas.lrs.lt/)** -- Lietuvos Respublikos Seimas (Lithuanian Parliament) legislative database
- **[EUR-Lex](https://eur-lex.europa.eu/)** -- Official EU law database (metadata only)

### Automated Freshness Checks (Daily)

A [daily GitHub Actions workflow](.github/workflows/check-updates.yml) monitors all data sources:

| Source | Check | Method |
|--------|-------|--------|
| **Statute amendments** | TAR API date comparison | All 12,045 statutes checked |
| **New statutes** | TAR publications (90-day window) | Diffed against database |
| **EU reference staleness** | Git commit timestamps | Flagged if >90 days old |

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Docker Security** | Container image scanning + SBOM generation | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **OSSF Scorecard** | OpenSSF best practices scoring | Weekly |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official TAR/e-Seimas publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Verify critical citations** against primary sources for court filings
> - **EU cross-references** are extracted from Lithuanian statute text, not EUR-Lex full text
> - **Always confirm** current in-force status via TAR before relying on a provision professionally

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [PRIVACY.md](PRIVACY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. See [PRIVACY.md](PRIVACY.md) for Lietuvos advokatūra (Lithuanian Bar Association) compliance guidance.

---

## Documentation

- **[EU Integration Guide](docs/EU_INTEGRATION_GUIDE.md)** -- Detailed EU cross-reference documentation
- **[EU Usage Examples](docs/EU_USAGE_EXAMPLES.md)** -- Practical EU lookup examples
- **[Security Policy](SECURITY.md)** -- Vulnerability reporting and scanning details
- **[Disclaimer](DISCLAIMER.md)** -- Legal disclaimers and professional use notices
- **[Privacy](PRIVACY.md)** -- Client confidentiality and data handling

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Lithuanian-law-mcp
cd Lithuanian-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest              # Ingest statutes from TAR
npm run build:db            # Rebuild SQLite database
npm run check-updates       # Check for amendments and new statutes
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** 262 MB (comprehensive corpus)
- **Reliability:** 100% ingestion success rate

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### @ansvar/lithuanian-law-mcp (This Project)
**Query 12,045 Lithuanian statutes directly from Claude** -- ADTAĮ, BK, CK, DK, and more. Full provision text with EU cross-references. `npx @ansvar/lithuanian-law-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

**70+ national law MCPs** covering Australia, Brazil, Canada, Denmark, Finland, France, Germany, Greece, Hungary, Iceland, Ireland, Latvia, Netherlands, Norway, Poland, Sweden, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- EU Regulations MCP integration (full EU law text, CJEU case law)
- Historical statute versions and amendment tracking
- Constitutional Court (Konstitucinis Teismas) case law expansion
- Administrative court decisions

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (12,045 statutes, 89,705 provisions)
- [x] EU law integration tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [x] Daily freshness checks
- [ ] Case law expansion (Supreme Court, Constitutional Court)
- [ ] Historical statute versions (amendment tracking)
- [ ] English translations for key statutes

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{lithuanian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Lithuanian Law MCP Server: Production-Grade Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Lithuanian-law-mcp},
  note = {Comprehensive Lithuanian legal database with 12,045 statutes and 89,705 provisions}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Lithuanian Government / TAR (public domain)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the European market. This MCP server started as our internal reference tool for Lithuanian law -- turns out everyone building for the Baltic market has the same research frustrations.

So we're open-sourcing it. Navigating 12,045 statutes shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
