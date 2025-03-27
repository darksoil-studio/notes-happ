{ inputs, ... }:

{
  perSystem =
    { inputs'
    , self'
    , system
    , ...
    }: {
      packages.group_profile = inputs.tnesh-stack.outputs.builders.${system}.rustZome {
        workspacePath = inputs.self.outPath;
        crateCargoToml = ./Cargo.toml;
      };

    };
}

