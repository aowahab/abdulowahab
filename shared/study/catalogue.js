import {reviewedChapters} from './chapters.js';
// Syllabus baseline approved by the product owner; not session certification.
export const CATALOGUE_VERSION = 'icab-2023-baseline-v1';
export const CHECKED_AT = '2026-11-16';
export const TARGET_SESSION = '2027-may-june';
export const SOURCES = Object.freeze({
 syllabus:'https://www.icab.org.bd/icabadmin/uploads/ckeditor/62542.%20ICAB%20Syllabus-2023_%28PDF%20File%29.pdf',
 introduction:'https://www.icab.org.bd/icabadmin/uploads/ckeditor/4955Module%20Introduction%20of%20ICAB%20Syllabus-2023%20.pdf',
 advanced:'https://www.icab.org.bd/icabadmin/uploads/ckeditor/2718Syllabus%20Advanced%20Level.pdf'
});
export function deepFreeze(value) {
 if(value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
 return value;
}
const rows = [
 ['cl-assurance','CL','Assurance','mcq',90],
 ['cl-accounting','CL','Accounting','mcq',90],
 ['cl-btf','CL','Business, Technology and Finance','mcq',90],
 ['cl-mi','CL','Management Information','mcq',90],
 ['cl-tax','CL','Principles of Taxation','mcq',90],
 ['cl-laws','CL','Business Laws','mcq',60],
 ['cl-it','CL','Information Technology','mcq',60],
 ['pl-aa','PL','Audit and Assurance','written',210],
 ['pl-far','PL','Financial Accounting and Reporting','written',210],
 ['pl-bst','PL','Business Strategy and Technology','written',210],
 ['pl-fm','PL','Financial Management','written',210],
 ['pl-tax','PL','Business Planning: Taxation & Compliance','written',210],
 ['pl-clp','PL','Corporate Laws & Practices','written',210],
 ['pl-itg','PL','IT Governance','online-unspecified',210],
 ['al-cr','AL','Corporate Reporting','written',210],
 ['al-sbml','AL','Strategic Business Management and Leadership','written',210],
 ['al-case','AL','Case Study','written-case',270]
];
export const SUBJECTS = deepFreeze(rows.map(([id,level,title,format,durationMinutes])=>({
 id,level,title,format,durationMinutes,version:CATALOGUE_VERSION,
 sourceIds:level==='AL'?['syllabus','advanced']:['syllabus','introduction'],
 chapters:reviewedChapters(id),chapterStatus:reviewedChapters(id).length?'reviewed-syllabus-areas':'awaiting-reviewed-import',
 durationStatus:id==='pl-itg'?'conflicting-sources-owner-approved-practice-default':'syllabus-baseline',
 requiresAdvanceInformation:id==='al-case'
})));
export function subjectsForLevel(level) { return SUBJECTS.filter(s=>s.level===level); }
export function subjectById(id) { return SUBJECTS.find(s=>s.id===id) || null; }
// Chapters are reviewed content, never invented from subject titles.
export function validateChapter(chapter) {
 if(!chapter || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(chapter.id||'') ||
 typeof chapter.title!=='string' || !chapter.title.trim() ||
 !Number.isSafeInteger(chapter.order) || chapter.order<1 ||
 !Array.isArray(chapter.sourceIds) || !chapter.sourceIds.length ||
 chapter.sourceIds.some(id=>!Object.hasOwn(SOURCES,id))) throw Error('Invalid reviewed chapter');
 return true;
}
