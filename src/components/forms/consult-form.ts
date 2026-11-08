/**
 * Consultation form enhancement: accessible validation + honest submission states.
 * Success is shown only after the configured endpoint answers with a 2xx status.
 * There is no demonstration mode: without an endpoint the visitor gets an error
 * that points at the phone numbers.
 */

const toLatinDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const MAX_FILE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ['.pdf', '.xls', '.xlsx', '.csv', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

/** Iranian mobile numbers: 09xxxxxxxxx, with or without +98 / 0098. */
function validMobile(v: string) {
  const digits = toLatinDigits(v).replace(/[\s\-()]/g, '');
  return /^(?:\+?98|0098|0)?9\d{9}$/.test(digits);
}

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/** Optional numbers: empty is fine, anything else must parse (Persian digits allowed). */
function validNumber(v: string) {
  if (!v.trim()) return true;
  const n = toLatinDigits(v).replace(/[\s,٬]/g, '');
  return /^\d+(\.\d+)?$/.test(n) && Number(n) >= 0;
}

function validFile(file: File | null): string | null {
  if (!file || !file.name) return 'فایل فهرست عدل‌بندی (packing list) را بارگذاری کنید.';
  const name = file.name.toLowerCase();
  if (!ALLOWED.some((ext) => name.endsWith(ext))) return 'قالب فایل پشتیبانی نمی‌شود؛ PDF، اکسل، Word یا تصویر (JPG/PNG) بفرستید.';
  if (file.size > MAX_FILE) return 'حجم فایل بیش از ۱۰ مگابایت است؛ نسخهٔ سبک‌تر یا تصویر اسکن‌شده بفرستید.';
  if (file.size === 0) return 'فایل خالی است؛ فایل دیگری انتخاب کنید.';
  return null;
}

export function initConsultForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-form]');
  if (!form) return;
  const endpoint = root.dataset.endpoint ?? '';
  const summary = root.querySelector<HTMLElement>('[data-error-summary]')!;
  const summaryList = root.querySelector<HTMLElement>('[data-error-list]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = submit.querySelector<HTMLElement>('[data-submit-label]');
  const fileInput = form.querySelector<HTMLInputElement>('[data-file-input]');
  const fileLabel = root.querySelector<HTMLElement>('[data-file-label]');
  const defaultFileLabel = fileLabel?.textContent ?? 'انتخاب فایل…';
  const defaultSubmitLabel = submitLabel?.textContent ?? 'ارسال و دریافت استعلام';
  let attempted = false;

  form.noValidate = true; // we render our own accessible messages

  const value = (name: string) => String(new FormData(form).get(name) ?? '').trim();

  function setError(name: string, message: string | null) {
    const holder = root.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    if (holder) holder.textContent = message ?? '';
    form!.querySelectorAll<HTMLElement>(`[name="${name}"]`).forEach((f) => {
      if (message) f.setAttribute('aria-invalid', 'true');
      else f.removeAttribute('aria-invalid');
    });
  }

  function validate() {
    const errors: Array<{ name: string; id: string; message: string }> = [];
    const add = (name: string, id: string, message: string | null) => {
      setError(name, message);
      if (message) errors.push({ name, id, message });
    };

    add('name', 'f-name', value('name').length >= 2 ? null : 'نام و نام خانوادگی خود را وارد کنید.');
    add(
      'mobile',
      'f-mobile',
      value('mobile')
        ? validMobile(value('mobile'))
          ? null
          : 'شمارهٔ موبایل معتبر نیست؛ مثلاً ۰۹۱۷۱۲۳۴۵۶۷.'
        : 'شمارهٔ موبایل لازم است تا بتوانیم پاسخ استعلام را اعلام کنیم.',
    );
    add('email', 'f-email', value('email') && !validEmail(value('email')) ? 'نشانی ایمیل معتبر نیست؛ مثلاً name@company.com' : null);
    add('service', 'f-service', value('service') ? null : 'یکی از خدمات را انتخاب کنید (یا «هنوز مطمئن نیستم»).');
    add('goods', 'f-goods', value('goods').length >= 10 ? null : 'شرح کالا را در چند کلمه بنویسید (دست‌کم ۱۰ نویسه).');
    add('stage', 'f-stage', value('stage') ? null : 'مرحلهٔ فعلی محموله را از فهرست انتخاب کنید.');
    add('tariff', 'f-tariff', value('tariff') && !/^[\d۰-۹]{4,12}([.\-/][\d۰-۹]{2,4})*$/.test(value('tariff')) ? 'کد تعرفه را به‌صورت رقم وارد کنید (مثلاً ۸۴۷۱ یا 8471.30).' : null);
    for (const [name, id, label] of [
      ['volume', 'f-volume', 'حجم'],
      ['weight', 'f-weight', 'وزن'],
      ['value', 'f-value', 'ارزش دلاری'],
      ['cbm', 'f-cbm', 'CBM'],
    ] as const) {
      add(name, id, validNumber(value(name)) ? null : `${label} باید عدد باشد (فقط رقم و اعشار).`);
    }
    add('packingList', 'f-packing', validFile(fileInput?.files?.[0] ?? null));
    add('consent', 'f-consent', form!.querySelector<HTMLInputElement>('[name="consent"]')?.checked ? null : 'برای ارسال، موافقت با استفاده از اطلاعات لازم است.');
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
          focusField(e.id);
        });
        li.append(a);
        return li;
      }),
    );
    summary.hidden = errors.length === 0;
  }

  function focusField(id: string) {
    const el = root.querySelector<HTMLElement>(`#${id}`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function setStatus(tone: 'success' | 'error' | '', html: string) {
    status.dataset.tone = tone;
    status.innerHTML = html;
  }

  // Live feedback after the first attempt only, so the form never nags while typing.
  form.addEventListener('input', () => {
    if (attempted) showSummary(validate());
  });
  form.addEventListener('change', () => {
    if (attempted) showSummary(validate());
  });

  fileInput?.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if (fileLabel) fileLabel.textContent = f && f.name ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB` : defaultFileLabel;
  });

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
    data.delete('website');

    // Normalise the numbers we ask for, so the inbox always gets Latin digits.
    for (const key of ['mobile', 'tariff', 'volume', 'weight', 'value', 'cbm']) {
      const raw = String(data.get(key) ?? '');
      if (raw) data.set(key, toLatinDigits(raw).replace(/[٬,]/g, ''));
    }
    data.set('page', location.pathname);

    if (!endpoint) {
      const phones = [...root.querySelectorAll<HTMLElement>('[data-no-endpoint] a')].map((a) => a.textContent?.trim() ?? '');
      const list = phones.filter(Boolean).join(' یا ');
      setStatus(
        'error',
        `<strong>ارسال آنلاین در دسترس نیست.</strong> سامانهٔ دریافت فرم هنوز تنظیم نشده است؛ لطفاً با شماره‌های تماس${list ? ` (${list})` : ''} تماس بگیرید.`,
      );
      return;
    }

    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    if (submitLabel) submitLabel.textContent = 'در حال ارسال…';
    try {
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      attempted = false;
      showSummary([]);
      if (fileLabel) fileLabel.textContent = defaultFileLabel;
      setStatus('success', '<strong>استعلام شما ثبت شد.</strong> پس از بررسی اطلاعات و فایل، از شمارهٔ موبایلی که وارد کردید با شما تماس می‌گیریم.');
    } catch {
      setStatus(
        'error',
        '<strong>ارسال انجام نشد.</strong> ممکن است اتصال اینترنت یا سرور دریافت با مشکل روبه‌رو باشد. اطلاعات فرم حفظ شده است؛ چند لحظه بعد دوباره تلاش کنید یا با شماره‌های تماس در ارتباط باشید.',
      );
    } finally {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      if (submitLabel) submitLabel.textContent = defaultSubmitLabel;
    }
  });
}
