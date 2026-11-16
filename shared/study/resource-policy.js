// Deployment defaults, not provider limits. Enforcement endpoints/workers come later.
export const RESOURCE_POLICY_VERSION='study-resources-v1';
export const STUDY_LIMITS=Object.freeze({
 fileBytes:20*1024*1024,attemptBytes:50*1024*1024,filesPerAttempt:40,pagesPerAttempt:60,
 imagePixels:25000000,docxExpandedBytes:100*1024*1024,docxEntries:2000,docxExpansionRatio:100,
 extractionCharacters:300000,gradingInputTokens:30000,gradingOutputTokens:6000,
 guestMarkingsPerDay:1,accountMarkingsPerDay:3,activeJobsPerOwner:1,
 uploadAuthorizationsPerMinute:10,submissionRequestsPerMinute:5,
 requestBytes:64*1024,providerTimeoutSeconds:90,maxAttempts:3,leaseSeconds:180
});
const mimeTypes=new Set(['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']);
function positiveInt(value){return Number.isSafeInteger(value)&&value>0;}
// Metadata screening only: real file signatures and extracted resource counts must be checked server-side.
export function validateUploadManifest(files){
 if(!Array.isArray(files)||!files.length||files.length>STUDY_LIMITS.filesPerAttempt)throw Error('Invalid file count');
 let total=0;for(const file of files){
  if(!file||!mimeTypes.has(file.mimeType))throw Error('Unsupported file type');
  if(!positiveInt(file.bytes)||file.bytes>STUDY_LIMITS.fileBytes)throw Error('File size limit');
  total+=file.bytes;
 }
 if(total>STUDY_LIMITS.attemptBytes)throw Error('Attempt size limit');
 return {files:files.length,bytes:total};
}
export function validateExtraction({pages,characters,imagePixels=0,archiveBytes=0,expandedBytes=0,archiveEntries=0}){
 if(!positiveInt(pages)||pages>STUDY_LIMITS.pagesPerAttempt)throw Error('Page limit');
 if(!positiveInt(characters)||characters>STUDY_LIMITS.extractionCharacters)throw Error('Text limit or unreadable script');
 for(const value of [imagePixels,archiveBytes,expandedBytes,archiveEntries])if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid resource count');
 if(imagePixels>STUDY_LIMITS.imagePixels)throw Error('Image pixel limit');
 if(expandedBytes>STUDY_LIMITS.docxExpandedBytes||archiveEntries>STUDY_LIMITS.docxEntries)throw Error('Archive resource limit');
 if(expandedBytes>0&&(archiveBytes===0||expandedBytes/archiveBytes>STUDY_LIMITS.docxExpansionRatio))throw Error('Archive expansion limit');
 return true;
}
// Units are integer micro-units of ONE deployment-configured currency, never floating-point money.
// Return reservations to a transactional budget service; this helper does not reserve funds.
export function gradingReservation({inputTokens,outputTokens,estimatedUnits,remainingUnits}){
 if(!positiveInt(inputTokens)||inputTokens>STUDY_LIMITS.gradingInputTokens||!positiveInt(outputTokens)||outputTokens>STUDY_LIMITS.gradingOutputTokens)throw Error('Token budget exceeded');
 if(!positiveInt(estimatedUnits)||!Number.isSafeInteger(remainingUnits)||remainingUnits<0)throw Error('Pricing or budget missing');
 const reservation=estimatedUnits*STUDY_LIMITS.maxAttempts;
 if(!Number.isSafeInteger(reservation)||reservation>remainingUnits)throw Error('Grading budget exhausted');
 return {reservedUnits:reservation,maxAttempts:STUDY_LIMITS.maxAttempts};
}
export function retryDecision({attempt,status,code,retryAfterSeconds=0}){
 if(!positiveInt(attempt)||attempt>STUDY_LIMITS.maxAttempts)throw Error('Invalid attempt number');
 if(!Number.isFinite(retryAfterSeconds)||retryAfterSeconds<0)throw Error('Invalid retry delay');
 if(['unreadable','invalid-rubric','invalid-output'].includes(code))return {action:'review-required',delaySeconds:0};
 const transient=status===429||(Number.isInteger(status)&&status>=500&&status<=599)||['network','timeout'].includes(code);
 if(!transient||attempt>=STUDY_LIMITS.maxAttempts)return {action:'failed',delaySeconds:0};
 // Do not retry earlier than a provider's requested delay. Long delays remain queued.
 return {action:'retry',delaySeconds:Math.max(30*2**(attempt-1),Math.ceil(retryAfterSeconds))};
}
