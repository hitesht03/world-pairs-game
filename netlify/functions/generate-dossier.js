exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { c1, c2 } = JSON.parse(event.body);

    if (!c1 || !c2) {
      return { statusCode: 400, body: "Missing country names" };
    }

    const prompt = `Generate a comparison dossier for two countries: "${c1}" and "${c2}".

Return ONLY a single valid JSON object (no markdown, no commentary, no code fences) with this EXACT structure:

{
  "country1": {
    "name": "${c1}",
    "nickname": "a short evocative epithet",
    "capital": "capital city",
    "population": "approximate population",
    "language": "main official language(s)",
    "currency": "currency name",
    "overview": "2-3 sentence overview",
    "funFact": "one surprising fact"
  },
  "country2": {
    "name": "${c2}",
    "nickname": "a short evocative epithet",
    "capital": "capital city",
    "population": "approximate population",
    "language": "main official language(s)",
    "currency": "currency name",
    "overview": "2-3 sentence overview",
    "funFact": "one surprising fact"
  },
  "relationship": {
    "summary": "3-4 sentence overview of how these two countries relate",
    "benefits": ["benefit 1","benefit 2","benefit 3","benefit 4"],
    "challenges": ["challenge 1","challenge 2","challenge 3","challenge 4"]
  },
  "quizzes": {
    "country1": [
      {"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
    ],
    "country2": [
      {"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
    ],
    "pair": [
      {"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
    ]
  }
}

Generate exactly 5 questions per quiz section. Be factually accurate. Output ONLY the JSON.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("API error:", response.status, errText);
      return { statusCode: 502, body: "API call failed: " + response.status };
    }

    const apiData = await response.json();
    let text = apiData.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a >= 0 && b > a) text = text.slice(a, b + 1);

    const data = JSON.parse(text);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed", message: error.message })
    };
  }
};
