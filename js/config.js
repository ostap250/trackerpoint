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
  shoulders: { exIds:['lat_rA','lat_rB','lat_rC','cable_lat_r'], mode:'kg', liftName:'Розведення (гантеля, кожна)', unit:'кг',
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
  lat_rA:  { id:'cable_lat_r', name:'Розведення на блоці',  nameEn:'Cable lateral raise',    muscle:'shoulders', sets:3, reps:'15',   bw:false },
  lat_rB:  { id:'cable_lat_r', name:'Розведення на блоці',  nameEn:'Cable lateral raise',    muscle:'shoulders', sets:3, reps:'15',   bw:false },
  lat_rC:  { id:'cable_lat_r', name:'Розведення на блоці',  nameEn:'Cable lateral raise',    muscle:'shoulders', sets:3, reps:'20',   bw:false },
  cable_lat_r: { id:'lat_rA', name:'Розведення гантелей',   nameEn:'Lateral raise',          muscle:'shoulders', sets:3, reps:'15',   bw:false },
  tri_pd:  { id:'bi_tri',  name:'Суперсет біцепс+трицепс', nameEn:'Biceps curl',            muscle:'arms',      sets:3, reps:'15',   bw:false },
  bi_curl: { id:'tri_pd',  name:'Трицепс на блоці',         nameEn:'Triceps pushdown',       muscle:'arms',      sets:3, reps:'12',   bw:false },
  pullup:  { id:'lat_pd',  name:'Тяга верхнього блоку',     nameEn:'Lat pulldown',           muscle:'back',      sets:3, reps:'10',   bw:false },
  cable_x: { id:'inc_db',  name:'Жим гантелей похилий',     nameEn:'Incline dumbbell press', muscle:'chest',     sets:4, reps:'8-10', bw:false },
  lunges:  { id:'rdl',     name:'Румунська тяга',           nameEn:'Romanian deadlift',      muscle:'legs',      sets:3, reps:'8',    bw:false, note:'Лямки.' },
  bi_tri:  { id:'bi_curl', name:'Згинання біцепс',          nameEn:'Biceps curl',            muscle:'arms',      sets:3, reps:'12',   bw:false },
  core_ex: { id:'lunges',  name:'Випади ходьбою',           nameEn:'Walking lunges',         muscle:'legs',      sets:3, reps:'12',   bw:false },
};

