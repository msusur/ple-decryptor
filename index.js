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

console.log(
  `Scrambled password ${parser.fileFormat.header.passwordCheckBytes.toString(
    'utf8'
  )}`
);
const password = parser.unscramblePassword();
console.log(`Scrambled password ${password.toString('utf8')}`);

readFile$.subscribe(
  onNext,
  err => {
    debugger;
  },
  file => {
    console.log('=====DONE.');
  }
);
