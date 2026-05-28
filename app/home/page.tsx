'use client';

const SAMPLE_ENTRIES = [
  {
    id: 1,
    title: 'CS2040 Midterm',
    date: '24 May 2026',
    type: 'Exam Script',
    tags: ['Logic Flaw', 'Time Pressure'],
  },
  {
    id: 2,
    title: 'Project Retrospective',
    date: '20 May 2026',
    type: 'Reflection',
    tags: ['Edge Case Neglect', 'Under-tested'],
  },
  {
    id: 3,
    title: 'BT2102 Quiz 3',
    date: '15 May 2026',
    type: 'Exam Script',
    tags: ['Conceptual Error', 'Time Pressure'],
  },
];

const TAG_COLOURS: Record<string, string> = {
  'Logic Flaw': 'bg-red-900 text-red-300',
  'Time Pressure': 'bg-orange-900 text-orange-300',
  'Edge Case Neglect': 'bg-yellow-900 text-yellow-300',
  'Under-tested': 'bg-purple-900 text-purple-300',
  'Conceptual Error': 'bg-blue-900 text-blue-300',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Failure Library</h1>
        <a
          href="/upload"
          className="bg-white text-black px-5 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          + New Entry
        </a>
      </div>
      <p className="text-gray-400 mb-8">Your personal history of setbacks and growth</p>

      <div className="flex flex-col gap-4">
        {SAMPLE_ENTRIES.map((entry) => (
          <div
            key={entry.id}
            className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-3 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <h2 className="text-lg font-semibold">{entry.title}</h2>
            <p className="text-gray-500 text-sm">{entry.date} - {entry.type}</p>
            <div className="flex gap-2 flex-wrap">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs font-medium px-3 py-1 rounded-full ${TAG_COLOURS[tag] ?? 'bg-gray-700 text-gray-300'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}