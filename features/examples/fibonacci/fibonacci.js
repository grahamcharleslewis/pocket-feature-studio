const MAX_DIGITS = 200;

const form = document.getElementById('fib-form');
const input = document.getElementById('max');
const error = document.getElementById('max-error');
const results = document.getElementById('results');

// Every Fibonacci number <= max, starting 0, 1, 1, 2, …
// BigInt keeps very large limits exact.
function fibonacciUpTo(max) {
  const series = [];
  for (let a = 0n, b = 1n; a <= max; [a, b] = [b, a + b]) series.push(a);
  return series;
}

// Accepts digits with optional spaces, commas or underscores as separators.
function parseLimit(raw) {
  const digits = raw.trim().replace(/[\s,_]/g, '');
  if (!digits) return { error: 'Enter a number.' };
  if (!/^\d+$/.test(digits)) return { error: 'Use whole numbers only (0, 1, 2, …).' };
  if (digits.replace(/^0+(?=\d)/, '').length > MAX_DIGITS) return { error: `Keep it to ${MAX_DIGITS} digits or fewer.` };
  return { value: BigInt(digits) };
}

const format = (n) => n.toLocaleString();

function stat(label, value) {
  const div = document.createElement('div');
  div.className = 'card fib-stat';
  const dt = document.createElement('span');
  dt.className = 'fib-stat__label';
  dt.textContent = label;
  const dd = document.createElement('span');
  dd.className = 'fib-stat__value';
  dd.textContent = value;
  div.append(dt, dd);
  return div;
}

function show(max) {
  const series = fibonacciUpTo(max);
  const sum = series.reduce((s, n) => s + n, 0n);

  document.getElementById('results-title').textContent = `Fibonacci numbers up to ${format(max)}`;
  document.getElementById('stats').replaceChildren(
    stat('Terms', format(series.length)),
    stat('Largest', format(series.at(-1))),
    stat('Sum', format(sum)),
  );
  document.getElementById('series').replaceChildren(...series.map((n) => {
    const li = document.createElement('li');
    li.textContent = format(n);
    return li;
  }));
  results.hidden = false;
}

function setError(message) {
  error.textContent = message ?? '';
  error.hidden = !message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const { value, error: message } = parseLimit(input.value);
  setError(message);
  if (message) {
    results.hidden = true;
    input.focus();
    return;
  }
  show(value);
  history.replaceState(null, '', `?max=${value}`);
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

input.addEventListener('input', () => setError());

// Restore from ?max= so results can be bookmarked or shared.
const initial = new URLSearchParams(location.search).get('max');
if (initial) {
  input.value = initial;
  const { value, error: message } = parseLimit(initial);
  setError(message);
  if (!message) show(value);
}
