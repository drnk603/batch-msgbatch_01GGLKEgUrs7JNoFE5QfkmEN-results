(function (global) {
  'use strict';

  global.__app = global.__app || {};
  var app = global.__app;

  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    var lastCall = 0;
    return function () {
      var now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        fn.apply(this, arguments);
      }
    };
  }

  function initPerformance() {
    if (app.perfReady) return;
    app.perfReady = true;

    var supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function () {
          supportsPassive = true;
        }
      });
      global.addEventListener('testPassive', null, opts);
      global.removeEventListener('testPassive', null, opts);
    } catch (e) {}

    app.passiveOpts = supportsPassive ? { passive: true } : false;
  }

  function initBurger() {
    if (app.burgerReady) return;
    app.burgerReady = true;

    var toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    var navCollapse = document.querySelector('.navbar-collapse');
    var navLinks = document.querySelectorAll('.navbar-nav .nav-link, .c-nav__link');

    if (!toggle) return;

    var overlay = document.createElement('div');
    overlay.className = 'c-mobile-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    function isMenuOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function openMenu() {
      toggle.setAttribute('aria-expanded', 'true');
      if (navCollapse) {
        navCollapse.classList.add('show');
        navCollapse.classList.remove('collapsing');
      }
      overlay.classList.add('is-active');
      document.body.classList.add('u-no-scroll');
    }

    function closeMenu() {
      toggle.setAttribute('aria-expanded', 'false');
      if (navCollapse) {
        navCollapse.classList.remove('show');
        navCollapse.classList.remove('collapsing');
      }
      overlay.classList.remove('is-active');
      document.body.classList.remove('u-no-scroll');
    }

    toggle.addEventListener('click', function () {
      if (isMenuOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay.addEventListener('click', function () {
      closeMenu();
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (global.innerWidth < 768) {
          closeMenu();
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (!isMenuOpen()) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeMenu();
        toggle.focus();
      }
    });

    var handleResize = debounce(function () {
      if (global.innerWidth >= 768) {
        closeMenu();
      }
    }, 150);

    global.addEventListener('resize', handleResize);
  }

  function initScrollSpy() {
    if (app.scrollSpyReady) return;
    app.scrollSpyReady = true;

    var navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"], .c-nav__link[href^="#"]');
    if (!navLinks.length) return;

    function getHeaderHeight() {
      var header = document.querySelector('.l-header');
      return header ? header.getBoundingClientRect().height : 72;
    }

    function onScroll() {
      var scrollPos = global.pageYOffset || document.documentElement.scrollTop;
      var headerHeight = getHeaderHeight();
      var current = '';

      navLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;
        var id = href.replace(/^.*#/, '');
        var section = document.getElementById(id);
        if (!section) return;
        var sectionTop = section.getBoundingClientRect().top + global.pageYOffset - headerHeight - 10;
        if (scrollPos >= sectionTop) {
          current = id;
        }
      });

      navLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href) return;
        var id = href.replace(/^.*#/, '');
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
        if (id === current) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }

    global.addEventListener('scroll', throttle(onScroll, 100), app.passiveOpts || false);
  }

  function initAnchors() {
    if (app.anchorsReady) return;
    app.anchorsReady = true;

    function getHeaderHeight() {
      var header = document.querySelector('.l-header');
      return header ? header.getBoundingClientRect().height : 72;
    }

    document.addEventListener('click', function (e) {
      var target = e.target.closest('a[href^="#"]');
      if (!target) return;

      var href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      var sectionId = href.replace(/^.*#/, '');
      var section = document.getElementById(sectionId);
      if (!section) return;

      e.preventDefault();

      var headerHeight = getHeaderHeight();
      var sectionTop = section.getBoundingClientRect().top + global.pageYOffset;
      var scrollTarget = sectionTop - headerHeight;

      global.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    });
  }

  function initActiveMenu() {
    if (app.activeMenuReady) return;
    app.activeMenuReady = true;

    var navLinks = document.querySelectorAll('.navbar-nav .nav-link, .c-nav__link');
    if (!navLinks.length) return;

    var currentPath = location.pathname.replace(//$/, '') || '/';
    var isHome =
      currentPath === '' ||
      currentPath === '/' ||
      currentPath === '/index.html';

    var hasHashLinks = false;
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.indexOf('#') === 0) {
        hasHashLinks = true;
      }
    });

    if (hasHashLinks) return;

    navLinks.forEach(function (link) {
      link.removeAttribute('aria-current');
      link.classList.remove('is-active');

      var href = link.getAttribute('href');
      if (!href) return;

      var normalizedHref = href.replace(//$/, '') || '/';
      var isLinkHome =
        normalizedHref === '' ||
        normalizedHref === '/' ||
        normalizedHref === '/index.html';

      var isMatch = false;

      if (isHome && isLinkHome) {
        isMatch = true;
      } else if (
        !isHome &&
        !isLinkHome &&
        normalizedHref !== '' &&
        currentPath.indexOf(normalizedHref) === 0
      ) {
        isMatch = true;
      }

      if (isMatch) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      }
    });
  }

  function initScrollToTop() {
    if (app.scrollToTopReady) return;
    app.scrollToTopReady = true;

    var btn = document.getElementById('scroll-to-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'scroll-to-top';
      btn.className = 'c-scroll-top';
      btn.setAttribute('aria-label', 'Scroll to top');
      btn.setAttribute('type', 'button');
      document.body.appendChild(btn);
    }

    function updateVisibility() {
      var scrolled = global.pageYOffset || document.documentElement.scrollTop;
      if (scrolled > 400) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }

    btn.addEventListener('click', function () {
      global.scrollTo({ top: 0, behavior: 'smooth' });
    });

    global.addEventListener('scroll', throttle(updateVisibility, 100), app.passiveOpts || false);
    updateVisibility();
  }

  function initNavbarScroll() {
    if (app.navbarScrollReady) return;
    app.navbarScrollReady = true;

    var navbar = document.querySelector('.navbar, .l-header');
    if (!navbar) return;

    function onScroll() {
      var scrolled = global.pageYOffset || document.documentElement.scrollTop;
      if (scrolled > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    global.addEventListener('scroll', throttle(onScroll, 100), app.passiveOpts || false);
    onScroll();
  }

  function initCookieBanner() {
    if (app.cookieReady) return;
    app.cookieReady = true;

    var banner = document.getElementById('cookieBanner');
    if (!banner) return;

    var acceptBtn = document.getElementById('cookieAccept');
    var dismissed = false;

    try {
      dismissed = !!localStorage.getItem('cookie_accepted');
    } catch (e) {}

    if (dismissed) {
      banner.style.display = 'none';
      return;
    }

    banner.classList.add('is-visible');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        try {
          localStorage.setItem('cookie_accepted', '1');
        } catch (e) {}
        banner.classList.remove('is-visible');
        banner.classList.add('is-hidden');
        setTimeout(function () {
          if (banner.parentNode) banner.style.display = 'none';
        }, 400);
      });
    }

    var declineLinks = banner.querySelectorAll('a.c-button--outline, a[href*="cookie"]');
    declineLinks.forEach(function (link) {
      if (link.getAttribute('href') && link.getAttribute('href').indexOf('cookie') !== -1) return;
      link.addEventListener('click', function () {
        banner.classList.remove('is-visible');
        banner.classList.add('is-hidden');
        setTimeout(function () {
          if (banner.parentNode) banner.style.display = 'none';
        }, 400);
      });
    });
  }

  function initCountUp() {
    if (app.countUpReady) return;
    app.countUpReady = true;

    var stats = document.querySelectorAll('.c-stat__number[data-count]');
    if (!stats.length) return;

    var started = {};

    function animateCount(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1800;
      var start = null;
      var startVal = 0;

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(startVal + (target - startVal) * ease);
        el.textContent = current + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target + suffix;
        }
      }

      requestAnimationFrame(step);
    }

    function checkStats() {
      stats.forEach(function (el) {
        if (started[el]) return;
        var rect = el.getBoundingClientRect();
        if (rect.top < global.innerHeight && rect.bottom > 0) {
          started[el] = true;
          animateCount(el);
        }
      });
    }

    global.addEventListener('scroll', throttle(checkStats, 150), app.passiveOpts || false);
    checkStats();
  }

  function initPrivacyModal() {
    if (app.privacyModalReady) return;
    app.privacyModalReady = true;

    var overlay = document.getElementById('privacy-modal-overlay');
    var modal = document.getElementById('privacy-modal');

    var policyLinks = document.querySelectorAll(
      'a.c-form__policy-link, a.c-form__consent-link, a[data-modal="privacy"]'
    );

    if (!policyLinks.length) return;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'privacy-modal-overlay';
      overlay.className = 'c-modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'privacy-modal-title');
      overlay.setAttribute('tabindex', '-1');

      var inner = document.createElement('div');
      inner.className = 'c-modal';
      inner.id = 'privacy-modal';

      var header = document.createElement('div');
      header.className = 'c-modal__header';

      var title = document.createElement('h2');
      title.id = 'privacy-modal-title';
      title.className = 'c-modal__title';
      title.textContent = 'Privacy Policy';

      var closeBtn = document.createElement('button');
      closeBtn.className = 'c-modal__close';
      closeBtn.setAttribute('type', 'button');
      closeBtn.setAttribute('aria-label', 'Close privacy policy');
      closeBtn.id = 'privacy-modal-close';

      header.appendChild(title);
      header.appendChild(closeBtn);

      var body = document.createElement('div');
      body.className = 'c-modal__body';
      body.innerHTML =
        '<p>We are committed to protecting your personal data. By using this site and submitting forms, you agree to our data processing practices.</p>' +
        '<p>Your information is used solely to respond to your enquiries and is never sold to third parties.</p>' +
        '<p>You have the right to access, rectify, or erase your personal data at any time. For full details, please visit our <a href="privacy.html" class="c-link">Privacy Policy page</a>.</p>';

      inner.appendChild(header);
      inner.appendChild(body);
      overlay.appendChild(inner);
      document.body.appendChild(overlay);
    }

    function openModal() {
      overlay.classList.add('is-open');
      document.body.classList.add('u-no-scroll');
      overlay.focus();
    }

    function closeModal() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('u-no-scroll');
    }

    policyLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (link.getAttribute('href') === 'privacy.html' || (link.getAttribute('href') || '').indexOf('privacy') !== -1) return;
        e.preventDefault();
        openModal();
      });
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeModal();
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'privacy-modal-close') {
        closeModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeModal();
      }
    });
  }

  function createNotifyContainer() {
    var existing = document.getElementById('notify-container');
    if (existing) return existing;

    var container = document.createElement('div');
    container.id = 'notify-container';
    container.className = 'c-notify-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
  }

  app.notify = function (message, type) {
    var container = createNotifyContainer();
    var alertType = type || 'info';
    var el = document.createElement('div');
    el.className = 'c-notify c-notify--' + alertType;
    el.setAttribute('role', 'alert');

    var text = document.createElement('span');
    text.textContent = message || '';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'c-notify__close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.addEventListener('click', function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    el.appendChild(text);
    el.appendChild(closeBtn);
    container.appendChild(el);

    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 6000);
  };

  function showFieldError(errorEl, message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    var inputId = errorEl.id.replace(/-error$/, '');
    var input = document.getElementById(inputId);
    if (!input) {
      var describedBy = errorEl.getAttribute('id');
      input = document.querySelector('[aria-describedby="' + describedBy + '"]');
    }
    if (input) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
    }
  }

  function clearFieldError(errorEl) {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    var inputId = errorEl.id.replace(/-error$/, '');
    var input = document.getElementById(inputId);
    if (!input) {
      var describedBy = errorEl.getAttribute('id');
      input = document.querySelector('[aria-describedby="' + describedBy + '"]');
    }
    if (input) {
      input.classList.remove('is-invalid');
    }
  }

  var RE_EMAIL = /^[^s@]+@[^s@]+.[^s@]+$/;
  var RE_PHONE = /^[+-ds()[]]{7,20}$/;
  var RE_URL = /^https?://.+/;

  function validateName(value) {
    return value.trim().length >= 1;
  }

  function validateEmail(value) {
    return RE_EMAIL.test(value.trim());
  }

  function validatePhone(value) {
    if (!value || value.trim() === '') return true;
    return RE_PHONE.test(value.trim());
  }

  function validateMessage(value) {
    return value.trim().length >= 10;
  }

  function validateUrl(value) {
    if (!value || value.trim() === '') return true;
    return RE_URL.test(value.trim());
  }

  function validateSelect(value) {
    return value && value.trim() !== '' && value.trim() !== '0';
  }

  function setSubmitLoading(btn, originalText) {
    btn.disabled = true;
    btn.setAttribute('data-original-text', originalText);
    btn.textContent = 'Sending\u2026';
    btn.classList.add('is-loading');
  }

  function resetSubmitBtn(btn) {
    btn.disabled = false;
    btn.textContent = btn.getAttribute('data-original-text') || 'Submit';
    btn.classList.remove('is-loading');
  }

  function handleFormSubmit(formId, fields, onValidate, onSuccess) {
    var form = document.getElementById(formId);
    if (!form) return;
    if (form.dataset.jsInit) return;
    form.dataset.jsInit = 'true';
    form.setAttribute('novalidate', '');

    var honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = '_hp_field';
    honeypot.setAttribute('tabindex', '-1');
    honeypot.setAttribute('autocomplete', 'off');
    honeypot.className = 'c-form__honeypot';
    form.appendChild(honeypot);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (honeypot.value !== '') return;

      var valid = true;
      var firstError = null;

      fields.forEach(function (f) {
        var el = document.getElementById(f.id);
        var errorEl = document.getElementById(f.errorId);
        if (!el) return;

        clearFieldError(errorEl);

        var value = f.type === 'checkbox' ? el.checked : el.value;
        var result = f.validate(value);

        if (result !== true) {
          valid = false;
          showFieldError(errorEl, result);
          if (!firstError) firstError = el;
        }
      });

      if (!valid) {
        if (firstError) firstError.focus();
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : 'Submit';
      if (submitBtn) setSubmitLoading(submitBtn, originalText);

      setTimeout(function () {
        if (!navigator.onLine) {
          app.notify('Connection error, please try again later.', 'danger');
          if (submitBtn) resetSubmitBtn(submitBtn);
          return;
        }

        global.location.href = 'thank_you.html';
      }, 800);
    });
  }

  function initContactForm() {
    if (app.contactFormReady) return;
    app.contactFormReady = true;

    var fields = [
      {
        id: 'contact-first-name',
        errorId: 'first-name-error',
        type: 'text',
        validate: function (v) {
          return validateName(v) ? true : 'Please enter your first name.';
        }
      },
      {
        id: 'contact-last-name',
        errorId: 'last-name-error',
        type: 'text',
        validate: function (v) {
          return validateName(v) ? true : 'Please enter your last name.';
        }
      },
      {
        id: 'contact-email',
        errorId: 'email-error',
        type: 'email',
        validate: function (v) {
          if (!v.trim()) return 'Please enter your email address.';
          return validateEmail(v) ? true : 'Please enter a valid email address.';
        }
      },
      {
        id: 'contact-phone',
        errorId: 'phone-hint',
        type: 'tel',
        validate: function (v) {
          return validatePhone(v) ? true : 'Please enter a valid phone number (digits, spaces, +, -, brackets).';
        }
      },
      {
        id: 'contact-subject',
        errorId: 'subject-error',
        type: 'select',
        validate: function (v) {
          return validateSelect(v) ? true : 'Please select a subject.';
        }
      },
      {
        id: 'contact-message',
        errorId: 'message-error',
        type: 'textarea',
        validate: function (v) {
          if (!v.trim()) return 'Please enter your message.';
          return validateMessage(v) ? true : 'Your message must be at least 10 characters.';
        }
      },
      {
        id: 'contact-consent',
        errorId: 'consent-error',
        type: 'checkbox',
        validate: function (v) {
          return v === true ? true : 'Please accept the privacy policy to continue.';
        }
      }
    ];

    handleFormSubmit('contact-form', fields);
  }

  function initNewsletterForm() {
    if (app.newsletterFormReady) return;
    app.newsletterFormReady = true;

    var form = document.getElementById('newsletterForm');
    if (!form) return;
    if (form.dataset.jsInit) return;
    form.dataset.jsInit = 'true';
    form.setAttribute('novalidate', '');

    var honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = '_hp_field';
    honeypot.setAttribute('tabindex', '-1');
    honeypot.setAttribute('autocomplete', 'off');
    honeypot.className = 'c-form__honeypot';
    form.appendChild(honeypot);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (honeypot.value !== '') return;

      var emailEl = document.getElementById('newsletter-email');
      var emailError = document.getElementById('newsletter-email-error');
      var consentEl = document.getElementById('newsletter-consent');
      var consentError = document.getElementById('newsletter-consent-error');
      var valid = true;
      var firstError = null;

      clearFieldError(emailError);
      clearFieldError(consentError);

      if (!emailEl || !emailEl.value.trim()) {
        valid = false;
        showFieldError(emailError, 'Please enter your email address.');
        if (!firstError) firstError = emailEl;
      } else if (!validateEmail(emailEl.value)) {
        valid = false;
        showFieldError(emailError, 'Please enter a valid email address.');
        if (!firstError) firstError = emailEl;
      }

      if (!consentEl || !consentEl.checked) {
        valid = false;
        showFieldError(consentError, 'Please accept the terms to subscribe.');
        if (!firstError) firstError = consentEl;
      }

      if (!valid) {
        if (firstError) firstError.focus();
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : 'Subscribe';
      if (submitBtn) setSubmitLoading(submitBtn, originalText);

      setTimeout(function () {
        if (!navigator.onLine) {
          app.notify('Connection error, please try again later.', 'danger');
          if (submitBtn) resetSubmitBtn(submitBtn);
          return;
        }
        global.location.href = 'thank_you.html';
      }, 800);
    });
  }

  function initApplicationForm() {
    if (app.applicationFormReady) return;
    app.applicationFormReady = true;

    var fields = [
      {
        id: 'apply-first-name',
        errorId: 'apply-first-name-error',
        type: 'text',
        validate: function (v) {
          return validateName(v) ? true : 'Please enter your first name.';
        }
      },
      {
        id: 'apply-last-name',
        errorId: 'apply-last-name-error',
        type: 'text',
        validate: function (v) {
          return validateName(v) ? true : 'Please enter your last name.';
        }
      },
      {
        id: 'apply-email',
        errorId: 'apply-email-error',
        type: 'email',
        validate: function (v) {
          if (!v.trim()) return 'Please enter your email address.';
          return validateEmail(v) ? true : 'Please enter a valid email address.';
        }
      },
      {
        id: 'apply-phone',
        errorId: 'apply-phone-error',
        type: 'tel',
        validate: function (v) {
          return validatePhone(v) ? true : 'Please enter a valid phone number.';
        }
      },
      {
        id: 'apply-position',
        errorId: 'apply-position-error',
        type: 'select',
        validate: function (v) {
          return validateSelect(v) ? true : 'Please select a position.';
        }
      },
      {
        id: 'apply-linkedin',
        errorId: 'apply-linkedin-error',
        type: 'url',
        validate: function (v) {
          return validateUrl(v) ? true : 'Please enter a valid URL (starting with http:// or https://).';
        }
      },
      {
        id: 'apply-message',
        errorId: 'apply-message-error',
        type: 'textarea',
        validate: function (v) {
          if (!v.trim()) return 'Please write a short cover letter or message.';
          return validateMessage(v) ? true : 'Your message must be at least 10 characters.';
        }
      },
      {
        id: 'apply-consent',
        errorId: 'apply-consent-error',
        type: 'checkbox',
        validate: function (v) {
          return v === true ? true : 'Please accept the privacy policy to continue.';
        }
      }
    ];

    handleFormSubmit('application-form', fields);
  }

  function initChatbot() {
    if (app.chatbotReady) return;
    app.chatbotReady = true;

    var widget = document.getElementById('chatbot-widget');
    var toggleBtn = document.getElementById('chatbot-toggle');
    var panel = document.getElementById('chatbot-panel');
    var closeBtn = document.getElementById('chatbot-close');
    var input = document.getElementById('chatbot-input');
    var sendBtn = document.getElementById('chatbot-send');

    if (!widget || !toggleBtn || !panel) return;

    function openPanel() {
      panel.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      if (input) input.focus();
    }

    function closePanel() {
      panel.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', function () {
      if (panel.classList.contains('is-open')) {
        closePanel();
      } else {
        openPanel();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closePanel();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        closePanel();
        toggleBtn.focus();
      }
    });

    if (sendBtn && input) {
      function sendMessage() {
        var msg = input.value.trim();
        if (!msg) return;
        input.value = '';
        var body = panel.querySelector('.c-chatbot__messages') || panel;
        var msgEl = document.createElement('div');
        msgEl.className = 'c-chatbot__message c-chatbot__message--user';
        msgEl.textContent = msg;
        body.appendChild(msgEl);
        body.scrollTop = body.scrollHeight;
      }

      sendBtn.addEventListener('click', sendMessage);

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  function initRipple() {
    if (app.rippleReady) return;
    app.rippleReady = true;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.c-button, .btn');
      if (!btn) return;

      var existing = btn.querySelector('.c-ripple');
      if (existing) existing.parentNode.removeChild(existing);

      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      var ripple = document.createElement('span');
      ripple.className = 'c-ripple';
      ripple.dataset.x = x;
      ripple.dataset.y = y;
      btn.appendChild(ripple);

      setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 600);
    });
  }

  function initImages() {
    if (app.imagesReady) return;
    app.imagesReady = true;

    var images = document.querySelectorAll('img:not([loading])');
    images.forEach(function (img) {
      var isLogo = img.classList.contains('c-logo__img') || img.closest('.c-logo') !== null;
      var isCritical = img.hasAttribute('data-critical');
      if (!isLogo && !isCritical) {
        img.setAttribute('loading', 'lazy');
      }
    });

    var videos = document.querySelectorAll('video:not([loading])');
    videos.forEach(function (video) {
      video.setAttribute('loading', 'lazy');
    });
  }

  function initLegalAnchors() {
    if (app.legalAnchorsReady) return;
    app.legalAnchorsReady = true;

    var legalLinks = document.querySelectorAll('.c-legal__link[href^="#"], .c-link[href^="#"]');
    if (!legalLinks.length) return;
  }

  app.init = function () {
    if (app.initialized) return;
    app.initialized = true;

    initPerformance();
    initBurger();
    initNavbarScroll();
    initAnchors();
    initScrollSpy();
    initActiveMenu();
    initScrollToTop();
    initCookieBanner();
    initCountUp();
    initPrivacyModal();
    initImages();
    initContactForm();
    initNewsletterForm();
    initApplicationForm();
    initChatbot();
    initRipple();
    initLegalAnchors();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      app.init();
    });
  } else {
    app.init();
  }
})(window);
