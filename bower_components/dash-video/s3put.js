#!/usr/bin/env node

(function() {
    'use strict';


    let cp = require('child_process');
    let argv = require('ee-argv');
    let log = require('ee-log');
    let path = require('path');
    let ini = require('ini');
    let fs = require('fs');
    let Bucket = require('ee-aws-s3-bucket');



    let mimeTypes = {
          mpd: 'application/dash+xml'
        , mp4: 'video/mp4'
        , webm: 'video/webm'
    };



    let config = ini.parse(fs.readFileSync(path.join(process.env.HOME, '.aws/credentials'), 'utf-8'))




    class S3Putter {



        constructor() {
            console.log('s3 uploader is starting ...'.white);

            if (!argv.has('bucket')) return console.log('Please specify the aws bucket to put to!'.red);
            if (!argv.has('path')) return console.log('Please specify the aws path to put to!'.red);


            this.bucket = new Bucket({
                  key       : config.default.aws_access_key_id
                , secret    : config.default.aws_secret_access_key
                , bucket    : argv.get('bucket')
            });


            fs.readdir(process.env.PWD, (err, files) => {
                if (err) log(err);
                else {
                    Promise.all(files.map((fileName) => {
                        return new Promise((resolve, reject) => {
                            let awspath = path.join(argv.get('path'), fileName);
                            console.log(`putting file ${awspath} ...`.grey);
                            this.bucket.put(awspath, mimeTypes[path.extname(fileName).substr(1)], fs.readFileSync(path.join(process.env.PWD, fileName)), false, (err) => {
                                if (err) reject(err);
                                else {
                                    console.log(`File ${fileName} stored on s3 ${awspath} ...`.green);
                                    resolve();
                                }
                            });
                        });
                    })).then(() =>  {
                        console.log('finished ...');
                    }).catch(log);
                }
            });
        }


    }




    // run the encoder
    new S3Putter();
})();
