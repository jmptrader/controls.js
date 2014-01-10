
function h1Ref(text, href) {
    return controls.create('a', {href:href})
        .add('h1`btn-primary border-radius:4px; padding:12px; display:inline-block;', text);
}

function refLabels(refs) {
    var html = '';
    for(var i = 0, c = refs.length; i < c; i+=3)
        html += '<a href="' + refs[i+2] + '" class="label label-' + refs[i+1] + '">' + refs[i] + '</a>&nbsp;&nbsp;';
    return controls.create(html);
}

function codebox(content, _class) {
    //return controls.create('div`codebox ' + (_class || 'box'), '<pre><code>' + controls.encodeHTML(content) + '</code></pre>');
    return controls.create('<div class="codebox ' + (_class || 'box') +'"><pre><code>' + controls.encodeHTML(content) + '</code></pre></div>');
}



// typical document layout
function createDocumentStructure() {
    var cbody = controls.create('body');
    cbody.add(['top:container', 'header:container', 'left:container', 'fill:container', 'right:container', 'footer:container', 'bottom:container']);
    cbody.header.add('header_pane:div`header-pane');
    cbody.left.add('nav_wrapper:div`nav-pane col-sm-3');
    cbody.fill.add('content_pane:div`content-pane col-sm-9');
    return cbody;
}

// Create left side navigation panel
function createNavigationPanel(cbody, content_pane) {

    var navlist = cbody.left.nav_wrapper.add('navlist:list`nav navlist');
    navlist.listen('element', function(element) {
        if (element) {
            var q = $(element);
            q.affix({ offset: q.offset() });
        }
    });
    
    if (content_pane.nodeType) // from dom
    {
        $(content_pane).children('h1,h2,h3').each(function(i,header) {
            navlist.add('a', header.innerHTML, {href:'#' + header.id});
        });
        
        navlist.refresh();
    }
    else // from om
    {
        // nav elements:
        content_pane.each(function(header) {
            if (header.__type === 'controls.h3')
                navlist.add('a', header.text(), {href:'#' + header.id});
        });
    }
}

