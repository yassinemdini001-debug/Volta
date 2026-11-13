import { Language, LocationId, PlayerRole } from '../types/game';

export interface TranslationBundle {
  brandSub: string;
  startMatch: string;
  openHub: string;
  avatarLocker: string;
  controlHint: string;
  modes: {
    quick: string;
    story: string;
    arcade: string;
    squads: string;
  };
  tabs: {
    quick: string;
    story: string;
    arcade: string;
    squads: string;
    avatar: string;
  };
  formats: {
    '3v3': string;
    '4v4': string;
    '5v5': string;
    '3v3Desc': string;
    '4v4Desc': string;
    '5v5Desc': string;
  };
  rules: {
    wallBounce: string;
    noGk: string;
    duration: string;
    seconds: string;
    regionTunisia: string;
    regionGlobal: string;
    kickOff: string;
    backToTitle: string;
  };
  roles: Record<PlayerRole, { name: string; desc: string; skills: [string, string, string] }>;
  locations: Record<LocationId, { name: string; vibe: string }>;
  story: {
    title: string;
    subtitle: string;
    chapterLabel: string;
    playChapter: string;
    completed: string;
    locked: string;
    chapters: Array<{
      title: string;
      rival: string;
      dialogue: string;
      reward: number;
    }>;
  };
  arcade: {
    title: string;
    subtitle: string;
    best: string;
    play: string;
    games: {
      targets: { name: string; desc: string };
      king: { name: string; desc: string };
      wallvolley: { name: string; desc: string };
    };
  };
  squads: {
    title: string;
    crewName: string;
    crestShape: string;
    homePitch: string;
    primaryColor: string;
    secondaryColor: string;
    rosterTitle: string;
    leaderboard: string;
    playCrewMatch: string;
    winsLabel: string;
    ptsLabel: string;
  };
  avatar: {
    title: string;
    playerName: string;
    role: string;
    skillPoints: string;
    repLabel: string;
    hair: string;
    top: string;
    skin: string;
    topColor: string;
    accentColor: string;
    sneakers: string;
    tattoo: string;
    upgrade: string;
    maxed: string;
    saveBack: string;
  };
  hud: {
    shoot: string;
    pass: string;
    skill: string;
    sprint: string;
    tackle: string;
    stamina: string;
    style: string;
    paused: string;
    resume: string;
    restart: string;
    quit: string;
    fullTime: string;
    victory: string;
    defeat: string;
    draw: string;
    goals: string;
    nutmegs: string;
    wallPasses: string;
    skills: string;
    repEarned: string;
    playAgain: string;
    nextChapter: string;
    returnHub: string;
    mute: string;
    unmute: string;
  };
  callouts: {
    goal: string[];
    conceded: string[];
    nutmeg: string[];
    wallpass: string[];
    skill: string[];
    save: string[];
    target: string[];
    king: string[];
  };
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  ar: {
    brandSub: 'كرة الشارع التونسية والعالمية',
    startMatch: 'ابدأ المباراة الآن',
    openHub: 'الأطوار والملاعب',
    avatarLocker: 'الشخصية والمهارات',
    controlHint: 'WASD للحركة · Space تسديد/افتكاك · J تمرير · E مهارة/طرحية · Shift سرعة · Esc إيقاف',
    modes: {
      quick: 'مباراة سريعة',
      story: 'طور القصة',
      arcade: 'فولطا أركيد',
      squads: 'الفرق عبر الإنترنت',
    },
    tabs: {
      quick: 'مباراة سريعة',
      story: 'طور القصة',
      arcade: 'فولطا أركيد',
      squads: 'الفرق',
      avatar: 'الشخصية والمهارات',
    },
    formats: {
      '3v3': '3 ضد 3 (راش)',
      '4v4': '4 ضد 4 (قفص)',
      '5v5': '5 ضد 5 (فوتسال)',
      '3v3Desc': 'إيقاع ناري بدون حارس وارتداد جدران مستمر',
      '4v4Desc': 'تكتيك القفص المغلق مع حارس متحرك',
      '5v5Desc': 'قواعد الفوتسال الكاملة في ملعب أوسع',
    },
    rules: {
      wallBounce: 'ارتداد الجدران مفعل',
      noGk: 'بدون حارس مرمى',
      duration: 'مدة المباراة',
      seconds: 'ثانية',
      regionTunisia: 'ملاعب تونس',
      regionGlobal: 'أيقونات عالمية',
      kickOff: 'ضربة البداية',
      backToTitle: 'القائمة الرئيسية',
    },
    roles: {
      striker: {
        name: 'مهاجم',
        desc: 'قناص أمام المرمى بتسديدات صاروخية ورشاقة فائقة.',
        skills: ['حسم الهجمات', 'تسديدة صاروخية', 'انطلاقة سريعة'],
      },
      playmaker: {
        name: 'صانع ألعاب',
        desc: 'رؤية ثاقبة، تمريرات قاتلة، وساحر الطرحية.',
        skills: ['رؤية الملعب', 'تمريرة قاتلة', 'أستاذ الطرحية'],
      },
      defender: {
        name: 'مدافع',
        desc: 'جدار دفاعي، افتكاك نظيف، وخبير استغلال الجدران.',
        skills: ['قطع الكرات', 'تدخل صلب', 'خبير الجدران'],
      },
    },
    locations: {
      mellassine: { name: 'حي الملاسين', vibe: 'قفص إسمنتي شعبي · أضواء ليلية وجداريات' },
      ettadhamen: { name: 'حي التضامن', vibe: 'زنقة حضرية · أزقة تونسية وحماس الجماهير' },
      aindraham: { name: 'غابة عين دراهم', vibe: 'فسحة جبلية وسط أشجار البلوط والضباب' },
      tataouine: { name: 'صحراء تطاوين', vibe: 'ملعب الكثبان الرملية وقصور الجنوب' },
      bizerte: { name: 'شاطئ بنزرت', vibe: 'كورنيش متوسطي · نسيم البحر والنخيل' },
      amsterdam: { name: 'أسطح أمستردام', vibe: 'ملعب فوق السطوح بإطلالة على القنوات' },
      tokyo: { name: 'زقاق طوكيو النيون', vibe: 'أسفلت لامع تحت فوانيس وأضواء النيون' },
      rio: { name: 'أحياء ريو دي جانيرو', vibe: 'مدرجات الفافيلا الملونة عند الغروب' },
    },
    story: {
      title: 'رحلة الشارع: من الحومة إلى العالمية',
      subtitle: 'تحدَّ أقوى فرق الأحياء في تونس لانتزاع بطاقة البطولة العالمية.',
      chapterLabel: 'الفصل',
      playChapter: 'خُض التحدي',
      completed: 'تم الفوز',
      locked: 'مغلق',
      chapters: [
        {
          title: 'شرارة الإسمنت · حي الملاسين',
          rival: 'أسود الملاسين',
          dialogue: 'هنا في كاج الملاسين الكرة لا تخرج أبداً. ورّينا تقنياتك يا بطل!',
          reward: 150,
        },
        {
          title: 'ملوك الزنقة · حي التضامن',
          rival: 'صقور التضامن',
          dialogue: 'حي التضامن لا يرحم. الطرحية واللعب على الحائط هما سر البقاء هنا.',
          reward: 220,
        },
        {
          title: 'عاصفة الكثبان · صحراء تطاوين',
          rival: 'فرسان الجنوب',
          dialogue: 'تحت شمس تطاوين، اللياقة والقوة البدنية تحسمان المواجهة.',
          reward: 300,
        },
        {
          title: 'تحت أضواء النيون · طوكيو',
          rival: 'سایبر شيبويا',
          dialogue: 'السرعة الخاطفة والتمريرات الجراحية في أزقة طوكيو الممطرة.',
          reward: 400,
        },
        {
          title: 'نهائي العرش العالمي · ريو الفافيلا',
          rival: 'ملوك الفافيلا',
          dialogue: 'كل الأنظار على قمة ريو. مباراة الحسم للقب ملك كرة الشارع!',
          reward: 600,
        },
      ],
    },
    arcade: {
      title: 'فولطا أركيد',
      subtitle: 'تحديات مهارية سريعة لصقل دقتك وتحطيم الأرقام القياسية.',
      best: 'أفضل نتيجة',
      play: 'ابدأ التحدي',
      games: {
        targets: {
          name: 'دقة التسديد',
          desc: 'اصطد الأهداف المضيئة حول القفص والمرمى قبل انتهاء الوقت.',
        },
        king: {
          name: 'ملك القفص',
          desc: 'مواجهة فردية سريعة: سجّل أولاً لتبقى في القفص وتجمع النقاط.',
        },
        wallvolley: {
          name: 'ضربات الجدار',
          desc: 'مرّر الكرة على الجدار المضيء ثم سدد مباشرة لمضاعفة النقاط.',
        },
      },
    },
    squads: {
      title: 'فولطا سكوادز · الفرق',
      crewName: 'اسم الفريق',
      crestShape: 'شكل الشعار',
      homePitch: 'الملعب الرئيسي',
      primaryColor: 'اللون الأساسي',
      secondaryColor: 'اللون الثانوي',
      rosterTitle: 'تشكيلة الفريق',
      leaderboard: 'ترتيب فرق الشارع',
      playCrewMatch: 'مباراة تصنيف الفريق',
      winsLabel: 'انتصار',
      ptsLabel: 'نقطة',
    },
    avatar: {
      title: 'تخصيص اللاعب وشجرة المهارات',
      playerName: 'اسم اللاعب',
      role: 'المركز والاختصاص',
      skillPoints: 'نقاط المهارة',
      repLabel: 'سمعة فولطا',
      hair: 'التسريحة / القبعة',
      top: 'الزي الرياضي',
      skin: 'لون البشرة',
      topColor: 'لون القميص',
      accentColor: 'لون التفاصيل',
      sneakers: 'الحذاء الرياضي',
      tattoo: 'وشم الذراع',
      upgrade: 'تطوير',
      maxed: 'مكتمل',
      saveBack: 'حفظ والعودة',
    },
    hud: {
      shoot: 'تسديد',
      pass: 'تمرير',
      skill: 'طرحية / مهارة',
      sprint: 'سرعة',
      tackle: 'افتكاك',
      stamina: 'اللياقة',
      style: 'ستايل',
      paused: 'إيقاف مؤقت',
      resume: 'استئناف اللعب',
      restart: 'إعادة المباراة',
      quit: 'العودة للقائمة',
      fullTime: 'نهاية المباراة',
      victory: 'انتصار ساحق!',
      defeat: 'هزيمة — جولة قادمة أقوى!',
      draw: 'تعادل مثير!',
      goals: 'الأهداف',
      nutmegs: 'طرحية (كوبري)',
      wallPasses: 'تمريرات الجدار',
      skills: 'مهارات ناجحة',
      repEarned: 'السمعة المكتسبة',
      playAgain: 'العب مجدداً',
      nextChapter: 'الفصل التالي',
      returnHub: 'مركز البطولات',
      mute: 'كتم الصوت',
      unmute: 'تشغيل الصوت',
    },
    callouts: {
      goal: ['جووول! يا معلم!', 'تسديدة في التسعين! نار!', 'هدف عالمي من الشارع!'],
      conceded: ['هدف للخصم! شدوا الهمة!', 'لا تستسلم، الكرة في ملعبنا!'],
      nutmeg: ['طرحية! بين الساقين!', 'يا ساتر على الكوبري!', 'مهارة تدرس في الحومة!'],
      wallpass: ['ون تو على الحائط!', 'استغلال عالمي للجدار!'],
      skill: ['إيلاستيكو ساحر!', 'رقصة شارع خيالية!'],
      save: ['تصدي أسطوري!', 'حائط صد لا يخترق!'],
      target: ['إصابة مباشرة!', 'قناص القفص!'],
      king: ['ملك القفص الجديد!', 'سلسلة أهداف متواصلة!'],
    },
  },

