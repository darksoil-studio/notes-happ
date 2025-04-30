import { assert, test } from "vitest";

import { ActionHash, EntryHash, Record } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";
import { toPromise } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";

import { sampleNote } from "../../../../ui/src/group/notes/mocks.js";
import { Note } from "../../../../ui/src/group/notes/types.js";
import { setup } from "./setup.js";

test("create a Note and get all notes", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Bob gets all notes
    let collectionOutput = await toPromise(bob.store.allNotes);
    assert.equal(collectionOutput.size, 0);

    // Alice creates a Note
    const note: EntryRecord<Note> = await alice.store.client.createNote(await sampleNote(alice.store.client));
    assert.ok(note);

    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets all notes again
    collectionOutput = await toPromise(bob.store.allNotes);
    assert.equal(collectionOutput.size, 1);
    assert.deepEqual(note.actionHash, Array.from(collectionOutput.keys())[0]);
  });
});
