(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Stream = factory();
    }
}(this, function () {
    'use strict';

    var Stream = (function stream() {
      function constructor(url) {
        this.url = url;
      }
      
      constructor.prototype = {
        readAll: function(progress, complete) {
          var xhr = new XMLHttpRequest();
          var async = true;
          xhr.open("GET", this.url, async);
          xhr.responseType = "arraybuffer";
          if (progress) {
            xhr.onprogress = function (event) {
              progress(xhr.response, event.loaded, event.total);
            };
          }
          xhr.onreadystatechange = function (event) {
            if (xhr.readyState === 4) {
              complete(xhr.response);
              // var byteArray = new Uint8Array(xhr.response);
              // var array = Array.prototype.slice.apply(byteArray);
              // complete(array);
            }
          }
          xhr.send(null);
        }
      };
      return constructor;
    })();


    return Stream;
}));
