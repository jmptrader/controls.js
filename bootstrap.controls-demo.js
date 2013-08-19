
var body = controls.create('body');
body.add(['top:Container', 'header:Container', 'left:Container', 'fill:Container', 'right:Container', 'footer:Container', 'bottom:Container']);

// header
with(body.header.$builder())
{
    $$C( 'header_pane:div', {class:'header-pane'});
    
    $h1ref( 'bootstrap + controls.js', 'bootstrap.controls-demo.html');
    $p( 'under development');
    $reflabels(['GitHub', 'default', 'https://github.com/aplib/controls.js',      'controls.js Intro', 'default', 'index.html']);
}


//body.add('select:bootstrap.Select', {$data:[1,2,3]});

// document content
with(body.fill.$builder())
{
    $$C('content_pane:div', {class:'content-pane col-sm-9'});
    
    $C('h2', {id:'bootstrap-controls', $text:'Bootstrap controls'});
    
    ////////////////////////////////////////////////////////////////////////////
    // Buttons                                                                //
    ////////////////////////////////////////////////////////////////////////////

    // "Buttons, size and styles"
    
    $C('h3', {id:'buttons-size-and-styles', $text:'Buttons, size and styles'});
    
    $$C('div', {class:'example top-box'}, function(example)
    {
        // button group
        $$C('btngroup:bootstrap.BtnGroup', function(btngroup)
        {
            var btn_size = 2;
    
            // button chevron-left

            $C('btn_prev:Button#size=2,style=success',  {$icon:'chevron-left'})
            .listen('click', function()
            {
                if (btn_size > 0)
                    btn_size--;

                this.parent.forEach(function(button) { button.size(btn_size); });
            });

            // button chevron-right

            $C('btn_next:Button#size=2,style=default', {$icon:'chevron-right'})
            .listen('click', function()
            {
                if (btn_size < 3)
                    btn_size++;

                this.parent.forEach(function(button) { button.size(btn_size); });
            });

            // other styled buttons

            ['default','primary','success','info','warning','danger'].forEach(function(style)
            {
                $C('btn_' + style + ':Button#size=2,style=' + style, {$text:style, $icon:'thumbs-up'})
                .listen('click', function()
                {
                    alert('Button style: ' + style);
                });
            });
        });
        
        $C('btn_link:bootstrap.Button#size=2,style=link', {$text:'link', $icon:'thumbs-up', style:'float:none;'})
        .listen('click', function()
        {
            alert('Button style: link');
        });
    });
    
    $codebox(
'example.add("btn_prev:Button#size=2,style=success",  {$icon:"chevron-left"})\n\
.listen("click", function()\n\
{\n\
    if (btn_size > 0)\n\
        btn_size--;\n\
\n\
    this.parent.forEach(function(button) { button.size(btn_size); });\n\
});');
    
    // "Vertical button group"
    
    $C('header:h3', {id: 'vertical-button-group', $text: 'Vertical button group'});
    
    $$C('div', {class:'example top-box'}, function(example)
    {
        $$C('bootstrap.BtnGroup', {class: 'btn-group-vertical', style:'display:inline-block;'}, function(group_vertical)
        {
            $C('Button', 4, {$text: 'Button'});
        });
    });
    
    
    $codebox(
'example.add("bootstrap.BtnGroup", {class: "btn-group-vertical"}, function(group_vertical)\n\
{\n\
    group_vertical.add("Button", 4, {$text: "Button"});\n\
});');

}





////////////////////////////////////////////////////////////////////////////////
// Layout                                                                     //
////////////////////////////////////////////////////////////////////////////////

//body.add('layout:Layout#float=left');
//
//// 6 x ButtonsDemo
//var size = 100;
//body.layout.add('UserControl', 6, function(demo)
//{
////    demo.style('border:silver solid 1px; transition: background 1s; margin:15px; width:' + size + 'px; height:' + size + 'px;');
////    demo.next(); // public method
//    size +=16;
//});
//setInterval(function()
//{
//    body.layout.forEach(function(control)
//    {
//        control.element().style['background-color'] = '#' + (Math.random().toString(16).substr(2,3));
////        control.$.height(control.$.height() + 3*(Math.random() - 0.5));
//        
//    });
//}, 3000);

createNavigationPanel(body.fill.content_pane);

// Generate document

body.attach();
body.refresh();
body.attachAll();
