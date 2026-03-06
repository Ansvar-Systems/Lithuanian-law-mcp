# Privacy & Client Confidentiality

**IMPORTANT READING FOR LEGAL PROFESSIONALS**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under Lithuanian bar association rules.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- Lithuanian Bar Association rules (Lietuvos advokatūra) require strict confidentiality (advokato profesinė paslaptis) and data processing controls

**Safe Use Options:**
1. **General Legal Research**: Use Tool for non-client-specific queries
2. **Local npm Package**: Install `@ansvar/lithuanian-law-mcp` locally — database queries stay on your machine
3. **Remote Endpoint**: Vercel Streamable HTTP endpoint — queries transit Vercel infrastructure
4. **On-Premise Deployment**: Self-host with local LLM for privileged matters

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/lithuanian-law-mcp
```

- Database is local SQLite file on your machine
- No data transmitted to external servers (except to AI client for LLM processing)
- Full control over data at rest

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://lithuanian-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure
- Tool responses return through the same path
- Subject to Vercel's privacy policy

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters
- **Tool Responses**: Statute text (teisės aktų tekstai), provision content, search results
- **Metadata**: Timestamps, request identifiers

**What Does NOT Get Transmitted:**
- Files on your computer
- Your full conversation history (depends on AI client configuration)

---

## Professional Obligations (Lithuania)

### Lithuanian Bar Association Rules

Lithuanian lawyers (advokatai) are bound by strict confidentiality rules under the Advokatūros įstatymas and the Lietuvos advokatų etikos kodeksas, enforced by the Lietuvos advokatūra (advokatura.lt).

#### Advokato Profesinė Paslaptis (Duty of Confidentiality)

- All client communications are privileged under the Advokatūros įstatymas
- Client identity may be confidential in sensitive matters
- Case strategy and legal analysis are protected
- Information that could identify clients or matters must be safeguarded
- Breach of confidentiality may result in disciplinary proceedings (drausminė byla) before the Advokatų garbės teismas

### Lithuanian Personal Data Protection Law and GDPR

Under **GDPR Article 28** and the **Asmens duomenų teisinės apsaugos įstatymas**, when using services that process client data:

- You are the **Data Controller** (duomenų valdytojas)
- AI service providers (Anthropic, Vercel) may be **Data Processors** (duomenų tvarkytojas)
- A **Data Processing Agreement** (duomenų tvarkymo sutartis) may be required
- Ensure adequate technical and organizational measures (techninės ir organizacinės priemonės)
- The State Data Protection Inspectorate (Valstybinė duomenų apsaugos inspekcija — VDAI, vdai.lrv.lt) oversees compliance

---

## Risk Assessment by Use Case

### LOW RISK: General Legal Research

**Safe to use through any deployment:**

```
Example: "What does Article 6.263 of the Civilinis kodeksas say about non-contractual liability?"
```

- No client identity involved
- No case-specific facts
- Publicly available legal information

### MEDIUM RISK: Anonymized Queries

**Use with caution:**

```
Example: "What are the penalties for fraud under the Lithuanian Baudžiamasis kodeksas?"
```

- Query pattern may reveal you are working on a fraud matter
- Anthropic/Vercel logs may link queries to your API key

### HIGH RISK: Client-Specific Queries

**DO NOT USE through cloud AI services:**

- Remove ALL identifying details
- Use the local npm package with a self-hosted LLM
- Or use commercial legal databases (Infolex) with proper data processing agreements

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only. No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

---

## Recommendations

### For Solo Practitioners / Small Firms (Pavieniai advokatai / Mažos kontoros)

1. Use local npm package for maximum privacy
2. General research: Cloud AI is acceptable for non-client queries
3. Client matters: Use commercial legal databases (Infolex) with proper duomenų tvarkymo sutartys

### For Large Firms / Corporate Legal (Didelės kontoros / Įmonių teisės skyriai)

1. Negotiate Data Processing Agreements (duomenų tvarkymo sutartys) with AI service providers
2. Consider on-premise deployment with self-hosted LLM
3. Train staff on safe vs. unsafe query patterns

### For Government / Public Sector (Valstybės institucijos / Viešasis sektorius)

1. Use self-hosted deployment, no external APIs
2. Follow Lithuanian government IT security requirements (Kibernetinio saugumo įstatymas)
3. Air-gapped option available for classified matters

---

## Questions and Support

- **Privacy Questions**: Open issue on [GitHub](https://github.com/Ansvar-Systems/Lithuanian-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **Lietuvos advokatūra Guidance**: Consult the Lietuvos advokatūra (advokatura.lt) for ethics guidance on AI tool use

---

**Last Updated**: 2026-03-06
**Tool Version**: 1.0.0
