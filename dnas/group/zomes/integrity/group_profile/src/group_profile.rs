use hdi::prelude::*;

#[derive(Clone, PartialEq)]
#[hdk_entry_helper]
pub struct GroupProfile {
    pub name: String,
    pub avatar_hash: EntryHash,
}

pub fn validate_create_group_profile(
    _action: EntryCreationAction,
    _group_profile: GroupProfile,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_update_group_profile(
    _action: Update,
    _group_profile: GroupProfile,
    _original_action: EntryCreationAction,
    _original_group_profile: GroupProfile,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_group_profile(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_group_profile: GroupProfile,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_create_link_group_profile_updates(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = base_address
        .into_action_hash()
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "No action hash associated with link".to_string()
        )))?;
    let record = must_get_valid_record(action_hash)?;
    let _group_profile: crate::GroupProfile = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "Linked action must reference an entry".to_string()
        )))?;
    let action_hash =
        target_address
            .into_action_hash()
            .ok_or(wasm_error!(WasmErrorInner::Guest(
                "No action hash associated with link".to_string()
            )))?;
    let record = must_get_valid_record(action_hash)?;
    let _group_profile: crate::GroupProfile = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "Linked action must reference an entry".to_string()
        )))?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_group_profile_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(
        "GroupProfileUpdates links cannot be deleted".to_string(),
    ))
}

pub fn validate_create_link_group_profiles(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash =
        target_address
            .into_action_hash()
            .ok_or(wasm_error!(WasmErrorInner::Guest(
                "No action hash associated with link".to_string()
            )))?;
    let record = must_get_valid_record(action_hash)?;
    let _group_profile: crate::GroupProfile = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "Linked action must reference an entry".to_string()
        )))?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_group_profiles(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
