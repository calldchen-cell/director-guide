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

/* ── 故事内容跨页回显（#4）── */
function initStoryContext() {
  const map = {
    'ctx_title':  'story_title',
    'ctx_scene1': 'story_scene1',
    'ctx_scene2': 'story_scene2',
    'ctx_scene3': 'story_scene3',
  };
  Object.entries(map).forEach(([ctxId, storyKey]) => {
    const el = document.getElementById(ctxId);
    if (!el) return;
    const val = localStorage.getItem(STORAGE_PREFIX + storyKey);
    el.textContent = (val && val.trim()) ? val : '（还没填写，去第一幕补上）';
    el.style.color = (val && val.trim()) ? '#333' : '#BDBDBD';
  });
}

/* ── 提示词自检清单（#5）── */
function initPromptChecklist() {
  document.querySelectorAll('.prompt-checklist').forEach(list => {
    const badge = list.nextElementSibling;
    const items = list.querySelectorAll('.pcheck-item');
    const groupKey = list.dataset.group;

    // 恢复已保存状态
    items.forEach((item, i) => {
      const key = STORAGE_PREFIX + 'pcheck_' + groupKey + '_' + i;
      if (localStorage.getItem(key) === '1') item.classList.add('checked');
    });
    checkBadge();

    items.forEach((item, i) => {
      item.addEventListener('click', () => {
        item.classList.toggle('checked');
        localStorage.setItem(
          STORAGE_PREFIX + 'pcheck_' + groupKey + '_' + i,
          item.classList.contains('checked') ? '1' : '0'
        );
        checkBadge();
      });
    });

    function checkBadge() {
      const allChecked = Array.from(items).every(it => it.classList.contains('checked'));
      if (badge && badge.classList.contains('pcheck-badge')) {
        badge.classList.toggle('show', allChecked);
      }
    }
  });
}

/* ── 里程碑庆祝 Toast（#2）── */
function showMilestoneToast(message, toastKey) {
  if (localStorage.getItem(STORAGE_PREFIX + toastKey) === '1') return;
  const toast = document.createElement('div');
  toast.className = 'milestone-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  localStorage.setItem(STORAGE_PREFIX + toastKey, '1');
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function initMilestone() {
  // 01_story.html：故事框架完成
  const storyKeys = ['story_title', 'story_one', 'story_scene1'];
  if (storyKeys.every(k => {
    const v = localStorage.getItem(STORAGE_PREFIX + k);
    return v && v.trim();
  })) {
    const allFilled = () => storyKeys.every(k => {
      const el = document.querySelector('[data-key="' + k + '"]');
      return el && el.value.trim();
    });
    if (allFilled()) {
      showMilestoneToast('🏐 满意，故事框架完成！就像赛前排兵布阵，你已经准备好了！', 'ms_story');
    }
  }
  document.querySelectorAll('[data-key="story_title"],[data-key="story_one"],[data-key="story_scene1"]')
    .forEach(el => {
      el.addEventListener('input', () => {
        const allFilled = storyKeys.every(k => {
          const e = document.querySelector('[data-key="' + k + '"]');
          return e && e.value.trim();
        });
        if (allFilled) showMilestoneToast('🏐 满意，故事框架完成！就像赛前排兵布阵，你已经准备好了！', 'ms_story');
      });
    });

  // 02_prompt.html：三条指令完成
  const promptKeys = ['my_prompt_1', 'my_prompt_2', 'my_prompt_end'];
  const promptCheck = () => promptKeys.every(k => {
    const el = document.querySelector('[data-key="' + k + '"]');
    return el && el.value.trim();
  });
  if (promptCheck()) showMilestoneToast('🎵 三条导演指令写好了！女高音唱响——你的画面语言已经成形！', 'ms_prompt');
  document.querySelectorAll('[data-key="my_prompt_1"],[data-key="my_prompt_2"],[data-key="my_prompt_end"]')
    .forEach(el => {
      el.addEventListener('input', () => {
        if (promptCheck()) showMilestoneToast('🎵 三条导演指令写好了！女高音唱响——你的画面语言已经成形！', 'ms_prompt');
      });
    });

  // 03_make.html：点击里程碑按钮
  const msBtn = document.getElementById('milestone-make-btn');
  if (msBtn) {
    msBtn.addEventListener('click', () => {
      showMilestoneToast('🏆 所有镜头就位！满意，你是自己电影的主力队员！', 'ms_make');
      msBtn.textContent = '✅ 已确认！进入剪映吧！';
      msBtn.disabled = true;
    });
  }
}

/* ── 初始化入口 ── */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initTagInsert();
  initPromptBuilder();
  initGuessGame();
  initLevelCards();
  initChecklist();
  initStoryContext();
  initPromptChecklist();
  initMilestone();
  initPersonalWelcome();
  initAIFeedback();
  initPersonalizedInspire();

  const clearBtn = document.getElementById('clear-all-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
});

