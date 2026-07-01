const KCAL_GOAL = { kcal:2600, p:160, f:70, c:250 };
const PTS_TARGET = 500;
const PTS_STEPS  = [1, 10, 15, 20, 25];

const BUDGETS = [
  { key:'tiktok', name:'Соцмережі',      unit:'год', total:7, step:0.5, color:'#E4574E' },
  { key:'dota',   name:'Ігри',           unit:'год', total:6, step:1,   color:'#8A7BE6' },
  { key:'cheats', name:'Порушення плану',unit:'шт',  total:3, step:1,   color:'#E0A646' },
];

/* Example goals — shown as suggestions when user creates a new goal */
const EXAMPLE_GOALS = [
  { key:'bench',  name:'Пожати 90 кг',             type:'progress', start:72.5,  current:72.5,  target:90,    unit:'кг', step:2.5, difficulty:'hard'   },
  { key:'weight', name:'Скинути 3 кг',              type:'progress', start:115.7, current:115.7, target:112.7, unit:'кг', step:0.3, difficulty:'normal' },
  { key:'money',  name:'Заробити за місяць',        type:'progress', start:0,     current:0,     target:2400,  unit:'$',  step:50,  difficulty:'normal' },
  { key:'photos', name:'Гарні фотки для соцмереж', type:'check',    done:false,                               difficulty:'easy'   },
];

const DIFF_COLOR = { easy:'#38B89A', normal:'#E0A646', hard:'#E4574E' };
const DIFF_LABEL = { easy:'Легко',   normal:'Нормально', hard:'Важко' };
const DIFF_PTS   = { easy:100,       normal:200,          hard:300     };

const SHOP_BUDGET = [
  { id:'tiktok30', name:'+30 хв Соцмережі',   pts:15, key:'tiktok', bonus:0.5, desc:'додає 0.5 год до бюджету' },
  { id:'dota1h',   name:'+1 год Ігри',         pts:40, key:'dota',   bonus:1,   desc:'додає 1 год до бюджету'   },
  { id:'cheat1',   name:'+1 Порушення плану',  pts:35, key:'cheats', bonus:1,   desc:'додає 1 шт до бюджету'    },
];

const SHOP_REWARDS = [
  { id:'gaming_night', name:'Вечір гри без лімітів', pts:200, desc:'весь вечір без обмежень' },
  { id:'fav_food',     name:'Замовити улюблену їжу',  pts:250, desc:'замов що хочеш'           },
  { id:'buy_smth',     name:'Купити щось собі',        pts:400, desc:'витрать на себе'          },
];

const GRAND_REWARD_PTS = 1000;

/* Points-balance rank ladder (Головна page) */
const RANKS = [
  { name:'Wood',     lbl:'W', min:0,     next:100,  color:'#C49A6C' },
  { name:'Bronze',   lbl:'B', min:100,   next:300,  color:'#CD7F32' },
  { name:'Silver',   lbl:'S', min:300,   next:600,  color:'#9EA8BC' },
  { name:'Gold',     lbl:'G', min:600,   next:1200, color:'#E0A646' },
  { name:'Platinum', lbl:'P', min:1200,  next:2500, color:'#4FB8CE' },
  { name:'Diamond',  lbl:'D', min:2500,  next:5000, color:'#8A7BE6' },
  { name:'Champion', lbl:'C', min:5000,  next:8000, color:'#E879B9' },
  { name:'Titan',    lbl:'T', min:8000,  next:12000,color:'#E4574E' },
  { name:'Olympian', lbl:'O', min:12000, next:null, color:'#F5C518' },
];

/* ---- Gym muscle-rank system (Зал/Ранги pages) ---- */

const MUSCLE_RANK_TIERS = [
  { name:'Wood',     lbl:'W', color:'#C49A6C' },
  { name:'Bronze',   lbl:'B', color:'#CD7F32' },
  { name:'Silver',   lbl:'S', color:'#9EA8BC' },
  { name:'Gold',     lbl:'G', color:'#E0A646' },
  { name:'Platinum', lbl:'P', color:'#4FB8CE' },
  { name:'Diamond',  lbl:'D', color:'#8A7BE6' },
  { name:'Champion', lbl:'C', color:'#E879B9' },
  { name:'Titan',    lbl:'T', color:'#E4574E' },
  { name:'Olympian', lbl:'O', color:'#F5C518' },
];

