/* app.js — 共享交互逻辑 */

const STORAGE_PREFIX = 'guide2026_';

/* ── localStorage 持久化 ── */
function initStorage() {
  const indicator = document.getElementById('save-indicator');

  document.querySelectorAll('[data-key]').forEach(el => {
    // 恢复已保存内容
    const saved = localStorage.getItem(STORAGE_PREFIX + el.dataset.key);
    if (saved !== null) el.value = saved;

    // 监听输入，自动保存
    el.addEventListener('input', () => {
      localStorage.setItem(STORAGE_PREFIX + el.dataset.key, el.value);
      if (indicator) {
        indicator.textContent = '💾 已自动保存';
        indicator.classList.add('show');
        clearTimeout(indicator._timer);
        indicator._timer = setTimeout(() => indicator.classList.remove('show'), 1800);
      }
    });
  });
}

/* ── 清空所有内容 ── */
function clearAll() {
  if (!confirm('确定要清空所有已填写的内容吗？这个操作不可以恢复哦。')) return;
  Object.keys(localStorage)
    .filter(k => k.startsWith(STORAGE_PREFIX))
    .forEach(k => localStorage.removeItem(k));
  document.querySelectorAll('[data-key]').forEach(el => el.value = '');
  alert('已清空！可以重新开始填写啦 ✨');
}

/* ── 可点击的 tag 插入到最近的输入框 ── */
function initTagInsert() {
  document.querySelectorAll('.tag[data-insert]').forEach(tag => {
    tag.addEventListener('click', () => {
      // 找到最近的 .answer-line
      const container = tag.closest('.dim-card, .section, .think-box');
      const input = container ? container.querySelector('.tag-target') : null;
      if (!input) return;
      const val = input.value.trim();
      input.value = val ? val + '，' + tag.dataset.insert : tag.dataset.insert;
      input.dispatchEvent(new Event('input')); // 触发保存
      tag.style.opacity = '.5';
      setTimeout(() => tag.style.opacity = '1', 600);
    });
  });
}

/* ── 提示词生成器：实时合并 ── */
function initPromptBuilder() {
  const fields = document.querySelectorAll('.pb-field');
  const output = document.getElementById('pb-output');
  const copyBtn = document.getElementById('pb-copy');
  if (!output) return;

  function rebuild() {
    const parts = [];
    fields.forEach(f => { if (f.value.trim()) parts.push(f.value.trim()); });
    output.textContent = parts.length ? parts.join('，') : '（在上面填写各个维度，这里会自动拼成完整的导演指令）';
  }

  fields.forEach(f => {
    f.addEventListener('input', rebuild);
    // 恢复时也重建
    const saved = localStorage.getItem(STORAGE_PREFIX + f.dataset.key);
    if (saved) { f.value = saved; }
  });
  rebuild();

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = output.textContent;
      if (!text || text.startsWith('（')) return;
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = '✅ 已复制！';
        setTimeout(() => copyBtn.textContent = '📋 复制导演指令', 2000);
      });
    });
  }
}

/* ── 画面感测试游戏 ── */
function initGuessGame() {
  document.querySelectorAll('.guess-pair').forEach(pair => {
    const btns = pair.querySelectorAll('.guess-btn');
    const reveal = pair.querySelector('.guess-reveal');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.disabled = true);
        const isRight = btn.dataset.answer === 'good';
        btn.style.background = isRight ? '#C8E6C9' : '#FFCDD2';
        btn.style.border = '2px solid ' + (isRight ? '#66BB6A' : '#EF9A9A');
        // 找到正确答案按钮高亮
        btns.forEach(b => {
          if (b.dataset.answer === 'good') {
            b.style.background = '#C8E6C9';
            b.style.border = '2px solid #66BB6A';
          }
        });
        if (reveal) reveal.style.display = 'block';
      });
    });
  });
}

/* ── 升级工坊：点击等级展开 ── */
function initLevelCards() {
  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      const wasActive = card.classList.contains('active');
      document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
      if (!wasActive) card.classList.add('active');
    });
  });
}

/* ── checklist 点击 ── */
function initChecklist() {
  document.querySelectorAll('.check-box').forEach(box => {
    const key = 'check_' + box.dataset.ckey;
    if (localStorage.getItem(STORAGE_PREFIX + key) === '1') {
      box.textContent = '✅'; applyChecked(box, true);
    }
    box.addEventListener('click', () => {
      const checked = box.textContent !== '✅';
      box.textContent = checked ? '✅' : '☐';
      applyChecked(box, checked);
      localStorage.setItem(STORAGE_PREFIX + key, checked ? '1' : '0');
    });
  });
}
function applyChecked(box, checked) {
  const li = box.closest('li');
  if (!li) return;
  li.style.opacity = checked ? '.55' : '1';
  li.style.textDecoration = checked ? 'line-through' : 'none';
  if (!checked) box.style.border = '2px solid #B0BEC5';
  else box.style.border = 'none';
}

/* ── 初始化入口 ── */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initTagInsert();
  initPromptBuilder();
  initGuessGame();
  initLevelCards();
  initChecklist();

  const clearBtn = document.getElementById('clear-all-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
});
