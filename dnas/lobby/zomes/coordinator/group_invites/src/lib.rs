use std::collections::BTreeMap;

use hdk::prelude::*;
use private_event_sourcing::*;

#[private_event]
pub enum GroupInvitesEvent {
    CreateGroup {
        network_seed: String,
        members: BTreeSet<AgentPubKey>,
    },
    GroupInvite {
        network_seed: String,
        members: BTreeSet<AgentPubKey>,
    },
    LeaveGroup {
        network_seed: String,
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
            GroupInvitesEvent::CreateGroup { members, .. } => Ok(members.clone()),
            GroupInvitesEvent::GroupInvite { members, .. } => Ok(members.clone()),
            GroupInvitesEvent::LeaveGroup { .. } => Ok(BTreeSet::new()),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateGroupInput {
    members: BTreeSet<AgentPubKey>,
    network_seed: String,
}

#[hdk_extern]
pub fn create_group(input: CreateGroupInput) -> ExternResult<()> {
    create_private_event(GroupInvitesEvent::CreateGroup {
        network_seed: input.network_seed,
        members: input.members,
    })?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InviteAgentsToGroupInput {
    members: BTreeSet<AgentPubKey>,
    network_seed: String,
}

#[hdk_extern]
pub fn invite_agents_to_group(input: InviteAgentsToGroupInput) -> ExternResult<()> {
    create_private_event(GroupInvitesEvent::GroupInvite {
        network_seed: input.network_seed,
        members: input.members,
    })?;
    Ok(())
}

#[hdk_extern]
pub fn leave_group(group_network_seed: String) -> ExternResult<()> {
    create_private_event(GroupInvitesEvent::LeaveGroup {
        network_seed: group_network_seed,
    })?;
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
