/**
 * Idempotent content seed for the APA NYM TechComm website.
 * Run: NODE_ENV=production node_modules/.bin/tsx scripts/seed.ts
 *
 * Upserts by slug/title — safe to re-run. Content comes verbatim from the
 * original static site (apanytechcomm/APA-NYM-TechComm-Hub, src/ HTML + data/events.json).
 */
import { config as loadEnv } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPayload } from 'payload'

const root = path.resolve(import.meta.dirname, '..')
loadEnv({ path: root + '/.env' })
Object.assign(process.env, { NODE_ENV: 'production' })

const cfgMod = await import(pathToFileURL(root + '/src/payload.config.ts').toString())
let config: any = cfgMod.default ?? cfgMod
if (config instanceof Promise) config = await config

const payload = (await getPayload({ config })) as any

// --- helpers ---------------------------------------------------------------

const p = (...f: string[]) => path.join(root, 'seed-assets', ...f)

async function upsertMedia(filename: string, sourcePath: string, alt: string, folder?: string): Promise<number> {
  const all = await payload.find({ collection: 'media', overrideAccess: true, limit: 1000, where: { filename: { equals: filename } } })
  if (all.totalDocs > 0) return all.docs[0].id
  const staged = '/tmp/' + filename
  fs.copyFileSync(sourcePath, staged)
  const doc = await payload.create({ collection: 'media', overrideAccess: true, data: { alt: alt || filename }, filePath: staged })
  fs.rmSync(staged, { force: true })
  payload.logger.info(`media created: ${filename} id=${doc.id}`)
  return doc.id as number
}

async function upsertEvent(slug: string, data: Record<string, unknown>) {
  const found = await payload.find({ collection: 'events', overrideAccess: true, limit: 5, where: { slug: { equals: slug } } })
  if (found.totalDocs > 0) {
    await payload.update({ collection: 'events', overrideAccess: true, id: found.docs[0].id, data: { ...data, _status: 'published' } })
    payload.logger.info(`event updated: ${slug}`)
    return
  }
  await payload.create({ collection: 'events', overrideAccess: true, data: { ...data, _status: 'published' } })
  payload.logger.info(`event created: ${slug}`)
}

async function upsertResource(title: string, data: Record<string, unknown>) {
  const found = await payload.find({ collection: 'resources', overrideAccess: true, limit: 5, where: { title: { equals: title } } })
  if (found.totalDocs > 0) {
    await payload.update({ collection: 'resources', overrideAccess: true, id: found.docs[0].id, data })
    return
  }
  await payload.create({ collection: 'resources', overrideAccess: true, data })
}

async function upsertMember(name: string, data: Record<string, unknown>) {
  const found = await payload.find({ collection: 'members', overrideAccess: true, limit: 5, where: { name: { equals: name } } })
  if (found.totalDocs > 0) {
    await payload.update({ collection: 'members', overrideAccess: true, id: found.docs[0].id, data })
  } else {
    await payload.create({ collection: 'members', overrideAccess: true, data })
  }
}

async function upsertHeroSlide(heading: string, data: Record<string, unknown>) {
  const found = await payload.find({ collection: 'hero-slides', overrideAccess: true, limit: 5, where: { heading: { equals: heading } } })
  if (found.totalDocs > 0) {
    await payload.update({ collection: 'hero-slides', overrideAccess: true, id: found.docs[0].id, data })
  } else {
    await payload.create({ collection: 'hero-slides', overrideAccess: true, data })
  }
}

// text() lexical node
const T = (text: string, bold = false) => ({ type: 'text', detail: bold ? 1 : 0, format: 0, mode: 'normal', style: '', text, version: 1 })
const P = (...texts: (string | any)[]) => ({ type: 'paragraph', format: '', indent: 0, direction: 'ltr', children: texts.map((t) => (typeof t === 'string' ? T(t) : t)), version: 1 })
const H = (tag: string, text: string) => ({ type: 'heading', tag, format: '', indent: 0, direction: 'ltr', children: [T(text)], version: 1 })
const ULI = (...items: (string | any)[][]) => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  format: '',
  indent: 0,
  direction: 'ltr',
  children: items.map((lines) => ({
    type: 'listitem',
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [P(...lines)],
    version: 1,
  })),
  version: 1,
})

