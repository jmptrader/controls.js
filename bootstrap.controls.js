//     controls.bootstrap.js
//     purpose: twitter bootstrap VCL for using with controls.js
//     http://aplib.github.io/controls.js/bootstrap.controls-demo.html
//     (c) 2013 vadim b.
//     License: MIT
//
// require doT.js, controls.js


(function() { "use strict";

function Bootstrap(controls)
{
    var bootstrap = this;
    var doT = controls.doT;
    bootstrap.VERSION = '0.6.10';
    controls.bootstrap = bootstrap;
    
    var control_prototype = (function()
    {
        function bootstrap_proto() { }
        bootstrap_proto.prototype = controls.control_prototype;
        return new bootstrap_proto();
    })();
    bootstrap.control_prototype = control_prototype;
    
    // icon()
    control_prototype.icon = function(icon_class)
    {
        if (arguments.length === 0)
            return this.attributes.$icon;
            
        this.attributes.$icon = icon_class;
        
        if (this._element)
            this.refresh();
        
        return icon_class;
    };
    
    var CONTROL_STYLE = ' default info link success primary warning danger ';
    control_prototype.getControlStyle = function(parameters, style_enum)
    {
        parameters = parameters || this.parameters;
        style_enum = style_enum || CONTROL_STYLE;
        var cstyle = parameters.style || parameters['/style'];
        
        if (!cstyle)
        for(var prop in parameters)
        {
            var lowercase = prop.toLowerCase();
            if (style_enum.indexOf(lowercase) > 0 && parameters[prop] === true)
                cstyle = lowercase;
        }
        
        return cstyle || 'default';
    };
    
    var CONTROL_SIZE = ' large small ';
    control_prototype.getControlSize = function(parameters, size_enum)
    {
        parameters = parameters || this.parameters;
        size_enum = size_enum || CONTROL_SIZE;
        var csize = parameters.size || parameters['/size'];
        
        if (!csize)
        for(var prop in parameters)
        {
            var lowercase = prop.toLowerCase();
            if (size_enum.indexOf(lowercase) > 0 && parameters[prop] === true)
                csize = lowercase;
        }
        
        return csize || '';
    };
    
    
    // Label
    // 
    function Label(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Label', parameters, attributes, Label.template);
         
        this.listen('type', function()
        {
            this.class('label label-' + this.getControlStyle(), 'label-default label-link label-primary label-success label-info label-warning label-danger');
        });
    };
    Label.prototype = control_prototype;
    Label.template = doT.template(
'<span{{=it.printAttributes()}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</span>');
    controls.typeRegister('bootstrap.Label', Label);
    
    
    // Panel
    // 
    function Panel(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Panel', parameters, attributes);
        this.body = this.add('div', {class:'panel-body'});
        Object.defineProperty(this, 'header', { enumerable: true, get: function()
        {
            var _header = this._header;
            if (!_header)
            {
                 _header = this.insert(0, 'div', {class:'panel-heading panel-title'});
                 _header._name = 'header';
                 this._header = _header;
            }
            return _header;
        } });
        Object.defineProperty(this, 'footer', { enumerable: true, get: function()
        {
            var _footer = this._footer;
            if (!_footer)
            {
                 _footer = this.add('div', {class:'panel-footer'});
                 _footer._name = 'header';
                 this._footer = _footer;
            }
            return _footer;
        } });
    
        this.listen('type', function()
        {
            this.class('panel panel-' + this.getControlStyle(), 'panel-default panel-link panel-primary panel-success panel-info panel-warning panel-danger');
        });

        this.text = function(_text)
        {
            return this.body.text(_text);
        };
        
        if (attributes.$text)
        {
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
    function DropdownItem(parameters, attributes /*href $icon $text*/)
    {
        controls.controlInitialize(this, 'bootstrap.DropdownItem', parameters, attributes, DropdownItem.template);
    };
    DropdownItem.prototype = control_prototype;
    DropdownItem.template = doT.template(
'<li id="{{=it.id}}">\
<a data-toggle="tab"{{=it.printAttributes("-id")}}>\
{{? it.attributes.$icon }}<span class="glyphicon glyphicon-{{=it.attributes.$icon}}"></span>&nbsp;{{?}}\
{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}\
</a></li>\n');
    controls.typeRegister('bootstrap.DropdownItem', DropdownItem);
    
    
    // DividerItem
    // 
    //
    function DividerItem(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.DividerItem', parameters, attributes, DividerItem.template);
        this.class('divider');
    };
    DividerItem.prototype = control_prototype;
    DividerItem.template = doT.template('<li{{=it.printAttributes()}}></li>');
    controls.typeRegister('bootstrap.DividerItem', DividerItem);
    
    
    // DropdownLink
    // 
    // 
    function DropdownLink(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.DropdownLink', parameters, attributes, DropdownLink.template);
        this.class('dropdown');
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
    function ToggleBtn(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.ToggleBtn', parameters, attributes, ToggleBtn.template);
        this.class('btn dropdown-toggle');
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
    bootstrap.BUTTON_SIZES =
    {
        '0':'btn-xs', 'btn-xs':'btn-xs', 'xtra-small':'btn-xs',
        '1':'btn-sm', 'btn-sm':'btn-sm', 'small':'btn-sm',
        '2':'',       'default':'',
        '3':'btn-lg', 'btn-lg':'btn-lg', 'large':'btn-lg'
    };
    function Button(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Button', parameters, attributes, Button.template);
        
        this.listen('type', function()
        {
            var style = this.parameter('style') || 'default';
            Object.keys(parameters).some(function(param) { if (CONTROL_STYLE.indexOf(param) >= 0) style = param; });
            
            this.class('btn btn-' + style, 'btn-default btn-primary btn-success btn-info btn-warning btn-danger btn-link');
            
            var size = bootstrap.BUTTON_SIZES['' + this.parameter('size') || '2'];
            this.class(size, 'btn-xs btn-sm btn-lg');
        });
        
        // get/set size
        this.size = function(size)
        {
            if (arguments.length > 0)
            {
                this.parameters.size = size;
                this.raise('type');
            }
            
            return this.parameter('size');
        };
    };
    Button.prototype = control_prototype;
    Button.template = function(it) {
        var attrs = it.attributes;
        return '<button' + it.printAttributes() + '>'
            + (attrs.$icon ? ('<b class="glyphicon glyphicon-' + attrs.$icon + '"></b>') : '')
            + ((attrs.$icon && attrs.$text) ? '&nbsp;' : '')
            + (attrs.$text || '')
            + '</button>';
    };
    controls.typeRegister('bootstrap.Button', Button);
    
    
    // Splitbutton
    //
    function Splitbutton(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Splitbutton', parameters, attributes, Splitbutton.template);
    };
    Splitbutton.prototype = control_prototype;
    Splitbutton.template = doT.template(
'<div id="{{=it.id}}" class="btn-group">\
<button type="button" class="btn btn-primary {{=it.attributes.class}}"{{=it.printAttributes("style")}}>{{=it.attributes.$text}}\
{{? it.attributes.$icon}}<b class="glyphicon glyphicon-{{=it.attributes.$icon}}"> </b>{{?}}\
</button>\
<button type="button" class="btn btn-primary {{=it.attributes.class}} dropdown-toggle" data-toggle="dropdown">\
<span class="caret"></span>\
</button>\
{{? (it.controls && it.controls.length > 0) }}\
<ul class="dropdown-menu">\
{{~it.controls :value:index}}{{=value.wrappedHTML()}}{{~}}\
</ul>{{?}}\
</div>');
    controls.typeRegister('bootstrap.Splitbutton', Splitbutton);
    
    
    // BtnGroup
    // 
    //
    function BtnGroup(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.BtnGroup', parameters, attributes, BtnGroup.template);
        
        if (!this.attributes.class || this.attributes.class.indexOf('btn-group') < 0)
            this.class('btn-group');
    };
    BtnGroup.prototype = control_prototype;
    controls.typeRegister('bootstrap.BtnGroup', BtnGroup);
    
    
    // TabPanelHeader
    // 
    function TabPanelHeader(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.TabPanelHeader', parameters, attributes, TabPanelHeader.template);
        this.class('nav nav-tabs tabpanel-header');
    };
    TabPanelHeader.prototype = control_prototype;
    TabPanelHeader.template = doT.template(
'<ul{{=it.printAttributes()}}>\
{{? it.attributes.$text}}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.wrappedHTML()}}{{~}}\
</ul>');
    controls.typeRegister('bootstrap.TabPanelHeader', TabPanelHeader);
    
    
    // TabHeader
    // 
    function TabHeader(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.TabHeader', parameters, attributes, TabHeader.template);
        this.class('tab-header');
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
    function TabPanelBody(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.TabPanelBody', parameters, attributes);
        this.class('tab-content tabpanel-body');
    };
    TabPanelBody.prototype = control_prototype;
    controls.typeRegister('bootstrap.TabPanelBody', TabPanelBody);
    
    
    // TabPage
    // 
    function TabPage(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.TabPage', parameters, attributes);
        this.class('tab-pane fade');
    };
    TabPage.prototype = control_prototype;
    controls.typeRegister('bootstrap.TabPage', TabPage);
    
    
    // Form
    // 
    function Form(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Form', parameters, attributes, Form.template);
        attributes.role = 'form';
    };
    Form.prototype = control_prototype;
    Form.template = doT.template(
'<form{{=it.printAttributes()}}>\
{{? (it.controls && it.controls.length > 0) }}{{~it.controls :value:index}}{{=value.wrappedHTML()}}{{~}}{{?}}\
</form>');
    controls.typeRegister('bootstrap.Form', Form);
    
    
    // FormGroup
    // 
    function FormGroup(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.FormGroup', parameters, attributes);
        this.class('form-group');
    };
    FormGroup.prototype = control_prototype;
    controls.typeRegister('bootstrap.FormGroup', FormGroup);
    
    

    
    // ControlLabel
    // 
    function ControlLabel(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.ControlLabel', parameters, attributes, ControlLabel.template);
        this.class('control-label');
    };
    ControlLabel.prototype = control_prototype;
    ControlLabel.template = doT.template(
'<label{{=it.printAttributes()}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</label>');
    controls.typeRegister('bootstrap.ControlLabel', ControlLabel);
    
    
    // ControlLabel
    // 
    function ControlInput(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.ControlInput', parameters, attributes, ControlInput.template);
        this.class('form-control');
        
        Object.defineProperty(this, 'value',
        {
            get: function() {
                return this.attributes.value;
            },
            set: function(value) {
                var element = this._element;
                if (element)
                    element.value = value;
                else
                    this.attributes.value = value;
            }
        });
        
        this.listen('change', function() {
            this.attributes.value = this.element.value;
        });
        
        this.listen('element', function(element) {
            if (element)
                element.value = this.attributes.value;
        });
    };
    ControlInput.prototype = control_prototype;
    ControlInput.template = doT.template(
'<input{{=it.printAttributes()}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</input>');
    controls.typeRegister('bootstrap.ControlInput', ControlInput);
    
    
    // ControlSelect
    // 
    // Attributes:
    //  $data {DataArray}
    //
    function ControlSelect(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.ControlSelect', parameters, attributes, ControlSelect.template, ControlSelect.inner_template);
        this.class('form-control');
        this.class('display:inline-block;');
        
        if (attributes.hasOwnProperty('$data'))
            this.bind(controls.create('DataArray', {$data: attributes.$data}));
        else
            this.bind(controls.create('DataArray'));
        
        // chenge event routed from data object
        this.listen('data', this.refreshInner);
        
        Object.defineProperty(this, 'value',
        {
            get: function() {
                return this.attributes.value;
            },
            set: function(value) {
                var element = this._element;
                if (element)
                    element.value = value;
                else
                    this.attributes.value = value;
            }
        });
        
        this.listen('change', function() {
            this.attributes.value = this.element.value;
        });
        
        this.listen('element', function(element) {
            if (element)
                element.value = this.attributes.value;
        });
    };
    ControlSelect.prototype = control_prototype;
    ControlSelect.template = doT.template(
'<select{{=it.printAttributes()}}>\
{{?it.data}}{{~it.data :value:index}}<option value={{=value}}>{{=value}}</option>{{~}}{{?}}\
</select>');
    ControlSelect.inner_template = doT.template('{{?it.data}}{{~it.data :value:index}}<option value={{=value}}>{{=value}}</option>{{~}}{{?}}');
    controls.typeRegister('bootstrap.ControlSelect', ControlSelect);
};


// A known set of crutches
if (typeof module !== 'undefined' && typeof require === 'function' && module.exports)
    module.exports = new Bootstrap(require('controls'));
else if (typeof define === 'function' && define.amd)
{
    var instance;
    define(['controls'], function(controls) { if (!instance) instance = new Bootstrap(controls); return instance; });
}
else
{
    if (typeof controls === 'undefined') throw new TypeError('controls.bootstrap.js: controls.js not found!');
    this.bootstrap = new Bootstrap(controls);
}
}).call(this);
