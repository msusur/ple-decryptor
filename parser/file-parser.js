const fs = require('fs'),
  { FileFormat, Header } = require('./file-format'),
  { Observable } = require('rxjs'),
  UNKNOWN_SIGNATURE = [1, 0, 0, 0],
  CHUNK_SIGNATURE = [0xe9, 0xff, 0xa3, 0x00];

let pointer = 0;

const setPointerAndSlice = (data, length) => {
  data = data.slice(pointer, pointer + length);
  pointer += length;
  return data;
};

const testArrays = (source, target) => {
  if (source.length !== target.length) {
    return false;
  }
  for (let idx = 0; idx < source.length; idx += 1) {
    if (source[idx] !== target[idx]) {
      return false;
    }
  }
  return true;
};

const seekBytes = (needle, haystack) => {
  let startingIndex = -1;
  for (let idx = 0; idx < haystack.length; idx += 1) {
    if (haystack[idx] === needle[0]) {
      startingIndex = idx;
      const subset = haystack.slice(idx).slice(1, needle.length);
      const subsetResult = seekBytes(needle.slice(1), subset);
      if (subsetResult > -1) {
        return idx;
      }
    }
  }
  return startingIndex;
};

class FileParser {
  constructor(filePath) {
    const buffer = fs.readFileSync(filePath);

    this.fileFormat = new FileFormat(buffer);
    this.fileFormat.stats = fs.statSync(filePath);

    this.fileFormat.header = new Header({
      fileHeader: setPointerAndSlice(buffer, 10).toString('utf8'),
      unknownHeaderBytes: setPointerAndSlice(buffer, 4),
      passwordLength: setPointerAndSlice(buffer, 4),
      passwordCheckString: setPointerAndSlice(buffer, 13).toString('utf8'),
      headerLength: pointer
    });
  }

  isFileHeaderValid() {
    return (
      this.fileFormat.header.fileHeader.trim().indexOf('MPLE1<<') == 2 &&
      testArrays(this.fileFormat.header.unknownHeaderBytes, UNKNOWN_SIGNATURE)
    );
  }

  startReading() {
    return Observable.create(observer => {
      let offset = this.fileFormat.header.headerLength;
      const buffer = this.fileFormat.buffer;
      while (offset < buffer.length) {
        const chunkResult = this.parseCurrentChunk(buffer, offset);
        offset = chunkResult.offset;
        this.fileFormat.chunks.push(chunkResult);
        observer.next({ chunk: chunkResult, file: this.fileFormat });
      }
      observer.complete(this.fileFormat);
    });
  }

  parseCurrentChunk(buffer) {
    const startingByte = seekBytes(CHUNK_SIGNATURE, buffer);
    const newChunkBody = buffer.slice(startingByte);
    const signature = newChunkBody.slice(0, 4);

    const endingByte = seekBytes(CHUNK_SIGNATURE, newChunkBody.slice(4));
    const data = newChunkBody.slice(4).slice(0, 4);
    const encryptedText = newChunkBody.slice(8);
    return {
      signature,
      data,
      encryptedText,
      offset: endingByte + startingByte
    };
  }
}

module.exports = FileParser;
