const CHECKOUT_ENDPOINT = '/api/create-checkout';
const VERIFY_ENDPOINT = '/api/verify-payment';
const INVOICE_STORAGE_KEY = 'uddah_invoice_id';

const checkoutButton = document.querySelector('#checkout-button');
const checkoutMessage = document.querySelector('#checkout-message');

function scrollToCheckout() {
  document.querySelector('#checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-buy]').forEach((button) => {
  button.addEventListener('click', scrollToCheckout);
});

async function startCheckout() {
  checkoutButton.disabled = true;
  checkoutButton.textContent = 'جارٍ تجهيز صفحة الدفع…';
  checkoutMessage.textContent = '';

  try {
    const response = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (!response.ok || !data.url || !data.invoiceId) {
      throw new Error(data.error || 'تعذر إنشاء فاتورة الدفع.');
    }

    try {
      sessionStorage.setItem(INVOICE_STORAGE_KEY, data.invoiceId);
    } catch {
      throw new Error('تعذر حفظ بيانات الطلب في المتصفح. تأكد من السماح بالتخزين المؤقت ثم حاول مرة أخرى.');
    }
    window.location.assign(data.url);
  } catch (error) {
    checkoutMessage.textContent = error.message || 'تعذر بدء عملية الدفع. حاول مرة أخرى.';
    checkoutButton.disabled = false;
    checkoutButton.innerHTML = 'المتابعة للدفع الآمن <span>←</span>';
  }
}

checkoutButton?.addEventListener('click', startCheckout);

function showResult() {
  document.querySelector('#landing-content')?.classList.add('hidden');
  document.querySelector('#payment-result')?.classList.remove('hidden');
  window.scrollTo({ top: 0 });
}

function createLink(label, href, className = 'button primary') {
  const link = document.createElement('a');
  link.className = className;
  link.href = href;
  link.textContent = label;
  return link;
}

function setResult({ icon, title, message, actions = [] }) {
  document.querySelector('#result-icon').textContent = icon;
  document.querySelector('#result-title').textContent = title;
  document.querySelector('#result-message').textContent = message;
  const actionContainer = document.querySelector('#result-actions');
  actionContainer.replaceChildren(...actions);
}

async function verifyCompletedCheckout() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') !== 'complete') return;

  showResult();
  const invoiceId = sessionStorage.getItem(INVOICE_STORAGE_KEY);

  if (!invoiceId) {
    setResult({
      icon: '!',
      title: 'تعذر التحقق تلقائيًا',
      message: 'لم نجد رقم الفاتورة في هذه الجلسة. إذا تم الخصم فعلاً، احتفظ بإيصال Moyasar وتواصل معنا للتحقق.',
      actions: [createLink('العودة للموقع', '/', 'button secondary')],
    });
    return;
  }

  try {
    const response = await fetch(`${VERIFY_ENDPOINT}?id=${encodeURIComponent(invoiceId)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'تعذر التحقق من الفاتورة.');
    }

    if (!data.paid) {
      setResult({
        icon: '×',
        title: 'الدفع غير مكتمل',
        message: 'لم تؤكد Moyasar أن الفاتورة مدفوعة. يمكنك العودة والمحاولة مرة أخرى.',
        actions: [createLink('العودة للدفع', '/#checkout')],
      });
      return;
    }

    sessionStorage.removeItem(INVOICE_STORAGE_KEY);

    if (data.downloadUrl) {
      const downloadUrl = new URL(data.downloadUrl, window.location.origin);
      if (!['http:', 'https:'].includes(downloadUrl.protocol)) {
        throw new Error('رابط التحميل غير صالح. تواصل معنا مع رقم الفاتورة لإرسال الحزمة.');
      }

      const downloadLink = createLink('تحميل حزمة عُدّة ↓', downloadUrl.href);
      downloadLink.rel = 'noopener';
      setResult({
        icon: '✓',
        title: 'تمت عملية الشراء',
        message: 'تم التحقق من الدفع بنجاح. الحزمة جاهزة للتحميل.',
        actions: [downloadLink, createLink('العودة للرئيسية', '/', 'text-link')],
      });
    } else {
      const invoiceRef = document.createElement('p');
      invoiceRef.className = 'invoice-ref mono';
      invoiceRef.dir = 'ltr';
      invoiceRef.textContent = invoiceId;
      setResult({
        icon: '✓',
        title: 'تم الدفع بنجاح',
        message: 'تم تأكيد الدفع، لكن رابط التحميل لم يتم ضبطه في إعدادات الموقع بعد. احتفظ برقم الفاتورة كمرجع.',
        actions: [invoiceRef, createLink('العودة للرئيسية', '/', 'button secondary')],
      });
    }
  } catch (error) {
    const retryButton = document.createElement('button');
    retryButton.className = 'button primary';
    retryButton.type = 'button';
    retryButton.textContent = 'إعادة التحقق';
    retryButton.addEventListener('click', () => window.location.reload());
    setResult({
      icon: '!',
      title: 'تعذر التحقق الآن',
      message: error.message || 'حدث خطأ أثناء التحقق. لا تعِد الدفع قبل التأكد من حالة العملية.',
      actions: [retryButton],
    });
  }
}

verifyCompletedCheckout();
