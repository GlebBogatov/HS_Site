/**
 * Модуль: main.js
 * Назначение: Интерактивность лендинга ХитСервис.
 * Функции:
 *   - initNavbar()        — тень при скролле, активный пункт меню
 *   - toggleMenu()        — мобильное меню
 *   - initFadeIn()        — анимация появления секций (IntersectionObserver)
 *   - animateCounters(el) — анимация числовых счётчиков
 *   - toggleFaq(btn)      — аккордеон FAQ
 *   - initQuiz()          — инициализация квиза заявки
 *   - renderQuiz()        — рендер текущего шага квиза
 *   - selectService(s)    — выбор услуги, переход к вопросам
 *   - selectOption(i,v,t) — выбор варианта ответа
 *   - goNext() / goBack() — навигация по шагам
 *   - submitQuiz()        — отправка собранных данных
 *   - openModal(id, e)    — открытие модального окна
 *   - closeModal(id)      — закрытие модального окна
 *   - closeModalOutside() — закрытие при клике вне окна
 *   - initCookie()        — баннер Cookie
 *   - acceptCookie(type)  — принятие Cookie
 */

'use strict';

/* ===== NAVBAR ===== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

function toggleMenu() {
  const menu = document.getElementById('nav-menu');
  menu.classList.toggle('open');
}

// Закрыть мобильное меню при клике на пункт
document.querySelectorAll('.nav-menu a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('nav-menu').classList.remove('open');
  });
});

/* ===== FADE-IN + COUNTERS ===== */
function animateCounters(root) {
  root.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1400;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, 16);
  });
}

function initFadeIn() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      if (entry.target.querySelectorAll('.counter').length) {
        animateCounters(entry.target);
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Счётчики в hero запускаем сразу
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    setTimeout(() => animateCounters(heroStats), 400);
  }

  // Счётчики в stats-strip
  const statsSection = document.getElementById('stats');
  if (statsSection) observer.observe(statsSection);
}

/* ===== FAQ ACCORDION ===== */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Закрыть все открытые
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

  // Открыть текущий, если был закрыт
  if (!isOpen) item.classList.add('open');
}

/* ===== QUIZ ===== */
const BOT_WEBHOOK = 'https://bot.heatservice.tech/webhook/lead';

const SERVICES = [
  { id: 'Монтаж котельной',      icon: '🔥' },
  { id: 'Сервисное обслуживание', icon: '🔧' },
  { id: 'Система автоматизации',  icon: '⚙️' },
  { id: 'Водоподготовка',         icon: '💧' },
  { id: 'Другое / консультация',  icon: '💬' },
];

const QUIZ_Q = {
  'Монтаж котельной': [
    { q: 'Тип объекта', type: 'radio', opts: ['Частный дом / коттедж', 'Производство / склад', 'Административное здание', 'Другое'] },
    { q: 'Площадь отапливаемого помещения', type: 'radio', opts: ['до 150 кв.м', '150–500 кв.м', '500–2000 кв.м', 'более 2000 кв.м'] },
    { q: 'Тип топлива', type: 'radio', opts: ['Газ (магистральный)', 'Газ (сжиженный, баллоны/танк)', 'Дизель', 'Твёрдое топливо (дрова, уголь, пеллеты)', 'Электричество'] },
    { q: 'Что нужно отапливать', type: 'checkbox', opts: ['Радиаторы', 'Тёплый пол', 'И то и другое'] },
    { q: 'Горячее водоснабжение (ГВС)', type: 'radio', opts: ['Да, нужно', 'Нет, не нужно', 'Не знаю'] },
    { q: 'Автоматика и удалённый контроль', type: 'radio', opts: ['Да, хочу управлять со смартфона', 'Нет, базовая автоматика', 'Не знаю, проконсультируйте'] },
    { q: 'Сроки', type: 'radio', opts: ['Срочно (до 1 месяца)', '1–3 месяца', 'Планирую, сроки не определены'] },
  ],
  'Сервисное обслуживание': [
    { q: 'Что нужно сделать', type: 'radio', opts: ['Плановое ТО (раз в год)', 'Котёл не работает / авария', 'Диагностика (что-то работает плохо)', 'Заключить договор на постоянное обслуживание'] },
    { q: 'Тип котла', type: 'radio', opts: ['Газовый', 'Дизельный', 'Твёрдотопливный', 'Электрический', 'Не знаю'] },
    { q: 'Марка котла', type: 'text', placeholder: 'Например: Viessmann, Buderus, Baxi...' },
    { q: 'Год установки котла', type: 'radio', opts: ['До 5 лет', '5–10 лет', 'Более 10 лет', 'Не знаю'] },
    { q: 'Когда последний раз обслуживали', type: 'radio', opts: ['Никогда', 'Менее года назад', '1–3 года назад', 'Более 3 лет назад'] },
  ],
  'Система автоматизации': [
    { q: 'Что уже установлено', type: 'radio', opts: ['Котёл есть, автоматики нет', 'Есть старая автоматика, нужна замена', 'Новая котельная, всё с нуля', 'Не знаю, нужна консультация'] },
    { q: 'Что хотите автоматизировать', type: 'checkbox', opts: ['Управление котлом', 'Погодозависимое регулирование', 'Управление насосами и клапанами', 'Дистанционный мониторинг'] },
    { q: 'Платформа управления', type: 'radio', opts: ['ZONT (приложение на телефоне)', 'ОВЕН', 'Не важно, посоветуйте', 'Уже есть конкретная система'] },
    { q: 'Количество контуров отопления', type: 'radio', opts: ['1 контур', '2–3 контура', 'Более 3 контуров', 'Не знаю'] },
  ],
  'Водоподготовка': [
    { q: 'Источник водоснабжения', type: 'radio', opts: ['Центральный водопровод', 'Скважина', 'Колодец', 'Комбинированный'] },
    { q: 'Какая проблема', type: 'radio', opts: ['Накипь в котле и трубах', 'Ржавчина / железо в воде', 'Профилактика (котёл новый)', 'Не знаю, нужен анализ'] },
    { q: 'Тип котла', type: 'radio', opts: ['Газовый', 'Твёрдотопливный', 'Электрический', 'Дизельный'] },
    { q: 'Есть ли анализ воды', type: 'radio', opts: ['Да, есть результаты', 'Нет, нужно сделать', 'Не знаю'] },
  ],
  'Другое / консультация': [
    { q: 'Тема обращения', type: 'radio', opts: ['Хочу понять стоимость работ', 'Нужна консультация инженера', 'Есть проект, нужна смета', 'Другое'] },
  ],
};

