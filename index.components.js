
// define $builder commands

controls.defCommand('$h1ref', function(text, href)
{
    this.$C( 'header:a', {href:href} )
    .add( 'h1', {$text:text, class:'btn-primary', style:'border-radius:4px; background-color1:#2b3ef4; padding:12px; display:inline-block;'} );
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

// Create left navigation panel
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



