import { GoogleGenAI, Type } from '@google/genai';

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

export async function screenContent(text: string): Promise<ScreeningResult | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Reported content:\n"""\n${text}\n"""`,
      config: {
        systemInstruction: POLICY,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    return JSON.parse(response.text ?? '') as ScreeningResult;
  } catch (err) {
    console.error('Gemini screening failed:', err);
    return null;
  }
}
