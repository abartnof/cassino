// The worker's own script (bundled separately by build.py and inlined in the
// page; see tutorworker.js). It holds an instance of the engine and answers
// the tutor's stateless calls.
import { loadEngine } from "./engine.js";
import { tutorServer } from "./tutorworker.js";

const handle = tutorServer(
  (bytes) => loadEngine(bytes),
  (reply) => self.postMessage(reply),
);
self.onmessage = (event) => handle(event.data);
