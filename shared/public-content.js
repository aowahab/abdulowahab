// Public presentation excludes repository information and the portfolio case study.
const repositoryText = /github|githubusercontent|githubassets|github\.io/i;
const portfolioProject = /personal portfolio|portfolio source/i;
function cleanText(value) {
 return value.replace(/\\n/g,'\n').split('\n').filter(line=>!repositoryText.test(line)&&!portfolioProject.test(line)).join('\n').trim();
}
export function publicContentOnly(value) {
 if (typeof value === 'string') return cleanText(value);
 if (Array.isArray(value)) return value.filter(item=>{
  if(!item || typeof item!=='object')return true;
  return !portfolioProject.test(item.title||'')&&!repositoryText.test(item.link||item.url||'');
 }).map(publicContentOnly);
 if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,publicContentOnly(item)]));
 return value;
}
