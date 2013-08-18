
controls.defCommand_Func('$codebox', function(content, _class) { return this.$X('<div class="codebox ' + (_class || 'box') +'"><pre><code>' + this.$encode(content) + '</code></pre></div>'); });

// user control example

function UserControl(parameters, attributes)
{
    controls.controlInitialize(this, 'UserControl', parameters, attributes);
    
    this.style('width:100px; height:80px; display:inline-block; margin-right:8px; background-color:#' + (Math.random().toString(16).substr(2,3)));
    
    this.add('button:bootstrap.Button#style=default', {$text:'OK'});
    this.button.listen('click', function()
    {
        alert('Button-click!');
    });
}
UserControl.prototype = controls.control_prototype;
controls.typeRegister('UserControl', UserControl);


// top body layout
var body = controls.create('body');
body.add(['top:Container', 'header:Container', 'left:Container', 'fill:Container', 'right:Container', 'footer:Container', 'bottom:Container']);

// header panel
with(body.header.$builder())
{
    $$C( 'header_pane:div', {class:'header-pane'} );
    
    $C( 'header:a', {href:'http://aplib.github.io/controls.js/'} )
    .add( 'h1', {$text:'controls.js', class:'btn-primary', style:'border-radius:4px; background-color1:#2b3ef4; padding:12px; display:inline-block;'} );
    $p( 'for dynamic html documents and UI solutions' );
    
    // refs:
    $X('\
<a href="https://github.com/aplib/controls.js" class="label label-default">GitHub</a>\
&nbsp;&nbsp;\
<a href="https://github.com/aplib/controls.js/archive/controls.js-v0.1.zip" class="label label-default">Download v0.1</a>\
&nbsp;&nbsp;\
<a href="controls+bootstrap-demo.html" class="label label-default">Bootstrap 3 Demo</a>');
}

// document content
with(body.fill.$builder())
{
    $$C('content_pane:div', {class:'content-pane col-sm-9'});
 
    ////////////////////////////////////////////////////////////////////////////
    // Concepts                                                               //
    ////////////////////////////////////////////////////////////////////////////
    
    $C('h2', {id:'controls-js-concepts', $text:'Concepts'});
    
    
    // "Code first, both server-side or client-side html code generation"
    
    $C('h3', {id:'code-first', $text:'Code first, both server-side and client-side html code generation'});
    $codebox(
'var body = controls.create("body");\n\
body.add(["top:Container", "left:Container", "fill:Container"]);\n\
\n\
...\n\
\n\
with(body.fill.$builder())\n\
{\n\
    $$C("content_pane:div", {class:"content-pane col-sm-9"});\n\
    $C("h2", {id: "lorem-ipsum-group", $text: "Lorem ipsum"});\n\
    $X("<p>Lorem ipsum dolor sit amet</p>");\n\
    $p("Lorem ipsum dolor sit amet");\n\
}\n\
\n\
createNavigationPanel(body.fill.content_pane);\n\
\n\
body.attach(); body.refresh(); // document.body.outerHTML = body.outerHTML(); \n\
body.attachAll();');


    // "JavaScript controls is used for code generation and managing DOM elements"
    
    $C('h3', {id:'full-controls', $text:'JavaScript controls is used for managing DOM elements'});
    $codebox(
'var lorem = menu.add("DropdownItem", {$text="Lorem ipsum", class="unchecked"});\n\
\n\
> lorem.class("checked");');
    
    
    
    // "Extendable DSL"
    
    $C('h3', {id:'dsl', $text:'Extendable DSL'});
    $codebox(
'\
controls.defCommand_Func("$codebox", function(content, _class) { ... });\n\
\n\
with(body.fill.$builder())\n\
{\n\
    $codebox("Lorem ipsum dolor sit amet");\n\
}\n\
');
    
    
    // "Structured and reusable code"
    
    $C('h3', {id:'code-reuse', $text:'Structured and reusable code'});
    
    $$C('div', {class:'example top-box'}, function(example)
    {
        $C("UserControl", 5);
    });
    
    $codebox(
'function UserControl(parameters, attributes)\n\
{\n\
    controls.controlInitialize(this, "UserControl", parameters, attributes);\n\
\n\
    this.style("background-color:#" + (Math.random().toString(16).substr(2,3)));\n\
\n\
    this.add("OK:bootstrap.Button", {$text:"OK"})\n\
    .listen("click", function()\n\
    {\n\
        alert("Button-click!");\n\
    });\n\
}');

    
    // "Inversion of control"
    
    $C('h3', {id:'inversion-of-control', $text:'Inversion of control'});
    
    $codebox(
'\controls.typeRegister("bootstrap.Button#style=success", UserControl);\n\
...\n\
> var button = example.add("bootstrap.Button#size=2,style=success");');
    $p('The combination of type name and parameters (where parameters may be inheritable) resoves to the specific type of the object in the runtime. IoC allows to\
 override the details of the behavior of existing systems without modifying their code. For example, it will organize a versioning\
 components in the design, switching visual themes at runtime or unbreakable changes at service.');

    
    
    // Minimizing manipulation of the DOM
    
    $C('h3', {id:'minimizing-manipulation-of-the-DOM', $text:'Minimizing manipulation of the DOM'});
    
    $p('It is preferable not to store data and other information in DOM, except when it leads to simplification and readability.');
}







createNavigationPanel(body.fill.content_pane);

// Generate document

body.attach();
body.refresh();
body.attachAll();




function createNavigationPanel(content_pane) {
with(body.left.$builder())
{
    $$C('nav_wrapper:div', {class:'nav-pane col-sm-3'});
    $$C('nav_list:ul', {class:'nav navlist'}, function(nav_list)
    {
        content_pane.forEach(function(header)
        {
            if (header.__type === 'controls.Heading' && header.parameter('level') === '3')
            {
                $T('<li><a href="#' + header.id + '">' + header.text() + '</a></li>');
            }
        });

        nav_list.listen('element', function(element)
        {
            if (element)
                nav_list.$.affix({ offset: nav_list.$.offset() });
        });
    });
}}



