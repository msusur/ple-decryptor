### An attempt to map and decrypt the MPL1 file format

I've found some very old chat logs from ages ago in my old hard drive. This is my attempt to parse the file and find the encrypted password to brute force it.

MPL is a log file format that was introduced by Messenger Plus Live! extension years ago. According to my research and reverse engineering attempts I think I've understand the file format.

Here's the mapping I've came up with;

### File header
| Size(bytes) 	| Description                                                                  	|
|-------------	|------------------------------------------------------------------------------	|
| 10          	| File format header, MPLE1<<                                                 	|
| 4           	| I don't know what that is but repeated constantly on all files. [1, 0, 0, 0] 	|
| 4           	| Determines the password length. All of the files had the value 13.           	|
| 13          	| Scrambled password.                                                          	|

### Encrypted chunks
My understanding is file is file is splitted into chunks. Each chunk has starts with the same signature `[0xe9, 0xff, 0xa3, 0x00]` and then 4 bytes of data that determines the size of the chunk. Rest of the bytes until the next signature is the encrypted data.

In order to decrypt the data you need to use the scrambled password in the header. My best guess about how to figure out the real key that encrypted the data is described [in the code](./parser/file-parser.js#L70).

### What's next?
I still not figured out how to encryption actually works. So my next stop is finding out the encryption method.