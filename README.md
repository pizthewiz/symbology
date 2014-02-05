
# symbology
Add context to a bare iOS crash log by mining symbols from the binary - for when `symbolicate` and a dSYM lets you down.

## USAGE
```sh
$ node symbology.js --log ~/Desktop/crashReport \
--binary ~/Library/Developer/Xcode/Archives/2014-01-21/Buggy-AppStore\ 1-21-14,\ 14.22.xcarchive/Products/Applications/Buggy.app/Buggy
```

#### NOTE
The architecture symbols are mined from is fixed at `armv7`, but that will be made more flexible at some point.