// --- media -----------------------------------------------------------------

payload.logger.info('seeding media...')
const mediaHero = await upsertMedia('hero-city-blue.png', p('hero-city-blue.png'), 'NYC street scene')
const mediaTTHero = await upsertMedia('TT_Spring2026 Hero.png', p('newsletters/TT_Spring2026 Hero.png'), 'Spring Tech Table hero image')
const mediaBMB01 = await upsertMedia('TT_Spring26 BM01.jpg', p('newsletters/TT_Spring26 BM01.jpg'), 'Planning with a Black Mirror card deck photo 1')
const mediaBMB02 = await upsertMedia('TT_Spring26 BM02.jpg', p('newsletters/TT_Spring26 BM02.jpg'), 'Planning with a Black Mirror card deck photo 2')

// --- hero slides -----------------------------------------------------------

payload.logger.info('seeding hero slides...')
await upsertHeroSlide('BYTE BY BYTE||Vol.01 // Summer 2026', {
  heading: 'BYTE BY BYTE||Vol.01 // Summer 2026',
  text: 'The quarterly publication of APA NYM TechComm, exploring the intersection of technology and planning practice.',
  ctaLabel: 'Read Latest',
  ctaUrl: '/newsletters',
  bgImage: mediaHero,
  sortOrder: 10,
})
await upsertHeroSlide('Tech Tables Launch', {
  heading: 'Tech Tables Launch',
  text: 'A new series of intimate, topic-driven gatherings for planners and technologists.',
  ctaLabel: 'Learn More',
  ctaUrl: '/events',
  bgImage: await upsertMedia('hero-herald-blue.png', p('hero-herald-blue.png'), 'Herald Square, blue duotone'),
  sortOrder: 20,
})
await upsertHeroSlide('Planning with a Black Mirror||Happy Hour', {
  heading: 'Planning with a Black Mirror||Happy Hour',
  text: 'Celebrate the release of the Planning with a Black Mirror card game. Learn and play with your fellow planners.',
  ctaLabel: 'RSVP',
  ctaUrl: '/events',
  bgImage: await upsertMedia('hero-lower-mn-blue.png', p('hero-lower-mn-blue.png'), 'Lower Manhattan skyline, blue duotone'),
  sortOrder: 30,
})
await upsertHeroSlide('Field Notes||NPC26 Technology Takeaways', {
  heading: 'Field Notes||NPC26 Technology Takeaways',
  text: 'Key insights and technology highlights from the 2026 National Planning Conference.',
  ctaLabel: 'Coming Soon',
  ctaUrl: '#',
  bgImage: await upsertMedia('hero-LIC-blue.png', p('hero-LIC-blue.png'), 'Long Island City skyline, blue duotone'),
  sortOrder: 40,
})

// --- events (verbatim from data/events.json) -------------------------------

