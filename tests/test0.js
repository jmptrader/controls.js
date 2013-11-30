module("controls");

test( "construction, passing the parameters and attributes", function()
{
    // must be case-insensitive
    var custom = controls.create('Custom');
    ok(custom.id && custom.controls && custom.__type === 'controls.custom', '.create() "Custom"');
    custom = controls.create('custom');
    ok(custom.id && custom.controls && custom.__type === 'controls.custom', '.create() "Custom" from "custom"');
    
    // bulk creation, naming, passing the params & attribs
    custom.add(['label:bootstrap.Label', 'layout:Layout#float=left']);
    custom.label.text('test012');
    ok(custom.label.text() === 'test012'
    && custom.layout.parameters['float'] === 'left', 'bulk add');
    
    // parameters options
    var callback_passed = false;
    custom.add('pass_attributes_callback:label', {test:'123'}, function (control) { callback_passed = true; });
    ok(custom.pass_attributes_callback.attributes.test === '123'
    && callback_passed, 'parameters options #1');
    
    // callback only, check preserved this
    callback_passed = false;
    custom.add('pass_callback:label', function (added_control)
    {
        callback_passed = true;
        ok(custom === this // preserved this from custom.add()
        && added_control === custom.pass_callback, 'parameters options #2');
    });
    ok(callback_passed, 'parameters options #2');
});

test( "type resolving", function()
{
    // apply test record allow check resolving by parameters values
    
    var test_parameters = {};
    test_parameters.__ctr = controls.Div;
    controls.subtypes['controls.div'] = [test_parameters];
    
    // register test subtype
    
    var DivBlue = function(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Div', parameters, DivBlue.template, attributes);
        this.test_method = function() { return true; };
    };
    DivBlue.prototype = controls.control_prototype;
    DivBlue.template = controls.template('<div style="background-color:blue;width:50px;height:50px"></div>');
    controls.typeRegister('controls.div/blue', DivBlue);
    
    // test
    
    var control = controls.create('div/blue');
    ok(control.parameters['/blue'], "check parameter value");
    ok(control.test_method(), "controls.create('div/blue'); - subtype resolving");
    
    // change type
    control.type('test.Custom#test=5');
    ok(control.__type === 'test.Custom', '.type("test.Custom#test=5"); - change type');
    ok(control.parameters['test'] === '5', "check parameter value");
    
   
    // check default 'controls.'
    var defcontrols = control.add('div');
    if (defcontrols.type() !== 'controls.div')
        ok(0, '"test.Div".add("Div"); - check default controls. namespace');
    
    var start = performance.now();
    control = controls.create('Div/blue');
    for(var i = 0; i < 10000; i++)
        control.add('Custom#test=5');
    var spent = performance.now() - start;
    ok(spent < 300, 'check parameters resolving performance 10 000 controls ' + spent + ' ms < 300 ms OK (good to firefox)');
});

// TODO actions ser/deser
// Test all controls, set custom parameters, attributes, template and listeners
test( "serialize-deserialize controls", function() {
    var control;
    
    for(var type in controls)
    if ((type.indexOf('controls.') === 0 || type.indexOf('bootstrap.') === 0)) {
        
        if (type === 'controls.frame')
            // must be defined src
            control = controls.create(type + '/test=1#test=2', {src:'http://localhost/'});
        else
            control = controls.create(type + '/test=1;test4=4#test=2;test5=5');
        
        if (!control.attr)
            continue; // It is not control
        
        control.attr('xtest', 'xvalue');
        control.listen('click', function(event) { return false; }, true);
        
        if (type === 'controls.custom') {
            control.template('<div></div>');
            var custom_rendered = control.outerHTML();
        }
        
        // serialization
        
        try {
            var serialized = JSON.stringify(control);
        }
        catch (e) {
            ok(false, 'cannot serialize ' + type + ' ' + e);
            var serialized = JSON.stringify(control);
        }
        
        
        // deserialization
        
        var deserialized = JSON.parse(serialized, controls.reviverJSON);
        
        // check deserialized object
        if (deserialized.parameters['/test'] !== '1' || deserialized.parameters['test'] !== '2')
            ok(0, type + " check deserialized parameters" );
        if (deserialized.attr('xtest') !== 'xvalue')
            ok(0, type + " check deserialized attributes" );
        
        if (!deserialized.events['#click'])
            ok(false, type + " check deserialized listeners" );
        
        if (type === 'controls.frame') {
            ok(deserialized.attr('src') === 'http://localhost/', type + ' check deserialized attribute src, value:"' + deserialized.attr('src') + '"');
        }
        else if (type === 'controls.custom') {
            if (deserialized.outerHTML() !== custom_rendered)
                ok(0, type + ' check deserialized outerHTML(). Expected "' + custom_rendered + '", in fact "' + deserialized.outerHTML() + '"');
        }
        else if (type !== 'controls.container') {
            if (!deserialized.outerHTML())
                ok(false, type + ' check deserialized outerHTML() empty');
        }
        
        ok(true, type + ' passed');
    }
});