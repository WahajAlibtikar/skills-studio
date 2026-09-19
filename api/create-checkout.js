const MOYASAR_API = 'https://api.moyasar.com/v1';
const AMOUNT = 49900;
const CURRENCY = 'SAR';
const DESCRIPTION = 'حزمة عُدّة الشاملة — مهارات النموذج';

function getBaseUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function authHeader(secretKey) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.MOYASAR_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({ error: 'بوابة الدفع غير مهيأة بعد.' });
  }

  const baseUrl = getBaseUrl(req);

  try {
    const response = await fetch(`${MOYASAR_API}/invoices`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(secretKey),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        amount: AMOUNT,
        currency: CURRENCY,
        description: DESCRIPTION,
        success_url: `${baseUrl}/?checkout=complete`,
        back_url: `${baseUrl}/#checkout`,
      }),
    });

    const invoice = await response.json();

    if (!response.ok || !invoice.id || !invoice.url) {
      console.error('Moyasar invoice creation failed', response.status, invoice);
      return res.status(502).json({ error: 'تعذر إنشاء فاتورة الدفع. حاول مرة أخرى.' });
    }

    return res.status(201).json({
      invoiceId: invoice.id,
      url: invoice.url,
    });
  } catch (error) {
    console.error('Checkout creation error', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء تجهيز الدفع.' });
  }
}
