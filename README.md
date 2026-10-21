# ISTQB CTFL Foundation Learning – Personal Study App

A standalone static website inspired by the blue user interface and local browser progress system in the existing [Driving Licence Exam](https://github.com/tilesha/driving-licence-exam) project. The Driving Licence repo itself is **not modified**. This package is intended for **private study**, not for public redistribution of ISTQB exam texts without permission.

## What is included

- **186 original ISTQB sample questions** transcribed from the user-supplied four CTFL question PDFs: 40 each from Samples A–D, plus 26 additional questions in Sample A. **No filler or third-party question banks**. Questions and options are real selectable text. **Ten source tables are implemented as HTML tables and six diagrams/charts as tightly cropped WebP figures; no full-question screenshots are bundled.**
- **Practice**: exactly **40 questions and 60 minutes** for the whole session. Single-answer only; the nine Select TWO questions are excluded from Practice, but included in their original mock papers. Practice questions are mixed across all six chapters, prioritized for weak/older items with **up to 20% mastered questions** reviewed again.
- **Mastery**: +1 on correct, −1 on wrong/skip/timeout; 0–3 capped. Correct responses in **three separate practice sessions** produce Mastered (3/3). **Only the 177 single-answer questions count toward mastery; the nine Select TWO questions are exam-only and cannot otherwise become mastered.** Wrong answers to previously mastered questions reduce mastery and restore review priority. Exam mode never changes mastery.
- **Mock Exam**: choose A/B/C/D, 40 original sample questions, 60-minute timer, single-answer and Select TWO support, 26/40 (65%) passing score, no immediate feedback, option selection can be revised before submission.
- **Learn by Chapter**: six chapters with paraphrased study notes, examples, bookmarks and flashcards (not new quiz questions).
- **Weak Area Review**: missed and bookmarked official questions, recommended chapter, saved note bookmarks. Untimed; viewing questions never changes mastery.
- **Explanations**: post-answer screen highlights correct and incorrect options, shows relevant chapter and links to the matching **official ISTQB answer-explanation PDF**. It **does not contain the detailed, option-by-option rationale text itself**; readers must use the official linked source for that detail. We deliberately do not invent official rationales. To embed those later, get ISTQB authorization and import the official justification PDFs.
- **Persistence**: localStorage key `istqb-ctfl-learning-v1`; preserves deadline even after refresh, question order, chosen option shuffle, bookmarks and results. A session that expires while the browser is closed is finalized on next open. Optional JSON export/import; confirm before reset/discard/restore. The existing Driving Licence app's storage keys are untouched.
- **No accounts, analytics, backend, paid services, dependencies or external app API calls**.

## Start the website

Run in a local terminal (not by double-clicking `index.html`):

```powershell
cd istqb-learning-app
npm run serve
```

Open <http://localhost:8000>. This runs with Node.js and npm and requires no additional packages or internet access. You can also use any local static HTTP server.

## Image-light v2 build

All 186 question stems and response options are rendered from `data/questions.json`. The `visual` property is present only for source tables and diagrams. Tables are semantic HTML (scrollable on mobile). Six cropped image assets contain diagrams/charts only, without answer choices or surrounding question text. The full 186-image screenshot folder from v1 has been removed.

## Validate data and logic

```bash
npm test
python tools/audit_data.py
```

## Materials and original-source integrity

Question source versions:

| Sample | Supplied question PDF version | Questions |
|---|---|---:|
| A | v1.7, 2025-04-01 | 40 + 26 additional |
| B | v1.7, 2025-04-01 | 40 |
| C | v1.6, 2025-03-25 | 40 |
| D | v1.5, 2025-05-02 | 40 |

Correct answer letters came from the earlier user-provided compiled answer-key text (and supplied combined answer PDF); **before official exam preparation, spot-check the answer letters against the official answer-and-explanation PDFs linked in the app**. The app does not represent sample questions as questions from the live exam.

Reference documents: CTFL Syllabus v4.0.1; ISTQB Sample Exam A v1.7, B v1.7, C v1.6, D v1.5.

**Copyright note:** ISTQB PDFs require attribution and restrict re-use. The included materials are for personal study. Do not publish the question-bank JSON, screenshots or a public GitHub Pages copy without confirming permission from ISTQB. The linked Driving Licence source repository was used only for comparison and inspiration.

## Why the app is separate

The source repository was accessible via the linked GitHub connector for read-only inspection, but network-restricted terminal access prevented cloning. This is a new standalone implementation of the same blue design and core quiz behaviors, not a line-by-line fork, and can be reviewed and integrated into another repository if desired.

## Known limitations

- Full option-by-option ISTQB justifications are linked rather than embedded in the offline app; those official explanation PDFs were not present among the user-uploaded source PDFs.
- Browser state is per origin/device; if site data is cleared, use the export file to recover.
- Browser timer operates on the original absolute 60-minute deadline and intentionally does not pause on close or reload.
- Chapter mapping follows the official sample exam question progression; the 26 additional questions are mapped by their syllabus subject. Each source passage can be verified using the `sourcePage` field and the user-supplied official question PDF.
- Automated Node tests do not replace full cross-browser visual and touch testing; test locally before any production deployment.
