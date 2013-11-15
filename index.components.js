
function h1Ref(text, href) {
    return controls.create('a', {href:href})
        ._add('h1', {$text:text, class:'btn-primary', style:'border-radius:4px; padding:12px; display:inline-block;'});
}

function refLabels(refs) {
    var html = '';
    for(var i = 0, c = refs.length; i < c; i+=3)
        html += '<a href="' + refs[i+2] + '" class="label label-' + refs[i+1] + '">' + refs[i] + '</a>&nbsp;&nbsp;';
    return controls.text(html);
}

function codebox(content, _class) {
    return controls.text('<div class="codebox ' + (_class || 'box') +'"><pre><code>' + controls.encodeHTML(content) + '</code></pre></div>');
}



// typical document layout
function createDocumentStructure() {
    var cbody = controls.create('body');
    cbody.add(['top:Container', 'header:Container', 'left:Container', 'fill:Container', 'right:Container', 'footer:Container', 'bottom:Container']);
    cbody.header.add('header_pane:div', {class:'header-pane'});
    cbody.left.add('nav_wrapper:div', {class:'nav-pane col-sm-3'});
    cbody.fill.add('content_pane:div', {class:'content-pane col-sm-9'});
    return cbody;
}

// Create left side navigation panel
function createNavigationPanel(cbody, content_pane) {

    var navlist = cbody.left.nav_wrapper.add('navlist:List', {class:'nav navlist'});
    navlist.listen('element', function(element) {
        if (element) {
            var q = $(element);
            q.affix({ offset: q.offset() });
        }
    });
    
    if (content_pane.nodeType) // from dom
    {
        $(content_pane).children('h1,h2,h3').each(function(i,header) {
            navlist.add('a', {href:'#' + header.id, $text:header.innerHTML});
        });
        
        navlist.refresh();
    }
    else // from om
    {
        // nav elements:
        content_pane.each(function(header) {
            if (header.__type === 'controls.h3')
                navlist.add('a', {href:'#' + header.id, $text:header.text()});
        });
    }
}

