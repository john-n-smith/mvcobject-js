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
 * An implementation of the Key Value Observer pattern, that makes our MVC lives easier.
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

	var observers_value;

	// Ensure the target has the property
	if( !(target_key in target) )
	{
		throw('Undefined: property "' + target_key + '" on target object.');
	}

	// Is the target's property already complex?
	if(! target._isPropertyBound(target_key) )
	{
		// Target's property is not yet a complex object. Make it one.
		target[target_key] =
		{
			'__my_index': 0,
			__observer_indexes: [],
			__shared_object:
			{
				__value: target[target_key],
				__observers: [{obj: target, key: target_key}]
			}
		};
	}

	// The target we're about to bind to has 'target_observers_length' observers already.
	// We need to update the observers observers to reflect the change in offset once the arrays are merged.
	var target_observers_length = target[target_key].__shared_object.__observers.length;

	// Add this new observers index to the target's array of observers' indexes.
	target[target_key].__observer_indexes.push(target_observers_length);

	// Is this observer being observed?
	if( this._isPropertyBound(key) )
	{
		// Make sure it's not already bound
		if(this[key]['__my_index'] !== 0) throw('"' + key + '" is already bound');

		// Both target and observer's properties are already complex.
		
		// We need to recursively update the observer's observers' indexes to reflect the merged observer array
		this._updateObserverIndexes(key, target_observers_length);

		// Merge all observers
		target[target_key].__shared_object.__observers = target[target_key].__shared_object.__observers.concat(this[key].__shared_object.__observers);

		// Store the observer's simple value prior to binding.
		observers_value = this[key].__shared_object.__value;
	}
	// The observer is still a simple value.
	else
	{
		observers_value = this[key];

		// Make the observer a complex object
		this[key] =
		{
			'__my_index': target_observers_length,
			__observer_indexes : [],
			__shared_object : null
		};
		
		// Add the observer to the target's array of observers
		target[target_key].__shared_object.__observers.push
		(
			{
				obj: this,
				key: key
			}
		);
	}

	// Loop over all observers
	for(var i in target[target_key].__shared_object.__observers)
	{
		// Wait until we get to the observer's observers. Check to see it is a true observer and not unbound.
		if(i < target_observers_length || target[target_key].__shared_object.__observers[i] === null) continue;

		// Point all observers to the common shared object
		target[target_key].__shared_object.__observers[i].obj[target[target_key].__shared_object.__observers[i].key].__shared_object = target[target_key].__shared_object;

		// Value has not changed or this is the first bind and no_notify was set, no need to call the callbacks.
		if(target[target_key].__shared_object.__value === observers_value || (i == target_observers_length && no_notify) ) continue;

		// Trigger the observer's observer's callbacks, if there are any
		if(target[target_key].__shared_object.__observers[i].key + '_changed' in target[target_key].__shared_object.__observers[i].obj) target[target_key].__shared_object.__observers[i].obj[target[target_key].__shared_object.__observers[i].key + '_changed']();
	}
};

/**
 * Recursively update observer indexes when when new objects are added to the shared object.
 */
MVCObject.prototype._updateObserverIndexes = function(key, offset_increase)
{
	// Updates the observer's index of themself
	this[key]['__my_index'] += offset_increase;

	for(var i in this[key].__observer_indexes)
	{
		// Make sure the property hasn't been unbound
		if(this[key].__shared_object.__observers[this[key].__observer_indexes[i]] === null) continue;

		// Recursively update observers
		this[key].__shared_object.__observers[this[key].__observer_indexes[i]].obj._updateObserverIndexes(this[key].__shared_object.__observers[this[key].__observer_indexes[i]].key, offset_increase);
		this[key].__observer_indexes[i] += offset_increase;
	}
};

MVCObject.prototype._isPropertyBound = function(property)
{
	return this[property] !== null && typeof this[property] === 'object' && '__my_index' in this[property];	
};

MVCObject.prototype.get = function(key)
{
	// If the property is a complex object, return the value, otherwise, return the simple value
	return this._isPropertyBound(key) ? this[key].__shared_object.__value : this[key];
};

MVCObject.prototype.set = function(key, value)
{
	// Does the property exist on the object
	if(!key in this) throw('Cannot set value for undefined property "' + key + '".');

	// Is this a bound property?
	if(this._isPropertyBound(key))
	{
		// Has the property changed?
		if(this[key].__shared_object.__value === value) return;

		// Set the new value
		this[key].__shared_object.__value = value;

		// Call any callback's belonging to objects bound to this property
		for(var i in this[key].__shared_object.__observers)
		{
			if(this[key].__shared_object.__observers[i] === null) continue;

			this[key].__shared_object.__observers[i].obj[this[key].__shared_object.__observers[i].key + '_changed']();
		}
		
		return;
	}

	// Non bound property

	// Has the property changed?
	if(this[key] === value) return;

	// Set the value
	this[key] = value;

	// Manually trigger the changed event
	if(key + '_changed' in this) this[key + '_changed']();
};

MVCObject.prototype.setValues = function(key_value_pairs)
{
	for(var key in key_value_pairs)
	{
		this.set(key, key_value_pairs[key]);
	}
};

/**
 * Recursively re-binds observers to a new complex object
 */
MVCObject.prototype._rebindObservers = function(complex_object, key)
{
	for(var i in this[key].__observer_indexes)
	{
		var slice;

		// Make sure the observer hasn't been unbound
		if(this[key].__shared_object.__observers[this[key].__observer_indexes[i]] !== null)
		{
			slice = this[key].__shared_object.__observers.splice(this[key].__observer_indexes[i], 1, null)[0];

			// The recursive bit
			slice.obj._rebindObservers(complex_object, slice.key);

			// Update this object's shared object reference
			slice.obj[slice.key].__shared_object = complex_object;

			// Update this objects observer index
			this[key].__observer_indexes.splice(i, 1, complex_object.__observers.length); // Don't need to subtract one - about to add to the array
			
			slice.obj[slice.key]['__my_index'] = complex_object.__observers.length;
		}
		// This observer has been unbound
		else
		{
			slice = null;
		}

		// Add the object as an observer to the new object
		complex_object.__observers.push(slice);
		
		// Update my index so I know my index as an observer in the shared object
		this[key]['__my_index'] = complex_object.__observers.length;
	}
};

MVCObject.prototype.unbind = function(key)
{
	if( !('__my_index' in this[key]) || this[key]['__my_index'] === 0 ) throw('"' + key + '" is not a bound property.');

	// Remove myself.
	this[key].__shared_object.__observers[this[key]['__my_index']] = null;

	// Do I have any observers (that aren't just me) ?
	if(this[key].__observer_indexes.length === 0)
	{
		// Convert back to simple format
		this[key] = this[key].__shared_object.__value;
		return;
	}

	// I have observers. Re-bind to a new shared object.
	var new_object =
	{
		__observers: [{obj: this, key: key}],
		__value: this[key].__shared_object.__value
	};

	this._rebindObservers(new_object, key, 0);

	this[key]['__my_index'] = 0;

	this[key].__shared_object = new_object;
};

MVCObject.prototype.unbindAll = function()
{
	for(var property in this)
	{
		if(!this._isPropertyBound(property)) continue;

		this.unbind(property);
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