var run = require('tape-run');
var browserify = require('browserify');

var cases = [ "basic", "unary", "binary", "offset", "fill" ]

cases.forEach(test => {
    browserify(__dirname + '/' + test + '.js')
        .bundle()
        .pipe(run())
        .on('results', console.log)
        .pipe(process.stdout);      
});
