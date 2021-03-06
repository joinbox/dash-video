(function() {
    'use strict';


    // load dependencies required by the player
    requirejs(['bower/ee-class/dist/ee-class.min'], function(Class) {
        var Player;



        Player = new Class({
            inherits: HTMLElement.prototype

            // source id counter
            , sourceId: 0

            // flags if the component was loaded on iOS
            // in case the crapple player must be loaded
            , isCrapple: false

            // android does autoplay only after any user
            // interaction, so we need to know if we're 
            // on that platform
            , isAndroid: false

            // flags if there was any user interaction 
            // so that autplay on android works correctly
            , userInteraction: false

            
            // ready for playback?
            , ready: false

            // internal playing flag
            , isPlaying: false

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
                this.isCrapple = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

                // and android too
                this.isAndroid = /android/i.test(navigator.userAgent);



                // create shadow dom
                this.sRoot = this.createShadowRoot();




                // load event listeners
                this.onLoad = [];

                // play event listeners
                this.playListeners = [];



                // wait for android user interfaction so that
                // the autoplay functionality works
                window.addEventListener('touchstart', function interactionListener() {
                    this.userInteraction = true;

                    this.playListeners.forEach(function(cb) {
                        cb();
                    });

                    this.playListeners = [];

                    // listen one time only
                    window.removeEventListener('touchstart', interactionListener);
                }.bind(this));


                // listen for resize events
                window.addEventListener('resize', this.onResize.bind(this));
                window.addEventListener('load', this.onResize.bind(this));
                window.addEventListener('orientationchange', this.onResize.bind(this));



                // create ui root element
                this.createRoot();


                // set up the basics
                this.setup();



                // add controls
                if (this.hasAttribute('controls')) this.createControls();


                // add poster
                if (this.hasAttribute('poster')) this.createPoster();




                var loadComplete = function() {

                    this.modules = [];
                    for (var i = 0, l = arguments.length; i < l; i++) this.modules.push(arguments[i]);


                    // player is ready to be used
                    this.loaded = true;

                    // emit load event
                    this.onLoad.forEach(function(cb) {
                        cb();
                    });

                    this.onLoad = [];
                }.bind(this);



                // load specific modules depending on the browser
                // and media sources. dont optimize this code, the
                // require.js optimizer requires this syntax :/
                if (this.isCrapple) requirejs(['dashVideoLib/CrapplePlayer', 'dashVideoLib/Stream'], loadComplete);
                else if (this.dashSource) requirejs(['dashVideoLib/shaka-player.compiled'], loadComplete);
                else loadComplete();
            }















            /**
             * remove old players, create new ones
             */
            , setup: function(callback) {

                var resumeSetup = function() {

                    // check if the video sources have changed
                    if (this.prepareSources()) {


                        this.pause();

                        // remove old stuff
                        if (this.video) this.video.remove();
                        else if (this.crapplePlayer) {
                            this.crapplePlayer.canvas.remove();
                            delete this.crapplePlayer;
                        }


                        try {
                            if (this.isCrapple) {
                                if (this.hasAttribute('autoplay') || this.isPlaying) {
                                    // load player now
                                    this.createCustomPlayer.apply(this, this.modules);
                                }
                            }
                            else this.createPlayer.apply(this, this.modules);
                        } catch (e) {
                            console.log(e, e.stack);
                        }

                        if (callback) callback(true);
                    }
                    else if (callback) callback(false);
                }.bind(this);


                if (this.loaded) resumeSetup();
                else this.onLoad.push(resumeSetup);
            }












            , play: function() {
                if (this.video) {
                    if (this.isAndroid) {
                        if (this.userInteraction) {
                            this.isPlaying = true;
                            this.video.play();
                        }
                        else this.playListeners.push(this.play.bind(this));
                    }
                    else {
                        this.video.play();
                        this.isPlaying = true;
                    }
                }
                else if (this.isCrapple) {
                    // create the player if required, then
                    // start to play
                    if (this.crapplePlayer) {
                        this.crapplePlayer.play();
                        this.isPlaying = true;
                    }
                    else {

                        // the crapple player will load itself when 
                        // the compoentn has finished loading
                        if (this.loaded) {
                            this.createCustomPlayer.apply(this, this.modules);
                            this.isPlaying = true;
                        }
                    }
                }
            }












            , pause: function() {
                this.isPlaying = false;
                if (this.video) this.video.pause();
                else if (this.crapplePlayer) this.crapplePlayer.pause();
            }









            /**
             * create crapple player
             */
            , createCustomPlayer: function(Player, Stream) {
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


                this.resize();

                this.crappleVideo = this.crapplePlayer.canvas;
                this.crappleVideo.setAttribute('width', this.root.offsetWidth);
                this.crappleVideo.setAttribute('height', this.root.offsetHeight);


                this.root.appendChild(this.crappleVideo);

                this.play();  
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
                    //if (this.hasAttribute('controls')) this.video.setAttribute('controls');
                    if (this.hasAttribute('loop')) this.video.setAttribute('loop', '');


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
                            console.log(err, err.stack);

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
                        if (this.hasAttribute('autoplay') || this.isPlaying) this.play();
                    }
                }
            }












            /**
             * parses all sources, matches them against 
             * the medie query if present.
             */
            , prepareSources: function() {
                var sources = [];

                Array.prototype.forEach.call(this.children, function(childElement) {
                    if (!childElement.sourceId) childElement.sourceId = ++this.sourceId;

                    if (childElement.media && window.matchMedia) {

                        if (window.matchMedia(childElement.media) && window.matchMedia(childElement.media).matches) {

                            if (childElement.type === 'application/dash+xml') this.dashSource = childElement.src;
                            else if (childElement.type === 'video/mp4' && childElement.hasAttribute('data-autoplay')) this.crappleSource = childElement.src;
                            else {
                                sources.push({
                                      src: childElement.src
                                    , media: childElement.media
                                    , type: childElement.type
                                    , id: childElement.sourceId
                                });
                            }
                        }
                    }
                    else {
                        // load this source always!

                        // sort sources
                        if (childElement.type === 'application/dash+xml') this.dashSource = childElement.src;
                        else if (childElement.type === 'video/mp4' && childElement.hasAttribute('data-autoplay')) this.crappleSource = childElement.src;
                        else {
                            sources.push({
                                  src: childElement.src
                                , media: null
                                , type: childElement.type
                                , id: childElement.sourceId
                            });
                        }
                    }
                }.bind(this));


                var oldSources = this.loadedSources.map(function(src) {
                    return src.id;
                }).sort().join('');

                var newSources = sources.map(function(src) {
                    return src.id;
                }).sort().join('');


                this.loadedSources = sources;

                // return true if the sources are not the same
                // as when we run the last time 
                return newSources !== oldSources;
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
                

                // call the resizer
                this.resize();

                // add to shadow
                this.sRoot.appendChild(this.root);

                // get computed height
                this.elementHeight = this.root.offsetHeight;
                this.elementWidth = this.root.offsetWidth;
            }





            /**
             * resize debouncer
             */
            , onResize: function() {

                // timeout for actual resizing
                if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(function() {
                    if (this.videoTimeout) clearTimeout(this.videoTimeout);
                    this.resize();
                }.bind(this), 500);

                // timeout for reinitilization with new video sources
                if (this.videoTimeout) clearTimeout(this.videoTimeout);
                this.videoTimeout = setTimeout(function() {
                    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
                    this.resize();
                    this.setup();
                }.bind(this), 1000);
            }






            /**
             * resize event listner
             */
            , resize: function() {
                var cs = window.getComputedStyle(this);

                if (this.hasAttribute('width')) this.root.style.width = this.getAttribute('width')+'px';
                else if (this.style.width) this.root.style.width = this.style.width;
                else if (!isNaN(cs.width)) this.root.style.width = cs.width;
                else this.root.style.width = this.offsetWidth+'px';

                if (this.hasAttribute('height')) this.root.style.height = this.getAttribute('height')+'px';
                else if (this.style.height) this.root.style.height = this.style.height;
                else if (!isNaN(cs.height)) this.root.style.height = cs.height;
                else this.root.style.height = this.offsetHeight+'px';


                // don't do a shit if there arent any changes
                if (this.elementHeight !== this.root.offsetHeight || this.elementWidth !== this.root.offsetWidth) {

                    // get computed height
                    this.elementHeight = this.root.offsetHeight;
                    this.elementWidth = this.root.offsetWidth;


                    this.setup(function(isNewPlayer) {
                        console.log('new player!');

                        if (!isNewPlayer) {
                            // resize the video if required
                            if (this.video) {
                                this.video.height = this.elementHeight;
                                this.video.width = this.elementWidth;
                            }

                            if (this.crapplePlayer) {
                                var canvas = this.crapplePlayer.resize(this.elementWidth, this.elementHeight);

                                if (this.crappleVideo) this.crappleVideo.remove();
                                this.crappleVideo = canvas;
                                this.root.appendChild(this.crappleVideo);
                            }
                        }
                    }.bind(this));
                }
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
