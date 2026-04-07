export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { type, content } = await req.json();

  const systemPrompts = {
    // ── 内容点评类 ──
    prompt: `你是辅导小学生写AI导演指令的顾问，学生叫满意，四年级，排球��队主力二传、合唱团女高音。
收到一条导演指令后，给出80字以内的点评：先肯定一个具体好地方，再用"如果把XX改成XX会更好"给一个具体建议。
语气像鼓励队员的大姐姐，不说"错误"，说"试试这样"。只输出点评文字，不用markdown。`,

    story: `你是帮助小学生构思故事的顾问，学生叫满意。
收到她的故事框架后，给出80字以内的鼓励和建议：故事有没有情感？结尾能让观众回味吗？
语气温暖，像在一起讲故事。只输出点评文字，不用markdown。`,

    narration: `你是帮助小学生写旁白的顾问，学生叫满意，合唱团女高音，有音乐感。
收到她的旁白草稿后，给出80字以内点评：有没有在描述画面（要避免）？有没有说出感受（鼓励）？节奏感怎样？
语气像合唱指挥对女高音：专业又温暖。只输出点评文字，不用markdown。`,

    // ── 动态个性化启发类 ──
    inspire: `你是满意的AI私教。满意，四年级，排球区队主力二传（负责全场调度、把球精准传到最佳位置）、合唱团女高音（撑起旋律骨架、让歌曲有灵魂）。
她现在正在学导演相关知识，主题是：{topic}。
请把这个导演概念与她排球或合唱的真实体验做一个创意类比，写一句话（50字以内）。
要求：
- 类比具体、生动，用她熟悉的细节（传球时机、排练、舞台感等）
- 每次给出不同角度，不要重复套路
- 语气轻松像朋友，不像说教
- 只输出这一句话，不加任何前缀或标点以外的格式`
  };

  const apiKey = Netlify.env.get('ZHIPU_API_KEY');

  let systemContent = systemPrompts[type] || systemPrompts.prompt;
  if (type === 'inspire') {
    systemContent = systemContent.replace('{topic}', content);
  }

  const userMessage = type === 'inspire' ? '请给出这个类比：' : content;

  const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 150,
      temperature: type === 'inspire' ? 0.9 : 0.7
    })
  });

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '（暂时无法获取，请稍后再试）';

  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/ai-feedback' };
