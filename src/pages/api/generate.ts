import type { NextApiRequest, NextApiResponse } from "next";
import z from "zod";
import OpenAI from "openai";
import parser from "cron-parser";

const generateRequestSchema = z.object({
  prompt: z.string(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

type GenerateResponse =
  | {
      success: true;
      result: string;
    }
  | {
      success: false;
    };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  const data = generateRequestSchema.parse(req.body);

  const response = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "Only respond with unix CRON expressions that fulfill the requirements",
      },
      {
        role: "user",
        content: data.prompt,
      },
    ],
  });

  const cron = response.choices[0].message.content || "";
  try {
    parser.parseExpression(cron);
  } catch (err) {
    return res.status(400).json({ success: false });
  }

  res.status(200).json({ success: true, result: cron });
}
