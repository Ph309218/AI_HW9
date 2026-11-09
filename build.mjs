import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));

const categories = { body: '肢體語言', habit: '日常習慣', play: '活動遊戲' };
const directory = 'data/behaviors';
const validText = value => typeof value === 'string' && value.trim().length > 0;
const behaviors = readdirSync(directory).filter(name => name.endsWith('.json')).sort().map(name => {
  const item = JSON.parse(readFileSync(directory + '/' + name, 'utf8'));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || name !== item.slug + '.json'
    || !Object.hasOwn(categories, item.category)
    || !['title', 'summary', 'observation', 'caution'].every(key => validText(item[key]))
    || !Array.isArray(item.contexts) || !item.contexts.length
    || !item.contexts.every(value => validText(value?.situation) && validText(value?.meaning))
    || !Array.isArray(item.sources) || !item.sources.length
    || !item.sources.every(value => validText(value?.title) && validText(value?.url) && URL.canParse(value.url) && new URL(value.url).protocol === 'https:')) {
    throw new Error('資料格式錯誤：' + name);
  }
  return item;
});
const escape = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const template = (name, values) => readFileSync('templates/' + name + '.html', 'utf8')
  .replace(/{{(\w+)}}/g, (_, key) => values[key]);
function page(title, body, prefix = '') {
  return '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + escape(title) + '</title><link rel="stylesheet" href="' + prefix + 'assets/site.css"></head>'
    + '<body><header><nav aria-label="主選單"><a href="' + prefix + 'index.html">喵星人研究所</a><span><a href="'
    + prefix + 'index.html#catalog">圖鑑</a><a href="' + prefix + 'index.html#quiz">小測驗</a></span></nav></header>'
    + '<main>' + body + '</main><footer><p>喵星人研究所 · 貓咪行為觀察筆記</p></footer>'
    + (prefix ? '' : '<script src="assets/site.js" defer></script>') + '</body></html>';
}
mkdirSync('docs/behaviors', { recursive: true });
cpSync('assets', 'docs/assets', { recursive: true });
writeFileSync('docs/.nojekyll', '');
function behaviorImage(item, prefix = '') {
  if (!validText(item.imageAlt)) return '';
  return '<figure class="behavior-image"><img src="' + prefix + 'assets/' + item.slug
    + '.png" alt="' + escape(item.imageAlt) + '" width="1536" height="1024" loading="lazy">'
    + '<figcaption>AI 生成行為示意圖</figcaption></figure>';
}
const expected = new Set(behaviors.map(item => item.slug + '.html'));
for (const file of readdirSync('docs/behaviors')) {
  if (file.endsWith('.html') && !expected.has(file)) unlinkSync('docs/behaviors/' + file);
}
for (const item of behaviors) {
  const body = template('detail', {
    image: behaviorImage(item, '../'), category: categories[item.category], title: escape(item.title), summary: escape(item.summary),
    observation: escape(item.observation), caution: escape(item.caution),
    contexts: item.contexts.map(entry => '<p><strong>' + escape(entry.situation) + '</strong><br>' + escape(entry.meaning) + '</p>').join(''),
    sources: item.sources.map(source => '<li><a href="' + escape(source.url) + '">' + escape(source.title) + '</a></li>').join('')
  });
  writeFileSync('docs/behaviors/' + item.slug + '.html', page(item.title + '｜喵星人研究所', body, '../'));
}
const filters = Object.entries({ all: '全部', ...categories }).map(([id, label]) =>
  '<button class="pill" data-filter="' + id + '" aria-pressed="' + (id === 'all') + '">' + label + '</button>').join('');
const cards = behaviors.map(item =>
  '<article class="card" data-category="' + item.category + '"><p class="kicker">' + categories[item.category]
  + '</p>' + behaviorImage(item) + '<h3>' + escape(item.title) + '</h3><p>' + escape(item.summary) + '</p><a href="behaviors/' + item.slug
  + '.html" aria-label="閱讀' + escape(item.title) + '">閱讀筆記 →</a></article>').join('');
writeFileSync('docs/index.html', page('喵星人研究所｜貓咪行為圖鑑', template('home', { filters, cards })));
console.log('已產生 ' + behaviors.length + ' 篇行為筆記。');
