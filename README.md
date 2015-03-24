#An implementation of the KVO pattern, inspired by Google Maps API v3 MVCObject class

After finding the Google Maps API v3 *MVCObject* an extremely useful tool when building MVC based JavaScript apps, MVCObject-js was written to replicate it's functionality in a standalone script - you no longer need to download the whole Google Maps API just to use MVCObject.

Somewhat confusingly named, MVCObject is an implementation of the 'Observer' pattern. It just so happens it's extremely useful for building MVC based applications - it can serve as the glue between your Model View and Controller elements.

All methods are the same as google.maps.MVCObject - see the documentation here: 

http://code.google.com/apis/maps/documentation/javascript/reference.html#MVCObject

This is a standalone class - you can use it in any of your JavaScript applications, it doesn't have to be Google Maps related.

##How it works

The functionality centres around the fact that Javascript creates references to objects when assigned, not a copy.

When an class property is bound, it is converted into an object and a reference to the object assigned to each class. In this way, each class is accessing the exact same property.

Class properties must be accessed and modified using the setters and getters. Should any 'changed' callbacks be registered, they will be invoked when set() is called.

##A quick example

```js
ObjectA.prototype = new MVCObject();

function ObjectA()
{
    this.foo = 'bar';
};

ObjectA.prototype.foo_changed = function()
{
    alert('foo changed, it is now: ' + this.get('foo'));
};

ObjectB.prototype = new MVCObject();

function ObjectB()
{
    this.foo = 'this will be overwritten when bound';
};

var object_a = new ObjectA();
var object_b = new ObjectB();

object_b.bindTo('foo', object_a);

object_b.set('foo', 'I am cool');

// alerts 'foo changed, it is now: I am cool';
```


Please note, the order of binding does matter. The "bindee"'s property overwrites the "binder"'s property.

Also note, if your objects' 'constructor' property is important, be sure to correct this after setting up the prototype:

```js
ObjectA.prototype = new MVCObject();
ObjectA.prototype.constructor = ObjectA;
```

A good example (using Google's MVCObject) can be found here:

http://code.google.com/apis/maps/articles/mvcfun.html
