const FileParser = require('./parser/file-parser'),
  filePath = './samples/sample1.ple';

const parser = new FileParser(filePath);
if (!parser.isFileHeaderValid()) {
  throw new Error('Invalid format');
}
const readFile$ = parser.startReading();
const onNext = data => {
  // console.log(data.file);
  debugger;
};

const password = parser.unscramblePassword();

const subscription = readFile$.subscribe(
  onNext,
  err => {
    debugger;
  },
  file => {
    subscription.dispose();
  }
);

debugger;
