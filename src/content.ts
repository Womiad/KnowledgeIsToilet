export interface LectureEntry { id: string; subject: string; title: string; text: string; audio?: string }
export interface Lecture { entry: LectureEntry; raw: string; sentences: string[]; catalog: LectureEntry[] }

export async function loadLecture(id?: string): Promise<Lecture> {
  const manifest = await fetch(`${import.meta.env.BASE_URL}content/lecture-manifest.json`).then(r => r.json()) as { lectures: LectureEntry[] };
  const requested = id ?? new URLSearchParams(location.search).get('lecture');
  const requestedEntry = requested ? manifest.lectures.find(l => l.id === requested) : undefined;
  const entry = requestedEntry ?? manifest.lectures[Math.floor(Math.random() * manifest.lectures.length)];
  const raw = await fetch(`${import.meta.env.BASE_URL}${entry.text.replace(/^\//, '')}`).then(r => r.text());
  const body = raw.replace(/^---[\s\S]*?---\s*/, '').replace(/^#+\s.*$/gm, '').trim();
  const sentences = body.split(/(?<=[。！？；.!?;])\s*/u).map(s => s.trim()).filter(s => s.length > 5);
  return { entry, raw: body, sentences, catalog: manifest.lectures };
}
