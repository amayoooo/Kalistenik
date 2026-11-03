/* =========================================================
   KALISTENIK PRO — DATA PROGRAM
   Ubah angka latihan di sini. Setiap kategori adalah jalur
   progresi: urutan di dalam level = urutan unlock.
   unit: "reps" (repetisi) atau "hold" (detik)
   side: true = dikerjakan per sisi / per kaki
   tSets × tVal = target untuk lulus (unlock berikutnya)
   gate: true = syarat naik level
   ========================================================= */

const LEVELS = [
  { n: 1, key: "basic",        name: "Basic",        short: "BSC", goal: "Fondasi kekuatan, mobilitas, dan teknik", dur: "1–3 bulan",  rest: 75,  freq: "3× per minggu · full body" },
  { n: 2, key: "intermediate", name: "Intermediate", short: "INT", goal: "Push-up, pull-up, dip, dan squat penuh",   dur: "3–6 bulan",  rest: 105, freq: "3–4× per minggu · upper / lower" },
  { n: 3, key: "advanced",     name: "Advanced",     short: "ADV", goal: "Variasi archer, L-sit, dan muscle-up",      dur: "6–12 bulan", rest: 150, freq: "4× per minggu · push / pull / legs / skill" },
  { n: 4, key: "expert",       name: "Expert",       short: "EXP", goal: "Planche, front lever, one-arm, HSPU",        dur: "1 tahun+",   rest: 150, freq: "4–5× per minggu · skill + kekuatan" }
];

const CATEGORIES = [
  { key: "push",   name: "Push",  sub: "Dorong" },
  { key: "pull",   name: "Pull",  sub: "Tarik" },
  { key: "legs",   name: "Legs",  sub: "Kaki" },
  { key: "core",   name: "Core",  sub: "Perut" },
  { key: "skill",  name: "Skill", sub: "Keseimbangan" },
  { key: "pelvic", name: "Pelvic Floor", sub: "Dasar panggul" }
];

