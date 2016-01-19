(function() {
    'use strict';


    // load dependencies required by the player
    requirejs(['bower/ee-class/dist/ee-class.min', '../lib/shaka-player.compiled'], function(Class, shaka) {
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

                    return false;
                }
            }



            /**
             * let set up the player
             */
            , createdCallback: function() {
                var jsSources = [];


                // much needed storage for the
                // sources
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





                // load dash files if required
                //if (this.dashSource) jsSources.push('../lib/shaka-player.compiled.js');

                // add h263 decoder
                if (this.isCrapple) {

                }


                // laod required files
                this.loadJavascriptDependencies(jsSources, function() {
                    
                    // set up the player
                    if (this.isCrapple) this.createPlayer();
                    else this.createPlayer();

                    // player is ready to be used
                    this.loaded = true;
                }.bind(this));
            }













            , play: function() {
                if (this.video) this.video.play();
            }












            , pause: function() {
                if (this.video) this.video.pause();
            }












            /**
             * sets up the player for all normal browsers
             * for crapple based mobile devides see the
             * createCrapplePlayer method
             */
            , createPlayer: function() {
                if (this.loadedSources.length === 0) this.log('No video sources! check the sources and their media queries!');
                else {

                    // create video element
                    this.video = document.createElement('video');
                    this.video.setAttribute('width', this.root.offsetWidth);
                    this.video.setAttribute('height', this.root.offsetHeight);


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
                        console.dir(window.matchMedia(childElement.media));
                        if (window.matchMedia(childElement.media) && window.matchMedia(childElement.media).matches) {

                            if (childElement.type === 'application/dash+xml') this.dashSource = childElement.src;
                            this.loadedSources.push({
                                  src: childElement.src
                                , media: null
                                , type: childElement.type
                            });
                        }
                    }
                    else {
                        // load this source always!

                        // sort sources
                        if (childElement.type === 'application/dash+xml') this.dashSource = childElement.src;
                        this.loadedSources.push({
                              src: childElement.src
                            , media: null
                            , type: childElement.type
                        });
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

                // check if there is a width && height attribute
                if (this.hasAttribute('width')) this.root.style.width = this.getAttribute('width');
                if (this.hasAttribute('height')) this.root.style.height = this.getAttribute('height');

                // add to shadow
                this.sRoot.appendChild(this.root);

                // get computed height
                this.elementHeight = this.root.offsetHeight;
                this.elementWidth = this.root.offsetWidth;
            }








            /**
             * dynamically load more scripts
             *
             * @param {string[]} scripts the scripts to load
             * @param {function} callback
             */
            , loadJavascriptDependencies: function(scripts, callback) {
                var loaded = 0;
                var load;

                if (scripts.length === 0) callback();
                else {

                    // wait until all scripts were laoded
                    load = function(err) {
                        if (++loaded === scripts.length) callback();
                    }.bind(this);


                    // load all scripts
                    scripts.forEach(function(src, index) {
                        var tag = document.createElement('script');

                        tag.addEventListener('load', load);

                        tag.setAttribute('src', src);
                        tag.setAttribute('id', 'dash-player-'+index);

                        this.sRoot.appendChild(tag);
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
