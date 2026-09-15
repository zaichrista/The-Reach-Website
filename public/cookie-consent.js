/* Load optional services only from a category's enable function. */
(() => {
  'use strict';
  const COOKIE = 'restaurant_cookie_choice';
  const DAYS = 180;
  let options = null;
  let choices = {};
  let active = {};
  let panel = null;

  function readChoice() {
    const value = document.cookie.split('; ').find(item => item.startsWith(`${COOKIE}=`));
    if (!value) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(value.slice(COOKIE.length + 1)));
      return parsed?.version === options.consentVersion && parsed.categories && typeof parsed.categories === 'object'
        ? parsed.categories : null;
    } catch { return null; }
  }

  function writeChoice() {
    const value = encodeURIComponent(JSON.stringify({ version: options.consentVersion, categories: choices }));
    document.cookie = `${COOKIE}=${value}; Max-Age=${DAYS * 86400}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }

  function applyChoices(next) {
    for (const [name, category] of Object.entries(options.categories)) {
      const allowed = next[name] === true;
      if (allowed && !active[name]) {
        category.enable();
        active[name] = true;
      } else if (!allowed && active[name]) {
        category.disable();
        active[name] = false;
      }
    }
    choices = next;
  }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  }

  function close() {
    panel?.remove();
    panel = null;
  }

  function save(next) {
    applyChoices(next);
    writeChoice();
    close();
  }

  function open() {
    if (!options || panel) return;
    panel = element('section', 'restaurant-cookie-panel');
    panel.setAttribute('aria-label', 'Cookie choices');
    const title = element('h2', '', 'Cookie choices');
    const hasOptional = Object.keys(options.categories).length > 0;
    const intro = element('p', '', hasOptional
      ? 'Necessary cookies help this site remember your choice. Optional cookies are off unless you allow them.'
      : 'This site currently has no optional cookie categories to choose from.');
    const policy = element('a', '', 'Read our cookie policy');
    policy.href = options.policyUrl;
    const controls = element('div', 'restaurant-cookie-actions');
    const reject = element('button', '', 'Reject optional');
    const accept = element('button', '', 'Accept optional');
    const customise = element('button', '', 'Choose categories');
    reject.type = accept.type = customise.type = 'button';
    reject.addEventListener('click', () => save(Object.fromEntries(Object.keys(options.categories).map(name => [name, false]))));
    accept.addEventListener('click', () => save(Object.fromEntries(Object.keys(options.categories).map(name => [name, true]))));
    const details = element('div', 'restaurant-cookie-details');
    details.hidden = true;
    const inputs = {};
    for (const [name, category] of Object.entries(options.categories)) {
      const label = element('label', 'restaurant-cookie-category');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = choices[name] === true;
      inputs[name] = input;
      label.append(input, element('span', '', `${category.label}: ${category.description}`));
      details.append(label);
    }
    const saveButton = element('button', '', 'Save choices');
    saveButton.type = 'button';
    saveButton.addEventListener('click', () => save(Object.fromEntries(Object.entries(inputs).map(([name, input]) => [name, input.checked]))));
    details.append(saveButton);
    customise.addEventListener('click', () => {
      details.hidden = !details.hidden;
      customise.setAttribute('aria-expanded', String(!details.hidden));
      if (!details.hidden) Object.values(inputs)[0]?.focus();
    });
    customise.setAttribute('aria-expanded', 'false');
    if (hasOptional) {
      controls.append(reject, accept, customise);
    } else {
      const done = element('button', '', 'Close');
      done.type = 'button';
      done.addEventListener('click', close);
      controls.append(done);
    }
    panel.append(title, intro, policy, controls, details);
    document.body.append(panel);
    controls.querySelector('button')?.focus();
  }

  function init(config = {}) {
    if (options) throw new Error('Cookie consent has already been initialised');
    const categories = config.categories ?? {};
    for (const [name, category] of Object.entries(categories)) {
      if (!/^[a-z][a-z0-9_-]*$/.test(name) || !category?.label || !category?.description ||
          typeof category.enable !== 'function' || typeof category.disable !== 'function') {
        throw new Error(`Invalid cookie category: ${name}`);
      }
    }
    const policyUrl = new URL(config.policyUrl ?? '/cookies.html', location.href);
    if (policyUrl.origin !== location.origin ||
        !['http:', 'https:', ...(location.protocol === 'file:' ? ['file:'] : [])].includes(policyUrl.protocol)) {
      throw new Error('Cookie policy must be a same-origin URL');
    }
    options = { categories, policyUrl: policyUrl.href, consentVersion: String(config.consentVersion ?? '1') };
    const stored = readChoice();
    applyChoices(Object.fromEntries(Object.keys(categories).map(name => [name, stored?.[name] === true])));
    if (!stored && Object.keys(categories).length) open();
  }

  window.RestaurantCookieConsent = { init, open };
})();
