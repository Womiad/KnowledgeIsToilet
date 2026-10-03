import fs from 'node:fs/promises';
const id=process.argv[2]??'physics';
console.log(`講稿：public/content/lectures/${id}.md`);
console.log(`輸出：public/audio/lectures/${id}.mp3`);
console.log('本專案的零憑證方案是瀏覽器 SpeechSynthesis，因此不會在 Node 內假裝產生 MP3。');
console.log('若要可進 Web Audio graph 的完整水下人聲，請用任一合法 TTS 將去除 frontmatter 的講稿輸出到上述路徑。');
try{await fs.access(`public/content/lectures/${id}.md`);}catch{process.exitCode=1;console.error('找不到講稿。可用 id：chinese, english, math-a, math-b, history, geography, civics, physics, chemistry, biology, earth-science');}
