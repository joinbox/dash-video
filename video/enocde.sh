#!/bin/bash


VIDEO_TITLE="sample-video"


# DASH VP9
VP9_DASH_PARAMS="-tile-columns 4 -frame-parallel 1"


ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libvpx-vp9 -s 160x90 -threads 4 -b:v 250k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 sample_video_90p_250k.webm
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libvpx-vp9 -s 320x180 -threads 4 -b:v 500k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 sample_video_180p_500k.webm
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libvpx-vp9 -s 640x360 -threads 4 -b:v 750k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 sample_video_360p_750k.webm
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libvpx-vp9 -s 640x360 -threads 4 -b:v 1000k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 sample_video_360p_1000k.webm
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libvpx-vp9 -s 1280x720 -threads 4 -b:v 1500k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 sample_video_720p_1500k.webm
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libvpx-vp9 -s 1920x1080 -threads 4 -b:v 3000k -keyint_min 150 -g 60 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_TITLE} -metadata encoder="ffmpeg" -r 30 -f webm -dash 1 sample_video_1080p_3000k.webm


#ffmpeg -ss 00:00:30 -i bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:a libvorbis -b:a 128k -vn -f webm -dash 1 audio_128k.webm
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:a libvorbis -b:a 128k -vn -r 30 -f webm -dash 1 sample_audio_128k.webm


# set cue points
../bin/sample_muxer -i sample_video_90p_250k.webm -o sample_video_90p_250k_cued.webm
../bin/sample_muxer -i sample_video_180p_500k.webm -o sample_video_180p_500k_cued.webm
../bin/sample_muxer -i sample_video_360p_750k.webm -o sample_video_360p_750k_cued.webm
../bin/sample_muxer -i sample_video_360p_1000k.webm -o sample_video_360p_1000k_cued.webm
../bin/sample_muxer -i sample_video_720p_1500k.webm -o sample_video_720p_1500k_cued.webm
../bin/sample_muxer -i sample_video_1080p_3000k.webm -o sample_video_1080p_3000k_cued.webm

ffmpeg -i sample_audio_128k.webm -vn -acodec libvorbis -ab 128k -dash 1 sample_audio_128k_cued.webm


ffmpeg \
 -analyzeduration 2147483647 -probesize 2147483647 \
 -f webm_dash_manifest -i sample_video_90p_250k_cued.webm \
 -f webm_dash_manifest -i sample_video_180p_500k_cued.webm \
 -f webm_dash_manifest -i sample_video_360p_750k_cued.webm \
 -f webm_dash_manifest -i sample_video_360p_1000k_cued.webm \
 -f webm_dash_manifest -i sample_video_720p_1500k_cued.webm \
 -f webm_dash_manifest -i sample_video_1080p_3000k_cued.webm \
 -f webm_dash_manifest -i sample_audio_128k_cued.webm \
 -c copy -map 0 -map 1 -map 2 -map 3 -map 4 -map 5 -map 6 \
 -f webm_dash_manifest \
 -adaptation_sets "id=0,streams=0,1,2,3,4,5 id=1,streams=6" \
 sample_manifest.mpd


## High Quality MP4
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libx264 -s 640x360 -b:v 500k -f mp4 -metadata title=${VIDEO_NAME} -metadata encoder="ffmpeg" -r 30 -c:a copy -strict -2 -movflags +faststart sample_video_360p_500k.mp4
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libx264 -s 1280x720 -b:v 1500k -f mp4 -metadata title=${VIDEO_NAME} -metadata encoder="ffmpeg" -r 30 -c:a copy -strict -2 -movflags +faststart sample_video_720p_1500k.mp4
ffmpeg -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:v libx264 -s 1920x1080 -b:v 3000k -f mp4 -metadata title=${VIDEO_NAME} -metadata encoder="ffmpeg" -r 30 -c:a copy -strict -2 -movflags +faststart sample_video_1080p_3000k.mp4


ffmpeg -y -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -s 640x360 -r 30 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an sample_crapple_360p.mp4
ffmpeg -y -ss 00:01:00 -i ~/bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -s 1280x720 -r 30 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an sample_crapple_720p.mp4