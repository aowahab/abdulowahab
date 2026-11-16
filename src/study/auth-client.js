import {createAuthClient} from '@neondatabase/auth';
const url=import.meta.env?.VITE_NEON_AUTH_URL;
export const authClient=url?createAuthClient(url):null;
export async function accountToken(){if(!authClient)return null;const session=await authClient.getSession();if(!session.data?.user)return null;const result=await authClient.token();if(result.error||!result.data?.token)throw Error('Your account session needs a fresh sign-in.');return result.data.token;}
