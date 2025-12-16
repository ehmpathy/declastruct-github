
## usage

### plan

```bash
npx declastruct plan \
  --wish provision/github.org/resources.ts \
  --into ./provision/github.org/.temp/plan.json
```

### apply

```bash
npx declastruct apply \
  --plan ./provision/github.org/.temp/plan.json
```
