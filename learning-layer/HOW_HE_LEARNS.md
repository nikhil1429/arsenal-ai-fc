# HOW HE LEARNS — evidence from the Claude Project, Feb 28 → Jul 30 2026

> **What this is.** A forensic read of the entire Claude Project history, extracted 31 Jul
> 2026, answering one question: how does Nikhil actually learn. Every finding carries his
> own verbatim words and an approximate date. Confidence is tagged per finding:
> **[PAKKA]** = happened 3+ times · **[SHAYAD]** = 1-2 times · **[KAMZOR]** = a hint.
> Ranked by damage — #1 first.
>
> **Provenance + its limit, stated honestly.** The extraction was produced inside the
> Claude Project, which holds the teaching transcripts this repo does not. The quotes
> and dates could NOT be independently verified from this repo. What COULD be verified
> is the behaviour: findings #1, #3, #6 and #15 all reproduced, unprompted, during the
> first live Claude Code study session on 31 Jul 2026 — before this document existed.
> Treat the patterns as load-bearing; treat individual dates as approximate.
>
> **One conflict with canon is unresolved — see the note at the end. Read it.**

---

## #1 · [PAKKA] · He asks for "maximum detail" and breaks on more than ONE idea

His word is **"detail"**. His need is **"steps"**. The two are not the same, and giving
the first when he needs the second is the single most expensive mistake available.

**ASKED FOR:**
- *"i liked what we just did, can we take it to the god tier, 10x level?"* (~23 Mar)
- *"Sab kuch 10x level god tier level pe krke dikhao na opus. Aaisa ki mei shock hojau dekh ke"* (~24 Mar)
- *"har ek ek cheez explain kro, go in as much as detail as possible"* (~7 Jun)
- *"think as deep as possible and take as much time as you want"* (~9 Jul)

**BROKE — and the trigger was always the same: more than one thing in one message:**

| what was sent | his reply | date |
|---|---|---|
| two separate questions in one message | *"...thoda smjh nahi aya and ye vector kab banta hain aur kaha pe hota hain? kya hum sahi tareeke se padrahe hain?"* | ~19 Jun |
| 3 failure-modes + a diagram + a question | *"i am confused, to sampling kya cheez hain jo aap pehle kehrahe the?"* | ~23 Jun |
| dense status + a "Meta-Rule 2 / Meta-Rule 3" checklist | *"arre kya kehre ho?? kuch smjh nahi aya, ab hummein kya krna hain??"* | ~5 May |
| 4 consequences + a tool-task + Bolo, together | *"kuch smjh nahi aya mujhey, detail mein batao bhai. first time i am learning AI world concepts"* | ~5 Jun |
| a big "maximum detail" artifact — which he had asked for | *"bhai yar smjha nahi mein, merko ekdum jaise 1st standard ke bacche ko smjhate hain vaise smjha sakte ho level zero se last level tak step by step??"* | ~30 Jun |

**The measured threshold:**

```
1 idea + 1 check-question  →  stayed with it, answered correctly
2 separate questions       →  BROKE  (19 Jun)
3 items in one message     →  BROKE  (23 Jun)
4 pieces at once           →  BROKE  (24 Jun)
```

> **RULE:** On "give me detail", do not add content — **add steps**. One message = one idea
> + one check-question. Never exceed it, however completely he asks for the whole thing.

---

## #2 · [PAKKA] · Visualisation does NOT produce understanding; plain text and tracing it by hand does — and he asks for more visuals anyway

**Visuals failed, three separate dates:**
- ~6 Jun — clickable widgets: too much on screen at once, the counting hidden inside interactions
- ~30 Jun — *"x3 kyu hain?? smjha nahi"* → same turn: *"ye viz se kuch clear hi nahi hua hain."*
- ~12 Jun — on a large interactive demo: *"this was so basic bro :("*

