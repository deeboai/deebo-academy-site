import "server-only";

import { env } from "@/lib/env";

type PlacementScoringInput = {
  subject: string;
  gradeBand: string | null;
  topic: string;
  question: string;
  rubric: string;
  studentResponse: string;
};

type PlacementScoringResult = {
  score: number;
  confidence: "low" | "medium" | "high";
  feedback: string;
  missing_concepts: string[];
  recommended_next_topic: string;
};

export async function scorePlacementFreeResponse(
  input: PlacementScoringInput,
): Promise<PlacementScoringResult | null> {
  if (!env.openAiApiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Score the student's free response against the rubric. Return only valid JSON with keys score, confidence, feedback, missing_concepts, and recommended_next_topic.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                subject: input.subject,
                grade_band: input.gradeBand,
                topic: input.topic,
                question: input.question,
                rubric: input.rubric,
                student_response: input.studentResponse,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "placement_score",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              score: { type: "number" },
              confidence: { type: "string", enum: ["low", "medium", "high"] },
              feedback: { type: "string" },
              missing_concepts: {
                type: "array",
                items: { type: "string" },
              },
              recommended_next_topic: { type: "string" },
            },
            required: [
              "score",
              "confidence",
              "feedback",
              "missing_concepts",
              "recommended_next_topic",
            ],
          },
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenAI scoring request failed with ${response.status}.`);
  }

  const payload = await response.json();
  const outputText =
    payload.output?.[0]?.content?.find((item: { type: string }) => item.type === "output_text")
      ?.text ?? payload.output_text;

  if (!outputText) {
    return null;
  }

  return JSON.parse(outputText) as PlacementScoringResult;
}