payload.logger.info('seeding events...')
await upsertEvent('spring-tech-table', {
  title: 'Spring Tech Table',
  slug: 'spring-tech-table',
  eventDate: '2026-06-18T18:00:00.000-04:00',
  timeString: '6:00 PM – 8:00 PM EDT',
  location: 'VHB - One Penn Plaza, New York',
  description:
    "Kickoff of Tech Tables, conducting Tech Committee reflecting on the year so far, what is coming up in 2026, and open discussion on planning ahead. Wrap-up includes a one-hour happy hour to celebrate the release of the Planning with a Black Mirror card game. The American Planning Association's (APA) Technology Division created a scenario-based card game, to help planners collaboratively explore the impacts of emerging technologies and unpredictable events on communities. Please come expecting to learn and play with your fellow planners!",
  status: 'registration-open',
  rsvpUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc9SgJUMGDtDFloxR3oFB4mctDCgdZFYp2yG6rfhSwGmb0UkA/viewform',
  cmCredits: 'CM Credits TBD',
  hybrid: true,
  featured: true,
})
await upsertEvent('fall-tech-table', {
  title: 'November Tech Table — No Cloud Required Part 2',
  slug: 'fall-tech-table',
  eventDate: '2026-11-19T23:00:00.000Z',
  timeString: '6:00 PM – 8:00 PM EST',
  location: 'Venue and virtual access details to be announced',
  description:
    'Back by popular demand: we are going to have a continuation of our open-source AI lab from the annual conference. This time we will get to doing the actual lab from the session where you and an AI agent will map the industrial heart of Long Island City, live, using nothing but free and open-source tools. We wrap up with committee updates, what to watch in 2027, and a happy hour. Come for the lab, stay for the drinks; happy-hour-only folks are welcome too.',
  status: 'registration-open',
  rsvpUrl: '/events/november-19-2026/rsvp',
  cmCredits: '1 CM credit',
  featured: true,
  hybrid: true,
})
await upsertEvent('nyc-nym-conference-no-cloud-required', {
  title: 'APA NYM Conference — No Cloud Required',
  slug: 'nyc-nym-conference-no-cloud-required',
  eventDate: '2026-10-15T19:20:00.000-04:00',
  timeString: '3:20 PM – 4:20 PM EDT',
  location: 'NYU Kimmel Center for University Life, Room 903',
  description:
    'Session at the 2026 APA NYM Annual Conference: "No Cloud Required: A Hands-On Guide to Open-Source AI Tools for Planning Practice," presented by Andrew Buck. A brief overview of running open-source AI locally for planning work, followed by a hands-on lab. The lab materials live on the APA Technology Division GitHub.',
  status: 'past',
  rsvpUrl: 'https://github.com/apanymtechcomm/APA-NYM-Conf---No-Cloud-Required-Lab',
  hybrid: false,
})

// --- resources (verbatim from resources.html) ------------------------------

payload.logger.info('seeding resources...')
const resources: Array<[string, string, string, string]> = [
  ['APA Technology Division GitHub', 'Browse the APA Technology Division\u2019s public GitHub organization for planning tech projects, collaboration spaces, and source repositories.', 'Visit the GitHub org', 'https://github.com/APA-Technology-Division'],
  ['Planning Data Tools', 'Discover sample repositories for planning data workflows, spatial analysis, and urban modeling.', 'Explore tools', 'https://github.com/APA-Technology-Division'],
  ['Community Code Samples', 'Review shared code examples intended for planners, civic technologists, and chapter volunteers.', 'View code samples', 'https://github.com/APA-Technology-Division'],
  ['GIS & Mapping Resources', 'Find repositories focused on GIS tools, mapping workflows, and spatial data integration for planning and transportation analysis.', 'Open mapping resources', 'https://github.com/APA-Technology-Division'],
  ['Planning with a Black Mirror', 'A scenario-based card game created by APA\u2019s Technology Division to help planners explore the impacts of emerging technologies on communities.', 'Learn more', '/#black-mirror'],
  ['NYC OpenData', 'The City of New York\u2019s open data portal — datasets, APIs, and visualizations for planning research and civic technology projects.', 'Visit NYC OpenData', 'https://opendata.cityofnewyork.us/'],
  ['ZAP API', 'NYC Department of City Planning\u2019s Zoning Application Portal API — programmatic access to land use and zoning application data.', 'Explore ZAP API', 'https://zap-api.planning.nyc.gov/'],
  ['BYTE BY BYTE Newsletter', 'Our quarterly publication covering technology trends, tool reviews, and committee updates for the NYC planning community.', 'Read the latest', '/newsletters'],
]
for (const [title, description, linkLabel, linkUrl] of resources) {
  await upsertResource(title, { title, description, linkLabel, linkUrl })
}

