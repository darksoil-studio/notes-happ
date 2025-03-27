{ inputs, ... }:

{
  perSystem =
    { inputs'
    , self'
    , system
    , ...
    }: {
      packages.notes = inputs.tnesh-stack.outputs.builders.${system}.rustZome {
        workspacePath = inputs.self.outPath;
        crateCargoToml = ./Cargo.toml;
      };

    };
}

