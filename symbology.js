/*jshint node:true, strict:false */

var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var argv = require('optimist').argv;
var async = require('async');

function usage() {
  console.log('symbolicate an iOS crash log from a executable\n');
  console.log('Usage: symbology.js\n');

  console.log('--log [path]');
  console.log('--executable [path]');
  process.exit();
}

if (argv.usage || argv.help || !argv.log || !argv.executable) {
  usage();
}

function resolveSymbolForAddress(element, callback) {
  var command = "xcrun atos -arch armv7 -o '" + argv.executable + "' " + element.address;
  exec(command, function (err, stdout, stderr) {
    element.symbol = stdout.trim();
    callback(err, element);
  });
}

function processCrashLog(filePath) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      console.log('ERROR - failed to read crash log\n' + err);
      process.exit(1);
    }

    var lines = data.toString().split('\n');
    var queue = [];
    var app = path.basename(argv.executable);
    var threadFrameRegEx = new RegExp('^\\d+\\s+' + app + '\\s+(\\w+)\\s+(.*)');

    // find frames that need symbolicating
    lines.forEach(function (element, index) {
      if (!threadFrameRegEx.test(element)) {
        return;
      }

      var matches = threadFrameRegEx.exec(element);
      var address = matches[1];
      var fragment = matches[0].replace(matches[2], '');
      queue.push({lineIndex: index, address: address, fragment: fragment});
    });

    async.mapSeries(queue, resolveSymbolForAddress, function (err, results) {
      if (err) {
        console.log('ERROR - failed to resolve symbol\n' + err);
        process.exit(1);
      }

      // rewrite processed lines
      results.forEach(function (element) {
        lines[element.lineIndex] = element.fragment + element.symbol;
      });

      var outFile = path.join(path.dirname(argv.log), path.basename(argv.log) + '-symbolicated' + path.extname(argv.log));
      fs.writeFile(outFile, lines.join('\n'), function (err) {
        if (err) {
          console.log('ERROR - failed to write output file\n' + err);
          process.exit(1);
        }

        console.log('DONE');
      }); // fs.writeFile
    }); // async.mapSeries
  }); // fs.readFile
}



if (require.main === module) {
  async.every([argv.log, argv.executable], fs.exists, function (result) {
    if (!result) {
      console.log('ERROR - input file not found at given path');
      process.exit(1);
    }

    processCrashLog(argv.log);
  });
}
