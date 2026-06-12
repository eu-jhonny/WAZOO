/**
 * Vercel Serverless Function — consulta o status de um pagamento PIX no
 * Mercado Pago. O front faz polling aqui até o status virar "approved".
 *
 * GET /api/pix/status?id=<paymentId>
 * Resposta: { status, paid }
 */
export default async function handler(req, res) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(501).json({ error: "not_configured" });
  }

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: "missing_id" });
  }

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: "provider_error" });
    }
    const status = data.status; // approved | pending | rejected | cancelled ...
    return res.status(200).json({
      status,
      paid: status === "approved",
    });
  } catch (err) {
    return res.status(500).json({ error: "server_error" });
  }
}
