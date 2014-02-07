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

var lines = [];
var processedLines = [];
var app = null;
var re = /^(\d+)\s+(\w+)\s+(\w+)\s+(.*)/;

function lookupSymbol(address, callback) {
  var command = "DEVELOPER_DIR='/Applications/Xcode.app/Contents/Developer' /usr/bin/atos -d -arch armv7 -o '" + argv.executable + "' " + address;
  exec(command, function (err, stdout, stderr) {
    callback(err, stdout);
  });
}

function processLines() {
  var line = lines.shift();
  if (line === undefined) {
    console.log('DONE');
    var outFile = path.join(path.dirname(argv.log), path.basename(argv.log) + '-symbolized' + path.extname(argv.log));
    fs.writeFileSync(outFile, processedLines.join('\n'));
    return;
  }

  if (!app && line.indexOf('Path:') != -1) {
    app = line.split('/').pop();
  }

  var matches = re.exec(line);
  if (matches && matches[2] === app) {
    lookupSymbol(matches[3], function (err, stdout) {
      if (err) {
        console.log('ERROR - ' + err);
      }

      line = line.replace(matches[4], stdout.trim());
      processedLines.push(line);
      processLines();
    });
  } else {
    processedLines.push(line);
    processLines();
  }
}

function processCrashLog(file) {
  fs.readFile(file, function (err, data) {
    if (err) {
      console.log('ERROR - failed to read file - ' + err);
      process.exit(1);
    }

    // TODO - validation?

    lines = data.toString().split('\n');
    processLines();
  });
}



if (require.main === module) {
  // validate existance of input files
  async.every([argv.log, argv.executable], fs.exists, function (result) {
    if (!result) {
      console.log('ERROR - input file not found at given path');
      process.exit(1);
    }

    processCrashLog(argv.log);
  });
}
