let timer;
export function toast(texto) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = texto;
  el.classList.add('visivel');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('visivel'), 2600);
}
