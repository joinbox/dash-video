#!/bin/bash


VIDEO_TITLE="test-video"


# DASH VP9
VP9_DASH_PARAMS="-tile-columns 4 -frame-parallel 1"


ffmpeg -i bbb_sunflower_2160p_60fps_normal.mp4 -c:v libvpx-vp9 -s 160x90 -threads 4 -b:v 250k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_90p_250k.webm
ffmpeg -i bbb_sunflower_2160p_60fps_normal.mp4 -c:v libvpx-vp9 -s 320x180 -threads 4 -b:v 500k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_180p_500k.webm
ffmpeg -i bbb_sunflower_2160p_60fps_normal.mp4 -c:v libvpx-vp9 -s 640x360 -threads 4 -b:v 750k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_360p_750k.webm
ffmpeg -i bbb_sunflower_2160p_60fps_normal.mp4 -c:v libvpx-vp9 -s 640x360 -threads 4 -b:v 1000k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_360p_1000k.webm
ffmpeg -i bbb_sunflower_2160p_60fps_normal.mp4 -c:v libvpx-vp9 -s 1280x720 -threads 4 -b:v 1500k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 long_video_720p_500k.webm


#ffmpeg -ss 00:00:30 -i bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:a libvorbis -b:a 128k -vn -f webm -dash 1 audio_128k.webm
ffmpeg -i bbb_sunflower_2160p_60fps_normal.mp4 -c:a libvorbis -b:a 128k -vn -r 30 -f webm -dash 1 long_audio_128k.webm


# set cue points
./bin/sample_muxer -i long_video_90p_250k.webm -o long_video_90p_250k_cued.webm
./bin/sample_muxer -i long_video_180p_500k.webm -o long_video_180p_500k_cued.webm
./bin/sample_muxer -i long_video_360p_750k.webm -o long_video_360p_750k_cued.webm
./bin/sample_muxer -i long_video_360p_1000k.webm -o long_video_360p_1000k_cued.webm
./bin/sample_muxer -i long_video_720p_500k.webm -o long_video_720p_500k_cued.webm

ffmpeg -i long_audio_128k.webm -vn -acodec libvorbis -ab 128k -dash 1 long_audio_128k_cued.webm


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


## High Quality MP4
#ffmpeg -i input_720.webm -c:v libx264 -s 1280x720 -b:v 1500k -f mp4 -metadata title=${VIDEO_NAME} encoder="ffmpeg" -c:a copy -movflags +faststart video_720p_500k.mp4


#ffmpeg -y -i input3_720p.mp4 -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an crapple_hi.mp4