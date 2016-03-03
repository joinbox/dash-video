# dash-video

A web component for playing back videos

- auto play on all platforms
- non fullscreen videos on the iphone
- dash, adaptive video support (webm, vp9, ogg vorbis)
- html5 video support (any format supported by the browser)
- support for media queries on the video sources

Known issues:

- no controls
- iOS (non fullscreen / autoplay): no audio, only short videos, up to 720p video
- Android autoplay only works after the user interacted somehow with the website
- the pain in the ass of encoding videos
- dash is slow on android devices (you may disable playback using media queries)

Made possible by 

- [Broadway](https://github.com/mbebenita/Broadway)
- [Shaka Player](https://github.com/google/shaka-player)

Thanks for the great work!



## License

Have a look at https://opensource.org/licenses for details

- Code Commited by joinbox staff: MIT
- For the iOS part (h.264 decoder), please have a look at the licence agreements of the mpeg-la,
  it's probably free for personal and non-commercial use. Use on your own risk!
- Broadway: 3-clause BSD & Apache 2.0 license
- Shaka Player: Apache License 2.0
- Sample movies: Big Buck Bunny (c) copyright 2008, Blender Foundation / [www.bigbuckbunny.org](www.bigbuckbunny.org)


## installation

    bower i dash-video




## Using the component

You need to include the following lines in the head section of your html file

    <script src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
    <link rel="import"  href="bower_components/dash-video/src/dash-video.html">


Setting up your first video using the dash-video tag

    <dash-video autoplay loop style="width:1280px; height:720px;" id="dash-video-player">
        <!-- dash video -->
        <source type="application/dash+xml"     media="screen and (min-width:1005px)"   src="http://whaever.127.0.0.1.xip.io:80/long_manifest.mpd" />

        <!-- normal html5 video -->
        <source type="video/mp4"                media="screen and (min-width:1025px)"   src="video/input_1080p.mp4" />

        <!-- special video for ios, note the data-crapple attribute -->
        <source type="video/mp4"                media="screen and (min-width:125px)"    src="video/crapple_hi.mp4" data-crapple/>
    </dash-video>

That's it!

If you have trouble loading video files from localhost while developing you may start the node server that set the correct cors headers:

    npm i
    node server.js

The server listens on port 8000, you can now navigate to (localhost:8000)[http://whatever.127.0.0.1.xip.io:8000/]



## API

The api currently supports only two methods. Create an issue if you need more functionality!


### play() method

plays / resumes playback

    document.querySelector('#dash-video-player').play();


### pause() method

pauses playback

    document.querySelector('#dash-video-player').pause();






## Encoding Videos

Those are instructions for ubuntu 15.10. It's a pain in the ass!


### Compiling ffmpeg and dependecies

You have to compile an up to date version of ffmpeg in order to create dash and apple compatible video files.


first install required tools

    sudo apt-get install cmake make g++ git-core gcc yasm


then install dependencies

    sudo apt-get install libx264-dev


get the required source files from https://www.xiph.org/downloads/ and compile them

ogg

    wget http://downloads.xiph.org/releases/ogg/libogg-1.3.2.tar.gz
    tar xzvf libogg-1.3.2.tar.gz
    cd libogg-1.3.2
    ./configure
    make
    sudo make install

vorbis

    wget http://downloads.xiph.org/releases/vorbis/libvorbis-1.3.5.tar.gz
    tar xzvf libvorbis-1.3.5.tar.gz
    cd libvorbis-1.3.5
    ./configure
    make
    sudo make install

libvpx

    git clone https://chromium.googlesource.com/webm/libvpx
    cd libvpx
    ./configure
    make
    sudo make install

ffmpeg

    git clone git://source.ffmpeg.org/ffmpeg.git
    cd ffmpeg
    # maybe: cmake
    ./configure --enable-libvpx --enable-libvorbis --enable-gpl --enable-libx264
    make
    sudo make install


If i forgot something please file an issue!



### MP4 video 

    ffmpeg -i input_720.webm -c:v libx264 -s 1280x720 -b:v 1500k -f mp4 -metadata title="My Cool Video" encoder="ffmpeg" -c:a copy -movflags +faststart video_720p_500k.mp4


### Video for Crapple devices


    ffmpeg -y -i input3_720p.mp4 -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an crapple_hi.mp4


### Dash Video

See [DASH & VP9](http://wiki.webmproject.org/adaptive-streaming/instructions-to-playback-adaptive-webm-using-dash) for a short explanation!


    VIDEO_TITLE="My Cool Video"


    # DASH VP9
    VP9_DASH_PARAMS="-tile-columns 4 -frame-parallel 1"


    # create videos in different qualities
    ffmpeg -i input.mp4 -c:v libvpx-vp9 -s 160x90 -threads 4 -b:v 250k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_90p_250k.webm
    ffmpeg -i input.mp4 -c:v libvpx-vp9 -s 320x180 -threads 4 -b:v 500k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_180p_500k.webm
    ffmpeg -i input.mp4 -c:v libvpx-vp9 -s 640x360 -threads 4 -b:v 750k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_360p_750k.webm
    ffmpeg -i input.mp4 -c:v libvpx-vp9 -s 640x360 -threads 4 -b:v 1000k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_360p_1000k.webm
    ffmpeg -i input.mp4 -c:v libvpx-vp9 -s 1280x720 -threads 4 -b:v 1500k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_720p_500k.webm

    # audio track
    ffmpeg -i input.mp4 -c:a libvorbis -b:a 128k -vn -r 30 -f webm -dash 1 long_audio_128k.webm


    # set cue points
    ./bin/sample_muxer -i long_video_90p_250k.webm -o long_video_90p_250k_cued.webm
    ./bin/sample_muxer -i long_video_180p_500k.webm -o long_video_180p_500k_cued.webm
    ./bin/sample_muxer -i long_video_360p_750k.webm -o long_video_360p_750k_cued.webm
    ./bin/sample_muxer -i long_video_360p_1000k.webm -o long_video_360p_1000k_cued.webm
    ./bin/sample_muxer -i long_video_720p_500k.webm -o long_video_720p_500k_cued.webm

    # for the audio too
    ffmpeg -i long_audio_128k.webm -vn -acodec libvorbis -ab 128k -dash 1 long_audio_128k_cued.webm


    # create dash manifest
    ffmpeg \
     -analyzeduration 2147483647 -probesize 2147483647 \
     -f webm_dash_manifest -i long_video_90p_250k_cued.webm \
     -f webm_dash_manifest -i long_video_180p_500k_cued.webm \
     -f webm_dash_manifest -i long_video_360p_750k_cued.webm \
     -f webm_dash_manifest -i long_video_360p_1000k_cued.webm \
     -f webm_dash_manifest -i long_video_720p_500k_cued.webm \
     -f webm_dash_manifest -i long_audio_128k_cued.webm \
     -c copy -map 0 -map 1 -map 2 -map 3 -map 4 -map 5 \
     -f webm_dash_manifest \
     -adaptation_sets "id=0,streams=0,1,2,3,4 id=1,streams=5" \
     long_manifest.mpd


## Links

- [DASH & VP9](http://wiki.webmproject.org/adaptive-streaming/instructions-to-playback-adaptive-webm-using-dash)