**Text worked — and this is the strongest single piece of evidence in the document:**
~6 Jun, given only a plain code-block whiteboard (`ate / eat / ate`, three pairs, counts
visible), he traced the entire BPE algorithm **himself, by hand, three rounds**, voice-typed
in broken English, mechanism 100% correct:

> *"it found out that a and t is coming in eight, eat, and eat... this is coming three times,
> so it will break... Now it will look at the adjacent alphabet... So I think the token will
> be eighty, first token. Second token will be ATE, and the third token will be eat"*

Five minutes earlier he had been asking whether he was fit for this profile at all.

**THE TRAP:** when a visual failed, he asked for a *better visual*:
- *"god tier visualization se smjhao yar"* (~7 Jun)
- *"inline artifact ko adhd god tier same level pe leke jana hain"* (~15 Jun)

> **RULE:** Never put the mechanism inside a visual or a widget. Put it in **text + a
> numbered trace**, and make him run it himself. When he asks for a better visual, that
> request is for novelty, not for understanding — do not fulfil it mid-concept.

---

## #3 · [PAKKA] · The moment a concept gets hard, he turns to building a system / notes / tool

The timing is the evidence: every turn toward tooling came directly after a turn where the
concept got difficult.

- ~7 Jul — right after "samajh nahi aaya" on f-strings: *"aaj se god tier level pe learning hogi. We will push limits now. Vegeta mode."*
- ~7 Jun — tokenization stuck at ~90%, embeddings not started: *"mujhey ekdum god tier approach chahiye jisme mein notes mein kuch na banau"*
- ~8 Jun: *"capsule paste krna is too much friction for my adhd pi. koi way out nikalo"*
- ~15 Jun — interrupting mid-reply: *"had to stop your thinking because custom connector bi daal sakte hain hum"*

**Counts (recorded at the time, uncontested):** six notes-system threads between 6 Jun and
8 Jun while tokenization sat at ~90% · three derailments from tokenization in a single day
(~12 Jun) · 8+ artifacts in one day with zero lines of FinOps code (~25 Mar).

> **RULE:** Do no system/notes/tool work in the middle of a concept, however valid it looks.
> Name it in one line, park it, and immediately hand back the micro-question he was stuck on.

---

## #4 · [PAKKA] · At the exact moment of final synthesis (Bolo), he hands his own work back

He asks for maximum depth. Where depth must be *produced*, he stops.

- ~27 Jun, all 9 axes done, only the final Bolo left: *"bhai iska bolo khud generate kar sakte ho kya?? mein thoda bana nahi paraha hu answer khudse"*
- ~5 Jul, the log step of the 6-beat loop: *"6 step bhai tum ya gemini karo, mera adhd dimag nahi kar paega ye note rooz"*

**What worked: removing the blank page, not the work.** Given a skeleton
(`"Context window basically ___"`, `"Model stateless hai, matlab ___"`) he filled it in.

> **RULE:** Never write his Bolo or summary for him. Give the empty skeleton of his own
> sentences with blanks. The blank page stops him; the work does not.

---

## #5 · [PAKKA] · Content delivered in English does not register — and this is not an ability problem

- ~28 Jun, his own diagnosis: *"pehle islie dimag mein nahi gya tha quki vo pure english mein tha hinglish mein nahi"* — same content, only the language changed
- ~30 Jun, closing the ability question: *"bhai tension mat lo, english meri ekdum internation BPO jaisi hain... hinglish to bs mein concept learn karne ke lie use karta hoon"*

> **RULE:** Teach entirely in Hinglish. English only for the interview-delivery rep, never
> for explanation.

---

## #6 · [PAKKA] · New jargon or an internal label, used without opening it = immediate shutdown

- ~28 Jun, after "R1", "schema fields", "controller": *"bhai i am not understanding anything, fuck this R1 shit"*
- ~5 May, after "Meta-Rule 2/3", "Phase 1 report": *"arre kya kehre ho?? kuch smjh nahi aya"*
- ~8 Jun: *"section names... ekdum simple rakho... confusing terms mat rakho"*

