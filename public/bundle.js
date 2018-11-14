var app = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (var k in src) tar[k] = src[k];
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

	let locationSection = { 
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

	let taskPageOne = { 
	  name: 'taskInterviewPageOne',
	  component: 'Question',
	  componentOptions: { 
	    page: 1
	  }, 
	  preload: true,
	  get: (ctx) => fetch('/data/interview-page-one.json'),
	}; 

	let taskPageTwo = { 
	  name: 'taskInterviewPageTwo',
	  component: 'Question', 
	  componentOptions: { 
	    page: 2
	  }, 
	  get: (ctx) => fetch('/data/interview-page-two.json')
	};

	let contactSubmit = { 
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

	/* src\Components\View.html generated by Svelte v2.15.3 */

	const file = "src\\Components\\View.html";

	function create_main_fragment(component, ctx) {
		var await_block_anchor, promise, current;

		let info = {
			component,
			ctx,
			current: null,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 'data',
			error: 'error'
		};

		handlePromise(promise = ctx.promise, info);

		return {
			c: function create() {
				await_block_anchor = createComment();

				info.block.c();
			},

			m: function mount(target, anchor) {
				insert(target, await_block_anchor, anchor);

				info.block.m(target, info.anchor = anchor);
				info.mount = () => await_block_anchor.parentNode;

				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				info.ctx = ctx;

				('promise' in changed) && promise !== (promise = ctx.promise) && handlePromise(promise, info);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(await_block_anchor);
				}

				info.block.d(detach);
				info = null;
			}
		};
	}

	// (9:0) {:catch error}
	function create_catch_block(component, ctx) {
		var slot_content_error = component._slotted.error, slot_content_error_before, slot_content_error_after, h1;

		return {
			c: function create() {
				if (!slot_content_error) {
					h1 = createElement("h1");
					h1.textContent = "Error!";
				}
				if (!slot_content_error) {
					addLoc(h1, file, 10, 3, 194);
				}
			},

			m: function mount(target, anchor) {
				if (!slot_content_error) {
					insert(target, h1, anchor);
				}

				else {
					insert(target, slot_content_error_before || (slot_content_error_before = createComment()), anchor);
					insert(target, slot_content_error, anchor);
					insert(target, slot_content_error_after || (slot_content_error_after = createComment()), anchor);
				}
			},

			d: function destroy$$1(detach) {
				if (!slot_content_error) {
					if (detach) {
						detachNode(h1);
				}

				}

				else {
					reinsertBetween(slot_content_error_before, slot_content_error_after, slot_content_error);
					detachNode(slot_content_error_before);
					detachNode(slot_content_error_after);
				}
			}
		};
	}

	// (5:0) {:then data}
	function create_then_block(component, ctx) {
		var slot_content_loaded = component._slotted.loaded, slot_content_loaded_before, slot_content_loaded_after, div;

		return {
			c: function create() {
				if (!slot_content_loaded) {
					div = createElement("div");
					div.textContent = "Loaded!";
				}
				if (!slot_content_loaded) {
					addLoc(div, file, 6, 4, 121);
				}
			},

			m: function mount(target, anchor) {
				if (!slot_content_loaded) {
					insert(target, div, anchor);
				}

				else {
					insert(target, slot_content_loaded_before || (slot_content_loaded_before = createComment()), anchor);
					insert(target, slot_content_loaded, anchor);
					insert(target, slot_content_loaded_after || (slot_content_loaded_after = createComment()), anchor);
				}
			},

			d: function destroy$$1(detach) {
				if (!slot_content_loaded) {
					if (detach) {
						detachNode(div);
				}

				}

				else {
					reinsertBetween(slot_content_loaded_before, slot_content_loaded_after, slot_content_loaded);
					detachNode(slot_content_loaded_before);
					detachNode(slot_content_loaded_after);
				}
			}
		};
	}

	// (1:16)     <slot name='loading'>     <div>Loading...</div>    </slot>  {:then data}
	function create_pending_block(component, ctx) {
		var slot_content_loading = component._slotted.loading, slot_content_loading_before, slot_content_loading_after, div;

		return {
			c: function create() {
				if (!slot_content_loading) {
					div = createElement("div");
					div.textContent = "Loading...";
				}
				if (!slot_content_loading) {
					addLoc(div, file, 2, 3, 46);
				}
			},

			m: function mount(target, anchor) {
				if (!slot_content_loading) {
					insert(target, div, anchor);
				}

				else {
					insert(target, slot_content_loading_before || (slot_content_loading_before = createComment()), anchor);
					insert(target, slot_content_loading, anchor);
					insert(target, slot_content_loading_after || (slot_content_loading_after = createComment()), anchor);
				}
			},

			d: function destroy$$1(detach) {
				if (!slot_content_loading) {
					if (detach) {
						detachNode(div);
				}

				}

				else {
					reinsertBetween(slot_content_loading_before, slot_content_loading_after, slot_content_loading);
					detachNode(slot_content_loading_before);
					detachNode(slot_content_loading_after);
				}
			}
		};
	}

	function View(options) {
		this._debugName = '<View>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign({}, options.data);
		if (!('promise' in this._state)) console.warn("<View> was created without expected data property 'promise'");
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

	assign(View.prototype, protoDev);

	View.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\InterviewStep.html generated by Svelte v2.15.3 */

	const file$1 = "src\\Components\\InterviewStep.html";

	function create_main_fragment$1(component, ctx) {
		var div5, form, div4, div1, slot_content_heading = component._slotted.heading, div0, text1, slot_content_body = component._slotted.body, slot_content_body_before, slot_content_body_after, div2, text3, div3, slot_content_footer = component._slotted.footer, a, text5, button, current;

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
					addLoc(div0, file$1, 5, 10, 169);
				}
				div1.className = "card-heading svelte-98rrxd";
				addLoc(div1, file$1, 3, 6, 100);
				if (!slot_content_body) {
					addLoc(div2, file$1, 9, 8, 254);
				}
				if (!slot_content_footer) {
					a.href = "/previous-step";
					addLoc(a, file$1, 13, 10, 359);
					button.type = "submit";
					button.className = "bs-btn";
					addLoc(button, file$1, 14, 10, 408);
				}
				div3.className = "card-footer svelte-98rrxd";
				addLoc(div3, file$1, 11, 6, 292);
				div4.className = "card-section svelte-98rrxd";
				addLoc(div4, file$1, 2, 4, 66);
				form.className = "bs-card white svelte-98rrxd";
				addLoc(form, file$1, 1, 2, 32);
				div5.className = "scroll-section";
				addLoc(div5, file$1, 0, 0, 0);
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

			p: noop,

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
		this._intro = !!options.intro;

		this._slotted = options.slots || {};

		this._fragment = create_main_fragment$1(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(InterviewStep.prototype, protoDev);

	InterviewStep.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\sections\Location.html generated by Svelte v2.15.3 */

	const file$2 = "src\\Components\\sections\\Location.html";

	function create_main_fragment$2(component, ctx) {
		var div, current;

		var interviewstep = new InterviewStep({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), heading: createFragment() }
		});

		return {
			c: function create() {
				div = createElement("div");
				div.textContent = "What is your location?";
				interviewstep._fragment.c();
				setAttribute(div, "slot", "heading");
				addLoc(div, file$2, 1, 2, 19);
			},

			m: function mount(target, anchor) {
				append(interviewstep._slotted.heading, div);
				interviewstep._mount(target, anchor);
				current = true;
			},

			p: noop,

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
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$2(this, this._state);

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

	const file$3 = "src\\Components\\questionTypes\\Radio.html";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$3(component, ctx) {
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
				addLoc(input, file$3, 2, 2, 68);
				label.htmlFor = label_for_value = ctx.answerID;
				label.className = "svelte-5jml85";
				addLoc(label, file$3, 3, 2, 188);
				addLoc(div, file$3, 1, 1, 59);
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

		this._fragment = create_main_fragment$3(this, this._state);

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

	var methods = { 
		updateValue(step) { 
	        console.log(step);
	        step.value = step.answerElements
	          .filter(a => a.checked)
	          .map(a => a.answerID)
	          .join(',');
	        this.set({step});
		}
	    };

	const file$4 = "src\\Components\\questionTypes\\Checkbox.html";

	function change_handler(event) {
		const { component, ctx } = this._svelte;

		component.updateValue(ctx.step);
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

	function create_main_fragment$4(component, ctx) {
		var each_anchor, current;

		var each_value = ctx.step.answerElements;

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
				if (changed.step) {
					each_value = ctx.step.answerElements;

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

	// (1:0) {#each step.answerElements as {answerID,answerText,checked}}
	function create_each_block$1(component, ctx) {
		var div, input, input_id_value, input_value_value, text0, label, text1_value = ctx.answerText, text1, label_for_value, text2;

		function input_change_handler() {
			ctx.each_value[ctx.each_index].checked = input.checked;
			component.set({ step: ctx.step });
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
				addLoc(input, file$4, 2, 4, 75);
				label.htmlFor = label_for_value = ctx.answerID;
				label.className = "svelte-1vp3xsv";
				addLoc(label, file$4, 3, 4, 188);
				addLoc(div, file$4, 1, 2, 64);
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
				if (changed.step) input.checked = ctx.checked;
				if ((changed.step) && input_id_value !== (input_id_value = ctx.answerID)) {
					input.id = input_id_value;
				}

				if ((changed.step) && input_value_value !== (input_value_value = ctx.answerID)) {
					input.__value = input_value_value;
				}

				input.value = input.__value;
				if ((changed.step) && text1_value !== (text1_value = ctx.answerText)) {
					setData(text1, text1_value);
				}

				if ((changed.step) && label_for_value !== (label_for_value = ctx.answerID)) {
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
		if (!('step' in this._state)) console.warn("<Checkbox> was created without expected data property 'step'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$4(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(Checkbox.prototype, protoDev);
	assign(Checkbox.prototype, methods);

	Checkbox.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\questionTypes\Select.html generated by Svelte v2.15.3 */

	const file$5 = "src\\Components\\questionTypes\\Select.html";

	function get_each_context$2(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$5(component, ctx) {
		var select, select_updating = false, select_id_value, current;

		var each_value = ctx.step.answerElements;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(component, get_each_context$2(ctx, each_value, i));
		}

		function select_change_handler() {
			select_updating = true;
			ctx.step.value = selectValue(select);
			component.set({ step: ctx.step });
			select_updating = false;
		}

		return {
			c: function create() {
				select = createElement("select");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				addListener(select, "change", select_change_handler);
				if (!('step' in ctx)) component.root._beforecreate.push(select_change_handler);
				select.id = select_id_value = ctx.step.questionId;
				addLoc(select, file$5, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, select, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(select, null);
				}

				selectOption(select, ctx.step.value);

				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if (changed.step) {
					each_value = ctx.step.answerElements;

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

				if (!select_updating && changed.step) selectOption(select, ctx.step.value);
				if ((changed.step) && select_id_value !== (select_id_value = ctx.step.questionId)) {
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

	// (2:1) {#each step.answerElements as {answerID,answerText}}
	function create_each_block$2(component, ctx) {
		var option, text0_value = ctx.answerText, text0, text1, option_value_value;

		return {
			c: function create() {
				option = createElement("option");
				text0 = createText(text0_value);
				text1 = createText("\r\n\t\t");
				option.__value = option_value_value = ctx.answerID;
				option.value = option.__value;
				addLoc(option, file$5, 2, 2, 110);
			},

			m: function mount(target, anchor) {
				insert(target, option, anchor);
				append(option, text0);
				append(option, text1);
			},

			p: function update(changed, ctx) {
				if ((changed.step) && text0_value !== (text0_value = ctx.answerText)) {
					setData(text0, text0_value);
				}

				if ((changed.step) && option_value_value !== (option_value_value = ctx.answerID)) {
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
		if (!('step' in this._state)) console.warn("<Select> was created without expected data property 'step'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$5(this, this._state);

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

	const file$6 = "src\\Components\\questionTypes\\Text.html";

	function create_main_fragment$6(component, ctx) {
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
				addLoc(input, file$6, 0, 0, 0);
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

		this._fragment = create_main_fragment$6(this, this._state);

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
	const file$7 = "src\\Components\\sections\\Question.html";

	function create_main_fragment$7(component, ctx) {
		var div0, text0_value = ctx.step.questionText, text0, text1, div2, div1, switch_instance_updating = {}, text2, p, text3, text4_value = ctx.step.value, text4, current;

		var switch_value = ctx.templates[ctx.step.presentationType];

		function switch_props(ctx) {
			var switch_instance_initial_data = { name: "Question" };
			if (ctx.step  !== void 0) {
				switch_instance_initial_data.step = ctx.step ;
				switch_instance_updating.step = true;
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
					if (!switch_instance_updating.step && changed.step) {
						newState.step = childState.step;
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
				switch_instance._bind({ step: 1, interview: 1 }, switch_instance.get());
			});
		}

		var interviewstep = new InterviewStep({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), body: createFragment(), heading: createFragment() }
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
				addLoc(div0, file$7, 1, 2, 19);
				addLoc(p, file$7, 5, 6, 237);
				div1.className = "answers-block svelte-d70yqh";
				addLoc(div1, file$7, 3, 4, 91);
				setAttribute(div2, "slot", "body");
				addLoc(div2, file$7, 2, 2, 68);
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
				if (!switch_instance_updating.step && changed.step) {
					switch_instance_changes.step = ctx.step ;
					switch_instance_updating.step = ctx.step  !== void 0;
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
							if (ctx.step  === void 0) changed.step = 1;
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
		if (!('templates' in this._state)) console.warn("<Question> was created without expected data property 'templates'");
		if (!('interview' in this._state)) console.warn("<Question> was created without expected data property 'interview'");
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

	assign(Question.prototype, protoDev);

	Question.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\sections\ContactSubmit.html generated by Svelte v2.15.3 */

	const file$8 = "src\\Components\\sections\\ContactSubmit.html";

	function get_each_context$3(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.id = list[i].id;
		child_ctx.label = list[i].label;
		child_ctx.placeholder = list[i].placeholder;
		child_ctx.type = list[i].type;
		return child_ctx;
	}

	function create_main_fragment$8(component, ctx) {
		var div0, text0_value = ctx.step.heading, text0, text1, div1, current;

		var each_value = ctx.step.fields;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$3(component, get_each_context$3(ctx, each_value, i));
		}

		var interviewstep = new InterviewStep({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), body: createFragment(), heading: createFragment() }
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
				addLoc(div0, file$8, 1, 2, 19);
				setAttribute(div1, "slot", "body");
				addLoc(div1, file$8, 2, 2, 63);
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

			p: function update(changed, ctx) {
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

	// (4:4) {#each step.fields as {id, label, placeholder, type}}
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
				addLoc(label, file$8, 5, 8, 184);
				setAttribute(input, "type", input_type_value = ctx.type);
				input.id = input_id_value = ctx.id;
				input.placeholder = input_placeholder_value = ctx.placeholder;
				addLoc(input, file$8, 6, 8, 227);
				div.className = "bs-form-group";
				addLoc(div, file$8, 4, 6, 147);
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
		return child_ctx;
	}

	function create_main_fragment$9(component, ctx) {
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
		var switch_instance_anchor, current;

		var switch_value = ctx.templates[ctx.section.component];

		function switch_props(ctx) {
			var switch_instance_initial_data = { step: ctx.step };
			return {
				root: component.root,
				store: component.store,
				data: switch_instance_initial_data
			};
		}

		if (switch_value) {
			var switch_instance = new switch_value(switch_props(ctx));
		}

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

			p: function update(changed, ctx) {
				var switch_instance_changes = {};
				if (changed.section) switch_instance_changes.step = ctx.step;

				if (switch_value !== (switch_value = ctx.templates[ctx.section.component])) {
					if (switch_instance) {
						const old_component = switch_instance;
						old_component._fragment.o(() => {
							old_component.destroy();
						});
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));
						switch_instance._fragment.c();
						switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				}

				else if (switch_value) {
					switch_instance._set(switch_instance_changes);
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

		this._fragment = create_main_fragment$9(this, this._state);

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

	function data$2() {
		return { 
			interview: getInterview()
		}
	}
	const file$a = "src\\App.html";

	function get_each_context$5(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.section = list[i];
		child_ctx.each_value = list;
		child_ctx.section_index = i;
		return child_ctx;
	}

	function create_main_fragment$a(component, ctx) {
		var div, promise, view_updating = {}, current;

		let info = {
			component,
			ctx,
			current: null,
			pending: create_pending_block$1,
			then: create_then_block$1,
			catch: create_catch_block$1,
			value: 'data',
			error: 'null',
			blocks: Array(3)
		};

		handlePromise(promise = ctx.interview, info);

		var view_initial_data = {};
		if (ctx.interview !== void 0) {
			view_initial_data.promise = ctx.interview;
			view_updating.promise = true;
		}
		var view = new View({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), loaded: createFragment() },
			data: view_initial_data,
			_bind(changed, childState) {
				var newState = {};
				if (!view_updating.promise && changed.promise) {
					newState.interview = childState.promise;
				}
				component._set(newState);
				view_updating = {};
			}
		});

		component.root._beforecreate.push(() => {
			view._bind({ promise: 1 }, view.get());
		});

		return {
			c: function create() {
				div = createElement("div");

				info.block.c();

				view._fragment.c();
				setAttribute(div, "slot", "loaded");
				addLoc(div, file$a, 1, 1, 32);
			},

			m: function mount(target, anchor) {
				append(view._slotted.loaded, div);

				info.block.i(div, info.anchor = null);
				info.mount = () => div;

				view._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				info.ctx = ctx;

				if (('interview' in changed) && promise !== (promise = ctx.interview) && handlePromise(promise, info)) ; else {
					info.block.p(changed, assign(assign({}, ctx), info.resolved));
				}

				var view_changes = {};
				if (!view_updating.promise && changed.interview) {
					view_changes.promise = ctx.interview;
					view_updating.promise = ctx.interview !== void 0;
				}
				view._set(view_changes);
				view_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				outrocallback = callAfter(outrocallback, 2);

				const countdown = callAfter(outrocallback, 3);
				for (let i = 0; i < 3; i += 1) {
					const block = info.blocks[i];
					if (block) block.o(countdown);
					else countdown();
				}

				if (view) view._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				info.block.d();
				info = null;

				view.destroy(detach);
			}
		};
	}

	// (1:0) <View bind:promise=interview>   <div slot='loaded'>    {#await interview then data}
	function create_catch_block$1(component, ctx) {

		return {
			c: noop,

			m: noop,

			p: noop,

			i: noop,

			o: run,

			d: noop
		};
	}

	// (3:30)      {#each data.sections as section}
	function create_then_block$1(component, ctx) {
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
				if (changed.interview) {
					each_value = ctx.data.sections;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$5(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$5(component, child_ctx);
							each_blocks[i].c();
						}
						each_blocks[i].i(div, each_anchor);
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

	// (4:3) {#each data.sections as section}
	function create_each_block$5(component, ctx) {
		var interviewsection_updating = {}, current;

		var interviewsection_initial_data = {};
		if (ctx.section  !== void 0) {
			interviewsection_initial_data.section = ctx.section ;
			interviewsection_updating.section = true;
		}
		if (ctx.interview  !== void 0) {
			interviewsection_initial_data.interview = ctx.interview ;
			interviewsection_updating.interview = true;
		}
		var interviewsection = new InterviewSection({
			root: component.root,
			store: component.store,
			data: interviewsection_initial_data,
			_bind(changed, childState) {
				var newState = {};
				if (!interviewsection_updating.section && changed.section) {
					ctx.each_value[ctx.section_index] = childState.section = childState.section;

					newState.interview = ctx.interview;
				}

				if (!interviewsection_updating.interview && changed.interview) {
					newState.interview = childState.interview;
				}
				component._set(newState);
				interviewsection_updating = {};
			}
		});

		component.root._beforecreate.push(() => {
			interviewsection._bind({ section: 1, interview: 1 }, interviewsection.get());
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
				if (!interviewsection_updating.section && changed.interview) {
					interviewsection_changes.section = ctx.section ;
					interviewsection_updating.section = ctx.section  !== void 0;
				}
				if (!interviewsection_updating.interview && changed.interview) {
					interviewsection_changes.interview = ctx.interview ;
					interviewsection_updating.interview = ctx.interview  !== void 0;
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

	// (1:0) <View bind:promise=interview>   <div slot='loaded'>    {#await interview then data}
	function create_pending_block$1(component, ctx) {

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
		this._state = assign(data$2(), options.data);
		if (!('interview' in this._state)) console.warn("<App> was created without expected data property 'interview'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$a(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(App.prototype, protoDev);

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
