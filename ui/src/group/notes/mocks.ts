import { Note } from "./types.js";

import {
  ActionHash,
  AgentPubKey,
  AppClient,
  decodeHashFromBase64,
  Delete,
  EntryHash,
  fakeActionHash,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeEntryHash,
  Link,
  NewEntryAction,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import {
  AgentPubKeyMap,
  decodeEntry,
  entryState,
  fakeCreateAction,
  fakeDeleteEntry,
  fakeEntry,
  fakeRecord,
  fakeUpdateEntry,
  hash,
  HashType,
  HoloHashMap,
  pickBy,
  ZomeMock,
} from "@tnesh-stack/utils";
import { NotesClient } from "./notes-client.js";

export class NotesZomeMock extends ZomeMock implements AppClient {
  constructor(
    myPubKey?: AgentPubKey,
  ) {
    super("notes_test", "notes", "test-app", myPubKey);
  }
  /** Note */
  notes = new HoloHashMap<ActionHash, {
    deletes: Array<SignedActionHashed<Delete>>;
    revisions: Array<Record>;
  }>();

  async create_note(note: Note): Promise<Record> {
    const entryHash = hash(note, HashType.ENTRY);
    const record = await fakeRecord(await fakeCreateAction(entryHash), fakeEntry(note));

    this.notes.set(record.signed_action.hashed.hash, {
      deletes: [],
      revisions: [record],
    });

    return record;
  }

  async get_latest_note(noteHash: ActionHash): Promise<Record | undefined> {
    const note = this.notes.get(noteHash);
    return note ? note.revisions[note.revisions.length - 1] : undefined;
  }

  async get_all_revisions_for_note(noteHash: ActionHash): Promise<Record[] | undefined> {
    const note = this.notes.get(noteHash);
    return note ? note.revisions : undefined;
  }

  async get_original_note(noteHash: ActionHash): Promise<Record | undefined> {
    const note = this.notes.get(noteHash);
    return note ? note.revisions[0] : undefined;
  }

  async get_all_deletes_for_note(noteHash: ActionHash): Promise<Array<SignedActionHashed<Delete>> | undefined> {
    const note = this.notes.get(noteHash);
    return note ? note.deletes : undefined;
  }

  async get_oldest_delete_for_note(noteHash: ActionHash): Promise<SignedActionHashed<Delete> | undefined> {
    const note = this.notes.get(noteHash);
    return note ? note.deletes[0] : undefined;
  }
  async delete_note(original_note_hash: ActionHash): Promise<ActionHash> {
    const record = await fakeRecord(await fakeDeleteEntry(original_note_hash));

    this.notes.get(original_note_hash).deletes.push(record.signed_action as SignedActionHashed<Delete>);

    return record.signed_action.hashed.hash;
  }

  async update_note(
    input: { original_note_hash: ActionHash; previous_note_hash: ActionHash; updated_note: Note },
  ): Promise<Record> {
    const record = await fakeRecord(
      await fakeUpdateEntry(input.previous_note_hash, undefined, undefined, fakeEntry(input.updated_note)),
      fakeEntry(input.updated_note),
    );

    this.notes.get(input.original_note_hash).revisions.push(record);

    const note = input.updated_note;

    return record;
  }
}

export async function sampleNote(client: NotesClient, partialNote: Partial<Note> = {}): Promise<Note> {
  return {
    ...{
      title: "Lorem ipsum 2",
      content: "Lorem ipsum 2",
      image_hash: (await fakeEntryHash()),
    },
    ...partialNote,
  };
}
