import { GoogleGenAI, Type } from '@google/genai';
import { ReportStatus, TargetType, ReportReason } from '../db/generated/enums';
import { prisma } from '../db/index.js';
import { getDownloadUrl } from './s3.js';
import type { Db } from './jobQueue.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CATEGORIES = [
  'ILLEGAL',
  'SEXUAL_CONTENT',
  'HATE_OR_DISCRIMINATION',
  'GRAPHIC_OR_OBSCENE',
  'SOLICITATION',
  'SPAM',
  'HARASSMENT',
  'PRIVACY_VIOLATION',
  'NONE',
] as const;

const POLICY = `You are a content-moderation screener for Bart, a community bartering app.
  Classify the reported content against the community Code of Conduct:
  - ILLEGAL: stolen goods, prohibited weapons, or anything illegal under applicable law (zero tolerance)
  - SEXUAL_CONTENT: pornographic, sexually explicit, or mature content, including links to it
  - HATE_OR_DISCRIMINATION: racist, sexist, bigoted, or otherwise discriminatory content
  - GRAPHIC_OR_OBSCENE: shockingly graphic, grotesque, or obscene content
  - SOLICITATION: explicit commercial promotion of a product or service (bartering goods/services is the app's purpose and is NOT
  solicitation)
  - SPAM: repetitive posting, irrelevant self-promotion, misuse of features to draw attention to an account
  - HARASSMENT: targeted abuse, threats, or unsafe behavior toward another member
  - PRIVACY_VIOLATION: exposing someone else's personal information
  - NONE: no violation

  Score is your confidence (0 to 1) that the content violates the Code of Conduct at all.
  Ordinary barter posts describing goods or services honestly should score near 0.
  Be strict about ILLEGAL content. Keep the rationale to one or two sentences.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    categories: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: [...CATEGORIES] },
    },
    rationale: { type: Type.STRING },
  },
  required: ['score', 'categories', 'rationale'],
};

export interface ScreeningResult {
  score: number;
  categories: string[];
  rationale: string;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

// Gemini takes text and images in one multimodal call
export async function screenContent(
  text: string,
  images: { mimeType: string; data: string }[] = [],
): Promise<ScreeningResult | null> {
  // For testing without running up requests
  if (process.env.SKIP_SCREENING === 'true') return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          { text: `Reported content:\n"""\n${text}\n"""` },
          ...images.map((img) => ({ inlineData: img })),
        ],
        config: {
          systemInstruction: POLICY,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
      return JSON.parse(response.text ?? '') as ScreeningResult;
    } catch (err) {
      console.error(
        `Gemini screening failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        err,
      );
      // eslint-disable-next-line no-await-in-loop
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  // Still fail-open after retries exhausted
  // Unscreened content gets approved and the submitter gets a toast
  return null;
}

export const AUTO_REMOVE_THRESHOLD = 0.85;
export const AUTO_DISMISS_CATEGORIES = 0.15;
const ZERO_TOLERANCE_CATEGORIES = ['ILLEGAL'];

export interface AutoAction {
  status: typeof ReportStatus.APPROVED | typeof ReportStatus.REMOVED;
  resolution: string;
}

export function decideAutoAction(
  screening: ScreeningResult,
): AutoAction | null {
  if (screening.categories.some((c) => ZERO_TOLERANCE_CATEGORIES.includes(c))) {
    return {
      status: ReportStatus.REMOVED,
      resolution: `Auto-removed: zero-tolerance category (${screening.categories.join(',')})`,
    };
  }
  if (screening.score >= AUTO_REMOVE_THRESHOLD) {
    return {
      status: ReportStatus.REMOVED,
      resolution: `Auto-removed: high-confidence violation (score ${screening.score.toFixed(2)})`,
    };
  }
  if (screening.score <= AUTO_DISMISS_CATEGORIES) {
    return {
      status: ReportStatus.APPROVED,
      resolution: `Auto-dismissed: low-confidence (score ${screening.score.toFixed(2)})`,
    };
  }
  return null; // Ambiguous/middle-confidence band, leave as 'PENDING' for human review
}

export type ScreenOutcome =
  | { ok: true; screened: boolean }
  | { ok: false; rationale: string };

// Content moderation gate for all user-generated text (posts, offers, edits)
export async function screenOrReject(text: string): Promise<ScreenOutcome> {
  const screening = await screenContent(text);
  if (!screening) return { ok: true, screened: false };

  const action = decideAutoAction(screening);
  if (action?.status === ReportStatus.REMOVED) {
    return { ok: false, rationale: screening.rationale };
  }

  return { ok: true, screened: true };
}

function guessMimeType(s3Key: string): string {
  if (s3Key.endsWith('.png')) return 'image/png';
  if (s3Key.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function fetchAsBase64(
  s3Key: string,
): Promise<{ mimeType: string; data: string }> {
  const url = await getDownloadUrl(s3Key);
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType: guessMimeType(s3Key), data: buf.toString('base64') };
}

let systemUserId: number | null = null;
export async function getSystemUserId(): Promise<number> {
  if (systemUserId) return systemUserId;
  const sysUser = await prisma.user.findFirstOrThrow({
    where: { isSystem: true },
  });
  systemUserId = sysUser.id;
  return systemUserId;
}

export const REPORT_FK_FIELD: Record<string, string> = {
  POST: 'postId',
  USER: 'targetUserId',
  MESSAGE: 'messageId',
  TRADE_OFFER: 'offerId',
  REVIEW: 'reviewId',
  TRADE_REQUEST: 'tradeRequestId',
};

interface FileSystemReportInput {
  db: Db;
  targetType: TargetType;
  targetId: number;
  reporterId: number;
  status: typeof ReportStatus.REMOVED | typeof ReportStatus.PENDING;
  resolution: string;
  screening?: ScreeningResult;
}

// db is the job processor's transaction client when filing alongside a REMOVED row-flip,
// or the bare prisma client when filing a PENDING pipeline-failure report from failJob
export async function fileSystemReport(input: FileSystemReportInput): Promise<void> {
  const {
    db, targetType, targetId, reporterId, status, resolution, screening,
  } = input;
  await db.report.create({
    data: {
      reporterId,
      targetType,
      [REPORT_FK_FIELD[targetType]]: targetId,
      reason: ReportReason.AUTO_SCREENING,
      aiScore: screening?.score ?? null,
      aiCategories: screening?.categories ?? [],
      aiRationale: screening?.rationale ?? null,
      status,
      resolution,
      resolvedAt: status === ReportStatus.REMOVED ? new Date() : null,
    },
  });
}
