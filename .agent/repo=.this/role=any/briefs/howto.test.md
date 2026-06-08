# lint

how to lint

```
npm run test:lint
```


# unit

how to unit test

```
export THOROUGH=true && npm run test:unit
```


# integration

how to integration test

```sh
eval $(rhx keyrack source --owner ehmpath --env test) && export THOROUGH=true && npm run test:integration
```