/*
 * Rank thresholds by muscle's key lift.
 * mode: 'bw'   → value = bestWeight / bodyWeight (ratio)
 *       'kg'   → value = bestWeight in kg
 *       'reps' → value = bestReps (used as seconds for core)
 * tiers[i] = min value to achieve MUSCLE_RANK_TIERS[i].
 * Tune these constants freely.
 */
const MUSCLE_LIFT_CONFIG = {
  chest:     { exIds:['bench'],                      mode:'bw',   liftName:'Жим лежачи',                  unit:'×БВ',
               tiers:[0, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25] },
  back:      { exIds:['b_row'],                      mode:'bw',   liftName:'Тяга штанги',                  unit:'×БВ',
               tiers:[0, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 2.0] },
  legs:      { exIds:['squat'],                      mode:'bw',   liftName:'Присідання',                   unit:'×БВ',
               tiers:[0, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5] },
  shoulders: { exIds:['lat_rA','lat_rB','lat_rC'],   mode:'kg',   liftName:'Розведення (гантеля, кожна)',  unit:'кг',
               tiers:[0, 6, 10, 14, 18, 22, 27, 32, 38] },
  arms:      { exIds:['bi_curl'],                    mode:'kg',   liftName:'Біцепс (загальна вага)',        unit:'кг',
               tiers:[0, 15, 22.5, 30, 40, 52.5, 65, 80, 100] },
  core:      { exIds:['core_ex'],                    mode:'reps', liftName:'Планка',                       unit:'с',
               tiers:[0, 20, 40, 60, 90, 120, 180, 240, 300] },
};

const MUSCLES = [
  { key:'chest',     name:'Груди',  color:'#E4574E' },
  { key:'back',      name:'Спина',  color:'#4FB8CE' },
  { key:'legs',      name:'Ноги',   color:'#38B89A' },
  { key:'shoulders', name:'Плечі',  color:'#8A7BE6' },
  { key:'arms',      name:'Руки',   color:'#E879B9' },
  { key:'core',      name:'Корпус', color:'#E0A646' },
];

