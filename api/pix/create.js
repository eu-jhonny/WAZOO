/**
 * Vercel Serverless Function — cria uma cobrança PIX no Mercado Pago.
 *
 * Gera o QR Code / "copia e cola" SEM redirecionar para a tela do MP.
 * A chave secreta (MP_ACCESS_TOKEN) fica só no servidor, nunca no navegador.
 *
 * Requer a variável de ambiente (Vercel → Settings → Environment Variables):
 *   MP_ACCESS_TOKEN = APP_USR-...  (Mercado Pago → Suas integrações → Credenciais)
 *
 * Sem a variável, responde 501 e o front cai no PIX estático (manual).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(501).json({ error: "not_configured" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const amount = Math.round(Number(body.amount) * 100) / 100;
    const payerEmail = (body.payerEmail || "").trim() || "cliente@wazoo.com";
    const description = (body.description || "Pedido Wazoo Pet Express").slice(0, 120);
    const txid = (body.txid || "wazoo").toString();

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "invalid_amount" });
    }

    const [firstName, ...rest] = (body.payerName || "Cliente Wazoo").split(" ");

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${txid}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description,
        payment_method_id: "pix",
        payer: {
          email: payerEmail,
          first_name: firstName || "Cliente",
          last_name: rest.join(" ") || "Wazoo",
        },
      }),
    });

    const data = await mpRes.json();
    if (!mpRes.ok) {
      return res.status(502).json({ error: "provider_error", detail: data?.message || data });
    }

    const tx = (data.point_of_interaction && data.point_of_interaction.transaction_data) || {};
    return res.status(200).json({
      id: String(data.id),
      status: data.status, // "pending" no início
      copiaECola: tx.qr_code || "",
      qrBase64: tx.qr_code_base64 || "",
      ticketUrl: tx.ticket_url || "",
    });
  } catch (err) {
    return res.status(500).json({ error: "server_error" });
  }
}
