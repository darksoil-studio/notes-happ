import { assert, test } from "vitest";

import { ActionHash, Delete, Record, SignedActionHashed } from "@holochain/client";
import { dhtSync, pause, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";
import { toPromise } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { cleanNodeDecoding } from "@darksoil-studio/holochain-utils/dist/clean-node-decoding.js";

import { sampleGroupProfile } from "../../../../ui/src/group/group_profile/mocks.js";
import { GroupProfile } from "../../../../ui/src/group/group_profile/types.js";
import { setup } from "./setup.js";

test("create GroupProfile", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a GroupProfile
    const groupProfile: EntryRecord<GroupProfile> = await alice.store.client.createGroupProfile(
      await sampleGroupProfile(alice.store.client),
    );
    assert.ok(groupProfile);
  });
});

test("create and read GroupProfile", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    const sample = await sampleGroupProfile(alice.store.client);

    // Alice creates a GroupProfile
    const groupProfile: EntryRecord<GroupProfile> = await alice.store.client.createGroupProfile(sample);
    assert.ok(groupProfile);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the created GroupProfile
    const createReadOutput: EntryRecord<GroupProfile> = await toPromise(
      bob.store.groupProfiles.get(groupProfile.actionHash).original,
    );
    assert.deepEqual(sample, cleanNodeDecoding(createReadOutput.entry));
  });
});

test("create and update GroupProfile", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a GroupProfile
    const groupProfile: EntryRecord<GroupProfile> = await alice.store.client.createGroupProfile(
      await sampleGroupProfile(alice.store.client),
    );
    assert.ok(groupProfile);

    const originalActionHash = groupProfile.actionHash;

    // Alice updates the GroupProfile
    let contentUpdate = await sampleGroupProfile(alice.store.client);

    let updatedGroupProfile: EntryRecord<GroupProfile> = await alice.store.client.updateGroupProfile(
      originalActionHash,
      originalActionHash,
      contentUpdate,
    );
    assert.ok(updatedGroupProfile);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated GroupProfile
    const readUpdatedOutput0: EntryRecord<GroupProfile> = await toPromise(
      bob.store.groupProfiles.get(groupProfile.actionHash).latestVersion,
    );
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput0.entry));

    // Alice updates the GroupProfile again
    contentUpdate = await sampleGroupProfile(alice.store.client);

    updatedGroupProfile = await alice.store.client.updateGroupProfile(
      originalActionHash,
      updatedGroupProfile.actionHash,
      contentUpdate,
    );
    assert.ok(updatedGroupProfile);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated GroupProfile
    const readUpdatedOutput1: EntryRecord<GroupProfile> = await toPromise(
      bob.store.groupProfiles.get(originalActionHash).latestVersion,
    );
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput1.entry));
  });
});

test("create and delete GroupProfile", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a GroupProfile
    const groupProfile: EntryRecord<GroupProfile> = await alice.store.client.createGroupProfile(
      await sampleGroupProfile(alice.store.client),
    );
    assert.ok(groupProfile);

    // Alice deletes the GroupProfile
    const deleteActionHash = await alice.store.client.deleteGroupProfile(groupProfile.actionHash);
    assert.ok(deleteActionHash);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob tries to get the deleted GroupProfile
    const deletes: Array<SignedActionHashed<Delete>> = await toPromise(
      bob.store.groupProfiles.get(groupProfile.actionHash).deletes,
    );
    assert.equal(deletes.length, 1);
  });
});
