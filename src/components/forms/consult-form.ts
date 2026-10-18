/**
 * Consultation form enhancement: accessible validation + honest submission states.
 * Success is shown only after the configured endpoint answers with a 2xx status.
 */

const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

type Method = 'phone' | 'whatsapp' | 'telegram' | 'email';

const contactCopy: Record<Method, { label: string; hint: string; type: string; inputmode: string; autocomplete: string }> = {
  phone: { label: 'شمارهٔ تماس', hint: 'مثلاً ۰۹۱۲۱۲۳۴۵۶۷ — ارقام فارسی یا انگلیسی پذیرفته می‌شود.', type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  whatsapp: { label: 'شمارهٔ واتس‌اپ', hint: 'شماره‌ای که واتس‌اپ روی آن فعال است، مثلاً ۰۹۱۲۱۲۳۴۵۶۷.', type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  telegram: { label: 'نام کاربری یا شمارهٔ تلگرام', hint: 'مثلاً ‎@username‎ یا شمارهٔ موبایل.', type: 'text', inputmode: 'text', autocomplete: 'off' },
  email: { label: 'نشانی ایمیل', hint: 'مثلاً name@company.com', type: 'email', inputmode: 'email', autocomplete: 'email' },
};

function validPhone(v: string) {
  const digits = toLatinDigits(v).replace(/[\s\-()]/g, '');
  return /^\+?\d{8,15}$/.test(digits);
}

function validateContact(method: Method, raw: string): string | null {
  const v = raw.trim();
  if (!v) return 'راه ارتباطی را وارد کنید تا بتوانیم پاسخ دهیم.';
  if (method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'نشانی ایمیل معتبر نیست؛ مثلاً name@company.com';
  if (method === 'telegram') {
    const u = v.replace(/^@/, '');
    return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(u) || validPhone(v) ? null : 'نام کاربری تلگرام (دست‌کم ۵ نویسه) یا شمارهٔ موبایل وارد کنید.';
  }
  return validPhone(v) ? null : 'شماره معتبر نیست؛ ۸ تا ۱۵ رقم وارد کنید، مثلاً ۰۹۱۲۱۲۳۴۵۶۷.';
}

export function initConsultForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-form]');
  if (!form) return;
  const endpoint = root.dataset.endpoint ?? '';
  const demo = root.dataset.demo === 'true';
  const summary = root.querySelector<HTMLElement>('[data-error-summary]')!;
  const summaryList = root.querySelector<HTMLElement>('[data-error-list]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-submit]')!;
  const contact = form.elements.namedItem('contact') as HTMLInputElement;
  const contactLabel = root.querySelector<HTMLElement>('[data-contact-label]')!;
  const contactHint = root.querySelector<HTMLElement>('[data-contact-hint]')!;
  let attempted = false;

  form.noValidate = true; // we render our own accessible messages

  const method = () => ((form.elements.namedItem('contactMethod') as RadioNodeList).value || 'phone') as Method;

  function syncContactField() {
    const c = contactCopy[method()];
    contactLabel.firstChild!.textContent = `${c.label} `;
    contactHint.textContent = c.hint;
    contact.type = c.type;
    contact.inputMode = c.inputmode as HTMLInputElement['inputMode'];
    contact.autocomplete = c.autocomplete as AutoFill;
    if (attempted) validate();
  }

  function setError(name: string, message: string | null) {
    const holder = root.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    if (holder) holder.textContent = message ?? '';
    const fields = form!.querySelectorAll<HTMLInputElement>(`[name="${name}"]`);
    fields.forEach((f) => (message ? f.setAttribute('aria-invalid', 'true') : f.removeAttribute('aria-invalid')));
  }

  function validate() {
    const data = new FormData(form!);
    const errors: Array<{ name: string; id: string; message: string }> = [];
    const add = (name: string, id: string, message: string | null) => {
      setError(name, message);
      if (message) errors.push({ name, id, message });
    };
    const name = String(data.get('name') ?? '').trim();
    add('name', 'f-name', name.length >= 2 ? null : 'نام خود را وارد کنید.');
    add('contact', 'f-contact', validateContact(method(), String(data.get('contact') ?? '')));
    const goods = String(data.get('goods') ?? '').trim();
    add('goods', 'f-goods', goods.length >= 10 ? null : 'شرح کالا را در چند کلمه بنویسید (دست‌کم ۱۰ نویسه).');
    add('stage', 'stage-first', data.get('stage') ? null : 'مرحلهٔ فعلی محموله را انتخاب کنید.');
    add('consent', 'f-consent', data.get('consent') ? null : 'برای ارسال، موافقت با استفاده از اطلاعات لازم است.');
    return errors;
  }

  function showSummary(errors: ReturnType<typeof validate>) {
    summaryList.replaceChildren(
      ...errors.map((e) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${e.id}`;
        a.textContent = e.message;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          focusField(e.name);
        });
        li.append(a);
        return li;
      }),
    );
    summary.hidden = errors.length === 0;
  }

  function focusField(name: string) {
    const el = form!.querySelector<HTMLElement>(`[name="${name}"]`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function setStatus(tone: 'success' | 'error' | 'demo' | '', html: string) {
    status.dataset.tone = tone;
    status.innerHTML = html;
  }

  // The first stage radio gets an id so the summary can link to it.
  form.querySelector<HTMLInputElement>('[name="stage"]')?.setAttribute('id', 'stage-first');
  const consentBox = form.querySelector<HTMLInputElement>('[name="consent"]');
  consentBox?.setAttribute('id', 'f-consent');

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'contactMethod') syncContactField();
    else if (attempted) validate();
  });
  form.addEventListener(
    'blur',
    () => {
      if (attempted) validate();
    },
    true,
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    attempted = true;
    setStatus('', '');
    const errors = validate();
    showSummary(errors);
    if (errors.length) {
      summary.focus();
      return;
    }

    const data = new FormData(form);
    if (String(data.get('website') ?? '') !== '') return; // bot trap: silently stop

    if (demo || !endpoint) {
      setStatus(
        'demo',
        '<strong>درخواست ارسال نشد.</strong> فرم درست تکمیل شده، اما هنوز به سامانهٔ دریافت متصل نیست و اطلاعات شما برای کسی فرستاده نشد. لطفاً از راه‌های تماس مستقیم همین صفحه استفاده کنید.',
      );
      return;
    }

    data.delete('website');
    data.set('contact', toLatinDigits(String(data.get('contact') ?? '')));
    data.set('page', location.pathname);
    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    try {
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      attempted = false;
      syncContactField();
      setStatus('success', '<strong>درخواست شما ثبت شد.</strong> پس از بررسی اطلاعات، از راه ارتباطی که انتخاب کردید با شما تماس می‌گیریم.');
    } catch {
      setStatus(
        'error',
        '<strong>ارسال انجام نشد.</strong> ممکن است اتصال اینترنت یا سرور دریافت با مشکل روبه‌رو باشد. اطلاعات فرم حفظ شده است؛ چند لحظه بعد دوباره تلاش کنید یا از راه‌های تماس مستقیم استفاده کنید.',
      );
    } finally {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
    }
  });

  syncContactField();
}
