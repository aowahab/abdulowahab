// Reviewed syllabus-area navigation, NOT textbook chapter numbering.
// Paraphrased labels; provenance identifies the printed PDF page for review.
export const CHAPTER_MAP_VERSION='icab-2023-areas-v2';
const areas={
 'cl-tax':[21,['Tax administration and ethics','Individual income tax','Business income tax','VAT','Customs']],
 'cl-laws':[31,['Company law','Negotiable instruments','Partnerships','Contracts and sale of goods']],
 'cl-it':[36,['System development','System management','IT infrastructure','Continuity and disaster recovery']],
 'pl-bst':[51,['Strategic analysis','Strategic selection','Strategy execution and monitoring']],
 'pl-fm':[56,['Financing choices','Financial risk management','Investment appraisal and valuation']],
 'pl-tax':[59,['Tax administration and disputes','Tax planning','International taxation','VAT','Customs']],
 'pl-clp':[70,['Company law and secretarial work','Securities regulation','Financial reporting regulation','Banking law','Financial institution law','Insurance law','Labour law']],
 'al-sbml':[94,['Business strategy and management','Financial strategy','Restructuring and capital structure','Financial markets and instruments','Corporate reporting','Assurance','Ethics']],
 'al-case':[108,['Advance-information preparation','Financial and business analysis','Professional judgment','Conclusions and recommendations','Report communication']],
 'cl-assurance':[4,['Assurance fundamentals','Internal controls','Assurance evidence','Professional ethics']],
 'cl-accounting':[8,['Financial records','Accounting adjustments','Financial statements','Public financial management']],
 'cl-btf':[12,['Business objectives','Organisational structures','Finance function','Professional and business issues','Business environment','Technology and data']],
 'cl-mi':[18,['Costing, pricing and ethics','Budgets and forecasts','Performance information','Management decisions']],
 'pl-aa':[41,['Professional regulation and ethics','Engagement planning and execution','Conclusions and reporting']],
 'pl-far':[47,['Reporting concepts and ethics','Single-entity reporting','Group reporting','Public-sector reporting']],
 'pl-itg':[75,['IT policies and law','Management systems and technology','IT governance and strategy','Information security','Systems auditing']],
 'al-cr':[81,['Reporting compliance','Financial analysis','Audit and assurance','Ethics']]
};
export function reviewedChapters(subjectId){
 const row=areas[subjectId];
 if(!row)return [];
 return row[1].map((title,index)=>({
 id:`${subjectId}-area-${index+1}`,title,order:index+1,sourceIds:['syllabus'],
 sourcePage:row[0],sourcePageEnd:subjectId==='cl-tax'?22:subjectId==='pl-tax'?60:row[0],mapVersion:CHAPTER_MAP_VERSION,kind:subjectId==='al-case'?'integrated-skill':'syllabus-area',
 reviewStatus:'reviewed-baseline',materialStatus:'not-published'
 }));
}
