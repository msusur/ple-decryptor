class FileFormat {
  constructor(buffer, header) {
    this.buffer = buffer;
    this.header = header ? header : new Header({});
    this.chunks = [];
  }
}

class Header {
  constructor({
    fileHeader,
    unknownHeaderBytes,
    passwordLength,
    passwordCheckString,
    headerLength
  }) {
    this.fileHeader = fileHeader;
    this.unknownHeaderBytes = unknownHeaderBytes;
    this.passwordLength = passwordLength;
    this.passwordCheckString = passwordCheckString;
    this.headerLength = headerLength;
  }
}

module.exports = { FileFormat, Header };
