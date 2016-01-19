# demo code for converting video into various formats

VIDEO_NAME="test-video"


# DASH VP9
VP9_DASH_PARAMS="-tile-columns 4 -frame-parallel 1"

ffmpeg -i input_720.webm -c:v libvpx-vp9 -s -1x90 -b:v 250k -keyint_min 150 -g 150 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_NAME} encoder="ffmpeg" -f webm -dash 1 video_90p_250k.webm
ffmpeg -i input_720.webm -c:v libvpx-vp9 -s -1x180 -b:v 500k -keyint_min 150 -g 150 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_NAME} encoder="ffmpeg" -f webm -dash 1 video_180p_500k.webm
ffmpeg -i input_720.webm -c:v libvpx-vp9 -s -1x360 -b:v 750k -keyint_min 150 -g 150 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_NAME} encoder="ffmpeg" -f webm -dash 1 video_360p_750k.webm
ffmpeg -i input_720.webm -c:v libvpx-vp9 -s -1x360 -b:v 1000k -keyint_min 150 -g 150 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_NAME} encoder="ffmpeg" -f webm -dash 1 video_360p_1000k.webm
ffmpeg -i input_720.webm -c:v libvpx-vp9 -s -1x720 -b:v 1500k -keyint_min 150 -g 150 ${VP9_DASH_PARAMS} -an -metadata title=${VIDEO_NAME} encoder="ffmpeg" -f webm -dash 1 video_720p_500k.webm

#ffmpeg -ss 00:00:30 -i bbb_sunflower_2160p_60fps_normal.mp4 -t 00:00:30 -c:a libvorbis -b:a 128k -vn -f webm -dash 1 audio_128k.webm
#ffmpeg -i audio_128k.webm -c:a libvorbis -b:a 128k -vn -f webm -dash 1 audio_128k.webm

ffmpeg \
 -f webm_dash_manifest -i video_90p_250k.webm \
 -f webm_dash_manifest -i video_180p_500k.webm \
 -f webm_dash_manifest -i video_360p_750k.webm \
 -f webm_dash_manifest -i video_360p_1000k.webm \
 -f webm_dash_manifest -i video_720p_500k.webm \
 -f webm_dash_manifest -i audio_128k.webm \
 -c copy -map 0 -map 1 -map 2 -map 3 -map 4 -map 5 \
 -f webm_dash_manifest \
 -adaptation_sets "id=0,streams=0,1,2,3,4 id=1,streams=5" \
 manifest.mpd


## High Quality MP4
ffmpeg -i input_720.webm -c:v libx264 -s -1x720 -b:v 1500k -f mp4 -metadata title=${VIDEO_NAME} encoder="ffmpeg" -c:a copy -movflags +faststart video_720p_500k.mp4