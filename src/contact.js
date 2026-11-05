// Contact form: validate on blur, send through Web3Forms, and only ever report what really happened.
import { SITE } from './site-config.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ENDPOINT = 'https://api.web3forms.com/submit';

export function initContact(form) {
  const status = $('[data-status]', form);
  const submit = $('[data-submit]', form);
  const fields = $$('.field', form).filter((f) => $('input:not([type=checkbox]), textarea', f));

  function check(field) {
    const input = $('input, textarea', field);
    let msg = '';
    const label = $('label', field).textContent.trim().toLowerCase().replace(/^your /, '');
    if (input.required && !input.value.trim()) msg = `Please add ${label === 'message' ? 'a message' : `your ${label}`}.`;
    else if (input.value && !input.checkValidity()) msg = 'Please enter an email like name@business.com.';
    let err = $('.err', field);
    if (msg && !err) {
      err = document.createElement('p');
      err.className = 'err';
      err.id = `${input.id}-err`;
      field.append(err);
    }
    if (err) err.textContent = msg;
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    if (msg) input.setAttribute('aria-describedby', err.id);
    else input.removeAttribute('aria-describedby');
    return !msg;
  }
  fields.forEach((f) => $('input, textarea', f).addEventListener('blur', () => check(f)));

  const say = (text, kind) => {
    status.textContent = text;
    status.dataset.kind = kind;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = fields.filter((f) => !check(f));
    if (bad.length) {
      $('input, textarea', bad[0]).focus();
      return;
    }
    if (!SITE.web3formsKey) {
      // Dev only (the live page hides the form without a key): never pretend it sent.
      say("This form isn't connected yet (no Web3Forms key), so nothing was sent.", 'error');
      return;
    }
    const data = new FormData(form);
    const name = data.get('name').trim();
    const payload = {
      access_key: SITE.web3formsKey,
      subject: `Consultation request from ${name} (${data.get('business').trim()})`,
      from_name: 'Minutemen Marketing website',
      name,
      business: data.get('business').trim(),
      email: data.get('email').trim(),
      services: data.getAll('services').join(', ') || 'Not specified',
      message: data.get('message').trim(),
      botcheck: data.get('botcheck') ? true : '',
    };
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    const label = submit.textContent;
    submit.textContent = 'Sending…';
    say('', '');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);
      form.reset();
      say(`Thanks, ${name}. We got your message and will reply to ${payload.email}.`, 'success');
      status.focus?.();
    } catch {
      say("Your message didn't send. Please check your connection and try again.", 'error');
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.textContent = label;
    }
  });
}
