#!/usr/bin/env node
/**
 * FateSense MCP Server (https://fatesense.app/mcp)
 * Deterministic Chinese BaZi, Compatibility, Zi Wei Dou Shu & Daily Almanac for AI Agents.
 * Powered by MIT open-source astronomical engines: tyme4ts + iztro.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ChildLimit,
  Gender,
  LunarSect2EightCharProvider,
  SolarDay,
  SolarTime,
} from "tyme4ts";
import { astro } from "iztro";

const STEM_ELEMENT = {
  甲: "Wood (Yang)", 乙: "Wood (Yin)",
  丙: "Fire (Yang)", 丁: "Fire (Yin)",
  戊: "Earth (Yang)", 己: "Earth (Yin)",
  庚: "Metal (Yang)", 辛: "Metal (Yin)",
  壬: "Water (Yang)", 癸: "Water (Yin)",
};

const STEM_EL_KEY = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

const BRANCH_EL_KEY = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood",
  辰: "earth", 巳: "fire", 午: "fire", 未: "earth",
  申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

const STEM_PINYIN = {
  甲: "jia", 乙: "yi", 丙: "bing", 丁: "ding", 戊: "wu",
  己: "ji", 庚: "geng", 辛: "xin", 壬: "ren", 癸: "gui",
};

const BRANCH_PINYIN = {
  子: "zi", 丑: "chou", 寅: "yin", 卯: "mao", 辰: "chen", 巳: "si",
  午: "wu", 未: "wei", 申: "shen", 酉: "you", 戌: "xu", 亥: "hai",
};

const FIVE_STEM_UNIONS = {
  甲己: "Jia-Ji Upright Union (Earth)", 己甲: "Jia-Ji Upright Union (Earth)",
  乙庚: "Yi-Geng Loyal Union (Metal)", 庚乙: "Yi-Geng Loyal Union (Metal)",
  丙辛: "Bing-Xin Magnetic Union (Water)", 辛丙: "Bing-Xin Magnetic Union (Water)",
  丁壬: "Ding-Ren Inspired Union (Wood)", 壬丁: "Ding-Ren Inspired Union (Wood)",
  戊癸: "Wu-Gui Alchemy Union (Fire)", 癸戊: "Wu-Gui Alchemy Union (Fire)",
};

const SIX_HARMONY = new Set(["子丑", "丑子", "寅亥", "亥寅", "卯戌", "戌卯", "辰酉", "酉辰", "巳申", "申巳", "午未", "未午"]);
const SIX_CLASH = new Set(["子午", "午子", "丑未", "未丑", "寅申", "申寅", "卯酉", "酉卯", "辰戌", "戌辰", "巳亥", "亥巳"]);

function spencerEquationOfTimeMinutes(year, month, day) {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.floor((current - start) / 86400000) + 1;
  const B = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(B) -
      0.032077 * Math.sin(B) -
      0.014615 * Math.cos(2 * B) -
      0.040849 * Math.sin(2 * B))
  );
}

function applyTrueSolarTime(year, month, day, hour, minute, longitude, tzOffsetHours) {
  const standardMeridian = tzOffsetHours * 15;
  const lonOffsetMin = (longitude - standardMeridian) * 4;
  const eotMin = spencerEquationOfTimeMinutes(year, month, day);
  const totalDeltaMin = Math.round(lonOffsetMin + eotMin);
  const adjustedMs = Date.UTC(year, month - 1, day, hour, minute, 0) + totalDeltaMin * 60000;
  const d = new Date(adjustedMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    correctionMinutes: totalDeltaMin,
  };
}

function buildBaziJson({ birthDate, birthTime = "12:00", gender = "female", ziHourMode = "early_split", longitude, tzOffsetHours }) {
  const [y, m, d] = birthDate.split("-").map(Number);
  const [hh, mm] = birthTime.split(":").map(Number);
  let eff = { year: y, month: m, day: d, hour: hh || 12, minute: mm || 0, correctionMinutes: 0 };

  if (typeof longitude === "number" && typeof tzOffsetHours === "number") {
    eff = applyTrueSolarTime(y, m, d, hh || 12, mm || 0, longitude, tzOffsetHours);
  }

  const solarTime = SolarTime.fromYmdHms(eff.year, eff.month, eff.day, eff.hour, eff.minute, 0);
  const lunarHour = solarTime.getLunarHour();
  const ec =
    ziHourMode === "late_same_day"
      ? new LunarSect2EightCharProvider().getEightChar(lunarHour)
      : lunarHour.getEightChar();

  const dayStem = ec.getDay().getHeavenStem();
  const formatPillar = (sc, isDay = false) => {
    const stem = sc.getHeavenStem();
    const branch = sc.getEarthBranch();
    const hidden = [
      { stem: branch.getHideHeavenStemMain(), role: "Main" },
      { stem: branch.getHideHeavenStemMiddle(), role: "Middle" },
      { stem: branch.getHideHeavenStemResidual(), role: "Residual" },
    ]
      .filter((h) => Boolean(h.stem))
      .map((h) => ({
        stem: h.stem.getName(),
        role: h.role,
        tenGod: dayStem.getTenStar(h.stem).getName(),
      }));

    return {
      ganZhi: sc.getName(),
      slug: `${STEM_PINYIN[stem.getName()]}-${BRANCH_PINYIN[branch.getName()]}`,
      stem: stem.getName(),
      branch: branch.getName(),
      tenGod: isDay ? "日主 (Day Master)" : dayStem.getTenStar(stem).getName(),
      nayin: sc.getSound().getName(),
      lifeStage: dayStem.getTerrain(branch).getName(),
      hiddenStems: hidden,
    };
  };

  const pillars = {
    year: formatPillar(ec.getYear()),
    month: formatPillar(ec.getMonth()),
    day: formatPillar(ec.getDay(), true),
    hour: formatPillar(ec.getHour()),
  };

  const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of Object.values(pillars)) {
    elements[STEM_EL_KEY[p.stem]] += 1;
    elements[BRANCH_EL_KEY[p.branch]] += 1;
  }

  const childLimit = ChildLimit.fromSolarTime(
    solarTime,
    gender === "male" ? Gender.MAN : Gender.WOMAN
  );
  const decadalLuck = [];
  let df = childLimit.getStartDecadeFortune();
  for (let i = 0; i < 8; i++) {
    const sc = df.getSixtyCycle();
    decadalLuck.push({
      ganZhi: sc.getName(),
      startAge: df.getStartAge(),
      endAge: df.getEndAge(),
      startYear: df.getStartSixtyCycleYear().getYear(),
      tenGod: dayStem.getTenStar(sc.getHeavenStem()).getName(),
      nayin: sc.getSound().getName(),
    });
    df = df.next(1);
  }

  return {
    engine: "tyme4ts (MIT)",
    input: { birthDate, birthTime, gender, ziHourMode, trueSolarCorrectionMinutes: eff.correctionMinutes },
    lunarDate: lunarHour.getLunarDay().toString(),
    solarTerm: solarTime.getSolarDay().getTerm().getName(),
    dayMaster: {
      stem: pillars.day.stem,
      element: STEM_ELEMENT[pillars.day.stem],
      dayPillar: pillars.day.ganZhi,
      guideUrl: `https://fatesense.app/guides/pillars/${pillars.day.slug}`,
    },
    pillars,
    fiveElementsCount: elements,
    voidBranches: ec.getDay().getExtraEarthBranches().map((b) => b.getName()).join(""),
    decadalLuck,
    interactiveChartUrl: `https://fatesense.app/tools/bazi-calculator?date=${birthDate}&time=${birthTime}&gender=${gender}`,
    methodologyUrl: "https://fatesense.app/methodology",
  };
}

const server = new McpServer({
  name: "fatesense-mcp",
  version: "1.0.0",
});

// 1. Pro BaZi Calculator
server.tool(
  "calculate_bazi_chart",
  "Calculate a deterministic Chinese BaZi (Four Pillars of Destiny) birth chart with exact astronomical 24 Solar Terms, optional True Solar Time, Early/Late Zi-Hour switch, Hidden Stems, Ten Gods, NaYin, and 8 Decadal Luck Pillars.",
  {
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Gregorian birth date YYYY-MM-DD"),
    birthTime: z.string().regex(/^\d{2}:\d{2}$/).default("12:00").describe("Local 24h time HH:MM"),
    gender: z.enum(["male", "female"]).default("female").describe("Gender for Decadal Luck direction"),
    ziHourMode: z.enum(["early_split", "late_same_day"]).default("early_split").describe("Zi-Hour (23:00-00:00) day boundary school"),
    longitude: z.number().optional().describe("Optional birth city longitude (e.g. 121.56 for Taipei, -74.0 for NYC) for True Solar Time"),
    tzOffsetHours: z.number().optional().describe("Optional standard timezone offset in hours (e.g. 8, -5) required when longitude is set"),
  },
  async (args) => ({
    content: [{ type: "text", text: JSON.stringify(buildBaziJson(args), null, 2) }],
  })
);

// 2. Dual-Chart BaZi Compatibility
server.tool(
  "calculate_bazi_compatibility",
  "Compare two birth charts deterministically using Classical Five-Stem Combinations, Day Branch Spouse Palace harmonies/clashes, and combined Five-Element complementarity.",
  {
    personADate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Person A birth date YYYY-MM-DD"),
    personATime: z.string().regex(/^\d{2}:\d{2}$/).default("12:00"),
    personBDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Person B birth date YYYY-MM-DD"),
    personBTime: z.string().regex(/^\d{2}:\d{2}$/).default("12:00"),
  },
  async ({ personADate, personATime, personBDate, personBTime }) => {
    const a = buildBaziJson({ birthDate: personADate, birthTime: personATime });
    const b = buildBaziJson({ birthDate: personBDate, birthTime: personBTime });
    const stemPair = `${a.pillars.day.stem}${b.pillars.day.stem}`;
    const branchPair = `${a.pillars.day.branch}${b.pillars.day.branch}`;
    const combined = {};
    for (const el of ["wood", "fire", "earth", "metal", "water"]) {
      combined[el] = a.fiveElementsCount[el] + b.fiveElementsCount[el];
    }

    const res = {
      personA: { dayPillar: a.pillars.day.ganZhi, dayMaster: a.dayMaster.element, nayin: a.pillars.day.nayin },
      personB: { dayPillar: b.pillars.day.ganZhi, dayMaster: b.dayMaster.element, nayin: b.pillars.day.nayin },
      classicalStemRelation: FIVE_STEM_UNIONS[stemPair] || `${STEM_EL_KEY[a.pillars.day.stem]} × ${STEM_EL_KEY[b.pillars.day.stem]}`,
      spousePalaceRelation: SIX_HARMONY.has(branchPair)
        ? `Six-Harmony (${branchPair})`
        : SIX_CLASH.has(branchPair)
          ? `Six-Clash (${branchPair} — contrasting rhythms, growth friction)`
          : `Balanced (${branchPair})`,
      combinedFiveElements: combined,
      interactiveCompatibilityUrl: `https://fatesense.app/tools/bazi-compatibility?aDate=${personADate}&aHour=${personATime.slice(0, 2)}&bDate=${personBDate}&bHour=${personBTime.slice(0, 2)}`,
    };
    return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
  }
);

// 3. True-Lunar Zi Wei Dou Shu 12 Palaces
server.tool(
  "calculate_ziwei_astrolabe",
  "Calculate a true-lunar Zi Wei Dou Shu (Purple Star Astrology) 12 Palaces astrolabe via iztro including Five Elements Bureau, 14 Major Stars, brightness, and Four Transformations.",
  {
    solarDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Gregorian birth date YYYY-MM-DD"),
    timeIndex: z.number().int().min(0).max(12).default(6).describe("Chinese double-hour index 0 (Early Zi) through 12 (Late Zi), default 6 (Wu 11:00-13:00)"),
    gender: z.enum(["male", "female"]).default("female"),
    locale: z.enum(["en-US", "zh-TW", "zh-CN"]).default("en-US"),
  },
  async ({ solarDate, timeIndex, gender, locale }) => {
    const astrolabe = astro.bySolar(solarDate, timeIndex, gender, true, locale);
    const summary = {
      engine: "iztro (MIT)",
      solarDate: astrolabe.solarDate,
      lunarDate: astrolabe.lunarDate,
      chineseDate: astrolabe.chineseDate,
      fiveElementsClass: astrolabe.fiveElementsClass,
      soulMaster: astrolabe.soul,
      bodyMaster: astrolabe.body,
      palaces: astrolabe.palaces.map((p) => ({
        name: p.name,
        isBodyPalace: p.isBodyPalace,
        stemBranch: `${p.heavenlyStem}${p.earthlyBranch}`,
        majorStars: p.majorStars.map((s) => ({
          name: s.name,
          brightness: s.brightness || null,
          mutagen: s.mutagen || null,
        })),
        decadalAges: p.decadal?.range || null,
      })),
      interactiveChartUrl: "https://fatesense.app/tools/zi-wei-birth-chart",
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

// 4. Chinese Daily Almanac (Huangli / Tong Shu)
server.tool(
  "get_daily_almanac",
  "Get deterministic Chinese Daily Almanac (Huangli / Tong Shu) data for any Gregorian date: lunar date, stem-branch pillars, 24 Solar Terms, Twelve Duty Officers, and traditional Yi/Ji activities.",
  {
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Gregorian date YYYY-MM-DD"),
  },
  async ({ date }) => {
    const [y, m, d] = date.split("-").map(Number);
    const solarDay = SolarDay.fromYmd(y, m, d);
    const lunarDay = solarDay.getLunarDay();
    const res = {
      engine: "tyme4ts (MIT)",
      solarDate: date,
      lunarDate: lunarDay.toString(),
      solarTerm: solarDay.getTerm().getName(),
      sixtyCycleDay: lunarDay.getSixtyCycle().getName(),
      dutyOfficer: lunarDay.getDuty().getName(),
      twentyEightStar: lunarDay.getTwentyEightStar().getName(),
      auspiciousYi: lunarDay.getRecommends().map((t) => t.getName()),
      avoidJi: lunarDay.getAvoids().map((t) => t.getName()),
      interactiveAlmanacUrl: "https://fatesense.app/tools/daily-almanac",
    };
    return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
  }
);

// 5. FateSense Knowledge Index
server.tool(
  "lookup_fatesense_knowledge",
  "Return canonical FateSense bilingual encyclopedia URLs for 60 Jiazi Day Pillars, 10 Gods, 120-chapter Qiong Tong Bao Jian Classics, 2027 Chinese Zodiac, 64 I Ching Hexagrams, 60 Fortune Sticks, methodology, and llms.txt.",
  {
    topic: z
      .enum([
        "overview",
        "methodology",
        "classics",
        "zodiac-2027",
        "pillars",
        "ten-gods",
        "i-ching",
        "fortune-sticks",
        "gta6",
      ])
      .default("overview"),
    slug: z
      .string()
      .optional()
      .describe(
        "Optional item slug, e.g. 'ren-wu', 'qi-sha', 'jia-yin', 'ox', '31-xian-influence'"
      ),
  },
  async ({ topic, slug }) => {
    const base = "https://fatesense.app";
    const urls = {
      overview: `${base}/llms.txt`,
      methodology: `${base}/methodology`,
      classics: slug
        ? `${base}/classics/qiong-tong-bao-jian/${slug}`
        : `${base}/classics/qiong-tong-bao-jian`,
      "zodiac-2027": slug
        ? `${base}/guides/2027-chinese-zodiac/${slug}`
        : `${base}/guides/2027-chinese-zodiac`,
      pillars: slug ? `${base}/guides/pillars/${slug}` : `${base}/guides#sixty-pillars`,
      "ten-gods": slug ? `${base}/guides/ten-gods/${slug}` : `${base}/guides#ten-gods`,
      "i-ching": slug ? `${base}/guides/i-ching/${slug}` : `${base}/guides#hexagrams`,
      "fortune-sticks": slug ? `${base}/guides/fortune-sticks/${slug}` : `${base}/guides#fortune-sticks`,
      gta6: slug ? `${base}/guides/gta6-characters/${slug}` : `${base}/guides/gta6-characters`,
    };
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          brand: "FateSense (知命)",
          canonicalUrl: urls[topic],
          llmsIndex: `${base}/llms.txt`,
          freeWebTools: {
            bazi: `${base}/tools/bazi-calculator`,
            compatibility: `${base}/tools/bazi-compatibility`,
            ziWei: `${base}/tools/zi-wei-birth-chart`,
            almanac: `${base}/tools/daily-almanac`,
            fortuneSticks: `${base}/tools/daily-fortune-stick`,
            iChing: `${base}/tools/i-ching-reading`,
          },
        }, null, 2),
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
