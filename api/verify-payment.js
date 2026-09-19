const MOYASAR_API = 'https://api.moyasar.com/v1';
const EXPECTED_AMOUNT = 49900;
const EXPECTED_CURRENCY = 'SAR';
const EXPECTED_DESCRIPTION = 'حزمة عُدّة الشاملة — مهارات النموذج';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function authHeader(secretKey) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.MOYASAR_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({ error: 'بوابة الدفع غير مهيأة بعد.' });
  }

  const invoiceId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!invoiceId || !UUID_RE.test(invoiceId)) {
    return res.status(400).json({ error: 'رقم الفاتورة غير صالح.' });
  }

  try {
    const response = await fetch(`${MOYASAR_API}/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: {
        Authorization: authHeader(secretKey),
        Accept: 'application/json',
      },
    });

    const invoice = await response.json();

    if (!response.ok) {
      console.error('Moyasar invoice fetch failed', response.status, invoice);
      return res.status(502).json({ error: 'تعذر قراءة حالة الفاتورة من مزود الدفع.' });
    }

    const paid =
      invoice.status === 'paid' &&
      invoice.amount === EXPECTED_AMOUNT &&
      invoice.currency === EXPECTED_CURRENCY &&
      invoice.description === EXPECTED_DESCRIPTION;

    if (!paid) {
      return res.status(200).json({
        paid: false,
        status: invoice.status || 'unknown',
      });
    }

    return res.status(200).json({
      paid: true,
      invoiceId: invoice.id,
      downloadUrl: process.env.UDDAH_DOWNLOAD_URL || null,
    });
  } catch (error) {
    console.error('Payment verification error', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء التحقق من الدفع.' });
  }
}
