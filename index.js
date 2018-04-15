const aws = require('aws-sdk');
const path = require("path");
const fs = require('fs');
const mime = require('mime-types');
const argv = require('yargs')
    .usage('Usage: $0 <directory> <bucket>')
    .demandCommand(2)
    .argv;

let directoryName = argv._[0];
let bucketName = argv._[1];

directoryName = path.parse(directoryName).base;

let s3 = new aws.S3({
    region: 'ap-southeast-2'
});
let sep = path.sep === '\\' ? '\\\\' : path.sep;

const processDirectory = (dirName) => {
    let files = fs.readdirSync(dirName);
    files.forEach((fileName) => {
        let fullFileName = path.join(dirName, fileName);
        let stat = fs.statSync(fullFileName);
        if(stat.isFile()) {
            processFile(fullFileName);
        } else {
            processDirectory(fullFileName);
        }
    });
};

const processFile = (fileName) => {
    let basePath = fileName.substring(directoryName.length + 1);
    basePath = basePath.replace(new RegExp(sep, 'g'), '/');    

    let params = {
        Bucket: bucketName,
        Key: basePath,
        Body: fs.readFileSync(fileName)
    };

    let type = mime.lookup(fileName);
    if(type) {
        params.ContentType = type;
    };

    s3.putObject(params, (err, result) => {
        if(err) {
            throw err;
        } else {
            console.log(`Successfully uploaded ${fileName}`);
        }
    });
};

processDirectory(directoryName);
