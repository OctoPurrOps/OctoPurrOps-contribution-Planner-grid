(() => {
  const ROWS = 7;
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const commitsForLevel = [0, 1, 2, 4, 8];

  const canvas = document.getElementById("heat");
  const ctx = canvas.getContext("2d");

  const daysEl = document.getElementById("days");
  const monthsRowEl = document.getElementById("monthsRow");
  const calendarEl = document.getElementById("calendar");

  const startDateEl = document.getElementById("startDate");
  const weeksEl = document.getElementById("weeks");
  const levelEl = document.getElementById("level");

  const todayBtn = document.getElementById("todayBtn");
  const clearBtn = document.getElementById("clearBtn");
  const invertBtn = document.getElementById("invertBtn");

  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const exportIcsBtn = document.getElementById("exportIcsBtn");

  const outEl = document.getElementById("out");
  const metaTextEl = document.getElementById("metaText");
  const statsPillEl = document.getElementById("statsPill");
  const dayInfoEl = document.getElementById("dayInfo");
  const hoverHintEl = document.getElementById("hoverHint");

  const calMonthLabelEl = document.getElementById("calMonthLabel");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");

  const pixelGitHubEl = document.getElementById("pixelGitHub");
  const pNameEl = document.getElementById("pName");
  const pLinkEl = document.getElementById("pLink");
  const pMetaEl = document.getElementById("pMeta");
  const pRepoEl = document.getElementById("pRepo");
  const avatarPix = document.getElementById("avatarPix");
  const toggleCRT = document.getElementById("toggleCRT");
  const toggleParty = document.getElementById("toggleParty");

  const textInEl = document.getElementById("textIn");
  const textSizeEl = document.getElementById("textSize");
  const textSizeLabelEl = document.getElementById("textSizeLabel");
  const textXEl = document.getElementById("textX");
  const textYEl = document.getElementById("textY");
  const textThreshEl = document.getElementById("textThresh");
  const textPreviewBtn = document.getElementById("textPreviewBtn");
  const textStampBtn = document.getElementById("textStampBtn");
  const textClearBtn = document.getElementById("textClearBtn");
  const textPrevCanvas = document.getElementById("textPreview");
  const textPrevCtx = textPrevCanvas.getContext("2d");

  const imgFileEl = document.getElementById("imgFile");
  const imgModeEl = document.getElementById("imgMode");
  const imgInvertEl = document.getElementById("imgInvert");
  const imgThreshEl = document.getElementById("imgThresh");
  const imgPreviewBtn = document.getElementById("imgPreviewBtn");
  const imgStampBtn = document.getElementById("imgStampBtn");
  const imgClearBtn = document.getElementById("imgClearBtn");
  const imgPrevCanvas = document.getElementById("imgPreview");
  const imgPrevCtx = imgPrevCanvas.getContext("2d");

  const fxNoiseBtn = document.getElementById("fxNoiseBtn");
  const fxDitherBtn = document.getElementById("fxDitherBtn");
  const fxShiftBtn = document.getElementById("fxShiftBtn");
  const fxFlipBtn = document.getElementById("fxFlipBtn");
  const fxPulseBtn = document.getElementById("fxPulseBtn");
  const fxChaosBtn = document.getElementById("fxChaosBtn");
  const beepEl = document.getElementById("beep");
  const mirrorEl = document.getElementById("mirror");

  const CELL = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue("--px")) || 16;
  const GAP  = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue("--gap")) || 3;

  let COLS = clamp(parseInt(weeksEl.value || "53", 10), 10, 60);
  let grid = new Uint8Array(ROWS * COLS);
  let painting = false;
  let paintValue = clamp(parseInt(levelEl.value, 10), 0, 4);

  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  let loadedImage = null;

  const USERNAME = "OctoPurrOps";
  const PROFILE_URL = `https://github.com/${USERNAME}`;
  const LS_KEY = "contribution_planner_split_v3";

  let audioCtx = null;
  function beep(freq=440, ms=30){
    if (beepEl.value !== "1") return;
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      setTimeout(()=>{ o.stop(); }, ms);
    }catch{}
  }

  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
  function idx(r,c){ return r*COLS + c; }

  function toISODate(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const da = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${da}`;
  }
  function parseISODate(s){
    const [y,m,d] = s.split("-").map(Number);
    return new Date(y, m-1, d);
  }

  function cssVar(name){
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function levelColor(lv){
    return cssVar(["--lv0","--lv1","--lv2","--lv3","--lv4"][lv] || "--lv0");
  }

  function startDate(){ return parseISODate(startDateEl.value); }
  function endDate(){
    const d = new Date(startDate());
    d.setDate(d.getDate() + (COLS*7 - 1));
    return d;
  }
  function fmtRange(){ return `${toISODate(startDate())} → ${toISODate(endDate())}`; }

  function dateForCell(r,c){
    const d = new Date(startDate());
    d.setDate(d.getDate() + c*7 + r);
    return d;
  }

  function cellForDate(d){
    const s = startDate();
    const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const ss = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const diffDays = Math.floor((dd - ss) / (24*3600*1000));
    if (diffDays < 0 || diffDays >= COLS*7) return null;
    const r = diffDays % 7;
    const c = Math.floor(diffDays / 7);
    return {r,c};
  }

  function downloadText(filename, text, mime){
    const blob = new Blob([text], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function pixelizeToCanvas(imgUrl, canvasEl, downW = 18, downH = 18) {
    const c = canvasEl.getContext("2d");
    c.imageSmoothingEnabled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = downW;
      off.height = downH;
      const o = off.getContext("2d");
      o.imageSmoothingEnabled = false;

      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;

      const scale = Math.max(downW / iw, downH / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (downW - dw) / 2;
      const dy = (downH - dh) / 2;

      o.clearRect(0, 0, downW, downH);
      o.drawImage(img, dx, dy, dw, dh);

      c.clearRect(0, 0, canvasEl.width, canvasEl.height);
      c.drawImage(off, 0, 0, canvasEl.width, canvasEl.height);
    };

    img.onerror = () => {
      c.clearRect(0, 0, canvasEl.width, canvasEl.height);
    };

    img.src = imgUrl;
  }

  async function loadGitHubProfile(){
    pNameEl.textContent = USERNAME;
    pLinkEl.href = PROFILE_URL;
    pLinkEl.textContent = PROFILE_URL.replace("https://", "");

    pixelizeToCanvas(`https://github.com/${USERNAME}.png`, avatarPix, 18, 18);

    try{
      const u = await fetch(`https://api.github.com/users/${USERNAME}`);
      if(!u.ok) throw new Error("user fetch failed");
      const user = await u.json();

      if (user.avatar_url) pixelizeToCanvas(user.avatar_url, avatarPix, 18, 18);

      const joined = user.created_at ? new Date(user.created_at) : null;
      const joinedStr = joined ? joined.toISOString().slice(0,10) : "—";

      const displayName = user.name || user.login || USERNAME;
      pNameEl.textContent = displayName;

      pMetaEl.textContent =
        `@${user.login} • repos: ${user.public_repos} • joined: ${joinedStr} • followers: ${user.followers}`;

      const r = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
      if(r.ok){
        const repos = await r.json();
        const top = Array.isArray(repos) && repos.length ? repos[0] : null;
        if(top){
          pRepoEl.textContent = `Latest repo: ${top.name}`;
          pRepoEl.href = top.html_url;
        }else{
          pRepoEl.textContent = "Latest repo: —";
          pRepoEl.href = PROFILE_URL;
        }
      }
    }catch(e){
      pMetaEl.textContent = "GitHub API not available (rate limit?) — profile link still works.";
      pRepoEl.textContent = "Latest repo: —";
      pRepoEl.href = PROFILE_URL;
    }
  }

  function renderDays(){
    daysEl.innerHTML = "";
    for(let r=0;r<ROWS;r++){
      const div = document.createElement("div");
      div.textContent = dayNames[r];
      daysEl.appendChild(div);
    }
  }

  function renderMonthsRow(){
    monthsRowEl.innerHTML = "";
    const cell = CELL(), gap = GAP();
    const step = cell + gap;

    let lastMonth = null;
    for(let c=0;c<COLS;c++){
      const d = dateForCell(0,c);
      const m = d.getMonth();
      if (lastMonth === null || m !== lastMonth){
        const label = document.createElement("div");
        label.className = "monthLabel";
        label.textContent = monthNames[m];
        label.style.left = (c * step) + "px";
        monthsRowEl.appendChild(label);
        lastMonth = m;
      }
    }
  }

  function resizeHeatCanvas(){
    const cell = CELL(), gap = GAP();
    const w = COLS*(cell+gap) - gap;
    const h = ROWS*(cell+gap) - gap;

    ctx.imageSmoothingEnabled = false;
    canvas.width = w;
    canvas.height = h;
    drawAll();
  }

  function cellRect(r,c){
    const cell = CELL(), gap = GAP();
    return { x: c*(cell+gap), y: r*(cell+gap), w: cell, h: cell };
  }

  function drawCell(r,c){
    const lv = grid[idx(r,c)];
    const {x,y,w,h} = cellRect(r,c);
    ctx.fillStyle = levelColor(lv);
    ctx.fillRect(x,y,w,h);
  }

  function drawAll(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        drawCell(r,c);
      }
    }
  }

  function setCell(r,c,lv){
    grid[idx(r,c)] = clamp(lv,0,4);
    drawCell(r,c);
  }

  function showInfoForCell(r,c){
    const d = dateForCell(r,c);
    const lv = grid[idx(r,c)];
    const commits = commitsForLevel[lv];
    canvas.title = `${toISODate(d)} (${dayNames[r]}) level=${lv}`;
    hoverHintEl.textContent = `${toISODate(d)} • ${dayNames[r]} • level ${lv}`;
    dayInfoEl.innerHTML =
      `<b>${toISODate(d)}</b> (${dayNames[r]})<br>` +
      `Level: <b>${lv}</b> • Suggested commits: <b>${commits}</b>`;
  }

  function getCellFromMouse(evt){
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    const cell = CELL(), gap = GAP();
    const step = cell + gap;

    const c = Math.floor(x / step);
    const r = Math.floor(y / step);

    const inX = (x % step) < cell;
    const inY = (y % step) < cell;

    if(!inX || !inY) return null;
    if(r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return {r,c};
  }

  function paintAt(evt, lv){
    const rc = getCellFromMouse(evt);
    if(!rc) return;

    const mirror = (mirrorEl.value === "1");
    setCell(rc.r, rc.c, lv);
    if(mirror){
      const mc = (COLS - 1) - rc.c;
      setCell(rc.r, mc, lv);
    }

    showInfoForCell(rc.r, rc.c);
    beep(380 + lv*60, 22);
    afterChange(true);
  }

  canvas.addEventListener("contextmenu", (e)=>e.preventDefault());
  canvas.addEventListener("mousedown", (e)=>{
    painting = true;
    const right = (e.button === 2);
    paintAt(e, right ? 0 : paintValue);
  });
  window.addEventListener("mouseup", ()=> painting = false);
  canvas.addEventListener("mousemove", (e)=>{
    const rc = getCellFromMouse(e);
    if(rc) showInfoForCell(rc.r, rc.c);
    if(!painting) return;
    paintAt(e, paintValue);
  });

  function buildPlan(){
    const plan = [];
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const lv = grid[idx(r,c)];
        if(lv === 0) continue;
        const d = dateForCell(r,c);
        plan.push({ date: toISODate(d), weekday: dayNames[r], level: lv, commitsSuggested: commitsForLevel[lv] });
      }
    }
    plan.sort((a,b)=>a.date.localeCompare(b.date));
    return plan;
  }

  function renderPlan(){
    const plan = buildPlan();
    outEl.textContent = plan.length ? JSON.stringify(plan, null, 2) : "Paint some squares.";
    statsPillEl.textContent = `${plan.length} planned day(s)`;
    metaTextEl.textContent = `Range: ${fmtRange()} • Grid: ${ROWS}×${COLS}`;
  }

  function renderCalendar(){
    calendarEl.innerHTML = "";

    for(const d of dayNames){
      const h = document.createElement("div");
      h.className = "calDow";
      h.textContent = d;
      calendarEl.appendChild(h);
    }

    const first = new Date(calYear, calMonth, 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());

    calMonthLabelEl.textContent = `${monthNames[calMonth]} ${calYear}`;

    const total = 6 * 7;
    for(let i=0;i<total;i++){
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const inThisMonth = (d.getMonth() === calMonth);
      const el = document.createElement("div");
      el.className = "calDay" + (inThisMonth ? "" : " dim");
      el.textContent = String(d.getDate());

      const rc = cellForDate(d);
      const inRange = !!rc;
      if(inRange) el.classList.add("inRange");

      if(inRange){
        const lv = grid[idx(rc.r, rc.c)];
        if(lv > 0){
          const dot = document.createElement("div");
          dot.className = "dot lv" + lv;
          el.appendChild(dot);
        }
      }

      el.addEventListener("mouseenter", () => {
        if(!inRange){
          dayInfoEl.innerHTML = `<b>${toISODate(d)}</b><br>Outside planner range.`;
          return;
        }
        showInfoForCell(rc.r, rc.c);
      });

      el.addEventListener("click", (ev) => {
        if(!inRange) return;
        const erase = ev.shiftKey;
        const lv = erase ? 0 : paintValue;
        setCell(rc.r, rc.c, lv);
        showInfoForCell(rc.r, rc.c);
        beep(500, 24);
        afterChange(true);
      });

      calendarEl.appendChild(el);
    }
  }

  function save(){
    const payload = {
      weeks: COLS,
      startDate: startDateEl.value,
      grid: Array.from(grid),
      calYear, calMonth,
      paintValue,
      beep: beepEl.value,
      mirror: mirrorEl.value
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }

  function load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return false;
      const obj = JSON.parse(raw);
      if(!obj || !obj.startDate || !obj.weeks || !Array.isArray(obj.grid)) return false;

      COLS = clamp(parseInt(obj.weeks,10), 10, 60);
      weeksEl.value = String(COLS);
      startDateEl.value = obj.startDate;

      grid = new Uint8Array(ROWS * COLS);
      for(let i=0;i<grid.length && i<obj.grid.length;i++){
        grid[i] = clamp(parseInt(obj.grid[i],10) || 0, 0, 4);
      }

      if(Number.isFinite(obj.calYear)) calYear = obj.calYear;
      if(Number.isFinite(obj.calMonth)) calMonth = obj.calMonth;

      if(Number.isFinite(obj.paintValue)){
        paintValue = clamp(parseInt(obj.paintValue,10), 0, 4);
        levelEl.value = String(paintValue);
      }

      if(obj.beep === "1" || obj.beep === "0") beepEl.value = obj.beep;
      if(obj.mirror === "1" || obj.mirror === "0") mirrorEl.value = obj.mirror;

      return true;
    }catch{
      return false;
    }
  }

  function setDefaultStartDate(){
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - d.getDay());
    d.setDate(d.getDate() - (COLS - 1) * 7);
    startDateEl.value = toISODate(d);
  }

  function afterChange(shouldSave){
    renderPlan();
    renderCalendar();
    if(shouldSave) save();
  }

  function exportJSON(){
    const payload = { startDate: startDateEl.value, weeks: COLS, rows: ROWS, grid: Array.from(grid) };
    downloadText("contribution-plan.json", JSON.stringify(payload, null, 2), "application/json");
  }

  function exportCSV(){
    const lines = ["date,weekday,level,commitsSuggested"];
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const lv = grid[idx(r,c)];
        if(lv === 0) continue;
        const d = dateForCell(r,c);
        lines.push(`${toISODate(d)},${dayNames[r]},${lv},${commitsForLevel[lv]}`);
      }
    }
    downloadText("contribution-plan.csv", lines.join("\n"), "text/csv");
  }

  function exportICS(){
    const nowStamp = new Date().toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
    let ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Contribution Planner//EN
CALSCALE:GREGORIAN
`;
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const lv = grid[idx(r,c)];
        if(lv === 0) continue;
        const d = dateForCell(r,c);
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,"0");
        const da = String(d.getDate()).padStart(2,"0");
        const ymd = `${y}${m}${da}`;
        ics +=
`BEGIN:VEVENT
UID:${ymd}-${r}-${c}@contribution-planner
DTSTAMP:${nowStamp}
DTSTART;VALUE=DATE:${ymd}
SUMMARY:Planned contribution (level ${lv})
END:VEVENT
`;
      }
    }
    ics += "END:VCALENDAR\n";
    downloadText("contribution-plan.ics", ics, "text/calendar");
  }

  function clearAll(){ grid = new Uint8Array(ROWS * COLS); drawAll(); afterChange(true); }
  function invertAll(){ for(let i=0;i<grid.length;i++) grid[i] = 4 - grid[i]; drawAll(); afterChange(true); }

  function jumpToToday(){
    const today = new Date();
    const rc = cellForDate(today);
    if(!rc){
      dayInfoEl.innerHTML = `<b>${toISODate(today)}</b><br>Today is outside planner range. Change Start date.`;
      return;
    }
    showInfoForCell(rc.r, rc.c);

    const heatWrap = canvas.parentElement;
    const step = CELL() + GAP();
    heatWrap.scrollLeft = Math.max(0, rc.c * step - 200);

    calYear = today.getFullYear();
    calMonth = today.getMonth();
    renderCalendar();
    save();
  }

  function resizePreviewCanvases(){
    textPrevCanvas.width = COLS;
    textPrevCanvas.height = ROWS;
    textPrevCtx.imageSmoothingEnabled = false;

    imgPrevCanvas.width = COLS;
    imgPrevCanvas.height = ROWS;
    imgPrevCtx.imageSmoothingEnabled = false;

    clearTextPreview();
    clearImgPreview();
  }

  function clearTextPreview(){
    textPrevCtx.clearRect(0,0,textPrevCanvas.width,textPrevCanvas.height);
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const lv = grid[idx(r,c)];
        textPrevCtx.fillStyle = levelColor(lv);
        textPrevCtx.fillRect(c, r, 1, 1);
      }
    }
    textPrevCtx.fillStyle = "rgba(0,0,0,0.35)";
    textPrevCtx.fillRect(0,0,COLS,ROWS);
  }

  function renderTextToMask(){
    const off = document.createElement("canvas");
    off.width = COLS;
    off.height = ROWS;
    const o = off.getContext("2d");
    o.imageSmoothingEnabled = false;

    o.clearRect(0,0,COLS,ROWS);
    o.fillStyle = "white";
    o.textBaseline = "top";

    const size = parseInt(textSizeEl.value, 10);
    const x = clamp(parseInt(textXEl.value,10) || 0, 0, COLS);
    const y = clamp(parseInt(textYEl.value,10) || 0, 0, ROWS);

    o.font = `${size}px "Press Start 2P", monospace`;

    const lines = (textInEl.value || "").split("\n").slice(0, 6);
    const lh = Math.max(6, Math.floor(size * 0.95));
    for(let i=0;i<lines.length;i++){
      o.fillText(lines[i], x, y + i*lh);
    }
    return off;
  }

  function previewText(){
    clearTextPreview();
    const mask = renderTextToMask();
    const data = mask.getContext("2d").getImageData(0,0,COLS,ROWS).data;

    const thr = clamp(parseInt(textThreshEl.value,10) || 80, 1, 254);

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const i = (y*COLS + x) * 4;
        const a = data[i+3];
        if(a >= thr){
          textPrevCtx.fillStyle = "rgba(80, 200, 255, 1)";
          textPrevCtx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  function stampText(){
    const mask = renderTextToMask();
    const data = mask.getContext("2d").getImageData(0,0,COLS,ROWS).data;
    const thr = clamp(parseInt(textThreshEl.value,10) || 80, 1, 254);

    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const i = (r*COLS + c) * 4;
        const a = data[i+3];
        if(a >= thr){
          setCell(r,c,paintValue);
        }
      }
    }
    beep(700, 35);
    afterChange(true);
    previewText();
  }

  function clearImgPreview(){
    imgPrevCtx.clearRect(0,0,imgPrevCanvas.width,imgPrevCanvas.height);
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const lv = grid[idx(r,c)];
        imgPrevCtx.fillStyle = levelColor(lv);
        imgPrevCtx.fillRect(c, r, 1, 1);
      }
    }
    imgPrevCtx.fillStyle = "rgba(0,0,0,0.35)";
    imgPrevCtx.fillRect(0,0,COLS,ROWS);
  }

  function renderImageToGridPixels(img){
    const off = document.createElement("canvas");
    off.width = COLS;
    off.height = ROWS;
    const o = off.getContext("2d");
    o.imageSmoothingEnabled = false;

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    const scale = Math.max(COLS / iw, ROWS / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (COLS - dw) / 2;
    const dy = (ROWS - dh) / 2;

    o.clearRect(0,0,COLS,ROWS);
    o.drawImage(img, dx, dy, dw, dh);
    return o.getImageData(0,0,COLS,ROWS).data;
  }

  function mapToLevel(v){
    if(v < 30) return 0;
    if(v < 80) return 1;
    if(v < 140) return 2;
    if(v < 200) return 3;
    return 4;
  }

  function previewImage(){
    clearImgPreview();
    if(!loadedImage) return;

    const data = renderImageToGridPixels(loadedImage);
    const mode = imgModeEl.value;
    const inv = (imgInvertEl.value === "1");
    const thr = clamp(parseInt(imgThreshEl.value,10) || 0, 0, 255);

    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const i = (r*COLS + c) * 4;
        const rr = data[i], gg = data[i+1], bb = data[i+2], aa = data[i+3];

        let v = (mode === "alpha")
          ? aa
          : Math.round(0.2126*rr + 0.7152*gg + 0.0722*bb);

        if(inv) v = 255 - v;
        const vv = (v < thr) ? 0 : v;
        const lv = mapToLevel(vv);

        imgPrevCtx.fillStyle = levelColor(lv);
        imgPrevCtx.fillRect(c, r, 1, 1);
      }
    }
  }

  function stampImage(){
    if(!loadedImage) return;

    const data = renderImageToGridPixels(loadedImage);
    const mode = imgModeEl.value;
    const inv = (imgInvertEl.value === "1");
    const thr = clamp(parseInt(imgThreshEl.value,10) || 0, 0, 255);

    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const i = (r*COLS + c) * 4;
        const rr = data[i], gg = data[i+1], bb = data[i+2], aa = data[i+3];

        let v = (mode === "alpha")
          ? aa
          : Math.round(0.2126*rr + 0.7152*gg + 0.0722*bb);

        if(inv) v = 255 - v;
        const vv = (v < thr) ? 0 : v;
        const lv = mapToLevel(vv);

        setCell(r,c,lv);
      }
    }

    beep(820, 40);
    afterChange(true);
    previewImage();
  }

  function fxNoise(){
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const cur = grid[idx(r,c)];
        if(cur !== 0) continue;
        if(Math.random() < 0.10){
          setCell(r,c, 1 + (Math.random()*4|0));
        }
      }
    }
    beep(520, 30);
    afterChange(true);
  }

  function fxDither(){
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const cur = grid[idx(r,c)];
        if(cur === 0) continue;
        if(((r+c)&1) === 0 && cur > 1) setCell(r,c, cur-1);
      }
    }
    beep(600, 30);
    afterChange(true);
  }

  function fxShiftRight(){
    for(let r=0;r<ROWS;r++){
      for(let c=COLS-1;c>=1;c--){
        grid[idx(r,c)] = grid[idx(r,c-1)];
      }
      grid[idx(r,0)] = 0;
    }
    drawAll();
    beep(440, 26);
    afterChange(true);
  }

  function fxFlip(){
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<Math.floor(COLS/2);c++){
        const a = idx(r,c);
        const b = idx(r,(COLS-1)-c);
        const t = grid[a];
        grid[a] = grid[b];
        grid[b] = t;
      }
    }
    drawAll();
    beep(360, 28);
    afterChange(true);
  }

  function fxPulse(){
    for(let i=0;i<grid.length;i++){
      if(grid[i] === 0) continue;
      grid[i] = (grid[i] % 4) + 1;
    }
    drawAll();
    beep(740, 32);
    afterChange(true);
  }

  function fxChaos(){
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        let v = grid[idx(r,c)];
        if(Math.random() < 0.06) v = 0;
        if(Math.random() < 0.08) v = 1 + (Math.random()*4|0);
        grid[idx(r,c)] = v;
      }
    }
    drawAll();
    beep(220, 60);
    afterChange(true);
  }

  weeksEl.addEventListener("change", () => {
    COLS = clamp(parseInt(weeksEl.value || "53", 10), 10, 60);
    grid = new Uint8Array(ROWS * COLS);
    renderDays();
    renderMonthsRow();
    resizeHeatCanvas();
    renderPlan();
    renderCalendar();
    resizePreviewCanvases();
    save();
  });

  startDateEl.addEventListener("change", () => { renderMonthsRow(); resizeHeatCanvas(); afterChange(true); });
  levelEl.addEventListener("change", () => { paintValue = clamp(parseInt(levelEl.value,10), 0, 4); save(); });

  todayBtn.addEventListener("click", jumpToToday);
  clearBtn.addEventListener("click", clearAll);
  invertBtn.addEventListener("click", invertAll);

  exportJsonBtn.addEventListener("click", exportJSON);
  exportCsvBtn.addEventListener("click", exportCSV);
  exportIcsBtn.addEventListener("click", exportICS);

  prevMonthBtn.addEventListener("click", () => { calMonth--; if(calMonth < 0){ calMonth = 11; calYear--; } renderCalendar(); save(); });
  nextMonthBtn.addEventListener("click", () => { calMonth++; if(calMonth > 11){ calMonth = 0; calYear++; } renderCalendar(); save(); });

  textSizeEl.addEventListener("input", () => { textSizeLabelEl.textContent = `${textSizeEl.value}px`; });
  textPreviewBtn.addEventListener("click", previewText);
  textStampBtn.addEventListener("click", stampText);
  textClearBtn.addEventListener("click", () => { clearTextPreview(); });

  imgFileEl.addEventListener("change", async () => {
    const f = imgFileEl.files && imgFileEl.files[0];
    if(!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { loadedImage = img; URL.revokeObjectURL(url); previewImage(); };
    img.src = url;
  });

  imgPreviewBtn.addEventListener("click", previewImage);
  imgStampBtn.addEventListener("click", stampImage);
  imgClearBtn.addEventListener("click", () => { loadedImage = null; imgFileEl.value = ""; clearImgPreview(); });

  fxNoiseBtn.addEventListener("click", fxNoise);
  fxDitherBtn.addEventListener("click", fxDither);
  fxShiftBtn.addEventListener("click", fxShiftRight);
  fxFlipBtn.addEventListener("click", fxFlip);
  fxPulseBtn.addEventListener("click", fxPulse);
  fxChaosBtn.addEventListener("click", fxChaos);

  pixelGitHubEl.addEventListener("click", () => window.open(PROFILE_URL, "_blank", "noopener,noreferrer"));
  toggleCRT.addEventListener("click", () => document.body.classList.toggle("crt"));
  toggleParty.addEventListener("click", () => document.body.classList.toggle("party"));

  let buf = "";
  window.addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toUpperCase()).slice(-4);
    if (buf === "MEOW") document.body.classList.toggle("party");
  });

  const loaded = load();
  if(!loaded) setDefaultStartDate();
  renderDays();
  renderMonthsRow();
  resizeHeatCanvas();
  renderPlan();
  renderCalendar();
  resizePreviewCanvases();
  previewText();
  clearImgPreview();
  save();
  loadGitHubProfile();
})();
