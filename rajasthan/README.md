# Our Rajasthan

A local, interactive trip planner for Laraib and Musharraf, 30 December 2026–6 January 2027. The existing wedding website is preserved.

Open **portable.html** directly in a browser. It embeds the styling, scripts, and four destination photographs, so the planner works without a server. Airbnb preview photographs, booking links, maps, and research sources need internet. Choices stay in the browser on this device; export a JSON backup before switching browser or location. Nothing is booked or transmitted by changing the planner.

For development, from the parent `website` folder run:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8767/rajasthan/`. Stop with Ctrl-C when finished.

The editable source is `index.html`, `styles.css`, `app.js`, and `data.js`. After changes run `python3 build-portable.py` in this folder to refresh the portable copy. There are no package dependencies or build services.

## Research status

Checked 17 October 2026. Preferred flight and six Airbnb date widgets were observed for two adults and the requested dates; their displayed prices and availability may change. Default working total is ₹97,890, including ₹10,000 contingency. Train, cars, food, activities, and other non-stay costs are planning allowances; railway berths are not confirmed. The 5 January train returns on 6 January. The booking checklist records remaining checks.

Detailed evidence is in the project's `docs/research/rajasthan-stays-2026-27.md`. Sources and photo credits are also available inside the planner. Destination photo licences and attribution are in `assets/credits.json`; all listing imagery remains credited to the Airbnb listing/provider and is loaded from their service.

## Verification

All eight dates, six stay options, stop source/map coverage, ₹97,890 calculation, JavaScript syntax, and backup validation were checked. All five sections were checked at 320, 390, and 768 pixels with no body overflow. Browser checks covered flight/train/stay switching, budget updates, reload persistence, all eight itinerary dates, source/credit dialogs, booking checkboxes, and downloaded itinerary contents. Desktop and mobile screenshots are retained in `docs/research/rajasthan-qa/`.

No bookings, operator messages, payments, or public deployment were performed.
