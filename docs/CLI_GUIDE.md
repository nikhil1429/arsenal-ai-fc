# THE CLI GUIDE — organism ko terminal se chalana

> Likha 8 Sep 2026, uske sawaal par ("please tell me everything I need to start working on CLI
> for the organism and the best practice for token management"). Har number is machine par naapa
> gaya hai ya Anthropic ke apne docs se hai (code.claude.com), yaad se kuch nahi.
> Version jis par naapa: Claude Code 2.1.251 · Node 24.19.0 · npm 11.17.0 · Windows 11.

---

## 0 · Tum already ready ho — install karne ko kuch nahi hai

Ye maine chala kar dekha, maana nahi:

- `claude.exe` maujood hai: `C:\Users\nikhi\.local\bin\claude.exe`, version **2.1.251**
- Windows ke PATH par hai — PowerShell use dhoondh leta hai, matlab kisi bhi terminal se chalega
- Login ho chuka hai — credentials file aaj 09:15 par likhi gayi thi
- Auto-update chaalu hai, "latest" channel par. Khud ko update karta rahega.
- Git for Windows installed hai, isliye Bash tool milta hai (PowerShell tool bhi saath)

Toh install ka koi kadam nahi. Sirf terminal kholo aur `claude` type karo.

Agar kabhi shak ho ki kuch toota hai:

```bash
claude doctor
```

Ye bina session shuru kiye poori sehat batata hai — install, settings ki galtiyan, warnings.

---

## 1 · Pehla minute

Terminal kholo (Windows Terminal, PowerShell, ya Git Bash — teeno chalte hain), repo mein jao,
aur shuru karo:

```bash
cd C:\Users\nikhi\GitHub\arsenal-ai-fc
```

```bash
claude
```

Bas. Ab tum session ke andar ho.

**Type karke Enter** = message bhej diya.
**Nayi line** chahiye toh `Shift+Enter`, ya line ke aakhir mein `\` daal kar Enter.
**Rokna** ho beech mein toh `Esc`. Do baar `Esc` = pichhle point par wapas.
**Nikalna** ho toh `Ctrl+D`, ya `/exit`.
**Screen saaf** karni ho toh `Ctrl+L` (context nahi jaata, sirf display).

Kaam ke aur teen: `Ctrl+O` transcript kholta hai, `Ctrl+R` purane commands mein search,
`Ctrl+B` background tasks dikhata hai.

---

## 2 · Organism ka kya-kya apne aap chalega

Ye sab **repo ke andar rehta hai**, app ke andar nahi. Isliye CLI mein sab waisa ka waisa
milega, bina kuch kiye:

- **CLAUDE.md** — repo root se apne aap load hota hai, har session mein
- **19 skills** — `.claude/skills/` se, matlab `/architect`, `/forge`, `/learn`, `/sitting`,
  sab slash command ban kar milenge
- **6 hooks** — `.claude/settings.json` se: SessionStart, UserPromptSubmit, Stop, PreCompact,
  SessionEnd, PreToolUse. Wahi kickoff brief, wahi claims gate, wahi teaching contract.
- **2 MCP servers** — `.mcp.json` se: organism-memory aur activitywatch
- **Auto memory** — `~/.claude/projects/<repo>/memory/`, wahi jagah, wahi files

Pehli baar boot karne ke baad ye teen chala kar khud dekh lena ki sab load hua:

```bash
/context
```

```bash
/hooks
```

```bash
/mcp
```

**Ek cheez jo carry NAHI hoti:** desktop app ki sessions aur CLI ki sessions alag hain. Desktop
apni history rakhta hai, CLI apni. Matlab abhi wali architect session ko CLI mein resume nahi
kar sakte. Lekin isse farak nahi padta — **role disk par rehta hai**, session mein nahi. Naya
`claude` kholo, `architect` likho, aur woh handoff se poora attach ho jaata hai. Poora system
isi din ke liye banaya gaya tha.

---

## 3 · Permission modes — sabse zaroori cheez, aur wahi jisne pehle kaat diya tha

Session kis mode mein hai, ye tay karta hai ki Claude kya bina poochhe kar sakta hai.
`Shift+Tab` dabao, mode badal jaata hai. Neeche wale bar par likha rehta hai.

**Manual** (config mein iska naam `default` hai) — sirf padh sakta hai. Har edit, har command
tumse poochhega.

**Accept edits** — padhna, file edit karna, aur aam filesystem commands (mkdir, touch, mv, cp)
bina poochhe. **Campaign ke kaam ke liye yahi sahi hai.**

**Plan** — sirf padhta hai aur plan likhta hai, source ko haath nahi lagata. Bade kaam se pehle
iska use karo: pehle plan, tumhari haan, phir kaam. Galat raste par gaya hua kaam dobara karna
sabse mehnga hota hai.

**Auto** — sab kuch, par ek doosra chhota model (classifier) har action ko peechhe se dekhta
hai. **Max plan par naya session isi mode mein khulta hai by default** — aur yahi woh cheez hai
jisne 8 September ko campaign ki files ke writes paanch baar refuse kiye the. Agar tum campaign
ya organism ki state files par kaam kar rahe ho, boot karte hi `Shift+Tab` se Accept edits par
aa jao.

**Bypass permissions** — sab kuch, koi check nahi. Sirf isolated container ya VM mein. Yahan
nahi.

Mode ko default banana ho toh settings mein:

```bash
claude --permission-mode acceptEdits
```

---

## 4 · Roz kaam aane wale commands

**Kahan kitna context bhara hai:** `/context` — ye sabse zyada dekhne wala command hai. Batata
hai ki CLAUDE.md, skills, MCP, files, history — kaun kitni jagah kha raha hai.

**Kitna kharch hua:** `/usage` — plan ke bars, aur (ye important hai) **attribution**: skills,
subagents, plugins aur har MCP server ka apna hissa percentage mein. `d` aur `w` dabakar 24
ghante aur 7 din ke beech switch karo.

**Session ka kharcha:** `/cost` — is session ke tokens aur estimate.

**Saaf karke naya shuru:** `/clear` — sabse bada lever, aur muft hai.

**Summary banakar aage:** `/compact` — history ko summary se badal deta hai. Iska apna kharcha
hai, neeche padho.

**Model badalna:** `/model` · **thinking ka level:** `/effort`

**Wapas jaana:** `/resume` — session picker. `/rename <naam>` se naam do pehle.

**Sehat:** `/doctor` · **memory:** `/memory` · **transcript nikalna:** `/export`

---

## 5 · Token management — asli hissa

Tumne 8 September ko khud naapa tha ki fleets sasti thin aur do coordinating sessions mehngi.
Ye section usi cheez ka ilaaj hai. Lever ke hisaab se, sabse bade se shuru.

### 5.1 · Lamba context hi asli kharcha hai

Har request ke saath **poori conversation** dobara jaati hai. Matlab din bhar khuli hui session
mein ek line ka sawaal poochhna bhi poore din ki baat ka daam leta hai. Session jitni lambi,
har agla message utna mehnga.

Isliye: **alag kaam = alag session.** Beech mein `/clear` maaro.

### 5.2 · /clear muft hai, /compact mehnga hai

`/clear` kuch nahi kharch karta. Sab bhool kar naya shuru.

`/compact` ko summary banane ke liye **poori conversation padhni padti hai** — matlab woh khud
ek badi request hai. Isliye compact tabhi jab aage ka kaam pichhle par tika ho. Warna clear.

Purani session kho nahi jaati — clear se pehle `/rename` kar do, baad mein `/resume` se wapas.

### 5.3 · Cache — ek ghanta, aur uske baad poora dobara

Subscription par cache ek ghanta chalta hai. Ek ghante se zyada break ke baad pehla message
poore context ko dobara process karta hai. Yeh chup-chaap ka bada kharcha hai.

Iska matlab: **bursts mein kaam karo.** Badi session ko ghanton khula chhodkar wapas aana mehnga
hai. Wapas aana hi ho toh Claude khud "summary se resume karein?" poochhta hai (100k tokens se
badi aur ek ghante se purani session par) — us dialog mein summary chunna sasta padta hai.

### 5.4 · Sessions ek doosre ko message bhejein toh poora context jaata hai

Ye tumhare architect-runner setup par seedha lagta hai. Ek session doosri ko message bhejti hai,
toh **receiving session ke liye woh ek naya turn hai — aur uske saath uska poora context jaata
hai**, chahe woh idle ho.

Agar messages ko rok kar rakhna ho, settings mein `crossSessionInbound` ko `hold` kar do. Phir
woh turn nahi banate.

Wahi baat scheduled tasks aur `/loop` par bhi lagti hai: woh apne interval par firing karte hain
chahe session khali baithi ho, aur har firing poora context bhejti hai.

### 5.5 · CLAUDE.md chhoti rakho, detail skills mein daalo

CLAUDE.md har session ke shuru mein load hoti hai, matlab uske tokens hamesha lagte hain — chahe
tum uss cheez par kaam kar hi na rahe ho. Anthropic ka apna bar: **200 line se kam.**

Skills alag hain — woh **tabhi load hoti hain jab bulao**. Isliye jo cheez sirf kabhi-kabhi
chahiye, woh skill mein jaani chahiye, CLAUDE.md mein nahi.

### 5.6 · Model aur effort — kaam ke hisaab se

Thinking ke tokens output ke tokens mein ginte hain, aur default budget kaafi bada hota hai.
Tumhari user settings mein abhi `effortLevel: high` global set hai — matlab bookkeeping wale
chhote turns par bhi poora thinking lag raha hai. Woh waste hai.

`/effort` se turn ke hisaab se badlo. Judgement ke kaam par max, ledger row likhne par nahi.

`/model` se model badlo. Tumhara apna LAW T yahi kehta hai: sabse sasta tier jo wahi quality de.

### 5.7 · Shor wale kaam subagent ko do

Test chalana, logs padhna, docs kholna — ye bahut output banate hain. Subagent ko do, toh **woh
shor uske apne context mein rehta hai** aur tumhare paas sirf nateeja aata hai.

### 5.8 · Hooks se pehle hi chhaan lo

Ek hook Claude ke dekhne se pehle data ko chhaan sakta hai. 10,000 line ka log padhne ke bajaye
hook sirf ERROR wali lines de — hazaaron tokens se ghatkar sau. Tumhara organism ye pehle se
karta hai; naye lanes par bhi yahi soch lagao.

### 5.9 · Plan mode se galat rasta bacho

Bade kaam se pehle `Shift+Tab` dabakar plan mode mein jao. Claude pehle padhega aur plan dega,
tum haan bologe, phir kaam hoga. Galat disha mein kiya hua kaam dobara karna sabse mehnga hai.

### 5.10 · Cache ko behtar reuse karo

Ek flag hai jo per-machine wale hisse (working directory, environment, memory, git) system
prompt se hata kar pehle user message mein daal deta hai, jisse cache zyada reuse hota hai:

```bash
claude --exclude-dynamic-system-prompt-sections
```

### 5.11 · /usage tumhe seedha batayega kahan ja raha hai

Ye woh instrument hai jo tumhe 8 September wala jawab khud de dega. `/usage` mein
**attribution** hai — kaun si skill, kaun sa subagent, kaun sa MCP server kitna percent kha raha
hai — aur **behavior flags**, jo tab dikhte hain jab koi ek cheez 10% se zyada le rahi ho, jaise
"long context" ya "cache misses".

Roz ek baar `/usage` dekho. Kahani ki jagah number milega.

---

## 6 · Architect aur runner, terminal mein

Do terminal tabs kholo. Dono repo mein.

Pehle mein:

```bash
claude -n architect
```

Phir andar `architect` likho. Skill boot kar dega, handoff se poora attach ho jayega.

Doosre mein:

```bash
claude -n runner
```

Phir CURRENT.md wali paste line daalo.

Naam dene ka faayda: baad mein seedha naam se wapas aa sakte ho.

```bash
claude --resume architect
```

Ek session ko background mein chalana ho:

```bash
claude --bg
```

---

## 7 · Jo cheezein kaat sakti hain

**Auto mode.** Max plan par naya session auto mode mein khulta hai, aur uska classifier campaign
ki state files ke writes refuse kar chuka hai — paanch baar, 8 September ko. Boot karte hi
`Shift+Tab` se Accept edits par aao.

**Desktop ki session CLI mein nahi milegi.** Role disk par hai, session nahi. Naya session
kholo aur role ka naam likho.

**Ek ghante ka cache.** Lambi break ke baad pehla message poora context dobara process karta
hai.

**Resume par kuch flags wapas dene padte hain.** `--mcp-config`, `--settings`, `--add-dir` jaise
flags resume par apne aap nahi lautte. Settings files (settings.json) har baar padhi jaati hain,
woh dobara dene ki zarurat nahi.

---

## 8 · Roz ka aadha-minute ka routine

Shuru mein: `claude` → mode `Shift+Tab` se Accept edits → `/context` ek nazar.

Beech mein: naya alag kaam = `/clear`. Bada kaam = pehle plan mode.

Aakhir mein: `/usage` ek baar dekho — kya cheez kitna kha rahi hai.
