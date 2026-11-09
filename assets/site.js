const search = document.querySelector('#search');
const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('[data-category]')];
let category = 'all';
function updateCards() {
  const query = search.value.trim().toLowerCase();
  for (const card of cards) {
    const matchesCategory = category === 'all' || category === card.dataset.category;
    card.hidden = !matchesCategory || !card.textContent.toLowerCase().includes(query);
  }
  document.querySelector('#empty').hidden = cards.some(card => !card.hidden);
}
search.addEventListener('input', updateCards);
for (const button of filters) {
  button.addEventListener('click', () => {
    category = button.dataset.filter;
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
    updateCards();
  });
}
for (const button of document.querySelectorAll('[data-answer]')) {
  button.addEventListener('click', () => {
    document.querySelector('#feedback').textContent = button.dataset.answer === 'yes'
      ? '答對了。身體是否蹲低、附近是否有退路，都能幫助判讀。'
      : '再想想。耳朵是一個線索，也可以看看姿勢和環境。';
  });
}
