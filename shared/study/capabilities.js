// Explicit evidence flags supplied by trusted deployment checks, not browser claims.
// Presence of an API key or SDK does not establish an operational capability.
export function studyReadiness(evidence={}) {
 const required={
  adminMaterials:['adminIdentity','metadataDatabase','adminUploadAuthorization','materialValidation','publicationReview'],
  writtenSubmission:['learnerIdentity','metadataDatabase','privateStore','ownerScopedReads','directUploads','receiptValidation','deadlineEnforcement','retentionWorker'],
  writtenMarking:['metadataDatabase','privateStore','ownerScopedReads','pdfExtraction','docxExtraction','imageExtraction','ocrReview','durableWorker','gradingProvider','rubricCalibration','deletionFencing']
 };
 return Object.fromEntries(Object.entries(required).map(([feature,checks])=>{
  const missing=checks.filter(key=>evidence[key]!==true);
  return [feature,{ready:missing.length===0,missing}];
 }));
}
export const INSPECTED_STUDY_CAPABILITIES=Object.freeze({
 checkedOn:'2026-11-16',blobSdkVersion:'2.9.0',
 metadataDatabase:'environment-names-present-not-runtime-tested',
 gradingProvider:'groq-key-production-only-not-calibrated-for-marking',
 privateStore:'created-private-store-unconnected-runtime-unverified',learnerIdentity:'neon-auth-environment-names-present-not-integrated',
 pdfExtraction:'browser-rendering-present-server-pipeline-missing',
 docxExtraction:'missing',imageExtraction:'missing',
 ocrReview:'browser-ocr-present-submission-pipeline-missing',durableWorker:'missing'
});