let qService = null;
let qStep    = 'service'; // 'service' | 0..N | 'contacts'
let qAnswers = {};

function initQuiz() { renderQuiz(); }

function renderQuiz() {
  const el = document.getElementById('quiz');
  if (!el) return;
  if (qStep === 'service')        el.innerHTML = renderServiceHTML();
  else if (qStep === 'contacts')  el.innerHTML = renderContactHTML();
  else                            el.innerHTML = renderQuestionHTML(qStep);
}

function renderServiceHTML() {
  const cards = SERVICES.map(s =>
    `<button class="quiz-svc-card" onclick="selectService('${s.id}')">
       <span class="quiz-svc-icon">${s.icon}</span>
       <span>${s.id}</span>
     </button>`
  ).join('');
  return `<div class="quiz-step">
    <h3>Оставить заявку</h3>
    <p class="form-sub">Выберите услугу — подготовим точное предложение</p>
    <div class="quiz-services">${cards}</div>
  </div>`;
}

function renderQuestionHTML(idx) {
  const questions = QUIZ_Q[qService];
  const q   = questions[idx];
  const cur = qAnswers[idx];
  const total = questions.length + 1;
  const pct   = Math.round(((idx + 1) / (total + 1)) * 100);

  let body = '';
  if (q.type === 'text') {
    body = `<input class="quiz-text-input" type="text" placeholder="${q.placeholder || ''}"
      value="${cur || ''}" oninput="qAnswers[${idx}]=this.value" />`;
  } else {
    body = '<div class="quiz-options">' + q.opts.map(opt => {
      const sel = q.type === 'checkbox'
        ? Array.isArray(cur) && cur.includes(opt)
        : cur === opt;
      const esc = opt.replace(/'/g, "\\'");
      return `<button class="quiz-option${sel ? ' selected' : ''}"
        onclick="selectOption(${idx},'${esc}','${q.type}')">${opt}</button>`;
    }).join('') + '</div>';
  }

  const showNext = q.type !== 'radio';
  return `<div class="quiz-step">
    <div class="quiz-progress"><div class="quiz-progress-bar" style="width:${pct}%"></div></div>
    <p class="quiz-step-label">Шаг ${idx + 1} из ${total} · ${qService}</p>
    <h4 class="quiz-question">${q.q}</h4>
    ${body}
    <div class="quiz-nav${showNext ? '' : ' quiz-nav--back'}">
      <button class="btn btn-ghost" onclick="goBack()">← Назад</button>
      ${showNext ? '<button class="btn btn-navy" onclick="goNext()">Далее →</button>' : ''}
    </div>
  </div>`;
}

function renderContactHTML() {
  return `<div class="quiz-step">
    <div class="quiz-progress"><div class="quiz-progress-bar" style="width:95%"></div></div>
    <p class="quiz-step-label">Последний шаг · Контакты</p>
    <h4 class="quiz-question">Оставьте контакты — перезвоним в рабочее время</h4>
    <div class="form-group">
      <label>Ваше имя *</label>
      <input type="text" id="q-name" placeholder="Иван Иванов" />
    </div>
    <div class="form-group">
      <label>Телефон *</label>
      <input type="tel" id="q-phone" placeholder="+7 (___) ___-__-__" />
    </div>
    <div class="consent-block">
      <input type="checkbox" id="q-consent" />
      <label for="q-consent">Я согласен(а) на
        <a href="#" onclick="openModal('modal-policy',event)">обработку персональных данных</a>
        в соответствии с ФЗ-152</label>
    </div>
    <div class="quiz-nav">
      <button class="btn btn-ghost" onclick="goBack()">← Назад</button>
      <button class="btn btn-navy" id="q-submit" onclick="submitQuiz()">Отправить заявку →</button>
    </div>
  </div>`;
}

function selectService(service) {
  qService = service;
  qStep    = 0;
  qAnswers = {};
  renderQuiz();
}

function selectOption(idx, value, type) {
  if (type === 'checkbox') {
    if (!Array.isArray(qAnswers[idx])) qAnswers[idx] = [];
    const i = qAnswers[idx].indexOf(value);
    if (i === -1) qAnswers[idx].push(value);
    else qAnswers[idx].splice(i, 1);
    renderQuiz();
  } else {
    qAnswers[idx] = value;
    goNext();
  }
}

function goNext() {
  const questions = QUIZ_Q[qService];
  if (typeof qStep === 'number') {
    qStep = qStep < questions.length - 1 ? qStep + 1 : 'contacts';
  }
  renderQuiz();
}

function goBack() {
  if (qStep === 'contacts') {
    qStep = QUIZ_Q[qService].length - 1;
  } else if (qStep === 0) {
    qStep    = 'service';
    qService = null;
  } else {
    qStep--;
  }
  renderQuiz();
}

async function submitQuiz() {
  const name    = document.getElementById('q-name').value.trim();
  const phone   = document.getElementById('q-phone').value.trim();
  const consent = document.getElementById('q-consent').checked;
  if (!name || !phone) { alert('Пожалуйста, заполните имя и телефон.'); return; }
  if (!consent) { alert('Необходимо согласие на обработку персональных данных.'); return; }

  const btn = document.getElementById('q-submit');
  btn.disabled    = true;
  btn.textContent = '⏳ Отправляем...';

  const answers = QUIZ_Q[qService].map((q, i) => ({
    question: q.q,
    answer: Array.isArray(qAnswers[i]) ? qAnswers[i].join(', ') : (qAnswers[i] || '—'),
  }));

  try {
    const res = await fetch(BOT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, service: qService, message: '', answers }),
    });
    if (!res.ok) throw new Error('server error');
    document.getElementById('quiz').innerHTML = `
      <div class="form-success" style="display:block">
        <div class="ok-icon">✅</div>
        <h4>Заявка принята!</h4>
        <p>Чтобы получить точное коммерческое предложение — нажмите кнопку ниже и напишите боту <strong>/start</strong></p>
        <p style="color:var(--text-mid);font-size:14px;margin-top:8px">Бот задаст несколько уточняющих вопросов и подготовит КП в течение 2 минут</p>
        <a href="https://t.me/heatservice_leads_bot" target="_blank" rel="noopener"
           class="btn btn-primary" style="margin-top:16px;display:inline-block">
          Открыть бота в Telegram →
        </a>
      </div>`;
  } catch {
    btn.disabled    = false;
    btn.textContent = 'Отправить заявку →';
    alert('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.');
  }
}

/* ===== MODALS ===== */
function openModal(id, e) {
  if (e) e.preventDefault();
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOutside(event, id) {
  if (event.target.classList.contains('modal-overlay')) closeModal(id);
}

// Закрытие по Esc
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay.open').forEach(el => {
    el.classList.remove('open');
  });
  document.body.style.overflow = '';
});

/* ===== COOKIE BANNER ===== */
function initCookie() {
  if (localStorage.getItem('cookie_consent')) return;
  setTimeout(() => {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.add('show');
  }, 1500);
}

function acceptCookie(type) {
  localStorage.setItem('cookie_consent', type);
  const banner = document.getElementById('cookie-banner');
  if (banner) banner.classList.remove('show');
}

/* ===== SMOOTH SCROLL ===== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 68, behavior: 'smooth' });
    });
  });
}

/* ===== FLOATING TG BUTTON ===== */
function initFloatBtn() {
  const btn = document.getElementById('float-tg');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFadeIn();
  initCookie();
  initSmoothScroll();
  initFloatBtn();
  initQuiz();
});
