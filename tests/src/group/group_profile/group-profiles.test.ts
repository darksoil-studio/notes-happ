import { assert, test } from "vitest";

import { ActionHash, EntryHash, Record } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";
import { toPromise } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";

import { sampleGroupProfile } from "../../../../ui/src/group/group_profile/mocks.js";
import { GroupProfile } from "../../../../ui/src/group/group_profile/types.js";
import { setup } from "./setup.js";

test("create a GroupProfile and get group profiles", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Bob gets group profiles
    let collectionOutput = await toPromise(bob.store.groupProfiles);
    assert.equal(collectionOutput.size, 0);

    // Alice creates a GroupProfile
    const groupProfile: EntryRecord<GroupProfile> = await alice.store.client.createGroupProfile(
      await sampleGroupProfile(alice.store.client),
    );
    assert.ok(groupProfile);

    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets group profiles again
    collectionOutput = await toPromise(bob.store.groupProfiles);
    assert.equal(collectionOutput.size, 1);
    assert.deepEqual(groupProfile.actionHash, Array.from(collectionOutput.keys())[0]);
  });
});
