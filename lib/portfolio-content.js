import { DEFAULT_CONTENT as LEGACY_DEFAULT, normalizeContent as normalizeLegacy, publicPortfolioContent as publicLegacy, redactClientNames } from './content.js';
import { PROFILE } from '../shared/profile.js';
import { PROJECTS } from '../shared/projects.js';
export const DEFAULT_CONTENT = { ...LEGACY_DEFAULT, profile: PROFILE, projects: PROJECTS };
const text = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
const arr = value => Array.isArray(value) ? value : [];
const mediaUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com') ? u.href : ''; } catch { return ''; } };
export function normalizeContent(input) {
  const content = normalizeLegacy(input);
  const p = input.profile || {};
  const profile = {
    headline: text(p.headline ?? PROFILE.headline, 160),
    intro: text(p.intro ?? PROFILE.intro, 600),
    location: text(p.location ?? PROFILE.location, 100),
    cvUrl: mediaUrl(p.cvUrl) || '',
    cvUpdated: text(p.cvUpdated ?? PROFILE.cvUpdated, 60),
  };
  const projects = (Array.isArray(input.projects) ? input.projects : PROJECTS).slice(0, 6).map(project => {
    const safeLink = value => { try { const u = new URL(value, 'https://portfolio.local'); return u.protocol === 'https:' && !u.username && !u.password ? (u.origin === 'https://portfolio.local' ? u.pathname : u.href) : ''; } catch { return ''; } };
    return {
      title: text(project?.title, 120), tag: text(project?.tag, 120),
      problem: text(project?.problem, 600), contribution: text(project?.contribution, 600), result: text(project?.result, 800),
      link: safeLink(project?.link || ''), cta: text(project?.cta, 80),
      flow: arr(project?.flow).slice(0, 4).map(step => text(step, 100)),
    };
  }).filter(project => project.title);
  return { ...content, profile, projects };
}
export function publicPortfolioContent(input) {
  const content = input || DEFAULT_CONTENT;
  return {
    ...publicLegacy(content),
    profile: Object.fromEntries(Object.entries(content.profile || PROFILE).map(([k,v]) => [k,redactClientNames(v)])),
    projects: (content.projects || PROJECTS).map(p => Object.fromEntries(Object.entries(p).map(([k,v]) => [k,Array.isArray(v)?v.map(redactClientNames):redactClientNames(v)]))),
  };
}
