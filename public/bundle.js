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

	/* src\Components\InterviewStep.html generated by Svelte v2.15.3 */

	const file = "src\\Components\\InterviewStep.html";

	function create_main_fragment(component, ctx) {
		var div4, div3, div1, slot_content_heading = component._slotted.heading, div0, text1, slot_content_body = component._slotted.body, slot_content_body_before, slot_content_body_after, text2, div2, slot_content_footer = component._slotted.footer, a0, text4, a1, current;

		return {
			c: function create() {
				div4 = createElement("div");
				div3 = createElement("div");
				div1 = createElement("div");
				if (!slot_content_heading) {
					div0 = createElement("div");
					div0.textContent = "Heading";
				}
				text1 = createText("\r\n    ");
				text2 = createText("\r\n    ");
				div2 = createElement("div");
				if (!slot_content_footer) {
					a0 = createElement("a");
					a0.textContent = "Previous";
					text4 = createText("\r\n        ");
					a1 = createElement("a");
					a1.textContent = "Next";
				}
				if (!slot_content_heading) {
					addLoc(div0, file, 4, 8, 128);
				}
				div1.className = "card-heading svelte-98rrxd";
				addLoc(div1, file, 2, 4, 63);
				if (!slot_content_footer) {
					a0.href = "/previous-step";
					addLoc(a0, file, 10, 8, 273);
					a1.className = "bs-btn";
					a1.href = "/next-step";
					addLoc(a1, file, 11, 8, 320);
				}
				div2.className = "card-footer svelte-98rrxd";
				addLoc(div2, file, 8, 4, 210);
				div3.className = "card-section svelte-98rrxd";
				addLoc(div3, file, 1, 2, 31);
				div4.className = "bs-card white svelte-98rrxd";
				addLoc(div4, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div4, anchor);
				append(div4, div3);
				append(div3, div1);
				if (!slot_content_heading) {
					append(div1, div0);
				}

				else {
					append(div1, slot_content_heading);
				}

				append(div3, text1);

				if (slot_content_body) {
					append(div3, slot_content_body_before || (slot_content_body_before = createComment()));
					append(div3, slot_content_body);
					append(div3, slot_content_body_after || (slot_content_body_after = createComment()));
				}

				append(div3, text2);
				append(div3, div2);
				if (!slot_content_footer) {
					append(div2, a0);
					append(div2, text4);
					append(div2, a1);
				}

				else {
					append(div2, slot_content_footer);
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
					detachNode(div4);
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
					reinsertChildren(div2, slot_content_footer);
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

		this._fragment = create_main_fragment(this, this._state);

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

	/* src\Components\Radio.html generated by Svelte v2.15.3 */

	const file$1 = "src\\Components\\Radio.html";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$1(component, ctx) {
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
				addLoc(input, file$1, 2, 2, 68);
				label.htmlFor = label_for_value = ctx.answerID;
				label.className = "svelte-5jml85";
				addLoc(label, file$1, 3, 2, 188);
				addLoc(div, file$1, 1, 1, 59);
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

		this._fragment = create_main_fragment$1(this, this._state);

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

	/* src\Components\Checkbox.html generated by Svelte v2.15.3 */

	var methods = { 
		updateValue(question) { 
	        question.value = question.answerElements.filter(a => a.checked).map(a => a.answerID).join(',');
	        this.set({question});
		}
	};

	const file$2 = "src\\Components\\Checkbox.html";

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

	function create_main_fragment$2(component, ctx) {
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
				addLoc(input, file$2, 2, 4, 79);
				label.htmlFor = label_for_value = ctx.answerID;
				label.className = "svelte-1vp3xsv";
				addLoc(label, file$2, 3, 4, 196);
				addLoc(div, file$2, 1, 2, 68);
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

		this._fragment = create_main_fragment$2(this, this._state);

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

	/* src\Components\Select.html generated by Svelte v2.15.3 */

	const file$3 = "src\\Components\\Select.html";

	function get_each_context$2(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.answerID = list[i].answerID;
		child_ctx.answerText = list[i].answerText;
		return child_ctx;
	}

	function create_main_fragment$3(component, ctx) {
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
				addLoc(select, file$3, 0, 0, 0);
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
				text1 = createText("\t\t\r\n\t\t");
				option.__value = option_value_value = ctx.answerID;
				option.value = option.__value;
				addLoc(option, file$3, 2, 2, 122);
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

		this._fragment = create_main_fragment$3(this, this._state);

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

	/* src\Components\Text.html generated by Svelte v2.15.3 */

	const file$4 = "src\\Components\\Text.html";

	function create_main_fragment$4(component, ctx) {
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
				addLoc(input, file$4, 0, 0, 0);
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

		this._fragment = create_main_fragment$4(this, this._state);

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

	/* src\Components\Question.html generated by Svelte v2.15.3 */



	function data() { 
		return { 
	        templates: { 
	          DROP_LIST: Select,
	          DROP_LIST_RIGHT_ADJUSTED: Select,
	          CHECK_BOX: Checkbox,
	          RADIO_ONEPER_LINE: Radio,
	          RADIO_SINGLE_LINE: Radio,
	          RADIO_BUTTON: Radio,
	          RADIO_SINGLE_LINE_LEFT: Radio, 
	          TEXT_BOX_ZIPCODE: Text,
	          TEXT_BOX_LEFT_ADJUSTED: Text, 
	          // DATE: Date, 
	          // CALENDAR: Date,
	          // TEXT_AREA: Textarea,
	          // GRAPHICAL_RADIO: GraphicalRadio
	        }	
	      }
	}
	const file$5 = "src\\Components\\Question.html";

	function create_main_fragment$5(component, ctx) {
		var div, current_block_type_index, if_block, current;

		var if_block_creators = [
			create_if_block,
			create_else_block
		];

		var if_blocks = [];

		function select_block_type(ctx) {
			if (ctx.templates[ctx.question.presentationType]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](component, ctx);

		return {
			c: function create() {
				div = createElement("div");
				if_block.c();
				addLoc(div, file$5, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if_blocks[current_block_type_index].m(div, null);
				current = true;
			},

			p: function update(changed, ctx) {
				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					if_block.o(function() {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});

					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](component, ctx);
						if_block.c();
					}
					if_block.m(div, null);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (if_block) if_block.o(outrocallback);
				else outrocallback();

				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				if_blocks[current_block_type_index].d();
			}
		};
	}

	// (9:2) {:else}
	function create_else_block(component, ctx) {
		var p, strong, text0, em, text1, text2_value = ctx.question.presentationType, text2, text3, current;

		return {
			c: function create() {
				p = createElement("p");
				strong = createElement("strong");
				text0 = createText("Need to define mapping for ");
				em = createElement("em");
				text1 = createText("\"");
				text2 = createText(text2_value);
				text3 = createText("\"");
				addLoc(em, file$5, 9, 42, 328);
				addLoc(strong, file$5, 9, 7, 293);
				p.className = "svelte-1lp21kb";
				addLoc(p, file$5, 9, 4, 290);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
				append(p, strong);
				append(strong, text0);
				append(strong, em);
				append(em, text1);
				append(em, text2);
				append(em, text3);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((changed.question) && text2_value !== (text2_value = ctx.question.presentationType)) {
					setData(text2, text2_value);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(p);
				}
			}
		};
	}

	// (2:2) {#if templates[question.presentationType]}
	function create_if_block(component, ctx) {
		var div, switch_instance_updating = {}, text0, p, strong, text2, text3_value = ctx.question.value, text3, current;

		var switch_value = ctx.templates[ctx.question.presentationType];

		function switch_props(ctx) {
			var switch_instance_initial_data = { name: "Question" };
			if (ctx.question  !== void 0) {
				switch_instance_initial_data.question = ctx.question ;
				switch_instance_updating.question = true;
			}
			return {
				root: component.root,
				store: component.store,
				data: switch_instance_initial_data,
				_bind(changed, childState) {
					var newState = {};
					if (!switch_instance_updating.question && changed.question) {
						newState.question = childState.question;
					}
					component._set(newState);
					switch_instance_updating = {};
				}
			};
		}

		if (switch_value) {
			var switch_instance = new switch_value(switch_props(ctx));

			component.root._beforecreate.push(() => {
				switch_instance._bind({ question: 1 }, switch_instance.get());
			});
		}

		return {
			c: function create() {
				div = createElement("div");
				if (switch_instance) switch_instance._fragment.c();
				text0 = createText("\r\n    ");
				p = createElement("p");
				strong = createElement("strong");
				strong.textContent = "Answer:";
				text2 = createText(" ");
				text3 = createText(text3_value);
				div.className = "question-container svelte-1lp21kb";
				addLoc(div, file$5, 2, 4, 57);
				addLoc(strong, file$5, 6, 6, 222);
				p.className = "svelte-1lp21kb";
				addLoc(p, file$5, 5, 4, 211);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				if (switch_instance) {
					switch_instance._mount(div, null);
				}

				insert(target, text0, anchor);
				insert(target, p, anchor);
				append(p, strong);
				append(p, text2);
				append(p, text3);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				var switch_instance_changes = {};
				if (!switch_instance_updating.question && changed.question) {
					switch_instance_changes.question = ctx.question ;
					switch_instance_updating.question = ctx.question  !== void 0;
				}

				if (switch_value !== (switch_value = ctx.templates[ctx.question.presentationType])) {
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
							if (ctx.question  === void 0) changed.question = 1;
							switch_instance._bind(changed, switch_instance.get());
						});
						switch_instance._fragment.c();
						switch_instance._mount(div, null);
					} else {
						switch_instance = null;
					}
				}

				else if (switch_value) {
					switch_instance._set(switch_instance_changes);
					switch_instance_updating = {};
				}

				if ((!current || changed.question) && text3_value !== (text3_value = ctx.question.value)) {
					setData(text3, text3_value);
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
					detachNode(div);
				}

				if (switch_instance) switch_instance.destroy();
				if (detach) {
					detachNode(text0);
					detachNode(p);
				}
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
		if (!('templates' in this._state)) console.warn("<Question> was created without expected data property 'templates'");
		if (!('question' in this._state)) console.warn("<Question> was created without expected data property 'question'");
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

	assign(Question.prototype, protoDev);

	Question.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Components\View.html generated by Svelte v2.15.3 */

	const file$6 = "src\\Components\\View.html";

	function create_main_fragment$6(component, ctx) {
		var await_block_anchor, promise, current;

		let info = {
			component,
			ctx,
			current: null,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 'success',
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

	// (7:0) {:catch error}
	function create_catch_block(component, ctx) {
		var slot_content_error = component._slotted.error, slot_content_error_before, slot_content_error_after, h1;

		return {
			c: function create() {
				if (!slot_content_error) {
					h1 = createElement("h1");
					h1.textContent = "Error!";
				}
				if (!slot_content_error) {
					addLoc(h1, file$6, 8, 3, 169);
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

	// (5:0) {:then success}
	function create_then_block(component, ctx) {
		var slot_content_loaded = component._slotted.loaded, slot_content_loaded_before, slot_content_loaded_after;

		return {
			c: noop,

			m: function mount(target, anchor) {
				if (slot_content_loaded) {
					insert(target, slot_content_loaded_before || (slot_content_loaded_before = createComment()), anchor);
					insert(target, slot_content_loaded, anchor);
					insert(target, slot_content_loaded_after || (slot_content_loaded_after = createComment()), anchor);
				}
			},

			d: function destroy$$1(detach) {
				if (slot_content_loaded) {
					reinsertBetween(slot_content_loaded_before, slot_content_loaded_after, slot_content_loaded);
					detachNode(slot_content_loaded_before);
					detachNode(slot_content_loaded_after);
				}
			}
		};
	}

	// (1:16)     <slot name='loading'>     <div>Loading...</div>    </slot>  {:then success}
	function create_pending_block(component, ctx) {
		var slot_content_loading = component._slotted.loading, slot_content_loading_before, slot_content_loading_after, div;

		return {
			c: function create() {
				if (!slot_content_loading) {
					div = createElement("div");
					div.textContent = "Loading...";
				}
				if (!slot_content_loading) {
					addLoc(div, file$6, 2, 3, 46);
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

		this._fragment = create_main_fragment$6(this, this._state);

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

	/* src\App.html generated by Svelte v2.15.3 */

	let formatQuestion = q => { 
		switch(q.presentationType) { 
			case 'CHECK_BOX': 
				q.answerElements.forEach(a => a.checked = false);
				break; 
			case 'RADIO_ONEPER_LINE':
			case 'RADIO_SINGLE_LINE':
			case 'RADIO_BUTTON':
			case 'RADIO_SINGLE_LINE_LEFT':
				// q.answerElements.forEach(a => a.checked = false);
				q.value = q.answerElements[0].answerID;
				break; 
		}
		return q;
	}; 

	let transformData = (values) => {
		let [interview,info] = values;
		return { 
			info, 
			interviewSteps: interview.questionElements.map(q => {
				q.presentationType = q.answerElements[0].presentationType;
				q.value = '';
				q.valid = false;
				q.stepType = 'interviewQuestion';
				q.questionID = `ques_${q.questionID}`;
				q.answerElements.forEach(a => a.answerID = `ans_${a.answerID}`);
				return formatQuestion(q);
			})
		}
	};

	function data$1() { 
		return {
			interviewSteps: []
		}
	}
	function oncreate() { 
		let getInterview = fetch(`/data/interview.json`);
		let getInfo = fetch(`/data/taskInfo.json`);
		this.set({
			promise: Promise.all([getInterview, getInfo])
				.then(values => Promise.all(values.map(v => v.json())))
				.then()
				.then(data => {
					this.set(transformData(data));
				})
				.catch(errors => {
					console.log(errors);
				})
		});
	}
	const file$7 = "src\\App.html";

	function get_each_context$3(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.step = list[i];
		child_ctx.each_value = list;
		child_ctx.step_index = i;
		return child_ctx;
	}

	function create_main_fragment$7(component, ctx) {
		var span, view_updating = {}, current;

		var each_value = ctx.interviewSteps;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$3(component, get_each_context$3(ctx, each_value, i));
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

		var view_initial_data = {};
		if (ctx.promise !== void 0) {
			view_initial_data.promise = ctx.promise;
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
					newState.promise = childState.promise;
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
				span = createElement("span");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				view._fragment.c();
				setAttribute(span, "slot", "loaded");
				addLoc(span, file$7, 1, 1, 22);
			},

			m: function mount(target, anchor) {
				append(view._slotted.loaded, span);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].i(span, null);
				}

				view._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if (changed.interviewSteps) {
					each_value = ctx.interviewSteps;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$3(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$3(component, child_ctx);
							each_blocks[i].c();
						}
						each_blocks[i].i(span, null);
					}
					for (; i < each_blocks.length; i += 1) outroBlock(i, 1);
				}

				var view_changes = {};
				if (!view_updating.promise && changed.promise) {
					view_changes.promise = ctx.promise;
					view_updating.promise = ctx.promise !== void 0;
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

				each_blocks = each_blocks.filter(Boolean);
				const countdown = callAfter(outrocallback, each_blocks.length);
				for (let i = 0; i < each_blocks.length; i += 1) outroBlock(i, 0, countdown);

				if (view) view._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				destroyEach(each_blocks, detach);

				view.destroy(detach);
			}
		};
	}

	// (4:3) {#if step.stepType == 'interviewQuestion'}
	function create_if_block$1(component, ctx) {
		var div0, text0_value = ctx.step.questionText, text0, text1, div1, question_updating = {}, text2, current;

		var question_initial_data = {};
		if (ctx.step !== void 0) {
			question_initial_data.question = ctx.step;
			question_updating.question = true;
		}
		var question = new Question({
			root: component.root,
			store: component.store,
			data: question_initial_data,
			_bind(changed, childState) {
				var newState = {};
				if (!question_updating.question && changed.question) {
					ctx.each_value[ctx.step_index] = childState.question = childState.question;

					newState.interviewSteps = ctx.interviewSteps;
				}
				component._set(newState);
				question_updating = {};
			}
		});

		component.root._beforecreate.push(() => {
			question._bind({ question: 1 }, question.get());
		});

		var interviewstep = new InterviewStep({
			root: component.root,
			store: component.store,
			slots: { default: createFragment(), body: createFragment(), heading: createFragment() }
		});

		return {
			c: function create() {
				div0 = createElement("div");
				text0 = createText(text0_value);
				text1 = createText("\r\n\t\t\t\t\t");
				div1 = createElement("div");
				question._fragment.c();
				text2 = createText("\r\n\t\t\t\t");
				interviewstep._fragment.c();
				setAttribute(div0, "slot", "heading");
				addLoc(div0, file$7, 5, 5, 151);
				setAttribute(div1, "slot", "body");
				addLoc(div1, file$7, 8, 5, 218);
			},

			m: function mount(target, anchor) {
				append(interviewstep._slotted.heading, div0);
				append(div0, text0);
				append(interviewstep._slotted.default, text1);
				append(interviewstep._slotted.body, div1);
				question._mount(div1, null);
				append(interviewstep._slotted.default, text2);
				interviewstep._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if ((!current || changed.interviewSteps) && text0_value !== (text0_value = ctx.step.questionText)) {
					setData(text0, text0_value);
				}

				var question_changes = {};
				if (!question_updating.question && changed.interviewSteps) {
					question_changes.question = ctx.step;
					question_updating.question = ctx.step !== void 0;
				}
				question._set(question_changes);
				question_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				outrocallback = callAfter(outrocallback, 2);

				if (question) question._fragment.o(outrocallback);
				if (interviewstep) interviewstep._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				question.destroy();
				interviewstep.destroy(detach);
			}
		};
	}

	// (3:2) {#each interviewSteps as step}
	function create_each_block$3(component, ctx) {
		var if_block_anchor, current;

		var if_block = (ctx.step.stepType == 'interviewQuestion') && create_if_block$1(component, ctx);

		return {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = createComment();
			},

			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.step.stepType == 'interviewQuestion') {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block$1(component, ctx);
						if (if_block) if_block.c();
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
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (if_block) if_block.o(outrocallback);
				else outrocallback();

				current = false;
			},

			d: function destroy$$1(detach) {
				if (if_block) if_block.d(detach);
				if (detach) {
					detachNode(if_block_anchor);
				}
			}
		};
	}

	function App(options) {
		this._debugName = '<App>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign(data$1(), options.data);
		if (!('promise' in this._state)) console.warn("<App> was created without expected data property 'promise'");
		if (!('interviewSteps' in this._state)) console.warn("<App> was created without expected data property 'interviewSteps'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$7(this, this._state);

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
