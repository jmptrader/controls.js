
// define $builder commands

controls.defCommand('$h1ref', function(text, href)
{
    this.$C( 'header:a', {href:href} )
    .add( 'h1', {$text:text, class:'btn-primary', style:'border-radius:4px; padding:12px; display:inline-block;'} );
});

controls.defCommand('$reflabels', function(refs)
{
    var html = '';
    for(var i = 0, c = refs.length; i < c; i+=3)
        html += '<a href="' + refs[i+2] + '" class="label label-' + refs[i+1] + '">' + refs[i] + '</a>&nbsp;&nbsp;';
    this.$X(html);
});

controls.defCommand('$codebox', function(content, _class)
{
    return this.$X('<div class="codebox ' + (_class || 'box') +'"><pre><code>' + this.$encode(content) + '</code></pre></div>');
});


// typical document layout
function createDocumentStructure()
{
    var body = controls.create('body');
    body.add(['top:Container', 'header:Container', 'left:Container', 'fill:Container', 'right:Container', 'footer:Container', 'bottom:Container']);
    body.header.add('header_pane:div', {class:'header-pane'});
    body.left.add('nav_wrapper:div', {class:'nav-pane col-sm-3'});
    body.fill.add('content_pane:div', {class:'content-pane col-sm-9'});
    return body;
}

// Create left side navigation panel
function createNavigationPanel(content_pane) {
with(body.left.nav_wrapper.$builder())
{
    // nav list:
    $$C('nav_list:List', {class:'nav navlist'})
    .listen('element', function(element)
    {
        if (element)
            this.$.affix({ offset: this.$.offset() });
    });
    
    if (content_pane.nodeType) // from dom
    {
        $(content_pane).children('h1,h2,h3').each(function(i,header)
        {
            $C('a', {href:'#' + header.id, $text:header.innerHTML});
        });
        
        body.left.nav_wrapper.refresh();
    }
    else // from om
    {
        // nav elements:
        content_pane.forEach(function(header)
        {
            if (header.__type === 'controls.Heading' && header.parameter('level') === '3')
                $C('a', {href:'#' + header.id, $text:header.text()});
        });
    }
}}