const EXERCISES = [
  /* ---------------- LEVEL 1 · BASIC ---------------- */
  { id: "wall-pushup", cat: "push", lv: 1, name: "Wall Push-up", sets: 3, min: 10, max: 15, unit: "reps", tSets: 3, tVal: 20,
    how: ["Berdiri satu lengan dari dinding, tangan selebar bahu.", "Turunkan dada ke dinding dengan badan lurus seperti papan.", "Dorong kembali sampai lengan lurus."],
    mistakes: ["Pinggul maju duluan", "Siku melebar 90° ke samping"] },
  { id: "incline-pushup", cat: "push", lv: 1, name: "Incline Push-up", sets: 3, min: 8, max: 12, unit: "reps", tSets: 3, tVal: 15,
    how: ["Tangan di meja atau bangku setinggi pinggang.", "Kencangkan perut dan bokong, badan satu garis.", "Dada turun menyentuh tepi bangku, lalu dorong."],
    mistakes: ["Kepala menunduk duluan", "Gerakan setengah jalan"] },
  { id: "knee-pushup", cat: "push", lv: 1, name: "Knee Push-up", sets: 3, min: 8, max: 12, unit: "reps", tSets: 3, tVal: 15, gate: true,
    how: ["Lutut di lantai, garis lurus dari lutut ke kepala.", "Siku mengarah sekitar 45° dari badan.", "Dada hampir menyentuh lantai, lalu dorong penuh."],
    mistakes: ["Pinggul menekuk ke atas", "Bahu naik ke telinga"] },

  { id: "dead-hang", cat: "pull", lv: 1, name: "Dead Hang", sets: 3, min: 15, max: 30, unit: "hold", tSets: 3, tVal: 60, gate: true,
    how: ["Gantung di palang dengan genggaman selebar bahu.", "Lengan lurus, badan rileks dan tidak berayun.", "Napas tetap teratur selama menahan."],
    mistakes: ["Kaki berayun", "Menahan napas"] },
  { id: "scapula-pull", cat: "pull", lv: 1, name: "Scapula Pull", sets: 3, min: 8, max: 10, unit: "reps", tSets: 3, tVal: 12,
    how: ["Mulai dari dead hang dengan lengan lurus.", "Tarik bahu turun dan ke belakang tanpa menekuk siku.", "Tahan 1 detik, lalu turunkan perlahan."],
    mistakes: ["Siku ikut menekuk", "Gerakan terlalu cepat"] },
  { id: "australian-row", cat: "pull", lv: 1, name: "Australian Row", sets: 3, min: 8, max: 12, unit: "reps", tSets: 3, tVal: 15, gate: true,
    how: ["Berbaring di bawah palang rendah atau meja kokoh, tumit di lantai.", "Badan lurus, tarik dada ke palang.", "Turunkan perlahan sampai lengan lurus."],
    mistakes: ["Pinggul turun", "Dagu yang mengejar palang"] },

  { id: "squat", cat: "legs", lv: 1, name: "Bodyweight Squat", sets: 3, min: 15, max: 20, unit: "reps", tSets: 3, tVal: 30, gate: true,
    how: ["Kaki selebar bahu, ujung jari sedikit keluar.", "Turunkan pinggul sampai paha minimal sejajar lantai.", "Lutut searah jari kaki, dada tetap tegak."],
    mistakes: ["Tumit terangkat", "Lutut masuk ke dalam"] },
  { id: "lunge", cat: "legs", lv: 1, name: "Lunge", sets: 3, min: 10, max: 10, unit: "reps", side: true, tSets: 3, tVal: 15,
    how: ["Langkahkan satu kaki ke depan.", "Turunkan sampai kedua lutut menekuk 90°.", "Dorong dari tumit depan untuk kembali."],
    mistakes: ["Lutut depan melewati jari jauh", "Badan condong ke depan"] },
  { id: "glute-bridge", cat: "legs", lv: 1, name: "Glute Bridge", sets: 3, min: 15, max: 15, unit: "reps", tSets: 3, tVal: 25,
    how: ["Berbaring telentang, lutut ditekuk, telapak kaki di lantai.", "Angkat pinggul sampai lutut–pinggul–bahu lurus.", "Kencangkan bokong di atas 1 detik."],
    mistakes: ["Punggung bawah melengkung", "Mendorong dengan jari kaki"] },

  { id: "plank", cat: "core", lv: 1, name: "Plank", sets: 3, min: 20, max: 30, unit: "hold", tSets: 3, tVal: 60, gate: true,
    how: ["Bertumpu pada lengan bawah, siku di bawah bahu.", "Badan lurus dari kepala ke tumit.", "Kencangkan perut dan bokong."],
    mistakes: ["Pinggul turun", "Pinggul terlalu tinggi"] },
  { id: "dead-bug", cat: "core", lv: 1, name: "Dead Bug", sets: 3, min: 10, max: 10, unit: "reps", tSets: 3, tVal: 15,
    how: ["Telentang, lengan ke atas, lutut 90°.", "Turunkan lengan dan kaki yang berlawanan perlahan.", "Punggung bawah tetap menempel lantai."],
    mistakes: ["Punggung terangkat", "Gerakan terburu-buru"] },
  { id: "tuck-hollow", cat: "core", lv: 1, name: "Tuck Hollow Hold", sets: 3, min: 15, max: 15, unit: "hold", tSets: 3, tVal: 30,
    how: ["Telentang, peluk lutut ke dada.", "Angkat bahu dan kaki sedikit dari lantai.", "Punggung bawah menekan lantai."],
    mistakes: ["Leher tegang", "Menahan napas"] },

  /* ---------------- LEVEL 2 · INTERMEDIATE ---------------- */
  { id: "pushup", cat: "push", lv: 2, name: "Push-up", sets: 3, min: 8, max: 12, unit: "reps", tSets: 3, tVal: 20, gate: true,
    how: ["Tangan sedikit lebih lebar dari bahu.", "Badan lurus, turunkan dada sampai hampir menyentuh lantai.", "Dorong sampai lengan lurus dan bahu terdorong."],
    mistakes: ["Pinggul turun", "Siku melebar 90°"] },
  { id: "diamond-pushup", cat: "push", lv: 2, name: "Diamond Push-up", sets: 3, min: 6, max: 10, unit: "reps", tSets: 3, tVal: 12,
    how: ["Jari telunjuk dan jempol membentuk berlian di bawah dada.", "Siku turun dekat ke badan.", "Dada menyentuh tangan, lalu dorong."],
    mistakes: ["Siku melebar", "Rentang gerak pendek"] },
  { id: "dips", cat: "push", lv: 2, name: "Dips", sets: 3, min: 5, max: 10, unit: "reps", tSets: 3, tVal: 12, gate: true,
    how: ["Mulai di bangku, lalu naik ke palang paralel.", "Turun sampai bahu sedikit di bawah siku.", "Dorong ke atas sampai lengan lurus."],
    mistakes: ["Bahu naik ke telinga", "Turun terlalu dalam saat bahu belum siap"] },

  { id: "negative-pullup", cat: "pull", lv: 2, name: "Negative Pull-up", sets: 3, min: 3, max: 5, unit: "reps", tSets: 3, tVal: 5,
    how: ["Lompat ke posisi atas: dagu di atas palang.", "Turunkan badan perlahan selama 5 detik.", "Target lanjut: turun 8 detik."],
    mistakes: ["Jatuh cepat di setengah bawah", "Badan berayun"] },
  { id: "pullup", cat: "pull", lv: 2, name: "Pull-up", sets: 3, min: 3, max: 8, unit: "reps", tSets: 3, tVal: 10, gate: true,
    how: ["Genggaman overhand selebar bahu.", "Mulai dengan tarik bahu turun, lalu tarik siku ke pinggang.", "Dagu melewati palang, turun sampai lengan lurus."],
    mistakes: ["Kipping / mengayun", "Setengah rentang gerak"] },
  { id: "chinup", cat: "pull", lv: 2, name: "Chin-up", sets: 3, min: 5, max: 8, unit: "reps", tSets: 3, tVal: 10,
    how: ["Genggaman underhand (telapak menghadap wajah).", "Tarik dada ke arah palang.", "Turun terkontrol sampai lurus."],
    mistakes: ["Leher menjulur ke depan", "Turun terlalu cepat"] },

  { id: "bulgarian", cat: "legs", lv: 2, name: "Bulgarian Split Squat", sets: 3, min: 8, max: 12, unit: "reps", side: true, tSets: 3, tVal: 15, gate: true,
    how: ["Punggung kaki belakang di atas bangku.", "Turunkan pinggul lurus ke bawah.", "Dorong dari tumit kaki depan."],
    mistakes: ["Lutut depan masuk ke dalam", "Jarak kaki terlalu dekat"] },
  { id: "jump-squat", cat: "legs", lv: 2, name: "Jump Squat", sets: 3, min: 8, max: 10, unit: "reps", tSets: 3, tVal: 15,
    how: ["Squat sampai paha sejajar lantai.", "Melompat eksplosif ke atas.", "Mendarat lembut dengan lutut menekuk."],
    mistakes: ["Mendarat dengan kaki lurus", "Lutut masuk saat mendarat"] },
  { id: "calf-raise", cat: "legs", lv: 2, name: "Single-leg Calf Raise", sets: 3, min: 10, max: 10, unit: "reps", side: true, tSets: 3, tVal: 20,
    how: ["Berdiri satu kaki di tepi anak tangga.", "Angkat tumit setinggi mungkin, tahan 1 detik.", "Turunkan tumit di bawah anak tangga."],
    mistakes: ["Memantul cepat", "Lutut menekuk"] },

  { id: "hollow-hold", cat: "core", lv: 2, name: "Hollow Body Hold", sets: 3, min: 20, max: 30, unit: "hold", tSets: 3, tVal: 45,
    how: ["Telentang, lengan lurus di atas kepala.", "Angkat bahu dan kaki lurus, bentuk seperti pisang.", "Punggung bawah tetap menempel lantai."],
    mistakes: ["Punggung bawah terangkat", "Kaki terlalu tinggi"] },
  { id: "hanging-knee", cat: "core", lv: 2, name: "Hanging Knee Raise", sets: 3, min: 8, max: 12, unit: "reps", tSets: 3, tVal: 15,
    how: ["Gantung di palang, bahu aktif.", "Angkat lutut ke dada dengan menggulung panggul.", "Turunkan perlahan tanpa berayun."],
    mistakes: ["Mengayun", "Hanya mengangkat paha tanpa panggul"] },
  { id: "tuck-lsit", cat: "core", lv: 2, name: "Tuck L-sit", sets: 3, min: 10, max: 15, unit: "hold", tSets: 3, tVal: 20, gate: true,
    how: ["Tangan di lantai atau paralel, lengan lurus.", "Dorong bahu ke bawah, angkat pinggul.", "Lutut ditekuk ke dada, tahan."],
    mistakes: ["Bahu naik", "Siku menekuk"] },

  { id: "wall-handstand", cat: "skill", lv: 2, name: "Wall Handstand", sets: 3, min: 20, max: 30, unit: "hold", tSets: 3, tVal: 60, gate: true,
    how: ["Posisi dada menghadap dinding (jalan naik dengan kaki).", "Tangan selebar bahu, dorong lantai menjauh.", "Badan lurus, perut dan bokong kencang."],
    mistakes: ["Punggung melengkung (banana)", "Bahu tidak terdorong penuh"] },

  /* ---------------- LEVEL 3 · ADVANCED ---------------- */
  { id: "archer-pushup", cat: "push", lv: 3, name: "Archer Push-up", sets: 3, min: 5, max: 8, unit: "reps", side: true, tSets: 3, tVal: 10, gate: true,
    how: ["Tangan sangat lebar.", "Turunkan badan ke satu tangan, tangan lain lurus ke samping.", "Dorong kembali ke tengah, ganti sisi."],
    mistakes: ["Pinggul berputar", "Tangan lurus ikut menekuk"] },
  { id: "pseudo-planche", cat: "push", lv: 3, name: "Pseudo Planche Push-up", sets: 3, min: 6, max: 10, unit: "reps", tSets: 3, tVal: 12,
    how: ["Tangan di samping pinggang, jari mengarah ke samping/belakang.", "Condongkan bahu jauh di depan tangan.", "Push-up dengan tetap condong."],
    mistakes: ["Kehilangan condong saat turun", "Pergelangan belum dipanaskan"] },
  { id: "pike-pushup", cat: "push", lv: 3, name: "Elevated Pike Push-up", sets: 3, min: 6, max: 10, unit: "reps", tSets: 3, tVal: 12,
    how: ["Kaki di atas bangku, pinggul tinggi membentuk huruf V terbalik.", "Turunkan kepala ke depan tangan (segitiga).", "Dorong lurus ke atas."],
    mistakes: ["Kepala jatuh tepat di antara tangan", "Pinggul turun"] },

  { id: "ctb-pullup", cat: "pull", lv: 3, name: "Chest-to-bar Pull-up", sets: 3, min: 3, max: 6, unit: "reps", tSets: 3, tVal: 8,
    how: ["Tarik eksplosif dari dead hang.", "Dada bawah menyentuh palang.", "Turun terkontrol."],
    mistakes: ["Kipping", "Siku melebar di atas"] },
  { id: "archer-pullup", cat: "pull", lv: 3, name: "Archer Pull-up", sets: 3, min: 3, max: 5, unit: "reps", side: true, tSets: 3, tVal: 6,
    how: ["Genggaman sangat lebar.", "Tarik ke satu tangan, tangan lain lurus di palang.", "Turun, ganti sisi."],
    mistakes: ["Tangan lurus ikut menarik", "Badan berputar"] },
  { id: "muscle-up", cat: "pull", lv: 3, name: "Muscle-up", sets: 3, min: 2, max: 4, unit: "reps", tSets: 3, tVal: 5, gate: true,
    how: ["Latih negative dulu: turun dari atas palang perlahan.", "Tarik eksplosif ke pinggang, lalu transisi siku ke atas palang.", "Dorong sampai lengan lurus (straight bar dip)."],
    mistakes: ["Satu lengan naik duluan (chicken wing)", "Tarikan tidak cukup tinggi"] },

  { id: "shrimp-squat", cat: "legs", lv: 3, name: "Shrimp Squat", sets: 3, min: 5, max: 8, unit: "reps", side: true, tSets: 3, tVal: 10,
    how: ["Berdiri satu kaki, pegang kaki lain di belakang.", "Turunkan lutut belakang ke lantai.", "Berdiri kembali tanpa lompat."],
    mistakes: ["Lutut menghantam lantai", "Badan terlalu tegak"] },
  { id: "pistol", cat: "legs", lv: 3, name: "Pistol Squat", sets: 3, min: 3, max: 6, unit: "reps", side: true, tSets: 3, tVal: 8, gate: true,
    how: ["Mulai dibantu pegangan atau ke kursi.", "Satu kaki lurus ke depan, squat penuh di kaki lain.", "Tumit tetap menempel lantai."],
    mistakes: ["Tumit terangkat", "Jatuh di bagian bawah"] },

  { id: "lsit", cat: "core", lv: 3, name: "L-sit", sets: 3, min: 10, max: 20, unit: "hold", tSets: 3, tVal: 30, gate: true,
    how: ["Lengan lurus, bahu ditekan ke bawah.", "Kaki lurus sejajar lantai, ujung kaki menunjuk.", "Paha dikencangkan."],
    mistakes: ["Lutut menekuk", "Bahu naik"] },
  { id: "toes-to-bar", cat: "core", lv: 3, name: "Toes-to-bar", sets: 3, min: 6, max: 10, unit: "reps", tSets: 3, tVal: 12,
    how: ["Gantung dengan bahu aktif.", "Angkat kaki lurus sampai ujung kaki menyentuh palang.", "Turunkan perlahan tanpa ayunan."],
    mistakes: ["Mengayun keras", "Lutut menekuk"] },
  { id: "dragon-neg", cat: "core", lv: 3, name: "Dragon Flag Negative", sets: 3, min: 3, max: 5, unit: "reps", tSets: 3, tVal: 6,
    how: ["Pegang bangku atau tiang di belakang kepala.", "Naikkan badan lurus bertumpu bahu.", "Turunkan badan lurus perlahan 4–5 detik."],
    mistakes: ["Pinggul menekuk", "Bertumpu di leher"] },

  { id: "tuck-fl", cat: "skill", lv: 3, name: "Tuck Front Lever", sets: 4, min: 10, max: 15, unit: "hold", tSets: 4, tVal: 20, gate: true,
    how: ["Gantung, tarik lengan lurus ke bawah (depress).", "Angkat badan sejajar lantai dengan lutut di dada.", "Punggung rata, lengan tetap lurus."],
    mistakes: ["Siku menekuk", "Punggung membulat berlebihan"] },
  { id: "tuck-planche", cat: "skill", lv: 3, name: "Tuck Planche", sets: 4, min: 5, max: 10, unit: "hold", tSets: 4, tVal: 15, gate: true,
    how: ["Tangan di lantai/paralel, lengan lurus.", "Condong ke depan, angkat kaki dengan lutut ditekuk.", "Punggung membulat, bahu terdorong (protraksi)."],
    mistakes: ["Siku menekuk", "Kurang condong"] },
  { id: "freestanding-hs", cat: "skill", lv: 3, name: "Freestanding Handstand", sets: 5, min: 5, max: 10, unit: "hold", tSets: 1, tVal: 15, gate: true,
    how: ["Kick-up ke handstand tanpa dinding (10 percobaan).", "Jari menekan lantai untuk mengoreksi keseimbangan.", "Latih keluar aman: putar satu tangan (pirouette)."],
    mistakes: ["Kick-up terlalu keras", "Tidak tahu cara jatuh aman"] },

  /* ---------------- LEVEL 4 · EXPERT ---------------- */
  { id: "one-arm-pushup", cat: "push", lv: 4, name: "One-arm Push-up", sets: 3, min: 3, max: 5, unit: "reps", side: true, tSets: 3, tVal: 8,
    how: ["Mulai incline, lalu ke lantai.", "Kaki lebar, satu tangan di bawah dada.", "Turun lurus tanpa memutar pinggul."],
    mistakes: ["Badan berputar", "Kaki terlalu rapat"] },
  { id: "wall-hspu", cat: "push", lv: 4, name: "Wall Handstand Push-up", sets: 3, min: 3, max: 6, unit: "reps", tSets: 3, tVal: 10,
    how: ["Handstand menghadap dinding atau punggung ke dinding.", "Turunkan kepala ke lantai membentuk segitiga dengan tangan.", "Dorong sampai lengan lurus."],
    mistakes: ["Siku melebar", "Punggung melengkung"] },
  { id: "free-hspu", cat: "push", lv: 4, name: "Freestanding HSPU", sets: 3, min: 1, max: 3, unit: "reps", tSets: 1, tVal: 5,
    how: ["Kuasai handstand bebas 30 detik dulu.", "Turun terkontrol dengan keseimbangan dijaga jari.", "Dorong lurus ke atas."],
    mistakes: ["Kehilangan garis tubuh", "Turun terlalu cepat"] },

  { id: "mu-volume", cat: "pull", lv: 4, name: "Muscle-up Volume", sets: 3, min: 5, max: 8, unit: "reps", tSets: 1, tVal: 10,
    how: ["Muscle-up strict, tanpa kipping besar.", "Transisi halus dan bersih.", "Target: 10 berturut-turut."],
    mistakes: ["Chicken wing", "Form rusak saat lelah"] },
  { id: "front-lever-raise", cat: "pull", lv: 4, name: "Front Lever Raise", sets: 3, min: 3, max: 5, unit: "reps", tSets: 3, tVal: 8,
    how: ["Dari inverted hang, turunkan badan ke posisi lever.", "Angkat kembali dengan lengan lurus.", "Mulai dari tuck atau straddle."],
    mistakes: ["Siku menekuk", "Pinggul menekuk"] },
  { id: "one-arm-pullup", cat: "pull", lv: 4, name: "One-arm Pull-up", sets: 4, min: 1, max: 3, unit: "reps", side: true, tSets: 1, tVal: 1,
    how: ["Latihan bantuan: tangan lain memegang handuk atau pergelangan.", "Lanjut ke negative satu tangan 5 detik.", "Target: 1 repetisi strict per sisi."],
    mistakes: ["Memaksa saat siku nyeri", "Badan berputar berlebihan"] },

  { id: "pistol-volume", cat: "legs", lv: 4, name: "Pistol Squat Volume", sets: 3, min: 8, max: 12, unit: "reps", side: true, tSets: 3, tVal: 15,
    how: ["Pistol penuh tanpa bantuan.", "Kontrol di bagian bawah 1 detik.", "Tumit menempel sepanjang gerakan."],
    mistakes: ["Memantul di bawah", "Lutut masuk ke dalam"] },
  { id: "dragon-pistol", cat: "legs", lv: 4, name: "Dragon Pistol Squat", sets: 3, min: 3, max: 5, unit: "reps", side: true, tSets: 3, tVal: 8,
    how: ["Kaki bebas melintas di belakang kaki tumpu.", "Squat penuh dengan pinggul terbuka.", "Butuh mobilitas pinggul yang baik."],
    mistakes: ["Memaksa tanpa mobilitas", "Kehilangan keseimbangan ke belakang"] },

  { id: "dragon-flag", cat: "core", lv: 4, name: "Dragon Flag", sets: 3, min: 5, max: 8, unit: "reps", tSets: 3, tVal: 10,
    how: ["Naik dan turun dengan badan tetap lurus.", "Bertumpu di bahu atas, bukan leher.", "Kontrol penuh di kedua arah."],
    mistakes: ["Pinggul menekuk", "Leher tertekan"] },
  { id: "vsit", cat: "core", lv: 4, name: "V-sit", sets: 4, min: 5, max: 10, unit: "hold", tSets: 4, tVal: 15,
    how: ["Dari L-sit, dorong bahu ke bawah dan condong ke belakang.", "Angkat kaki lebih tinggi membentuk huruf V.", "Fleksibilitas hamstring sangat membantu."],
    mistakes: ["Lutut menekuk", "Siku menekuk"] },

  { id: "front-lever", cat: "skill", lv: 4, name: "Front Lever", sets: 5, min: 5, max: 10, unit: "hold", tSets: 1, tVal: 10,
    how: ["Progresi: advanced tuck → straddle → full.", "Lengan lurus, badan sejajar lantai.", "Bokong dan perut kencang, kaki rapat (full)."],
    mistakes: ["Pinggul turun", "Siku menekuk"] },
  { id: "planche", cat: "skill", lv: 4, name: "Planche", sets: 5, min: 5, max: 10, unit: "hold", tSets: 1, tVal: 10,
    how: ["Progresi: advanced tuck → straddle → full.", "Condong ke depan, bahu protraksi.", "Target realistis: straddle 10 detik."],
    mistakes: ["Kurang condong", "Pergelangan tidak dipanaskan"] },
  { id: "hs-60", cat: "skill", lv: 4, name: "Handstand 60 detik", sets: 5, min: 20, max: 30, unit: "hold", tSets: 1, tVal: 60,
    how: ["Handstand bebas dengan garis lurus.", "Latih hold panjang dengan napas tenang.", "Kualitas garis lebih penting dari durasi."],
    mistakes: ["Banana back", "Menahan napas"] },
  { id: "human-flag", cat: "skill", lv: 4, name: "Human Flag", sets: 5, min: 3, max: 8, unit: "hold", tSets: 1, tVal: 10,
    how: ["Pegang tiang vertikal, tangan atas menarik, tangan bawah mendorong.", "Progresi: tuck → straddle → full.", "Badan sejajar lantai."],
    mistakes: ["Lengan bawah menekuk", "Pinggul turun"] }
];

