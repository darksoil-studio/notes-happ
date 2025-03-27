use std::collections::BTreeMap;

use hdk::prelude::*;
use private_event_sourcing::*;

#[private_event]
pub enum GroupInvitesEvent {
    GroupInvite {
        network_seed: String,
        agents: BTreeSet<AgentPubKey>,
    },
    AcceptedGroupInvite {
        group_invite_hash: EntryHash,
    },
    RejectedGroupInvite {
        group_invite_hash: EntryHash,
    },
}

impl PrivateEvent for GroupInvitesEvent {
    fn validate(
        &self,
        event_hash: EntryHash,
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
        match self {
            GroupInvitesEvent::GroupInvite { agents, .. } => Ok(agents.clone()),
            Self::AcceptedGroupInvite { group_invite_hash }
            | Self::RejectedGroupInvite { group_invite_hash } => {
                let Some(group_invite_event) =
                    query_private_event::<GroupInvitesEvent>(group_invite_hash.clone())?
                else {
                    return Err(wasm_error!("Failed to find group invite."));
                };

                Ok(vec![group_invite_event.author].into_iter().collect())
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InviteAgentsToGroupInput {
    agents: BTreeSet<AgentPubKey>,
    network_seed: String,
}

#[hdk_extern]
pub fn invite_agents_to_group(input: InviteAgentsToGroupInput) -> ExternResult<()> {
    create_private_event(GroupInvitesEvent::GroupInvite {
        network_seed: input.network_seed,
        agents: input.agents,
    })?;
    Ok(())
}

#[hdk_extern]
pub fn accept_group_invite(group_invite_hash: EntryHash) -> ExternResult<()> {
    create_private_event(GroupInvitesEvent::AcceptedGroupInvite { group_invite_hash })?;
    Ok(())
}

pub fn query_group_invites_events(
) -> ExternResult<BTreeMap<EntryHashB64, SignedEvent<GroupInvitesEvent>>> {
    query_private_events()
}

#[hdk_extern]
pub fn recv_remote_signal(signal_bytes: SerializedBytes) -> ExternResult<()> {
    if let Ok(private_event_sourcing_remote_signal) =
        PrivateEventSourcingRemoteSignal::try_from(signal_bytes)
    {
        recv_private_events_remote_signal::<GroupInvitesEvent>(private_event_sourcing_remote_signal)
    } else {
        Ok(())
    }
}
