import { mkdirSync, writeFileSync } from 'node:fs';
const languages = {
  en: ['Grand Theft Auto VI', 'spoiler|ending|story|mission|character|scene', 'gameplay|map|walkthrough', 'leak|leaked footage', 'release|trailer|news|development|review|theory'],
  de: ['Grand Theft Auto VI', 'Spoiler|Ende|Geschichte|Mission|Charakter|Szene', 'Spielablauf|Karte|Komplettlösung', 'Leak|durchgesickert', 'Veröffentlichung|Trailer|Neuigkeiten|Entwicklung|Rezension|Theorie'],
  ar: ['جراند ثفت أوتو 6|جراند ثفت أوتو VI|جي تي اي 6', 'حرق|نهاية|قصة|مهمة|شخصيات|مشهد', 'أسلوب اللعب|خريطة|طريقة اللعب', 'تسريب|تسريبات', 'إصدار|عرض دعائي|أخبار|تطوير|مراجعة|نظرية'],
  'zh-cn': ['侠盗猎车手6|侠盗猎车手VI|侠盗飞车6', '剧透|结局|剧情|任务|角色|场景', '玩法|地图|实机演示', '泄露|爆料', '发售|预告片|新闻|开发|评测|理论'],
  'zh-tw': ['俠盜獵車手6|俠盜獵車手VI|俠盜飛車6', '劇透|結局|劇情|任務|角色|場景', '玩法|地圖|實機展示', '洩漏|爆料', '發售|預告片|新聞|開發|評測|理論'],
  id: ['Grand Theft Auto VI', 'bocoran cerita|akhir cerita|cerita|misi|karakter|adegan', 'alur permainan|peta|panduan', 'bocoran|rekaman bocor', 'rilis|cuplikan|berita|pengembangan|ulasan|teori'],
  nl: ['Grand Theft Auto VI', 'spoiler|einde|verhaal|missie|personage|scène', 'spelverloop|kaart|handleiding', 'lek|gelekte beelden', 'verschijning|trailer|nieuws|ontwikkeling|recensie|theorie'],
  fr: ['Grand Theft Auto VI', 'divulgâcheur|fin|histoire|mission|personnage|scène', 'jouabilité|carte|solution', 'fuite|images divulguées', 'sortie|bande annonce|actualités|développement|critique|théorie'],
  es: ['Grand Theft Auto VI', 'spoiler|final|historia|misión|personaje|escena', 'jugabilidad|mapa|guía', 'filtración|filtraciones', 'lanzamiento|tráiler|noticias|desarrollo|análisis|teoría'],
  it: ['Grand Theft Auto VI', 'spoiler|finale|storia|missione|personaggio|scena', 'giocabilità|mappa|guida', 'fuga di notizie|filmati trapelati', 'uscita|trailer|notizie|sviluppo|recensione|teoria'],
  ja: ['グランドセフトオート6|グランドセフトオートVI|グランド・セフト・オートVI', 'ネタバレ|結末|ストーリー|ミッション|登場人物|シーン', 'ゲームプレイ|マップ|攻略', 'リーク|流出', '発売|予告編|ニュース|開発|レビュー|考察'],
  ko: ['그랜드 테프트 오토6|그랜드 테프트 오토VI', '스포일러|결말|스토리|미션|등장인물|장면', '게임플레이|지도|공략', '유출|유출 영상', '출시|예고편|뉴스|개발|리뷰|이론'],
  pl: ['Grand Theft Auto VI', 'spoiler|zakończenie|fabuła|misja|postać|scena', 'rozgrywka|mapa|poradnik', 'wyciek|wycieki', 'premiera|zwiastun|wiadomości|rozwój|recenzja|teoria'],
  'pt-br': ['Grand Theft Auto VI', 'spoiler|final|história|missão|personagem|cena', 'gameplay|mapa|jogabilidade', 'vazamento|vazamentos', 'lançamento|trailer|notícias|desenvolvimento|análise|teoria'],
  ru: ['ГТА 6|ГТА VI|Гранд Тефт Авто 6', 'спойлер|концовка|сюжет|миссия|персонаж|сцена', 'геймплей|карта|прохождение', 'утечка|слив', 'релиз|трейлер|новости|разработка|обзор|теория'],
  th: ['แกรนด์เธฟต์ออโต6|แกรนด์เธฟต์ออโตVI|จีทีเอ6', 'สปอยล์|ตอนจบ|เนื้อเรื่อง|ภารกิจ|ตัวละคร|ฉาก', 'เกมเพลย์|แผนที่|บทสรุป', 'หลุด|ข้อมูลรั่ว', 'วางจำหน่าย|ตัวอย่าง|ข่าว|พัฒนา|รีวิว|ทฤษฎี'],
  tr: ['Grand Theft Auto VI', 'spoiler|son|hikaye|görev|karakter|sahne', 'oynanış|harita|rehber', 'sızıntı|sızdırılan görüntüler', 'çıkış|fragman|haber|geliştirme|inceleme|teori'],
  vi: ['Grand Theft Auto VI', 'tiết lộ nội dung|kết thúc|cốt truyện|nhiệm vụ|nhân vật|cảnh', 'lối chơi|bản đồ|hướng dẫn', 'rò rỉ|video rò rỉ', 'phát hành|đoạn giới thiệu|tin tức|phát triển|đánh giá|giả thuyết']
};
mkdirSync('data/languages', { recursive: true });
for (const [language, groups] of Object.entries(languages)) {
  const terms = groups.flatMap((group, index) => group.split('|').map((text, i) => ({ id: `${language}-${index}-${i}`, text, language, category: ['titles', 'spoilers', 'gameplay', 'leaks', 'news'][index], sensitivity: index === 0 ? 'strong' : 'weak', rule: index === 0 ? 'always' : 'auxiliary', active: true, origin: 'default' })));
  writeFileSync(`data/languages/${language}.js`, `// Local dictionary: ${language}. Generic terms only contribute context.\nGB.dictionaries.push(...${JSON.stringify(terms, null, 2)});\n`);
}