/* ------------------------------------------------------------------
   PELVIC FLOOR (KEGEL) — latihan harian dengan pemandu fase.
   steps(d) menghasilkan urutan fase untuk timer pemandu.
   d = true untuk sesi harian (1 set per latihan, ±5–10 menit).
   kind: contract | hold | relax | breath | move
------------------------------------------------------------------ */
const P = {
  breath: (min) => { const s = []; const cycles = Math.round(min * 60 / 10); for (let i = 0; i < cycles; i++) { s.push({ kind: "breath", label: "Tarik napas", sub: "Perut mengembang", sec: 4 }); s.push({ kind: "relax", label: "Hembuskan", sub: "Pelan dan panjang", sec: 6 }); } return s; },
  hold: (sets, reps, hold, relax) => { const s = []; for (let a = 0; a < sets; a++) { for (let r = 0; r < reps; r++) { s.push({ kind: "contract", label: "Kencangkan", sub: `Repetisi ${r + 1}/${reps} · set ${a + 1}/${sets}`, sec: hold }); s.push({ kind: "relax", label: "Lepas", sub: "Rileks penuh", sec: relax }); } if (a < sets - 1) s.push({ kind: "rest", label: "Istirahat", sub: `Set ${a + 2} berikutnya`, sec: 30 }); } return s; },
  flick: (sets, reps) => { const s = []; for (let a = 0; a < sets; a++) { for (let r = 0; r < reps; r++) { s.push({ kind: "contract", label: "Kencang", sub: `${r + 1}/${reps} · set ${a + 1}/${sets}`, sec: 1 }); s.push({ kind: "relax", label: "Lepas", sub: `${r + 1}/${reps} · set ${a + 1}/${sets}`, sec: 1 }); } if (a < sets - 1) s.push({ kind: "rest", label: "Istirahat", sub: `Set ${a + 2} berikutnya`, sec: 30 }); } return s; },
  reverse: (sets, reps, hold) => { const s = []; for (let a = 0; a < sets; a++) { for (let r = 0; r < reps; r++) { s.push({ kind: "breath", label: "Tarik napas & lepaskan", sub: `Dasar panggul turun · ${r + 1}/${reps}`, sec: hold }); s.push({ kind: "relax", label: "Napas normal", sub: "Tanpa mengejan", sec: 5 }); } if (a < sets - 1) s.push({ kind: "rest", label: "Istirahat", sub: `Set ${a + 2} berikutnya`, sec: 30 }); } return s; },
  elevator: (sets, reps, floors) => { const s = []; for (let a = 0; a < sets; a++) { for (let r = 0; r < reps; r++) { for (let f = 1; f <= floors; f++) s.push({ kind: "contract", label: `Naik lantai ${f}`, sub: `${Math.round(f / floors * 100)}% kekuatan · ${r + 1}/${reps}`, sec: 3 }); for (let f = floors - 1; f >= 1; f--) s.push({ kind: "hold", label: `Turun lantai ${f}`, sub: `${Math.round(f / floors * 100)}% kekuatan`, sec: 3 }); s.push({ kind: "relax", label: "Lepas", sub: "Rileks penuh", sec: 6 }); } if (a < sets - 1) s.push({ kind: "rest", label: "Istirahat", sub: `Set ${a + 2} berikutnya`, sec: 30 }); } return s; },
  pyramid: (rounds) => { const s = []; const seq = [2, 4, 6, 8, 10, 8, 6, 4, 2]; for (let a = 0; a < rounds; a++) { seq.forEach((h, i) => { s.push({ kind: "contract", label: "Kencangkan", sub: `Tahan ${h} dtk · putaran ${a + 1}/${rounds}`, sec: h }); s.push({ kind: "relax", label: "Lepas", sub: "Rileks", sec: h }); }); if (a < rounds - 1) s.push({ kind: "rest", label: "Istirahat", sub: "Putaran berikutnya", sec: 30 }); } return s; },
  move: (sets, reps, cue) => { const s = []; for (let a = 0; a < sets; a++) { for (let r = 0; r < reps; r++) { s.push({ kind: "contract", label: cue[0], sub: `${r + 1}/${reps} · set ${a + 1}/${sets}`, sec: 3 }); s.push({ kind: "relax", label: cue[1], sub: "Lepas otot panggul", sec: 3 }); } if (a < sets - 1) s.push({ kind: "rest", label: "Istirahat", sub: `Set ${a + 2} berikutnya`, sec: 30 }); } return s; },
  timed: (sets, sec, label, sub) => { const s = []; for (let a = 0; a < sets; a++) { s.push({ kind: "hold", label, sub: `${sub} · set ${a + 1}/${sets}`, sec }); if (a < sets - 1) s.push({ kind: "rest", label: "Istirahat", sub: `Set ${a + 2} berikutnya`, sec: 20 }); } return s; }
};

