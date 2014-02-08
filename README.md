
# symbology
Add context to a bare or mis-symbolicated iOS crash log, when `symbolicate` lets you down. Through scripting `atos`, `symbology` attempts to parse the crash log and resolve thread frame addresses belonging to executable, into function names.

## USAGE
```sh
$ node symbology.js --log ~/Desktop/Buggy.crash \
--executable ~/Library/Developer/Xcode/Archives/2014-01-21/Buggy-AppStore\ 1-21-14,\ 14.22.xcarchive/Products/Applications/Buggy.app/Buggy
```

#### NOTE
Symbols are mined from a *fixed* architecture, `armv7`, but that will be made more flexible soon.
