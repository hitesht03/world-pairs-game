const Anthropic = require("@anthropic-ai/sdk");

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { c1, c2 } = JSON.parse(event.body);

    if (!c1 || !c2) {
      return { statusCode: 400, body: "Missing country names" };
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Generate a comparison dossier for two countries: "${c1}" and "${c2}".

Return ONLY a single valid JSON object (no markdown, no commentary, no code fences) with this EXACT structure:

{
  "country1": {
    "name": "${c1}",
    "nickname": "a short evocative epithet, e.g. 'Land of the Rising Sun'",
    "capital": "capital city",
    "population": "approximate population, e.g. '~125 million'",
    "language": "main official language(s)",
    "currency": "currency name",
    "overview": "2-3 sentence overview of geography, culture, and what makes it distinctive",
    "funFact": "one surprising or memorable fact"
  },
  "country2": { ... same shape for ${c2} ... },
  "relationship": {
    "summary": "3-4 sentence overview of how these two countries relate to each other today",
    "benefits": ["specific benefit 1","benefit 2","benefit 3","benefit 4"],
    "challenges": ["specific challenge 1","challenge 2","challenge 3","challenge 4"]
  },
  "quizzes": {
    "country1": [5 questions],
    "country2": [5 questions],
    "pair": [5 questions]
  }
}

Generate exactly 5 questions for each of the three quiz sections:
- "country1": 5 questions ONLY about ${c1}
- "country2": 5 questions ONLY about ${c2}
- "pair": 5 questions about both countries together

Mix difficulty within each section. Be factually accurate. Output ONLY the JSON.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let text = response.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "")
      .trim();
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a >= 0 && b > a) text = text.slice(a, b + 1);

    const data = JSON.parse(text);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate dossier",
        message: error.message,
      }),
    };
  }
};
