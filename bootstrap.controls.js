////////////////////////////////////////////////////////////////////////////////
//     controls.bootstrap.js 0.1
//     purpose: twitter bootstrap VCL for using with controls.js
//     status: proposal, example, prototype, under development
//     I need your feedback, any feedback
//     http://aplib.github.io/controls.js/controls+bootstrap-demo.html
//     (c) 2013 vadim baklanov
//     License: MIT
//
// require doT.js, controls.js


(function() { "use strict";

function Bootstrap(doT, controls)
{
    var bootstrap = this;
    bootstrap.VERSION = '0.1';
    
    bootstrap.control_prototype = (function()
    {
        function bootstrap_proto() { }
        bootstrap_proto.prototype = controls.control_prototype;
        return new bootstrap_proto();
    })();
    
    // icon()
    bootstrap.control_prototype.icon = function(icon_class)
    {
        if (arguments.length === 0)
            return this.attributes.$icon;
            
        this.attributes.$icon = icon_class;
        
        if (this._element)
            this.refresh();
        
        return icon_class;
    };
    
    // Dropdowns http://getbootstrap.com/components/#dropdowns
    
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
    DropdownItem.prototype = bootstrap.control_prototype;
    DropdownItem.template = doT.template(
'<li id="{{=it.id}}">\
<a data-toggle="tab"{{=it.printAttributes("-id")}}>\
{{? it.attributes.$icon }}<span class="{{=it.attributes.$icon}}"></span>&nbsp;{{?}}\
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
    DividerItem.prototype = bootstrap.control_prototype;
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
    DropdownLink.prototype = bootstrap.control_prototype;
    DropdownLink.template = doT.template(
'<div{{=it.printAttributes()}}>\
<a class="dropdown-toggle" data-toggle="dropdown" href="#">\
{{? it.attributes.$icon }}<b class="{{=it.attributes.$icon}}"> </b>{{?}}\
{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}\
</a>\n\
{{? (it.controls && it.controls.length > 0) }}\
<ul class="dropdown-menu">\n\
{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}\
</ul>{{?}}</div>\n');
    controls.typeRegister('bootstrap.DropdownLink', DropdownLink);


    //
    function ToggleBtn(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.ToggleBtn', parameters, attributes, ToggleBtn.template);
        this.class('btn dropdown-toggle');
    };
    ToggleBtn.prototype = bootstrap.control_prototype;
    ToggleBtn.template = doT.template(
'<a{{=it.printAttributes()}} data-toggle="dropdown" href="#">{{? it.attributes.$icon }}<b class="{{=it.attributes.$icon}}"> </b>{{?}}{{? it.attributes.Caret }}<span class="caret"></span>{{?}}{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</a>\n\
{{? (it.controls && it.controls.length > 0) }}\n\
<ul class="dropdown-menu">\n\
{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}\n\
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
            this.class('btn btn-' + style, 'btn-default btn-primary btn-success btn-info btn-warning btn-danger btn-link');
            
            var size = bootstrap.BUTTON_SIZES['' + this.parameter('size') || '2'];
            this.class(size, 'btn-xs btn-sm btn-lg');
        });
        
        // get/set size
        this.size = function(size)
        {
            if (arguments.length > 0)
            {
                this.parameters['#size'] = size;
                this.raise('type');
            }
            
            return this.parameter('size');
        };
    };
    Button.prototype = bootstrap.control_prototype;
    Button.template = doT.template(
'<button{{=it.printAttributes()}} href="#">\
{{? it.attributes.$icon }}<b class="glyphicon glyphicon-{{=it.attributes.$icon}}"> </b>{{?}}\
{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}\
</button>');
    controls.typeRegister('bootstrap.Button', Button);
    
    
    // Splitbutton
    //
    function Splitbutton(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Splitbutton', parameters, attributes, Splitbutton.template);
    };
    Splitbutton.prototype = bootstrap.control_prototype;
    Splitbutton.template = doT.template(
'<div id="{{=it.id}}" class="btn-group">\
<button type="button" class="btn btn-primary {{=it.attributes.class}}"{{=it.printAttributes("style")}}>{{=it.attributes.$text}}\
{{? it.attributes.$icon }}<b class="{{=it.attributes.$icon}}"> </b>{{?}}\
</button>\
<button type="button" class="btn btn-primary {{=it.attributes.class}} dropdown-toggle" data-toggle="dropdown">\
<span class="caret"></span>\
</button>\
{{? (it.controls && it.controls.length > 0) }}\
<ul class="dropdown-menu">\
{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}\
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
    BtnGroup.prototype = bootstrap.control_prototype;
    controls.typeRegister('bootstrap.BtnGroup', BtnGroup);


    // bootstrap.Select
    //
    function Select(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Select', parameters, attributes, Select.template);
        this.class('form-control');
        
        var dao_attributes = {};
        // $data argument
        var $data = attributes.$data;
        if ($data)
        {
            dao_attributes.$data = $data;
            delete attributes.$data;
        }
        this.bind(controls.create('DataArray', dao_attributes));
        
        this.listen('data', this.refreshInner);
    };
    Select.prototype = bootstrap.control_prototype;
    Select.template = doT.template(
'<select{{=it.printAttributes()}}>\
{{?it.data}}{{~it.data :value:index}}<option value={{=value}}>{{=value}}</option>{{~}}{{?}}\
</select>');
    Select.inner_template = doT.template('{{?it.data}}{{~it.data :value:index}}<option value={{=value}}>{{=value}}</option>{{~}}{{?}}');
    controls.typeRegister('bootstrap.Select', Select);
    
    
    // TabHeader
    // 
    function TabHeader(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.TabHeader', parameters, attributes, TabHeader.template);
    };
    TabHeader.prototype = bootstrap.control_prototype;
    TabHeader.template = doT.template(
'<li{{=it.printAttributes()}}>\
<a href="#" data-toggle="tab">\
{{? it.attributes.$icon }}<b class="{{=it.attributes.$icon}}"> </b>{{?}}\
{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</a></li>');
    controls.typeRegister('bootstrap.TabHeader', TabHeader);
    
    
    // Form
    // 
    function Form(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Form', parameters, attributes, Form.template);
    };
    Form.prototype = bootstrap.control_prototype;
    Form.template = doT.template(
'<form{{=it.printAttributes()}}>\
{{? (it.controls && it.controls.length > 0) }}\
{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}\
{{?}}\
</form>');
    controls.typeRegister('bootstrap.Form', Form);
    
    
    // FormGroup
    // 
    function FormGroup(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.FormGroup', parameters, attributes, FormGroup.template);
        this.class('form-group');
    };
    FormGroup.prototype = bootstrap.control_prototype;
    FormGroup.template = doT.template(
'<div{{=it.printAttributes()}}>\
{{? (it.controls && it.controls.length > 0) }}\
{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}\
{{?}}\
</div>');
    controls.typeRegister('bootstrap.FormGroup', FormGroup);
    
    
    // Label
    // 
    function Label(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.Label', parameters, attributes, Label.template);
        this.class('label');
        
        this.listen('type', function()
        {
            var style = this.parameter('style') || 'default';
            this.class('label label-' + style, 'label-default label-primary label-success label-info label-warning label-danger');
        });
    };
    Label.prototype = bootstrap.control_prototype;
    Label.template = doT.template(
'<span{{=it.printAttributes()}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</span>');
    controls.typeRegister('bootstrap.Label', Label);
    
    // ControlLabel
    // 
    function ControlLabel(parameters, attributes)
    {
        controls.controlInitialize(this, 'bootstrap.ControlLabel', parameters, attributes, ControlLabel.template);
        this.class('control-label');
    };
    ControlLabel.prototype = bootstrap.control_prototype;
    ControlLabel.template = doT.template(
'<label{{=it.printAttributes()}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}</label>');
    controls.typeRegister('bootstrap.ControlLabel', ControlLabel);
    

};

// export bootstrap object
if (typeof module !== 'undefined' && module.exports && typeof require !== 'undefined')
    // node
    module.exports = new Bootstrap(require('doT'), require('controls'));
else if (typeof define === 'function' && define.amd)
    // AMD
    define(['doT', 'controls'], function(doT, controls) { return new Bootstrap(doT, controls); });
else if (!this.bootstrap || this.bootstrap.VERSION < '0.1')
{
    // client
    if (!doT) throw new TypeError('controls.bootstrap.js: doT.js not found!');
    if (!controls) throw new TypeError('controls.bootstrap.js: controls.js not found!');
    this.bootstrap = new Bootstrap(doT, controls);
}
}).call(this);
