/*
0x29 0x84 0x98 0x127 0x127 0x183 0x220 0x84 0x202 0x224 0x102 0x50 0x20
00011101 01010100 01100010 01111111 01111111 10110111 11011100 01010100 11001010 11100000 01100110 00110010 00010100
*/
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

const getInteger = bytes => {
  let value = 0;
  for (let i = bytes.length - 1; i >= 0; i--) {
    value = value * 256 + bytes[i];
  }
  return value;
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
      passwordCheckBytes: setPointerAndSlice(buffer, 13),
      headerLength: pointer
    });
  }

  unscramblePassword() {
    const passwordBytes = this.fileFormat.header.passwordCheckBytes;
    const newPasswordBytes = [];
    const count = passwordBytes.length;
    for (let idx = 0; idx < count - 1; idx += 1) {
      newPasswordBytes[idx] = passwordBytes[idx] + passwordBytes[idx + 1];
    }
    newPasswordBytes[count - 1] = passwordBytes[count - 1] + passwordBytes[0];
    let buffer = new Buffer(newPasswordBytes);
    return buffer;
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
      let lastOffset = 0;
      while (offset < buffer.length) {
        const chunkResult = this.parseCurrentChunk(buffer, offset);
        if (lastOffset === chunkResult.offset) {
          break;
        }
        lastOffset = offset = chunkResult.offset;
        this.fileFormat.chunks.push(chunkResult);
        observer.next({ chunk: chunkResult, file: this.fileFormat });
      }
      if (buffer.length - offset > 0) {
        observer.next({
          chunk: this.parseCurrentChunk(buffer, offset),
          file: this.fileFormat
        });
      }
      observer.complete(this.fileFormat);
    });
  }

  parseCurrentChunk(buffer, offset) {
    const startingByte =
      seekBytes(CHUNK_SIGNATURE, buffer.slice(offset)) + offset;
    const newChunkBody = buffer.slice(startingByte);
    const signature = newChunkBody.slice(0, 4);

    const endingByte = seekBytes(CHUNK_SIGNATURE, newChunkBody.slice(4));
    const dataLength = getInteger(newChunkBody.slice(4).slice(0, 4));
    const encryptedText = newChunkBody.slice(4, endingByte);
    // if (encryptedText.length !== dataLength) {
    //   throw new Error('Checksum error on validating the chunk size.');
    // }
    return {
      signature,
      dataLength,
      encryptedText,
      offset: endingByte + startingByte
    };
  }
}

module.exports = FileParser;
