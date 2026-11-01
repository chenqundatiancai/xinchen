/* =========================================================
   欣陈宇宙 · 唯一配置区
   ---------------------------------------------------------
   想改日期、名字、照片、文案，只改这个文件就够了。
   改完保存 → 刷新页面即可生效。
   ========================================================= */
window.LOVE_CONFIG = {

  /* ---------- 1. 你们俩 ---------- */
  names: {
    her: "喻佳欣",
    him: "陈群",
    herTag: "喻佳欣老大",     // 女性卡通形象下面的小名牌
    himTag: "陈群大王",       // 男性卡通形象下面的小名牌
    galaxy: "欣陈宇宙"
  },

  /* ---------- 2. 故事开始的那一天 ----------
     格式：YYYY-MM-DDTHH:mm:ss+08:00（北京时间）      */
  startDate: "2026-09-22T00:00:00+08:00",

  /* ---------- 3. 照片 ----------
     换成你们的图，保持文件名即可。                          */
  photos: {
    cover: "https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-cover-wide.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS1jb3Zlci13aWRlLmpwZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTM1MzgwMDAsImV4cCI6MTgyNTA3NDAwMH0.3SgL71f9NeJY2bxjseYSoCFEuc6xlEo_a2aGQEN-EnfMRhu9SmX1vr8x3WLyRrqi62vxJehm8n2uBitn5oNAXA",   // 开屏大背景（横屏用这张）
    coverTall: "https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-cover.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS1jb3Zlci5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkzNTM3OTg4LCJleHAiOjE4MjUwNzM5ODh9.g9ucFJVTDjb0Vakq8UIj2jg1z4yRSwYNOBXg88fKv7lQpPfcxGUFwL1ISZ8EkXYRyRfohaSCUDjqlnOqEsbOyA",    // 开屏大背景（竖屏/手机用这张）
    universe: "https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-universe.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS11bml2ZXJzZS5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkzNTM4MDAyLCJleHAiOjE4MjUwNzQwMDJ9.7vZRA_Fa3zK9mHRkq0cSAl0q3_LI8GBrWTKFVXROWtdez4eeBLhhZ8tH0BUqjnVMTYZ_skuBCB0-vUsNZ9XCCQ",  // 宇宙页的写实氛围底图（已预模糊）
    her: "https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-her.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS1oZXIuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MzUzODAwNCwiZXhwIjoxODI1MDc0MDA0fQ.85xyTAe8qYSOVXy3z5fmZLGfG-xuPY5yxGa4siBxkGQR3kW1jXnhDy8Z2x9HjKhJzMBgQq0RanAjULByzAr0xQ",            // 她的头像（日记、评论会用）
    him: "https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-him.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS1oaW0uanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MzUzODAwNiwiZXhwIjoxODI1MDc0MDA2fQ.1p6_9qnsTxyZLwkY5bQ_QaIyFLMtN5GKRAAfZ-wsTCbTp75S-xZRajop0_CHEKfXhsvwehIE7oSwCLCTBP1FPg"             // 他的头像
  },

  /* ---------- 4. 开屏按钮文案 ---------- */
  intro: {
    buttonText: "进入欣陈宇宙",
    buttonHint: "点击，打开只属于我们的小宇宙",
    tip: "仅此一份 · 为你而建"
  },

  /* ---------- 5. 弹窗里的暖心话（每次进入随机抽一批） ---------- */
  heartLines: [
    "第一次见你，心跳就不听话了",
    "你笑起来，像春天提前来了",
    "和你在一起，连发呆都是甜的",
    "我准备了很久，才敢说喜欢你",
    "以后的路，我想牵着你走",
    "你是我所有例外里的例外",
    "想把你写进我的每一天",
    "牵着你的手，路就不会长",
    "你一出现，我的世界就亮了",
    "今天也喜欢你，比昨天多一点",
    "你负责可爱，我负责爱你",
    "我最想去的远方，是你身边",
    "和你吃过的每顿饭都算数",
    "你困的时候，我当你的枕头",
    "我们吵过的架，都变成了糖",
    "想把余生都借给你",
    "你是我藏在心里的宇宙",
    "认识你之后，日子有了名字",
    "下辈子，还想第一个遇见你",
    "喜欢你，是我最擅长的事",
    "你笑一下，我这一天就值了",
    "别怕，我一直在",
    "你是我最软的那块地方",
    "冬天再冷，牵着你就暖",
    "我说过的话，都算数",
    "你在的地方，就是我想去的",
    "想和你一起吃很多很多顿饭",
    "你打呼我也觉得可爱",
    "半夜醒来，先看看你",
    "你皱眉的时候，我想抱你",
    "我们的以后，我想了很久",
    "你是我认真挑过的人",
    "就算吵架，也没想过走",
    "你叫我名字的时候最好听",
    "我想陪你慢慢变老",
    "你是我全部的偏爱",
    "明天也想见你",
    "你在我这里，永远排第一",
    "有你在，日子就不算白过",
    "我们还有很多个第一次"
  ],

  /* ---------- 6. 背景音乐 ----------
     把你们喜欢的 mp3 放进 assets/music/，然后在这里加一条。
     没有音乐文件时，会用自带的柔和环境音（dusk-loop.wav）。 */
  music: {
    autoplay: true,
    tracks: [
      { title: "Flower Dance 风格曲", artist: "钢琴", src: "assets/music/flower-dance-style.wav" },
      { title: "黄昏", artist: "环境音", src: "assets/music/dusk-loop.wav" }
    ]
  },

  /* ---------- 7. 六大板块 ---------- */
  sections: [
    { key: "diary",  icon: "📔", title: "恋爱日记",     desc: "把每天的小心动，都写进这本本子",       tag: "DIARY"   },
    { key: "map",    icon: "🗺️", title: "我们的足迹",   desc: "去过的城市、走过的路，都算我们的",     tag: "MEMORY"  },
    { key: "dream",  icon: "🌙", title: "我们的梦",     desc: "一起做梦的人，会一起把梦做完",         tag: "DREAM"   },
    { key: "chill",  icon: "🎮", title: "休闲时刻",     desc: "打游戏、看电影、发呆，都是正经事",     tag: "CHILL"   },
    { key: "food",   icon: "🍰", title: "大馋猪的天堂", desc: "想吃的都要一起吃，才算真的吃到",       tag: "FOOD"    },
    { key: "lucky",  icon: "✨", title: "忘性大的福星", desc: "我们老忘事，可从没忘记喜欢对方",       tag: "LUCKY"   }
  ]
};
