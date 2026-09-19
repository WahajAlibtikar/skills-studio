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

    sessionStorage.setItem(INVOICE_STORAGE_KEY, data.invoiceId);
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

function setResult({ icon, title, message, actionHtml = '' }) {
  document.querySelector('#result-icon').textContent = icon;
  document.querySelector('#result-title').textContent = title;
  document.querySelector('#result-message').textContent = message;
  document.querySelector('#result-actions').innerHTML = actionHtml;
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
      actionHtml: '<a class="button secondary" href="/">العودة للموقع</a>',
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
        actionHtml: '<a class="button primary" href="/#checkout">العودة للدفع</a>',
      });
      return;
    }

    sessionStorage.removeItem(INVOICE_STORAGE_KEY);

    if (data.downloadUrl) {
      setResult({
        icon: '✓',
        title: 'تمت عملية الشراء',
        message: 'تم التحقق من الدفع بنجاح. الحزمة جاهزة للتحميل.',
        actionHtml: `<a class="button primary" href="${data.downloadUrl}" rel="noopener">تحميل حزمة عُدّة <span>↓</span></a><a class="text-link" href="/">العودة للرئيسية</a>`,
      });
    } else {
      setResult({
        icon: '✓',
        title: 'تم الدفع بنجاح',
        message: 'تم تأكيد الدفع، لكن رابط التحميل لم يتم ضبطه في إعدادات الموقع بعد. احتفظ برقم الفاتورة كمرجع.',
        actionHtml: `<p class="invoice-ref mono" dir="ltr">${invoiceId}</p><a class="button secondary" href="/">العودة للرئيسية</a>`,
      });
    }
  } catch (error) {
    setResult({
      icon: '!',
      title: 'تعذر التحقق الآن',
      message: error.message || 'حدث خطأ أثناء التحقق. لا تعِد الدفع قبل التأكد من حالة العملية.',
      actionHtml: '<button class="button primary" onclick="window.location.reload()">إعادة التحقق</button>',
    });
  }
}

verifyCompletedCheckout();
