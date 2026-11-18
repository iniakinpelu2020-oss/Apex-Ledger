(function () {
  'use strict';

  var KEY = 'apex.ledger.v1';
  var DEFAULTS = {
    out: ['Food', 'Rent', 'Transport', 'Bills', 'Fun', 'Health', 'Other'],
    in: ['Salary', 'Refund', 'Gift', 'Other']
  };

  var state = { currency: '\u00a3', entries: [], cats: { out: [], in: [] } };
  var month = '';
  var formType = 'out';

  var el = {
    monthLabel: document.getElementById('monthLabel'),
    prev: document.getElementById('prevMonth'),
    next: document.getElementById('nextMonth'),
    currency: document.getElementById('currency'),
    sumIn: document.getElementById('sumIn'),
    sumOut: document.getElementById('sumOut'),
    sumBal: document.getElementById('sumBal'),
    list: document.getElementById('list'),
    empty: document.getElementById('empty'),
    breakdown: document.getElementById('breakdown'),
    breakdownEmpty: document.getElementById('breakdownEmpty'),
    cat: document.getElementById('cat'),
    catOut: document.getElementById('catOut'),
    catIn: document.getElementById('catIn'),
    amount: document.getElementById('amount'),
    date: document.getElementById('date'),
    note: document.getElementById('note'),
    newCat: document.getElementById('newCat'),
    newCatType: document.getElementById('newCatType'),
    toast: document.getElementById('toast')
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function dayKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function monthOf(iso) {
    return String(iso || '').slice(0, 7);
  }

  function shiftMonth(mk, delta) {
    var parts = String(mk).split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1 + delta, 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1);
  }

  function money(cents) {
    var neg = cents < 0;
    var v = Math.abs(cents) / 100;
    var num = v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (neg ? '-' : '') + state.currency + num;
  }

  function signed(cents) {
    return cents > 0 ? '+' + money(cents) : money(cents);
  }

  function centsFrom(str) {
    var s = String(str).replace(/\s+/g, '').replace(/,/g, '');
    s = s.replace(/[^0-9.]/g, '');
    if (!s) return null;
    var parts = s.split('.');
    if (parts.length > 2) return null;
    var whole = parts[0] || '0';
    var frac = (parts[1] || '') + '00';
    frac = frac.slice(0, 2);
    var n = parseInt(whole, 10) * 100 + parseInt(frac, 10);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }

  function load() {
    var raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (err) {
      raw = null;
    }
    if (!raw || typeof raw !== 'object') raw = {};

    if (typeof raw.currency === 'string' && raw.currency) state.currency = raw.currency;

    state.entries = Array.isArray(raw.entries) ? raw.entries : [];
    state.entries.forEach(function (e) {
      if (!e.id) e.id = uid();
      e.type = e.type === 'in' ? 'in' : 'out';
      e.amount = Math.abs(Math.round(Number(e.amount) || 0));
      if (typeof e.category !== 'string' || !e.category) e.category = 'Other';
      if (typeof e.note !== 'string') e.note = '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date))) e.date = dayKey(new Date());
      if (!e.created) e.created = Date.now();
    });

    var cats = raw.cats && typeof raw.cats === 'object' ? raw.cats : {};
    ['out', 'in'].forEach(function (type) {
      var list = Array.isArray(cats[type]) ? cats[type].filter(function (c) {
        return typeof c === 'string' && c.trim();
      }) : [];
      state.cats[type] = list.length ? list : DEFAULTS[type].slice();
    });
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      toast('Could not save \u2014 storage may be full');
    }
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.toast.hidden = true; }, 2400);
  }

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function inMonth() {
    return state.entries.filter(function (e) { return monthOf(e.date) === month; });
  }

  function renderMonth() {
    var d = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
    el.monthLabel.textContent = d.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }

  function renderSummary() {
    var entries = inMonth();
    var income = 0;
    var spend = 0;
    entries.forEach(function (e) {
      if (e.type === 'in') income += e.amount;
      else spend += e.amount;
    });
    var net = income - spend;

    el.sumIn.textContent = money(income);
    el.sumOut.textContent = money(-spend);
    el.sumBal.textContent = (net < 0 ? '-' : '') + money(Math.abs(net));
    el.sumBal.className = net < 0 ? 'neg' : net > 0 ? 'pos' : '';
  }

  function renderList() {
    var entries = inMonth().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.created - a.created;
    });

    el.list.textContent = '';
    var lastDate = '';

    entries.forEach(function (e) {
      if (e.date !== lastDate) {
        lastDate = e.date;
        var head = node('li', 'dayhead');
        var d = new Date(e.date + 'T00:00:00');
        head.textContent = isNaN(d.getTime())
          ? e.date
          : d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
        el.list.appendChild(head);
      }

      var li = node('li');
      var who = node('div', 'who');
      who.appendChild(node('span', 'name', e.note || (e.type === 'in' ? 'Income' : 'Expense')));
      who.appendChild(node('span', 'sub', e.category));
      li.appendChild(who);

      li.appendChild(node('span', 'chip', e.type === 'in' ? 'In' : 'Out'));

      var amt = node('span', 'amt ' + (e.type === 'in' ? 'pos' : 'neg'),
        e.type === 'in' ? signed(e.amount) : money(-e.amount));
      li.appendChild(amt);

      var del = node('button', 'del', 'Delete');
      del.type = 'button';
      del.setAttribute('aria-label', 'Delete entry ' + (e.note || e.category));
      del.addEventListener('click', function () {
        if (!window.confirm('Delete this entry?')) return;
        state.entries = state.entries.filter(function (x) { return x.id !== e.id; });
        save();
        renderAll();
        toast('Entry deleted');
      });
      li.appendChild(del);

      el.list.appendChild(li);
    });

    el.empty.hidden = entries.length !== 0;
  }

  function renderBreakdown() {
    var totals = {};
    var entries = inMonth();
    entries.forEach(function (e) {
      if (e.type !== 'out') return;
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    var names = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; });
    var max = names.length ? totals[names[0]] : 0;

    el.breakdown.textContent = '';
    names.forEach(function (name) {
      var li = node('li');
      var top = node('div', 'top');
      top.appendChild(node('span', 'n', name));
      top.appendChild(node('span', 'v', money(totals[name])));
      li.appendChild(top);

      var track = node('div', 'track');
      var fill = node('div', 'fill');
      fill.style.width = max ? Math.max(2, Math.round((totals[name] / max) * 100)) + '%' : '0';
      track.appendChild(fill);
      li.appendChild(track);

      el.breakdown.appendChild(li);
    });

    el.breakdownEmpty.hidden = names.length !== 0;
  }

  function renderCatOptions() {
    var previous = el.cat.value;
    el.cat.textContent = '';
    state.cats[formType].forEach(function (name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      el.cat.appendChild(opt);
    });
    if (state.cats[formType].indexOf(previous) !== -1) el.cat.value = previous;
  }

  function renderCats() {
    ['out', 'in'].forEach(function (type) {
      var host = type === 'out' ? el.catOut : el.catIn;
      host.textContent = '';
      state.cats[type].forEach(function (name) {
        var li = node('li');
        li.appendChild(node('span', '', name));
        var del = node('button', '', '\u00d7');
        del.type = 'button';
        del.setAttribute('aria-label', 'Remove category ' + name);
        del.addEventListener('click', function () {
          if (state.cats[type].length <= 1) {
            toast('Keep at least one ' + (type === 'out' ? 'expense' : 'income') + ' category');
            return;
          }
          var used = state.entries.filter(function (e) {
            return e.type === type && e.category === name;
          }).length;
          var question = used
            ? 'Remove "' + name + '"? ' + used + ' existing entr' + (used === 1 ? 'y keeps' : 'ies keep') +
              ' the label but it will not be offered again.'
            : 'Remove the "' + name + '" category?';
          if (!window.confirm(question)) return;
          state.cats[type] = state.cats[type].filter(function (c) { return c !== name; });
          save();
          renderAll();
          toast('Category removed');
        });
        li.appendChild(del);
        host.appendChild(li);
      });
    });
  }

  function renderAll() {
    renderMonth();
    renderSummary();
    renderList();
    renderBreakdown();
    renderCatOptions();
    renderCats();
  }

  function setType(type) {
    formType = type;
    document.querySelectorAll('[data-type]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-type') === type ? 'true' : 'false');
    });
    renderCatOptions();
  }

  document.querySelectorAll('[data-type]').forEach(function (btn) {
    btn.addEventListener('click', function () { setType(btn.getAttribute('data-type')); });
  });

  el.prev.addEventListener('click', function () {
    month = shiftMonth(month, -1);
    renderAll();
  });

  el.next.addEventListener('click', function () {
    month = shiftMonth(month, 1);
    renderAll();
  });

  el.monthLabel.title = 'Jump to this month';
  el.monthLabel.style.cursor = 'pointer';
  el.monthLabel.addEventListener('click', function () {
    month = monthOf(dayKey(new Date()));
    renderAll();
  });

  el.currency.addEventListener('change', function () {
    state.currency = el.currency.value;
    save();
    renderAll();
  });

  document.getElementById('entryForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var cents = centsFrom(el.amount.value);
    if (cents === null) {
      toast('Enter an amount greater than zero');
      el.amount.focus();
      return;
    }
    var date = el.date.value || dayKey(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast('Pick a valid date');
      return;
    }
    state.entries.push({
      id: uid(),
      type: formType,
      amount: cents,
      category: el.cat.value || 'Other',
      note: el.note.value.trim(),
      date: date,
      created: Date.now()
    });
    save();
    month = monthOf(date);
    el.amount.value = '';
    el.note.value = '';
    el.amount.focus();
    renderAll();
    toast((formType === 'in' ? 'Income' : 'Expense') + ' added');
  });

  document.getElementById('catForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var type = el.newCatType.value === 'in' ? 'in' : 'out';
    var name = el.newCat.value.trim();
    if (!name) return;
    var exists = state.cats[type].some(function (c) {
      return c.toLowerCase() === name.toLowerCase();
    });
    if (exists) {
      toast('That category already exists');
      return;
    }
    state.cats[type].push(name);
    save();
    el.newCat.value = '';
    if (formType === type) renderCatOptions();
    renderCats();
    toast('Category added');
  });

  month = monthOf(dayKey(new Date()));
  el.date.value = dayKey(new Date());
  setType('out');
  load();
  el.currency.value = state.currency;
  if (!el.currency.value) {
    el.currency.value = '\u00a3';
    state.currency = '\u00a3';
  }
  renderAll();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