/* ── AI 内容点评 ── */
async function callAIFeedback(type, content, feedbackBox) {
  const textEl = feedbackBox.querySelector('.afb-text');
  textEl.textContent = '🤖 思考中……';
  feedbackBox.classList.add('show');
  try {
    const res = await fetch('/api/ai-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content })
    });
    const data = await res.json();
    textEl.textContent = data.text;
  } catch (e) {
    textEl.textContent = '（网络繁忙，稍后再试试吧）';
  }
}

function initAIFeedback() {
  document.querySelectorAll('.ai-feedback-btn').forEach(btn => {
    const targetKey = btn.dataset.target;
    const feedbackType = btn.dataset.type;
    const feedbackBox = btn.nextElementSibling;

    btn.addEventListener('click', async () => {
      let content = '';
      if (targetKey === 'story_aggregate') {
        const keys = ['story_title','story_one','story_open','story_scene1','story_scene2','story_scene3','story_end'];
        const labels = ['作品名','主题','开场','场景1','场景2','场景3','结尾'];
        content = keys.map((k, i) => {
          const v = localStorage.getItem(STORAGE_PREFIX + k);
          return v ? labels[i] + '：' + v : '';
        }).filter(Boolean).join('\n');
      } else {
        const textarea = document.querySelector(`[data-key="${targetKey}"]`);
        content = textarea ? textarea.value.trim() : '';
      }
      if (!content) { alert('先写点内容，再让AI来看看哦！'); return; }
      btn.disabled = true;
      await callAIFeedback(feedbackType, content, feedbackBox);
      btn.disabled = false;
    });

    const retry = feedbackBox?.querySelector('.afb-retry');
    if (retry) { retry.addEventListener('click', () => btn.click()); }
  });
}

/* ── 动态个性化灵感卡 ── */
async function loadInspireCard(card) {
  const topic = card.dataset.topic;
  const textEl = card.querySelector('.inspire-card-text');
  const refreshBtn = card.querySelector('.inspire-refresh');
  textEl.classList.add('loading');
  textEl.textContent = '✨ 正在为满意定制……';
  if (refreshBtn) refreshBtn.disabled = true;
  try {
    const res = await fetch('/api/ai-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'inspire', content: topic })
    });
    const data = await res.json();
    textEl.textContent = data.text;
    textEl.classList.remove('loading');
  } catch (e) {
    textEl.textContent = card.dataset.fallback || '导演就是把脑子里的画面传递给所有人——和传球一样。';
    textEl.classList.remove('loading');
  }
  if (refreshBtn) refreshBtn.disabled = false;
}

function initPersonalizedInspire() {
  document.querySelectorAll('.inspire-card').forEach(card => {
    const cacheKey = 'inspire_' + (card.dataset.topic || '').slice(0, 10);
    const cached = sessionStorage.getItem(cacheKey);
    const textEl = card.querySelector('.inspire-card-text');
    if (cached) {
      textEl.textContent = cached;
    } else {
      loadInspireCard(card).then(() => {
        if (textEl.textContent) sessionStorage.setItem(cacheKey, textEl.textContent);
      });
    }
    const refreshBtn = card.querySelector('.inspire-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await loadInspireCard(card);
        if (textEl.textContent) sessionStorage.setItem(cacheKey, textEl.textContent);
      });
    }
  });
}

/* ── 首页个性化问候 ── */
async function loadPersonalGreeting(el) {
  el.style.opacity = '0.5';
  el.textContent = '✨ 正在为满意专属定制……';
  try {
    const res = await fetch('/api/ai-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'greet', content: '' })
    });
    const data = await res.json();
    el.textContent = data.text;
  } catch (e) {
    el.textContent = el.dataset.fallback || '';
  }
  el.style.opacity = '1';
}

function initPersonalWelcome() {
  const el = document.getElementById('pw-greeting');
  if (!el) return;
  const cached = sessionStorage.getItem('pw_greet');
  if (cached) {
    el.textContent = cached;
  } else {
    loadPersonalGreeting(el).then(() => {
      if (el.textContent) sessionStorage.setItem('pw_greet', el.textContent);
    });
  }
  const refreshBtn = document.getElementById('pw-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadPersonalGreeting(el);
      if (el.textContent) sessionStorage.setItem('pw_greet', el.textContent);
    });
  }
}
