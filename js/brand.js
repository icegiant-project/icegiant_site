/* IceGiant: small interaction layer shared by every site.
   Everything degrades to readable content when this file never runs. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* A group whose children each enter in turn (article prose, a list of parts). */
  Array.prototype.forEach.call(document.querySelectorAll('[data-reveal-auto]'), function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (!child.hasAttribute('data-reveal')) {
        child.setAttribute('data-reveal', '');
        child.setAttribute('data-delay', String(Math.min(i, 6) * 60));
      }
    });
  });

  /* Entrance for the parts of each section, staggered. */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !reduced) {
    var settle = function (el) {
      el.style.setProperty('--reveal-delay', (parseInt(el.getAttribute('data-delay') || '0', 10)) + 'ms');
      el.classList.add('is-in');
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        settle(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });

    /* Anything already on the first screen appears at once, without waiting. */
    window.requestAnimationFrame(function () {
      revealables.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) { settle(el); io.unobserve(el); }
      });
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Protocol stack: the live thing. Tabs move by click and by arrow key. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-stack]'), function (stack) {
    var tabs = Array.prototype.slice.call(stack.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(stack.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length) return;

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.setAttribute('tabindex', on ? '0' : '-1');
        tab.classList.toggle('is-active', on);
      });
      panels.forEach(function (panel, i) {
        var on = i === index;
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
      });
      if (focus && tabs[index]) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
      });
    });

    var initial = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    select(initial < 0 ? 0 : initial, false);
  });

  /* Project rail: scrolls sideways, snaps, marks the centred panel, arrows work. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-rail]'), function (rail) {
    var items = Array.prototype.slice.call(rail.querySelectorAll('[data-rail-item]'));
    if (!items.length) return;

    function mark() {
      var mid = rail.scrollLeft + rail.clientWidth / 2;
      var best = 0;
      var bestD = Infinity;
      items.forEach(function (item, i) {
        var centre = item.offsetLeft + item.offsetWidth / 2;
        var d = Math.abs(centre - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      items.forEach(function (item, i) { item.classList.toggle('is-active', i === best); });
    }

    rail.addEventListener('scroll', function () {
      window.clearTimeout(rail._t);
      rail._t = window.setTimeout(mark, 80);
    }, { passive: true });

    rail.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      var index = items.findIndex(function (i) { return i.classList.contains('is-active'); });
      var next = event.key === 'ArrowRight' ? index + 1 : index - 1;
      if (!items[next]) return;
      event.preventDefault();
      rail.scrollTo({ left: items[next].offsetLeft - rail.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
      items[next].querySelector('a, button') && items[next].querySelector('a, button').focus({ preventScroll: true });
    });

    mark();
    window.setTimeout(mark, 300);
  });

  /* Pause the atmospheric clip when the visitor asked for less motion. */
  if (reduced) {
    Array.prototype.forEach.call(document.querySelectorAll('video[data-ambient]'), function (video) {
      video.pause();
      video.removeAttribute('autoplay');
    });
  }
})();
