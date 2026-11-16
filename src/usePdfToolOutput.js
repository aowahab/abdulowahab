import {useEffect,useRef} from 'react';
import {downloadFile} from './toolFiles.js';
export function usePdfToolOutput(onResult,busy=false,onBusyChange){
 const alive=useRef(true),resultRef=useRef(onResult),busyRef=useRef(onBusyChange);resultRef.current=onResult;busyRef.current=onBusyChange;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;busyRef.current?.(false)}},[]);
 useEffect(()=>{busyRef.current?.(busy)},[busy]);
 return(bytes,name,type='application/pdf')=>{if(!alive.current)return;const blob=bytes instanceof Blob?bytes:new Blob([bytes],{type});downloadFile(blob,name,type);resultRef.current?.({blob,name,type:blob.type||type})};
}