  fr: {
    brandSub: 'Football de Rue · Tunisie & Monde',
    startMatch: 'Coup d’Envoi',
    openHub: 'Modes & Terrains',
    avatarLocker: 'Avatar & Talents',
    controlHint: 'WASD Bouger · Espace Tirer/Tacler · J Passe · E Dribble/Petit Pont · Shift Sprint · Échap Pause',
    modes: {
      quick: 'Match Rapide',
      story: 'Mode Histoire',
      arcade: 'VOLTA Arcade',
      squads: 'VOLTA Squads',
    },
    tabs: {
      quick: 'Match Rapide',
      story: 'Histoire',
      arcade: 'Arcade',
      squads: 'Squads',
      avatar: 'Avatar & Talents',
    },
    formats: {
      '3v3': '3v3 Rush',
      '4v4': '4v4 Cage',
      '5v5': '5v5 Futsal',
      '3v3Desc': 'Rythme effréné sans gardien, rebonds muraux actifs',
      '4v4Desc': 'Cage tactique avec gardien mobile et murs actifs',
      '5v5Desc': 'Règles Futsal classiques sur grand terrain',
    },
    rules: {
      wallBounce: 'Rebonds sur les murs',
      noGk: 'Sans gardien',
      duration: 'Durée du match',
      seconds: 'sec',
      regionTunisia: 'Spots de Tunisie',
      regionGlobal: 'Icônes Mondiales',
      kickOff: 'Lancer le Match',
      backToTitle: 'Écran Titre',
    },
    roles: {
      striker: {
        name: 'Buteur',
        desc: 'Finisseur clinique, frappes lourdes et agilité explosive.',
        skills: ['Finition Clinique', 'Frappe Canon', 'Vitesse Pure'],
      },
      playmaker: {
        name: 'Meneur de Jeu',
        desc: 'Vision laser, passes décisives et maître du petit pont.',
        skills: ['Vision 360°', 'Passe Laser', 'Maître Petit Pont'],
      },
      defender: {
        name: 'Défenseur',
        desc: 'Interceptions propres, blocs physiques et relances murales.',
        skills: ['Interception', 'Tacle Solide', 'Spécialiste Mur'],
      },
    },
    locations: {
      mellassine: { name: 'Cité Mellassine', vibe: 'Cage béton urbaine · Projecteurs et graffitis' },
      ettadhamen: { name: 'Cité Ettadhamen', vibe: 'Ruelle tunisienne · Ambiance chaude au bord du grillage' },
      aindraham: { name: 'Forêt d’Aïn Draham', vibe: 'Clairière brumeuse · Chênes-lièges et planches bois' },
      tataouine: { name: 'Désert de Tataouine', vibe: 'Arène des dunes · Murs de ksar au coucher du soleil' },
      bizerte: { name: 'Corniche de Bizerte', vibe: 'Promenade côtière · Mer azur et palmiers' },
      amsterdam: { name: 'Toits d’Amsterdam', vibe: 'Terrain suspendu au-dessus des canaux au crépuscule' },
      tokyo: { name: 'Ruelle Néon de Tokyo', vibe: 'Asphalte humide sous les lanternes électriques' },
      rio: { name: 'Favelas de Rio', vibe: 'Terrasse colorée dans les collines au soleil couchant' },
    },
    story: {
      title: 'L’Ascension de la Rue',
      subtitle: 'Des cages souterraines de Tunis aux championnats mondiaux.',
      chapterLabel: 'Chapitre',
      playChapter: 'Relever le Défi',
      completed: 'Validé',
      locked: 'Verrouillé',
      chapters: [
        {
          title: 'L’Étincelle Béton · Mellassine',
          rival: 'Lions de Mellassine',
          dialogue: 'Ici dans la cage, la balle ne sort jamais. Montre ce que tu vaux !',
          reward: 150,
        },
        {
          title: 'Rois de la Ruelle · Ettadhamen',
          rival: 'Faucons d’Ettadhamen',
          dialogue: 'Joue avec les murs ou rentre chez toi. C’est notre terrain !',
          reward: 220,
        },
        {
          title: 'Tempête des Dunes · Tataouine',
          rival: 'Cavaliers du Sud',
          dialogue: 'Le sable freine les faibles. Seule la technique pure survit ici.',
          reward: 300,
        },
        {
          title: 'Pluie de Néon · Tokyo',
          rival: 'Shibuya Sparks',
          dialogue: 'Passe-passe ultra rapide et dribbles électriques dans la ruelle.',
          reward: 400,
        },
        {
          title: 'Couronne Mondiale · Rio Favelas',
          rival: 'Reis da Favela',
          dialogue: 'Le monde entier regarde. Prends le trône du street football !',
          reward: 600,
        },
      ],
    },
    arcade: {
      title: 'VOLTA Arcade',
      subtitle: 'Mini-jeux nerveux pour affûter vos réflexes et vos combos.',
      best: 'Record',
      play: 'Jouer',
      games: {
        targets: {
          name: 'Tir sur Cibles',
          desc: 'Brisez un maximum de cibles lumineuses dans la cage en 45s.',
        },
        king: {
          name: 'Roi de la Cage',
          desc: 'Duel rapide : marquez pour garder votre couronne et enchaîner.',
        },
        wallvolley: {
          name: 'Volée Murale',
          desc: 'Faites rebondir le ballon sur le mur actif puis marquez en volée !',
        },
      },
    },
    squads: {
      title: 'VOLTA Squads · Équipes',
      crewName: 'Nom du Crew',
      crestShape: 'Blason',
      homePitch: 'Terrain QG',
      primaryColor: 'Couleur Primaire',
      secondaryColor: 'Couleur Accent',
      rosterTitle: 'Effectif du Crew',
      leaderboard: 'Classement Mondial',
      playCrewMatch: 'Match Classé Crew',
      winsLabel: 'V',
      ptsLabel: 'pts',
    },
    avatar: {
      title: 'Studio Avatar & Arbre de Talents',
      playerName: 'Pseudo Rue',
      role: 'Archétype & Poste',
      skillPoints: 'Points de Talent',
      repLabel: 'Réputation VOLTA',
      hair: 'Coiffure / Casquette',
      top: 'Haut Streetwear',
      skin: 'Teint',
      topColor: 'Couleur Haut',
      accentColor: 'Couleur Détails',
      sneakers: 'Baskets',
      tattoo: 'Tatouage Bras',
      upgrade: 'Améliorer',
      maxed: 'Max',
      saveBack: 'Enregistrer',
    },
    hud: {
      shoot: 'Tirer',
      pass: 'Passe',
      skill: 'Dribble',
      sprint: 'Sprint',
      tackle: 'Tacler',
      stamina: 'Endurance',
      style: 'Style',
      paused: 'Match en Pause',
      resume: 'Reprendre',
      restart: 'Recommencer',
      quit: 'Menu Principal',
      fullTime: 'Fin du Match',
      victory: 'Victoire Totale !',
      defeat: 'Défaite — Prenez votre revanche !',
      draw: 'Match Nul !',
      goals: 'Buts',
      nutmegs: 'Petits Ponts',
      wallPasses: 'Une-Deux Mur',
      skills: 'Gestes Techniques',
      repEarned: 'Réputation Gagnée',
      playAgain: 'Rejouer',
      nextChapter: 'Chapitre Suivant',
      returnHub: 'Retour Hub',
      mute: 'Couper Son',
      unmute: 'Activer Son',
    },
    callouts: {
      goal: ['BUUUUT ! C’est du lourd !', 'En pleine lucarne !', 'Quelle frappe de rue !'],
      conceded: ['But encaissé ! Réaction immédiate !', 'Allez, on égalise !'],
      nutmeg: ['PETIT PONT ! Humiliation !', 'Entre les jambes ! Propre !', 'C’est la rue pure !'],
      wallpass: ['Une-deux sur le mur !', 'Rebond millimétré !'],
      skill: ['Elastico de génie !', 'Quel geste technique !'],
      save: ['Arrêt réflexe !', 'Mur infranchissable !'],
      target: ['En plein dans le mille !', 'Tir chirurgical !'],
      king: ['Toujours Roi de la Cage !', 'Série en feu !'],
    },
  },

