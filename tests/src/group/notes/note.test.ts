import { assert, test } from "vitest";

import { ActionHash, Delete, Record, SignedActionHashed } from "@holochain/client";
import { dhtSync, pause, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";
import { toPromise } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { cleanNodeDecoding } from "@tnesh-stack/utils/dist/clean-node-decoding.js";

import { sampleNote } from "../../../../ui/src/group/notes/mocks.js";
import { Note } from "../../../../ui/src/group/notes/types.js";
import { setup } from "./setup.js";

test("create Note", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Note
    const note: EntryRecord<Note> = await alice.store.client.createNote(await sampleNote(alice.store.client));
    assert.ok(note);
  });
});

test("create and read Note", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    const sample = await sampleNote(alice.store.client);

    // Alice creates a Note
    const note: EntryRecord<Note> = await alice.store.client.createNote(sample);
    assert.ok(note);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the created Note
    const createReadOutput: EntryRecord<Note> = await toPromise(bob.store.notes.get(note.actionHash).original);
    assert.deepEqual(sample, cleanNodeDecoding(createReadOutput.entry));
  });
});

test("create and update Note", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Note
    const note: EntryRecord<Note> = await alice.store.client.createNote(await sampleNote(alice.store.client));
    assert.ok(note);

    const originalActionHash = note.actionHash;

    // Alice updates the Note
    let contentUpdate = await sampleNote(alice.store.client);

    let updatedNote: EntryRecord<Note> = await alice.store.client.updateNote(
      originalActionHash,
      originalActionHash,
      contentUpdate,
    );
    assert.ok(updatedNote);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated Note
    const readUpdatedOutput0: EntryRecord<Note> = await toPromise(bob.store.notes.get(note.actionHash).latestVersion);
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput0.entry));

    // Alice updates the Note again
    contentUpdate = await sampleNote(alice.store.client);

    updatedNote = await alice.store.client.updateNote(originalActionHash, updatedNote.actionHash, contentUpdate);
    assert.ok(updatedNote);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated Note
    const readUpdatedOutput1: EntryRecord<Note> = await toPromise(
      bob.store.notes.get(originalActionHash).latestVersion,
    );
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput1.entry));
  });
});

test("create and delete Note", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Note
    const note: EntryRecord<Note> = await alice.store.client.createNote(await sampleNote(alice.store.client));
    assert.ok(note);

    // Alice deletes the Note
    const deleteActionHash = await alice.store.client.deleteNote(note.actionHash);
    assert.ok(deleteActionHash);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob tries to get the deleted Note
    const deletes: Array<SignedActionHashed<Delete>> = await toPromise(bob.store.notes.get(note.actionHash).deletes);
    assert.equal(deletes.length, 1);
  });
});
