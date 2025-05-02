use hdk::prelude::*;
use notes_integrity::*;
use std::collections::BTreeMap;

use private_event_sourcing::*;

#[private_event]
pub enum NotesEvent {
    CreateNote {
        title: String,
        content: String,
    },
    UpdateNote {
        create_note_hash: EntryHashB64,
        title: String,
        content: String,
    },
    ArchiveNote {
        create_note_hash: EntryHashB64,
    },
    UnarchiveNote {
        create_note_hash: EntryHashB64,
    },
    ShareNote {
        create_note_hash: EntryHashB64,
        agents: BTreeSet<AgentPubKey>,
    },
    RemoveAgents {
        create_note_hash: EntryHashB64,
        agents: BTreeSet<AgentPubKey>,
    },
}

impl PrivateEvent for NotesEvent {
    fn validate(
        &self,
        _event_hash: EntryHash,
        _author: AgentPubKey,
        _timestamp: Timestamp,
    ) -> ExternResult<ValidateCallbackResult> {
        Ok(ValidateCallbackResult::Valid)
    }

    fn recipients(
        &self,
        event_hash: EntryHash,
        _author: AgentPubKey,
        _timestamp: Timestamp,
    ) -> ExternResult<BTreeSet<AgentPubKey>> {
        let create_note_hash = create_note_hash(&EntryHashB64::from(event_hash), self);
        query_collaborators(create_note_hash)
    }
}

fn query_collaborators(create_note_hash: EntryHash) -> ExternResult<BTreeSet<AgentPubKey>> {
    let Some(original_create_note) = query_private_event::<NotesEvent>(create_note_hash.clone())?
    else {
        return Err(wasm_error!("Create note not found"));
    };
    let events = query_events_for_note(create_note_hash)?;

    let mut all_agents: BTreeSet<AgentPubKey> = BTreeSet::new();
    all_agents.insert(original_create_note.author);

    let mut sorted_events: Vec<(EntryHashB64, SignedEvent<NotesEvent>)> =
        events.into_iter().collect();
    sorted_events.sort_by_key(|(_, event)| event.event.timestamp);

    for (_event_hash, event) in sorted_events {
        match event.event.content {
            NotesEvent::ShareNote { mut agents, .. } => all_agents.append(&mut agents),
            NotesEvent::RemoveAgents { agents, .. } => {
                for agent in agents {
                    all_agents.remove(&agent);
                }
            }
            _ => {}
        }
    }

    Ok(all_agents)
}

fn query_events_for_note(
    queried_create_note_hash: EntryHash,
) -> ExternResult<BTreeMap<EntryHashB64, SignedEvent<NotesEvent>>> {
    let events = query_notes_events()?;

    let mut result: BTreeMap<EntryHashB64, SignedEvent<NotesEvent>> = BTreeMap::new();

    for (event_hash, event) in events {
        let for_this_note =
            create_note_hash(&event_hash, &event.event.content).eq(&queried_create_note_hash);
        if for_this_note {
            result.insert(event_hash.clone(), event);
        }
    }

    Ok(result)
}

fn create_note_hash(event_hash: &EntryHashB64, event: &NotesEvent) -> EntryHash {
    match &event {
        NotesEvent::CreateNote { .. } => EntryHash::from(event_hash.clone()),
        NotesEvent::UpdateNote {
            create_note_hash, ..
        }
        | NotesEvent::ArchiveNote { create_note_hash }
        | NotesEvent::UnarchiveNote { create_note_hash }
        | NotesEvent::ShareNote {
            create_note_hash, ..
        }
        | NotesEvent::RemoveAgents {
            create_note_hash, ..
        } => EntryHash::from(create_note_hash.clone()),
    }
}

pub fn query_notes_events() -> ExternResult<BTreeMap<EntryHashB64, SignedEvent<NotesEvent>>> {
    query_private_events()
}

#[hdk_extern]
pub fn recv_remote_signal(signal_bytes: SerializedBytes) -> ExternResult<()> {
    if let Ok(private_event_sourcing_remote_signal) =
        PrivateEventSourcingRemoteSignal::try_from(signal_bytes)
    {
        recv_private_events_remote_signal::<NotesEvent>(private_event_sourcing_remote_signal)
    } else {
        Ok(())
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateNoteInput {
    pub title: String,
    pub content: String,
}

#[hdk_extern]
pub fn create_note(input: CreateNoteInput) -> ExternResult<EntryHash> {
    create_private_event(NotesEvent::CreateNote {
        title: input.title,
        content: input.content,
    })
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateNoteInput {
    pub create_note_hash: EntryHashB64,
    pub title: String,
    pub content: String,
}

#[hdk_extern]
pub fn update_note(input: UpdateNoteInput) -> ExternResult<EntryHash> {
    create_private_event(NotesEvent::UpdateNote {
        create_note_hash: input.create_note_hash,
        title: input.title,
        content: input.content,
    })
}
