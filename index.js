const FileParser = require('./parser/file-parser'),
  filePath = './samples/sample2.ple';

const parser = new FileParser(filePath);
if (!parser.isFileHeaderValid()) {
  throw new Error('Invalid format');
}

const readFile$ = parser.startReading();
let chunkCount = 1;
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
console.log(
  `Scrambled password in bytes:
  [ '0x${parser.fileFormat.header.passwordCheckBytes.join(' 0x')}' ]`
);
const password = parser.unscramblePassword();
console.log(`Unscrambled password ${password.toString('utf8')}`);
console.log(`Unscrambled password in bytes:
  [ '0x${password.join(' 0x')}' ]`);

readFile$.subscribe(
  onNext,
  err => {
    debugger;
  },
  file => {
    console.log('=====DONE.');
  }
);
