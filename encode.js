#!/usr/bin/env node

(function() {
    'use strict';


    let cp = require('child_process');
    let argv = require('ee-argv');
    let log = require('ee-log');
    let path = require('path');
    let fs = require('fs');



    let mimeTypes = {
          mpd: 'application/dash+xml'
        , mp4: 'video/mp4'
    };




    class VideoEncoder {



        constructor() {
            console.log('encoder is starting ...'.white);

            if (!argv.anonymous.length) return console.log('Please specify the input file!'.red);
            else if (!argv.has('resolutions'))  return console.log('Please specify the ouput resolutions (--resolutions=100p,300p,...)!'.red);
            else if (!argv.has('breakpoints'))  return console.log('Please specify the ouput breakpoints (--breakpoints=100,300,...)!'.red);
            else if (!argv.has('out'))  return console.log('Please specify the ouput directory (--out=./out)!'.red);



            this.input = path.join(process.env.PWD, argv.anonymous[0]);
            this.resolutions = argv.get('resolutions').split(',').map(r => parseInt(r.replace('p', ''), 10));//.sort((a, b) => {return a-b;});
            this.breakpointsOffsets = argv.get('breakpoints').split(',').map(r => parseInt(r.replace('px', ''), 10)).sort((a, b) => {return a-b;});
            this.out = argv.get('out')[0] === '/' ? argv.get('out') : path.join(process.env.PWD, argv.get('out'));
            this.fps = argv.get('fps') || 30000/1001;

            this.fileName = path.basename(this.input, path.extname(this.input));
            this.title = argv.has('title') || 'joinbox demo video';


            this.commands = [];

            this.breakpoints = {};
            this.breakpointsOffsets.forEach((p) => {
                this.breakpoints[p] = [];
            });



            this.getInputDimensions().then(() => {
                return this.prepare();
            }).then(() => {
                log(this);
                fs.writeFile(path.join(process.env.PWD, 'encode.sh'), '#!/bin/bash\n\n'+this.commands.join('\n'));
                //console.log();
                this.createHTMLSnippet();
            }).catch(log);
        }






        prepare() {
            return Promise.resolve().then(() => {
                if (argv.has('dash')) {
                    return Promise.all(this.resolutions.map((r, i) => {
                        return this.prepareDash(this.breakpointsOffsets[i], r);
                    }));
                }
                else return Promise.resolve();
            }).then(() => {
                if (argv.has('mp4')) {
                    return Promise.all(this.resolutions.map((r, i) => {
                        return this.prepareMP4(this.breakpointsOffsets[i], r);
                    }));
                }
                else return Promise.resolve();
            }).then(() => {
                if (argv.has('crapple')) {
                    return Promise.all(this.resolutions.map((r, i) => {
                        return this.prepareCrapple(this.breakpointsOffsets[i], r);
                    }));
                }
                else return Promise.resolve();
            });
        }













        prepareCrapple(breakpoint, resolution) {
            let params = this.getDimensions(resolution);
            let outFileName = `${this.fileName}_crapple_${breakpoint}px_${params.width}x${params.height}p`;
            let outFile = path.join(this.out, outFileName);

            this.commands.push(`ffmpeg -y
                -i ${this.input} 
                -r 30000/1001 
                -b:a 2M 
                -bt 4M 
                -vcodec libx264 
                -vf scale=${params.width}:${params.height}
                -b:v ${params.rate}k 
                -r ${this.fps}
                -pass 1 
                -coder 0 
                -bf 0 -flags -loop -wpredp 0 
                -an ${outFile}.mp4`.replace(/\n/g, ' ').replace(/\s{2,}/g, ' '));

            this.breakpoints[breakpoint].push(`${outFile}.mp4`);

            return Promise.resolve();
        }






        createHTMLSnippet() {
            let str = `<dash-video autoplay loop style="width:1280px; height:720px;" id="dash-video-player">`;

            this.breakpointsOffsets.forEach((bp, index) => {
                this.breakpoints[bp].forEach((source) => {
                    let mimeType = mimeTypes[path.extname(source).substr(1)];
                    let min = index === 0 ? 0 : this.breakpointsOffsets[index-1];

                    str += `\n    <source type="${mimeType}"     media="screen and (max-width:${bp}px) and (min-width: ${min}px)"   src="__video_root__/${path.basename(source)}" ${/crapple/.test(source) ? 'data-autoplay ' : ''}/>`;
                });
            });

            str += `\n</dash-video>`;

            console.log(str);
        }






        prepareMP4(breakpoint, resolution) {
            let params = this.getDimensions(resolution);
            let outFileName = `${this.fileName}_${breakpoint}px_${params.width}x${params.height}p`;
            let outFile = path.join(this.out, outFileName);

            this.commands.push(`ffmpeg -y
                -i ${this.input} 
                -c:v libx264 
                -vf scale=${params.width}:${params.height}
                -b:v ${params.rate}k 
                -f mp4 
                -metadata title='${this.title}' 
                -metadata encoder="ffmpeg" 
                -r ${this.fps} 
                -c:a copy 
                -strict -2 
                -movflags +faststart 
                ${outFile}.mp4`.replace(/\n/g, ' ').replace(/\s{2,}/g, ' '));

            this.breakpoints[breakpoint].push(`${outFile}.mp4`);

            return Promise.resolve();
        }







        prepareDash(breakpoint, resolution) {
            let params = this.getDimensions(resolution);
            let outFiles = [];

            // video
            while(true) {
                let outFileName = `${this.fileName}_${breakpoint}px_${params.width}x${params.height}p`;
                let outFile = path.join(this.out, outFileName);

                this.commands.push(`ffmpeg -y
                  ${this.getFilter(params.width, params.height)}
                  -i ${this.input}
                  -c:v libvpx-vp9 
                  -filter_complex "[1:v] scale=${params.width}:${params.height} [video];[0:v][video] overlay=shortest=1"
                  -threads 4 
                  -b:v ${params.rate}k 
                  -keyint_min 150 
                  -g 60 -tile-columns 4 -frame-parallel 1 
                  -an -metadata title='${this.title}' 
                  -metadata encoder="ffmpeg" 
                  -r ${this.fps}
                  -f webm 
                  -dash 1 ${outFile}.webm`.replace(/\n/g, ' ').replace(/\s{2,}/g, ' '));

                this.commands.push(`${path.join(__dirname, './bin/sample_muxer')} -i ${outFile}.webm -o ${outFile}_cued.webm`.replace(/\n/g, ' ').replace(/\s{2,}/g, ' '));
                this.commands.push(`rm ${outFile}.webm`);
                outFiles.push(`${outFile}_cued.webm`);

                params = this.getDimensions(Math.round(params.height/1.5));

                if (params.height < 80) break;
            }


            // audio
            if (argv.has('audio')) {
                let audioOutFileName = `${this.fileName}_${breakpoint}px`;
                let audioOutFile = path.join(this.out, audioOutFileName+'_audio_128k');

                this.commands.push(`ffmpeg -y -i ${this.input} -c:a libvorbis -b:a 128k -vn -r 30 -f webm -dash 1 ${audioOutFile}.webm`);
                this.commands.push(`ffmpeg -y -i ${audioOutFile}.webm -vn -acodec libvorbis -ab 128k -dash 1 ${audioOutFile}_cued.webm`);
                outFiles.push(`${audioOutFile}_cued.webm`);
                this.commands.push(`rm ${audioOutFile}.webm`);
            }


            if (outFiles.length > 1) {
                let manifestOutFileName = `${this.fileName}_${breakpoint}px`;
                let manifestFile = path.join(this.out, manifestOutFileName+'_manifest.mpd');
                let manifestCommand = 'ffmpeg -y -analyzeduration 2147483647 -probesize 2147483647 ';
                let copyString = '';

                outFiles.forEach((f, i) => {
                    manifestCommand += `-f webm_dash_manifest -i ${f} `;
                    copyString += `-map ${i} `;
                });

                manifestCommand += `-c copy ${copyString} -f webm_dash_manifest `;
                manifestCommand += `-adaptation_sets "id=0,streams=${Array.apply(null, {length: outFiles.length-1}).map((v, i) => i).join(',')} id=1,streams=${outFiles.length-1}" `;
                manifestCommand += `${manifestFile}`;
                this.commands.push(manifestCommand);

                this.breakpoints[breakpoint].push(manifestFile);
            }

            return Promise.resolve();
        }






        getDimensions(referenceHeight) {
            if (referenceHeight%2 !== 0) referenceHeight++;

            let width = Math.round(this.ratio*referenceHeight);
            if (width%2 !== 0) width++;
            
            let rate = Math.round(Math.sqrt(referenceHeight*width)*(1.3+(referenceHeight/800)));

            return {
                  width  : width
                , height : referenceHeight
                , rate   : rate
            };
        }





        getFilter(w, h) {
            return `-f lavfi -i "color=black:s=${w+1}x${h+1}"`;
        }






        getInputDimensions() {
            return new Promise((resolve, reject) => {
                cp.exec(`ffmpeg -i ${this.input} 2>&1 | grep Stream | grep -oP ', \\K[0-9]+x[0-9]+'`, (err, stdout) => {
                    if (err) reject(err);
                    else {
                        if (/([0-9]+)x([0-9]+)/gi.test(stdout))  {
                            let result = /([0-9]+)x([0-9]+)/gi.exec(stdout);
                            this.inputWidth = result[1];
                            this.inputHeight = result[2];
                            this.ratio = this.inputWidth / this.inputHeight;
                            resolve();
                        }
                        else reject(new Error(`Failed to get the resolution of the input movie ${this.input}`));
                    }
                });
            });
        }
    }




    // run the encoder
    new VideoEncoder();
})();
