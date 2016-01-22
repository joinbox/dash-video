(function() {
    'use strict';


    // load dependencies required by the player
    requirejs(['bower/ee-class/dist/ee-class.min'], function(Class) {
        var Player;



        Player = new Class({
            inherits: HTMLElement.prototype


            // flags if the coponent is running on top of ios
            , isCrapple: false
            
            // ready for playback?
            , ready: false

            // playing flag
            , playing: {
                get: function() {
                    if (this.video) return !this.video.paused;
                    else if (this.crapplePlayer) return this.crapplePlayer.playing;
                    else return false;
                }
            }







            /**
             * let set up the player
             */
            , createdCallback: function() {

                // storage for the video sources
                this.loadedSources = [];

                // need to know if we're on ios
                this.isCrapple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

                // create shadow dom
                this.sRoot = this.createShadowRoot();


                // create ui root element
                this.createRoot();




                // check sources
                this.prepareSources();



                // add controls
                if (this.hasAttribute('controls')) this.createControls();


                // add poster
                if (this.hasAttribute('poster')) this.createPoster();




                var loadComplete = function() {
                    var args = [];
                    for (var i = 0, l = arguments.length; i < l; i++) args.push(arguments[i]);

                    try {
                        if (this.isCrapple) this.createCrapplePlayer.apply(this, args);
                        else this.createPlayer.apply(this, args);
                    } catch (e) {
                        console.log(e, e.stack);
                    }

                    // player is ready to be used
                    this.loaded = true;
                }.bind(this);



                // load specific modules depending on the browser
                // and media sources. dont optimize this code, the
                // require.js optimizer requires this syntax :/
                if (this.isCrapple) requirejs(['dashVideoLib/CrapplePlayer', 'dashVideoLib/Stream.js'], loadComplete);
                else if (this.dashSource) requirejs(['dashVideoLib/shaka-player.compiled'], loadComplete);

                else loadComplete();
            }













            , play: function() {
                if (this.video) this.video.play();
                else if (this.crapplePlayer) this.crapplePlayer.play();
            }












            , pause: function() {
                if (this.video) this.video.pause();
                else if (this.crapplePlayer) this.crapplePlayer.pause();
            }









            /**
             * create crapple player
             */
            , createCrapplePlayer: function(Player, Stream) {
                this.crapplePlayer = new Player({
                      stream     : new Stream(this.crappleSource)
                    , useWorkers : false
                    , webgl      : 'auto'
                    , render     : true
                    , loop       : this.hasAttribute('loop')
                    , size: {
                          width  : this.root.offsetWidth
                        , height : this.root.offsetHeight
                    }
                });


                this.crappleVideo = this.crapplePlayer.canvas;
                this.crappleVideo.setAttribute('width', this.root.offsetWidth);
                this.crappleVideo.setAttribute('height', this.root.offsetHeight);
                //this.crappleVideo.getContext('2d').scale(2, 2);

                this.root.appendChild(this.crappleVideo);

                this.crapplePlayer.onStatisticsUpdated = function(s) {
                    //console.log(s);
                };
    

                if (this.hasAttribute('autoplay')) this.play();  
            }








            /**
             * sets up the player for all normal browsers
             * for crapple based mobile devides see the
             * createCrapplePlayer method
             */
            , createPlayer: function(shaka) {
                if (this.loadedSources.length === 0) this.log('No video sources! check the sources and their media queries!');
                else {

                    // create video element
                    this.video = document.createElement('video');
                    this.video.setAttribute('width', this.root.offsetWidth);
                    this.video.setAttribute('height', this.root.offsetHeight);
                    if (this.getAttribute('controls')) this.video.setAttribute('controls');
                    if (this.getAttribute('loop')) this.video.setAttribute('loop');


                    // add polyfills if possible
                    if (shaka) shaka.polyfill.installAll();


                    // only do dash if shaka is present
                    if (this.dashSource &&
                        shaka && 
                        shaka.player.Player.isBrowserSupported() && 
                        shaka.player.Player.isTypeSupported('video/webm; codecs="vp9, vorbis"')) {
                        
                        // add the player
                        this.dashPlayer = new shaka.player.Player(this.video);

                        // get the global or local estimator
                        if (!window.shakaEstimator) window.shakaEstimator =  new shaka.util.EWMABandwidthEstimator();

                        // add player
                        this.dashPlayer.load(new shaka.player.DashVideoSource(this.dashSource, null, window.shakaEstimator)).then(function() {

                            // add to dom
                            this.root.appendChild(this.video);

                            if (this.hasAttribute('autoplay')) this.play();
                        }.bind(this)).catch(function(err) {
                            // alert(err);

                            // crap, switch to classic methods
                            this.dashSource = null;

                            // re-reun
                            this.createPlayer();
                        }.bind(this));
                    }
                    else {
                        // html5 video player

                        // add selected sources
                        this.loadedSources.forEach(function(source) {
                            if (source.type !== 'application/dash+xml') {
                                var sourceElement = document.createElement('source');
                                sourceElement.setAttribute('type', source.type);
                                sourceElement.setAttribute('src', source.src);
                                this.video.appendChild(sourceElement);
                            }
                        }.bind(this));

                        // add to dom
                        this.root.appendChild(this.video);

                        // autplay?
                        if (this.hasAttribute('autoplay')) this.play();
                    }
                }
            }












            /**
             * parses all sources, matches them against 
             * the medie query if present.
             */
            , prepareSources: function() {
                Array.prototype.forEach.call(this.children, function(childElement) {
                    if (childElement.media && window.matchMedia) {

                        if (window.matchMedia(childElement.media) && window.matchMedia(childElement.media).matches) {

                            if (childElement.type === 'application/dash+xml') this.dashSource = childElement.src;
                            else if (childElement.type === 'video/mp4' && childElement.hasAttribute('data-crapple')) this.crappleSource = childElement.src;
                            else {
                                this.loadedSources.push({
                                      src: childElement.src
                                    , media: childElement.media
                                    , type: childElement.type
                                });
                            }
                        }
                    }
                    else {
                        // load this source always!

                        // sort sources
                        if (childElement.type === 'application/dash+xml') this.dashSource = childElement.src;
                        else if (childElement.type === 'video/mp4' && childElement.hasAttribute('data-crapple')) this.crappleSource = childElement.src;
                        else {
                            this.loadedSources.push({
                                  src: childElement.src
                                , media: null
                                , type: childElement.type
                            });
                        }
                    }
                }.bind(this));
            }












            /**
             * create a basic ui for the player 
             */
            , createControls: function() { return;
                this.playButton = document.createElement('div');
                this.playButton.setAttribute('style', 'position: relative; bottom: 60px; left: 10px; width: 80px; height: 50px; background: rgba(0, 0, 22, 0.4); z-index: 100;');

                this.root.appendChild(this.playButton);
            }













            /**
             * create a basic ui for the player 
             */
            , createPoster: function() {

            }














            /** 
             * create the root div that contains everything
             */
            , createRoot: function() {
                this.root = document.createElement('div');

                this.root.addEventListener('click', function() {
                    if (this.playing) this.pause();
                    else this.play();
                }.bind(this));

                // apply styles from this to the video tag
                this.root.setAttribute('style', this.getAttribute('style'));
                this.root.style.display = 'inline-block';
                

                // check if there is a width && height attribute
                if (this.hasAttribute('width')) this.root.style.width = this.getAttribute('width')+'px';
                else this.root.style.width = this.offsetWidth+'px';

                if (this.hasAttribute('height')) this.root.style.height = this.getAttribute('height')+'px';
                else this.root.style.height = this.offsetHeight+'px';


                // add to shadow
                this.sRoot.appendChild(this.root);

                // get computed height
                this.elementHeight = this.root.offsetHeight;
                this.elementWidth = this.root.offsetWidth;
            }











            /**
             * logs stuff to the console  
             */
            , log: function() {
                var args = ['dash-video: '];

                for (var i = 0, l = arguments.length; i < l; i++) args.push(arguments[i]);

                console.log.apply(console, args);
            }
        });


    

    

        // register in the global namespace
        document.registerElement('dash-video', {
            prototype: new Player()
        });
    });
})();