const PELVIC = [
  /* Basic */
  { id: "p-breath", lv: 1, name: "Napas Diafragma", rx: "1× 2 menit", target: "Rileks dan terkontrol", steps: (d) => P.breath(d ? 1 : 2),
    how: ["Tangan di perut, tarik napas lewat hidung sampai perut mengembang.", "Saat menarik napas, dasar panggul ikut turun dan rileks.", "Hembuskan perlahan lewat mulut."] },
  { id: "p-basic", lv: 1, name: "Kegel Dasar (berbaring)", rx: "3×10 · tahan 3 dtk · rileks 3 dtk", target: "3×10 · tahan 5 dtk", steps: (d) => P.hold(d ? 1 : 3, 10, 3, 3),
    how: ["Berbaring telentang, lutut ditekuk.", "Kencangkan otot seperti menahan buang angin dan menahan pipis.", "Perut, bokong, dan paha tetap rileks. Napas tetap jalan."] },
  { id: "p-flick1", lv: 1, name: "Quick Flick", rx: "3×10", target: "3×15", steps: (d) => P.flick(d ? 1 : 3, 10),
    how: ["Kencangkan cepat lalu langsung lepas penuh.", "Fokus pada lepasnya sama penting dengan kencangnya.", "Jangan ikut mengencangkan bokong."] },
  { id: "p-bridge", lv: 1, name: "Glute Bridge + Kegel", rx: "2×10", target: "3×12", steps: (d) => P.move(d ? 1 : 2, 10, ["Angkat pinggul + kencangkan", "Turun"]),
    how: ["Saat pinggul naik, kencangkan dasar panggul.", "Saat turun, lepaskan penuh.", "Hembuskan napas saat naik."] },
  /* Intermediate */
  { id: "p-seated", lv: 2, name: "Kegel Tahan (duduk)", rx: "3×10 · tahan 6 dtk · rileks 8 dtk", target: "3×10 · tahan 8 dtk", steps: (d) => P.hold(d ? 1 : 3, 10, 6, 8),
    how: ["Duduk tegak di kursi, kaki rata di lantai.", "Kencangkan dan angkat ke dalam, tahan.", "Lepas pelan dan rasakan otot benar-benar rileks."] },
  { id: "p-flick2", lv: 2, name: "Quick Flick", rx: "3×20", target: "3×20", steps: (d) => P.flick(d ? 1 : 3, 20),
    how: ["Ritme cepat dan bersih.", "Setiap kontraksi diikuti lepas penuh.", "Napas tetap teratur."] },
  { id: "p-reverse1", lv: 2, name: "Reverse Kegel", rx: "2×10 · 5 dtk", target: "3×10 · 8 dtk", steps: (d) => P.reverse(d ? 1 : 2, 10, 5),
    how: ["Tarik napas dalam, biarkan dasar panggul turun dan melebar.", "Sensasinya seperti awal buang air kecil, tanpa mengejan.", "Melatih kemampuan rileks yang penting untuk kontrol."] },
  { id: "p-squat", lv: 2, name: "Deep Squat Hold + Napas", rx: "3× 20 dtk", target: "3× 45 dtk", steps: (d) => P.timed(d ? 1 : 3, 20, "Tahan deep squat", "Napas dalam ke perut"),
    how: ["Squat sedalam mungkin, tumit menempel.", "Napas dalam, biarkan panggul rileks.", "Pegang tiang jika perlu keseimbangan."] },
  /* Advanced */
  { id: "p-standing", lv: 3, name: "Kegel Tahan (berdiri)", rx: "3×10 · tahan 10 dtk · rileks 10 dtk", target: "3×12 · tahan 10 dtk", steps: (d) => P.hold(d ? 1 : 3, 10, 10, 10),
    how: ["Berdiri tegak, kaki selebar pinggul.", "Kontraksi lebih sulit melawan gravitasi.", "Rileks sama lamanya dengan tahan."] },
  { id: "p-elevator", lv: 3, name: "Elevator Kegel", rx: "3×5 · 3 tingkat", target: "3×8", steps: (d) => P.elevator(d ? 1 : 3, 5, 3),
    how: ["Kencangkan bertahap: 30% → 60% → 100%.", "Turunkan bertahap kembali, tidak langsung lepas.", "Melatih kontrol halus otot."] },
  { id: "p-flick3", lv: 3, name: "Quick Flick", rx: "3×25", target: "3×30", steps: (d) => P.flick(d ? 1 : 3, 25),
    how: ["Ritme cepat dan konsisten.", "Jaga perut tetap rileks.", "Lepas penuh setiap repetisi."] },
  { id: "p-lunge", lv: 3, name: "Kegel saat Squat / Lunge", rx: "3×8", target: "3×12", steps: (d) => P.move(d ? 1 : 3, 8, ["Turun + kencangkan", "Naik"]),
    how: ["Kencangkan dasar panggul saat fase turun.", "Jaga kontraksi tanpa menahan napas.", "Lepas di posisi berdiri."] },
  { id: "p-reverse2", lv: 3, name: "Reverse Kegel", rx: "3×10 · 8 dtk", target: "3×10 · 10 dtk", steps: (d) => P.reverse(d ? 1 : 3, 10, 8),
    how: ["Tarik napas panjang, dasar panggul turun.", "Tanpa mengejan.", "Penyeimbang semua latihan kontraksi."] },
  /* Expert */
  { id: "p-multi", lv: 4, name: "Kegel Tahan (berbagai posisi)", rx: "3×10 · tahan 12 dtk", target: "3×10 · tahan 15 dtk", steps: (d) => P.hold(d ? 1 : 3, 10, 12, 12),
    how: ["Set 1 berbaring, set 2 duduk, set 3 berdiri.", "Kontraksi kuat tanpa bantuan otot lain.", "Rileks sama lamanya dengan tahan."] },
  { id: "p-elevator5", lv: 4, name: "Elevator Kegel 5 tingkat", rx: "3×5", target: "3×8 lancar", steps: (d) => P.elevator(d ? 1 : 3, 5, 5),
    how: ["Lima tingkat naik, lima tingkat turun.", "Setiap tingkat terasa berbeda.", "Kontrol halus adalah tujuannya."] },
  { id: "p-pyramid", lv: 4, name: "Pyramid", rx: "2 putaran · tahan 2→10→2 dtk", target: "3 putaran", steps: (d) => P.pyramid(d ? 1 : 2),
    how: ["Durasi tahan naik lalu turun.", "Rileks sama lamanya dengan tahan.", "Napas tetap teratur sepanjang putaran."] },
  { id: "p-dynamic", lv: 4, name: "Kegel + Gerakan Dinamis", rx: "Terintegrasi", target: "Kontrol tanpa menahan napas", steps: (d) => P.move(d ? 1 : 2, 8, ["Gerak + kencangkan", "Lepas"]),
    how: ["Gabungkan dengan jump squat, pistol, atau L-sit.", "Aktifkan dasar panggul pada fase berat.", "Jangan menahan napas."] },
  { id: "p-stretch", lv: 4, name: "Reverse Kegel + Stretching", rx: "3 menit", target: "Rutin setiap sesi", steps: (d) => P.timed(d ? 1 : 3, 60, "Happy baby / deep squat", "Napas dalam, panggul rileks"),
    how: ["Pose happy baby atau deep squat.", "Napas dalam ke perut, biarkan panggul melebar.", "Akhiri setiap sesi dengan ini."] }
];

