const crypto = require("node:crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  if (process.env.NEXUSPAG_WEBHOOK_SECRET) {
    const signature = event.headers["x-nexuspag-signature"];
    const timestamp = event.headers["x-nexuspag-timestamp"];
    const expected = crypto
      .createHmac("sha256", process.env.NEXUSPAG_WEBHOOK_SECRET)
      .update(`${timestamp}.${event.body}`)
      .digest("hex");

    if (!signature || signature !== expected) {
      return json(401, { error: "Assinatura inválida." });
    }
  }

  return json(200, { received: true });
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}
