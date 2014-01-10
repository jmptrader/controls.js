module("controls");

test("base syntax of control construction, passing the parameters and attributes", function() {
    
    // must be case-insensitive
    var custom = controls.create('Custom');
    if (custom.__type !== 'controls.custom')
        ok(false, 'base syntax #1 .create() must be case-insensitive');
    custom = controls.create('custom');
    if (custom.__type !== 'controls.custom')
        ok(false, 'base syntax #2 .create() must be case-insensitive');
    
    
    // bulk add, parameters, id, style
    custom.add([
        'control1:bootstrap.Label',
        'control2:Layout param1=value1 /param2=value2 param3="value "3"#testid`class1 classN border:#777777 solid 1px; font-face: test;']);
    
    if (custom.length !== 2 || !custom.control2)
        ok(false, 'base syntax #3 bulk add');
        
    if (custom.control2.id !== 'testid'
    || custom.control2.parameters['param1'] !== 'value1'
    || custom.control2.parameters['/param2'] !== 'value2'
    || custom.control2.parameters['/param3'] !== 'value "3')
        ok(false, 'base syntax #3 bulk add');
    
    if(custom.control2.class() !== 'class1 classN')
        ok(false, 'base syntax #3 bulk add');
    
    
    // passing attributes hash and calling callback
    var callback_passed = false;
    custom.add('pass_attributes_callback:label', {test:'123'}, function (control) { callback_passed = true; });
    if(custom.pass_attributes_callback.attributes.test !== '123' || !callback_passed)
        ok(false, 'base syntax #4 attributes hash and callback');
    
    
    // callback only, check preserved this
    callback_passed = false;
    custom.add('pass_callback:label', function(added_control) {
        callback_passed = true;
        if (custom !== this // preserved this from custom.add()
        || added_control !== custom.pass_callback)
            ok(false, 'base syntax #5 this in callback, callback parameter');
    });
    if (!callback_passed)
        ok(false, 'base syntax #6 callback only');
    
    
    ok(true, 'base syntax passed');
});

test( "type resolving", function() {
    
    // apply test record allow check resolving by parameters values
    
    var test_parameters = {};
    test_parameters.__ctr = controls.div;
    controls.subtypes['controls.div'] = [test_parameters];
    
    // register test subtype
    
    var DivBlue = function(parameters, attributes) {
        this.initialize('div', parameters, DivBlue.template, attributes);
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
    control.type('test.custom test=5');
    ok(control.__type === 'test.custom', '.type("test.custom test=5"); - change type');
    ok(control.parameters['test'] === '5', "check parameter value");
    
   
    // check default 'controls.'
    var defcontrols = control.add('div');
    if (defcontrols.type() !== 'controls.div')
        ok(0, '"test.div".add("div"); - check default controls. namespace');
    
    var start = performance.now();
    control = controls.create('div/blue');
    for(var i = 0; i < 10000; i++)
        control.add('custom test=5');
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
            control = controls.create(type + ' test=2/test=1', {src:'http://localhost/'});
        else
            control = controls.create(type + ' test=2 test5=5/test=1 test4=4');
        
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