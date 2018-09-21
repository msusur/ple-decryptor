const FileParser = require('./parser/file-parser'),
  filePath = './samples/sample2.ple';

const parser = new FileParser(filePath);
if (!parser.isFileHeaderValid()) {
  throw new Error('Invalid format');
}
const readFile$ = parser.startReading();
const onNext = (data, file) => {
  // debugger;
};

const subscription = readFile$.subscribe(
  onNext,
  err => {
    debugger;
  },
  (file) => {
    subscription.dispose();
  }
);

debugger;
