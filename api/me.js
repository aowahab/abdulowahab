import { isAdmin } from '../lib/auth.js';
import { json } from '../lib/http.js';

// Tells the admin page whether the server is set up and whether you are signed in.
export function GET(request) {
  return json({
    configured: Boolean(process.env.ADMIN_PASSWORD),
    admin: isAdmin(request),
  });
}
