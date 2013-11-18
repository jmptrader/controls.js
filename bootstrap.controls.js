//     controls.bootstrap.js
//     purpose: twitter bootstrap VCL for using with controls.js
//     http://aplib.github.io/controls.js/bootstrap.controls-demo.html
//     (c) 2013 vadim b.
//     License: MIT
//
// require doT.js, controls.js


(function() { "use strict";

function Bootstrap(controls) {
    var bootstrap = this;
    var doT = controls.doT;
    bootstrap.VERSION = '0.6.11';
    controls.bootstrap = bootstrap;
    
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
    
    var CONTROL_STYLE = ' default info link success primary warning danger ';
    control_prototype.getControlStyle = function() {
        var parameters = this.parameters,
            cstyle = parameters.style || parameters['/style'];
        
        if (!cstyle)
        for(var prop in parameters)
        if (parameters[prop])
            cstyle = prop;
        
        return cstyle || 'default';
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
            .listen('type', function() {
                this.class('label label-' + this.getControlStyle(), 'label-default label-link label-primary label-success label-info label-warning label-danger');
            });
    };
    Label.prototype = control_prototype;
    Label.template = doT.template(
'<span{{=it.printAttributes()}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</span>');
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
    
        this.listen('type', function() {
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
    DropdownItem.template = doT.template(
'<li id="{{=it.id}}">\
<a{{=it.printAttributes("-id")}}>\
{{? it.attributes.$icon }}<span class="glyphicon glyphicon-{{=it.attributes.$icon}}"></span>&nbsp;{{?}}\
{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}\
</a></li>\n');
    controls.typeRegister('bootstrap.DropdownItem', DropdownItem);
    
    
    // DividerItem
    // 
    //
    function DividerItem(parameters, attributes) {
        this.initialize('bootstrap.DividerItem', parameters, attributes, DividerItem.template)
            .class('divider');
    };
    DividerItem.prototype = control_prototype;
    DividerItem.template = doT.template('<li{{=it.printAttributes()}}></li>');
    controls.typeRegister('bootstrap.DividerItem', DividerItem);
    
    
    // DropdownLink
    // 
    // 
    function DropdownLink(parameters, attributes) {
        this.initialize('bootstrap.DropdownLink', parameters, attributes, DropdownLink.template)
            .class('dropdown');
    };
    DropdownLink.prototype = control_prototype;
    DropdownLink.template = doT.template(
'<div{{=it.printAttributes()}}>\
<a class="dropdown-toggle" data-toggle="dropdown" href="#">\
{{? it.attributes.$icon }}<b class="glyphicon glyphicon-{{=it.attributes.$icon}}"> </b>{{?}}\
{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}\
</a>\n\
{{? (it.controls && it.controls.length > 0) }}\
<ul class="dropdown-menu">\n\
{{~it.controls :value:index}}{{=value.wrappedHTML()}}{{~}}\
</ul>{{?}}</div>\n');
    controls.typeRegister('bootstrap.DropdownLink', DropdownLink);


    //
    function ToggleBtn(parameters, attributes) {
        this.initialize('bootstrap.ToggleBtn', parameters, attributes, ToggleBtn.template)
            .class('btn dropdown-toggle');
    };
    ToggleBtn.prototype = control_prototype;
    ToggleBtn.template = doT.template(
'<a{{=it.printAttributes()}} data-toggle="dropdown" href="#">{{? it.attributes.$icon }}<b class="glyphicon glyphicon-{{=it.attributes.$icon}}"> </b>{{?}}{{? it.attributes.Caret }}<span class="caret"></span>{{?}}{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</a>\n\
{{? (it.controls && it.controls.length > 0) }}\n\
<ul class="dropdown-menu">\n\
{{~it.controls :value:index}}{{=value.wrappedHTML()}}{{~}}\n\
</ul>{{?}}\n');
    controls.typeRegister('bootstrap.ToggleBtn', ToggleBtn);
    
    
    // bootstrap.Button
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
            .listen('type', this, buttonTypeHandler);
    };
    Button.prototype = control_prototype;
    Button.template = function(it) {
        var attrs = it.attributes;
        return '<button type="button"' + it.printAttributes() + '>'
            + (attrs.$icon ? ('<b class="glyphicon glyphicon-' + attrs.$icon + '"></b>') : '')
            + ((attrs.$icon && attrs.$text) ? '&nbsp;' : '')
            + (attrs.$text || '')
            + '</button>';
    };
    controls.typeRegister('bootstrap.Button', Button);
    
    
    // Splitbutton
    //
    function Splitbutton(parameters, attributes) {
        this.initialize('bootstrap.Splitbutton', parameters, attributes, Splitbutton.template)
            .class('btn-group');
         this.btn_class = 'btn btn-' + ((this.getControlStyle() || '') + ' ' + (BUTTON_SIZES[this.getControlStyle()] || '')).trim();
    };
    Splitbutton.prototype = control_prototype;
    Splitbutton.template = function(it) {
var attributes = it.attributes,
out = '<div' + it.printAttributes() + '>\
<button type="button" class="' + it.btn_class + '">'
 + (attributes.$icon ? ('<b class="glyphicon glyphicon-' + attributes.$icon + '"> </b>') : '')
 + (attributes.$text || '')
 + '</button>\
<button type="button" class="' + it.btn_class + ' dropdown-toggle" data-toggle="dropdown"><span class="caret"></span>\
</button>';
if (it.controls.length)
out += '<ul class="dropdown-menu">' + it.printControls() + '</ul>\
</div>';
return out;
};
//    Splitbutton.template = doT.template(
//'<div id="{{=it.id}}" class="btn-group">\
//<button type="button" class="btn btn-primary {{=it.attributes.class}}"{{=it.printAttributes("style")}}>{{=it.attributes.$text}}\
//{{? it.attributes.$icon}}<b class="glyphicon glyphicon-{{=it.attributes.$icon}}"> </b>{{?}}\
//</button>\
//<button type="button" class="btn btn-primary {{=it.attributes.class}} dropdown-toggle" data-toggle="dropdown">\
//<span class="caret"></span>\
//</button>\
//{{? (it.controls && it.controls.length > 0) }}\
//<ul class="dropdown-menu">\
//{{~it.controls :value:index}}{{=value.wrappedHTML()}}{{~}}\
//</ul>{{?}}\
//</div>');
    controls.typeRegister('bootstrap.Splitbutton', Splitbutton);
    
    
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
    TabHeader.template = doT.template(
'<li{{=it.printAttributes()}}>\
<a href={{=it.attributes.$href}} data-toggle="tab">\
{{? it.attributes.$icon}}<b class="glyphicon glyphicon-{{=it.attributes.$icon}}"> </b>{{?}}\
{{? it.attributes.$text}}{{=it.attributes.$text}}{{?}}</a></li>');
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


// A known set of crutches
if (typeof module !== 'undefined' && typeof require === 'function' && module.exports)
    module.exports = new Bootstrap(require('controls'));
else if (typeof define === 'function' && define.amd) {
    var instance;
    define(['controls'], function(controls) { if (!instance) instance = new Bootstrap(controls); return instance; });
}
else {
    if (typeof controls === 'undefined') throw new TypeError('controls.bootstrap.js: controls.js not found!');
    this.bootstrap = new Bootstrap(controls);
}
}).call(function() { return this || (typeof window !== 'undefined' ? window : global); }());
