# Valentine Timeline Website

A front-end only, date-locked Valentine's Week timeline with an editorial romantic style.

## Structure

```text
valentine-timeline/
├── index.html
├── styles/
│   └── main.css
├── scripts/
│   └── main.js
├── days/
│   └── dayData.js
├── assets/
└── README.md
```

## Features

- Luxury editorial typography:
  - Heading: `Great Vibes`
  - Body: `Playfair Display`
- Valentine timeline cards from Feb 7 to Feb 14
- Local time-lock logic (unlocks at 12:00 AM)
- Locked/future cards are blurred and muted
- Unlocked cards open a day reveal modal with:
  - Day heading and date
  - Image gallery
  - Exact romantic message copy
  - Subtle day-specific ambient animation
- Ambient audio toggle (off by default)
- Fully responsive layout

## Run

Open `index.html` in any modern browser.
