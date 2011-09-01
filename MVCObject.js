/**
 * Copyright 2011 urbanplum.eu.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 * 
 * An implementation of the Key Value Observer pattern, that makes our MVC based lives easier.
 * 
 * Inspired by Google's MVCObject: http://code.google.com/apis/maps/documentation/javascript/reference.html#MVCObject
 *
 * Facilitates easy binding of View objects to their respective Models. It's super mega hot.
 *
 * @author John Smith - john@urbanplum.eu
 */
function MVCObject(){};

MVCObject.prototype.bindTo = function(key, target, target_key, no_notify)
{
	target_key = target_key || key;

	// Make the target's key a complex object.
	if(target[target_key] !== undefined && ( target[target_key] === null || !target[target_key].__jns ) )
	{
		target._set(target_key, target[target_key], true);
	}

	// Make my property a reference to the target's property
	this[key] = target[target_key];

	// Register callbacks
	if(!this[key].__nms)
	{
		this[key].__nms = [];

		// Only add the first MVCObject's callback on the first bind
		this[key].__nms.push({obj: target, key: target_key});
	}

	this[key].__nms.push({obj: this, key: key});

	// Call the _changed event once upon binding.
	if(no_notify) return;

	if(this[key + '_changed']) this[key + '_changed']();
};

MVCObject.prototype.get = function(key)
{
	// If the property is a complex object, return the value, otherwise, return the simple value
	return this[key].__jns === undefined ? this[key] : this[key].__jns;
};

MVCObject.prototype.notify = function(key)
{
	// Appears in the google API reference, but no idea what it does..
};

MVCObject.prototype.set = function(key, value)
{
	this._set(key, value, false);
};

MVCObject.prototype._set = function(key, value, is_initial_set)
{
	// If the property exists and is a complex object, update it.
	if(this[key] && this[key].__jns !== undefined)
	{
		this[key].__jns = value;
	}
	else // If the key does not exist, or not complex, create it.
	{
		this[key] = {__jns: value};
	}
	
	// Don't call all the callbacks on the initial set.
	// This solves a bug if more than two objects are bound callbacks will be invoked, regardless of no_notify. 
	if(is_initial_set) return;

	// Call any callback's belonging to objects bound to this value
	for(var i in this[key].__nms)
	{
		var obj = this[key].__nms[i].obj;

		if(obj[this[key].__nms[i].key + '_changed'])
		{
			obj[this[key].__nms[i].key + '_changed']();
		}
	}
};

MVCObject.prototype.setValues = function(key_value_pairs)
{
	for(var key in key_value_pairs)
	{
		this._set(key, key_value_pairs[key], false);
	}
};

MVCObject.prototype.unbind = function(key)
{
	this[key] = this.get(key);
};

MVCObject.prototype.unbindAll = function()
{
	for(var key in this)
	{
		if(!this[key].__jns) continue;

		this.unbind(key);
	}
};

// Below are the public methods to be exported when using Google's Closure Compiler - http://code.google.com/closure/compiler/
// Uncomment if you wish to compile the code using 'advanced optimisation'.
/*
window['MVCObject'] = MVCObject;
window['MVCObject'].prototype['bindTo'] = MVCObject.prototype.bindTo;
window['MVCObject'].prototype['get'] = MVCObject.prototype.get;
window['MVCObject'].prototype['set'] = MVCObject.prototype.set;
window['MVCObject'].prototype['setValues'] = MVCObject.prototype.setValues;
window['MVCObject'].prototype['unbind'] = MVCObject.prototype.unbind;
window['MVCObject'].prototype['unbindAll'] = MVCObject.prototype.unbindAll;
*/