/**
 * Модуль: main.js
 * Назначение: Интерактивность лендинга ХитСервис.
 * Функции:
 *   - initNavbar()        — тень при скролле, активный пункт меню
 *   - toggleMenu()        — мобильное меню
 *   - initFadeIn()        — анимация появления секций (IntersectionObserver)
 *   - animateCounters(el) — анимация числовых счётчиков
 *   - toggleFaq(btn)      — аккордеон FAQ
 *   - submitForm(e)       — отправка формы
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

/* ===== FORM ===== */
const TG_TOKEN = '8796465491:AAHf8PNnn66lTfnr5F4FW9NDhtekMglkGtw';
const TG_CHAT  = '192237987';

function submitForm(e) {
  e.preventDefault();

  const form         = document.getElementById('contact-form');
  const successBlock = document.getElementById('form-success');
  const name         = form.name.value.trim();
  const phone        = form.phone.value.trim();
  const service      = form.service.value;
  const message      = form.message.value.trim();

  const text = [
    '🔥 <b>Новая заявка — ХитСервис</b>',
    '',
    `👤 <b>Имя:</b> ${name}`,
    `📞 <b>Телефон:</b> ${phone}`,
    service ? `🔧 <b>Услуга:</b> ${service}` : null,
    message ? `💬 <b>Комментарий:</b> ${message}` : null,
  ].filter(Boolean).join('\n');

  form.querySelectorAll('input, select, textarea, button').forEach(el => {
    el.disabled = true;
  });

  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' }),
  })
    .then(() => {
      form.querySelectorAll('.form-row, .form-group, .consent-block, button[type=submit]').forEach(el => {
        el.style.display = 'none';
      });
      successBlock.style.display = 'block';
    })
    .catch(() => {
      form.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.disabled = false;
      });
      alert('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.');
    });
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
});
