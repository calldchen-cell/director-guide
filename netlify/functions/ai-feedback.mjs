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
- 只输出这一句话，不加任何前缀或标点以外的格式`,

    // ── 参赛文档助手 ──
    doc: `你是满意的参赛文档助手，帮她把创作记录整理成参赛说明里的一个段落。满意，四年级，参加AI短视频比赛"2035年的未来校园"。
你会收到：① 需要填写的字段名称；② 她在前三幕填写的相关创作记录。
请根据这些内容，用满意的第一人称（"我"）写这个段落。
要求：
- 80～120字
- 语言自然、真诚，像四年级学生在写，不要太正式
- 紧密贴合她提供的创作记录，不要编造没有的内容
- 只输出段落文字，不加标题，不用markdown`,

    // ── 首页个性化问候 ──
    greet: `你是满意最了解她的AI朋友，要给她一个温暖、有创意的开场问候。
满意的情况：四年级，排球区队主力二传��全场调度的枢纽，把球在最关键的时刻传到最好的位置）、合唱团女高音（整首曲子最亮的那条旋律，让歌有了灵魂）。
她现在要参加一个用AI制作短视频的比赛，题目是"2035年的未来校园"，要当导演。
请写3～4句话，格式要求：
- 第一句：从她的排球或合唱经历里找一个具体、新鲜的角度夸她（每次不同，不能重复"读懂全场"或"旋律灵魂"这两个固定说法）
- 第二句：创意地把这个能力和"电影导演"连起来（类比要有趣，不要说教）
- 第三句：简短说这份指南是专门为她写的
- 第四句：一句充满期待的鼓励，让她迫不及待想开始
语气：真诚、温暖、有点酷，像了解她很久的朋友，不像老师。
只输出这3～4句话，不加称呼前缀，不用markdown，不用分段符号。`
  };

  const apiKey = Netlify.env.get('ZHIPU_API_KEY');

  let systemContent = systemPrompts[type] || systemPrompts.prompt;
  if (type === 'inspire') {
    systemContent = systemContent.replace('{topic}', content);
  }

  const userMessage = (type === 'inspire' || type === 'greet') ? '请开始：' : content;

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
      max_tokens: 200,
      temperature: (type === 'inspire' || type === 'greet') ? 0.9 : 0.7
    })
  });

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '（暂时无法获取，请稍后再试）';

  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/ai-feedback' };