const QUOTES = [
  /* ─── Machiavelli ─────────────────────────────────────────────────────── */
  {q:"It is better to be feared than loved, if you cannot be both.",src:"Niccolò Machiavelli · The Prince"},
  {q:"Never was anything great achieved without danger.",src:"Niccolò Machiavelli · Discourses on Livy"},
  {q:"The fox cannot defend himself from traps, and the lion cannot defend himself from wolves. One must therefore be a fox to recognize traps, and a lion to frighten wolves.",src:"Niccolò Machiavelli · The Prince"},
  {q:"Before all else, be armed.",src:"Niccolò Machiavelli · The Prince"},
  {q:"One change always leaves the way open for another.",src:"Niccolò Machiavelli · The Prince"},
  /* ─── Stoics ───────────────────────────────────────────────────────────── */
  {q:"You have power over your mind, not outside events. Realize this, and you will find strength.",src:"Marcus Aurelius · Meditations"},
  {q:"What stands in the way becomes the way.",src:"Marcus Aurelius · Meditations"},
  {q:"Waste no more time arguing about what a good man should be. Be one.",src:"Marcus Aurelius · Meditations"},
  {q:"The soul becomes dyed with the colour of its thoughts.",src:"Marcus Aurelius · Meditations"},
  {q:"Confine yourself to the present.",src:"Marcus Aurelius · Meditations"},
  {q:"Dwell on the beauty of life. Watch the stars, and see yourself running with them.",src:"Marcus Aurelius · Meditations"},
  {q:"We suffer more in imagination than in reality.",src:"Seneca · Letters to Lucilius"},
  {q:"Begin at once to live, and count each separate day as a separate life.",src:"Seneca · Letters to Lucilius"},
  {q:"It is not that time is short, but that we waste so much of it.",src:"Seneca · On the Shortness of Life"},
  {q:"No man was ever wise by chance.",src:"Seneca · Moral Letters"},
  {q:"It's not what happens to you, but how you react that matters.",src:"Epictetus · Enchiridion"},
  {q:"Make the best use of what is in your power, and take the rest as it happens.",src:"Epictetus · Enchiridion"},
  /* ─── Philosophers ─────────────────────────────────────────────────────── */
  {q:"That which does not kill us makes us stronger.",src:"Friedrich Nietzsche · Twilight of the Idols"},
  {q:"He who has a why to live can bear almost any how.",src:"Friedrich Nietzsche · Ecce Homo"},
  {q:"You must have chaos within you to give birth to a dancing star.",src:"Friedrich Nietzsche · Thus Spoke Zarathustra"},
  {q:"The secret of the greatest fruitfulness is to live dangerously.",src:"Friedrich Nietzsche · The Gay Science"},
  {q:"There are no facts, only interpretations.",src:"Friedrich Nietzsche · Notebooks"},
  {q:"Pain and suffering are always inevitable for a large intelligence and a deep heart.",src:"Fyodor Dostoevsky · Crime and Punishment"},
  {q:"The mystery of human existence lies not in just staying alive, but in finding something to live for.",src:"Fyodor Dostoevsky · The Brothers Karamazov"},
  {q:"In the midst of winter, I found there was within me an invincible summer.",src:"Albert Camus · Return to Tipasa"},
  {q:"One must imagine Sisyphus happy.",src:"Albert Camus · The Myth of Sisyphus"},
  {q:"The supreme art of war is to subdue the enemy without fighting.",src:"Sun Tzu · The Art of War"},
  {q:"Appear weak when you are strong, and strong when you are weak.",src:"Sun Tzu · The Art of War"},
  {q:"The unexamined life is not worth living.",src:"Socrates · Plato's Apology"},
  /* ─── Films ────────────────────────────────────────────────────────────── */
  {q:"All those moments will be lost in time, like tears in rain.",src:"Roy Batty · Blade Runner"},
  {q:"What we do in life echoes in eternity.",src:"Maximus · Gladiator"},
  {q:"Get busy living, or get busy dying.",src:"Andy Dufresne · The Shawshank Redemption"},
  {q:"Hope is a good thing, maybe the best of things, and no good thing ever dies.",src:"Andy Dufresne · The Shawshank Redemption"},
  {q:"Some birds aren't meant to be caged. Their feathers are just too bright.",src:"Red · The Shawshank Redemption"},
  {q:"Do not go gentle into that good night.",src:"Cooper · Interstellar (Dylan Thomas)"},
  {q:"We used to look up at the sky and wonder at our place in the stars. Now we just look down and worry about our place in the dirt.",src:"Cooper · Interstellar"},
  {q:"It's not who I am underneath, but what I do that defines me.",src:"Bruce Wayne · Batman Begins"},
  {q:"You either die a hero, or you live long enough to see yourself become the villain.",src:"Harvey Dent · The Dark Knight"},
  {q:"Some men just want to watch the world burn.",src:"Alfred · The Dark Knight"},
  {q:"There are no two words in the English language more harmful than 'good job'.",src:"Terence Fletcher · Whiplash"},
  {q:"This is your life, and it's ending one minute at a time.",src:"Narrator · Fight Club"},
  {q:"It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",src:"Rocky Balboa"},
  {q:"I did it for me. I liked it. I was good at it. And I was really — I was alive.",src:"Walter White · Breaking Bad"},
  {q:"Happiness is only real when shared.",src:"Christopher McCandless · Into the Wild"},
  {q:"When you want something in life, you just gotta reach out and grab it.",src:"Christopher McCandless · Into the Wild"},
  {q:"Every passing minute is another chance to turn it all around.",src:"Sofia · Vanilla Sky"},
  {q:"The greatest trick the devil ever pulled was convincing the world he didn't exist.",src:"Verbal Kint · The Usual Suspects"},
  {q:"We accept the love we think we deserve.",src:"Charlie · The Perks of Being a Wallflower"},
  {q:"A man tells his stories so many times that he becomes the stories. They live on after him, and in that way he becomes immortal.",src:"Big Fish"},
  {q:"When you decide to be something, you can be it.",src:"Frank Costello · The Departed"},
  {q:"Carpe diem. Seize the day, boys. Make your lives extraordinary.",src:"Mr. Keating · Dead Poets Society"},
  {q:"Every lie we tell incurs a debt to the truth. Sooner or later, that debt is paid.",src:"Valery Legasov · Chernobyl"},
  /* ─── TV Series ────────────────────────────────────────────────────────── */
  {q:"Chaos isn't a pit. Chaos is a ladder.",src:"Petyr Baelish · Game of Thrones"},
  {q:"When you play the game of thrones, you win or you die.",src:"Cersei Lannister · Game of Thrones"},
  {q:"A mind needs books as a sword needs a whetstone.",src:"Tyrion Lannister · Game of Thrones"},
  {q:"A lion doesn't concern himself with the opinions of a sheep.",src:"Tywin Lannister · Game of Thrones"},
  {q:"Any man who must say 'I am the king' is no true king.",src:"Tywin Lannister · Game of Thrones"},
  {q:"Never forget what you are, for surely the world will not.",src:"Tyrion Lannister · Game of Thrones"},
  {q:"Not today.",src:"Syrio Forel · Game of Thrones"},
  {q:"The man who passes the sentence should swing the sword.",src:"Ned Stark · Game of Thrones"},
  {q:"If you come at the king, you best not miss.",src:"Omar Little · The Wire"},
  {q:"A man's got to have a code.",src:"Omar Little · The Wire"},
  {q:"All the pieces matter.",src:"Lester Freamon · The Wire"},
  {q:"I am the one who knocks.",src:"Walter White · Breaking Bad"},
  {q:"A wrong decision is better than indecision.",src:"Tony Soprano · The Sopranos"},
  {q:"People tell you who they are, but we ignore it.",src:"Don Draper · Mad Men"},
  {q:"Change is neither good nor bad. It simply is.",src:"Don Draper · Mad Men"},
  {q:"When you have eliminated the impossible, whatever remains must be the truth.",src:"Sherlock Holmes · Sherlock"},
  {q:"You see, but you do not observe.",src:"Sherlock Holmes · Sherlock"},
  {q:"In the land of the blind, the one-eyed man is king.",src:"Tommy Shelby · Peaky Blinders"},
  {q:"We're not free in what we do, because we're not free in what we want.",src:"Jonas Kahnwald · Dark"},
  {q:"Power is a lot like real estate. It's all about location. The closer you are to the source, the higher your property value.",src:"Frank Underwood · House of Cards"},
  /* ─── Anime ────────────────────────────────────────────────────────────── */
  {q:"A lesson without pain is meaningless. You can't gain something without sacrificing something else.",src:"Edward Elric · Fullmetal Alchemist: Brotherhood"},
  {q:"Humankind cannot gain anything without first giving something in return. To obtain, something of equal value must be lost.",src:"Alphonse Elric · Fullmetal Alchemist: Brotherhood"},
  {q:"If you win, you live. If you lose, you die. If you don't fight, you can't win.",src:"Eren Yeager · Attack on Titan"},
  {q:"Someone who can't sacrifice anything can't change anything.",src:"Armin Arlert · Attack on Titan"},
  {q:"The strong don't win. Those who win are strong.",src:"Erwin Smith · Attack on Titan"},
  {q:"A real warrior needs no sword.",src:"Thors · Vinland Saga"},
  {q:"There is no one you need to fight. You have no enemies.",src:"Thors · Vinland Saga"},
  {q:"Nothing in this world is certain except the way you choose to live.",src:"Askeladd · Vinland Saga"},
  {q:"I'll keep moving forward. Even if I have to crawl, even if it breaks me.",src:"Thorfinn · Vinland Saga"},
  {q:"Whatever happens, happens.",src:"Spike Spiegel · Cowboy Bebop"},
  {q:"You're gonna carry that weight.",src:"Cowboy Bebop"},
  {q:"You can't change the world without getting your hands dirty.",src:"Lelouch vi Britannia · Code Geass"},
  {q:"If strength is justice, then is powerlessness a crime?",src:"Lelouch vi Britannia · Code Geass"},
  {q:"Don't believe in yourself. Believe in me who believes in you.",src:"Kamina · Gurren Lagann"},
  {q:"Go beyond the impossible and kick reason to the curb.",src:"Kamina · Gurren Lagann"},
  {q:"Those who break the rules are scum, but those who abandon their comrades are worse than scum.",src:"Kakashi Hatake · Naruto"},
  {q:"People's lives don't end when they die. It ends when they lose faith.",src:"Itachi Uchiha · Naruto"},
  {q:"If you don't share someone's pain, you can never understand them.",src:"Pain · Naruto"},
  {q:"A dropout will beat a genius through hard work.",src:"Rock Lee · Naruto"},
  {q:"If you don't take risks, you can't create a future.",src:"Monkey D. Luffy · One Piece"},
  {q:"No matter how deep the night, it always turns to day eventually.",src:"Brook · One Piece"},
  {q:"Enjoy the little detours. That's where you'll find the things more important than what you want.",src:"Ging Freecss · Hunter × Hunter"},
  {q:"Never forget who you want to become.",src:"Killua Zoldyck · Hunter × Hunter"},
  {q:"Hard work betrays none, but dreams betray many.",src:"Hikigaya Hachiman · OreGairu"},
  {q:"Fear is not evil. It tells you what your weakness is.",src:"Gildarts Clive · Fairy Tail"},
  {q:"Moving on doesn't mean you forget. It means you accept what happened and continue living.",src:"Erza Scarlet · Fairy Tail"},
  {q:"The ticket to the future is always open.",src:"Vash the Stampede · Trigun"},
  {q:"You can die anytime, but living takes true courage.",src:"Kenshin Himura · Rurouni Kenshin"},
  {q:"There are no regrets. If one can be proud of one's life, one should not wish for another chance.",src:"Saber · Fate/Zero"},
  {q:"Even in the darkest place, something worthy of protection always emerges.",src:"Natsuki Subaru · Re:Zero"},
  {q:"It's fine now. Why? Because I am here!",src:"All Might · My Hero Academia"},
  {q:"A person grows when they're able to defeat their own weaknesses.",src:"Might Guy · Naruto"},
];
