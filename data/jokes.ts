// Collection of culturally relevant jokes for each supported language
// These jokes are organized by language code and context (todo or clipboard)

export type JokeType = {
  text?: string;
  description?: string;
  priority?: string;
  // For clipboard jokes
  clipboardContent?: string;
};

export type JokesCollection = {
  [languageCode: string]: {
    todo: JokeType[];
    clipboard: JokeType[];
  };
};

export const jokes: JokesCollection = {
  // English jokes
  en: {
    todo: [
      {
        text: "Find out who let the dogs out",
        description: "This mystery has gone unsolved since 2000",
        priority: "1",
      },
      {
        text: "Teach my cat to respond to 'pspsps'",
        description: "Day 47: Still ignores me completely",
        priority: "2",
      },
      {
        text: "Invent a time machine",
        description: "Just to go back and uninvent alarm clocks",
        priority: "3",
      },
      {
        text: "Train for a marathon",
        description: "Netflix marathon, that is",
        priority: "4",
      },
    ],
    clipboard: [
      {
        clipboardContent:
          "Dear future self, why didn't you go to bed earlier? Sincerely, tired present self.",
      },
      {
        clipboardContent:
          "My password hint is 'penguin' but I keep typing 'password'. I'm starting to think my hint should be 'password'.",
      },
      {
        clipboardContent:
          "If we're not meant to have midnight snacks, why is there a light in the refrigerator?",
      },
      {
        clipboardContent:
          "Pro productivity tip: Add tasks you've already completed to your to-do list just to feel the satisfaction of crossing them off.",
      },
    ],
  },

  // Spanish jokes
  es: {
    todo: [
      {
        text: "Descubrir quién dejó salir a los perros",
        description: "Este misterio sigue sin resolverse desde 2000",
        priority: "1",
      },
      {
        text: "Enseñar a mi gato a responder a 'pspsps'",
        description: "Día 47: Todavía me ignora completamente",
        priority: "2",
      },
      {
        text: "Inventar una máquina del tiempo",
        description: "Solo para volver y desinventar los despertadores",
        priority: "3",
      },
      {
        text: "Entrenar para un maratón",
        description: "Maratón de Netflix, claro está",
        priority: "4",
      },
    ],
    clipboard: [
      {
        clipboardContent:
          "Querido yo del futuro, ¿por qué no te fuiste a dormir más temprano? Atentamente, yo cansado del presente.",
      },
      {
        clipboardContent:
          "Mi pista de contraseña es 'pingüino' pero sigo escribiendo 'contraseña'. Empiezo a pensar que mi pista debería ser 'contraseña'.",
      },
      {
        clipboardContent:
          "Si no debemos tener refrigerios de medianoche, ¿por qué hay una luz en el refrigerador?",
      },
      {
        clipboardContent:
          "Consejo de productividad: Añade tareas que ya has completado a tu lista de tareas solo para sentir la satisfacción de tacharlas.",
      },
    ],
  },

  // French jokes
  fr: {
    todo: [
      {
        text: "Découvrir qui a laissé sortir les chiens",
        description: "Ce mystère reste non résolu depuis 2000",
        priority: "1",
      },
      {
        text: "Apprendre à mon chat à répondre à 'pspsps'",
        description: "Jour 47: Il m'ignore toujours complètement",
        priority: "2",
      },
      {
        text: "Inventer une machine à remonter le temps",
        description: "Juste pour revenir et désinventer les réveils",
        priority: "3",
      },
      {
        text: "S'entraîner pour un marathon",
        description: "Marathon Netflix, bien sûr",
        priority: "4",
      },
    ],
    clipboard: [
      {
        clipboardContent:
          "Cher moi du futur, pourquoi n'es-tu pas allé te coucher plus tôt? Cordialement, moi fatigué du présent.",
      },
      {
        clipboardContent:
          "Mon indice de mot de passe est 'pingouin' mais je continue à taper 'motdepasse'. Je commence à penser que mon indice devrait être 'motdepasse'.",
      },
      {
        clipboardContent:
          "Si nous ne sommes pas censés avoir des collations de minuit, pourquoi y a-t-il une lumière dans le réfrigérateur?",
      },
      {
        clipboardContent:
          "Conseil de productivité: Ajoutez des tâches que vous avez déjà accomplies à votre liste de tâches juste pour ressentir la satisfaction de les barrer.",
      },
    ],
  },

  // Chinese jokes
  zh: {
    todo: [
      {
        text: "找出是谁放走了��狗",
        description: "这个谜团自2000年以来一直未解",
        priority: "1",
      },
      {
        text: "教我的猫对'pspsps'做出反应",
        description: "第47天：它仍然完全无视我",
        priority: "2",
      },
      {
        text: "发明时光机",
        description: "只是为了回去取消发明闹钟",
        priority: "3",
      },
      {
        text: "训练马拉松",
        description: "Netflix马拉松，当然",
        priority: "4",
      },
    ],
    clipboard: [
      {
        clipboardContent:
          "亲爱的未来的我，为什么你没有早点睡觉？此致，疲惫的现在的我。",
      },
      {
        clipboardContent:
          "我的密码提示是'企鹅'，但我一直输入'密码'。我开始认为我的提示应该是'密码'。",
      },
      {
        clipboardContent: "如果我们不应该有午夜小吃，为什么冰箱里有灯？",
      },
      {
        clipboardContent:
          "生产力提示：将已经完成的任务添加到待办事项列表中，只是为了感受划掉它们的满足感。",
      },
    ],
  },

  // Indonesian jokes
  id: {
    todo: [
      {
        text: "Cari tahu siapa yang membiarkan anjing keluar",
        description: "Misteri ini belum terpecahkan sejak tahun 2000",
        priority: "1",
      },
      {
        text: "Ajari kucing saya untuk merespon 'pspsps'",
        description: "Hari ke-47: Masih mengabaikan saya sepenuhnya",
        priority: "2",
      },
      {
        text: "Menemukan mesin waktu",
        description: "Hanya untuk kembali dan membatalkan penemuan jam alarm",
        priority: "3",
      },
      {
        text: "Berlatih untuk maraton",
        description: "Maraton Netflix, tentu saja",
        priority: "4",
      },
    ],
    clipboard: [
      {
        clipboardContent:
          "Kepada diri saya di masa depan, mengapa kamu tidak tidur lebih awal? Salam, diri saya yang lelah di masa sekarang.",
      },
      {
        clipboardContent:
          "Petunjuk kata sandi saya adalah 'penguin' tetapi saya terus mengetik 'katasandi'. Saya mulai berpikir petunjuk saya seharusnya 'katasandi'.",
      },
      {
        clipboardContent:
          "Jika kita tidak boleh ngemil tengah malam, mengapa ada lampu di dalam kulkas?",
      },
      {
        clipboardContent:
          "Tips produktivitas: Tambahkan tugas yang sudah Anda selesaikan ke daftar tugas Anda hanya untuk merasakan kepuasan mencoretnya.",
      },
    ],
  },
};

// Helper function to get jokes based on language and context
export function getJokes(
  language: string,
  context: "todo" | "clipboard",
): JokeType[] {
  // Default to English if the language is not supported
  const languageCode = jokes[language] ? language : "en";
  return jokes[languageCode][context];
}

// Helper function to get a random joke
export function getRandomJoke(
  language: string,
  context: "todo" | "clipboard",
): JokeType {
  const jokesList = getJokes(language, context);
  const randomIndex = Math.floor(Math.random() * jokesList.length);
  return jokesList[randomIndex];
}

// Helper function to get multiple random jokes
export function getRandomJokes(
  language: string,
  context: "todo" | "clipboard",
  count: number,
): JokeType[] {
  const jokesList = getJokes(language, context);
  const shuffled = [...jokesList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, jokesList.length));
}
