# controls.js


controls.js 
Framework for a visual and data components.

bootstrap.controls.js
WCL based on bootstrap and controls.js

see
http://aplib.github.io/controls.js/


##Get started  

### files

controls.js - development version with comments, requre doT.js  
controls.min.js - compressed controls.js, requre doT.js  

Include the following code in your head tag:

    <script src="doT.js"></script>
    <script src="controls.js"></script>

To simplify the first start i compile doT.js and controls.js into a single file:

controls.browserify.js     - bundled with doT  
controls.browserify.min.js - compressed  

    <script src="controls.browserify.js"></script>

### Hello World!

    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <script src="controls.browserify.js"></script>
    </head>
    <body>
        <script>
            var body = controls.create('body');
            body.add('h1', {$text:'Hello World!'});

            body.attach();
            body.refresh();
            body.attachAll();
        </script>
    </body>
    </html>