exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  if (!process.env.NEXUSPAG_API_KEY) {
    return json(500, { error: "Configure NEXUSPAG_API_KEY no Netlify." });
  }

  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || "";
  const externalId = `pack-copa-2026-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const webhookUrl = siteUrl ? `${siteUrl}/.netlify/functions/nexuspag-webhook` : undefined;

  try {
    const response = await fetch("https://nexuspag.com/api/pix/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXUSPAG_API_KEY,
      },
      body: JSON.stringify({
        amount: Number(process.env.PRODUCT_PRICE || "5.99"),
        description: "Pack Digital de Figurinhas Copa 2026",
        external_id: externalId,
        ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(response.status, {
        error: data.message || data.error || "Erro ao criar cobrança Pix na NexusPag.",
        details: data,
      });
    }

    return json(200, data);
  } catch (error) {
    return json(500, { error: "Falha ao conectar com a NexusPag.", details: error.message });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}
