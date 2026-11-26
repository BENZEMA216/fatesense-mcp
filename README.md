<p align="center">
  <img src="https://fatesense.app/art/zhiming-icon-512.png" alt="FateSense Logo" width="84" height="84" />
</p>

<h1 align="center">FateSense MCP</h1>

<p align="center">
  <strong>Deterministic Eastern Metaphysics for AI Agents — Zero Calendar Hallucinations.</strong><br/>
  Astronomical Chinese BaZi (Four Pillars), Dual-Chart Compatibility, True-Lunar Zi Wei Dou Shu (12 Palaces), and Chinese Daily Almanac via Model Context Protocol (MCP).
</p>

<p align="center">
  <a href="https://glama.ai/mcp/servers/BENZEMA216/fatesense-mcp">
    <img width="380" height="200" src="https://glama.ai/mcp/servers/BENZEMA216/fatesense-mcp/badge" alt="fatesense-mcp MCP server" />
  </a>
</p>

<p align="center">

[![BENZEMA216/fatesense-mcp MCP server](https://glama.ai/mcp/servers/BENZEMA216/fatesense-mcp/badges/score.svg)](https://glama.ai/mcp/servers/BENZEMA216/fatesense-mcp)

</p>

<p align="center">
  <a href="https://fatesense.app">Live Web Tools (Zero Login)</a> ·
  <a href="https://fatesense.app/tools/bazi-calculator">BaZi Calculator</a> ·
  <a href="https://fatesense.app/tools/bazi-compatibility">BaZi Compatibility</a> ·
  <a href="https://fatesense.app/tools/zi-wei-birth-chart">Zi Wei 12 Palaces</a> ·
  <a href="https://fatesense.app/methodology">Methodology</a> ·
  <a href="https://fatesense.app/llms.txt">llms.txt</a>
</p>

---

## Why FateSense MCP?

Ask any frontier LLM to compute a Chinese BaZi (Four Pillars of Destiny) or Zi Wei Dou Shu birth chart from a Gregorian birthday, and it will confidently hallucinate the **Day Pillar** (Sexagenary cycle math), miss the exact astronomical **24 Solar Term (*Jieqi*)** cutoff for the Month Pillar, or misplace the lunar **14 Major Stars**.

**FateSense MCP** separates **deterministic astronomical computation** from **AI interpretation**, running auditable MIT open-source calendar engines locally:

- [`tyme4ts`](https://github.com/6tail/tyme4ts) (MIT) — exact 24 Solar Terms, True Solar Time (longitude + Spencer Equation of Time), Early/Late Zi-Hour (`23:00–00:00`) day-boundary switching, Hidden Stems (*Cang Gan*), Ten Gods (*Shi Shen*), NaYin, 12 Growth Stages, and 8 Decadal Luck Pillars (*Da Yun*).
- [`iztro`](https://github.com/SylarLong/iztro) (MIT) — true-lunar Zi Wei Dou Shu 12 Palaces, Five Elements Bureau, 14 Major Stars, Temple-to-Challenged brightness, and Four Transformations (*Si Hua*).

> Prefer a zero-install browser experience? Every tool runs free with zero login at **[fatesense.app](https://fatesense.app)** (English & Traditional Chinese).

---

## Available MCP Tools (5)

| Tool | Engine | What It Computes |
| :--- | :--- | :--- |
| `calculate_bazi_chart` | `tyme4ts` | Exact Four Pillars, True Solar Time correction, Early/Late Zi-Hour switch, Hidden Stems, Ten Gods, NaYin, Void branches, and 8 Decadal Luck Pillars |
| `calculate_bazi_compatibility` | `tyme4ts` | Dual-chart comparison checking Classical Five-Stem Unions (`天干五合`), Spouse Palace Six-Harmony / Six-Clash, and combined Five-Element balance |
| `calculate_ziwei_astrolabe` | `iztro` | True-lunar Zi Wei Dou Shu 12 Palaces, Five Elements Bureau, Life/Body Master, 14 Major Stars, brightness levels, and Four Transformations |
| `get_daily_almanac` | `tyme4ts` | Chinese Daily Almanac (*Huangli / Tong Shu*): lunar date, Solar Term, Twelve Duty Officers, 28 Lunar Mansions, and traditional Yi/Ji activities |
| `lookup_fatesense_knowledge` | `fatesense.app` | Canonical links into FateSense's 450+ page bilingual reference library (60 Jiazi Day Pillars, 10 Gods, 64 I Ching Hexagrams, 60 Fortune Sticks, `/methodology`, `/llms.txt`) |

---

## Quick Start (Claude Desktop / Cursor / Windsurf)

### 1. Clone & Install

```bash
git clone https://github.com/BENZEMA216/fatesense-mcp.git
cd fatesense-mcp
npm install
npm test
```

### 2. Add to Claude Desktop (`claude_desktop_config.json`) or Cursor (`mcp.json`)

```json
{
  "mcpServers": {
    "fatesense": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/fatesense-mcp/index.js"]
    }
  }
}
```

### 3. Example Prompts to Try in Claude / Cursor

- *"Calculate my BaZi Four Pillars for 1997-08-18 at 10:30 AM in Taipei (longitude 121.56, UTC+8) using True Solar Time, and explain my Day Master and current Decadal Luck Pillar."*
- *"Compare BaZi compatibility between 2000-11-20 (15:30) and 1996-05-01 (10:00) using classical stem combinations and Spouse Palace harmony."*
- *"Generate a true-lunar Zi Wei Dou Shu 12 Palaces astrolabe for 1995-03-24 (time index 5, male) in English."*
- *"Check today's Chinese Daily Almanac (Huangli) auspicious and avoid activities."*

---

## Live Bilingual Web Platform & Open Knowledge Base

Every deterministic tool in this MCP server is paired with a free, zero-login web interface and deep bilingual reference pages on **[fatesense.app](https://fatesense.app)**:

- **Pro BaZi Calculator**: https://fatesense.app/tools/bazi-calculator ([繁體中文](https://fatesense.app/zh-tw/tools/bazi-calculator))
- **Free BaZi Compatibility**: https://fatesense.app/tools/bazi-compatibility ([繁體中文](https://fatesense.app/zh-tw/tools/bazi-compatibility))
- **True-Lunar Zi Wei 12 Palaces**: https://fatesense.app/tools/zi-wei-birth-chart ([繁體中文](https://fatesense.app/zh-tw/tools/zi-wei-birth-chart))
- **Chinese Daily Almanac**: https://fatesense.app/tools/daily-almanac ([繁體中文](https://fatesense.app/zh-tw/tools/daily-almanac))
- **60 Jiazi Fortune Sticks**: https://fatesense.app/tools/daily-fortune-stick
- **3-Coin I Ching Oracle (64 Hexagrams)**: https://fatesense.app/tools/i-ching-reading
- **Algorithm & Classical Provenance**: https://fatesense.app/methodology
- **Machine-Readable Site Index**: https://fatesense.app/llms.txt

---

## Honesty & Non-Deterministic Boundaries

FateSense treats BaZi, Zi Wei Dou Shu, I Ching, and Chinese Almanacs as traditional cultural frameworks for self-reflection and structured dialogue—never as medical, legal, financial, or deterministic life guarantees.

## License

MIT © [FateSense (知命)](https://fatesense.app) — Built with gratitude on [`tyme4ts`](https://github.com/6tail/tyme4ts) and [`iztro`](https://github.com/SylarLong/iztro).
