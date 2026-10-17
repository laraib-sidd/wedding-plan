(() => {
  'use strict';
  const D = window.RAJASTHAN;
  const KEY = 'our-rajasthan.v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
  const sourceUrl = source => source === 'flight' ? D.flightSearch : source;
  const maps = place => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place);
  const external = (url, label, cls='') => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${esc(cls)}"` : ''}>${label}</a>`;
  const defaults = () => ({version:1, flight:'ai1737', train:'runicha2a', stays:Object.fromEntries(D.cities.map(c=>[c.id,D.stays.find(s=>s.city===c.id && s.preferred).id])), costs:Object.fromEntries(D.budget.map(b=>[b.id,b.value])), cap:100000, checks:{}});
  function validate(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) throw new Error('Unsupported choices file');
    const clean = defaults();
    if (D.flights.some(f=>f.id===raw.flight)) clean.flight=raw.flight;
    if (D.trains.some(t=>t.id===raw.train)) clean.train=raw.train;
    D.cities.forEach(c=>{if(D.stays.some(s=>s.id===raw.stays?.[c.id] && s.city===c.id))clean.stays[c.id]=raw.stays[c.id];});
    D.budget.forEach(b=>{const n=raw.costs?.[b.id];if(typeof n==='number' && Number.isFinite(n) && n>=0 && n<=1000000) clean.costs[b.id]=Math.round(n);});
    if (typeof raw.cap==='number' && Number.isFinite(raw.cap) && raw.cap>=0 && raw.cap<=1000000)clean.cap=Math.round(raw.cap);
    D.checklist.forEach(c=>{clean.checks[c.id]=raw.checks?.[c.id]===true;});
    return clean;
  }
  let state=defaults(), storageAvailable=true, filter='all', currentDay=D.days[0].id, toastTimer;
  try {const saved=localStorage.getItem(KEY);if(saved)state=validate(JSON.parse(saved));}
  catch {storageAvailable=false;showStorageNotice('Saved choices could not be read. The researched plan is shown safely; import a backup or export your new choices.');}
  function showStorageNotice(message) {const n=$('#storage-notice');n.textContent=message;n.hidden=false;}
  function save() {
    try {localStorage.setItem(KEY,JSON.stringify(state));storageAvailable=true;}
    catch {storageAvailable=false;showStorageNotice('This browser cannot save choices. You can still use the plan; export a backup before closing.');}
  }
  function toast(message) {clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
  const total=()=>D.budget.reduce((sum,b)=>sum+state.costs[b.id],0);
  const chosenFlight=()=>D.flights.find(f=>f.id===state.flight);
  const chosenTrain=()=>D.trains.find(t=>t.id===state.train);
  const chosenStay=city=>D.stays.find(s=>s.id===state.stays[city]);
  function photoCredit(city) {
    const items={udaipur:['tommy','CC BY-SA 2.0','https://commons.wikimedia.org/wiki/File:City_Palace_by_lake_Pichola,_Udaipur.jpg'],jodhpur:['Knowledge Seeker','Public domain','https://commons.wikimedia.org/wiki/File:Mehrangarh_Fort.jpg'],jaisalmer:['Clément Bardot','CC BY-SA 4.0','https://commons.wikimedia.org/wiki/File:Jaisalmer_Fort,_India.jpg']};
    const [author,license,url]=items[city];return external(url,`${esc(author)} · ${esc(license)}`,'photo-credit');
  }
  function renderOverview() {
    $('#city-chapters').innerHTML=D.cities.map((c,i)=>`<article class="city-chapter"><a class="chapter-photo" href="#itinerary/${D.days.find(d=>d.city===c.id).id}" aria-label="Explore ${esc(c.name)} days"><img src="${c.photo}" alt="${esc(c.name)} architecture and landscape" loading="lazy" width="600" height="450"><span class="chapter-number">0${i+1}</span></a><div class="chapter-meta"><span>${esc(c.dates)}</span><span>02 NIGHTS</span></div><h3>${esc(c.name)} <a class="chapter-arrow" href="#itinerary/${D.days.find(d=>d.city===c.id).id}" aria-label="View ${c.name} itinerary">↗</a></h3><p>${esc(c.summary)}</p>${photoCredit(c.id)}</article>`).join('');
    const f=chosenFlight(),t=chosenTrain();
    $('#overview-flight').textContent=`${f.number} · 30 Dec · ${f.depart} → ${f.arrive}`;
    $('#overview-train').textContent=`${t.number} · ${t.class} · 5 Jan ${t.depart} → 6 Jan ${t.arrive}`;
    $$('.live-total').forEach(el=>el.textContent=money(total()));
  }
  function renderDayNav() {
    $('#day-nav').innerHTML=D.days.map(d=>`<button class="day-button ${d.id===currentDay?'active':''}" data-day="${d.id}" ${d.id===currentDay?'aria-current="date"':''} aria-label="${d.short} ${d.month}, ${d.city==='home'?'Delhi':d.city}, ${esc(d.title)}"><span class="day-number">${d.short}<small>${d.month}</small></span><span>${d.city==='home'?'Homeward':D.cities.find(c=>c.id===d.city).name}<span class="day-city">${esc(d.mood)}</span></span></button>`).join('');
  }
  function effectiveBlocks(day) {
    const blocks=day.blocks.map(b=>({...b}));
    if(day.id==='2026-12-30') {
      const f=chosenFlight();blocks[0].time=f.id==='ai1737'?'08:40':f.id==='ai1771'?'04:30':'06:10';
      blocks[0].detail=`For ${f.number} at ${f.depart}, target Delhi airport arrival two hours ahead. Recheck terminal and baggage on the ticket.`;
      blocks[1].time=`${f.depart}–${f.arrive}`;blocks[1].title=`Fly to Udaipur · ${f.number}`;
      blocks[1].detail=f.id==='ai1737'?'Our preferred gentle start. After landing, allow 45–60 minutes into town, lunch, check-in and rest.':'Earlier arrival: arrange luggage drop-off and breakfast. Keep the later afternoon plan and do not assume early check-in is free.';
    }
    if(day.id==='2027-01-05')blocks[4].title=`Runicha Express 14088 · ${chosenTrain().class} → Old Delhi`;
    return blocks;
  }
  function timeline(blocks) {
    return `<ol class="timeline">${blocks.map(b=>`<li class="timeline-item"><div class="timeline-time">${esc(b.time)}</div><div class="timeline-content"><h3>${esc(b.title)}</h3><p>${esc(b.detail)}</p><div class="stop-links">${external(maps(b.place),'Map & photos ↗')}${external(sourceUrl(b.source),b.source==='flight'?'Flight options ↗':'Details / source ↗')}</div></div></li>`).join('')}</ol>`;
  }
  function sleepBlock(day) {
    if(day.sleep==='train')return `<span class="label">TONIGHT’S BED</span><p>Runicha Express · ${chosenTrain().class}<br>JSM → Old Delhi, next morning</p>`;
    if(day.sleep==='home')return '<span class="label">TONIGHT’S BED</span><p>Home in Delhi.<br>No extra accommodation night.</p>';
    const s=chosenStay(day.sleep);return `<span class="label">TONIGHT’S HOME</span><p>${external(s.url,esc(s.title)+' ↗')}<br>Entire place · ${day.sleep==='udaipur'?'30 Dec–1 Jan':day.sleep==='jodhpur'?'1–3 Jan':'3–5 Jan'} · dated price checked, not booked</p>`;
  }
  function renderDay(focus=false) {
    const day=D.days.find(d=>d.id===currentDay)||D.days[0],index=D.days.indexOf(day);
    const photo=day.id==='2027-01-04'?'assets/desert.jpg':day.city==='home'?'assets/udaipur.jpg':D.cities.find(c=>c.id===day.city).photo;
    renderDayNav();
    $('#day-detail').innerHTML=`<div class="day-hero"><img src="${photo}" alt="${day.city==='home'?'Lake Pichola, a memory from the journey':day.id==='2027-01-04'?'Sunset camel riders at Sam dunes':esc(day.city)+' destination photograph'}" width="900" height="500"><div class="day-hero-copy"><span class="eyebrow">DAY ${String(index+1).padStart(2,'0')} · ${esc(day.weekday.toUpperCase())} ${day.short} ${day.month}</span><h2 id="day-title" tabindex="-1">${esc(day.title)}</h2></div></div><p class="day-subline">${esc(day.subtitle)}</p><div class="day-logistics"><div>${sleepBlock(day)}</div><div><span class="label">ON THE MOVE</span><p>${esc(day.distance)}</p></div></div>${timeline(effectiveBlocks(day))}<div class="day-advice"><strong>THE SMALL THINGS THAT MAKE IT WORK</strong>${esc(day.tip)}<p class="fine-print" style="margin:10px 0 0">${esc(day.spend)}</p></div><details class="day-alternative"><summary>${esc(day.alternative.title)}</summary><p>${esc(day.alternative.text)}</p></details><div class="day-bottom-nav">${index>0?`<button class="button outline" data-day="${D.days[index-1].id}">← Previous day</button>`:'<span></span>'}${index<D.days.length-1?`<button class="button solid" data-day="${D.days[index+1].id}">Next chapter →</button>`:'<a class="button solid" href="#budget">Ready to book? ↗</a>'}</div><p class="day-counter">Day ${index+1} of 8 · all times are local to India</p>`;
    if(focus)$('#day-title').focus({preventScroll:true});
  }
  function renderPrint() {
    $('#print-itinerary').innerHTML=D.days.map((d,i)=>`<article class="print-day"><h2>Day ${i+1} · ${d.short} ${d.month} · ${esc(d.title)}</h2><p>${esc(d.subtitle)}</p><ul>${effectiveBlocks(d).map(b=>`<li><strong>${esc(b.time)} · ${esc(b.title)}</strong> — ${esc(b.detail)} ${external(maps(b.place),'Map')}</li>`).join('')}</ul><div>${sleepBlock(d)}</div><p>${esc(d.tip)}</p></article>`).join('');
  }
  function renderStays() {
    $('#stay-budget-total').textContent=money(D.cities.reduce((n,c)=>n+state.costs[c.stayBudget],0))+' planned';
    $('#stay-list').innerHTML=D.cities.filter(c=>filter==='all'||filter===c.id).map(c=>`<section class="stay-city" aria-label="${c.name} accommodation"><div class="stay-city-heading"><h2>${c.name}</h2><p>${esc(c.dates)} · 2 nights · ${money(state.costs[c.stayBudget])} planned total</p></div><div class="stay-grid">${D.stays.filter(s=>s.city===c.id).map(s=>`<article class="stay-card ${state.stays[c.id]===s.id?'selected':''}"><div class="stay-photo"><img src="${esc(s.photo)}" alt="Actual listing photograph: ${esc(s.title)}" loading="lazy" referrerpolicy="no-referrer" data-fallback="${c.photo}" width="720" height="480"><span class="stay-badge ${s.preferred?'pick':''}">${s.preferred?'OUR RESEARCH PICK':'ANOTHER OPTION'}</span>${external(s.url,'Listing photo · Airbnb ↗','listing-credit')}</div><div class="stay-copy"><div class="stay-topline"><span>${esc(s.type)}</span><span class="stay-rating">★ ${s.rating} <span>(${s.reviews})</span></span></div><h3>${esc(s.title)}</h3><p class="stay-specs">${esc(s.beds)} · ${esc(s.area)}</p><div class="stay-price"><strong>${money(s.observedPrice)}</strong><span>2 nights · 2 adults<br>Displayed for your dates · 17 Oct</span></div><p class="stay-description">${esc(s.why)}</p><ul class="amenities">${s.amenities.map(a=>`<li>${esc(a)}</li>`).join('')}</ul><details class="stay-details"><summary>Good to know before choosing</summary><p>${esc(s.cautions)}</p><p>Requested dates and two adults displayed with Reserve available on 17 Oct 2026. Final checkout/availability may change. Amenities are host claims; rating counts can change.</p></details><div class="stay-actions"><label class="select-stay"><input type="radio" name="stay-${c.id}" value="${s.id}" ${state.stays[c.id]===s.id?'checked':''}>${state.stays[c.id]===s.id?'Planned base':'Use as planned base'}</label>${external(s.url,'View dates & photos ↗','button outline small')}</div></div></article>`).join('')}</div></section>`).join('');
    $$('img[data-fallback]',$('#stay-list')).forEach(img=>img.addEventListener('error',()=>{
      img.src=img.dataset.fallback;img.alt='Destination photograph; the property photo could not load. Open Airbnb for actual property photos.';img.removeAttribute('data-fallback');
      const credit=$('.listing-credit',img.parentElement);if(credit)credit.textContent='Area photo · property photos on Airbnb ↗';
    },{once:true}));
  }
  function renderTransport() {
    $('#flight-search-link').href=D.flightSearch;
    $('#flight-options').innerHTML=D.flights.map(f=>`<article class="ticket ${f.id===state.flight?'selected':''}"><span class="ticket-tag">${esc(f.label)}</span><h3>${esc(f.airline)}</h3><div class="ticket-number">${f.number} · ${f.duration} · nonstop</div><div class="ticket-times"><span>${f.depart}</span><span>→</span><span>${f.arrive}</span></div><div class="ticket-airports"><span>DEL · DELHI</span><span>UDR · UDAIPUR</span></div><p>${esc(f.reason)}</p><details><summary>Price snapshot & evidence</summary><p>${esc(f.evidence)}</p></details><div class="ticket-price"><strong>${money(f.price)}</strong><span>for two · observed</span></div><label class="ticket-choice"><input type="radio" name="flight" value="${f.id}" ${f.id===state.flight?'checked':''}>${f.id===state.flight?'Chosen flight':'Choose flight'}</label></article>`).join('');
    $('#train-options').innerHTML=D.trains.map(t=>`<article class="train-ticket ${t.id===state.train?'selected':''}"><div><span class="label">${esc(t.label)}</span><h3>${t.class}</h3><p>14088 · 5 Jan → 6 Jan</p></div><div class="train-price"><strong>${money(t.price)}</strong><span>for two · allowance</span></div><p style="grid-column:1/-1">${esc(t.note)}</p><label class="ticket-choice"><input type="radio" name="train" value="${t.id}" ${t.id===state.train?'checked':''}>${t.id===state.train?'Chosen class':'Choose this class'}</label></article>`).join('');
  }
  const groupInfo={travel:['Travel','#7e8e6c'],stays:['Our stays','#a9784c'],food:['Meals','#b99b69'],experiences:['Experiences','#66868b'],buffer:['Contingency','#8c8880']};
  function updateBudgetTotals() {
    const sum=total(),gap=state.cap-sum;
    $('#overview-buffer').textContent=`Includes ${money(state.costs.buffer)} contingency`;
    $$('.live-total').forEach(el=>el.textContent=money(sum));
    $('#budget-headroom').textContent=gap>=0?`${money(gap)} below our ${money(state.cap)} cap`:`${money(-gap)} above our ${money(state.cap)} cap`;
    $('#budget-headroom').classList.toggle('over',gap<0);
    const fill=$('#budget-meter-fill');fill.style.width=Math.min(state.cap>0?sum/state.cap*100:100,100)+'%';fill.style.background=gap<0?'#a94933':'#536a4b';
    $('.budget-meter').setAttribute('aria-label',`${money(sum)} planned against ${money(state.cap)} maximum`);
    $('#budget-groups').innerHTML=Object.entries(groupInfo).map(([key,[label,color]])=>`<div class="budget-group"><span class="group-name"><i class="group-dot" style="background:${color}"></i>${label}</span><strong>${money(D.budget.filter(b=>b.group===key).reduce((n,b)=>n+state.costs[b.id],0))}</strong></div>`).join('');
    $('#stay-budget-total').textContent=money(D.cities.reduce((n,c)=>n+state.costs[c.stayBudget],0))+' planned';
  }
  function budgetNote(b) {
    const city=D.cities.find(c=>c.stayBudget===b.id);
    if(city)return `${chosenStay(city.id).title}: dated two-night snapshot; final checkout can change.`;
    if(b.id==='train')return `${chosenTrain().class} allowance; not a confirmed fare.`;
    return b.note;
  }
  function renderBudget() {
    $('#budget-cap').value=state.cap;
    $('#budget-ledger').innerHTML=D.budget.map(b=>`<div class="ledger-row"><div><label for="cost-${b.id}">${esc(b.label)}</label><small>${esc(budgetNote(b))}</small></div><div class="money-input"><span aria-hidden="true">₹</span><input id="cost-${b.id}" data-cost="${b.id}" type="number" inputmode="numeric" min="0" max="1000000" step="1" value="${state.costs[b.id]}" aria-label="${esc(b.label)}, rupees for two"></div></div>`).join('');
    updateBudgetTotals();renderChecks();
  }
  function renderChecks() {
    $('#booking-checklist').innerHTML=D.checklist.map(c=>`<label class="booking-item"><input type="checkbox" data-check="${c.id}" ${state.checks[c.id]?'checked':''}><span><strong>${esc(c.title)}</strong><span>${esc(c.detail)}</span></span></label>`).join('');
    $('#check-count').textContent=D.checklist.filter(c=>state.checks[c.id]).length+' / '+D.checklist.length;
  }
  function setView() {
    const [requested,day]=location.hash.slice(1).split('/'), valid=['overview','itinerary','stays','transport','budget'];
    const view=valid.includes(requested)?requested:'overview';
    if(view==='itinerary' && D.days.some(d=>d.id===day)) currentDay=day;
    $$('.view').forEach(el=>el.hidden=el.id!==`view-${view}`);
    $$('.main-nav a').forEach(a=>{if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(view==='itinerary')renderDay();
    if(view==='stays')renderStays();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function download(content,name,type) {
    const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function downloadPlan() {
    const flight=chosenFlight(),train=chosenTrain();
    let text=`# Our Rajasthan — Laraib & Musharraf\n\n${D.dates}\nResearch checked ${D.researched}. Nothing booked. All times India.\n\n## Transport\n30 Dec: ${flight.airline} ${flight.number}, DEL ${flight.depart} → UDR ${flight.arrive}. Observed fare for two ${money(flight.price)}; final checkout may change.\n5 Jan: Runicha 14088 ${train.class}, JSM 19:00 → DLI 10:35 on 6 Jan. ${money(state.costs.train)} allowance; confirm selected-date berths.\nFlight search: ${D.flightSearch}\nTrain: ${D.railSearch}\n\n## Entire-place stays — dated snapshots, not reserved\n`;
    D.cities.forEach(c=>{const s=chosenStay(c.id);text+=`\n${c.name}: ${c.dates}, 2 nights\n${s.title} — ${s.type}\nDisplayed dated total for two nights: ${money(s.observedPrice)}. Availability/checkout can change.\n${s.url}\n${s.cautions}\n`;});
    D.days.forEach((d,i)=>{text+=`\n## Day ${i+1} — ${d.short} ${d.month}: ${d.title}\n${d.subtitle}\n`;effectiveBlocks(d).forEach(b=>{text+=`\n- ${b.time} — ${b.title}: ${b.detail}\n  Map: ${maps(b.place)}\n  Source: ${sourceUrl(b.source)}\n`;});text+=`\nRemember: ${d.tip}\n`;});
    text+='\n## Budget — for two\n';D.budget.forEach(b=>{text+=`- ${b.label}: ${money(state.costs[b.id])} (${budgetNote(b)})\n`;});text+=`TOTAL: ${money(total())}; cap: ${money(state.cap)}. Shopping extra.\n\n## Booking checklist\n`;D.checklist.forEach(c=>text+=`- [${state.checks[c.id]?'x':' '}] ${c.title}: ${c.detail}\n`);
    download(text,'our-rajasthan-trip.md','text/markdown;charset=utf-8');toast('Full itinerary downloaded, including your current choices.');
  }
  function calendarExport() {
    const f=chosenFlight();const stamp=()=>new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const events=[{id:'flight',start:`20261230T${f.depart.replace(':','')}00`,end:`20261230T${f.arrive.replace(':','')}00`,title:`Planned: ${f.number} Delhi to Udaipur`,location:'DEL → UDR',note:'Planned candidate, not booked. Verify final flight and ticket.'},{id:'car1',start:'20270101T090000',end:'20270101T153000',title:'Planned: car Udaipur to Jodhpur',location:'Udaipur → Jodhpur',note:'Allowance only; confirm driver and inclusive fare.'},{id:'car2',start:'20270103T090000',end:'20270103T150000',title:'Planned: car Jodhpur to Jaisalmer',location:'Jodhpur → Jaisalmer',note:'Allowance only; confirm driver and inclusive fare.'},{id:'desert',start:'20270104T140000',end:'20270104T213000',title:'Planned: Sam dunes sunset outing',location:'Jaisalmer → Sam → Jaisalmer',note:'Candidate outing, not booked. Town return, no overnight camp.'},{id:'train',start:'20270105T190000',end:'20270106T103500',title:`Planned: Runicha 14088 ${chosenTrain().class} to Delhi`,location:'Jaisalmer JSM → Old Delhi DLI',note:'Published timetable, not booked. Reconfirm service and allocated berths.'}];
    const ie=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
    const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Our Rajasthan//Trip Planner//EN','CALSCALE:GREGORIAN','BEGIN:VTIMEZONE','TZID:Asia/Kolkata','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0530','TZOFFSETTO:+0530','TZNAME:IST','END:STANDARD','END:VTIMEZONE',...events.flatMap(e=>['BEGIN:VEVENT',`UID:rajasthan-${e.id}-2026@local.trip`,`DTSTAMP:${stamp()}`,`DTSTART;TZID=Asia/Kolkata:${e.start}`,`DTEND;TZID=Asia/Kolkata:${e.end}`,`SUMMARY:${ie(e.title)}`,`LOCATION:${ie(e.location)}`,`DESCRIPTION:${ie(e.note)}`,'STATUS:TENTATIVE','END:VEVENT']),'END:VCALENDAR'].join('\r\n');
    download(content,'our-rajasthan-travel.ics','text/calendar;charset=utf-8');toast('Tentative travel calendar downloaded. Nothing added to an account.');
  }
  async function showDialog(kind) {
    if(kind==='sources') {
      $('#dialog-title').textContent='A little research. A lot of clarity.';
      $('#dialog-body').innerHTML=`<p class="source-intro">Checked ${D.researched}. Recommendations are a decided travel plan, not completed bookings. Flight results were checked for the exact departure date and two adults. Airbnb reservation widgets displayed the requested dates, two adults, a price and Reserve available for all six candidates; prices/availability are snapshots, not held bookings. Train and car amounts are allowances. Holiday hours, fees and operations can change.</p>${D.sources.map(s=>`<div class="source-item">${external(sourceUrl(s.url),esc(s.title)+' ↗')}<p>${esc(s.detail)}</p></div>`).join('')}<div class="source-item"><strong>Airbnb listing evidence</strong><p>The six stay cards link directly to the researched listings, with exact requested dates. Type, rating and amenities reflect public listing/host metadata, not an inspection. Dated widgets were then checked in the browser; two unavailable Udaipur candidates were replaced.</p></div>`;
    } else {
      $('#dialog-title').textContent='The people behind the pictures.';
      $('#dialog-body').innerHTML=`<p class="source-intro">Real photographs of the places in this plan. Destination thumbnails are resized by Wikimedia and cropped for display; the credited images retain their stated licences. Airbnb listing images remain host/Airbnb content and link to their originals.</p>${(window.PHOTOCREDITS||[]).map(c=>`<div class="source-item">${external(c.source,esc(c.title)+' ↗')}<p>Photo: ${esc(c.author)} · ${external(c.licenseUrl,esc(c.license))}. ${esc(c.changes)}</p></div>`).join('')}<div class="source-item"><strong>Accommodation photography</strong><p>Each stay uses that listing’s public preview image, served by Airbnb’s image service and credited on the image. No gallery was copied or redistribution licence asserted. If a listing photo fails to load, a labelled destination photograph is shown instead.</p></div>`;
    }
    $('#info-dialog').showModal();
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('.skip-link')){event.preventDefault();$('#main').focus();return;}
    const dayButton=event.target.closest('[data-day]');
    if(dayButton){currentDay=dayButton.dataset.day;history.replaceState(null,'',`#itinerary/${currentDay}`);renderDay(true);$('#day-detail').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
    const filterButton=event.target.closest('[data-stay-filter]');
    if(filterButton){filter=filterButton.dataset.stayFilter;$$('[data-stay-filter]').forEach(b=>{b.classList.toggle('active',b===filterButton);b.setAttribute('aria-pressed',String(b===filterButton));});renderStays();return;}
    const dialogButton=event.target.closest('[data-dialog]');if(dialogButton)showDialog(dialogButton.dataset.dialog);
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.name==='flight') {const f=D.flights.find(f=>f.id===el.value);if(!f)return;state.flight=f.id;state.costs.flight=f.price;save();renderTransport();renderOverview();renderBudget();renderPrint();toast(`${f.number} selected; flight budget updated.`);}
    else if(el.name==='train') {const t=D.trains.find(t=>t.id===el.value);if(!t)return;state.train=t.id;state.costs.train=t.price;save();renderTransport();renderOverview();renderBudget();renderPrint();toast(`${t.class} selected; train allowance updated.`);}
    else if(el.name?.startsWith('stay-')) {const city=el.name.slice(5),s=D.stays.find(s=>s.id===el.value && s.city===city);if(!s)return;state.stays[city]=s.id;state.costs[D.cities.find(c=>c.id===city).stayBudget]=s.observedPrice;save();renderStays();renderOverview();renderBudget();renderPrint();toast('Planned base and dated stay-price snapshot updated.');}
    else if(el.dataset.check){state.checks[el.dataset.check]=el.checked;save();$('#check-count').textContent=D.checklist.filter(c=>state.checks[c.id]).length+' / '+D.checklist.length;}
  });
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.dataset.cost || el.id==='budget-cap') {
      const n=Number(el.value);if(el.value===''||!Number.isFinite(n)||n<0||n>1000000){el.setCustomValidity('Enter an amount from ₹0 to ₹10,00,000.');return;}
      el.setCustomValidity('');if(el.id==='budget-cap')state.cap=Math.round(n);else state.costs[el.dataset.cost]=Math.round(n);save();updateBudgetTotals();
    }
  });
  $('#reset-budget').addEventListener('click',()=>{state.costs=defaults().costs;state.costs.flight=chosenFlight().price;state.costs.train=chosenTrain().price;D.cities.forEach(c=>state.costs[c.stayBudget]=chosenStay(c.id).observedPrice);state.cap=100000;save();renderBudget();renderStays();toast('Research figures restored; your chosen transport and stays are kept.');});
  $('#download-plan').addEventListener('click',downloadPlan);$('#download-plan-bottom').addEventListener('click',downloadPlan);
  $('#calendar-export').addEventListener('click',calendarExport);
  $('#print-plan').addEventListener('click',()=>{renderPrint();window.print();});
  let printFilter;
  window.addEventListener('beforeprint',()=>{printFilter=filter;filter='all';renderStays();renderPrint();});
  window.addEventListener('afterprint',()=>{if(printFilter!==undefined){filter=printFilter;renderStays();printFilter=undefined;}});
  $('#export-choices').addEventListener('click',()=>{download(JSON.stringify(state,null,2),'our-rajasthan-choices.json','application/json');toast('Your choices and budget backup was downloaded.');});
  $('#import-choices').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('File too large');const imported=validate(JSON.parse(await file.text()));state=imported;save();renderAll();toast('Choices restored from your backup.');}catch{toast('Could not import this file. Your current plan is unchanged.');}finally{event.target.value='';}});
  $('#close-dialog').addEventListener('click',()=>$('#info-dialog').close());
  $('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  window.addEventListener('hashchange',setView);
  function renderAll(){renderOverview();renderDay();renderStays();renderTransport();renderBudget();renderPrint();setView();}
  renderAll();
  // Exposes only pure validation/derived data for local verification, never credentials.
  window.TripPlanner=Object.freeze({total,validate,defaults,summary:()=>({flight:chosenFlight().number,train:chosenTrain().class,total:total(),nights:6,days:D.days.length,storageAvailable})});
})();
