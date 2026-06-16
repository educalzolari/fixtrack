module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { plan, userId, email } = req.body || {};
  const PRICES = { mensual: 18000, anual: 198000 };
  const price = PRICES[plan];
  if (!price || !userId) return res.status(400).json({ error: 'Datos inválidos' });

  const base = process.env.APP_URL || 'https://fixtrack-omega.vercel.app';

  const body = {
    items: [{
      id: `1fixtrack-pro-${plan}`,
      title: plan === 'anual' ? '1FixTrack Pro — Anual' : '1FixTrack Pro — Mensual',
      quantity: 1,
      unit_price: price,
      currency_id: 'ARS'
    }],
    payer: { email: email || undefined },
    external_reference: `${userId}|${plan}`,
    back_urls: {
      success: `${base}/configuracion.html?paid=ok&plan=${plan}`,
      failure: `${base}/configuracion.html?paid=fail`,
      pending: `${base}/configuracion.html?paid=pending`
    },
    auto_return: 'approved',
    notification_url: `${base}/api/mp-webhook`,
    statement_descriptor: '1FIXTRACK'
  };

  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
    },
    body: JSON.stringify(body)
  });

  const data = await r.json();
  if (!r.ok) return res.status(500).json({ error: data.message || 'Error en MercadoPago' });

  const sandbox = process.env.MP_SANDBOX === '1';
  res.json({ url: sandbox ? data.sandbox_init_point : data.init_point });
};
