
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

            $C('btn_prev:bootstrap.Button#size=2,style=success',  {$icon:'chevron-left'})
            .listen('click', function()
            {
                if (btn_size > 0)
                    btn_size--;

                this.parent.forEach(function(button) { button.size(btn_size); });
            });

            // button chevron-right

            $C('btn_next:bootstrap.Button#size=2,style=default', {$icon:'chevron-right'})
            .listen('click', function()
            {
                if (btn_size < 3)
                    btn_size++;

                this.parent.forEach(function(button) { button.size(btn_size); });
            });

            // other styled buttons

            ['default','primary','success','info','warning','danger'].forEach(function(style)
            {
                $C('btn_' + style + ':bootstrap.Button#size=2,style=' + style, {$text:style, $icon:'thumbs-up'})
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
        $$C('bootstrap.BtnGroup', {class: 'btn-group-vertical'}, function(group_vertical)
        {
            $C('bootstrap.Button', 4, {$text: 'Button'});
        });
    });
    
    
    $codebox(
'example.add("bootstrap.BtnGroup", {class: "btn-group-vertical"}, function(group_vertical)\n\
{\n\
    group_vertical.add("Button", 4, {$text: "Button"});\n\
});');


    // Forms
    
    $C('header:h2', {id: 'forms', $text: 'Forms'});
    
    // Basic example
    
    $C('header:h3', {id: 'basic-example', $text: 'Basic example'});
    
    $$C('div', {class:'example top-box'}, function(example)
    {
        $$C('bootstrap.Form');
        
        $$C('bootstrap.FormGroup', function(group)
        {
            $C('label', {$text:'Email address', for:'exampleInputEmail1'});
            $C('input:input', {type:'email', class:'form-control', id:'exampleInputEmail1', placeholder:'Enter email (validation)'});
            var regexp = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
            group.input.listen('keyup', group.input, function()
            {
                if (this._element)
                {
                    if (regexp.test(this._element.value))
                        group.class('', 'has-error');
                    else
                        group.class('has-error');
                }
            });
        });
        
        $$C('bootstrap.FormGroup', function()
        {
            $C('label', {$text:'Password', for:'exampleInputPassword1'});
            $C('input', {type:'password', class:'form-control', id:'exampleInputPassword1', placeholder:'Password'});
        });
        
        $$C('bootstrap.FormGroup', function()
        {
            $C('label', {$text:'File input', for:'exampleInputFile'});
            $C('input', {type:'file', id:'exampleInputFile'});
            $p('Example block-level help text here.', {class:"help-block"});
        });
        
        $C('bootstrap.Button', {type:'submit', $text:'Submit', onclick:'return false;'});
    });
    
    $codebox(
'$$C("bootstrap.Form");\n\
$$C("bootstrap.FormGroup", function(group)\n\
{\n\
    $C("label", {$text:"Email address", for:"exampleInputEmail1"});\n\
    $C("input:input", {type:"email", class:"form-control", id:"exampleInputEmail1", placeholder:"Enter email"});\n\
    \n\
    var regexp = /(?:[a-z0-9!#$%&.../;\n\
    group.input.listen("keyup", group.input, function()\n\
    {\n\
        if (this._element)\n\
        {\n\
            if (regexp.test(this._element.value))\n\
                group.class("", "has-error");\n\
            else\n\
                group.class("has-error");\n\
        }\n\
    });\n\
});');
    
}


createNavigationPanel(body.fill.content_pane);

// Generate document
body.attach();
body.refresh();
body.attachAll();
