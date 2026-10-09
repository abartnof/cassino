// The tutor's heavy calls, off the page's main thread (docs/DESIGN.md §12.8).
// The evidence of a game, and the brief that shares its advisor pass, run
// the advisor over every decision: half a second to two seconds a game, and
// up to thirty games to recompute after a change to the evidence. They are
// stateless (a stored record in, text out), so they run in a Web Worker with
// an instance of the engine of its own, and the page asks for them as
// promises.
//
// The page is one offline file, so the worker's code is inlined by build.py
// (a second bundle, src/tutorworker-entry.js, in a text script) and run from
// a Blob URL; the engine's bytes are posted to it. Where a worker cannot be
// had (or dies, or cannot load the engine), the same calls are made on the
// main thread, one task at a time, as before.

const OPS = new Set(["evidenceOf", "briefOfRecord"]);

// The worker's side: `load(bytes)` makes the engine (a promise), `post`
// sends a reply. Returns the handler for each message received:
// { init: bytes } once, then { id, op, args }.
export function tutorServer(load, post) {
  let engine = null;
  let failed = false;
  return async (data) => {
    if (data.init) {
      engine = load(data.init);
      engine.catch(() => (failed = true)); // told to each caller below
      return;
    }
    try {
      if (!OPS.has(data.op)) throw new Error(`not a tutor call: ${data.op}`);
      const e = await engine;
      post({ id: data.id, result: e[data.op](...data.args) });
    } catch (error) {
      post({ id: data.id, error: String(error?.message ?? error), fatal: failed || engine === null });
    }
  };
}

// The page's side. `spawn()` returns a worker (postMessage, onmessage,
// onerror), or throws or returns null where there is none; `local` is the
// engine on this thread, for the fallback; `bytes` the module for the worker.
export function createTutor({ spawn, local, bytes }) {
  let worker = null;
  let calls = 0;
  const pending = new Map();

  // The same call on this thread, in a task of its own.
  const onThisThread = (op, args) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        try {
          resolve(local[op](...args));
        } catch (error) {
          reject(error);
        }
      }, 0),
    );

  // The worker is given up for good: what it was asked is asked here.
  function giveUp(why) {
    console.warn("The tutor's worker is not used:", why);
    const w = worker;
    worker = null;
    try {
      w?.terminate?.();
    } catch {
      // Already gone.
    }
    for (const [, call] of pending) onThisThread(call.op, call.args).then(call.resolve, call.reject);
    pending.clear();
  }

  try {
    worker = spawn?.() ?? null;
  } catch (error) {
    console.warn("No worker for the tutor:", error);
    worker = null;
  }
  if (worker) {
    worker.onmessage = (event) => {
      const data = event.data ?? event;
      const call = pending.get(data.id);
      if (!call) return;
      // The engine would not load there: a fault of the worker, not of the call.
      if (data.error !== undefined && data.fatal) return giveUp(data.error);
      pending.delete(data.id);
      if (data.error !== undefined) call.reject(new Error(data.error));
      else call.resolve(data.result);
    };
    worker.onerror = (event) => giveUp(event?.message ?? "error");
    worker.postMessage({ init: bytes });
  }

  const ask = (op, args) => {
    if (!worker) return onThisThread(op, args);
    return new Promise((resolve, reject) => {
      const id = ++calls;
      pending.set(id, { op, args, resolve, reject });
      worker.postMessage({ id, op, args });
    });
  };

  return {
    // Whether a worker is doing the work.
    threaded: () => worker !== null,
    // The summary of a stored record (null if it will not restore).
    evidenceOf: (record) => ask("evidenceOf", [record]),
    // { bullets, method, summary } of a stored record with the earlier games'
    // summaries, or null.
    briefOfRecord: (record, history) => ask("briefOfRecord", [record, history]),
    close: () => {
      pending.clear();
      worker?.terminate?.();
      worker = null;
    },
  };
}
