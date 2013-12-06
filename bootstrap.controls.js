//     controls.bootstrap.js
//     purpose: twitter bootstrap VCL for using with controls.js
//     http://aplib.github.io/controls.js/bootstrap.controls-demo.html
//     (c) 2013 vadim b.
//     License: MIT
//
// require controls.js


(function() { "use strict";

function Bootstrap(controls) {
    var bootstrap = this;
    bootstrap.VERSION = '0.6.15'/*#.#.##*/;
    if (!controls)
        throw new TypeError('controls.bootstrap.js: controls.js not found!');
    if (controls.bootstrap && controls.bootstrap.VERSION >= bootstrap.VERSION)
        return controls.bootstrap;
    controls.bootstrap = this;
    
    var control_prototype = (function() {
        function bootstrap_proto() { }
        bootstrap_proto.prototype = controls.control_prototype;
        return new bootstrap_proto();
    })();
    bootstrap.control_prototype = control_prototype;
    
    // icon()
    control_prototype.icon = function(icon_class) {
        if (arguments.length === 0)
            return this.attributes.$icon;
            
        this.attributes.$icon = icon_class;
        
        if (this._element)
            this.refresh();
        
        return icon_class;
    };
    
    control_prototype._icon = function(icon_class) {
        this.icon(icon_class);
        return this;
    };
    
    control_prototype.getControlStyle = function() {
        var parameters = this.parameters;
        return parameters.style || parameters['/style'] || (parameters.info && 'info') || (parameters.link && 'link') || (parameters.success && 'success')
            || (parameters.primary && 'primary') || (parameters.warning && 'warning') || (parameters.danger && 'danger') || 'default';
    };
    
    var CONTROL_SIZE = {
        'xtra-small':'xtra-small', 'xs':'xtra-small', 'btn-xs':'xtra-small', '-2':'xtra-small',
        'small':'small', 'sm':'small', 'btn-sm':'small', '-1':'small',
        'default':'', '':'', '0':'',
        'large':'large', 'lg':'large', 'btn-lg':'large', '1':'large',
        'xtra-large':'xtra-large', 'xl':'xtra-large', '2':'xtra-large'
    };
    control_prototype.getControlSize = function() {
        var parameters = this.parameters,
            csize = CONTROL_SIZE[parameters.size || parameters['/size']];
        
        if (!csize)
        for(var prop in parameters)
        if (!csize)
            csize = CONTROL_SIZE[prop];
        
        return csize || '';
    };
    
    
    // Label
    // 
    function Label(parameters, attributes) {
        this.initialize('bootstrap.Label', parameters, attributes, Label.template)
            .listen_('type', function() {
                this.class('label label-' + this.getControlStyle(), 'label-default label-link label-primary label-success label-info label-warning label-danger');
            });
    };
    Label.prototype = control_prototype;
    Label.template = function(it) { return '<span' + it.printAttributes() + '>' + (it.attributes.$text || '') + '</span>'; };
    controls.typeRegister('bootstrap.Label', Label);
    
    
    // Panel
    // 
    function Panel(parameters, attributes) {
        this.initialize('bootstrap.Panel', parameters, attributes);
        this.body = this.add('div', {class:'panel-body'});
        Object.defineProperty(this, 'header', { enumerable: true, get: function() {
            var _header = this._header;
            if (!_header) {
                 _header = this.insert(0, 'div', {class:'panel-heading panel-title'});
                 _header._name = 'header';
                 this._header = _header;
            }
            return _header;
        } });
        Object.defineProperty(this, 'footer', { enumerable: true, get: function() {
            var _footer = this._footer;
            if (!_footer) {
                 _footer = this.add('div', {class:'panel-footer'});
                 _footer._name = 'header';
                 this._footer = _footer;
            }
            return _footer;
        } });
    
        this.listen_('type', function() {
            this.class('panel panel-' + this.getControlStyle(), 'panel-default panel-link panel-primary panel-success panel-info panel-warning panel-danger');
        });

        this.text = function(_text) {
            return this.body.text(_text);
        };
        
        if (attributes.$text) {
            this.body.text(attributes.$text);
            attributes.$text = undefined;
        }
    };
    Panel.prototype = control_prototype;
    controls.typeRegister('bootstrap.Panel', Panel);
    
    
    // Dropdowns
    
    // DropdownItem
    // 
    // Attributes:
    // href, $icon, $text
    // 
    //
    function DropdownItem(parameters, attributes /*href $icon $text*/) {
        this.initialize('bootstrap.DropdownItem', parameters, attributes, DropdownItem.template);
    };
    DropdownItem.prototype = control_prototype;
    DropdownItem.template = function(it) {
        var out = '<li id="' + it.id + '"><a' + it.printAttributes('-id') + '>',
            attrs = it.attributes;
        if (attrs.$icon) out += '<span class="glyphicon glyphicon-' + attrs.$icon + '"></span>&nbsp;';
        return out + (it.attributes.$text || '') + '</a></li>';
    };
    controls.typeRegister('bootstrap.DropdownItem', DropdownItem);
    
    
    // DividerItem
    // 
    //
    function DividerItem(parameters, attributes) {
        this.initialize('bootstrap.DividerItem', parameters, attributes, DividerItem.template)
            .class('divider');
    };
    DividerItem.prototype = control_prototype;
    DividerItem.template = function(it) { return '<li' + it.printAttributes() + '></li>'; };
    controls.typeRegister('bootstrap.DividerItem', DividerItem);
    
    
    // DropdownLink
    // 
    // 
    function DropdownLink(parameters, attributes) {
        this.initialize('bootstrap.DropdownLink', parameters, attributes, DropdownLink.template)
            .class('dropdown');
    };
    DropdownLink.prototype = control_prototype;
    DropdownLink.template = function(it) {
        var out = '<div' + it.printAttributes() + '><a class="dropdown-toggle" data-toggle="dropdown" href="#">',
            attrs = it.attributes, ctrls = it.controls;
        if (attrs.$icon) out += '<span class="glyphicon glyphicon-' + attrs.$icon + '"></span>&nbsp;';
        out += (it.attributes.$text || '') + '</a>';
        if (ctrls.length) {
            out += '<ul class="dropdown-menu">';
            for (var i = 0, c = ctrls.length; i < c; i++)
                out += ctrls[i].wrappedHTML();
            out += '</ul>';
        }
        return out + '</div>';
    };
    controls.typeRegister('bootstrap.DropdownLink', DropdownLink);


    //
    function ToggleBtn(parameters, attributes) {
        this.initialize('bootstrap.ToggleBtn', parameters, attributes, ToggleBtn.template)
            .class('btn dropdown-toggle');
    };
    ToggleBtn.prototype = control_prototype;
    ToggleBtn.template = function(it) {
        var out = '<a' + it.printAttributes() + ' data-toggle="dropdown" href="#">',
            attrs = it.attributes, ctrls = it.controls;
        if (attrs.$icon) out += '<span class="glyphicon glyphicon-' + attrs.$icon + '"></span>&nbsp;';
        if (attrs.caret || attrs.Caret) out += '<span class="caret"></span>';
        out += (it.attributes.$text || '') + '</a>';
        if (ctrls.length) {
            out += '<ul class="dropdown-menu">';
            for (var i = 0, c = ctrls.length; i < c; i++)
                out += ctrls[i].wrappedHTML();
            out += '</ul>';
        }
        return out;
    };
    controls.typeRegister('bootstrap.ToggleBtn', ToggleBtn);
    
    
    // bootstrap@Button
    // 
    // Parameters:
    //  style {'default','primary','success','info','warning','danger','link'} - one of the predefined style of button from bootstrap
    //  size {0..3, 'xtra-small', 'small', 'default', 'large'}
    // Attributes:
    //  $text {string} - text
    //  $icon {string) - the name of one of the available bootstrap glyphicon, glass music search etc. See http://glyphicons.getbootstrap.com
    // Example:
    //  controls.create('bootstrap.Button/style=success', {$icon: "glass"});
    //
    var BUTTON_SIZES = { 'xtra-small':'btn-xs', small:'btn-sm', large:'btn-lg' };
    function buttonTypeHandler() {
        this.class('btn btn-' + ((this.getControlStyle() || '') + ' ' + (BUTTON_SIZES[this.getControlSize()] || '')).trim(),
            this.attributes.class ? 'btn-default btn-primary btn-success btn-info btn-warning btn-danger btn-link btn-xs btn-sm btn-lg' : null);
    }
    function Button(parameters, attributes) {
        this.initialize('bootstrap.Button', parameters, attributes, Button.template)
            .listen_('type', buttonTypeHandler);
    };
    Button.prototype = control_prototype;
    Button.template = function(it) {
        var attrs = it.attributes;
        return '<button type="button"' + it.printAttributes() + '>'
            + (attrs.$icon ? ('<span class="glyphicon glyphicon-' + attrs.$icon + '"></span>') : '')
            + ((attrs.$icon && attrs.$text) ? '&nbsp;' : '')
            + (attrs.$text || '')
            + '</button>';
    };
    controls.typeRegister('bootstrap.Button', Button);
    
    
    // Splitbutton
    //
    function Splitbutton(parameters, attributes) {
        this.initialize('bootstrap.SplitButton', parameters, attributes, Splitbutton.template)
            ._class('btn-group')
            ._add('button:bootstrap.Button', {$icon:attributes.$icon})
            ._add('toggle:bootstrap.Button', {class:'dropdown-toggle', 'data-toggle':'dropdown', $text:'<span class="caret"></span>'})
            ._add('items:ul', {class:'dropdown-menu'})
            .listen_('type', function() {
                var btn_class = 'btn btn-' + ((this.getControlStyle() || '') + ' ' + (BUTTON_SIZES[this.getControlStyle()] || '')).trim();
                this.button.class(btn_class);
                this.toggle.class(btn_class);
            });
    };
    Splitbutton.prototype = control_prototype;
    controls.typeRegister('bootstrap.SplitButton', Splitbutton);
    
    
    // BtnGroup
    // 
    //
    function BtnGroup(parameters, attributes) {
        this.initialize('bootstrap.BtnGroup', parameters, attributes, BtnGroup.template)
            .class('btn-group');
    };
    BtnGroup.prototype = control_prototype;
    controls.typeRegister('bootstrap.BtnGroup', BtnGroup);
    
    
    // TabPanelHeader
    // 
    function TabPanelHeader(parameters, attributes) {
        this.initialize('bootstrap.TabPanelHeader', parameters, attributes, TabPanelHeader.template)
            .class('nav nav-tabs tabpanel-header');
    };
    TabPanelHeader.prototype = control_prototype;
    TabPanelHeader.template = function(it) { return '<ul' + it.printAttributes() + '>' + (it.attributes.$text || '') + it.printControls() + '</ul>'; };
    controls.typeRegister('bootstrap.TabPanelHeader', TabPanelHeader);
    
    
    // TabHeader
    // 
    function TabHeader(parameters, attributes) {
        this.initialize('bootstrap.TabHeader', parameters, attributes, TabHeader.template)
            .class('tab-header');
    };
    TabHeader.prototype = control_prototype;
    TabHeader.template = function(it) {
        var attrs = it.attributes;
        return '<li' + it.printAttributes() + '><a href="' + (attrs.$href || '') + '" data-toggle="tab">'
            + (attrs.$icon ? ('<span class="glyphicon glyphicon-' + attrs.$icon + '"></span>') : '')
            + ((attrs.$icon && attrs.$text) ? '&nbsp;' : '')
            + (attrs.$text || '')
            + '</a></li>';
    };
    controls.typeRegister('bootstrap.TabHeader', TabHeader);
    
    
    // TabPanelBody
    // 
    function TabPanelBody(parameters, attributes) {
        this.initialize('bootstrap.TabPanelBody', parameters, attributes)
            .class('tab-content tabpanel-body');
    };
    TabPanelBody.prototype = control_prototype;
    controls.typeRegister('bootstrap.TabPanelBody', TabPanelBody);
    
    
    // TabPage
    // 
    function TabPage(parameters, attributes) {
        this.initialize('bootstrap.TabPage', parameters, attributes)
            .class('tab-pane fade');
    };
    TabPage.prototype = control_prototype;
    controls.typeRegister('bootstrap.TabPage', TabPage);
    
    
    // Form
    // 
    function Form(parameters, attributes) {
        this.initialize('bootstrap.Form', parameters, attributes, Form.template)
            .attr('role', 'form');
    };
    Form.prototype = control_prototype;
    Form.template = function(it) { return '<form' + it.printAttributes() + '>' + it.printControls() + '</form>'; };
    controls.typeRegister('bootstrap.Form', Form);
    
    
    // FormGroup
    // 
    function FormGroup(parameters, attributes) {
        this.initialize('bootstrap.FormGroup', parameters, attributes)
            .class('form-group');
    };
    FormGroup.prototype = control_prototype;
    controls.typeRegister('bootstrap.FormGroup', FormGroup);
    
    
    // Modal
    // 
    function Modal(parameters, attributes) {
        this.initialize('bootstrap.Modal', parameters, attributes, Modal.template)
            ._class('modal fade')
            ._attr('role', 'dialog')
            ._add('header:div', {class:'modal-header'})
            ._add('body:div', {class:'modal-body'})
            ._add('footer:div', {class:'modal-footer'});
        if (!attributes.hasOwnProperty('tabindex'))    attributes.tabindex = -1;
        if (!attributes.hasOwnProperty('aria-hidden')) attributes['aria-hidden'] = true;
    };
    Modal.prototype = control_prototype;
    Modal.template = function(it) {
        return '<div' + it.printAttributes() + '><div class="modal-dialog"><div class="modal-content">' + it.printControls() + '</div></div></div>';
    };
    controls.typeRegister('bootstrap.Modal', Modal);
    
    
    // ControlLabel
    // 
    function ControlLabel(parameters, attributes) {
        this.initialize('bootstrap.ControlLabel', parameters, attributes, ControlLabel.template)
            .class('control-label');
    };
    ControlLabel.prototype = control_prototype;
    ControlLabel.template = function(it) { return '<label' + it.printAttributes() + '>' + (it.attributes.$text || '') + '</label>'; };
    controls.typeRegister('bootstrap.ControlLabel', ControlLabel);
    
    
    // ControlInput
    // 
    function ControlInput(parameters, attributes) {
        var control = new controls['controls.input'](parameters, attributes)
            ._class('form-control');
        control.__type = 'bootstrap.ControlInput';
        return control;
    };
    controls.factoryRegister('bootstrap.ControlInput', ControlInput);
    
    
    // ControlSelect
    // 
    // Attributes:
    //  $data {DataArray}
    //
    function ControlSelect(parameters, attributes) {
        var control = new controls['controls.select'](parameters, attributes)
            ._class('form-control')
            ._style('display:inline-block;');
        control.__type = 'bootstrap.ControlSelect';
        return control;
    };
    controls.factoryRegister('bootstrap.ControlSelect', ControlSelect);
};


    // exports
    if (typeof module !== 'undefined' && module.exports) module.exports = new Bootstrap(require('controls'));
    if (typeof define === 'function' && define.amd) define(['controls'], function(c) { return new Bootstrap(c); });
    if (typeof window !== 'undefined') new Bootstrap(window.controls);
})();
