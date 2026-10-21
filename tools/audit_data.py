import json
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parents[1]
q=json.loads((root/'data/questions.json').read_text(encoding='utf-8'))
assert len(q)==186,len(q)
assert len({v['id'] for v in q})==186
assert sum(x['multiple'] for x in q)==9
assert sum(not x['multiple'] for x in q)==177
assert all(len(x['answers'])==(2 if x['multiple'] else 1) for x in q)
assert all(all(l in {y['letter'] for y in x['choices']} for l in x['answers']) for x in q)
assert all('sourceVisual' not in x and 'showVisualByDefault' not in x for x in q)
tables=[x for x in q if x.get('visual',{}).get('type')=='table']
diagrams=[x for x in q if x.get('visual',{}).get('type')=='diagram']
assert len(tables)==10 and len(diagrams)==6,(len(tables),len(diagrams))
assert all(len(v['visual']['headers'])==len(row) for v in tables for row in v['visual']['rows'])
assert all((root/v['visual']['src']).is_file() for v in diagrams)
assert len(list((root/'assets/diagrams').glob('*.webp')))==6
assert not (root/'assets/questions').exists(), 'Redundant full-question screenshots must be removed'
for c in 'ABCD':
 assert sum(x['set']==c and not x['isExtra'] for x in q)==40
print('PASS: 186 text questions, 4x40 exam sets, 26 additional Set A, 9 multiple-answer, 10 HTML tables, 6 cropped figures, zero redundant screenshots')
print('Chapter counts:',Counter(q['chapter'] for q in q))
