/* ─────────────────────────────────────────
   STARS BACKGROUND
───────────────────────────────────────── */
(function initStars() {
  const container = document.querySelector('.stars');
  if (!container) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  container.appendChild(canvas);

  const STAR_COUNT = 180;
  const stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.4 + 0.2,
        alpha: Math.random(),
        delta: (Math.random() * 0.008 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
        speed: Math.random() * 0.08 + 0.01,
      });
    }
  }

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.alpha += s.delta;
      if (s.alpha <= 0 || s.alpha >= 1) s.delta *= -1;
      s.y += s.speed;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 190, 255, ${Math.max(0, Math.min(1, s.alpha))})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }

  resize();
  createStars();
  drawStars();
  window.addEventListener('resize', () => { resize(); createStars(); });
})();


/* ─────────────────────────────────────────
   SKILLS PROGRESS BAR ANIMATION
   Uses data-width attribute (number 0-100)
   Falls back to inline style width if present
───────────────────────────────────────── */
(function initSkillBars() {
  const bars = document.querySelectorAll('.progress-bar');
  if (!bars.length) return;

  bars.forEach(bar => {
    /* resolve target from data-width OR inline style */
    let target = bar.dataset.width
      ? bar.dataset.width + '%'
      : bar.style.width || '0%';

    bar.dataset.target = target;
    bar.style.width = '0%';
    bar.style.transition = 'none';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      /* force a reflow so the 0% starting point is painted before animating */
      bar.getBoundingClientRect();
      bar.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      bar.style.width = bar.dataset.target;
      observer.unobserve(bar);
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
})();


/* ─────────────────────────────────────────
   SCROLL-REVEAL
───────────────────────────────────────── */
(function initReveal() {
  const selectors = [
    '.about-content', '.skill', '.project-card',
    '.highlight-card', '.preview-card',
    '.contact-info-card', '.contact-form',
    '.resume-block', 'section h2', 'footer'
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 6) * 0.07}s`;
      observer.observe(el);
    });
  });
})();


/* ─────────────────────────────────────────
   CONTACT FORM VALIDATION
───────────────────────────────────────── */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    name:    { el: document.getElementById('name'),    err: document.getElementById('nameError'),    msg: 'Please enter your name.' },
    email:   { el: document.getElementById('email'),   err: document.getElementById('emailError'),   msg: 'Please enter a valid email.' },
    subject: { el: document.getElementById('subject'), err: document.getElementById('subjectError'), msg: 'Please enter a subject.' },
    message: { el: document.getElementById('message'), err: document.getElementById('messageError'), msg: 'Please write a message.' },
  };

  const success = document.getElementById('formSuccess');

  function validate(key) {
    const { el, err, msg } = fields[key];
    let valid = true;

    if (key === 'email') {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
    } else {
      valid = el.value.trim().length > 0;
    }

    if (!valid) {
      err.textContent = msg;
      el.classList.add('input-error');
    } else {
      err.textContent = '';
      el.classList.remove('input-error');
    }
    return valid;
  }

  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('input', () => validate(key));
    fields[key].el.addEventListener('blur',  () => validate(key));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const allValid = Object.keys(fields).map(k => validate(k)).every(Boolean);
    if (!allValid) return;

    const submitBtn = form.querySelector('.btn-submit');
    const btnText   = submitBtn.querySelector('.btn-text');
    btnText.textContent = 'Sending…';
    submitBtn.disabled  = true;

    try {
      const response = await fetch(form.action, {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    new FormData(form),
      });

      if (response.ok) {
        success.textContent = '✓ Message sent! I\'ll get back to you soon.';
        success.classList.add('visible');
        form.reset();
        Object.keys(fields).forEach(k => {
          fields[k].el.classList.remove('input-error');
          fields[k].err.textContent = '';
        });
        setTimeout(() => success.classList.remove('visible'), 6000);
      } else {
        success.textContent = '✗ Something went wrong. Please email me directly.';
        success.style.color = '#f87171';
        success.style.background = 'rgba(248,113,113,0.08)';
        success.style.borderColor = 'rgba(248,113,113,0.2)';
        success.classList.add('visible');
      }
    } catch {
      success.textContent = '✗ Network error. Please try again or email me directly.';
      success.style.color = '#f87171';
      success.classList.add('visible');
    } finally {
      btnText.textContent = 'Send Message';
      submitBtn.disabled  = false;
    }
  });
})();


/* ─────────────────────────────────────────
   CURSOR GLOW
───────────────────────────────────────── */
(function initCursorGlow() {
  const glow = document.createElement('div');
  Object.assign(glow.style, {
    position:     'fixed',
    width:        '320px',
    height:       '320px',
    borderRadius: '50%',
    pointerEvents:'none',
    zIndex:       '0',
    background:   'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)',
    transform:    'translate(-50%, -50%)',
    transition:   'left 0.12s ease, top 0.12s ease',
    top:          '-999px',
    left:         '-999px',
  });
  document.body.appendChild(glow);

  window.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
})();


(function initTypedText() {
  const el = document.querySelector('.typed-text');
  if (!el) return;

  const words = el.dataset.words.split(',');
  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = words[wordIndex];
    el.textContent = current.substring(0, charIndex);

    let delay = deleting ? 50 : 100;

    if (!deleting && charIndex === current.length) {
      deleting = true;
      delay = 2000;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 500;
    } else {
      charIndex += deleting ? -1 : 1;
    }

    setTimeout(tick, delay);
  }

  tick();
})();


(function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('.navbar');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    document.body.classList.toggle('nav-open', open);
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });
})();


(function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