/* Default workout program (days A/B/C) */
const GYM_DAYS = [
  {
    id: 'A', name: 'День A', subtitle: 'Full Body · Сила', optional: false,
    exercises: [
      { id:'squat',   name:'Присідання',               nameEn:'Squat',                  muscle:'legs',      sets:3, reps:'5',    bw:false },
      { id:'bench',   name:'Жим лежачи',               nameEn:'Bench press',            muscle:'chest',     sets:3, reps:'5',    bw:false, note:'+2.5 кг коли всі підходи виконано з чистою технікою' },
      { id:'b_row',   name:'Тяга штанги в нахилі',    nameEn:'Barbell row',            muscle:'back',      sets:4, reps:'6',    bw:false, note:'Лямки.' },
      { id:'lat_pd',  name:'Тяга верхнього блоку',    nameEn:'Lat pulldown',           muscle:'back',      sets:3, reps:'10',   bw:false },
      { id:'lat_rA',  name:'Розведення гантелей',      nameEn:'Lateral raise',          muscle:'shoulders', sets:3, reps:'15',   bw:false },
      { id:'tri_pd',  name:'Трицепс на блоці',         nameEn:'Triceps pushdown',       muscle:'arms',      sets:3, reps:'12',   bw:false },
    ],
  },
  {
    id: 'B', name: 'День B', subtitle: 'Full Body · Гіпертрофія', optional: false,
    exercises: [
      { id:'rdl',     name:'Румунська тяга',           nameEn:'Romanian deadlift',      muscle:'legs',      sets:3, reps:'8',    bw:false, note:'Лямки.' },
      { id:'inc_db',  name:'Жим гантелей похилий',    nameEn:'Incline dumbbell press', muscle:'chest',     sets:4, reps:'8-10', bw:false },
      { id:'db_row',  name:'Тяга гантелі (одна рука)',nameEn:'One-arm dumbbell row',   muscle:'back',      sets:3, reps:'10',   bw:false, note:'На сторону. Лямки.' },
      { id:'leg_pr',  name:'Жим ногами',               nameEn:'Leg press',              muscle:'legs',      sets:3, reps:'12',   bw:false },
      { id:'lat_rB',  name:'Розведення гантелей',      nameEn:'Lateral raise',          muscle:'shoulders', sets:3, reps:'15',   bw:false },
      { id:'bi_curl', name:'Згинання біцепс',          nameEn:'Biceps curl',            muscle:'arms',      sets:3, reps:'12',   bw:false },
    ],
  },
  {
    id: 'C', name: 'День C', subtitle: 'Бонус — опціонально', optional: true,
    exercises: [
      { id:'pullup',  name:'Підтягування / з допомогою', nameEn:'Pull-ups',             muscle:'back',      sets:3, reps:'max',  bw:true,  bwBase:15 },
      { id:'cable_x', name:'Зведення на блоці',          nameEn:'Cable crossover',      muscle:'chest',     sets:3, reps:'15',   bw:false },
      { id:'lat_rC',  name:'Розведення гантелей',        nameEn:'Lateral raise',        muscle:'shoulders', sets:3, reps:'20',   bw:false },
      { id:'lunges',  name:'Випади ходьбою',             nameEn:'Walking lunges',       muscle:'legs',      sets:3, reps:'12',   bw:false },
      { id:'bi_tri',  name:'Суперсет біцепс + трицепс', nameEn:'Biceps curl',          muscle:'arms',      sets:3, reps:'15',   bw:false },
      { id:'core_ex', name:'Планка + підйом ніг',        nameEn:'Plank',                muscle:'core',      sets:3, reps:'—',    bw:true,  bwBase:25 },
    ],
  },
];

/* One swap alternative per exercise id */
const EXERCISE_ALTERNATIVES = {
  bench:   { id:'inc_db',  name:'Жим похилий гантелями',   nameEn:'Incline dumbbell press', muscle:'chest',     sets:4, reps:'8-10', bw:false },
  b_row:   { id:'lat_pd',  name:'Тяга верхнього блоку',     nameEn:'Lat pulldown',           muscle:'back',      sets:3, reps:'10',   bw:false },
  squat:   { id:'leg_pr',  name:'Жим ногами',               nameEn:'Leg press',              muscle:'legs',      sets:3, reps:'12',   bw:false },
  rdl:     { id:'lunges',  name:'Випади ходьбою',            nameEn:'Walking lunges',         muscle:'legs',      sets:3, reps:'12',   bw:false },
  inc_db:  { id:'bench',   name:'Жим лежачи',               nameEn:'Bench press',            muscle:'chest',     sets:3, reps:'5',    bw:false },
  db_row:  { id:'b_row',   name:'Тяга штанги в нахилі',     nameEn:'Barbell row',            muscle:'back',      sets:4, reps:'6',    bw:false, note:'Лямки.' },
  leg_pr:  { id:'squat',   name:'Присідання',               nameEn:'Squat',                  muscle:'legs',      sets:3, reps:'5',    bw:false },
  lat_pd:  { id:'pullup',  name:'Підтягування',             nameEn:'Pull-ups',               muscle:'back',      sets:3, reps:'max',  bw:true, bwBase:15 },
  lat_rA:  { id:'cable_x', name:'Зведення на блоці',        nameEn:'Cable crossover',        muscle:'chest',     sets:3, reps:'15',   bw:false },
  lat_rB:  { id:'cable_x', name:'Зведення на блоці',        nameEn:'Cable crossover',        muscle:'chest',     sets:3, reps:'15',   bw:false },
  lat_rC:  { id:'cable_x', name:'Зведення на блоці',        nameEn:'Cable crossover',        muscle:'chest',     sets:3, reps:'15',   bw:false },
  tri_pd:  { id:'bi_tri',  name:'Суперсет біцепс+трицепс', nameEn:'Biceps curl',            muscle:'arms',      sets:3, reps:'15',   bw:false },
  bi_curl: { id:'tri_pd',  name:'Трицепс на блоці',         nameEn:'Triceps pushdown',       muscle:'arms',      sets:3, reps:'12',   bw:false },
  pullup:  { id:'lat_pd',  name:'Тяга верхнього блоку',     nameEn:'Lat pulldown',           muscle:'back',      sets:3, reps:'10',   bw:false },
  cable_x: { id:'lat_rA',  name:'Розведення гантелей',      nameEn:'Lateral raise',          muscle:'shoulders', sets:3, reps:'15',   bw:false },
  lunges:  { id:'rdl',     name:'Румунська тяга',           nameEn:'Romanian deadlift',      muscle:'legs',      sets:3, reps:'8',    bw:false, note:'Лямки.' },
  bi_tri:  { id:'bi_curl', name:'Згинання біцепс',          nameEn:'Biceps curl',            muscle:'arms',      sets:3, reps:'12',   bw:false },
  core_ex: { id:'lunges',  name:'Випади ходьбою',           nameEn:'Walking lunges',         muscle:'legs',      sets:3, reps:'12',   bw:false },
};

