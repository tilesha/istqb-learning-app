"""Browser checks of accessible HTML tables and cropped figures without network access."""
import json,re,base64
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text();html=re.sub(r'<script type="module"[^>]*></script>','',html);html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
css=(ROOT/'css/styles.css').read_text();core=(ROOT/'js/quiz-core.mjs').read_text();app=(ROOT/'js/app.js').read_text()
app=app.replace("from './quiz-core.mjs'", "from 'data:text/javascript;base64,"+base64.b64encode(core.encode()).decode()+"'")
Q=json.loads((ROOT/'data/questions.json').read_text());L=json.loads((ROOT/'data/lessons.json').read_text())
for q in Q:
 if q.get('visual',{}).get('type')=='diagram':
  payload=(ROOT/q['visual']['src']).read_bytes()
  q['visual']['src']='data:image/webp;base64,'+base64.b64encode(payload).decode()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(390,844),(1440,900)]:
  context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html);page.add_style_tag(content=css)
  page.evaluate('''data=>{window.__data=data;window.fetch=async url=>({ok:true,json:async()=>window.__data[url]})}''',{'data/questions.json':Q,'data/lessons.json':L})
  page.add_script_tag(type='module',content=app)
  page.get_by_text('Smart Practice',exact=True).first.wait_for()
  for setid,index,expected in [('A',21,'table'),('A',22,'diagram'),('B',21,'table'),('C',22,'diagram'),('C',30,'diagram'),('D',31,'table')]:
   if page.locator('#home-btn').is_visible():page.locator('#home-btn').click()
   if 'Discard unfinished session' in page.locator('main').inner_text():
    page.get_by_role('button',name='Discard unfinished session').click();page.locator('#confirm-accept').click()
   page.get_by_text('Official Mock Exam',exact=True).first.click()
   page.get_by_role('button',name=f'Sample Exam {setid}').click()
   page.locator('#questions-btn').click();page.locator(f'[data-jump="{index}"]').click()
   if expected=='table':
    assert page.locator('.source-table').count()==1,(setid,index)
    assert page.locator('.source-table tbody tr').count()>2
   else:
    assert page.locator('.question-diagram img').count()==1,(setid,index)
    page.locator('.question-diagram img').scroll_into_view_if_needed()
    page.wait_for_function('''() => {const x=document.querySelector('.question-diagram img');return !!x&&x.complete&&x.naturalWidth>0}''')
   assert page.locator('.answer-choice').count()>=4
   assert page.locator('body').evaluate('x=>x.scrollWidth<=window.innerWidth+1'),(width,setid,index,'overflow')
   if (setid,index) in [('A',21),('A',22),('C',30),('D',31)]:
    page.screenshot(path=f'/mnt/data/istqb-v2-{setid}-{index+1}-{width}.png',full_page=True)
   page.locator('#home-btn').click()
  assert not errs,errs
  context.close()
 browser.close()
print('PASS: 12 visual browser checks (mobile/desktop), HTML tables scroll correctly, diagrams load, no page overflow or JS errors')
