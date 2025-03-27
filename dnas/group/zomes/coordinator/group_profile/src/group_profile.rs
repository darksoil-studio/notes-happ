use group_profile_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_group_profile(group_profile: GroupProfile) -> ExternResult<Record> {
    let group_profile_hash = create_entry(&EntryTypes::GroupProfile(group_profile.clone()))?;
    let record = get(group_profile_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Could not find the newly created GroupProfile".to_string())
    ))?;
    let path = Path::from("group_profiles");
    create_link(
        path.path_entry_hash()?,
        group_profile_hash.clone(),
        LinkTypes::GroupProfiles,
        (),
    )?;
    Ok(record)
}

#[hdk_extern]
pub fn get_latest_group_profile(
    original_group_profile_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(
            original_group_profile_hash.clone(),
            LinkTypes::GroupProfileUpdates,
        )?
        .build(),
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_group_profile_hash = match latest_link {
        Some(link) => {
            link.target
                .clone()
                .into_action_hash()
                .ok_or(wasm_error!(WasmErrorInner::Guest(
                    "No action hash associated with link".to_string()
                )))?
        }
        None => original_group_profile_hash.clone(),
    };
    get(latest_group_profile_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_original_group_profile(
    original_group_profile_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(original_group_profile_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Record(details) => Ok(Some(details.record)),
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed get details response".to_string()
        ))),
    }
}

#[hdk_extern]
pub fn get_all_revisions_for_group_profile(
    original_group_profile_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let Some(original_record) = get_original_group_profile(original_group_profile_hash.clone())?
    else {
        return Ok(vec![]);
    };
    let links = get_links(
        GetLinksInputBuilder::try_new(
            original_group_profile_hash.clone(),
            LinkTypes::GroupProfileUpdates,
        )?
        .build(),
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| {
            Ok(GetInput::new(
                link.target
                    .into_action_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "No action hash associated with link".to_string()
                    )))?
                    .into(),
                GetOptions::default(),
            ))
        })
        .collect::<ExternResult<Vec<GetInput>>>()?;
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let mut records: Vec<Record> = records.into_iter().flatten().collect();
    records.insert(0, original_record);
    Ok(records)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateGroupProfileInput {
    pub original_group_profile_hash: ActionHash,
    pub previous_group_profile_hash: ActionHash,
    pub updated_group_profile: GroupProfile,
}

#[hdk_extern]
pub fn update_group_profile(input: UpdateGroupProfileInput) -> ExternResult<Record> {
    let updated_group_profile_hash = update_entry(
        input.previous_group_profile_hash.clone(),
        &input.updated_group_profile,
    )?;
    create_link(
        input.original_group_profile_hash.clone(),
        updated_group_profile_hash.clone(),
        LinkTypes::GroupProfileUpdates,
        (),
    )?;
    let record =
        get(updated_group_profile_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
            WasmErrorInner::Guest("Could not find the newly updated GroupProfile".to_string())
        ))?;
    Ok(record)
}

#[hdk_extern]
pub fn delete_group_profile(original_group_profile_hash: ActionHash) -> ExternResult<ActionHash> {
    let path = Path::from("group_profiles");
    let links = get_links(
        GetLinksInputBuilder::try_new(path.path_entry_hash()?, LinkTypes::GroupProfiles)?.build(),
    )?;
    for link in links {
        if let Some(hash) = link.target.into_action_hash() {
            if hash == original_group_profile_hash {
                delete_link(link.create_link_hash)?;
            }
        }
    }
    delete_entry(original_group_profile_hash)
}

#[hdk_extern]
pub fn get_all_deletes_for_group_profile(
    original_group_profile_hash: ActionHash,
) -> ExternResult<Option<Vec<SignedActionHashed>>> {
    let Some(details) = get_details(original_group_profile_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(record_details) => Ok(Some(record_details.deletes)),
    }
}

#[hdk_extern]
pub fn get_oldest_delete_for_group_profile(
    original_group_profile_hash: ActionHash,
) -> ExternResult<Option<SignedActionHashed>> {
    let Some(mut deletes) = get_all_deletes_for_group_profile(original_group_profile_hash)? else {
        return Ok(None);
    };
    deletes.sort_by(|delete_a, delete_b| {
        delete_a
            .action()
            .timestamp()
            .cmp(&delete_b.action().timestamp())
    });
    Ok(deletes.first().cloned())
}
