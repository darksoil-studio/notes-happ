use group_profile_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_group_profiles() -> ExternResult<Vec<Link>> {
    let path = Path::from("group_profiles");
    get_links(
        GetLinksInputBuilder::try_new(path.path_entry_hash()?, LinkTypes::GroupProfiles)?.build(),
    )
}
