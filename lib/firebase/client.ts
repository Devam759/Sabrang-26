/**
 * Firebase Client SDK bridge
 * Re-exports the unified Firebase app, auth, and db singletons from lib/firebase.ts
 */
import { app, auth, db } from "../firebase";

export { app, auth, db };
export default app;
