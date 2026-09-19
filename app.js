// app.js - التحكم بمنظومة عُدّة: المهارات، مسارات التدريب، ودليل الأدوات
import { products, trainingTracks, toolsDirectory } from './uddah-data.js';

const cart = new Set();
const productDialog = document.querySelector('#product-dialog');
const cartDialog = document.querySelector('#cart-dialog');
const homeView = document.querySelector('#home-view');
const skillsHubView = document.querySelector('#skills-hub-view');
const toolsHubView = document.querySelector('#tools-hub-view');
let toastTimer;

// إظهار رسالة التنبيه السريعة (Toast)
function showToast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3200);
}

// تبديل العرض بين الصفحة الرئيسية وصفحة المهارات الكاملة
function switchToView(viewName) {
  homeView.classList.toggle('hidden', viewName !== 'home');
  skillsHubView.classList.toggle('active', viewName === 'skills-hub');
  toolsHubView.classList.toggle('active', viewName === 'tools-hub');
  if (viewName === 'skills-hub') {
    renderAllProducts('all');
  } else if (viewName === 'tools-hub') {
    renderToolsDirectory();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// معاينة محتوى ملف المهارة في البطل (Hero Interactive Preview)
function setPreview(id) {
  const p = products[id];
  if (!p) return;
  document.querySelectorAll('[data-preview]').forEach(btn => {
    const selected = btn.dataset.preview === id;
    btn.setAttribute('aria-selected', String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  const panel = document.querySelector('#file-panel');
  panel.setAttribute('aria-labelledby', 'tab-' + id);
  panel.innerHTML = `
    <div class="file-path mono" dir="ltr">uddah / ${id === 'design' ? 'design-system' : id} / SKILL.md</div>
    <div class="code-title" dir="ltr"># ${p.english.toLowerCase().replaceAll(' ', '-')}</div>
    <p>${p.preview}</p>
    <div class="preview-checks">
      ${p.tags.map(t => `<span>${t}</span>`).join('')}
    </div>
  `;
}

// قالب بطاقة المنتج/المهارة
function createProductCardHTML(p) {
  const isDesign = p.id === 'design';
  const isDatabase = p.id === 'database';
  const isTextMark = p.mark.length > 2;

  let markClasses = 'product-mark mono';
  if (isDesign) markClasses = 'product-mark design-mark';
  else if (isDatabase) markClasses = 'product-mark mono database-mark';
  else if (isTextMark) markClasses = 'product-mark mono';

  return `
    <article class="product-card" data-product="${p.id}">
      <div class="card-top">
        <span class="mono" dir="ltr">${p.english}</span>
        <span class="pill">${p.badge}</span>
      </div>
      <div class="${markClasses}" ${isDesign ? '' : 'dir="ltr"'} aria-hidden="true">
        ${isDesign ? 'Aa<span>أب</span>' : p.mark}
      </div>
      <h3>${p.title}</h3>
      <p>${p.summary}</p>
      <div class="tags">
        ${p.tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}
      </div>
      <div class="card-footer">
        <span class="price"><bdi>${p.price}</bdi> <small>ر.س</small></span>
        <button class="detail-button" data-detail="${p.id}" aria-label="تفاصيل مهارة ${p.title}">
          التفاصيل <span aria-hidden="true">↖</span>
        </button>
      </div>
    </article>
  `;
}

// حقن منتجات الصفحة الرئيسية
function renderHomeProducts() {
  const container = document.querySelector('#home-products-grid');
  if (!container) return;

  const displayedItems = ['design', 'frontend', 'backend', 'database'].map(id => products[id]);

  container.innerHTML = displayedItems.map(createProductCardHTML).join('');
}

// حقن جميع المنتجات في صفحة المهارات الكاملة مع البحث والتصفية
function renderAllProducts(category = 'all', query = '') {
  const container = document.querySelector('#all-products-grid');
  if (!container) return;

  const q = query.trim().toLowerCase();
  const filtered = Object.values(products).filter(p => {
    if (p.id === 'studio') return false;
    const matchesCat = category === 'all' || p.category === category;
    const matchesQuery = !q || 
      p.title.toLowerCase().includes(q) || 
      p.summary.toLowerCase().includes(q) || 
      p.english.toLowerCase().includes(q) || 
      p.tags.some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 16px;background:#fff;border:1px solid var(--line);border-radius:8px;">
        <h3 style="font-size:1.3rem;margin-bottom:8px;">لا توجد مهارات مطابقة للبحث</h3>
        <p style="color:var(--muted);margin-bottom:16px;">جرّب استخدام كلمات عامة مثل: واجهات، تسعير، موارد، أو إرشاد.</p>
        <button class="button primary" id="btn-reset-filters" style="font-size:0.875rem;padding:8px 16px;">إعادة ضبط التصفية</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(createProductCardHTML).join('');
}

// حقن مسارات التدريب على الذكاء الاصطناعي
function renderTrainingTracks() {
  const container = document.querySelector('#training-tracks-grid');
  if (!container) return;

  container.innerHTML = trainingTracks.map((track, idx) => {
    const isPopular = idx === 1; // المسار المتوسط
    return `
      <article class="track-card ${isPopular ? 'popular' : ''}">
        <div class="track-header">
          <span class="mono" dir="ltr">${track.levelEnglish}</span>
          <span class="track-level-badge">${track.level}</span>
        </div>
        <h3>${track.title}</h3>
        <p class="track-subtitle">${track.subtitle}</p>
        
        <div class="track-meta">
          <div class="track-meta-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <strong>المدة:</strong> <span>${track.duration}</span>
          </div>
          <div class="track-meta-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <strong>الفئة المستهدفة:</strong> <span>${track.audience}</span>
          </div>
          <div class="track-meta-row">
            <strong>بداية المسار:</strong> <span>${track.startDate}</span>
          </div>
          <div class="track-meta-row">
            <strong>المقاعد:</strong> <span>${track.seats} مقاعد فقط</span>
          </div>
        </div>

        <ul class="track-chapters-list">
          ${track.chapters.map(ch => `
            <li class="track-chapter-item">
              <div class="track-chapter-header">
                <span class="track-chapter-num">[${ch.num}]</span>
                <span>${ch.title}</span>
              </div>
              <div class="track-chapter-desc">${ch.desc}</div>
            </li>
          `).join('')}
        </ul>

        <div class="track-card-footer">
          <div class="track-outcome">
            <strong>المخرج النهائي:</strong> ${track.outcome}
          </div>
          <button class="button primary" data-track-enroll="${track.id}" style="width:100%;justify-content:center;min-height:48px;">
            <bdi>${track.price}</bdi> ر.س <span aria-hidden="true">←</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// حقن دليل الأدوات والمحررات الذكية
function renderToolsDirectory() {
  const container = document.querySelector('#tools-directory-grid');
  if (!container) return;

  container.innerHTML = toolsDirectory.map(tool => {
    return `
      <article class="tool-card">
        <div class="tool-header">
          <div class="tool-identity">
            <span class="tool-name">${tool.name}</span>
            <span class="tool-dev">${tool.developer}</span>
          </div>
          <span class="tool-badge">${tool.badge}</span>
        </div>
        
        <div class="tool-tagline">${tool.tagline}</div>
        <p class="tool-desc">${tool.desc}</p>
        
        <div class="tool-specs">${tool.specs}</div>

        <div class="tool-platforms">
          ${tool.platforms.map(p => `<span class="platform-chip">${p}</span>`).join('')}
        </div>

        <div class="tool-actions">
          <a href="${tool.websiteUrl}" target="_blank" rel="noopener noreferrer" class="tool-btn primary" aria-label="زيارة الموقع الرسمي لأداة ${tool.name}">
            زيارة الموقع الرسمي <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    `;
  }).join('');
}

// إظهار نافذة تفاصيل المهارة (Modal)
function showProduct(id) {
  const p = products[id];
  if (!p) return;

  document.querySelector('#product-content').innerHTML = `
    <div class="dialog-eyebrow mono" dir="ltr">UDDAH / ${p.english}</div>
    <h2 id="dialog-title">${p.title}</h2>
    <p class="dialog-description">${p.description}</p>
    
    <h3 class="dialog-label">محتويات الحزمة الجاهزة للتنفيذ</h3>
    <ul class="deliverable-list">
      ${p.items.map(x => `<li>${x}</li>`).join('')}
    </ul>

    <div class="requirement">
      <strong>المتطلبات قبل الاستخدام</strong><br>
      ${p.requirements}
    </div>

    <div class="dialog-purchase">
      <span class="price"><bdi>${p.price}</bdi> <small>ر.س</small></span>
      <button class="button primary" data-add="${id}">
        ${cart.has(id) ? 'موجودة في السلة' : 'أضف إلى السلة'} <span aria-hidden="true">＋</span>
      </button>
    </div>
    
    <p class="dialog-note">
      الأسعار والتراخيص مبدئية ضمن تصور المنصة. لا يُحصّل أي مبلغ في هذه النسخة.
    </p>
  `;

  productDialog.showModal();
}

// إدارة السلة
function addToCart(id) {
  if (cart.has(id)) {
    showToast('هذه الحزمة موجودة في سلتك بالفعل');
    return;
  }
  if (id !== 'studio' && cart.has('studio')) {
    showToast('المهارة مشمولة بالفعل في مهارات النموذج');
    return;
  }
  if (id === 'studio') {
    cart.clear();
  }
  cart.add(id);
  document.querySelector('#cart-count').textContent = cart.size;
  productDialog.close();
  renderCart();
  cartDialog.showModal();
}

function renderCart() {
  const el = document.querySelector('#cart-content');
  if (!cart.size) {
    el.innerHTML = `
      <div class="cart-empty">
        <h3>وش يحتاج مشروعك؟</h3>
        <p>سلتك فاضية حاليًا. تصفّح المهارات<br>واختر ما يخدم أهداف عملك اليوم.</p>
        <button class="button primary" data-browse>تصفّح المهارات <span aria-hidden="true">←</span></button>
      </div>
    `;
    return;
  }

  const sum = [...cart].reduce((a, id) => a + (products[id] ? products[id].price : 0), 0);
  el.innerHTML = `
    ${cart.has('studio') ? '<p class="bundle-conflict">مهارات النموذج تشمل المهارات التقنية الأربع بتوفير 40%.</p>' : ''}
    ${[...cart].map(id => {
      const p = products[id];
      if (!p) return '';
      return `
        <div class="cart-row">
          <div>
            <h3>${p.title}</h3>
            <p><bdi>${p.price}</bdi> ر.س · رخصة استخدام رقمية مقترحة</p>
          </div>
          <button class="cart-remove" data-remove="${id}" aria-label="إزالة ${p.title}">إزالة</button>
        </div>
      `;
    }).join('')}
    <div class="cart-total">
      <span>المجموع المقترح</span>
      <strong><bdi>${sum}</bdi> <small>ر.س</small></strong>
    </div>
    <div class="demo-notice">
      <strong>السلة للمعاينة التجريبية.</strong><br>
      الشراء الإلكتروني غير مفعّل حالياً. سيتم اعتماد بوابات الدفع الرسمية وشروط التراخيص قبل الطرح النهائي.
    </div>
    <button class="button primary cart-return" data-browse>تابع تصفّح المهارات</button>
  `;
}

// مستمعو الأحداث (Event Listeners)
document.addEventListener('click', e => {
  // تفاصيل المنتج
  const detail = e.target.closest('[data-detail]');
  if (detail) {
    showProduct(detail.dataset.detail);
    return;
  }

  // تبويب المعاينة في البطل
  const tab = e.target.closest('[data-preview]');
  if (tab) {
    setPreview(tab.dataset.preview);
    return;
  }

  // إغلاق الحوارات
  if (e.target.closest('[data-close]')) {
    e.target.closest('dialog').close();
    return;
  }

  // إضافة للسلة
  const add = e.target.closest('[data-add]');
  if (add) {
    addToCart(add.dataset.add);
    return;
  }

  // إزالة من السلة
  const remove = e.target.closest('[data-remove]');
  if (remove) {
    cart.delete(remove.dataset.remove);
    document.querySelector('#cart-count').textContent = cart.size;
    renderCart();
    return;
  }

  // متابعة التصفح من السلة
  if (e.target.closest('[data-browse]')) {
    cartDialog.close();
    switchToView('home');
    document.querySelector('#collection').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // حجز في مسار تدريب
  const trackBtn = e.target.closest('[data-track-enroll]');
  if (trackBtn) {
    const trackId = trackBtn.dataset.trackEnroll;
    const track = trainingTracks.find(t => t.id === trackId);
    showToast(`${track.title} — يبدأ ${track.startDate}، والمتاح ${track.seats} مقاعد فقط.`);
    return;
  }

  // الانتقال لصفحة المهارات الكاملة
  if (e.target.closest('#btn-explore-all-skills')) {
    switchToView('skills-hub');
    return;
  }

  if (e.target.closest('#nav-tools-directory')) {
    e.preventDefault();
    switchToView('tools-hub');
    return;
  }

  // العودة للصفحة الرئيسية
  if (e.target.closest('#btn-back-to-home') || e.target.closest('#btn-back-from-tools') || e.target.closest('#brand-home-link') || e.target.closest('#footer-brand-link')) {
    switchToView('home');
    return;
  }

  // إعادة ضبط فلاتر البحث
  if (e.target.closest('#btn-reset-filters')) {
    document.querySelector('#skills-search-input').value = '';
    document.querySelectorAll('#hub-filter-tabs .filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#hub-filter-tabs .filter-btn[data-hub-cat="all"]').classList.add('active');
    renderAllProducts('all', '');
    return;
  }

  // روابط التنقل العلوي
  const navLink = e.target.closest('.nav-link');
  if (navLink) {
    switchToView('home');
  }
});

// فلترة صفحة المهارات الكاملة
document.querySelector('#hub-filter-tabs')?.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('#hub-filter-tabs .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const cat = btn.dataset.hubCat;
  const q = document.querySelector('#skills-search-input')?.value || '';
  renderAllProducts(cat, q);
});

// البحث في صفحة المهارات الكاملة
document.querySelector('#skills-search-input')?.addEventListener('input', e => {
  const activeBtn = document.querySelector('#hub-filter-tabs .filter-btn.active');
  const cat = activeBtn ? activeBtn.dataset.hubCat : 'all';
  renderAllProducts(cat, e.target.value);
});

// فتح السلة
document.querySelector('#open-cart')?.addEventListener('click', () => {
  renderCart();
  cartDialog.showModal();
});

// إغلاق الحوار بالنقر خارج المحتوى
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) {
      dialog.close();
    }
  });
});

// التنقل بلوحة المفاتيح في تبويبات البطل
document.querySelector('.file-tabs')?.addEventListener('keydown', e => {
  const buttons = [...document.querySelectorAll('[data-preview]')];
  let index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  if (e.key === 'ArrowLeft') index = (index + 1) % buttons.length;
  else if (e.key === 'ArrowRight') index = (index - 1 + buttons.length) % buttons.length;
  else if (e.key === 'Home') index = 0;
  else if (e.key === 'End') index = buttons.length - 1;
  else return;
  e.preventDefault();
  setPreview(buttons[index].dataset.preview);
  buttons[index].focus();
});

// التهيئة عند التحميل
renderHomeProducts();
renderTrainingTracks();
renderToolsDirectory();
setPreview('design');
