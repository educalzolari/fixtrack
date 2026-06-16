module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const type = req.body?.type || req.query?.topic;
  const id   = req.body?.data?.id || req.query?.id;

  if (type !== 'payment' || !id) return res.status(200).end();

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const payment = await r.json();

    if (payment.status !== 'approved') return res.status(200).end();

    const [userId, plan] = (payment.external_reference || '').split('|');
    if (!userId || !plan) return res.status(200).end();

    const days    = plan === 'anual' ? 365 : 30;
    const expires = new Date(Date.now() + days * 86400000).toISOString();

    const supaUrl = process.env.SUPABASE_URL || 'https://axgqawopidzljidnaodd.supabase.co';
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    await fetch(`${supaUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supaKey}`,
        'apikey': supaKey
      },
      body: JSON.stringify({
        user_metadata: { plan: 'pro', plan_expires_at: expires, plan_type: plan }
      })
    });
  } catch (e) {
    console.error('mp-webhook:', e.message);
  }

  res.status(200).end();
};