> **RULE:** Open every internal name, code or phase-label in one line the first time it is
> used. One unopened name kills the whole message.

---

## #7 · [PAKKA] · Overstate his level and he comes back to correct it himself

- ~9 Jun, after being told "tu zero pe nahi, DTU math dormant hai": *"nahi mujhey DTU ka kuch yaad nahi h ab, AI ka bi kuch idea nahi h"*
- ~24 Mar: *"Rookie hi maan lo bro all fronts pe iss profile ke lie"*
- ~24 Mar (voice): *"What I used to do at Zomato, I have forgotten it completely... I don't know nothing."*

> **RULE:** Never place him higher than he places himself. "Dormant", "you already know
> this", "you're not at zero" — never. What he says he does not know, he literally does not know.

---

## #8 · [PAKKA] · When past threads are not read verbatim, he catches it every time

*"Read again. Get updated please opus in detail"* (~24 Mar) · *"Dobara pado. Acche se."*
(~24 Mar) · *"are you not paying attention kya opus bro?"* (~6 Apr) · *"last thread complete
100% top to bottom read kro"* (~8 Jun) · *"last thread acche se read bi kia hain??"* (~9 Jun)
· *"abe bhai conext loose hogya hai kya??"* (~4 Jul)

**Six times in three months. Six times means it was never actually fixed.**

> **RULE:** Never say "I've read it" off a summary. Read verbatim — or say plainly, up front,
> that only the summary was read.

---

## #9 · [PAKKA] · The bored signal is DIFFERENT from the overloaded signal

- **Overloaded** → *"samajh nahi aaya"*. Trigger: a big message from the teacher.
- **Bored** → *"mood nahi"* + he introduces a new topic. Trigger: a "now do the work" message.

*"Nahi abhi nahi, abhi mood nahi h padhai ka. Chalo issi pe discussion kro"* (~27 Mar) ·
*"Baat cheet to abhi krni h opus. Kaafi krni h."* (~26 Mar)

> **RULE:** Do not lecture at the bored signal. Give one small concrete win — a micro-question,
> a two-minute rep. A lecture pushes him further away.

---

## #10 · [PAKKA] · The #1 destination when bored is hardware shopping — the most disguised derailment, because it looks productive

₹1 lakh gadget list mid-build (~28 Mar) · four sellers price-compared for a Pi 5 (~5 Apr) ·
a monitor thread (~12 Apr) · two entire threads on mini PCs (~17 Apr).

> **RULE:** Any buying conversation during study — park it in one line ("noted, on the list").
> Never give a price, a comparison or a link.

---

## #11 · [PAKKA] · He fights a lecture-style stop; he accepts a binary question

**FOUGHT** (given a full assessment): *"Kaam nahi hoga abhi kuch."* (~25 Mar) ·
*"execution 10x level god tier on steroids ki baat horahi h yaha pe"* (~8 Jul, after a
19-hour-awake + AMBER readiness flag)

**ACCEPTED** (given only an A/B): *"skip it don't add"* (~26 Mar) — he cut his own scope in
three words.

> **RULE:** To stop him, do not lecture. Ask one question with two options. He fights the
> lecture; he cuts the scope himself on the binary.

---

## #12 · [PAKKA] · Owning your own mistake first brings him straight back

