var app = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (var k in src) { tar[k] = src[k]; }
		return tar;
	}

	function assignTrue(tar, src) {
		for (var k in src) { tar[k] = 1; }
		return tar;
	}

	function isPromise(value) {
		return value && typeof value.then === 'function';
	}

	function callAfter(fn, i) {
		if (i === 0) { fn(); }
		return function () {
			if (!--i) { fn(); }
		};
	}

	function addLoc(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file: file, line: line, column: column, char: char }
		};
	}

	function run(fn) {
		fn();
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detachNode(node) {
		node.parentNode.removeChild(node);
	}

	function reinsertBetween(before, after, target) {
		while (before.nextSibling && before.nextSibling !== after) {
			target.appendChild(before.parentNode.removeChild(before.nextSibling));
		}
	}

	function reinsertChildren(parent, target) {
		while (parent.firstChild) { target.appendChild(parent.firstChild); }
	}

	function destroyEach(iterations, detach) {
		for (var i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) { iterations[i].d(detach); }
		}
	}

	function createFragment() {
		return document.createDocumentFragment();
	}

	function createElement(name) {
		return document.createElement(name);
	}

	function createSvgElement(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	function createText(data) {
		return document.createTextNode(data);
	}

	function createComment() {
		return document.createComment('');
	}

	function addListener(node, event, handler, options) {
		node.addEventListener(event, handler, options);
	}

	function removeListener(node, event, handler, options) {
		node.removeEventListener(event, handler, options);
	}

	function setAttribute(node, attribute, value) {
		if (value == null) { node.removeAttribute(attribute); }
		else { node.setAttribute(attribute, value); }
	}

	function setData(text, data) {
		text.data = '' + data;
	}

	function selectOption(select, value) {
		for (var i = 0; i < select.options.length; i += 1) {
			var option = select.options[i];

			if (option.__value === value) {
				option.selected = true;
				return;
			}
		}
	}

	function selectValue(select) {
		var selectedOption = select.querySelector(':checked') || select.options[0];
		return selectedOption && selectedOption.__value;
	}

	function toggleClass(element, name, toggle) {
		element.classList.toggle(name, !!toggle);
	}

	function handlePromise(promise, info) {
		var obj;

		var token = info.token = {};

		function update(type, index, key, value) {
			var obj;

			if (info.token !== token) { return; }

			info.resolved = key && ( obj = {}, obj[key] = value, obj );

			var child_ctx = assign(assign({}, info.ctx), info.resolved);
			var block = type && (info.current = type)(info.component, child_ctx);

			if (info.block) {
				if (info.blocks) {
					info.blocks.forEach(function (block, i) {
						if (i !== index && block) {
							block.o(function () {
								block.d(1);
								info.blocks[i] = null;
							});
						}
					});
				} else {
					info.block.d(1);
				}

				block.c();
				block[block.i ? 'i' : 'm'](info.mount(), info.anchor);

				info.component.root.set({}); // flush any handlers that were created
			}

			info.block = block;
			if (info.blocks) { info.blocks[index] = block; }
		}

		if (isPromise(promise)) {
			promise.then(function (value) {
				update(info.then, 1, info.value, value);
			}, function (error) {
				update(info.catch, 2, info.error, error);
			});

			// if we previously had a then/catch block, destroy it
			if (info.current !== info.pending) {
				update(info.pending, 0);
				return true;
			}
		} else {
			if (info.current !== info.then) {
				update(info.then, 1, info.value, promise);
				return true;
			}

			info.resolved = ( obj = {}, obj[info.value] = promise, obj );
		}
	}

	function destroyBlock(block, lookup) {
		block.d(1);
		lookup[block.key] = null;
	}

	function outroAndDestroyBlock(block, lookup) {
		block.o(function() {
			destroyBlock(block, lookup);
		});
	}

	function updateKeyedEach(old_blocks, component, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, intro_method, next, get_context) {
		var o = old_blocks.length;
		var n = list.length;

		var i = o;
		var old_indexes = {};
		while (i--) { old_indexes[old_blocks[i].key] = i; }

		var new_blocks = [];
		var new_lookup = {};
		var deltas = {};

		var i = n;
		while (i--) {
			var child_ctx = get_context(ctx, list, i);
			var key = get_key(child_ctx);
			var block = lookup[key];

			if (!block) {
				block = create_each_block(component, key, child_ctx);
				block.c();
			} else if (dynamic) {
				block.p(changed, child_ctx);
			}

			new_blocks[i] = new_lookup[key] = block;

			if (key in old_indexes) { deltas[key] = Math.abs(i - old_indexes[key]); }
		}

		var will_move = {};
		var did_move = {};

		function insert(block) {
			block[intro_method](node, next);
			lookup[block.key] = block;
			next = block.first;
			n--;
		}

		while (o && n) {
			var new_block = new_blocks[n - 1];
			var old_block = old_blocks[o - 1];
			var new_key = new_block.key;
			var old_key = old_block.key;

			if (new_block === old_block) {
				// do nothing
				next = new_block.first;
				o--;
				n--;
			}

			else if (!new_lookup[old_key]) {
				// remove old block
				destroy(old_block, lookup);
				o--;
			}

			else if (!lookup[new_key] || will_move[new_key]) {
				insert(new_block);
			}

			else if (did_move[old_key]) {
				o--;

			} else if (deltas[new_key] > deltas[old_key]) {
				did_move[new_key] = true;
				insert(new_block);

			} else {
				will_move[old_key] = true;
				o--;
			}
		}

		while (o--) {
			var old_block = old_blocks[o];
			if (!new_lookup[old_block.key]) { destroy(old_block, lookup); }
		}

		while (n) { insert(new_blocks[n - 1]); }

		return new_blocks;
	}

	function blankObject() {
		return Object.create(null);
	}

	function destroy(detach) {
		this.destroy = noop;
		this.fire('destroy');
		this.set = noop;

		this._fragment.d(detach !== false);
		this._fragment = null;
		this._state = {};
	}

	function destroyDev(detach) {
		destroy.call(this, detach);
		this.destroy = function() {
			console.warn('Component was already destroyed');
		};
	}

	function _differs(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function _differsImmutable(a, b) {
		return a != a ? b == b : a !== b;
	}

	function fire(eventName, data) {
		var handlers =
			eventName in this._handlers && this._handlers[eventName].slice();
		if (!handlers) { return; }

		for (var i = 0; i < handlers.length; i += 1) {
			var handler = handlers[i];

			if (!handler.__calling) {
				try {
					handler.__calling = true;
					handler.call(this, data);
				} finally {
					handler.__calling = false;
				}
			}
		}
	}

	function flush(component) {
		component._lock = true;
		callAll(component._beforecreate);
		callAll(component._oncreate);
		callAll(component._aftercreate);
		component._lock = false;
	}

	function get() {
		return this._state;
	}

	function init(component, options) {
		component._handlers = blankObject();
		component._slots = blankObject();
		component._bind = options._bind;
		component._staged = {};

		component.options = options;
		component.root = options.root || component;
		component.store = options.store || component.root.store;

		if (!options.root) {
			component._beforecreate = [];
			component._oncreate = [];
			component._aftercreate = [];
		}
	}

	function on(eventName, handler) {
		var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
		handlers.push(handler);

		return {
			cancel: function() {
				var index = handlers.indexOf(handler);
				if (~index) { handlers.splice(index, 1); }
			}
		};
	}

	function set(newState) {
		this._set(assign({}, newState));
		if (this.root._lock) { return; }
		flush(this.root);
	}

	function _set(newState) {
		var oldState = this._state,
			changed = {},
			dirty = false;

		newState = assign(this._staged, newState);
		this._staged = {};

		for (var key in newState) {
			if (this._differs(newState[key], oldState[key])) { changed[key] = dirty = true; }
		}
		if (!dirty) { return; }

		this._state = assign(assign({}, oldState), newState);
		this._recompute(changed, this._state);
		if (this._bind) { this._bind(changed, this._state); }

		if (this._fragment) {
			this.fire("state", { changed: changed, current: this._state, previous: oldState });
			this._fragment.p(changed, this._state);
			this.fire("update", { changed: changed, current: this._state, previous: oldState });
		}
	}

	function _stage(newState) {
		assign(this._staged, newState);
	}

	function setDev(newState) {
		if (typeof newState !== 'object') {
			throw new Error(
				this._debugName + '.set was called without an object of data key-values to update.'
			);
		}

		this._checkReadOnly(newState);
		set.call(this, newState);
	}

	function callAll(fns) {
		while (fns && fns.length) { fns.shift()(); }
	}

	function _mount(target, anchor) {
		this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
	}

	function removeFromStore() {
		this.store._remove(this);
	}

	var protoDev = {
		destroy: destroyDev,
		get: get,
		fire: fire,
		on: on,
		set: setDev,
		_recompute: noop,
		_set: _set,
		_stage: _stage,
		_mount: _mount,
		_differs: _differs
	};

	function Store(state, options) {
		this._handlers = {};
		this._dependents = [];

		this._computed = blankObject();
		this._sortedComputedProperties = [];

		this._state = assign({}, state);
		this._differs = options && options.immutable ? _differsImmutable : _differs;
	}

	assign(Store.prototype, {
		_add: function _add(component, props) {
			this._dependents.push({
				component: component,
				props: props
			});
		},

		_init: function _init(props) {
			var state = {};
			for (var i = 0; i < props.length; i += 1) {
				var prop = props[i];
				state['$' + prop] = this._state[prop];
			}
			return state;
		},

		_remove: function _remove(component) {
			var i = this._dependents.length;
			while (i--) {
				if (this._dependents[i].component === component) {
					this._dependents.splice(i, 1);
					return;
				}
			}
		},

		_set: function _set$$1(newState, changed) {
			var this$1 = this;

			var previous = this._state;
			this._state = assign(assign({}, previous), newState);

			for (var i = 0; i < this._sortedComputedProperties.length; i += 1) {
				this._sortedComputedProperties[i].update(this._state, changed);
			}

			this.fire('state', {
				changed: changed,
				previous: previous,
				current: this._state
			});

			this._dependents
				.filter(function (dependent) {
					var componentState = {};
					var dirty = false;

					for (var j = 0; j < dependent.props.length; j += 1) {
						var prop = dependent.props[j];
						if (prop in changed) {
							componentState['$' + prop] = this$1._state[prop];
							dirty = true;
						}
					}

					if (dirty) {
						dependent.component._stage(componentState);
						return true;
					}
				})
				.forEach(function (dependent) {
					dependent.component.set({});
				});

			this.fire('update', {
				changed: changed,
				previous: previous,
				current: this._state
			});
		},

		_sortComputedProperties: function _sortComputedProperties() {
			var computed = this._computed;
			var sorted = this._sortedComputedProperties = [];
			var visited = blankObject();
			var currentKey;

			function visit(key) {
				var c = computed[key];

				if (c) {
					c.deps.forEach(function (dep) {
						if (dep === currentKey) {
							throw new Error(("Cyclical dependency detected between " + dep + " <-> " + key));
						}

						visit(dep);
					});

					if (!visited[key]) {
						visited[key] = true;
						sorted.push(c);
					}
				}
			}

			for (var key in this._computed) {
				visit(currentKey = key);
			}
		},

		compute: function compute(key, deps, fn) {
			var this$1 = this;

			var value;

			var c = {
				deps: deps,
				update: function (state, changed, dirty) {
					var values = deps.map(function (dep) {
						if (dep in changed) { dirty = true; }
						return state[dep];
					});

					if (dirty) {
						var newValue = fn.apply(null, values);
						if (this$1._differs(newValue, value)) {
							value = newValue;
							changed[key] = true;
							state[key] = value;
						}
					}
				}
			};

			this._computed[key] = c;
			this._sortComputedProperties();

			var state = assign({}, this._state);
			var changed = {};
			c.update(state, changed, true);
			this._set(state, changed);
		},

		fire: fire,

		get: get,

		on: on,

		set: function set$$1(newState) {
			var oldState = this._state;
			var changed = this._changed = {};
			var dirty = false;

			for (var key in newState) {
				if (this._computed[key]) { throw new Error(("'" + key + "' is a read-only computed property")); }
				if (this._differs(newState[key], oldState[key])) { changed[key] = dirty = true; }
			}
			if (!dirty) { return; }

			this._set(newState, changed);
		}
	});

	var locationSection = { 
	  id: 'basicLocation', 
	  component: 'Location',
	  steps: [
	    {
	      id: 'unknownUserLocationCard',
	      fields: [{
	        type: 'postalCode', 
	        id: 'locationCardPostalCode', 
	        placeholder: 'Enter Zip Code',
	        value: ''
	      }]
	    }
	  ]
	};

	var validateQuestion = function (ref) {
	  var step = ref.step;
	  var section = ref.section;

	  switch(step.type) {
	    default: 
	      return !step.required || step.value != '';
	      // can also return a promise - loading states 
	      // will be handled automatically, ex: 
	      // return new Promise((resolve,reject) => {
	      //   setTimeout(resolve,500,true);
	      // });
	  }
	};

	var taskPageOne = { 
	  id: 'taskInterviewPageOne',
	  component: 'Question',
	  componentOptions: { 
	    page: 1
	  }, 
	  preload: true,
	  get: function (ctx) { return fetch('/data/interview-page-one.json'); },
	  validate: validateQuestion
	}; 

	var taskPageTwo = { 
	  id: 'taskInterviewPageTwo',
	  component: 'Question', 
	  componentOptions: { 
	    page: 2
	  }, 
	  get: function (ctx) { return fetch('/data/interview-page-two.json'); },
	  validate: validateQuestion
	};

	var contactSubmit = { 
	  id: 'contactSubmit', 
	  component: 'ContactSubmit', 
	  steps: [
	    {
	      id: 'contactSubmitOne',
	      heading: 'Give me your name...',
	      fields: [
	        {
	          type: 'text', 
	          placeholder: 'First Name',
	          label: 'First Name',
	          id: 'firstName',
	          value: 'Jon'
	        }, { 
	          type: 'text',
	          placeholder: 'Last Name',
	          label: 'Last Name',
	          id: 'lastName', 
	          value: 'Greenemeier'
	        }
	      ]
	    }, { 
	      id: 'contactSubmitTwo',
	      heading: 'Give me your addy...',
	      fields: [ 
	        { 
	          type: 'text', 
	          placeholder: 'Street Address',
	          label: 'Street Address',
	          id: 'addressLine1',
	          value: '1882 E 104th Ave'
	        }, { 
	          type: 'text', 
	          placeholder: 'City',
	          label: 'City',
	          id: 'city', 
	          value: 'Denver'
	        }, { 
	          type: 'postalCode', 
	          placeholder: 'Zip Code',
	          label: 'Zip Code',
	          id: 'csPostalCode',
	          value: '80233'
	        }
	      ]
	    }, { 
	      id: 'contactSubmitThree',
	      heading: 'Give me your deets...',
	      fields: [ 
	        {
	          type: 'phone', 
	          placeholder: 'Phone',
	          label: 'Phone',
	          id: 'phone', 
	          value: '7203492738'
	        }, { 
	          type: 'email', 
	          placeholder: 'Email',
	          label: 'Email',
	          id: 'email', 
	          value: 'jgrkj23kj@edify.com'
	        }
	      ]
	    }
	  ] 
	};

	var config = { 
	  info: { 
	    get: function (ctx) { return fetch('/data/taskInfo.json'); }
	  },
	  sections: [ 
	    locationSection, 
	    taskPageOne, 
	    taskPageTwo,
	    contactSubmit
	  ]
	};

	window.config = config;

	var combineData = function (components) { return function (values) {
	  components.forEach(function (c,i) {
	    c.steps = values[i];
	  });
	  return components;
	}; };

	var getDefaultApplier = function (defaults) { return function (obj) {
	  Object.keys(defaults)
	    .forEach(function (k) { return obj[k] = obj.hasOwnProperty(k) ? obj[k] : defaults[k]; }
	    ); 
	  return obj;
	}; };
	    
	var defaultSectionConfig = getDefaultApplier({ 
	  steps: []
	});

	var defaultStepConfig = getDefaultApplier({ 
	  isLoading: false, 
	  isValid: true, 
	  isVisible: false
	});

	var formatConfiguration = function (config$$1) { return config$$1.sections.forEach(function (section) { return defaultSectionConfig(section).steps.forEach(defaultStepConfig); }  
	  ); };

	var setStepVisible = function (step) { return step.isVisible = true; };

	var getFirstStep = function () { return config.sections[0].steps[0]; };

	var getStepIndexInSection = function (ref) {
	  var step = ref.step;
	  var section = ref.section;

	  return section.steps.findIndex(function (s) { return s.id == step.id; }
	);
	};

	var getSectionIndex = function (section) { return config.sections.findIndex(function (s) { return s.id === section.id; }); }; 

	var loadSection = function (section) { return section.get(config)
	    .then(function (data) { return data.json(); })
	    .then(function (steps) { 
	      steps.forEach(defaultStepConfig);
	      section.steps = steps;
	      return section;
	    }); };

	var getNextSection = function (currSection) { return new Promise(function (resolve,reject) {
	  var currentIndex = getSectionIndex(currSection); 
	  if(currentIndex == -1) { return reject('Section not found'); } 
	  var nextSection = config.sections[currentIndex + 1];
	  if(typeof nextSection.get == 'function' && nextSection.steps.length == 0) { 
	    console.log('fetching next section');
	    loadSection(nextSection).then(resolve).catch(reject);
	  } else { 
	    resolve(config.sections[currentIndex + 1]);
	  }
	}); }; 

	function getInterview(ctx) { 
	  var fetchableComponents = config.sections.filter(function (s) { return s.hasOwnProperty('get') && s.preload; }
	  ); 
	  if(config.info.get) { fetchableComponents.push(config.info); }
	  var promises = fetchableComponents.map(function (c) { return c.get(); }); 
	  return Promise.all(promises)
	    .then(function (values) { return Promise.all(values.map(function (v) { return v.json(); })); })
	    .then(combineData(fetchableComponents))
	    .then(function () {
	      formatConfiguration(config);
	      setStepVisible(getFirstStep());
	      return config
	    });
	}

	function validateStep(ref) {
	  var step = ref.step;
	  var section = ref.section;
	 
	  if(typeof section.validate == 'function') {
	    return section.validate({step: step,section: section}); 
	  }
	  return true;
	}

	function getNextStep(ref) {
	  var step = ref.step;
	  var section = ref.section;
	 
	  return new Promise(function (resolve,reject) {
	    var stepIndex = getStepIndexInSection({step: step,section: section});
	    if(stepIndex == -1) { return reject('Step not found'); }
	    if(stepIndex + 1 >= section.steps.length) { 
	      getNextSection(section).then(function (nextSection) { 
	        resolve(nextSection.steps[0]);
	      }).catch(reject);
	    } else { 
	      resolve(section.steps[stepIndex + 1]);
	    }
	  });
	}

	var isAPromise = function (obj) { return typeof obj.then == 'function'; };

	var InterviewStore = /*@__PURE__*/(function (Store$$1) {
	  function InterviewStore () {
	    Store$$1.apply(this, arguments);
	  }

	  if ( Store$$1 ) InterviewStore.__proto__ = Store$$1;
	  InterviewStore.prototype = Object.create( Store$$1 && Store$$1.prototype );
	  InterviewStore.prototype.constructor = InterviewStore;

	  InterviewStore.prototype.stepSubmitted = function stepSubmitted (ref) {
	    var this$1 = this;
	    var step = ref.step;
	    var section = ref.section;
	 
	    var isValid = validateStep({step: step,section: section});
	    var isAsync = isAPromise(isValid); 
	    if(!isAsync) { 
	      return this.validityDetermined({
	        step: step,
	        section: section,
	        isAsync: isAsync,
	        isValid: isValid
	      });
	    } 
	    this.setLoading({step: step, loading: true});
	    isValid.then(function (validity) {
	      // set loading state: 
	      this$1.setLoading({step: step,loading:false});
	      this$1.validityDetermined({
	        step: step,
	        section: section,
	        isAsync: isAsync,
	        isValid: validity
	      });
	    });
	  };

	  InterviewStore.prototype.validityDetermined = function validityDetermined (ref) {
	    var step = ref.step;
	    var section = ref.section;
	    var isValid = ref.isValid;
	    var isAsync = ref.isAsync;
	 
	    if(isValid) { return this.validStepSubmitted({step: step,section: section}); }
	    this.invalidStepSubmitted({step: step,section: section});
	  };

	  InterviewStore.prototype.validStepSubmitted = function validStepSubmitted (ref) {
	    var this$1 = this;
	    var step = ref.step;
	    var section = ref.section;
	 
	    getNextStep({step: step,section: section}).then(function (nextStep) {
	      this$1.setVisible({step: nextStep, visibility: true})
	        .presentStep({step: nextStep});
	    }).catch(this.catastrophicError);
	  };
	  
	  InterviewStore.prototype.invalidStepSubmitted = function invalidStepSubmitted (ref) {
	    var step = ref.step;
	    var section = ref.section;
	 
	    
	  };

	  InterviewStore.prototype.presentStep = function presentStep (ref) {
	    var step = ref.step;
	 
	    this.set({ currentStep: step.id });
	    window.scroll({
	      top: document.querySelector((".scroll-section[data-id=\"" + (step.id) + "\"]")).offsetTop, 
	      left: 0, 
	      behavior: 'smooth'
	    });
	    return this;
	  };

	  InterviewStore.prototype.setVisible = function setVisible (ref) {
	    var step = ref.step;
	    var visibility = ref.visibility;
	 
	    step.isVisible = visibility;
	    return this.commitInterview();
	  };

	  InterviewStore.prototype.setLoading = function setLoading (ref) {
	    var step = ref.step;
	    var loading = ref.loading;

	    var ref$1 = this.get();
	    var interview = ref$1.interview;
	    interview.isLoading = loading;
	    step.isLoading = loading;
	    return this.commitInterview();
	  };

	  InterviewStore.prototype.commitInterview = function commitInterview () { 
	    var ref = this.get();
	    var interview = ref.interview;
	    this.set({interview: interview});
	    return this;
	  };

	  InterviewStore.prototype.catastrophicError = function catastrophicError (err) { 
	    console.log('oh nose', err);
	  };

	  return InterviewStore;
	}(Store));

	var interviewStore = new InterviewStore({
	  currentStep: null,
	  interview: null,
	  interviewPromise: getInterview().then(function (interview) {
	    interviewStore.set({interview: interview});
	  })
	});

	window.config = config;

	/* src\Components\InterviewStep.html generated by Svelte v2.15.3 */

	var methods = { 
	  handleSubmit: function handleSubmit(event) { 
	    event.preventDefault();
	    var ref = this.get();
	    var step = ref.step;
	    var section = ref.section;
	    this.store.stepSubmitted({step: step,section: section});
	  }
	};

	function oncreate() { 
	  console.log(this.refs);
	}
	var file = "src\\Components\\InterviewStep.html";

	function create_main_fragment(component, ctx) {
		var div6, form, div4, div1, slot_content_heading = component._slotted.heading, div0, text1, slot_content_body = component._slotted.body, slot_content_body_before, slot_content_body_after, div2, text3, div3, slot_content_footer = component._slotted.footer, a, text5, button, text7, div5, svg, g, path0, path1, div6_class_value, div6_data_id_value, current;

		function submit_handler(event) {
			component.handleSubmit(event);
		}

		return {
			c: function create() {
				div6 = createElement("div");
				form = createElement("form");
				div4 = createElement("div");
				div1 = createElement("div");
				if (!slot_content_heading) {
					div0 = createElement("div");
					div0.textContent = "Heading";
				}
				text1 = createText("\r\n      ");
				if (!slot_content_body) {
					div2 = createElement("div");
					div2.textContent = "Body";
				}
				text3 = createText("\r\n      ");
				div3 = createElement("div");
				if (!slot_content_footer) {
					a = createElement("a");
					a.textContent = "Previous";
					text5 = createText("\r\n          ");
					button = createElement("button");
					button.textContent = "Next";
				}
				text7 = createText("\r\n    ");
				div5 = createElement("div");
				svg = createSvgElement("svg");
				g = createSvgElement("g");
				path0 = createSvgElement("path");
				path1 = createSvgElement("path");
				if (!slot_content_heading) {
					addLoc(div0, file, 10, 10, 284);
				}
				div1.className = "card-heading svelte-1s96grg";
				addLoc(div1, file, 8, 6, 215);
				if (!slot_content_body) {
					addLoc(div2, file, 14, 8, 369);
				}
				if (!slot_content_footer) {
					a.href = "/previous-step";
					addLoc(a, file, 18, 10, 474);
					button.type = "submit";
					button.className = "bs-btn";
					addLoc(button, file, 19, 10, 523);
				}
				div3.className = "card-footer svelte-1s96grg";
				addLoc(div3, file, 16, 6, 407);
				div4.className = "card-section svelte-1s96grg";
				addLoc(div4, file, 7, 4, 181);
				setAttribute(path0, "d", "M404.5,478.3c-8.1-10.5-23.4-12.6-33.6-4.2c-17.6,14.6-40.1,23.5-64.8,23.5c-49.3,0-90.3-35.1-99.6-81.7l34.6-3.1\r\n            c2.6-0.2,3.9-3.2,2.3-5.3l-31.2-40.6l-31.7-41.3c-1.5-1.9-4.5-1.7-5.6,0.5l-23.8,46.2l-23.4,45.5c-1.2,2.3,0.6,5,3.2,4.8l27.5-2.5\r\n            c11.6,71.1,73.1,125.5,147.5,125.5c36.2,0,69.2-12.9,95.1-34.3c9.8-8.1,11.3-22.6,3.6-32.7L404.5,478.3z");
				addLoc(path0, file, 29, 10, 948);
				setAttribute(path1, "d", "M480.9,369.3l-27.5,2.5c-11.6-71.1-73.1-125.5-147.5-125.5c-36.2,0-69.2,12.9-95.1,34.3c-9.8,8.1-11.3,22.6-3.6,32.7\r\n            l0.3,0.4c8.1,10.5,23.4,12.6,33.6,4.2c17.6-14.6,40.1-23.5,64.8-23.5c49.3,0,90.3,35.1,99.6,81.7l-34.6,3.1\r\n            c-2.6,0.2-3.9,3.2-2.3,5.3l31.2,40.6l31.7,41.3c1.5,1.9,4.5,1.7,5.6-0.5l23.8-46.2l23.4-45.5C485.3,371.8,483.5,369.1,480.9,369.3z\r\n            ");
				addLoc(path1, file, 32, 10, 1334);
				setAttribute(g, "class", "svelte-1s96grg");
				addLoc(g, file, 28, 8, 933);
				setAttribute(svg, "version", "1.1");
				setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
				setAttribute(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
				setAttribute(svg, "x", "0px");
				setAttribute(svg, "y", "0px");
				setAttribute(svg, "viewBox", "0 0 612 792");
				setAttribute(svg, "enable-background", "new 0 0 612 792");
				setAttribute(svg, "xml:space", "preserve");
				setAttribute(svg, "class", "svelte-1s96grg");
				addLoc(svg, file, 27, 6, 731);
				div5.className = "loading-section svelte-1s96grg";
				toggleClass(div5, "visible", ctx.step.isLoading);
				addLoc(div5, file, 23, 4, 622);
				addListener(form, "submit", submit_handler);
				form.className = "bs-card white svelte-1s96grg";
				addLoc(form, file, 4, 2, 103);
				div6.className = div6_class_value = "scroll-section " + ctx.step.id + " svelte-1s96grg";
				div6.dataset.id = div6_data_id_value = ctx.step.id;
				toggleClass(div6, "visible", ctx.step.isVisible);
				addLoc(div6, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div6, anchor);
				append(div6, form);
				append(form, div4);
				append(div4, div1);
				if (!slot_content_heading) {
					append(div1, div0);
				}

				else {
					append(div1, slot_content_heading);
				}

				append(div4, text1);
				if (!slot_content_body) {
					append(div4, div2);
				}

				else {
					append(div4, slot_content_body_before || (slot_content_body_before = createComment()));
					append(div4, slot_content_body);
					append(div4, slot_content_body_after || (slot_content_body_after = createComment()));
				}

				append(div4, text3);
				append(div4, div3);
				if (!slot_content_footer) {
					append(div3, a);
					append(div3, text5);
					append(div3, button);
				}

				else {
					append(div3, slot_content_footer);
				}

				append(form, text7);
				append(form, div5);
				append(div5, svg);
				append(svg, g);
				append(g, path0);
				append(g, path1);
				component.refs.loadingSection = div5;
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.step) {
					toggleClass(div5, "visible", ctx.step.isLoading);
				}

				if ((changed.step) && div6_class_value !== (div6_class_value = "scroll-section " + ctx.step.id + " svelte-1s96grg")) {
					div6.className = div6_class_value;
				}

				if ((changed.step) && div6_data_id_value !== (div6_data_id_value = ctx.step.id)) {
					div6.dataset.id = div6_data_id_value;
				}

				if ((changed.step || changed.step)) {
					toggleClass(div6, "visible", ctx.step.isVisible);
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div6);
				}

				if (slot_content_heading) {
					reinsertChildren(div1, slot_content_heading);
				}

				if (slot_content_body) {
					reinsertBetween(slot_content_body_before, slot_content_body_after, slot_content_body);
					detachNode(slot_content_body_before);
					detachNode(slot_content_body_after);
				}

				if (slot_content_footer) {
					reinsertChildren(div3, slot_content_footer);
				}

				if (component.refs.loadingSection === div5) { component.refs.loadingSection = null; }
				removeListener(form, "submit", submit_handler);
			}
		};
	}

	function InterviewStep(options) {
		var this$1 = this;

		this._debugName = '<InterviewStep>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this.refs = {};
		this._state = assign({}, options.data);
		if (!('step' in this._state)) { console.warn("<InterviewStep> was created without expected data property 'step'"); }
		this._intro = !!options.intro;

		this._slotted = options.slots || {};

		this._fragment = create_main_fragment(this, this._state);

		this.root._oncreate.push(function () {
			oncreate.call(this$1);
			this$1.fire("update", { changed: assignTrue({}, this$1._state), current: this$1._state });
		});

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(InterviewStep.prototype, protoDev);
	assign(InterviewStep.prototype, methods);

	InterviewStep.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\sections\Location.html generated by Svelte v2.15.3 */

	var methods$1 = { 
	  lookupZip: function lookupZip() { 
	    console.log('lookup zip', this.get());
	  }
	};

	var file$1 = "src\\Components\\sections\\Location.html";

	function keyup_handler(event) {
		var ref = this._svelte;
		var component = ref.component;

		component.lookupZip();
	}

	function get_each_context(ctx, list, i) {
		var child_ctx = Object.create(ctx);
		child_ctx.field = list[i];
		child_ctx.each_value = list;
		child_ctx.field_index = i;
		return child_ctx;
	}

	function create_main_fragment$1(component, ctx) {
		var div0, text1, div1, text2, div2, button, interviewstep_updating = {}, current;

		var each_value = ctx.step.fields;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(component, get_each_context(ctx, each_value, i));
		}

		var interviewstep_initial_data = {};
		if (ctx.step 
	   !== void 0) {
			interviewstep_initial_data.step = ctx.step 
	  ;
			interviewstep_updating.step = true;
		}
		if (ctx.section !== void 0) {
			interviewstep_initial_data.section = ctx.section;
			interviewstep_updating.section = true;
		}
		var interviewstep = new InterviewStep({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), footer: createFragment(), body: createFragment(), heading: createFragment() },
			data: interviewstep_initial_data,
			_bind: function _bind(changed, childState) {
				var newState = {};
				if (!interviewstep_updating.step && changed.step) {
					newState.step = childState.step;
				}

				if (!interviewstep_updating.section && changed.section) {
					newState.section = childState.section;
				}
				component._set(newState);
				interviewstep_updating = {};
			}
		});

		component.root._beforecreate.push(function () {
			interviewstep._bind({ step: 1, section: 1 }, interviewstep.get());
		});

		return {
			c: function create() {
				div0 = createElement("div");
				div0.textContent = "What is your location?";
				text1 = createText("\r\n  ");
				div1 = createElement("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				text2 = createText("\r\n  ");
				div2 = createElement("div");
				button = createElement("button");
				button.textContent = "Next";
				interviewstep._fragment.c();
				setAttribute(div0, "slot", "heading");
				addLoc(div0, file$1, 3, 2, 50);
				setAttribute(div1, "slot", "body");
				addLoc(div1, file$1, 4, 2, 102);
				button.type = "submit";
				button.className = "bs-btn";
				addLoc(button, file$1, 16, 4, 418);
				setAttribute(div2, "slot", "footer");
				addLoc(div2, file$1, 15, 2, 393);
			},

			m: function mount(target, anchor) {
				append(interviewstep._slotted.heading, div0);
				append(interviewstep._slotted.default, text1);
				append(interviewstep._slotted.body, div1);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div1, null);
				}

				append(interviewstep._slotted.default, text2);
				append(interviewstep._slotted.footer, div2);
				append(div2, button);
				interviewstep._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if (changed.step) {
					each_value = ctx.step.fields;

					for (var i = 0; i < each_value.length; i += 1) {
						var child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				var interviewstep_changes = {};
				if (!interviewstep_updating.step && changed.step) {
					interviewstep_changes.step = ctx.step 
	  ;
					interviewstep_updating.step = ctx.step 
	   !== void 0;
				}
				if (!interviewstep_updating.section && changed.section) {
					interviewstep_changes.section = ctx.section;
					interviewstep_updating.section = ctx.section !== void 0;
				}
				interviewstep._set(interviewstep_changes);
				interviewstep_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				if (interviewstep) { interviewstep._fragment.o(outrocallback); }
				current = false;
			},

			d: function destroy$$1(detach) {
				destroyEach(each_blocks, detach);

				interviewstep.destroy(detach);
			}
		};
	}

	// (6:4) {#each step.fields as field}
	function create_each_block(component, ctx) {
		var label, label_for_value, text, input, input_updating = false, input_id_value, input_placeholder_value;

		function input_input_handler() {
			input_updating = true;
			ctx.each_value[ctx.field_index].value = input.value;
			component.set({ step: ctx.step });
			input_updating = false;
		}

		return {
			c: function create() {
				label = createElement("label");
				text = createText("\r\n      ");
				input = createElement("input");
				label.htmlFor = label_for_value = ctx.field.id;
				addLoc(label, file$1, 6, 6, 161);

				input._svelte = { component: component, ctx: ctx };

				addListener(input, "input", input_input_handler);
				addListener(input, "keyup", keyup_handler);
				input.id = input_id_value = ctx.field.id;
				setAttribute(input, "type", "text");
				input.placeholder = input_placeholder_value = ctx.field.placeholder;
				input.className = "svelte-1fygpdg";
				addLoc(input, file$1, 7, 6, 201);
			},

			m: function mount(target, anchor) {
				insert(target, label, anchor);
				insert(target, text, anchor);
				insert(target, input, anchor);

				input.value = ctx.field.value;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if ((changed.step) && label_for_value !== (label_for_value = ctx.field.id)) {
					label.htmlFor = label_for_value;
				}

				input._svelte.ctx = ctx;
				if (!input_updating && changed.step) { input.value = ctx.field.value; }
				if ((changed.step) && input_id_value !== (input_id_value = ctx.field.id)) {
					input.id = input_id_value;
				}

				if ((changed.step) && input_placeholder_value !== (input_placeholder_value = ctx.field.placeholder)) {
					input.placeholder = input_placeholder_value;
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(label);
					detachNode(text);
					detachNode(input);
				}

				removeListener(input, "input", input_input_handler);
				removeListener(input, "keyup", keyup_handler);
			}
		};
	}

	function Location(options) {
		this._debugName = '<Location>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('step' in this._state)) { console.warn("<Location> was created without expected data property 'step'"); }
		if (!('section' in this._state)) { console.warn("<Location> was created without expected data property 'section'"); }
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$1(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(Location.prototype, protoDev);
	assign(Location.prototype, methods$1);

	Location.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Radio.html generated by Svelte v2.15.3 */

	var file$2 = "src\\Components\\questionTypes\\Radio.html";

	function get_each_context$1(ctx, list, i) {
		var child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$2(component, ctx) {
		var each_blocks_1 = [], each_lookup = blankObject(), each_anchor, current;

		var each_value = ctx.question.answerElements;

		var get_key = function (ctx) { return ctx.answerID; };

		for (var i = 0; i < each_value.length; i += 1) {
			var child_ctx = get_each_context$1(ctx, each_value, i);
			var key = get_key(child_ctx);
			each_blocks_1[i] = each_lookup[key] = create_each_block$1(component, key, child_ctx);
		}

		return {
			c: function create() {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].c(); }

				each_anchor = createComment();
			},

			m: function mount(target, anchor) {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].m(target, anchor); }

				insert(target, each_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var each_value = ctx.question.answerElements;
				each_blocks_1 = updateKeyedEach(each_blocks_1, component, changed, get_key, 1, ctx, each_value, each_lookup, each_anchor.parentNode, destroyBlock, create_each_block$1, "m", each_anchor, get_each_context$1);
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].d(detach); }

				if (detach) {
					detachNode(each_anchor);
				}
			}
		};
	}

	// (1:0) {#each question.answerElements as {answerID,answerText}
	function create_each_block$1(component, key_1, ctx) {
		var div, input, input_id_value, input_value_value, input_name_value, text0, label, text1_value = ctx.answerText, text1, label_for_value, text2;

		function input_change_handler() {
			ctx.question.value = input.__value;
			component.set({ question: ctx.question });
		}

		return {
			key: key_1,

			first: null,

			c: function create() {
				div = createElement("div");
				input = createElement("input");
				text0 = createText("\r\n\t\t");
				label = createElement("label");
				text1 = createText(text1_value);
				text2 = createText("\r\n\t");
				component._bindingGroups[0].push(input);
				addListener(input, "change", input_change_handler);
				setAttribute(input, "type", "radio");
				input.id = input_id_value = "answer_" + ctx.answerID;
				input.__value = input_value_value = "answer_" + ctx.answerID;
				input.value = input.__value;
				input.name = input_name_value = "radio_" + ctx.question.questionID;
				addLoc(input, file$2, 2, 2, 79);
				label.htmlFor = label_for_value = "answer_" + ctx.answerID;
				label.className = "svelte-5jml85";
				addLoc(label, file$2, 3, 2, 215);
				addLoc(div, file$2, 1, 1, 70);
				this.first = div;
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, input);

				input.checked = input.__value === ctx.question.value;

				append(div, text0);
				append(div, label);
				append(label, text1);
				append(div, text2);
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if (changed.question) { input.checked = input.__value === ctx.question.value; }
				if ((changed.question) && input_id_value !== (input_id_value = "answer_" + ctx.answerID)) {
					input.id = input_id_value;
				}

				if ((changed.question) && input_value_value !== (input_value_value = "answer_" + ctx.answerID)) {
					input.__value = input_value_value;
				}

				input.value = input.__value;
				if ((changed.question) && input_name_value !== (input_name_value = "radio_" + ctx.question.questionID)) {
					input.name = input_name_value;
				}

				if ((changed.question) && text1_value !== (text1_value = ctx.answerText)) {
					setData(text1, text1_value);
				}

				if ((changed.question) && label_for_value !== (label_for_value = "answer_" + ctx.answerID)) {
					label.htmlFor = label_for_value;
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				component._bindingGroups[0].splice(component._bindingGroups[0].indexOf(input), 1);
				removeListener(input, "change", input_change_handler);
			}
		};
	}

	function Radio(options) {
		this._debugName = '<Radio>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('question' in this._state)) { console.warn("<Radio> was created without expected data property 'question'"); }
		this._bindingGroups = [[]];
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$2(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(Radio.prototype, protoDev);

	Radio.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Checkbox.html generated by Svelte v2.15.3 */

	var methods$2 = { 
		updateValue: function updateValue(question) { 
	        question.value = question.answerElements
	          .filter(function (a) { return a.checked; })
	          .map(function (a) { return a.answerID; })
	          .join(', ');
	        this.set({question: question});
		}
	    };

	var file$3 = "src\\Components\\questionTypes\\Checkbox.html";

	function change_handler(event) {
		var ref = this._svelte;
		var component = ref.component;
		var ctx = ref.ctx;

		component.updateValue(ctx.question);
	}

	function get_each_context$2(ctx, list, i) {
		var child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		child_ctx.checked = list[i].checked;
		child_ctx.each_value = list;
		child_ctx.each_index = i;
		return child_ctx;
	}

	function create_main_fragment$3(component, ctx) {
		var each_anchor, current;

		var each_value = ctx.question.answerElements;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(component, get_each_context$2(ctx, each_value, i));
		}

		return {
			c: function create() {
				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_anchor = createComment();
			},

			m: function mount(target, anchor) {
				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(target, anchor);
				}

				insert(target, each_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.question) {
					each_value = ctx.question.answerElements;

					for (var i = 0; i < each_value.length; i += 1) {
						var child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$2(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(each_anchor.parentNode, each_anchor);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				destroyEach(each_blocks, detach);

				if (detach) {
					detachNode(each_anchor);
				}
			}
		};
	}

	// (1:0) {#each question.answerElements as {answerID,answerText,checked}}
	function create_each_block$2(component, ctx) {
		var div, input, input_id_value, input_value_value, text0, label, text1_value = ctx.answerText, text1, label_for_value, text2;

		function input_change_handler() {
			ctx.each_value[ctx.each_index].checked = input.checked;
			component.set({ question: ctx.question });
		}

		return {
			c: function create() {
				div = createElement("div");
				input = createElement("input");
				text0 = createText("\r\n    ");
				label = createElement("label");
				text1 = createText(text1_value);
				text2 = createText("\r\n  ");
				input._svelte = { component: component, ctx: ctx };

				addListener(input, "change", input_change_handler);
				addListener(input, "change", change_handler);
				setAttribute(input, "type", "checkbox");
				input.id = input_id_value = ctx.answerID;
				input.__value = input_value_value = ctx.answerID;
				input.value = input.__value;
				addLoc(input, file$3, 2, 4, 79);
				label.htmlFor = label_for_value = ctx.answerID;
				label.className = "svelte-1vp3xsv";
				addLoc(label, file$3, 3, 4, 196);
				addLoc(div, file$3, 1, 2, 68);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, input);

				input.checked = ctx.checked;

				append(div, text0);
				append(div, label);
				append(label, text1);
				append(div, text2);
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				input._svelte.ctx = ctx;
				if (changed.question) { input.checked = ctx.checked; }
				if ((changed.question) && input_id_value !== (input_id_value = ctx.answerID)) {
					input.id = input_id_value;
				}

				if ((changed.question) && input_value_value !== (input_value_value = ctx.answerID)) {
					input.__value = input_value_value;
				}

				input.value = input.__value;
				if ((changed.question) && text1_value !== (text1_value = ctx.answerText)) {
					setData(text1, text1_value);
				}

				if ((changed.question) && label_for_value !== (label_for_value = ctx.answerID)) {
					label.htmlFor = label_for_value;
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				removeListener(input, "change", input_change_handler);
				removeListener(input, "change", change_handler);
			}
		};
	}

	function Checkbox(options) {
		this._debugName = '<Checkbox>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('question' in this._state)) { console.warn("<Checkbox> was created without expected data property 'question'"); }
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$3(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(Checkbox.prototype, protoDev);
	assign(Checkbox.prototype, methods$2);

	Checkbox.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Select.html generated by Svelte v2.15.3 */

	var file$4 = "src\\Components\\questionTypes\\Select.html";

	function get_each_context$3(ctx, list, i) {
		var child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$4(component, ctx) {
		var select, select_updating = false, select_id_value, current;

		var each_value = ctx.question.answerElements;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$3(component, get_each_context$3(ctx, each_value, i));
		}

		function select_change_handler() {
			select_updating = true;
			ctx.question.value = selectValue(select);
			component.set({ question: ctx.question });
			select_updating = false;
		}

		return {
			c: function create() {
				select = createElement("select");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				addListener(select, "change", select_change_handler);
				if (!('question' in ctx)) { component.root._beforecreate.push(select_change_handler); }
				select.id = select_id_value = ctx.question.questionId;
				addLoc(select, file$4, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, select, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(select, null);
				}

				selectOption(select, ctx.question.value);

				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if (changed.question) {
					each_value = ctx.question.answerElements;

					for (var i = 0; i < each_value.length; i += 1) {
						var child_ctx = get_each_context$3(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$3(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				if (!select_updating && changed.question) { selectOption(select, ctx.question.value); }
				if ((changed.question) && select_id_value !== (select_id_value = ctx.question.questionId)) {
					select.id = select_id_value;
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(select);
				}

				destroyEach(each_blocks, detach);

				removeListener(select, "change", select_change_handler);
			}
		};
	}

	// (2:1) {#each question.answerElements as {answerID,answerText}}
	function create_each_block$3(component, ctx) {
		var option, text0_value = ctx.answerText, text0, text1, option_value_value;

		return {
			c: function create() {
				option = createElement("option");
				text0 = createText(text0_value);
				text1 = createText("\r\n\t\t");
				option.__value = option_value_value = ctx.answerID;
				option.value = option.__value;
				addLoc(option, file$4, 2, 2, 122);
			},

			m: function mount(target, anchor) {
				insert(target, option, anchor);
				append(option, text0);
				append(option, text1);
			},

			p: function update(changed, ctx) {
				if ((changed.question) && text0_value !== (text0_value = ctx.answerText)) {
					setData(text0, text0_value);
				}

				if ((changed.question) && option_value_value !== (option_value_value = ctx.answerID)) {
					option.__value = option_value_value;
				}

				option.value = option.__value;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(option);
				}
			}
		};
	}

	function Select(options) {
		this._debugName = '<Select>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('question' in this._state)) { console.warn("<Select> was created without expected data property 'question'"); }
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$4(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(Select.prototype, protoDev);

	Select.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Text.html generated by Svelte v2.15.3 */

	var file$5 = "src\\Components\\questionTypes\\Text.html";

	function create_main_fragment$5(component, ctx) {
		var input, input_updating = false, input_placeholder_value, current;

		function input_input_handler() {
			input_updating = true;
			ctx.question.value = input.value;
			component.set({ question: ctx.question });
			input_updating = false;
		}

		return {
			c: function create() {
				input = createElement("input");
				addListener(input, "input", input_input_handler);
				setAttribute(input, "type", "text");
				input.placeholder = input_placeholder_value = ctx.question.placeholder;
				addLoc(input, file$5, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, input, anchor);

				input.value = ctx.question.value;

				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if (!input_updating && changed.question) { input.value = ctx.question.value; }
				if ((changed.question) && input_placeholder_value !== (input_placeholder_value = ctx.question.placeholder)) {
					input.placeholder = input_placeholder_value;
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(input);
				}

				removeListener(input, "input", input_input_handler);
			}
		};
	}

	function Text(options) {
		this._debugName = '<Text>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('question' in this._state)) { console.warn("<Text> was created without expected data property 'question'"); }
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$5(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(Text.prototype, protoDev);

	Text.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\sections\Question.html generated by Svelte v2.15.3 */


	  function data() { 
	  return { 
	    templates: { 
	      Select: Select,
	      Checkbox: Checkbox,
	      Radio: Radio,
	      Text: Text
	      // DATE: Date, 
	      // CALENDAR: Date,
	      // TEXT_AREA: Textarea,
	      // GRAPHICAL_RADIO: GraphicalRadio
	    }	
	  }
	}
	var file$6 = "src\\Components\\sections\\Question.html";

	function create_main_fragment$6(component, ctx) {
		var div0, text0_value = ctx.step.questionText, text0, text1, div2, div1, switch_instance_updating = {}, interviewstep_updating = {}, current;

		var switch_value = ctx.templates[ctx.step.presentationType];

		function switch_props(ctx) {
			var switch_instance_initial_data = { name: "Question" };
			if (ctx.step !== void 0) {
				switch_instance_initial_data.question = ctx.step;
				switch_instance_updating.question = true;
			}
			if (ctx.interview  !== void 0) {
				switch_instance_initial_data.interview = ctx.interview ;
				switch_instance_updating.interview = true;
			}
			return {
				root: component.root,
				store: component.store,
				data: switch_instance_initial_data,
				_bind: function _bind(changed, childState) {
					var newState = {};
					if (!switch_instance_updating.question && changed.question) {
						newState.step = childState.question;
					}

					if (!switch_instance_updating.interview && changed.interview) {
						newState.interview = childState.interview;
					}
					component._set(newState);
					switch_instance_updating = {};
				}
			};
		}

		if (switch_value) {
			var switch_instance = new switch_value(switch_props(ctx));

			component.root._beforecreate.push(function () {
				switch_instance._bind({ question: 1, interview: 1 }, switch_instance.get());
			});
		}

		var interviewstep_initial_data = {};
		if (ctx.step 
	   !== void 0) {
			interviewstep_initial_data.step = ctx.step 
	  ;
			interviewstep_updating.step = true;
		}
		if (ctx.section !== void 0) {
			interviewstep_initial_data.section = ctx.section;
			interviewstep_updating.section = true;
		}
		var interviewstep = new InterviewStep({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), body: createFragment(), heading: createFragment() },
			data: interviewstep_initial_data,
			_bind: function _bind(changed, childState) {
				var newState = {};
				if (!interviewstep_updating.step && changed.step) {
					newState.step = childState.step;
				}

				if (!interviewstep_updating.section && changed.section) {
					newState.section = childState.section;
				}
				component._set(newState);
				interviewstep_updating = {};
			}
		});

		component.root._beforecreate.push(function () {
			interviewstep._bind({ step: 1, section: 1 }, interviewstep.get());
		});

		return {
			c: function create() {
				div0 = createElement("div");
				text0 = createText(text0_value);
				text1 = createText("\r\n  ");
				div2 = createElement("div");
				div1 = createElement("div");
				if (switch_instance) { switch_instance._fragment.c(); }
				interviewstep._fragment.c();
				setAttribute(div0, "slot", "heading");
				addLoc(div0, file$6, 3, 2, 50);
				div1.className = "answers-block svelte-d70yqh";
				addLoc(div1, file$6, 5, 4, 122);
				setAttribute(div2, "slot", "body");
				addLoc(div2, file$6, 4, 2, 99);
			},

			m: function mount(target, anchor) {
				append(interviewstep._slotted.heading, div0);
				append(div0, text0);
				append(interviewstep._slotted.default, text1);
				append(interviewstep._slotted.body, div2);
				append(div2, div1);

				if (switch_instance) {
					switch_instance._mount(div1, null);
				}

				interviewstep._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if ((!current || changed.step) && text0_value !== (text0_value = ctx.step.questionText)) {
					setData(text0, text0_value);
				}

				var switch_instance_changes = {};
				if (!switch_instance_updating.question && changed.step) {
					switch_instance_changes.question = ctx.step;
					switch_instance_updating.question = ctx.step !== void 0;
				}
				if (!switch_instance_updating.interview && changed.interview) {
					switch_instance_changes.interview = ctx.interview ;
					switch_instance_updating.interview = ctx.interview  !== void 0;
				}

				if (switch_value !== (switch_value = ctx.templates[ctx.step.presentationType])) {
					if (switch_instance) {
						var old_component = switch_instance;
						old_component._fragment.o(function () {
							old_component.destroy();
						});
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));

						component.root._beforecreate.push(function () {
							var changed = {};
							if (ctx.step === void 0) { changed.question = 1; }
							if (ctx.interview  === void 0) { changed.interview = 1; }
							switch_instance._bind(changed, switch_instance.get());
						});
						switch_instance._fragment.c();
						switch_instance._mount(div1, null);
					} else {
						switch_instance = null;
					}
				}

				else if (switch_value) {
					switch_instance._set(switch_instance_changes);
					switch_instance_updating = {};
				}

				var interviewstep_changes = {};
				if (!interviewstep_updating.step && changed.step) {
					interviewstep_changes.step = ctx.step 
	  ;
					interviewstep_updating.step = ctx.step 
	   !== void 0;
				}
				if (!interviewstep_updating.section && changed.section) {
					interviewstep_changes.section = ctx.section;
					interviewstep_updating.section = ctx.section !== void 0;
				}
				interviewstep._set(interviewstep_changes);
				interviewstep_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				outrocallback = callAfter(outrocallback, 2);

				if (switch_instance) { switch_instance._fragment.o(outrocallback); }
				if (interviewstep) { interviewstep._fragment.o(outrocallback); }
				current = false;
			},

			d: function destroy$$1(detach) {
				if (switch_instance) { switch_instance.destroy(); }
				interviewstep.destroy(detach);
			}
		};
	}

	function Question(options) {
		this._debugName = '<Question>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign(data(), options.data);
		if (!('step' in this._state)) { console.warn("<Question> was created without expected data property 'step'"); }
		if (!('section' in this._state)) { console.warn("<Question> was created without expected data property 'section'"); }
		if (!('templates' in this._state)) { console.warn("<Question> was created without expected data property 'templates'"); }
		if (!('interview' in this._state)) { console.warn("<Question> was created without expected data property 'interview'"); }
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$6(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(Question.prototype, protoDev);

	Question.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\sections\ContactSubmit.html generated by Svelte v2.15.3 */

	var file$7 = "src\\Components\\sections\\ContactSubmit.html";

	function get_each_context$4(ctx, list, i) {
		var child_ctx = Object.create(ctx);
		child_ctx.id = list[i].id;
		child_ctx.label = list[i].label;
		child_ctx.placeholder = list[i].placeholder;
		child_ctx.type = list[i].type;
		return child_ctx;
	}

	function create_main_fragment$7(component, ctx) {
		var div0, text0_value = ctx.step.heading, text0, text1, div1, interviewstep_updating = {}, current;

		var each_value = ctx.step.fields;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$4(component, get_each_context$4(ctx, each_value, i));
		}

		var interviewstep_initial_data = {};
		if (ctx.step 
	   !== void 0) {
			interviewstep_initial_data.step = ctx.step 
	  ;
			interviewstep_updating.step = true;
		}
		if (ctx.section !== void 0) {
			interviewstep_initial_data.section = ctx.section;
			interviewstep_updating.section = true;
		}
		var interviewstep = new InterviewStep({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), body: createFragment(), heading: createFragment() },
			data: interviewstep_initial_data,
			_bind: function _bind(changed, childState) {
				var newState = {};
				if (!interviewstep_updating.step && changed.step) {
					newState.step = childState.step;
				}

				if (!interviewstep_updating.section && changed.section) {
					newState.section = childState.section;
				}
				component._set(newState);
				interviewstep_updating = {};
			}
		});

		component.root._beforecreate.push(function () {
			interviewstep._bind({ step: 1, section: 1 }, interviewstep.get());
		});

		return {
			c: function create() {
				div0 = createElement("div");
				text0 = createText(text0_value);
				text1 = createText("\r\n  ");
				div1 = createElement("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				interviewstep._fragment.c();
				setAttribute(div0, "slot", "heading");
				addLoc(div0, file$7, 3, 2, 50);
				setAttribute(div1, "slot", "body");
				addLoc(div1, file$7, 4, 2, 94);
			},

			m: function mount(target, anchor) {
				append(interviewstep._slotted.heading, div0);
				append(div0, text0);
				append(interviewstep._slotted.default, text1);
				append(interviewstep._slotted.body, div1);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div1, null);
				}

				interviewstep._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if ((!current || changed.step) && text0_value !== (text0_value = ctx.step.heading)) {
					setData(text0, text0_value);
				}

				if (changed.step) {
					each_value = ctx.step.fields;

					for (var i = 0; i < each_value.length; i += 1) {
						var child_ctx = get_each_context$4(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$4(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				var interviewstep_changes = {};
				if (!interviewstep_updating.step && changed.step) {
					interviewstep_changes.step = ctx.step 
	  ;
					interviewstep_updating.step = ctx.step 
	   !== void 0;
				}
				if (!interviewstep_updating.section && changed.section) {
					interviewstep_changes.section = ctx.section;
					interviewstep_updating.section = ctx.section !== void 0;
				}
				interviewstep._set(interviewstep_changes);
				interviewstep_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				if (interviewstep) { interviewstep._fragment.o(outrocallback); }
				current = false;
			},

			d: function destroy$$1(detach) {
				destroyEach(each_blocks, detach);

				interviewstep.destroy(detach);
			}
		};
	}

	// (6:4) {#each step.fields as {id, label, placeholder, type}}
	function create_each_block$4(component, ctx) {
		var div, label, text0_value = ctx.label, text0, label_for_value, text1, input, input_type_value, input_id_value, input_placeholder_value, text2;

		return {
			c: function create() {
				div = createElement("div");
				label = createElement("label");
				text0 = createText(text0_value);
				text1 = createText("\r\n        ");
				input = createElement("input");
				text2 = createText("\r\n      ");
				label.htmlFor = label_for_value = ctx.id;
				addLoc(label, file$7, 7, 8, 215);
				setAttribute(input, "type", input_type_value = ctx.type);
				input.id = input_id_value = ctx.id;
				input.placeholder = input_placeholder_value = ctx.placeholder;
				addLoc(input, file$7, 8, 8, 258);
				div.className = "bs-form-group";
				addLoc(div, file$7, 6, 6, 178);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, label);
				append(label, text0);
				append(div, text1);
				append(div, input);
				append(div, text2);
			},

			p: function update(changed, ctx) {
				if ((changed.step) && text0_value !== (text0_value = ctx.label)) {
					setData(text0, text0_value);
				}

				if ((changed.step) && label_for_value !== (label_for_value = ctx.id)) {
					label.htmlFor = label_for_value;
				}

				if ((changed.step) && input_type_value !== (input_type_value = ctx.type)) {
					setAttribute(input, "type", input_type_value);
				}

				if ((changed.step) && input_id_value !== (input_id_value = ctx.id)) {
					input.id = input_id_value;
				}

				if ((changed.step) && input_placeholder_value !== (input_placeholder_value = ctx.placeholder)) {
					input.placeholder = input_placeholder_value;
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}
			}
		};
	}

	function ContactSubmit(options) {
		this._debugName = '<ContactSubmit>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('step' in this._state)) { console.warn("<ContactSubmit> was created without expected data property 'step'"); }
		if (!('section' in this._state)) { console.warn("<ContactSubmit> was created without expected data property 'section'"); }
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$7(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(ContactSubmit.prototype, protoDev);

	ContactSubmit.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\InterviewSection.html generated by Svelte v2.15.3 */


	function data$1() { 
	  return { 
	    templates: { 
	      Location: Location, 
	      Question: Question, 
	      ContactSubmit: ContactSubmit
	    }
	  }
	}
	function get_each_context$5(ctx, list, i) {
		var child_ctx = Object.create(ctx);
		child_ctx.step = list[i];
		child_ctx.each_value = list;
		child_ctx.step_index = i;
		return child_ctx;
	}

	function create_main_fragment$8(component, ctx) {
		var each_blocks_1 = [], each_lookup = blankObject(), each_anchor, current;

		var each_value = ctx.section.steps;

		var get_key = function (ctx) { return ctx.step.id; };

		for (var i = 0; i < each_value.length; i += 1) {
			var child_ctx = get_each_context$5(ctx, each_value, i);
			var key = get_key(child_ctx);
			each_blocks_1[i] = each_lookup[key] = create_each_block$5(component, key, child_ctx);
		}

		return {
			c: function create() {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].c(); }

				each_anchor = createComment();
			},

			m: function mount(target, anchor) {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].i(target, anchor); }

				insert(target, each_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var each_value = ctx.section.steps;
				each_blocks_1 = updateKeyedEach(each_blocks_1, component, changed, get_key, 1, ctx, each_value, each_lookup, each_anchor.parentNode, outroAndDestroyBlock, create_each_block$5, "i", each_anchor, get_each_context$5);
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				var countdown = callAfter(outrocallback, each_blocks_1.length);
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].o(countdown); }

				current = false;
			},

			d: function destroy$$1(detach) {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].d(detach); }

				if (detach) {
					detachNode(each_anchor);
				}
			}
		};
	}

	// (1:0) {#each section.steps as step (step.id)}
	function create_each_block$5(component, key_1, ctx) {
		var first, switch_instance_updating = {}, switch_instance_anchor, current;

		var switch_value = ctx.templates[ctx.section.component];

		function switch_props(ctx) {
			var switch_instance_initial_data = {};
			if (ctx.step.isLoading !== void 0) {
				switch_instance_initial_data.isLoading = ctx.step.isLoading;
				switch_instance_updating.isLoading = true;
			}
			if (ctx.step 
	     !== void 0) {
				switch_instance_initial_data.step = ctx.step 
	    ;
				switch_instance_updating.step = true;
			}
			if (ctx.section 
	     !== void 0) {
				switch_instance_initial_data.section = ctx.section 
	    ;
				switch_instance_updating.section = true;
			}
			return {
				root: component.root,
				store: component.store,
				data: switch_instance_initial_data,
				_bind: function _bind(changed, childState) {
					var newState = {};
					if (!switch_instance_updating.isLoading && changed.isLoading) {
						ctx.step.isLoading = childState.isLoading;

						newState.section = ctx.section;
					}

					if (!switch_instance_updating.step && changed.step) {
						ctx.each_value[ctx.step_index] = childState.step = childState.step;

						newState.section = ctx.section;
					}

					if (!switch_instance_updating.section && changed.section) {
						newState.section = childState.section;
					}
					component._set(newState);
					switch_instance_updating = {};
				}
			};
		}

		if (switch_value) {
			var switch_instance = new switch_value(switch_props(ctx));

			component.root._beforecreate.push(function () {
				switch_instance._bind({ isLoading: 1, step: 1, section: 1 }, switch_instance.get());
			});
		}

		function switch_instance_stepSubmitted(event) {
			component.fire("stepSubmitted", event);
		}

		if (switch_instance) { switch_instance.on("stepSubmitted", switch_instance_stepSubmitted); }

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				if (switch_instance) { switch_instance._fragment.c(); }
				switch_instance_anchor = createComment();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);

				if (switch_instance) {
					switch_instance._mount(target, anchor);
				}

				insert(target, switch_instance_anchor, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				var switch_instance_changes = {};
				if (!switch_instance_updating.isLoading && changed.section) {
					switch_instance_changes.isLoading = ctx.step.isLoading;
					switch_instance_updating.isLoading = ctx.step.isLoading !== void 0;
				}
				if (!switch_instance_updating.step && changed.section) {
					switch_instance_changes.step = ctx.step 
	    ;
					switch_instance_updating.step = ctx.step 
	     !== void 0;
				}
				if (!switch_instance_updating.section && changed.section) {
					switch_instance_changes.section = ctx.section 
	    ;
					switch_instance_updating.section = ctx.section 
	     !== void 0;
				}

				if (switch_value !== (switch_value = ctx.templates[ctx.section.component])) {
					if (switch_instance) {
						var old_component = switch_instance;
						old_component._fragment.o(function () {
							old_component.destroy();
						});
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));

						component.root._beforecreate.push(function () {
							var changed = {};
							if (ctx.step.isLoading === void 0) { changed.isLoading = 1; }
							if (ctx.step 
	     === void 0) { changed.step = 1; }
							if (ctx.section 
	     === void 0) { changed.section = 1; }
							switch_instance._bind(changed, switch_instance.get());
						});
						switch_instance._fragment.c();
						switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);

						switch_instance.on("stepSubmitted", switch_instance_stepSubmitted);
					} else {
						switch_instance = null;
					}
				}

				else if (switch_value) {
					switch_instance._set(switch_instance_changes);
					switch_instance_updating = {};
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				if (switch_instance) { switch_instance._fragment.o(outrocallback); }
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
					detachNode(switch_instance_anchor);
				}

				if (switch_instance) { switch_instance.destroy(detach); }
			}
		};
	}

	function InterviewSection(options) {
		this._debugName = '<InterviewSection>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign(data$1(), options.data);
		if (!('section' in this._state)) { console.warn("<InterviewSection> was created without expected data property 'section'"); }
		if (!('templates' in this._state)) { console.warn("<InterviewSection> was created without expected data property 'templates'"); }
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$8(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(InterviewSection.prototype, protoDev);

	InterviewSection.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\App.html generated by Svelte v2.15.3 */



	function store_1() { 
		return interviewStore;
	}
	var file$9 = "src\\App.html";

	function get_each_context$6(ctx, list, i) {
		var child_ctx = Object.create(ctx);
		child_ctx.section = list[i];
		return child_ctx;
	}

	function create_main_fragment$9(component, ctx) {
		var promise, text, div, current;

		var info = {
			component: component,
			ctx: ctx,
			current: null,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 'success',
			error: 'null',
			blocks: Array(3)
		};

		handlePromise(promise = ctx.$interview, info);

		return {
			c: function create() {
				info.block.c();

				text = createText("\r\n\r\n");
				div = createElement("div");
				div.className = "footer-displacer svelte-1jp3w5l";
				addLoc(div, file$9, 12, 0, 291);
			},

			m: function mount(target, anchor) {
				info.block.i(target, info.anchor = anchor);
				info.mount = function () { return text.parentNode; };

				insert(target, text, anchor);
				insert(target, div, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				info.ctx = ctx;

				if (('$interview' in changed) && promise !== (promise = ctx.$interview) && handlePromise(promise, info)) ; else {
					info.block.p(changed, assign(assign({}, ctx), info.resolved));
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				var countdown = callAfter(outrocallback, 3);
				for (var i = 0; i < 3; i += 1) {
					var block = info.blocks[i];
					if (block) { block.o(countdown); }
					else { countdown(); }
				}

				current = false;
			},

			d: function destroy$$1(detach) {
				info.block.d(detach);
				info = null;

				if (detach) {
					detachNode(text);
					detachNode(div);
				}
			}
		};
	}

	// (1:0) {#await $interview then success}
	function create_catch_block(component, ctx) {

		return {
			c: noop,

			m: noop,

			p: noop,

			i: noop,

			o: run,

			d: noop
		};
	}

	// (1:32)     {#if $interview}
	function create_then_block(component, ctx) {
		var if_block_anchor, current;

		var if_block = (ctx.$interview) && create_if_block(component, ctx);

		return {
			c: function create() {
				if (if_block) { if_block.c(); }
				if_block_anchor = createComment();
			},

			m: function mount(target, anchor) {
				if (if_block) { if_block.m(target, anchor); }
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.$interview) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(component, ctx);
						if (if_block) { if_block.c(); }
					}

					if_block.i(if_block_anchor.parentNode, if_block_anchor);
				} else if (if_block) {
					if_block.o(function() {
						if_block.d(1);
						if_block = null;
					});
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				if (if_block) { if_block.o(outrocallback); }
				else { outrocallback(); }

				current = false;
			},

			d: function destroy$$1(detach) {
				if (if_block) { if_block.d(detach); }
				if (detach) {
					detachNode(if_block_anchor);
				}
			}
		};
	}

	// (2:2) {#if $interview}
	function create_if_block(component, ctx) {
		var each_blocks_1 = [], each_lookup = blankObject(), each_anchor, current;

		var each_value = ctx.$interview.sections;

		var get_key = function (ctx) { return ctx.section.id; };

		for (var i = 0; i < each_value.length; i += 1) {
			var child_ctx = get_each_context$6(ctx, each_value, i);
			var key = get_key(child_ctx);
			each_blocks_1[i] = each_lookup[key] = create_each_block$6(component, key, child_ctx);
		}

		return {
			c: function create() {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].c(); }

				each_anchor = createComment();
			},

			m: function mount(target, anchor) {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].i(target, anchor); }

				insert(target, each_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var each_value = ctx.$interview.sections;
				each_blocks_1 = updateKeyedEach(each_blocks_1, component, changed, get_key, 1, ctx, each_value, each_lookup, each_anchor.parentNode, outroAndDestroyBlock, create_each_block$6, "i", each_anchor, get_each_context$6);
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				var countdown = callAfter(outrocallback, each_blocks_1.length);
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].o(countdown); }

				current = false;
			},

			d: function destroy$$1(detach) {
				for (i = 0; i < each_blocks_1.length; i += 1) { each_blocks_1[i].d(detach); }

				if (detach) {
					detachNode(each_anchor);
				}
			}
		};
	}

	// (4:6) {#if section.steps.length > 0}
	function create_if_block_1(component, ctx) {
		var current;

		var interviewsection_initial_data = {
		 	section: ctx.section,
		 	interview: ctx.$interview
		 };
		var interviewsection = new InterviewSection({
			root: component.root,
			store: component.store,
			data: interviewsection_initial_data
		});

		return {
			c: function create() {
				interviewsection._fragment.c();
			},

			m: function mount(target, anchor) {
				interviewsection._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var interviewsection_changes = {};
				if (changed.$interview) { interviewsection_changes.section = ctx.section; }
				if (changed.$interview) { interviewsection_changes.interview = ctx.$interview; }
				interviewsection._set(interviewsection_changes);
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				if (interviewsection) { interviewsection._fragment.o(outrocallback); }
				current = false;
			},

			d: function destroy$$1(detach) {
				interviewsection.destroy(detach);
			}
		};
	}

	// (3:4) {#each $interview.sections as section (section.id)}
	function create_each_block$6(component, key_1, ctx) {
		var first, if_block_anchor, current;

		var if_block = (ctx.section.steps.length > 0) && create_if_block_1(component, ctx);

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				if (if_block) { if_block.c(); }
				if_block_anchor = createComment();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);
				if (if_block) { if_block.m(target, anchor); }
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.section.steps.length > 0) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block_1(component, ctx);
						if (if_block) { if_block.c(); }
					}

					if_block.i(if_block_anchor.parentNode, if_block_anchor);
				} else if (if_block) {
					if_block.o(function() {
						if_block.d(1);
						if_block = null;
					});
				}
			},

			i: function intro(target, anchor) {
				if (current) { return; }

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) { return; }

				if (if_block) { if_block.o(outrocallback); }
				else { outrocallback(); }

				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				if (if_block) { if_block.d(detach); }
				if (detach) {
					detachNode(if_block_anchor);
				}
			}
		};
	}

	// (1:0) {#await $interview then success}
	function create_pending_block(component, ctx) {

		return {
			c: noop,

			m: noop,

			p: noop,

			i: noop,

			o: run,

			d: noop
		};
	}

	function App(options) {
		this._debugName = '<App>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this.store = store_1();
		this._state = assign(this.store._init(["interview"]), options.data);
		this.store._add(this, ["interview"]);
		if (!('$interview' in this._state)) { console.warn("<App> was created without expected data property '$interview'"); }
		this._intro = !!options.intro;

		this._handlers.destroy = [removeFromStore];

		this._fragment = create_main_fragment$9(this, this._state);

		if (options.target) {
			if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(App.prototype, protoDev);

	App.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	var app = new App({
		target: document.body,
		data: {
			name: 'world'
		}
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
