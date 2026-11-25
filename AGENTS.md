<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public catalog policies expose active records only; admin policies separately retain access to inactive drafts so unpublished content stays private.
- Guest order lookup and cart-lead writes use narrowly scoped database functions keyed by verified order credentials or unguessable session IDs, preventing broad anonymous table access while preserving guest flows.