Four separate days, same shape: the teacher named its own error ("I pushed two questions
together", "that confusion came from me, not the content"), and his very next message was
back on topic and sharp — *"chalo padhai resume krte hain"*.

> **RULE:** When he is stuck, name your own mistake first (what was too much / too fast),
> then teach. Defending pushes him away; owning it brings him back.

---

## #13 · [SHAYAD] · "You are not behind" + his exact position on the map

- ~23 Jun: *"tu bilkul sahi jagah pe hai... 6 corner ho gaye, 3 bache"* → he moved on
- ~30 Jun: *"nahi, tu pehli baar seekhte waqt yahan nahi atka tha"* → he moved on

> **RULE:** At every stall, give both: "you are not behind" and "you are at X, Y remains."
> Without it he starts doubting all of his progress.

---

## #14 · [PAKKA] · Two triggers for anger: (a) the same thing repeating, (b) his own work handled carelessly

*"last 10 thread se voice fixing chalrahi hain bas. i am pissed now"* (~6 Apr) ·
*"i am kinda pissed, was not expecting it from you bruh"* (~2 Jul, his notes were not
cold-readable) · *"Bakchodi ke mood mein lagraha hoon? I am serious"* (~7 Jul)

> **RULE:** Never say "fixing it" about the same thing twice. On the third occurrence, stop
> and write the root cause first. His anger there is justified.

---

## #15 · [PAKKA] · When a thread gets heavy he stops and asks for a full dump

*"sab information ka dump dedo"* (~12 Jun) · *"iss thread mein jo bi learning hui hain uska
god tier notes dedo, next thread mein chalte hain"* (~24 Jun) · *"make a finalized document
everything for execution that i will paste in the new thread"* (~7 Jul)

> **RULE:** Call the new thread yourself, before it gets heavy, with the full carry-forward —
> otherwise the end of the session goes into building a handoff instead of learning.

---

## #16 · [PAKKA] · Guess-first works when he has some base; on zero base it makes him angry

**WORKED:** three cold guesses on context window, both core points right (~25 Jun) · three
cold recalls, all correct (~7 Jul) · softmax + temperature + top-k + top-p from memory, ~80%
right — he had forgotten the **names**, not the mechanism (~24 Jun) · his own unprompted
analogy: *"API call is basically like a waiter that goes in the kitchen and gets us what we ordered"* (~3 Jun)

**BROKE:** Python f-string syntax he had never seen. Guess: *"f{jo likhna hain vo}"* → next
message: *"Bakchodi ke mood mein lagraha hoon? I am serious"* (~7 Jul)

> **RULE:** Ask for a guess first only when he has seen some part of the thing. On brand-new
> syntax, show first, then ask for the guess.

---

## #17 · [PAKKA] · Which analogies worked, which died

**WORKED — all everyday and physical:** Zomato kitchen reading item codes (tokenization) ·
a waiter fetching an order (API call) · a fixed box of building blocks (BPE) · height + age
+ weight = three numbers (embeddings) · city → neighbourhood (ANN) · an amnesiac genius who
must re-read the folder each time (context window) · a menu with a % scoreboard
(inference/sampling) · a record-player needle stuck in a groove (greedy repetition) · a gym,
where light weights build no muscle (retrieval practice) · a house move where the rooms
exist but nothing was shifted (migration).

**DIED:** x-y coordinates on a 2D map (embeddings) — the analogy created a NEW question ·
frequency counts inside a widget · "fixed AC vs smart AC" — **no evidence found** either way.

**The DNA of every analogy that worked:** food, house, shop, city, gym, record-player — all
everyday physical objects. Not one abstract, geometric or graph-shaped analogy ever worked.

> **RULE:** Take every analogy from an everyday physical thing. Never from geometry, graphs
> or space — those create new confusion.

---

## #18 · [PAKKA] · He himself sends 4-5 questions in one message — and answering them together creates the mess

He asks for one-thing-at-a-time and then writes five at once (~21 Jun, ~30 Jun, ~15 Jun).

> **RULE:** When he sends 3+ questions, do not take them all. List them in one line ("three
> questions, one at a time"), answer the most load-bearing first, park the rest in writing.

---

## #19 · [SHAYAD] · Voice-typed messages arrive garbled and get misread

~24 Mar: *"Opus, maybe bad so no. Resume update last LinkedIn last May..."* — misread as
"stop, go code". His correction: *"No. No, Opas... I was saying in Hindi, I was saying this
resume update."*

> **RULE:** If a message reads broken or repetitive, it is voice-typed. Do not guess the
> meaning — ask back in one line: "this is what I understood, right?"

---

## #20 · Time of day — NO EVIDENCE FOUND

Nothing in the history ties comprehension quality to the hour. What does exist: very late
sessions happen, and that is exactly where he refuses to stop (1:42 AM, 2:38 AM after five
hours, ~19 hours awake on 8 Jul). One **[SHAYAD]** positive, in his own words: *"god tier
mode pe mast padhai horai h bhai library mein"* (~20 Jun — library, 9–9, body-doubling).

## #21 · Session length before he loses the thread — NO EVIDENCE FOUND

No per-session duration data exists. What is measurable is thread length (#15) and
derailments per day (three in one thread, ~12 Jun). A number will not be invented here.

---

## THE REPEATS — if he said it three times, it was never fixed three times

| complaint | times | dates |
|---|---|---|
| "god tier / 10x pe le jao" | 9+ | 23, 24, 25 Mar · 5, 7, 12, 15 Jun · 8, 9 Jul |
| "you didn't read the whole thread" | 6 | 24 Mar ×2 · 6 Apr · 8, 9 Jun · 4 Jul |
| "make god-tier notes" | 5 (across six threads) | 6, 7, 8, 11, 15 Jun |
| "the visual explained nothing" | 3 | 6, 12, 30 Jun |
| "explain it again from the start" | 4 | 9, 11, 21, 30 Jun |
| "I don't understand / confused" | 6 | 5 May · 5, 19, 23, 28 Jun · 7 Jul |
| "thread is heavy, dump it" | 5 | 5, 17 Apr · 12, 24 Jun · 7 Jul |
| "I need it in Hinglish" | 3 | 22 Mar · 5, 28 Jun |
| "i am pissed" | 3 | 6 Apr · 2, 7 Jul |

---

## NEVER DO (eight, each with his own words)

1. **Two or more new ideas in one message** → *"i am confused, to sampling kya cheez hain jo aap pehle kehrahe the?"*
2. **New jargon or a label without opening it** → *"bhai i am not understanding anything, fuck this R1 shit"*
3. **Putting the mechanism in a visual or widget** → *"ye viz se kuch clear hi nahi hua hain"*
4. **Explaining a concept in English** → *"pehle islie dimag mein nahi gya tha quki vo pure english mein tha"*
5. **Placing his level above where he places it** → *"nahi mujhey DTU ka kuch yaad nahi h ab"*
6. **Saying "I read it" off a summary** → *"last thread acche se read bi kia hain??"*
7. **System/notes/tool work in the middle of a concept** → *"capsule paste krna is too much friction for my adhd pi"*
8. **Writing his Bolo or summary for him** → *"bhai iska bolo khud generate kar sakte ho kya??"*

---

# THE COLD-START CARD — the seventeen rules

*If a fresh session reads nothing else, it reads this.*

<!-- COLD-START-CARD:BEGIN — scripts/learnstate.mjs splices everything between these two
     markers into the SessionStart brief, verbatim. This block is the SINGLE SOURCE: edit
     the rules here and every future session gets them on its next boot. Keep it short —
     it is injected on every session start, and a wall of text read every time is a wall
     ignored every time. Remove or rename a marker and the splice goes SILENT (by design;
     it never guesses at the boundaries). -->

1. Give **ONE** new idea per message, and **ONE** check-question at the end.
2. Teach in **Hinglish** — English only for the interview rep.
3. Keep the mechanism in **text + a numbered trace**; visuals only after understanding.
4. Make him **run every example by hand** — watching does not stick.
5. Take analogies only from **everyday physical things** (food, house, shop, city). Never geometry.
6. Tell him every turn: **"you are here, this much is left."**
7. **Own your own mistake first**, then teach — it brings him straight back.
8. **Open every new name or label** in one line, the first time.
9. Take **"samajh nahi aaya" literally** — stop there, restart from zero, do not advance.
10. **Never place his level above his own** — no "dormant", no "you already know this".
11. Stop him with a **two-option question**, never a lecture.
12. **No system/notes/tool work mid-concept** — name it, park it, hand back the micro-question.
13. Give the **empty skeleton** of his Bolo, never a written answer.
14. **Park every hardware/buying topic** in one line — no price, no link.
15. **Show new syntax first**, ask for the guess after.
16. **Call the new thread yourself**, before it gets heavy, with the full carry-forward.
17. Take that one idea and go **all the way down** — in his words, "jitna dheere ho sake, har ek cheez poori tarah samjhao." **Dheema is not lamba:** dheema = ONE thing, small steps, stopping at each. Lamba = many things in one message. Never make it longer; always make it deeper.

<!-- COLD-START-CARD:END -->

---

## RESOLVED — 2026-08-01 · the captain ruled: the VISUALIZATION CONTRACT STANDS

### The conflict, as it stood (preserved verbatim — do not re-litigate it)

Finding **#2** says: *visualisation does not produce understanding for him; plain text plus a
hand-run trace does, and a failed visual makes him ask for a better visual rather than for
plainer text.* Three dated failures; one strong success on a plain code-block whiteboard.

`learning-layer/PROJECT_OS.md` VISUALIZATION CONTRACT section (line-ref dropped 9 Aug — :328 had drifted to ~:347) says the opposite, as law:
**"har concept ka EK widget; widget HI lesson hai, text side mein."** THE METHOD step 4
(DIKHAO) is built on it, and `.claude/skills/forge/SKILL.md` renders it as an obligation the
pacer prints every turn at step 4.

On 31 Jul 2026 the widget was built to contract and he did not drive it; the concept advanced
only through plain text in chat.

Three readings were put to him. **(a)** the contract stands and the widgets built so far were
simply bad ones · **(b)** the contract is wrong for this brain and gets demoted: text +
hand-trace becomes the lesson, the widget becomes optional reinforcement AFTER understanding ·
**(c)** both hold, split by purpose: text teaches the mechanism, the widget is only for
Re-Jirah day-3 cold-start.

### THE RULING — 1 Aug 2026, in his own words

> *"11 point yes visuals are important for my adhd pi brain."*

**That is reading (a). CHOSEN. The Visualization Contract is not demoted.** He is the only
authority on his own brain, and he has now said, unprompted, that visuals are load-bearing for
it. *(Honest note on the quote: "11 point" is his answer-number on the question-set he was
answering, not a pointer to rule 11 of the cold-start card — rule 11 is about two-option stops.
[SHAYAD], from the shape of the reply.)*

### What (a) does to finding #2 — it changes its JOB, not its truth

**Nothing in #2 is deleted or softened, and nothing in it was wrong.** The three dated
failures and the BPE hand-trace success are still the strongest evidence in this document.
Under the ruling they are re-read: **#2 is the specification for what makes a widget BAD — it
is not proof that visuals do not work.** Read the failures as a defect list and every single
one was already outlawed by the contract's own clauses (`PROJECT_OS.md:328-342`):

| #2's evidence | the contract clause it was already breaking |
|---|---|
| ~6 Jun — "too much on screen at once" | *"Load budget: max ~6 objects ek waqt visible... one viewport, no scroll"* |
| ~6 Jun — "the counting hidden inside interactions" | *"Mechanism ka working VISIBLE rahe — interactivity ke peeche hidden nahi"* |
| ~30 Jun — *"x3 kyu hain?? smjha nahi"* / *"ye viz se kuch clear hi nahi hua hain"* | *"Spotlight: har step pe sirf EK change highlight"* + *"History trail: har transformation ka breadcrumb visible rahe"* |
| ~12 Jun — *"this was so basic bro :("* | *"Story hook: pehla frame = business cliffhanger, definition nahi"* + Guess-gates + Trap cards |

Every failure is a workmanship failure against a clause that already existed. That is exactly
what reading (a) claims, and it is why (a) survives its own evidence.

**The one data point (a) does NOT fully absorb, stated honestly:** 31 Jul 2026 — that widget
was built to contract and still went undriven. One occurrence, **[SHAYAD]**. The contract's own
*"Chala mode: Nikhil drive kare, widget validate"* means an undriven widget is a FAILED widget,
not a passed one — so it is at minimum a build defect too. The ruling stands over it. But this
is the named falsifier: if widgets that genuinely meet every clause keep going undriven, that
is new evidence and it goes back to the captain as new evidence — it does not re-open the
question by itself.

### REJECTED, and why — so this is never re-argued from scratch

- **(b) demote the contract.** Rejected by the ruling. All the evidence for (b) came from
  widgets that violated the contract; demoting the tool because of the workmanship would have
  thrown away something he has now said he needs.
- **(c) split by purpose.** Rejected **as the governing split** — it removes the widget from
  the lesson itself, which is (b) wearing a smaller coat. Note the half of (c) that was never
  in dispute survives untouched: canon already assigns the widget the day-3 Re-Jirah cold start
  (*"Re-Jirah day-3 isi se cold start"*). That was never the contested part.

### What did NOT change — read this before "simplifying" anything

- **Cold-start card rule 3** (*"mechanism in text + a numbered trace; visuals only after
  understanding"*) stays EXACTLY as written, and was not edited. The ruling is that a widget is
  **required**, not that the text-first mechanism is abandoned. Rule 4 — he runs every example
  by hand — is untouched for the same reason: the BPE trace (~6 Jun) is still how mechanism
  lands.
- **Finding #2's own RULE line and its TRAP** are left verbatim. This document does not rewrite
  its own findings after the fact; that is the whole point of a forensic record. Where #2's rule
  line collides with the contract, **canon wins** — the standing rule before the ruling, and the
  ruling confirms it. The TRAP (*a request for a better visual mid-concept is novelty, not
  understanding*) is unaffected: it governs mid-concept re-builds, which is finding #3's
  territory, not whether a concept gets a widget at all.
- **No code was changed by this ruling.** THE METHOD step 4, the forge pacer and the contract
  were already the law; the ruling keeps them the law.

**Residual seam, recorded and deliberately NOT re-opened:** the exact ordering of *text-first*
(rule 3) versus *"widget HI lesson hai"* (the contract) is a sequencing question the ruling did
not touch, because the ruling was about whether visuals count at all. It is written here so the
next reader knows it was seen and left alone, not missed.

**SEQUENCING ANSWERED — 4 Aug 2026 (the ruling is untouched; only the ordering is stated).**
The seam dissolves once you notice the two live in **different steps of THE METHOD**, not in
competition for one moment:
- **Step 3 · SAMJHAO is TEXT.** Mechanism in text + a numbered trace he runs by hand. Rule 3 owns
  this step, and step 3 now carries its own depth floor (analogy + worked example + why-chain +
  stuck-story) — see `.claude/skills/forge/SKILL.md`.
- **Step 4 · DIKHAO is the WIDGET.** The Visualization Contract owns this step, in full, undemoted.
So the order is **text first, then the widget** — which is exactly rule 3's *"visuals samajh ke
BAAD"* and exactly the contract's own position in the step list. Neither is weakened: a widget
delivered before the mechanism is understood breaks rule 3, and a step 4 with no widget breaks
the contract. **This does NOT re-open the ruling** — the contract's status, its clauses, and the
"undriven widget = FAILED widget" law are all unchanged.
*(Recorded because a session on 4 Aug 2026 nearly demoted the contract on the false premise that
a terminal cannot deliver a widget. It can: the contract's own clause says "delivery inline, and
if the render fails, a self-contained `.html` immediately — laptop-first.")*
