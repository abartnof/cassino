// The tutor's calls off the main thread (src/tutorworker.js): a promise API
// over a worker, with the same calls made on this thread where there is no
// worker or it fails. Tested with a worker made of the server in this
// process, and once against the real engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createTutor, tutorServer } from "../src/tutorworker.js";
import { loadEngine } from "../src/engine.js";

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

// A worker whose thread is this one: messages go to the server a task later,
// replies come back a task later, as with a real one.
function fakeWorker(engine, { initFails = false, dies = false } = {}) {
  const w = {
    sent: [],
    terminated: false,
    postMessage(data) {
      w.sent.push(data);
      if (dies && !data.init) return void setTimeout(() => w.onerror?.({ message: "boom" }), 0);
      setTimeout(() => server(data), 0);
    },
    terminate() {
      w.terminated = true;
    },
  };
  const server = tutorServer(
    () => (initFails ? Promise.reject(new Error("no wasm")) : Promise.resolve(engine)),
    (reply) => setTimeout(() => w.onmessage?.({ data: reply }), 0),
  );
  return w;
}
const engineStub = (tag) => ({
  evidenceOf: (record) => (record === "bad" ? null : `${tag} summary of ${record}`),
  briefOfRecord: (record, history) => ({ bullets: [record, history.length], method: tag, summary: `${tag} ${record}` }),
});
const quiet = () => {
  const warn = console.warn;
  console.warn = () => {};
  return () => (console.warn = warn);
};

test("the calls go to the worker and come back as promises", async () => {
  const w = fakeWorker(engineStub("worker"));
  const tutor = createTutor({ spawn: () => w, local: engineStub("local"), bytes: new Uint8Array([1, 2]) });
  assert.equal(tutor.threaded(), true);
  assert.deepEqual(w.sent[0].init, new Uint8Array([1, 2]), "the engine's bytes are handed over first");
  const [a, b, none] = await Promise.all([tutor.evidenceOf("r1"), tutor.briefOfRecord("r2", ["h"]), tutor.evidenceOf("bad")]);
  assert.equal(a, "worker summary of r1");
  assert.deepEqual(b, { bullets: ["r2", 1], method: "worker", summary: "worker r2" });
  assert.equal(none, null, "a record that will not restore is null, as from the engine");
});

test("the main thread is not blocked: the answer is a promise, not a return", async () => {
  const w = fakeWorker(engineStub("worker"));
  const tutor = createTutor({ spawn: () => w, local: engineStub("local"), bytes: new Uint8Array() });
  let done = false;
  const p = tutor.evidenceOf("r").then(() => (done = true));
  assert.equal(done, false);
  await p;
  assert.equal(done, true);
});

test("with no worker to be had, the same calls are made here, a task later", async () => {
  const loud = quiet();
  try {
    for (const spawn of [undefined, () => null, () => { throw new Error("no Worker"); }]) {
      const tutor = createTutor({ spawn, local: engineStub("local"), bytes: new Uint8Array() });
      assert.equal(tutor.threaded(), false);
      let ran = false;
      const p = tutor.evidenceOf("r1");
      ran = true;
      assert.equal(await p, "local summary of r1");
      assert.equal(ran, true);
      assert.equal((await tutor.briefOfRecord("r", [])).method, "local");
    }
  } finally {
    loud();
  }
});

test("a worker that dies, or cannot make the engine, is given up and its calls made here", async () => {
  const loud = quiet();
  try {
    for (const options of [{ dies: true }, { initFails: true }]) {
      const w = fakeWorker(engineStub("worker"), options);
      const tutor = createTutor({ spawn: () => w, local: engineStub("local"), bytes: new Uint8Array() });
      const asked = [tutor.evidenceOf("r1"), tutor.evidenceOf("r2")];
      assert.deepEqual(await Promise.all(asked), ["local summary of r1", "local summary of r2"], JSON.stringify(options));
      assert.equal(tutor.threaded(), false);
      assert.equal(w.terminated, true);
      assert.equal(await tutor.evidenceOf("r3"), "local summary of r3", "and later ones go straight here");
    }
  } finally {
    loud();
  }
});

test("a call that fails in the worker rejects that call only", async () => {
  const broken = {
    evidenceOf: () => {
      throw new Error("bad record");
    },
    briefOfRecord: () => null,
  };
  const tutor = createTutor({ spawn: () => fakeWorker(broken), local: engineStub("local"), bytes: new Uint8Array() });
  await assert.rejects(tutor.evidenceOf("r"), /bad record/);
  assert.equal(await tutor.briefOfRecord("r", []), null);
  assert.equal(tutor.threaded(), true);
});

test("the server answers only the tutor's stateless calls", async () => {
  const replies = [];
  const handle = tutorServer(() => Promise.resolve({ start: () => "x", evidenceOf: () => "ok" }), (r) => replies.push(r));
  await handle({ init: new Uint8Array() });
  await handle({ id: 1, op: "start", args: [{}] });
  await handle({ id: 2, op: "evidenceOf", args: ["r"] });
  assert.match(replies[0].error, /not a tutor call/);
  assert.equal(replies[1].result, "ok");
});

test("against the real engine: the same text as on this thread", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const bytes = readFileSync(WASM);
  const local = await loadEngine(bytes);
  let s = local.start({ game: "classic", skill: 2, seed: 5 });
  for (let n = 0; s.prompt !== "over" && n < 600; n++) s = local.send(s.prompt === "play" ? s.moves[0] : "next").state;
  const w = fakeWorker(await loadEngine(bytes));
  const tutor = createTutor({ spawn: () => w, local, bytes });
  const summary = await tutor.evidenceOf(s.saved);
  assert.equal(summary, local.evidence());
  const brief = await tutor.briefOfRecord(s.saved, [summary]);
  assert.equal(brief.summary, summary);
  assert.ok(brief.bullets.length >= 1);
});