// --- members (verbatim from members.html) ----------------------------------

payload.logger.info('seeding members...')
const members: Array<Record<string, unknown>> = [
  { name: 'Andrew Buck, AICP, ENV SP', initials: 'AB', memberRole: 'co-chair', subtitle: 'Co-Chair', bio: 'Infrastructure planner and sustainability strategist at VHB. Leading the charge to connect NYC planners with the tools that shape cities.', sortOrder: 10 },
]
for (const m of members) await upsertMember(m.name as string, m)

// --- newsletters ------------------------------------------------------------

payload.logger.info('seeding newsletters...')
const nlFound = await payload.find({ collection: 'newsletters', overrideAccess: true, limit: 5, where: { slug: { equals: 'byte-by-byte-vol-01-spring-2026' } } })
const nlBody = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      H('h2', 'Introducing Tech Tables'),
      P("A new quarterly forum bringing together planners, technologists, and innovators for meaningful conversations at the intersection of technology and planning."),
      P('Be ready to participate and contribute.'),
      H('h3', '// Inaugural Spring(ish) Tech Table'),
      P('📅 Date: Thursday, June 18'),
      P('🕛 Time: 6:00 PM – 8:00 PM'),
      P('📍 Venue: VHB, One Penn Plaza, NYC'),
      P('🎴 Planning with a Black Mirror Card Game'),
      P('🥇 CM Credits TBD'),
      P('☕ Light snacks & refreshments'),
      P('💻 Hybrid option available'),
      H('h3', '// Upcoming Tech Tables — Full Series 2026'),
      ULI(
        ['Summer', ' — ', '08.20.26'],
        ['Fall', ' — ', '10.22.26'],
        ['Winter', ' — ', '12.10.26'],
      ),
      P('Save the dates. More to come.'),
      H('h2', '// Planning with a Black Mirror'),
      P('Tech Committee will be wrapping up the Spring Tech Table with a one-hour happy hour to celebrate the release of the Planning with a Black Mirror card game.'),
      P("The American Planning Association's (APA) Technology Division created a scenario-based card game, to help planners collaboratively explore the impacts of emerging technologies and unpredictable events on communities. Please come expecting to learn and play with your fellow planners!"),
      P('Decks are now available to those who donate a minimum of $45 to Tech Division! Move quick, there are only 30 decks left for the first edition.'),
      H('h2', '// Field Notes: APA NPC26 Technology Takeaways'),
      P('The 2026 APA National Planning Conference in Detroit happened in late April. This event brought together over 5,000 planners to discuss key trends and challenges happening in the industry and practice. Technology related takeaways centered around:'),
      ULI(
        [T('AI & Machine Learning in Planning Review', true), ' — Multiple sessions highlighted how AI tools are streamlining code compliance, site plan review, and zoning analysis. Some early adopters reported 30-50% faster review times for routine applications.'],
        [T('Digital Twin Technologies', true), ' — Cities are building real-time digital twins to model climate resilience, traffic patterns, and utility performance. Some mobile workshops demonstrated how planners can engage communities through immersive 3D visualization.'],
        [T('Data Privacy & Ethics', true), ' — A major theme across sessions: technology must serve people, not replace them. Planners emphasized the importance of maintaining human oversight in algorithmic decision-making, especially for equity-sensitive applications like housing allocation and service distribution.'],
        [T('Energy & Climate Tech Integration', true), ' — Sessions on building performance analytics, distributed energy resources, and microgrid planning showed how planners can integrate energy efficiency into development review processes without adding burden.'],
        [T('Citizen Engagement Platforms', true), ' — New tools are making public participation more accessible, with mobile-first interfaces and multilingual support.'],
      ),
      H('h2', 'A letter from your co-chair'),
      P("It's been awhile since we've all gotten together and that has given us some time to reflect and consider how Tech Committee can evolve to better serve New York Metro Planners and Placemakers in navigating the rapid pace of technological changes that are impacting our practices."),
      P('We are excited to be back and look forward to co-creating this community with all of you.'),
      P('— Andrew Buck, AICP, Cochair, APA NYM Technology Committee'),
    ],
  },
} as any
const nlData = {
  title: 'BYTE BY BYTE Vol.01 // Spring 2026',
  slug: 'byte-by-byte-vol-01-spring-2026',
  volume: 'Vol.01',
  season: 'Spring 2026',
  issueLabel: 'NEWSLETTER 2026.01',
  coverImage: mediaTTHero,
  publishedDate: '2026-05-01T00:00:00.000Z',
} as Record<string, unknown>
if (nlFound.totalDocs > 0) {
  await payload.update({ collection: 'newsletters', overrideAccess: true, id: nlFound.docs[0].id, data: { ...nlData, body: nlBody, _status: 'published' } })
  payload.logger.info('newsletter updated')
} else {
  await payload.create({ collection: 'newsletters', overrideAccess: true, data: { ...nlData, body: nlBody, _status: 'published' } })
  payload.logger.info('newsletter created')
}

