const { createServer } = require('http');
const Parser = require('./parser'); // ваш код

createServer((req, res) => {
  if (req.method === 'POST') {
    const parser = new Parser({ headers: req.headers });
    parser.on('file', (fieldname, file, filename, contentType) => {
      console.log(filename)
      // file должен быть Readable stream
      file.on('data', ({ length }) => console.log(`Got ${length} bytes`));
      file.on('end', () => console.log('File finished'));
    });
    parser.on('field', (fieldname, value) =>
      console.log(`${fieldname} ==> ${value}`)
    );
    parser.on('finish', function() {
      console.log('Done parsing form!');
      res.writeHead(200);
      res.end(JSON.stringify('{ success: true }'));
    });
    req.pipe(parser);
  } else if (req.method === 'GET') {
    res.writeHead(200, { Connection: 'close' });
    res.end('OK');
  }
}).listen(process.env.PORT || 8000, () => console.log('Listening'));

/*
const { Writable, Readable } = require('stream');

function parseContentType(header) {
    return '--' + header.toString().slice(header.indexOf('boundary') + 'boundary='.length);
}

function parsedHeaders(headers) {
    const ind = headers.toString().indexOf('\r\n') + 2;
    return headers.toString().slice(ind).split('\r\n').reduce(
        (headers, header) => ({
            ...headers,
            [header.split(':')[0]]: header.split(':')[1],
        }),
        {}
    )
}

function parsedContentDispositon(parsedContentDisposition) {
    return parsedContentDisposition.reduce((acc, i) => { 
        const trimmed = i.trim();
        const nameAndValue = trimmed.split('="');
        return {
            ...acc,
            [nameAndValue[0]]: nameAndValue[1].slice(0, nameAndValue[1].length - 1),
        };
    }, {});
}

const endOfHeaders = Buffer.from('\r\n\r\n');

class File extends Readable {
    _read(size) {
        console.log(size);
    }

    _destroy() {
        console.log('destroy');
        this.push(null);
    }

}

class Parser extends Writable {
    constructor(params) {
        super();
        this.headers = params.headers;
        this.devider = parseContentType(this.headers['content-type']);
        //this.endOfData = +this.headers['content-length'];
        this.buffer = Buffer.alloc(0);
        //this.lastIndex = 0;
        this.lastFile = null;

    }

    _write(chunk, encoding, callback) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        //this.lastIndex = this.lastIndex + chunk.length;
        this.processArray(this.buffer, callback);

    }

    emitNewFile(name, filename, contentType) {
        this.lastFile = new File();
        this.emit('file', name, this.lastFile, filename, contentType);
    }

    emitField(name, value) {
        this.emit('field', name, value);
    }

    destroyFile() {
        this.lastFile.destroy();
        this.lastFile.push(null);
        this.lastFile = null;
    }

    processArray(chunk, callback) {
        const headerEnd = chunk.indexOf(endOfHeaders);
        const headers = parsedHeaders(chunk.slice(0, headerEnd));
        const isEndFile = chunk.indexOf(this.devider, headerEnd);
        
        if (this.lastFile && isEndFile !== -1) {
            this.buffer = chunk.slice(0, isEndFile);
            this.lastFile.push(chunk.slice(0, isEndFile));
            this.destroyFile();
            this.processArray(chunk.slice(isEndFile), callback);
            return;
        }

        if (this.lastFile && isEndFile === -1) {
            this.lastFile.push(chunk);
            this.buffer = Buffer.alloc(0);
            callback();
            return;
        }

        if (headerEnd === -1) {
            callback();
            return;
        }

        const parsedContentDisposition = headers['Content-Disposition'].split(';').slice(1);
        const { name, filename } = parsedContentDispositon(parsedContentDisposition);

        const isEndFileAfterHeader = chunk.indexOf(this.devider, headerEnd);

        debugger;
        if (!filename) {
            console.log('file');
            const fieldValue = chunk.slice(headerEnd + endOfHeaders.length, isEndFile).toString();
            this.emitField(name, fieldValue);
            this.buffer = chunk.slice(isEndFile);
            this.processArray(chunk.slice(isEndFile), callback);
        }

        if (filename && isEndFileAfterHeader !== -1) {
            this.emitNewFile(name, filename, headers['Content-Type']);

            this.lastFile.push(chunk.slice(headerEnd, isEndFile));
            this.destroyFile();
            this.buffer = chunk.slice(isEndFile);
            this.processArray(chunk.slice(isEndFile), callback);
            return;
        }

        if (filename && isEndFileAfterHeader === -1) {
            this.emitNewFile(name, filename, headers['Content-Type']);

            this.buffer = Buffer.alloc(0);
            this.lastFile.push(chunk.slice(headerEnd));
            callback();
            return;
        }
    }
}

module.exports = Parser;

*/