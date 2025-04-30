{ inputs, ... }:

{
  # Import all ./zomes/coordinator/*/zome.nix and ./zomes/integrity/*/zome.nix  
  imports = (map (m: "${./.}/zomes/coordinator/${m}/zome.nix")
    (builtins.attrNames (builtins.readDir ./zomes/coordinator)))
    ++ (map (m: "${./.}/zomes/integrity/${m}/zome.nix")
      (builtins.attrNames (builtins.readDir ./zomes/integrity)));
  perSystem = { inputs', self', lib, system, ... }: {
    packages.lobby_dna =
      inputs.holochain-nix-builders.outputs.builders.${system}.dna {
        dnaManifest = ./workdir/dna.yaml;
        zomes = {
          linked_devices_integrity = inputs'.linked-devices-zome.packages.linked_devices_integrity;
          linked_devices = inputs'.linked-devices-zome.packages.linked_devices;
          friends_integrity = inputs'.friends-zome.packages.friends_integrity;
          friends = inputs'.friends-zome.packages.friends;
          # Include here the zome packages for this DNA, e.g.:
          # profiles_integrity = inputs'.profiles-zome.packages.profiles_integrity;
          # This overrides all the "bundled" properties for the DNA manifest
          group_invites_integrity = self'.packages.group_invites_integrity;
          group_invites = self'.packages.group_invites;
        };
      };
  };
}
