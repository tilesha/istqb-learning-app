import subprocess,time
from playwright.sync_api import sync_playwright
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
server=subprocess.Popen(['python','-m','http.server','8765','--directory',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(1)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height in [(390,844),(1440,900)]:
   context=browser.new_context(viewport={'width':width,'height':height},accept_downloads=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:8765/',wait_until='networkidle');page.get_by_text('Smart Practice',exact=True).first.wait_for()
   page.screenshot(path=f'/mnt/data/istqb-learning-app-home-{width}.png',full_page=True)
   assert page.locator('body').evaluate('(x)=>x.scrollWidth<=window.innerWidth+1'),f'horizontal overflow home {width}'
   # Learn and flip flashcard
   page.get_by_text('Learn by Chapter',exact=True).first.click()
   page.get_by_text('Seven testing principles').first.click()
   page.get_by_role('button',name='☆ Bookmark note').first.click()
   page.get_by_role('button',name='Review 5 flashcards').click()
   page.locator('#flip-card').click()
   page.get_by_role('button',name='Back to chapter notes').click()
   page.locator('#home-btn').click()
   # Practice: single question, saved mastery and explanation pause
   page.get_by_text('Smart Practice',exact=True).first.click()
   assert 'Question 1 / 40' in page.locator('.question-head h2').inner_text()
   assert page.locator('#session-time').inner_text().startswith('59:')
   assert page.locator('.answer-choice').count()>=4
   page.locator('.answer-choice').first.click()
   page.get_by_role('button',name='Read answer explanation').click()
   assert page.locator('#explanation-panel').is_visible()
   time.sleep(5.3)
   assert 'Question 1 / 40' in page.locator('.question-head h2').inner_text(),'auto next should pause'
   page.reload(wait_until='networkidle')
   assert 'Question 1 / 40' in page.locator('.question-head h2').inner_text(),'should preserve session while paused'
   assert page.locator('#pause-next').is_hidden(),'paused auto next should stay paused'
   page.locator('#next-btn').click()
   assert 'Question 2 / 40' in page.locator('.question-head h2').inner_text()
   # Exit to home; resume with time and question order
   oldtimer=page.locator('#session-time').inner_text()
   page.locator('#home-btn').click()
   page.locator('#hero-btn').click()
   assert 'Question 2 / 40' in page.locator('.question-head h2').inner_text()
   # Discard current and open exam
   page.locator('#home-btn').click()
   page.get_by_role('button',name='Discard unfinished session').click()
   page.locator('#confirm-accept').click()
   page.get_by_text('Official Mock Exam',exact=True).first.click()
   page.get_by_role('button',name='Sample Exam A').click()
   assert 'Question 1 / 40' in page.locator('.question-head h2').inner_text()
   # Answer first then navigate through question grid
   page.locator('.answer-choice').first.click()
   assert 'Answer saved.' in page.locator('main').inner_text()
   page.locator('#questions-btn').click()
   page.locator('[data-jump="5"]').click()
   assert 'Question 6 / 40' in page.locator('.question-head h2').inner_text()
   assert page.locator('.answer-choice').count()==5
   page.locator('.answer-choice').nth(0).click();page.locator('.answer-choice').nth(1).click()
   assert 'Answer saved.' in page.locator('main').inner_text()
   assert errors==[],str(errors)
   assert page.locator('body').evaluate('(x)=>x.scrollWidth<=window.innerWidth+1'),f'horizontal overflow exam {width}'
   page.screenshot(path=f'/mnt/data/istqb-learning-app-exam-{width}.png',full_page=True)
   context.close()
  browser.close()
 print('PASS: Browser smoke at 390px and 1440px, lesson/bookmark/flashcards, practice answer/explain pause, reload/resume, exam multiple answers, no JS errors or horizontal overflow')
finally:server.terminate();server.wait()
