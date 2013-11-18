# controls.js
#### framework for dynamic html documents and UI solutions, javascript templating
[![NPM version](https://badge.fury.io/js/controlsjs.png)](http://badge.fury.io/js/controlsjs)

controls.js - framework for a visual and data components  
bootstrap.controls.js - WCL based on bootstrap and controls.js

http://aplib.github.io/controls.js/
[Simple Markdown site template](http://aplib.github.io/markdown-site-template/)

##Get started  

### Installation

1. Download from GitHub
2. npm install controlsjs

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
    <html lang="en-US">
    <head>
        <meta charset="utf-8">
        <script src="controls.browserify.js"></script>
        <!-- non-content scripts allowed in the header -->
        <script type="text/javascript">
            window.addEventListener('load', function() {
                var body = controls.create('body');
                body.add('h1', {$text: 'Hello World!'});
                body.attach();
                body.refresh();
            });
        </script>
    </head>
    <body>
    </body>
    </html>


    <!DOCTYPE html>
    <html lang="en-US">
    <head>
        <meta charset="utf-8">
        <script src="controls.browserify.js"></script>
    </head>
    <body>
    <!-- content scripts must be in the body -->
    <script type="text/javascript">
        var body = controls.create('body');
        body.add('h1', {$text: 'Hello World!'});
        document.write(body.innerHTML());
        body.attachAll();
    </script>
    </body>
    </html>

