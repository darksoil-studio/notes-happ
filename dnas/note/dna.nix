{ inputs, ... }:

{
  # Import all ./zomes/coordinator/*/zome.nix and ./zomes/integrity/*/zome.nix  
  # imports = (map (m: "${./.}/zomes/coordinator/${m}/zome.nix")
  #   (builtins.attrNames (builtins.readDir ./zomes/coordinator)))
  #   ++ (map (m: "${./.}/zomes/integrity/${m}/zome.nix")
  #     (builtins.attrNames (builtins.readDir ./zomes/integrity)));
  perSystem = { inputs', self', lib, system, ... }: {
    packages.note_dna =
      inputs.holochain-nix-builders.outputs.builders.${system}.dna {
        dnaManifest = ./workdir/dna.yaml;
        zomes = {
          # Include here the zome packages for this DNA, e.g.:
          # profiles_integrity = inputs'.profiles-zome.packages.profiles_integrity;
          # This overrides all the "bundled" properties for the DNA manifest
          notes_integrity = inputs'.notes-zome.packages.notes_integrity;
          notes = inputs'.notes-zome.packages.notes;
          collaborative_sessions =
            inputs'.collaborative-sessions-zome.packages.collaborative_sessions;
        };
      };
  };
}
