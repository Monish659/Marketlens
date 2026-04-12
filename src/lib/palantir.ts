type PalantirConfig = {
  baseUrl: string;
  ontologyRid: string;
  apiLogicId: string;
  token: string;
};

export type PalantirMarketResearchInput = {
  industry: string;
  budget: number;
  goal: string;
  targetAudience: string;
};

export type PalantirMarketResearchResult = {
  guidance: string;
  raw: unknown;
};

function normalizeBaseUrl(input: string) {
  return input.endsWith('/') ? input.slice(0, -1) : input;
}

function getMissingConfigKeys() {
  const missing: string[] = [];
  if (!process.env.PALANTIR_BASE_URL) missing.push('PALANTIR_BASE_URL');
  if (!process.env.PALANTIR_ONTOLOGY_RID) missing.push('PALANTIR_ONTOLOGY_RID');
  if (!process.env.PALANTIR_API_LOGIC_ID) missing.push('PALANTIR_API_LOGIC_ID');
  if (!process.env.PALANTIR_TOKEN) missing.push('PALANTIR_TOKEN');
  return missing;
}

export function hasPalantirConfig() {
  return getMissingConfigKeys().length === 0;
}

function getPalantirConfig(): PalantirConfig {
  const missing = getMissingConfigKeys();
  if (missing.length > 0) {
    throw new Error(`Missing Palantir env vars: ${missing.join(', ')}`);
  }

  return {
    baseUrl: normalizeBaseUrl(process.env.PALANTIR_BASE_URL || ''),
    ontologyRid: process.env.PALANTIR_ONTOLOGY_RID || '',
    apiLogicId: process.env.PALANTIR_API_LOGIC_ID || '',
    token: process.env.PALANTIR_TOKEN || '',
  };
}

function parseGuidanceFromPalantirResponse(payload: any): string {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';

  const directCandidates = [
    payload.result,
    payload.value,
    payload.output,
    payload.response,
    payload.data,
    payload.text,
    payload.message,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  if (typeof payload.result === 'object' && payload.result) {
    const nested = parseGuidanceFromPalantirResponse(payload.result);
    if (nested) return nested;
  }

  if (Array.isArray(payload) && payload.length > 0) {
    const first = parseGuidanceFromPalantirResponse(payload[0]);
    if (first) return first;
  }

  return JSON.stringify(payload);
}

export async function runPalantirMarketResearch(
  input: PalantirMarketResearchInput,
  signal?: AbortSignal
): Promise<PalantirMarketResearchResult> {
  const config = getPalantirConfig();
  const url = `${config.baseUrl}/v2/ontologies/${config.ontologyRid}/queries/${config.apiLogicId}/execute`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
    signal,
  });

  const responseText = await response.text();
  const responseJson = responseText ? safeJsonParse(responseText) : null;

  if (!response.ok) {
    throw new Error(
      `Palantir query failed (${response.status}): ${responseText || response.statusText}`
    );
  }

  const guidance = parseGuidanceFromPalantirResponse(responseJson ?? responseText);
  if (!guidance.trim()) {
    throw new Error('Palantir query returned empty guidance');
  }

  return {
    guidance: guidance.trim(),
    raw: responseJson ?? responseText,
  };
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseBudgetToInteger(rawBudget?: string) {
  if (!rawBudget) return 10000;
  const numeric = Number(rawBudget.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return 10000;
  return Math.round(numeric);
}

function inferIndustry(idea: string) {
  const lower = idea.toLowerCase();
  if (/\b(fintech|bank|payments?|insurance|finance)\b/.test(lower)) return 'Finance';
  if (/\b(health|med|clinic|hospital|wellness|pharma)\b/.test(lower)) return 'Healthcare';
  if (/\b(auto|vehicle|car|ev|mobility)\b/.test(lower)) return 'Automotive';
  if (/\b(edtech|school|student|learning|course)\b/.test(lower)) return 'Education';
  if (/\b(saas|software|ai|app|platform|cloud|tech)\b/.test(lower)) return 'Technology';
  if (/\b(retail|ecommerce|commerce|shop|marketplace)\b/.test(lower)) return 'Retail';
  return 'General';
}

export function buildPalantirInputFromIdea(
  idea: string,
  constraints: {
    budget?: string;
    location?: string;
    riskTolerance?: 'low' | 'medium' | 'high';
    experience?: 'beginner' | 'intermediate' | 'expert';
    goToMarket?: 'online' | 'hybrid' | 'offline';
  }
): PalantirMarketResearchInput {
  return {
    industry: inferIndustry(idea),
    budget: parseBudgetToInteger(constraints.budget),
    goal: 'Validate market demand, objections, and launch readiness',
    targetAudience: `${constraints.location || 'Global'} | risk=${constraints.riskTolerance || 'medium'} | experience=${constraints.experience || 'intermediate'} | mode=${constraints.goToMarket || 'online'}`,
  };
}