/* Jadwal mingguan per level. day: 0=Minggu … 6=Sabtu */
const SCHEDULE = {
  1: { 1: { name: "Full Body", cats: ["push", "pull", "legs", "core"] }, 3: { name: "Full Body", cats: ["push", "pull", "legs", "core"] }, 5: { name: "Full Body", cats: ["push", "pull", "legs", "core"] } },
  2: { 1: { name: "Upper", cats: ["push", "pull", "core"] }, 2: { name: "Lower", cats: ["legs", "core"] }, 4: { name: "Upper + Skill", cats: ["push", "pull", "skill"] }, 5: { name: "Lower", cats: ["legs", "core"] } },
  3: { 1: { name: "Push", cats: ["push", "core"] }, 2: { name: "Pull", cats: ["pull"] }, 4: { name: "Legs + Core", cats: ["legs", "core"] }, 6: { name: "Skill", cats: ["skill"] } },
  4: { 1: { name: "Push + Skill", cats: ["push", "skill"] }, 2: { name: "Pull + Skill", cats: ["pull", "skill"] }, 3: { name: "Legs + Core", cats: ["legs", "core"] }, 5: { name: "Skill", cats: ["skill"] }, 6: { name: "Push / Pull", cats: ["push", "pull"] } }
};

const WARMUP = [
  { name: "Rotasi leher & bahu", rx: "30 dtk" },
  { name: "Lingkaran lengan", rx: "10× maju, 10× mundur" },
  { name: "Mobilitas pergelangan tangan", rx: "60 dtk" },
  { name: "Scapula push-up", rx: "10×" },
  { name: "Cat–cow", rx: "10×" },
  { name: "Leg swing", rx: "10×/kaki" },
  { name: "Squat ringan", rx: "10×" }
];

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_SHORT = ["M", "S", "S", "R", "K", "J", "S"];