  en: {
    brandSub: 'Tunisia & Global Street Football',
    startMatch: 'Kick Off Now',
    openHub: 'Modes & Arenas',
    avatarLocker: 'Avatar & Skills',
    controlHint: 'WASD Move · Space Shoot/Tackle · J Pass · E Skill/Nutmeg · Shift Sprint · Esc Pause',
    modes: {
      quick: 'Quick Match',
      story: 'Story Mode',
      arcade: 'VOLTA Arcade',
      squads: 'VOLTA Squads',
    },
    tabs: {
      quick: 'Quick Match',
      story: 'Story Mode',
      arcade: 'Arcade',
      squads: 'Squads',
      avatar: 'Avatar & Skills',
    },
    formats: {
      '3v3': '3v3 Rush',
      '4v4': '4v4 Cage',
      '5v5': '5v5 Futsal',
      '3v3Desc': 'No-keeper blitz with non-stop cage wall rebounds',
      '4v4Desc': 'Tight cage tactics with agile sweeper-keeper',
      '5v5Desc': 'Full futsal flow on a wider urban court',
    },
    rules: {
      wallBounce: 'Active Wall Rebounds',
      noGk: 'No Goalkeeper (Rush)',
      duration: 'Match Length',
      seconds: 'sec',
      regionTunisia: 'Tunisian Spots',
      regionGlobal: 'Global Icons',
      kickOff: 'Kick Off',
      backToTitle: 'Title Screen',
    },
    roles: {
      striker: {
        name: 'Striker',
        desc: 'Clinical finisher with blistering power shots and sharp agility.',
        skills: ['Clinical Finisher', 'Power Cannon', 'Street Agility'],
      },
      playmaker: {
        name: 'Playmaker',
        desc: 'Pinpoint vision, killer passes, and effortless nutmeg flair.',
        skills: ['Court Vision', 'Killer Pass', 'Nutmeg Maestro'],
      },
      defender: {
        name: 'Defender',
        desc: 'Lockdown interceptions, brick-wall tackles, and wall clearances.',
        skills: ['Sharp Interception', 'Brick Tackle', 'Wall Specialist'],
      },
    },
    locations: {
      mellassine: { name: 'Mellassine Concrete Cage', vibe: 'Raw Tunis concrete · Floodlights & street murals' },
      ettadhamen: { name: 'Ettadhamen Urban Alley', vibe: 'Tight Tunis alley · Electric fence-side crowd' },
      aindraham: { name: 'Ain Draham Forest Clearing', vibe: 'Misty cork-oak clearing · Timber rebound boards' },
      tataouine: { name: 'Tataouine Desert Dunes', vibe: 'Compacted sand pitch · Berber ksar arches at dusk' },
      bizerte: { name: 'Bizerte Coastal Promenade', vibe: 'Mediterranean seafront · Palms & sunlit concrete' },
      amsterdam: { name: 'Amsterdam Rooftops', vibe: 'Elevated rooftop court · Canal gables skyline' },
      tokyo: { name: 'Tokyo Neon Alley', vibe: 'Rain-slick asphalt · Glowing lanterns & neon energy' },
      rio: { name: 'Rio de Janeiro Favelas', vibe: 'Hillside painted terrace · Golden sunset atmosphere' },
    },
    story: {
      title: 'Street Rise: Tunis to the World',
      subtitle: 'Conquer underground Tunisian cages to earn your spot at the global street finals.',
      chapterLabel: 'Chapter',
      playChapter: 'Take the Challenge',
      completed: 'Cleared',
      locked: 'Locked',
      chapters: [
        {
          title: 'Concrete Spark · Mellassine',
          rival: 'Mellassine Lions',
          dialogue: 'Inside the Mellassine cage, the ball never dies. Show us your street tek!',
          reward: 150,
        },
        {
          title: 'Alley Kings · Ettadhamen',
          rival: 'Ettadhamen Falcons',
          dialogue: 'Use the alley walls or get left behind. Nobody leaves here unscathed.',
          reward: 220,
        },
        {
          title: 'Dune Showdown · Tataouine',
          rival: 'Southern Nomads',
          dialogue: 'Compacted desert sand tests every touch. Pure power and grit win here.',
          reward: 300,
        },
        {
          title: 'Neon Qualifier · Tokyo',
          rival: 'Shibuya Sparks',
          dialogue: 'Blink and they are past you. Sharp wall-passes decide the night.',
          reward: 400,
        },
        {
          title: 'World Street Crown · Rio Favelas',
          rival: 'Favela Kings',
          dialogue: 'One final match on the hillside terrace for the global street crown!',
          reward: 600,
        },
      ],
    },
    arcade: {
      title: 'VOLTA Arcade',
      subtitle: 'High-tempo skill mini-games built for combos and high scores.',
      best: 'Best',
      play: 'Start Mode',
      games: {
        targets: {
          name: 'Target Shooting',
          desc: 'Smash glowing bullseye targets around the cage & goal in 45 seconds.',
        },
        king: {
          name: 'King of the Cage',
          desc: 'Fast 1v1 survival: score first to hold the crown and stack your streak.',
        },
        wallvolley: {
          name: 'Wall-Bounce Volley',
          desc: 'Bank the ball off the illuminated rebound wall and volley it home!',
        },
      },
    },
    squads: {
      title: 'VOLTA Squads · Crews',
      crewName: 'Crew Name',
      crestShape: 'Crest Emblem',
      homePitch: 'Home Pitch',
      primaryColor: 'Primary Color',
      secondaryColor: 'Accent Color',
      rosterTitle: 'Active Crew Roster',
      leaderboard: 'Global Street Leaderboard',
      playCrewMatch: 'Play Ranked Crew Match',
      winsLabel: 'W',
      ptsLabel: 'pts',
    },
    avatar: {
      title: 'Avatar Studio & Skill Tree',
      playerName: 'Street Handle',
      role: 'Archetype & Role',
      skillPoints: 'Skill Points',
      repLabel: 'VOLTA Rep',
      hair: 'Hairstyle / Cap',
      top: 'Streetwear Top',
      skin: 'Skin Tone',
      topColor: 'Jersey / Hoodie Color',
      accentColor: 'Trim Color',
      sneakers: 'Sneakers',
      tattoo: 'Arm Tattoo Sleeve',
      upgrade: 'Upgrade',
      maxed: 'Maxed',
      saveBack: 'Save & Return',
    },
    hud: {
      shoot: 'Shoot',
      pass: 'Pass',
      skill: 'Skill / Nutmeg',
      sprint: 'Sprint',
      tackle: 'Tackle',
      stamina: 'Stamina',
      style: 'Style',
      paused: 'Match Paused',
      resume: 'Resume Match',
      restart: 'Restart',
      quit: 'Exit to Menu',
      fullTime: 'Full Time',
      victory: 'Street Victory!',
      defeat: 'Defeat — Run It Back!',
      draw: 'All Square!',
      goals: 'Goals',
      nutmegs: 'Nutmegs',
      wallPasses: 'Wall Passes',
      skills: 'Skills Landed',
      repEarned: 'Rep Earned',
      playAgain: 'Play Again',
      nextChapter: 'Next Chapter',
      returnHub: 'Open Hub',
      mute: 'Mute Audio',
      unmute: 'Enable Audio',
    },
    callouts: {
      goal: ['GOAL! Pure street fire!', 'Top bins! Unstoppable!', 'Clinical cage finish!'],
      conceded: ['They scored! Lock back in!', 'Shake it off — push forward!'],
      nutmeg: ['NUTMEG! Clean through the legs!', 'Sent to the shops!', 'Pure street disrespect!'],
      wallpass: ['One-two off the wall!', 'Filthy rebound combo!'],
      skill: ['Silky elastico!', 'Dancing on concrete!'],
      save: ['Massive stop!', 'Brick wall defense!'],
      target: ['Bullseye smashed!', 'Deadeye strike!'],
      king: ['Still King of the Cage!', 'Streak climbing!'],
    },
  },
};
