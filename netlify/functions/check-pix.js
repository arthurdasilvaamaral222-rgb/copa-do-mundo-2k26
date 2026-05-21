exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;

  if (!id) {
    return json(400, { error: "ID do pagamento ausente." });
  }

  if (!process.env.NEXUSPAG_API_KEY) {
    return json(500, { error: "Configure NEXUSPAG_API_KEY no Netlify." });
  }

  const driveLink =
    process.env.DRIVE_LINK ||
    "https://drive.google.com/drive/folders/10fc6V13bB7v9nA_2GWb-BuLP3FmKaS9K?usp=drive_link";

  try {
    const response = await fetch(`https://nexuspag.com/api/pix/${encodeURIComponent(id)}`, {
      headers: { "x-api-key": process.env.NEXUSPAG_API_KEY },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(response.status, {
        error: data.message || data.error || "Erro ao consultar pagamento.",
        details: data,
      });
    }

    const status = String(findStatus(data)).toLowerCase();
    const paid = ["paid", "approved", "confirmed", "completed", "payment.confirmed", "pago", "confirmado"].includes(status);

    return json(200, {
      paid,
      status,
      downloadUrl: paid ? driveLink : null,
    });
  } catch (error) {
    return json(500, { error: "Falha ao consultar pagamento.", details: error.message });
  }
};

function findStatus(data) {
  return (
    data.status ||
    data.payment_status ||
    data.pix_status ||
    data.event ||
    data.data?.status ||
    data.data?.payment_status ||
    data.data?.pix_status ||
    data.transaction?.status ||
    ""
  );
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}
