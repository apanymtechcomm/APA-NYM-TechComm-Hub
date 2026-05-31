#!/usr/bin/env python3
"""
Sync events from Google Sheets WebEvents tab to the website.

Reads the spreadsheet, generates data/events.json, and rebuilds events.html
from a template. Designed to run in GitHub Actions.

Auth: Uses a Google service account JSON key stored in GOOGLE_SERVICE_ACCOUNT_JSON env var.
For local dev, falls back to reading data/events.json directly.
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────

SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID', '1BPGFaVOgP--Qs7bxeE2XYJsQjLw1kcDetTLtb56J_pM')
SHEET_NAME = os.environ.get('SHEET_NAME', 'WebEvents')
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / 'data'
EVENTS_TEMPLATE = REPO_ROOT / 'templates' / 'events-template.html'
EVENTS_OUTPUT = REPO_ROOT / 'events.html'

# ── Google Sheets API ────────────────────────────────────────────────────────

def get_sheet_data():
    """Fetch data from Google Sheets using service account credentials."""
    sa_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if not sa_json:
        print("No GOOGLE_SERVICE_ACCOUNT_JSON env var. Falling back to local data/events.json")
        return read_local_data()

    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    try:
        info = json.loads(sa_json)
    except json.JSONDecodeError:
        # Might be a file path
        sa_path = Path(sa_json)
        if sa_path.exists():
            info = json.loads(sa_path.read_text())
        else:
            print("ERROR: Cannot parse GOOGLE_SERVICE_ACCOUNT_JSON")
            sys.exit(1)

    credentials = service_account.Credentials.from_service_account_info(
        info,
        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
    )

    service = build('sheets', 'v4', credentials=credentials)
    result = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A1:Z"
    ).execute()

    values = result.get('values', [])
    if not values:
        print("No data found in sheet")
        return []

    # First row is headers
    headers = values[0]
    rows = values[1:]

    events = []
    for row in rows:
        # Pad row to header length
        row_padded = row + [''] * (len(headers) - len(row))
        event = {}
        for i, header in enumerate(headers):
            key = header.strip().lower().replace(' ', '_')
            event[key] = row_padded[i].strip() if i < len(row_padded) else ''
        if event.get('event_name'):  # Skip empty rows
            events.append(event)

    return events


def read_local_data():
    """Read from local data/events.json for development."""
    json_path = DATA_DIR / 'events.json'
    if json_path.exists():
        return json.loads(json_path.read_text())
    return []


# ── Data Processing ──────────────────────────────────────────────────────────

def clean_description(desc):
    """Clean up the description text for HTML display."""
    # Replace newlines with spaces, collapse whitespace
    desc = re.sub(r'\s+', ' ', desc).strip()
    return desc


def extract_date_parts(date_str):
    """Extract structured date info from a date string like 'June 18, 2026 @ 6-8pm'."""
    date_str = date_str.strip()
    parts = {
        'raw': date_str,
        'date': '',
        'time': '',
    }

    # Try to split on @
    if '@' in date_str:
        date_part, time_part = date_str.split('@', 1)
        parts['date'] = date_part.strip()
        parts['time'] = time_part.strip()
    else:
        parts['date'] = date_str

    return parts


def process_events(raw_events):
    """Process raw sheet data into clean event objects."""
    events = []
    for raw in raw_events:
        date_parts = extract_date_parts(raw.get('date', ''))
        event = {
            'title': raw.get('event_name', ''),
            'description': clean_description(raw.get('description', '')),
            'date': date_parts['date'],
            'time': date_parts['time'],
            'location': raw.get('location', ''),
            'rsvp_url': raw.get('rsvp', ''),
        }
        events.append(event)
    return events


# ── HTML Generation ──────────────────────────────────────────────────────────

def generate_events_html(events):
    """Generate events.html from event data."""
    event_cards = []
    for event in events:
        rsvp_html = ''
        if event['rsvp_url']:
            rsvp_html = f'        <a href="{event["rsvp_url"]}" class="card-cta" target="_blank" rel="noopener">RSVP</a>'
        else:
            rsvp_html = '        <a href="#" class="card-cta">Details Coming Soon</a>'

        date_html = f'          <span>{event["date"]}</span>' if event['date'] else ''
        time_html = f'          <span>{event["time"]}</span>' if event['time'] else ''
        location_html = f'          <span>{event["location"]}</span>' if event['location'] else ''

        card = f"""      <article class="event-card">
        <h2>{event['title']}</h2>
        <div class="event-meta">
{date_html}
{time_html}
{location_html}
        </div>
        <p>{event['description']}</p>
{rsvp_html}
      </article>"""
        event_cards.append(card)

    cards_html = '\n\n'.join(event_cards)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Events — APA NYM TechComm</title>
  <meta name="description" content="Upcoming events from the APA New York Metro Chapter Technology Committee.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <header class="site-header">
    <div class="site-branding">
      <div class="site-title"><a href="index.html">APA NYM TechComm</a></div>
      <div class="site-subtitle">American Planning Association New York Metro Chapter Technology Committee</div>
    </div>
    <nav aria-label="Main navigation">
      <ul class="site-nav">
        <li><a href="about.html">About</a></li>
        <li><a href="members.html">Members</a></li>
        <li><a href="events.html" style="border-bottom-color:var(--blue);">Events</a></li>
        <li><a href="newsletters.html">Newsletters</a></li>
        <li><a href="resources.html">Resources</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>
  </header>

  <section class="page-title-section">
    <h1 class="page-title">Events</h1>
    <p class="page-subtitle">Tech Tables, happy hours, workshops, and more.</p>
  </section>

  <main class="page-content">
    <div class="content-block">

{cards_html}

    </div>
  </main>

  <footer class="site-footer">
    APA New York Metro Chapter | Technology Committee
  </footer>

</body>
</html>"""

    return html


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("Syncing events from Google Sheets...")

    # Fetch data
    raw_events = get_sheet_data()
    print(f"  Found {len(raw_events)} event(s) in sheet")

    # Process
    events = process_events(raw_events)
    print(f"  Processed {len(events)} event(s)")

    # Save JSON
    DATA_DIR.mkdir(exist_ok=True)
    json_path = DATA_DIR / 'events.json'
    json_path.write_text(json.dumps(events, indent=2) + '\n')
    print(f"  Wrote {json_path}")

    # Generate HTML
    html = generate_events_html(events)
    EVENTS_OUTPUT.write_text(html)
    print(f"  Wrote {EVENTS_OUTPUT}")

    print("Done.")


if __name__ == '__main__':
    main()