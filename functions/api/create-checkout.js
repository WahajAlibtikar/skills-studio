const MOYASAR_API = 'https://api.moyasar.com/v1';
const AMOUNT = 49900;
const CURRENCY = 'SAR';
const DESCRIPTION = 'حزمة عُدّة الشاملة — مهارات النموذج';

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function getBaseUrl(request, configuredUrl) {
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export async function onRequestPost({ request, env }) {
  if (!env.MOYASAR_SECRET_KEY) {
    return json({ error: 'بوابة الدفع غير مهيأة بعد.' }, 503);
  }

  const baseUrl = getBaseUrl(request, env.SITE_URL);
  const authorization = `Basic ${btoa(`${env.MOYASAR_SECRET_KEY}:`)}`;

  try {
    const response = await fetch(`${MOYASAR_API}/invoices`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
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
      console.error('Moyasar invoice creation failed', response.status);
      return json({ error: 'تعذر إنشاء فاتورة الدفع. حاول مرة أخرى.' }, 502);
    }

    return json({ invoiceId: invoice.id, url: invoice.url }, 201);
  } catch (error) {
    console.error('Checkout creation error', error);
    return json({ error: 'حدث خطأ أثناء تجهيز الدفع.' }, 500);
  }
}
