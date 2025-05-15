{ inputs, ... }:

{
  # Import all ./zomes/coordinator/*/zome.nix and ./zomes/integrity/*/zome.nix  
  # imports = (map (m: "${./.}/zomes/coordinator/${m}/zome.nix")
  #   (builtins.attrNames (builtins.readDir ./zomes/coordinator)))
  #   ++ (map (m: "${./.}/zomes/integrity/${m}/zome.nix")
  #     (builtins.attrNames (builtins.readDir ./zomes/integrity)));
  perSystem = { inputs', self', lib, system, ... }: {
    packages.main_dna =
      inputs.holochain-nix-builders.outputs.builders.${system}.dna {
        dnaManifest = ./workdir/dna.yaml;
        zomes = {
          notes_integrity = inputs'.notes-zome.packages.notes_integrity;
          notes = inputs'.notes-zome.packages.notes;
          collaborative_sessions =
            inputs'.collaborative-sessions-zome.packages.collaborative_sessions_coordinator;
          linked_devices_integrity =
            inputs'.linked-devices-zome.packages.linked_devices_integrity;
          linked_devices = inputs'.linked-devices-zome.packages.linked_devices;
          friends_integrity = inputs'.friends-zome.packages.friends_integrity;
          friends = inputs'.friends-zome.packages.friends;
        };
      };
  };
}
