const x = await import(process.argv[2]); const ir = x.build();
console.log(JSON.stringify({ unresolved: ir.unresolved_sinks, xray_unresolved: ir.organs["xray.mjs"].unresolved, organs: ir.organs_parsed, files: ir.files.length }));
