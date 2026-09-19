const MOYASAR_API = 'https://api.moyasar.com/v1';
const EXPECTED_AMOUNT = 49900;
const EXPECTED_CURRENCY = 'SAR';
const EXPECTED_DESCRIPTION = 'حزمة عُدّة الشاملة — مهارات النموذج';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.MOYASAR_SECRET_KEY) {
    return json({ error: 'بوابة الدفع غير مهيأة بعد.' }, 503);
  }

  const invoiceId = new URL(request.url).searchParams.get('id');
  if (!invoiceId || !UUID_RE.test(invoiceId)) {
    return json({ error: 'رقم الفاتورة غير صالح.' }, 400);
  }

  try {
    const authorization = `Basic ${btoa(`${env.MOYASAR_SECRET_KEY}:`)}`;
    const response = await fetch(`${MOYASAR_API}/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: { Authorization: authorization, Accept: 'application/json' },
    });

    const invoice = await response.json();
    if (!response.ok) {
      console.error('Moyasar invoice fetch failed', response.status);
      return json({ error: 'تعذر قراءة حالة الفاتورة من مزود الدفع.' }, 502);
    }

    const paid =
      invoice.status === 'paid' &&
      invoice.amount === EXPECTED_AMOUNT &&
      invoice.currency === EXPECTED_CURRENCY &&
      invoice.description === EXPECTED_DESCRIPTION;

    if (!paid) {
      return json({ paid: false, status: invoice.status || 'unknown' });
    }

    return json({
      paid: true,
      invoiceId: invoice.id,
      downloadUrl: env.UDDAH_DOWNLOAD_URL || null,
    });
  } catch (error) {
    console.error('Payment verification error', error);
    return json({ error: 'حدث خطأ أثناء التحقق من الدفع.' }, 500);
  }
}
