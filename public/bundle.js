var app = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (var k in src) tar[k] = src[k];
		return tar;
	}

	function assignTrue(tar, src) {
		for (var k in src) tar[k] = 1;
		return tar;
	}

	function isPromise(value) {
		return value && typeof value.then === 'function';
	}

	function callAfter(fn, i) {
		if (i === 0) fn();
		return () => {
			if (!--i) fn();
		};
	}

	function addLoc(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
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
		while (parent.firstChild) target.appendChild(parent.firstChild);
	}

	function destroyEach(iterations, detach) {
		for (var i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detach);
		}
	}

	function createFragment() {
		return document.createDocumentFragment();
	}

	function createElement(name) {
		return document.createElement(name);
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
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
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

	function handlePromise(promise, info) {
		var token = info.token = {};

		function update(type, index, key, value) {
			if (info.token !== token) return;

			info.resolved = key && { [key]: value };

			const child_ctx = assign(assign({}, info.ctx), info.resolved);
			const block = type && (info.current = type)(info.component, child_ctx);

			if (info.block) {
				if (info.blocks) {
					info.blocks.forEach((block, i) => {
						if (i !== index && block) {
							block.o(() => {
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
			if (info.blocks) info.blocks[index] = block;
		}

		if (isPromise(promise)) {
			promise.then(value => {
				update(info.then, 1, info.value, value);
			}, error => {
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

			info.resolved = { [info.value]: promise };
		}
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
		if (!handlers) return;

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
				if (~index) handlers.splice(index, 1);
			}
		};
	}

	function set(newState) {
		this._set(assign({}, newState));
		if (this.root._lock) return;
		flush(this.root);
	}

	function _set(newState) {
		var oldState = this._state,
			changed = {},
			dirty = false;

		newState = assign(this._staged, newState);
		this._staged = {};

		for (var key in newState) {
			if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
		}
		if (!dirty) return;

		this._state = assign(assign({}, oldState), newState);
		this._recompute(changed, this._state);
		if (this._bind) this._bind(changed, this._state);

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
		while (fns && fns.length) fns.shift()();
	}

	function _mount(target, anchor) {
		this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
	}

	function removeFromStore() {
		this.store._remove(this);
	}

	var protoDev = {
		destroy: destroyDev,
		get,
		fire,
		on,
		set: setDev,
		_recompute: noop,
		_set,
		_stage,
		_mount,
		_differs
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
		_add(component, props) {
			this._dependents.push({
				component: component,
				props: props
			});
		},

		_init(props) {
			const state = {};
			for (let i = 0; i < props.length; i += 1) {
				const prop = props[i];
				state['$' + prop] = this._state[prop];
			}
			return state;
		},

		_remove(component) {
			let i = this._dependents.length;
			while (i--) {
				if (this._dependents[i].component === component) {
					this._dependents.splice(i, 1);
					return;
				}
			}
		},

		_set(newState, changed) {
			const previous = this._state;
			this._state = assign(assign({}, previous), newState);

			for (let i = 0; i < this._sortedComputedProperties.length; i += 1) {
				this._sortedComputedProperties[i].update(this._state, changed);
			}

			this.fire('state', {
				changed,
				previous,
				current: this._state
			});

			this._dependents
				.filter(dependent => {
					const componentState = {};
					let dirty = false;

					for (let j = 0; j < dependent.props.length; j += 1) {
						const prop = dependent.props[j];
						if (prop in changed) {
							componentState['$' + prop] = this._state[prop];
							dirty = true;
						}
					}

					if (dirty) {
						dependent.component._stage(componentState);
						return true;
					}
				})
				.forEach(dependent => {
					dependent.component.set({});
				});

			this.fire('update', {
				changed,
				previous,
				current: this._state
			});
		},

		_sortComputedProperties() {
			const computed = this._computed;
			const sorted = this._sortedComputedProperties = [];
			const visited = blankObject();
			let currentKey;

			function visit(key) {
				const c = computed[key];

				if (c) {
					c.deps.forEach(dep => {
						if (dep === currentKey) {
							throw new Error(`Cyclical dependency detected between ${dep} <-> ${key}`);
						}

						visit(dep);
					});

					if (!visited[key]) {
						visited[key] = true;
						sorted.push(c);
					}
				}
			}

			for (const key in this._computed) {
				visit(currentKey = key);
			}
		},

		compute(key, deps, fn) {
			let value;

			const c = {
				deps,
				update: (state, changed, dirty) => {
					const values = deps.map(dep => {
						if (dep in changed) dirty = true;
						return state[dep];
					});

					if (dirty) {
						const newValue = fn.apply(null, values);
						if (this._differs(newValue, value)) {
							value = newValue;
							changed[key] = true;
							state[key] = value;
						}
					}
				}
			};

			this._computed[key] = c;
			this._sortComputedProperties();

			const state = assign({}, this._state);
			const changed = {};
			c.update(state, changed, true);
			this._set(state, changed);
		},

		fire,

		get,

		on,

		set(newState) {
			const oldState = this._state;
			const changed = this._changed = {};
			let dirty = false;

			for (const key in newState) {
				if (this._computed[key]) throw new Error(`'${key}' is a read-only computed property`);
				if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
			}
			if (!dirty) return;

			this._set(newState, changed);
		}
	});

	const locationSection = { 
	  name: 'basicLocation', 
	  component: 'Location',
	  steps: [
	    {
	      fields: { 
	        unknown: [
	          {
	            type: 'postalCode', 
	            id: 'locationCardPostalCode', 
	            value: '99547'
	          }
	        ],
	        known: {}
	      }
	    }
	  ]
	};

	const validateQuestion = (question,section) => {
	  switch(question.type) {
	    default: 
	      return !question.required || question.value != '';
	  }
	};

	const taskPageOne = { 
	  name: 'taskInterviewPageOne',
	  component: 'Question',
	  componentOptions: { 
	    page: 1
	  }, 
	  preload: true,
	  get: (ctx) => fetch('/data/interview-page-one.json'),
	  validate: validateQuestion
	}; 

	const taskPageTwo = { 
	  name: 'taskInterviewPageTwo',
	  component: 'Question', 
	  componentOptions: { 
	    page: 2
	  }, 
	  get: (ctx) => fetch('/data/interview-page-two.json'),
	  validate: validateQuestion
	};

	const contactSubmit = { 
	  name: 'contactSubmit', 
	  component: 'ContactSubmit', 
	  steps: [
	    {
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
	    get: (ctx) => fetch('/data/taskInfo.json')
	  },
	  sections: [ 
	    locationSection, 
	    taskPageOne, 
	    taskPageTwo,
	    contactSubmit
	  ]
	};

	let combineData = components => values => {
	  components.forEach((c,i) => {
	    c.steps = values[i];
	  });
	  return components;
	};

	function getInterview(ctx) { 
	  var fetchableComponents = config.sections.filter(s => 
	    s.hasOwnProperty('get') && s.preload
	  ); 
	  if(config.info.get) fetchableComponents.push(config.info);
	  let promises = fetchableComponents.map(c => c.get()); 
	  return Promise.all(promises)
	    .then(values => Promise.all(values.map(v => v.json())))
	    .then(combineData(fetchableComponents))
	    .then(() => {
	      config.sections.forEach(s => s.steps = s.steps || []);
	      return config
	    });
	}
	function validateStep(step,section) { 
	  if(typeof section.validate == 'function') {
	    return section.validate(step,section); 
	  }
	  return true;
	}

	let isAPromise = obj => typeof obj.then == 'function';

	class InterviewStore extends Store {
	  stepSubmitted(step,section) { 
	    let state = this.get();
	    let isValid = validateStep(step,section);
	    let isAsync = isAPromise(isValid); 
	    if(isAsync) ; else { 
	      if(isValid) return this.validStepSubmitted(step,section);
	      return this.invalidStepSubmitted(step,section);
	    }
	  }
	  validStepSubmitted(step,section) { 
	  }
	  invalidStepSubmitted(step,section) { 

	  }
	}

	var store = new InterviewStore({
	  interview: getInterview()
	});

	/* src\Components\InterviewStep.html generated by Svelte v2.15.3 */

	var methods = { 
	  handleSubmit(event) { 
	    event.preventDefault();
	    let { step, section } = this.get();
	    this.fire('stepSubmitted', {step,section});
	  }
	};

	const file = "src\\Components\\InterviewStep.html";

	function create_main_fragment(component, ctx) {
		var div5, form, div4, div1, slot_content_heading = component._slotted.heading, div0, text1, slot_content_body = component._slotted.body, slot_content_body_before, slot_content_body_after, div2, text3, div3, slot_content_footer = component._slotted.footer, a, text5, button, current;

		function submit_handler(event) {
			component.handleSubmit(event,{step: ctx.step},{section: ctx.section});
		}

		return {
			c: function create() {
				div5 = createElement("div");
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
				if (!slot_content_heading) {
					addLoc(div0, file, 5, 10, 218);
				}
				div1.className = "card-heading svelte-98rrxd";
				addLoc(div1, file, 3, 6, 149);
				if (!slot_content_body) {
					addLoc(div2, file, 9, 8, 303);
				}
				if (!slot_content_footer) {
					a.href = "/previous-step";
					addLoc(a, file, 13, 10, 408);
					button.type = "submit";
					button.className = "bs-btn";
					addLoc(button, file, 14, 10, 457);
				}
				div3.className = "card-footer svelte-98rrxd";
				addLoc(div3, file, 11, 6, 341);
				div4.className = "card-section svelte-98rrxd";
				addLoc(div4, file, 2, 4, 115);
				addListener(form, "submit", submit_handler);
				form.className = "bs-card white svelte-98rrxd";
				addLoc(form, file, 1, 2, 32);
				div5.className = "scroll-section";
				addLoc(div5, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div5, anchor);
				append(div5, form);
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

				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;

			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div5);
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

				removeListener(form, "submit", submit_handler);
			}
		};
	}

	function InterviewStep(options) {
		this._debugName = '<InterviewStep>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('step' in this._state)) console.warn("<InterviewStep> was created without expected data property 'step'");
		if (!('section' in this._state)) console.warn("<InterviewStep> was created without expected data property 'section'");
		this._intro = !!options.intro;

		this._slotted = options.slots || {};

		this._fragment = create_main_fragment(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(InterviewStep.prototype, protoDev);
	assign(InterviewStep.prototype, methods);

	InterviewStep.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\sections\Location.html generated by Svelte v2.15.3 */

	const file$1 = "src\\Components\\sections\\Location.html";

	function create_main_fragment$1(component, ctx) {
		var div, interviewstep_updating = {}, current;

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
			slots: { default: createFragment(), heading: createFragment() },
			data: interviewstep_initial_data,
			_bind(changed, childState) {
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

		component.root._beforecreate.push(() => {
			interviewstep._bind({ step: 1, section: 1 }, interviewstep.get());
		});

		interviewstep.on("stepSubmitted", function(event) {
			component.fire("stepSubmitted", event);
		});

		return {
			c: function create() {
				div = createElement("div");
				div.textContent = "What is your location?";
				interviewstep._fragment.c();
				setAttribute(div, "slot", "heading");
				addLoc(div, file$1, 4, 2, 71);
			},

			m: function mount(target, anchor) {
				append(interviewstep._slotted.heading, div);
				interviewstep._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
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
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (interviewstep) interviewstep._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				interviewstep.destroy(detach);
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
		if (!('step' in this._state)) console.warn("<Location> was created without expected data property 'step'");
		if (!('section' in this._state)) console.warn("<Location> was created without expected data property 'section'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$1(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(Location.prototype, protoDev);

	Location.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Radio.html generated by Svelte v2.15.3 */

	const file$2 = "src\\Components\\questionTypes\\Radio.html";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$2(component, ctx) {
		var each_anchor, current;

		var each_value = ctx.question.answerElements;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(component, get_each_context(ctx, each_value, i));
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
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(component, child_ctx);
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
				if (current) return;

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

	// (1:0) {#each question.answerElements as {answerID,answerText}}
	function create_each_block(component, ctx) {
		var div, input, input_id_value, input_value_value, input_name_value, text0, label, text1_value = ctx.answerText, text1, label_for_value, text2;

		function input_change_handler() {
			ctx.question.value = input.__value;
			component.set({ question: ctx.question });
		}

		return {
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
				input.id = input_id_value = ctx.answerID;
				input.__value = input_value_value = ctx.answerID;
				input.value = input.__value;
				input.name = input_name_value = "radio_" + ctx.question.questionID;
				addLoc(input, file$2, 2, 2, 68);
				label.htmlFor = label_for_value = ctx.answerID;
				label.className = "svelte-5jml85";
				addLoc(label, file$2, 3, 2, 188);
				addLoc(div, file$2, 1, 1, 59);
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
				if (changed.question) input.checked = input.__value === ctx.question.value;
				if ((changed.question) && input_id_value !== (input_id_value = ctx.answerID)) {
					input.id = input_id_value;
				}

				if ((changed.question) && input_value_value !== (input_value_value = ctx.answerID)) {
					input.__value = input_value_value;
				}

				input.value = input.__value;
				if ((changed.question) && input_name_value !== (input_name_value = "radio_" + ctx.question.questionID)) {
					input.name = input_name_value;
				}

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
		if (!('question' in this._state)) console.warn("<Radio> was created without expected data property 'question'");
		this._bindingGroups = [[]];
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$2(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(Radio.prototype, protoDev);

	Radio.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Checkbox.html generated by Svelte v2.15.3 */

	var methods$1 = { 
		updateValue(question) { 
	        question.value = question.answerElements
	          .filter(a => a.checked)
	          .map(a => a.answerID)
	          .join(', ');
	        this.set({question});
		}
	    };

	const file$3 = "src\\Components\\questionTypes\\Checkbox.html";

	function change_handler(event) {
		const { component, ctx } = this._svelte;

		component.updateValue(ctx.question);
	}

	function get_each_context$1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
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
			each_blocks[i] = create_each_block$1(component, get_each_context$1(ctx, each_value, i));
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
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$1(component, child_ctx);
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
				if (current) return;

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
	function create_each_block$1(component, ctx) {
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
				input._svelte = { component, ctx };

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
				if (changed.question) input.checked = ctx.checked;
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
		if (!('question' in this._state)) console.warn("<Checkbox> was created without expected data property 'question'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$3(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(Checkbox.prototype, protoDev);
	assign(Checkbox.prototype, methods$1);

	Checkbox.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Select.html generated by Svelte v2.15.3 */

	const file$4 = "src\\Components\\questionTypes\\Select.html";

	function get_each_context$2(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$4(component, ctx) {
		var select, select_updating = false, select_id_value, current;

		var each_value = ctx.question.answerElements;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(component, get_each_context$2(ctx, each_value, i));
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
				if (!('question' in ctx)) component.root._beforecreate.push(select_change_handler);
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
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$2(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				if (!select_updating && changed.question) selectOption(select, ctx.question.value);
				if ((changed.question) && select_id_value !== (select_id_value = ctx.question.questionId)) {
					select.id = select_id_value;
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

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
	function create_each_block$2(component, ctx) {
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
		if (!('question' in this._state)) console.warn("<Select> was created without expected data property 'question'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$4(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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

	const file$5 = "src\\Components\\questionTypes\\Text.html";

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
				if (!input_updating && changed.question) input.value = ctx.question.value;
				if ((changed.question) && input_placeholder_value !== (input_placeholder_value = ctx.question.placeholder)) {
					input.placeholder = input_placeholder_value;
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

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
		if (!('question' in this._state)) console.warn("<Text> was created without expected data property 'question'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$5(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
	      Select,
	      Checkbox,
	      Radio,
	      Text
	      // DATE: Date, 
	      // CALENDAR: Date,
	      // TEXT_AREA: Textarea,
	      // GRAPHICAL_RADIO: GraphicalRadio
	    }	
	  }
	}
	var methods$2 = { 
	  doSomething() { 
	    let { step, section } = this.get(); 
	    this.store.stepSubmitted(step,section);
	  }
	};

	function onstate({changed,current}) { 
	  if(changed.step) { 
	    this.set({step: current.step});
	  }
	}
	const file$6 = "src\\Components\\sections\\Question.html";

	function create_main_fragment$6(component, ctx) {
		var div0, text0_value = ctx.step.questionText, text0, text1, div2, div1, switch_instance_updating = {}, text2, p, text3, text4_value = ctx.step.value, text4, interviewstep_updating = {}, current;

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
				_bind(changed, childState) {
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

			component.root._beforecreate.push(() => {
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
			_bind(changed, childState) {
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

		component.root._beforecreate.push(() => {
			interviewstep._bind({ step: 1, section: 1 }, interviewstep.get());
		});

		interviewstep.on("stepSubmitted", function(event) {
			component.fire("stepSubmitted", event);
		});

		return {
			c: function create() {
				div0 = createElement("div");
				text0 = createText(text0_value);
				text1 = createText("\r\n  ");
				div2 = createElement("div");
				div1 = createElement("div");
				if (switch_instance) switch_instance._fragment.c();
				text2 = createText("\r\n      ");
				p = createElement("p");
				text3 = createText("Value: ");
				text4 = createText(text4_value);
				interviewstep._fragment.c();
				setAttribute(div0, "slot", "heading");
				addLoc(div0, file$6, 4, 2, 71);
				addLoc(p, file$6, 11, 6, 328);
				div1.className = "answers-block svelte-d70yqh";
				addLoc(div1, file$6, 6, 4, 143);
				setAttribute(div2, "slot", "body");
				addLoc(div2, file$6, 5, 2, 120);
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

				append(div1, text2);
				append(div1, p);
				append(p, text3);
				append(p, text4);
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
						const old_component = switch_instance;
						old_component._fragment.o(() => {
							old_component.destroy();
						});
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));

						component.root._beforecreate.push(() => {
							const changed = {};
							if (ctx.step === void 0) changed.question = 1;
							if (ctx.interview  === void 0) changed.interview = 1;
							switch_instance._bind(changed, switch_instance.get());
						});
						switch_instance._fragment.c();
						switch_instance._mount(div1, text2);
					} else {
						switch_instance = null;
					}
				}

				else if (switch_value) {
					switch_instance._set(switch_instance_changes);
					switch_instance_updating = {};
				}

				if ((!current || changed.step) && text4_value !== (text4_value = ctx.step.value)) {
					setData(text4, text4_value);
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
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				outrocallback = callAfter(outrocallback, 2);

				if (switch_instance) switch_instance._fragment.o(outrocallback);
				if (interviewstep) interviewstep._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (switch_instance) switch_instance.destroy();
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
		if (!('step' in this._state)) console.warn("<Question> was created without expected data property 'step'");
		if (!('section' in this._state)) console.warn("<Question> was created without expected data property 'section'");
		if (!('templates' in this._state)) console.warn("<Question> was created without expected data property 'templates'");
		if (!('interview' in this._state)) console.warn("<Question> was created without expected data property 'interview'");
		this._intro = !!options.intro;

		this._handlers.state = [onstate];

		onstate.call(this, { changed: assignTrue({}, this._state), current: this._state });

		this._fragment = create_main_fragment$6(this, this._state);

		this.root._oncreate.push(() => {
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(Question.prototype, protoDev);
	assign(Question.prototype, methods$2);

	Question.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\sections\ContactSubmit.html generated by Svelte v2.15.3 */

	const file$7 = "src\\Components\\sections\\ContactSubmit.html";

	function get_each_context$3(ctx, list, i) {
		const child_ctx = Object.create(ctx);
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
			each_blocks[i] = create_each_block$3(component, get_each_context$3(ctx, each_value, i));
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
			_bind(changed, childState) {
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

		component.root._beforecreate.push(() => {
			interviewstep._bind({ step: 1, section: 1 }, interviewstep.get());
		});

		interviewstep.on("stepSubmitted", function(event) {
			component.fire("stepSubmitted", event);
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
				addLoc(div0, file$7, 4, 2, 71);
				setAttribute(div1, "slot", "body");
				addLoc(div1, file$7, 5, 2, 115);
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
						const child_ctx = get_each_context$3(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$3(component, child_ctx);
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
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (interviewstep) interviewstep._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				destroyEach(each_blocks, detach);

				interviewstep.destroy(detach);
			}
		};
	}

	// (7:4) {#each step.fields as {id, label, placeholder, type}}
	function create_each_block$3(component, ctx) {
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
				addLoc(label, file$7, 8, 8, 236);
				setAttribute(input, "type", input_type_value = ctx.type);
				input.id = input_id_value = ctx.id;
				input.placeholder = input_placeholder_value = ctx.placeholder;
				addLoc(input, file$7, 9, 8, 279);
				div.className = "bs-form-group";
				addLoc(div, file$7, 7, 6, 199);
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
		if (!('step' in this._state)) console.warn("<ContactSubmit> was created without expected data property 'step'");
		if (!('section' in this._state)) console.warn("<ContactSubmit> was created without expected data property 'section'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$7(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
	      Location, 
	      Question, 
	      ContactSubmit
	    }
	  }
	}
	function get_each_context$4(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.step = list[i];
		child_ctx.each_value = list;
		child_ctx.step_index = i;
		return child_ctx;
	}

	function create_main_fragment$8(component, ctx) {
		var each_anchor, current;

		var each_value = ctx.section.steps;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$4(component, get_each_context$4(ctx, each_value, i));
		}

		function outroBlock(i, detach, fn) {
			if (each_blocks[i]) {
				each_blocks[i].o(() => {
					if (detach) {
						each_blocks[i].d(detach);
						each_blocks[i] = null;
					}
					if (fn) fn();
				});
			}
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
					each_blocks[i].i(target, anchor);
				}

				insert(target, each_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.templates || changed.section) {
					each_value = ctx.section.steps;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$4(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$4(component, child_ctx);
							each_blocks[i].c();
						}
						each_blocks[i].i(each_anchor.parentNode, each_anchor);
					}
					for (; i < each_blocks.length; i += 1) outroBlock(i, 1);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				each_blocks = each_blocks.filter(Boolean);
				const countdown = callAfter(outrocallback, each_blocks.length);
				for (let i = 0; i < each_blocks.length; i += 1) outroBlock(i, 0, countdown);

				current = false;
			},

			d: function destroy$$1(detach) {
				destroyEach(each_blocks, detach);

				if (detach) {
					detachNode(each_anchor);
				}
			}
		};
	}

	// (1:0) {#each section.steps as step}
	function create_each_block$4(component, ctx) {
		var switch_instance_updating = {}, switch_instance_anchor, current;

		var switch_value = ctx.templates[ctx.section.component];

		function switch_props(ctx) {
			var switch_instance_initial_data = {};
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
				_bind(changed, childState) {
					var newState = {};
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

			component.root._beforecreate.push(() => {
				switch_instance._bind({ step: 1, section: 1 }, switch_instance.get());
			});
		}

		function switch_instance_stepSubmitted(event) {
			component.fire("stepSubmitted", event);
		}

		if (switch_instance) switch_instance.on("stepSubmitted", switch_instance_stepSubmitted);

		return {
			c: function create() {
				if (switch_instance) switch_instance._fragment.c();
				switch_instance_anchor = createComment();
			},

			m: function mount(target, anchor) {
				if (switch_instance) {
					switch_instance._mount(target, anchor);
				}

				insert(target, switch_instance_anchor, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				var switch_instance_changes = {};
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
						const old_component = switch_instance;
						old_component._fragment.o(() => {
							old_component.destroy();
						});
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));

						component.root._beforecreate.push(() => {
							const changed = {};
							if (ctx.step 
	     === void 0) changed.step = 1;
							if (ctx.section 
	     === void 0) changed.section = 1;
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
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (switch_instance) switch_instance._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(switch_instance_anchor);
				}

				if (switch_instance) switch_instance.destroy(detach);
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
		if (!('section' in this._state)) console.warn("<InterviewSection> was created without expected data property 'section'");
		if (!('templates' in this._state)) console.warn("<InterviewSection> was created without expected data property 'templates'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$8(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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



	var methods$3 = { 
		stepSubmitted() { 
			console.log('step submitted',arguments);
		}
	};

	function oncreate() { 

	}
	function store_1() { 
		return store;
	}
	function get_each_context$5(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.section = list[i];
		child_ctx.each_value = list;
		child_ctx.section_index = i;
		return child_ctx;
	}

	function create_main_fragment$9(component, ctx) {
		var await_block_anchor, promise, current;

		let info = {
			component,
			ctx,
			current: null,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 'data',
			error: 'null',
			blocks: Array(3)
		};

		handlePromise(promise = ctx.$interview, info);

		return {
			c: function create() {
				await_block_anchor = createComment();

				info.block.c();
			},

			m: function mount(target, anchor) {
				insert(target, await_block_anchor, anchor);

				info.block.i(target, info.anchor = anchor);
				info.mount = () => await_block_anchor.parentNode;

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
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				const countdown = callAfter(outrocallback, 3);
				for (let i = 0; i < 3; i += 1) {
					const block = info.blocks[i];
					if (block) block.o(countdown);
					else countdown();
				}

				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(await_block_anchor);
				}

				info.block.d(detach);
				info = null;
			}
		};
	}

	// (1:0) {#await $interview then data}
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

	// (1:29)    {#each data.sections as section}
	function create_then_block(component, ctx) {
		var each_anchor, current;

		var each_value = ctx.data.sections;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$5(component, get_each_context$5(ctx, each_value, i));
		}

		function outroBlock(i, detach, fn) {
			if (each_blocks[i]) {
				each_blocks[i].o(() => {
					if (detach) {
						each_blocks[i].d(detach);
						each_blocks[i] = null;
					}
					if (fn) fn();
				});
			}
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
					each_blocks[i].i(target, anchor);
				}

				insert(target, each_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.$interview || changed.interview) {
					each_value = ctx.data.sections;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$5(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$5(component, child_ctx);
							each_blocks[i].c();
						}
						each_blocks[i].i(each_anchor.parentNode, each_anchor);
					}
					for (; i < each_blocks.length; i += 1) outroBlock(i, 1);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				each_blocks = each_blocks.filter(Boolean);
				const countdown = callAfter(outrocallback, each_blocks.length);
				for (let i = 0; i < each_blocks.length; i += 1) outroBlock(i, 0, countdown);

				current = false;
			},

			d: function destroy$$1(detach) {
				destroyEach(each_blocks, detach);

				if (detach) {
					detachNode(each_anchor);
				}
			}
		};
	}

	// (2:1) {#each data.sections as section}
	function create_each_block$5(component, ctx) {
		var interviewsection_updating = {}, current;

		var interviewsection_initial_data = {};
		if (ctx.section 
				 !== void 0) {
			interviewsection_initial_data.section = ctx.section 
				;
			interviewsection_updating.section = true;
		}
		if (ctx.interview 
				 !== void 0) {
			interviewsection_initial_data.interview = ctx.interview 
				;
			interviewsection_updating.interview = true;
		}
		var interviewsection = new InterviewSection({
			root: component.root,
			store: component.store,
			data: interviewsection_initial_data,
			_bind(changed, childState) {
				var newState = {}, newStoreState = {};
				if (!interviewsection_updating.section && changed.section) {
					ctx.each_value[ctx.section_index] = childState.section = childState.section;

					newStoreState.interview = ctx.$interview;
				}

				if (!interviewsection_updating.interview && changed.interview) {
					newState.interview = childState.interview;
				}
				component.store.set(newStoreState);
				component._set(newState);
				interviewsection_updating = {};
			}
		});

		component.root._beforecreate.push(() => {
			interviewsection._bind({ section: 1, interview: 1 }, interviewsection.get());
		});

		interviewsection.on("stepSubmitted", function(event) {
			component.stepSubmitted();
		});

		return {
			c: function create() {
				interviewsection._fragment.c();
			},

			m: function mount(target, anchor) {
				interviewsection._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				var interviewsection_changes = {};
				if (!interviewsection_updating.section && changed.$interview) {
					interviewsection_changes.section = ctx.section 
				;
					interviewsection_updating.section = ctx.section 
				 !== void 0;
				}
				if (!interviewsection_updating.interview && changed.interview) {
					interviewsection_changes.interview = ctx.interview 
				;
					interviewsection_updating.interview = ctx.interview 
				 !== void 0;
				}
				interviewsection._set(interviewsection_changes);
				interviewsection_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (interviewsection) interviewsection._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				interviewsection.destroy(detach);
			}
		};
	}

	// (1:0) {#await $interview then data}
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
		if (!('$interview' in this._state)) console.warn("<App> was created without expected data property '$interview'");
		if (!('interview' in this._state)) console.warn("<App> was created without expected data property 'interview'");
		this._intro = !!options.intro;

		this._handlers.destroy = [removeFromStore];

		this._fragment = create_main_fragment$9(this, this._state);

		this.root._oncreate.push(() => {
			oncreate.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(App.prototype, protoDev);
	assign(App.prototype, methods$3);

	App.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	const app = new App({
		target: document.body,
		data: {
			name: 'world'
		}
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
