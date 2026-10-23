import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

test('header phone is a call button between prices and Telegram', () => {
  const actions = html.match(/<div class="nav-actions"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(actions);
  assert.match(actions, /Наши цены[\s\S]*?href="tel:\+78462677445" class="btn btn-outline btn-sm"[\s\S]*?\(846\) 267-74-45[\s\S]*?href="https:\/\/t\.me\/Gleb82"/);
});

test('hero phone is a button next to the Telegram button', () => {
  const hero = html.match(/<div class="hero-btns">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(hero);
  assert.match(hero, /Telegram\s*<\/a>\s*<a href="tel:\+78462677445" class="btn btn-outline"/);
});

test('mobile flex and grid content can shrink to viewport and quiz buttons wrap', () => {
  assert.match(css, /#hero\s*>\s*\.container\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.contact-form-wrap\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)[\s\S]*?\.quiz-nav[^}]*flex-wrap:\s*wrap/);
});

test('320px hero and About cards avoid min-content overflow', () => {
  assert.match(css, /@media\s*\(max-width:\s*360px\)[\s\S]*?#hero h1[^}]*font-size:\s*1\.85rem/);
  assert.match(css, /@media\s*\(max-width:\s*360px\)[\s\S]*?#contact h2[^}]*font-size:\s*1\.55rem/);
  assert.match(css, /\.about-grid[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /\.about-chips[^}]*flex-wrap:\s*wrap/);
  assert.match(css, /\.chip[^}]*flex:\s*1 1 110px/);
});

test('floating buttons stop before bottom CTA so they cannot obscure footer', () => {
  const classes = new Set();
  const listeners = {};
  let ctaTop = 900;
  const context = {
    document: {
      querySelectorAll: () => [],
      addEventListener: () => {},
      getElementById: id => id === 'float-tg'
        ? { classList: { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name) } }
        : id === 'cta-bottom' ? { getBoundingClientRect: () => ({ top: ctaTop }) } : null,
    },
    window: { scrollY: 500, innerHeight: 844, addEventListener: (event, fn) => { listeners[event] = fn; } },
  };
  vm.createContext(context);
  vm.runInContext(script, context);
  vm.runInContext('initFloatBtn()', context);
  assert.equal(classes.has('show'), true);
  ctaTop = 800;
  listeners.scroll();
  assert.equal(classes.has('show'), false);
});

test('emergency answer presents a direct phone call in the quiz', () => {
  assert.match(script, /qAnswers\[0\]\s*===\s*'Котёл не работает \/ авария'/);
  assert.match(script, /href="tel:\+78462677445"[^>]*>Позвонить сейчас/);
});

test('form labels are associated with their inputs', () => {
  assert.match(script, /<label for="q-name">Ваше имя/);
  assert.match(script, /<label for="q-phone">Телефон/);
});

test('privacy contact uses the same verified phone and Telegram address', () => {
  assert.match(html, /По вопросам[\s\S]*?tel:\+78462677445[\s\S]*?t\.me\/Gleb82/);
  assert.doesNotMatch(html, /@heatservice_samara/);
});

test('footer text contrast is improved', () => {
  assert.match(css, /\.footer-copy\s*\{[^}]*rgba\(255,255,255,\s*\.8/);
});

function cookieHarness() {
  const values = new Map();
  const flags = new Set();
  let now = 1_800_000_000_000;
  const context = {
    document: {
      querySelectorAll: () => [],
      addEventListener: () => {},
      getElementById: id => id === 'cookie-banner' ? {
        classList: { add: name => flags.add(name), remove: name => flags.delete(name) },
      } : null,
    },
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
    },
    Date: class extends Date { static now() { return now; } },
    setTimeout: cb => cb(),
  };
  vm.createContext(context);
  vm.runInContext(script, context);
  return { values, flags, context, advance: ms => { now += ms; } };
}

test('cookie choice expires after 365 days and prompts again', () => {
  const h = cookieHarness();
  vm.runInContext('acceptCookie("necessary")', h.context);
  vm.runInContext('initCookie()', h.context);
  assert.equal(h.flags.has('show'), false);
  h.advance(366 * 24 * 60 * 60 * 1000);
  vm.runInContext('initCookie()', h.context);
  assert.equal(h.flags.has('show'), true);
  assert.equal(h.values.has('cookie_consent'), false);
});

test('legacy cookie consent without timestamp is not treated as permanent', () => {
  const h = cookieHarness();
  h.values.set('cookie_consent', 'all');
  vm.runInContext('initCookie()', h.context);
  assert.equal(h.flags.has('show'), true);
});
