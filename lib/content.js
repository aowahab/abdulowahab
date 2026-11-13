import { randomUUID } from 'node:crypto';

export const DEFAULT_CONTENT = {
  name: 'Abdul Owahab',
  avatarUrl: '',
  facts: [
    { label: 'Role', value: 'Senior Associate, Audit & Assurance' },
    { label: 'Firm', value: 'Deloitte Bangladesh' },
    { label: 'Based in', value: 'Dhaka, Bangladesh' },
    { label: 'Studying', value: 'Chartered Accountancy, ICAB Professional Level' },
  ],
  sections: [
    {
      id: 'about',
      title: 'About',
      body:
        'My academic foundation is Accounting & Information Systems (AIS) at Jagannath University. I now work in audit and assurance in Dhaka, testing evidence, reconciling balances and documenting reliable conclusions.\n\n' +
        'Alongside the job I am working through the Chartered Accountancy qualification with ICAB, and I am a co-founder of a technology business. The common thread is a habit of checking that things add up.',
    },
    {
      id: 'practice',
      title: 'Accounting, Audit & Assurance Expertise',
      body:
        '- Audit & assurance: Planning, fieldwork and reporting on audit engagements, with documentation another reviewer can follow.\n' +
        '- Regulatory compliance: Compliance audits against Bangladeshi regulation, including foreign-donation and NGO rules.\n' +
        '- Financial reporting: Applying accounting standards and company law to real balances and disclosures.\n' +
        '- Data analytics and AI: Using data tools and AI to test more of a population and cut repetitive work.',
    },
    {
      id: 'qualification',
      title: 'Qualification',
      body:
        'Chartered Accountancy through the Institute of Chartered Accountants of Bangladesh (ICAB), currently at the Professional Level.',
    },
    {
      id: 'experience',
      title: 'Professional Experience',
      body: '- Deloitte Bangladesh: Senior Associate, Audit & Assurance; statutory and group audit assignments.\\n- Industry exposure: Paints and coatings, agrochemicals, manufacturing, healthcare research and services.\\n- Audit areas: Revenue, trade receivables, inventory, payroll, payables, operating expenses and equity.\\n- Tools: Deloitte Omnia, Levvia and Advanced Excel.',
    },
    {
      id: 'education',
      title: 'Education & Professional Development',
      body: '- Jagannath University: BBA in Accounting & Information Systems (AIS).\\n- ICAB: Chartered Accountancy student at Professional Level.\\n- Interests: Financial reporting, assurance, analytics and responsible technology adoption.',
    },
    {
      id: 'projects',
      title: 'Projects & Entrepreneurship',
      body: '- Tickydo Ticketing | Co-founder — Digital ticketing and smart bus-counter platform; pilot operations. https://tickydo.com\\n- Tickydo ERP | Accounting & Reporting Software — Accounting records, general ledger and financial reporting.\\n- Personal Portfolio | Web Platform — Editable professional website hosted on Vercel.',
    },
    {
      id: 'venture',
      title: 'Tickydo',
      body:
        'Tickydo is a digital ticketing and transportation technology business. I am a partner and co-founder, and I look after strategy, finance and operations.',
    },
  ],
  posts: [],
  social: { facebook: '', messenger: '', instagram: '' },
  updatedAt: '',
};

const MEDIA_HOST_SUFFIX = '.public.blob.vercel-storage.com';

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const arr = (value) => (Array.isArray(value) ? value : []);
const newId = () => randomUUID().slice(0, 8);
const cleanId = (value) =>
  typeof value === 'string' && /^[a-z0-9-]{1,40}$/.test(value) ? value : newId();

// Only files hosted on this project's public Blob storage are accepted as media.
function mediaUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (!url.hostname.endsWith(MEDIA_HOST_SUFFIX)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isoDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// Validates and trims whatever the editor sends, so the stored file always
// has the expected shape and size.
export function normalizeContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Content must be an object.');
  }
  const name = text(input.name, 120).trim();
  if (!name) throw new Error('Name cannot be empty.');

  const facts = arr(input.facts)
    .slice(0, 12)
    .map((f) => ({ label: text(f?.label, 40).trim(), value: text(f?.value, 200).trim() }))
    .filter((f) => f.label || f.value);

  const sections = arr(input.sections)
    .slice(0, 12)
    .map((s) => ({ id: cleanId(s?.id), title: text(s?.title, 100).trim(), body: text(s?.body, 8000) }))
    .filter((s) => s.title || s.body.trim());

  const posts = arr(input.posts)
    .slice(0, 300)
    .map((p) => {
      const media = arr(p?.media)
        .slice(0, 30)
        .map((m) => {
          const url = mediaUrl(m?.url);
          if (!url) return null;
          return {
            url,
            name: text(m?.name, 200),
            type: text(m?.type, 100),
            size: Number.isFinite(m?.size) ? Math.max(0, m.size) : 0,
          };
        })
        .filter(Boolean);
      return {
        id: cleanId(p?.id),
        title: text(p?.title, 200).trim(),
        body: text(p?.body, 20000),
        date: isoDate(p?.date),
        media,
      };
    })
    .filter((p) => p.title || p.body.trim() || p.media.length)
    .sort((a, b) => b.date.localeCompare(a.date));

  const safeSocial = (value) => { const v = text(value, 400).trim(); try { const u = new URL(v); return u.protocol === 'https:' ? u.toString() : ''; } catch { return ''; } };
  const social = Object.fromEntries(['facebook', 'messenger', 'instagram'].map(k => [k, safeSocial(input.social?.[k])]));
  return { name, avatarUrl: mediaUrl(input.avatarUrl) || '', facts, sections, posts, social, updatedAt: text(input.updatedAt, 40) };
}


// Protect client confidentiality even when old Admin content still contains names.
const PRIVATE_ENGAGEMENT_NAMES = [
  /Asia Coatings(?:\s*\(Pvt\.?\)\s*(?:Ltd\.?|Limited))?/gi,
  /Asian Paints(?:\s*\(Bangladesh\)|\s+Bangladesh)?(?:\s*(?:Ltd\.?|Limited))?/gi,
  /Bayer CropScience(?:\s*(?:Ltd\.?|Limited))?/gi,
  /Child Health Research Foundation(?:\s*\(CHRF\))?/gi,
  /\bCHRF\b/g,
  /LM Ericsson(?:\s+Bangladesh)?(?:\s*(?:Ltd\.?|Limited))?/gi,
  /Mitsubishi Corporation(?:\s*,?\s*Dhaka Branch)?/gi,
  /Novo Nordisk(?:\s+Pharma)?(?:\s*(?:Ltd\.?|Limited))?/gi,
];
export function redactClientNames(value) {
  if (typeof value !== 'string') return value;
  return PRIVATE_ENGAGEMENT_NAMES.reduce((result, pattern) => result.replace(pattern, 'a confidential audit client'), value);
}
export function publicPortfolioContent(input) {
  const content = input || DEFAULT_CONTENT;
  return {
    ...content,
    facts: (content.facts||[]).map(f=>({...f,value:redactClientNames(f.value)})),
    sections: (content.sections||[]).map(s=>({...s,title:redactClientNames(s.title),body:redactClientNames(s.body)})),
    posts: (content.posts||[]).map(p=>({...p,title:redactClientNames(p.title),body:redactClientNames(p.body),media:(p.media||[]).map(m=>({...m,name:redactClientNames(m.name)}))})),
  };
}