const QUOTES = [
  {q:"A lesson without pain is meaningless. You can't gain something without sacrificing something else.",src:"Edward Elric · Fullmetal Alchemist"},
  {q:"The world is cruel, but also very beautiful.",src:"Mikasa Ackerman · Attack on Titan"},
  {q:"Enjoy the little detours. That's where you'll find the things more important than what you want.",src:"Ging Freecss · Hunter × Hunter"},
  {q:"Those who break the rules are scum, but those who abandon their comrades are worse than scum.",src:"Kakashi Hatake · Naruto"},
  {q:"If you don't share someone's pain, you can never understand them.",src:"Pain · Naruto"},
  {q:"A real warrior doesn't need a sword.",src:"Thors · Vinland Saga"},
  {q:"Happiness is simple.",src:"Thors · Vinland Saga"},
  {q:"Even if things are painful and tough, people should appreciate what it means to be alive at all.",src:"Yato · Noragami"},
  {q:"Hard work betrays none, but dreams betray many.",src:"Hikigaya Hachiman · OreGairu"},
  {q:"Fear is not evil. It tells you what your weakness is.",src:"Gildarts Clive · Fairy Tail"},
  {q:"People's lives don't end when they die. It ends when they lose faith.",src:"Itachi Uchiha · Naruto"},
  {q:"The ticket to the future is always open.",src:"Vash the Stampede · Trigun"},
  {q:"Whatever you lose, you'll find it again. But what you throw away, you'll never get back.",src:"Kenshin Himura · Rurouni Kenshin"},
  {q:"The only way to truly escape the mundane is for you to constantly be evolving.",src:"Koro-sensei · Assassination Classroom"},
  {q:"It's not the world that's messed up — it's those of us in it.",src:"Ken Kaneki · Tokyo Ghoul"},
  {q:"You can't sit around envying other people's worlds. You have to go out and change your own.",src:"Shinichi Izumi · Parasyte"},
  {q:"There's no shame in falling down. True shame is to not stand up again.",src:"Kuroko no Basket"},
  {q:"Moving on doesn't mean you forget. It means you accept what happened and continue living.",src:"Erza Scarlet · Fairy Tail"},
  {q:"A person grows when they're able to defeat their own weaknesses.",src:"Might Guy · Naruto"},
  {q:"We don't know what kind of people we truly are until the moment before our deaths.",src:"Itachi Uchiha · Naruto"},
  {q:"The worst part of being strong is that no one ever asks if you're okay.",src:"Levi Ackerman · Attack on Titan"},
  {q:"Nothing in this world is certain except the way you choose to live.",src:"Askeladd · Vinland Saga"},
  {q:"Power without perception is spiritually useless and therefore of no true value.",src:"Meruem · Hunter × Hunter"},
  {q:"Life is not a game of luck. If you wanna win, work hard.",src:"Sora · No Game No Life"},
  {q:"No matter how deep the night, it always turns to day eventually.",src:"Brook · One Piece"},
  {q:"I'll keep moving forward. Even if I have to crawl, even if it breaks me.",src:"Thorfinn · Vinland Saga"},
  {q:"You need to accept the fact that you're not the best and have all the will to strive to be better.",src:"Roronoa Zoro · One Piece"},
  {q:"Don't live for other people. Live your life for yourself.",src:"Victor Nikiforov · Yuri on Ice"},
  {q:"Even in the darkest place, something worthy of protection always emerges.",src:"Natsuki Subaru · Re:Zero"},
  {q:"The strong don't win. Those who win are strong.",src:"Erwin Smith · Attack on Titan"},
  {q:"You can die anytime, but living takes true courage.",src:"Kenshin Himura · Rurouni Kenshin"},
  {q:"If you don't take risks, you can't create a future.",src:"Monkey D. Luffy · One Piece"},
  {q:"A dropout will beat a genius through hard work.",src:"Rock Lee · Naruto"},
  {q:"Never forget who you want to become.",src:"Killua Zoldyck · Hunter × Hunter"},
  {q:"Once you meet someone, you never really forget them.",src:"Zeniba · Spirited Away"},
  {q:"It's fine now. Why? Because I am here!",src:"All Might · My Hero Academia"},
  {q:"Don't forget. Always, somewhere, someone is fighting for you.",src:"Homura Akemi · Madoka Magica"},
  {q:"There are no regrets. If one can be proud of one's life, one should not wish for another chance.",src:"Saber · Fate/Zero"},
  {q:"If the king doesn't move, then his subjects won't follow.",src:"Lelouch vi Britannia · Code Geass"},
  {q:"I never go back on my word. That's my ninja way.",src:"Naruto Uzumaki · Naruto"},
  {q:"When you give up, that's when the game is over.",src:"Slam Dunk"},
  {q:"The moment you give up is the moment you let someone else win.",src:"Koro-sensei · Assassination Classroom"},
  {q:"Get busy living, or get busy dying.",src:"Andy Dufresne · The Shawshank Redemption"},
  {q:"Hope is a good thing, maybe the best of things, and no good thing ever dies.",src:"The Shawshank Redemption"},
  {q:"You either die a hero, or you live long enough to see yourself become the villain.",src:"Harvey Dent · The Dark Knight"},
  {q:"Why so serious?",src:"The Joker · The Dark Knight"},
  {q:"Some men just want to watch the world burn.",src:"Alfred Pennyworth · The Dark Knight"},
  {q:"It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",src:"Rocky Balboa · Rocky Balboa"},
  {q:"Why do we fall? So we can learn to pick ourselves up.",src:"Thomas Wayne · Batman Begins"},
  {q:"It's not who I am underneath, but what I do that defines me.",src:"Bruce Wayne · Batman Begins"},
  {q:"Do, or do not. There is no try.",src:"Yoda · Star Wars"},
  {q:"Fear is the path to the dark side.",src:"Yoda · Star Wars"},
  {q:"Carpe diem. Seize the day, boys. Make your lives extraordinary.",src:"Mr. Keating · Dead Poets Society"},
  {q:"With great power comes great responsibility.",src:"Ben Parker · Spider-Man"},
  {q:"What we do in life echoes in eternity.",src:"Maximus · Gladiator"},
  {q:"All those moments will be lost in time, like tears in rain.",src:"Roy Batty · Blade Runner"},
  {q:"There is no spoon.",src:"The Matrix"},
  {q:"Free your mind.",src:"Morpheus · The Matrix"},
  {q:"We accept the love we think we deserve.",src:"The Perks of Being a Wallflower"},
  {q:"Life moves fast. If you don't stop and look around once in a while, you could miss it.",src:"Ferris Bueller's Day Off"},
  {q:"The greatest trick the devil ever pulled was convincing the world he didn't exist.",src:"Verbal Kint · The Usual Suspects"},
  {q:"After all, tomorrow is another day.",src:"Scarlett O'Hara · Gone with the Wind"},
  {q:"A man who doesn't spend time with his family can never be a real man.",src:"Vito Corleone · The Godfather"},
  {q:"To infinity and beyond.",src:"Buzz Lightyear · Toy Story"},
  {q:"Just keep swimming.",src:"Dory · Finding Nemo"},
  {q:"Every passing minute is another chance to turn it all around.",src:"Vanilla Sky"},
  {q:"May the Force be with you.",src:"Star Wars"},
  {q:"You can't handle the truth!",src:"Col. Jessup · A Few Good Men"},
  {q:"Here's looking at you, kid.",src:"Rick Blaine · Casablanca"},
  {q:"My mama always said life was like a box of chocolates. You never know what you're gonna get.",src:"Forrest Gump"},
  {q:"Hasta la vista, baby.",src:"The Terminator · Terminator 2"},
  {q:"You is kind, you is smart, you is important.",src:"Aibileen Clark · The Help"},
  {q:"It takes a great deal of bravery to stand up to our enemies, but just as much to stand up to our friends.",src:"Albus Dumbledore · Harry Potter"},
  {q:"We are who we choose to be.",src:"Green Goblin · Spider-Man"},
  {q:"Everybody lies.",src:"Dr. House · House M.D."},
  {q:"When you play the game of thrones, you win or you die.",src:"Cersei Lannister · Game of Thrones"},
  {q:"A mind needs books as a sword needs a whetstone, if it is to keep its edge.",src:"Tyrion Lannister · Game of Thrones"},
  {q:"Chaos isn't a pit. Chaos is a ladder.",src:"Petyr Baelish · Game of Thrones"},
  {q:"Not today.",src:"Syrio Forel · Game of Thrones"},
  {q:"Any man who must say 'I am the king' is no true king.",src:"Tywin Lannister · Game of Thrones"},
  {q:"Never forget what you are, for surely the world will not.",src:"Tyrion Lannister · Game of Thrones"},
  {q:"A lion doesn't concern himself with the opinions of a sheep.",src:"Tywin Lannister · Game of Thrones"},
  {q:"If you come at the king, you best not miss.",src:"Omar Little · The Wire"},
  {q:"A man's got to have a code.",src:"Omar Little · The Wire"},
  {q:"Every lie we tell incurs a debt to the truth. Sooner or later, that debt is paid.",src:"Valery Legasov · Chernobyl"},
  {q:"I am the one who knocks.",src:"Walter White · Breaking Bad"},
  {q:"Say my name.",src:"Walter White · Breaking Bad"},
  {q:"A wrong decision is better than indecision.",src:"Tony Soprano · The Sopranos"},
  {q:"We're not free in what we do, because we're not free in what we want.",src:"Dark · Netflix"},
  {q:"The question isn't where, but when.",src:"Jonas Kahnwald · Dark"},
  {q:"You see, but you do not observe.",src:"Sherlock Holmes · Sherlock"},
  {q:"When you have eliminated the impossible, whatever remains must be the truth.",src:"Sherlock Holmes · Sherlock"},
  {q:"In the land of the blind, the one-eyed man is king.",src:"Tommy Shelby · Peaky Blinders"},
  {q:"I drink and I know things.",src:"Tyrion Lannister · Game of Thrones"},
  {q:"Power is power.",src:"Cersei Lannister · Game of Thrones"},
  {q:"Winter is coming.",src:"House Stark · Game of Thrones"},
  {q:"Friends don't lie.",src:"Eleven · Stranger Things"},
  {q:"Mornings are for coffee and contemplation.",src:"Chief Hopper · Stranger Things"},
  {q:"People tell you who they are, but we ignore it.",src:"Don Draper · Mad Men"},
  {q:"I love you, but you are not serious people.",src:"Logan Roy · Succession"},
  {q:"You only do two days: the day you go in and the day you come out.",src:"The Wire"},
];
