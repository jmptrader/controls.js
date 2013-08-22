module("controls");

test( "construction, passing the parameters and attributes", function()
{
    // must be case-insensitive
    var custom = controls.create('Custom');
    ok(custom.id && custom.controls && custom.__type === 'controls.Custom', '.create() "Custom"');
    custom = controls.create('custom');
    ok(custom.id && custom.controls && custom.__type === 'controls.Custom', '.create() "Custom" from "custom"');
    
    // bulk creation, naming, passing the params & attribs
    custom.add(['label:bootstrap.Label', 'layout:Layout#float=left']);
    custom.label.text('test012');
    ok(custom.label.text() === 'test012'
    && custom.layout.parameters['#float'] === 'left', 'bulk add');
    
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
    DivBlue.template = controls.doT.template('<div style="background-color:blue;width:50px;height:50px"></div>');
    controls.typeRegister('controls.div/blue', DivBlue);
    
    // test
    
    var control = controls.create('div/blue');
    ok(control.test_method(), "controls.create('div/blue'); - subtype resolving");
    
    // change type
    control.type('test.Custom#test=5');
    ok(control.__type === 'test.Custom', '.type("test.Custom#test=5"); - change type');
    ok(control.parameters['#test'] === '5', "check parameter value");
    
    // check preserve namespace
    control.type('Div#test=5');
    ok(control.__type === 'test.Div', '.type("Div#test=5"); - check preserve namespace');
    ok(control.type() === 'test.Div#test=5', 'control.type(); - get type');
    
    // check preserve __type
    control.type('#test=777');
    ok(control.type() === 'test.Div#test=777', '.type("#test=777"); - check preserve __type');
    
    // check default 'controls.'
    var defcontrols = control.add('div');
    ok(defcontrols.type() === 'controls.Div', '"test.Div".add("Div"); - check default controls. namespace');
    
    var start = performance.now();
    control = controls.create('Div/blue');
    for(var i = 0; i < 10000; i++)
        control.add('Custom#test=5');
    var spended = performance.now() - start;
    ok(spended < 300, 'check parameters resolving performance 10 000 controls ' + spended + ' ms < 300 ms OK');
});

// TODO actions ser/deser
test( "serialize-deserialize controls", function()
{
    for(var type in controls)
    if ((type.indexOf('controls.') === 0 || type.indexOf('bootstrap.') === 0)
    // exclude types:
    && 'controls.dataarray, controls.localstorage'.indexOf(type) < 0)
    {
        // Test all controls, set custom parameters, attributes, template and listeners
        
        var control;
        
        if (type === 'controls.frame')
        {
            // must be defined src
            control = controls.create(type + '/test=1#test=2', {src:'http://localhost/'});
        }
        else
        {
            control = controls.create(type + '/test=1#test=2');
        }
        
        
        control.text('test');
        control.listen('click', function(event) { return false; }, true);
        
        if (type === 'controls.custom')
        {
            control.template('<div></div>');
        }
        
        
        
        // serialization
        
        try
        {
            var serialized = JSON.stringify(control);
        }
        catch (e)
        {
            ok(false, type);
            throw e;
        }
        
        // deserialization
        
        var deserialized = JSON.parse(serialized, controls.reviverJSON);
        
        // check deserialized object
        
        ok(deserialized.parameters.test === '1' && deserialized.parameters['#test'] === '2', type + " check deserialized parameters" );
        ok(deserialized.attributes.$text === 'test', type + " check deserialized attributes" );
//        ok(deserialized.events['#click'], type + " check deserialized listeners" );
        
        if (type === 'controls.Frame')
        {
            ok(deserialized.attr('src') === 'http://localhost/', type + ' check deserialized attribute src, value:"' + deserialized.attr('src') + '"');
        }
        
        if (type === 'controls.Custom')
        {
            ok(deserialized.outerHTML() === '<div></div>', type + ' check deserialized outerHTML(). Expected "<div></div>", in fact "' + deserialized.outerHTML() + '"');
        }
        else
        {
            ok(!!deserialized.outerHTML() === true, type + ' check deserialized outerHTML() empty');
        }
        
    }
});