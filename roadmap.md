# Security fix roadmap

- [x] Review the selected findings and every affected catalog, order, and lead access path.
- [x] Enable order row protection and restrict public catalog reads to active records.
- [x] Replace broad cart-lead writes and guest order reads with validated, narrowly scoped database functions.
- [x] Verify public storefront routes, order lookup, build, and updated finding statuses.