// --- globals ---------------------------------------------------------------

payload.logger.info('seeding globals...')
await payload.updateGlobal({
  slug: 'homepage',
  overrideAccess: true,
  data: {
    cards: [
      {
        heading: 'Events',
        showNextEvent: true,
        ctaLabel: 'View Events',
        ctaHref: '/events',
      },
      {
        heading: 'Newsletters',
        body: 'BYTE BY BYTE is the quarterly publication of APA NYM TechComm.',
        showNextEvent: false,
        ctaLabel: 'Read Latest',
        ctaHref: '/newsletters',
      },
      {
        heading: 'Resources',
        body: 'Tools, frameworks, readings, and case studies for technology-informed planning.',
        showNextEvent: false,
        ctaLabel: 'Browse Resources',
        ctaHref: '/resources',
      },
    ],
  },
})
await payload.updateGlobal({
  slug: 'sponsors',
  overrideAccess: true,
  data: {
    pitch:
      "We're looking for sponsors to help fund events and programming for the APA NYM Tech Committee. Sponsors support Tech Tables, BYTE BY BYTE, and other initiatives that connect planners with technology. Interested?",
    contactLabel: 'Get in touch',
    contactHref: '/contact',
    logoSlots: 4,
  },
})

const hdr = await payload.findGlobal({ slug: 'header', overrideAccess: true })
const hasNav = (hdr as any)?.navItems?.length
if (!hasNav) {
  await payload.updateGlobal({
    slug: 'header',
    overrideAccess: true,
    data: {
      siteTitle: 'APA NYM TechComm',
      siteSubtitle: 'American Planning Association New York Metro Chapter Technology Committee',
      navItems: [
        { link: { type: 'custom', url: '/events', label: 'Events', newTab: false } },
        { link: { type: 'custom', url: '/newsletters', label: 'Newsletters', newTab: false } },
        { link: { type: 'custom', url: '/resources', label: 'Resources', newTab: false } },
        { link: { type: 'custom', url: '/members', label: 'Committee', newTab: false } },
        { link: { type: 'custom', url: '/contact', label: 'Contact', newTab: false } },
      ],
    },
  })
}
await payload.updateGlobal({
  slug: 'footer',
  overrideAccess: true,
  data: { footerText: 'APA New York Metro Chapter | Technology Committee' },
})

// --- report ----------------------------------------------------------------

const counts: Record<string, number> = {}
for (const c of ['events', 'newsletters', 'resources', 'members', 'hero-slides', 'media']) {
  const r = await payload.count({ collection: c, overrideAccess: true })
  counts[c] = r.totalDocs
}
payload.logger.info('SEED COMPLETE ' + JSON.stringify(counts))
process.exit(0)