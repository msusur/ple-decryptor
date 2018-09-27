const FileParser = require('./parser/file-parser'),
  filePath = './samples/sample1.ple';

const parser = new FileParser(filePath);
if (!parser.isFileHeaderValid()) {
  throw new Error('Invalid format');
}
const readFile$ = parser.startReading();
let chunkCount = 0;
const onNext = data => {
  console.log(
    `Chunk number is ${chunkCount++} with the size '${
      data.chunk.dataLength
    }' bytes.`
  );
};

const password = parser.unscramblePassword();
const unicodePassword = password.toString('utf8');
const subscription = readFile$.subscribe(
  onNext,
  err => {
    debugger;
  },
  file => {
    console.log('=====DONE.');
  }
);