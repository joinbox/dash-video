(function() {
    'use strict';

    let express = require('express');
    let compression = require('compression');
    let app = express();


    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        if (req.method === 'OPTIONS') res.sendStatus(204);
        else next();
    });

    app.use(compression());
        
    app.use(express.static(__dirname, {index: 'test.html'}));

    app.listen(8000, function () {
      console.log('listening on port 8000!');
    });
})();