var app=function(){"use strict";function t(){}function e(t,e){for(var n in e)t[n]=e[n];return t}function n(t,e){for(var n in e)t[n]=1;return t}function i(t,e){return 0===e&&t(),()=>{--e||t()}}function s(t){t()}function o(t,e){t.appendChild(e)}function r(t,e,n){t.insertBefore(e,n)}function a(t){t.parentNode.removeChild(t)}function c(t,e){for(;t.firstChild;)e.appendChild(t.firstChild)}function l(t,e){for(var n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function d(){return document.createDocumentFragment()}function u(t){return document.createElement(t)}function h(t){return document.createTextNode(t)}function p(){return document.createComment("")}function f(t,e,n,i){t.addEventListener(e,n,i)}function v(t,e,n,i){t.removeEventListener(e,n,i)}function _(t,e,n){null==n?t.removeAttribute(e):t.setAttribute(e,n)}function m(t,e){t.data=""+e}function g(t,e){for(var n=0;n<t.options.length;n+=1){var i=t.options[n];if(i.__value===e)return void(i.selected=!0)}}function w(t,e,n){t.classList.toggle(e,!!n)}function b(t,n){var i,s=n.token={};function o(t,i,o,r){if(n.token!==s)return;n.resolved=o&&{[o]:r};const a=e(e({},n.ctx),n.resolved),c=t&&(n.current=t)(n.component,a);n.block&&(n.blocks?n.blocks.forEach((t,e)=>{e!==i&&t&&t.o(()=>{t.d(1),n.blocks[e]=null})}):n.block.d(1),c.c(),c[c.i?"i":"m"](n.mount(),n.anchor),n.component.root.set({})),n.block=c,n.blocks&&(n.blocks[i]=c)}if((i=t)&&"function"==typeof i.then){if(t.then(t=>{o(n.then,1,n.value,t)},t=>{o(n.catch,2,n.error,t)}),n.current!==n.pending)return o(n.pending,0),!0}else{if(n.current!==n.then)return o(n.then,1,n.value,t),!0;n.resolved={[n.value]:t}}}function y(t,e){t.o(function(){!function(t,e){t.d(1),e[t.key]=null}(t,e)})}function q(){return Object.create(null)}function x(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function k(t,e){return t!=t?e==e:t!==e}function L(t,e){var n=t in this._handlers&&this._handlers[t].slice();if(n)for(var i=0;i<n.length;i+=1){var s=n[i];if(!s.__calling)try{s.__calling=!0,s.call(this,e)}finally{s.__calling=!1}}}function C(t){t._lock=!0,D(t._beforecreate),D(t._oncreate),D(t._aftercreate),t._lock=!1}function S(){return this._state}function I(t,e){t._handlers=q(),t._slots=q(),t._bind=e._bind,t._staged={},t.options=e,t.root=e.root||t,t.store=e.store||t.root.store,e.root||(t._beforecreate=[],t._oncreate=[],t._aftercreate=[])}function N(t,e){var n=this._handlers[t]||(this._handlers[t]=[]);return n.push(e),{cancel:function(){var t=n.indexOf(e);~t&&n.splice(t,1)}}}function D(t){for(;t&&t.length;)t.shift()()}function E(){this.store._remove(this)}var T={destroy:function(e){this.destroy=t,this.fire("destroy"),this.set=t,this._fragment.d(!1!==e),this._fragment=null,this._state={}},get:S,fire:L,on:N,set:function(t){this._set(e({},t)),this.root._lock||C(this.root)},_recompute:t,_set:function(t){var n=this._state,i={},s=!1;for(var o in t=e(this._staged,t),this._staged={},t)this._differs(t[o],n[o])&&(i[o]=s=!0);s&&(this._state=e(e({},n),t),this._recompute(i,this._state),this._bind&&this._bind(i,this._state),this._fragment&&(this.fire("state",{changed:i,current:this._state,previous:n}),this._fragment.p(i,this._state),this.fire("update",{changed:i,current:this._state,previous:n})))},_stage:function(t){e(this._staged,t)},_mount:function(t,e){this._fragment[this._fragment.i?"i":"m"](t,e||null)},_differs:x};function $(t,n){this._handlers={},this._dependents=[],this._computed=q(),this._sortedComputedProperties=[],this._state=e({},t),this._differs=n&&n.immutable?k:x}e($.prototype,{_add(t,e){this._dependents.push({component:t,props:e})},_init(t){const e={};for(let n=0;n<t.length;n+=1){const i=t[n];e["$"+i]=this._state[i]}return e},_remove(t){let e=this._dependents.length;for(;e--;)if(this._dependents[e].component===t)return void this._dependents.splice(e,1)},_set(t,n){const i=this._state;this._state=e(e({},i),t);for(let t=0;t<this._sortedComputedProperties.length;t+=1)this._sortedComputedProperties[t].update(this._state,n);this.fire("state",{changed:n,previous:i,current:this._state}),this._dependents.filter(t=>{const e={};let i=!1;for(let s=0;s<t.props.length;s+=1){const o=t.props[s];o in n&&(e["$"+o]=this._state[o],i=!0)}if(i)return t.component._stage(e),!0}).forEach(t=>{t.component.set({})}),this.fire("update",{changed:n,previous:i,current:this._state})},_sortComputedProperties(){const t=this._computed,e=this._sortedComputedProperties=[],n=q();let i;function s(o){const r=t[o];r&&(r.deps.forEach(t=>{if(t===i)throw new Error(`Cyclical dependency detected between ${t} <-> ${o}`);s(t)}),n[o]||(n[o]=!0,e.push(r)))}for(const t in this._computed)s(i=t)},compute(t,n,i){let s;const o={deps:n,update:(e,o,r)=>{const a=n.map(t=>(t in o&&(r=!0),e[t]));if(r){const n=i.apply(null,a);this._differs(n,s)&&(s=n,o[t]=!0,e[t]=s)}}};this._computed[t]=o,this._sortComputedProperties();const r=e({},this._state),a={};o.update(r,a,!0),this._set(r,a)},fire:L,get:S,on:N,set(t){const e=this._state,n=this._changed={};let i=!1;for(const s in t){if(this._computed[s])throw new Error(`'${s}' is a read-only computed property`);this._differs(t[s],e[s])&&(n[s]=i=!0)}i&&this._set(t,n)}});const P=({step:t,section:e})=>(t.type,!t.required||""!=t.value);var j={info:{get:t=>fetch("/data/taskInfo.json")},sections:[{id:"basicLocation",component:"Location",steps:[{id:"unknownUserLocationCard",fields:[{type:"postalCode",id:"locationCardPostalCode",placeholder:"Enter Zip Code",value:""}]}]},{id:"taskInterviewPageOne",component:"Question",componentOptions:{page:1},preload:!0,get:t=>fetch("/data/interview-page-one.json"),validate:P},{id:"taskInterviewPageTwo",component:"Question",componentOptions:{page:2},get:t=>fetch("/data/interview-page-two.json"),validate:P},{id:"contactSubmit",component:"ContactSubmit",steps:[{id:"contactSubmitOne",heading:"Give me your name...",fields:[{type:"text",placeholder:"First Name",label:"First Name",id:"firstName",value:"Jon"},{type:"text",placeholder:"Last Name",label:"Last Name",id:"lastName",value:"Greenemeier"}]},{id:"contactSubmitTwo",heading:"Give me your addy...",fields:[{type:"text",placeholder:"Street Address",label:"Street Address",id:"addressLine1",value:"1882 E 104th Ave"},{type:"text",placeholder:"City",label:"City",id:"city",value:"Denver"},{type:"postalCode",placeholder:"Zip Code",label:"Zip Code",id:"csPostalCode",value:"80233"}]},{id:"contactSubmitThree",heading:"Give me your deets...",fields:[{type:"phone",placeholder:"Phone",label:"Phone",id:"phone",value:"7203492738"},{type:"email",placeholder:"Email",label:"Email",id:"email",value:"jgrkj23kj@edify.com"}]}]}]};window.config=j;const O=t=>e=>(t.forEach((t,n)=>{t.steps=e[n]}),t),V=t=>e=>(Object.keys(t).forEach(n=>e[n]=e.hasOwnProperty(n)?e[n]:t[n]),e),F=V({steps:[]}),A=V({isLoading:!1,isValid:!0,isVisible:!1}),G=t=>{t.sections.forEach(t=>F(t).steps.forEach(A))},Z=t=>t.isVisible=!0,z=()=>j.sections[0].steps[0],B=({step:t,section:e})=>e.steps.findIndex(e=>e.id==t.id),M=t=>new Promise((e,n)=>{const i=(t=>j.sections.findIndex(e=>e.id===t.id))(t);if(-1==i)return n("Section not found");const s=j.sections[i+1];"function"==typeof s.get&&0==s.steps.length?(t=>t.get(j).then(t=>t.json()).then(e=>(e.forEach(A),t.steps=e,t)))(s).then(e).catch(n):e(j.sections[i+1])});let Q=t=>"function"==typeof t.then;const H=new class extends ${stepSubmitted({step:t,section:e}){let n=function({step:t,section:e}){return"function"!=typeof e.validate||e.validate({step:t,section:e})}({step:t,section:e}),i=Q(n);if(!i)return this.validityDetermined({step:t,section:e,isAsync:i,isValid:n});this.setLoading({step:t,loading:!0}),n.then(n=>{this.setLoading({step:t,loading:!1}),this.validityDetermined({step:t,section:e,isAsync:i,isValid:n})})}validityDetermined({step:t,section:e,isValid:n,isAsync:i}){if(n)return this.validStepSubmitted({step:t,section:e});this.invalidStepSubmitted({step:t,section:e})}validStepSubmitted({step:t,section:e}){(function({step:t,section:e}){return new Promise((n,i)=>{const s=B({step:t,section:e});if(-1==s)return i("Step not found");s+1>=e.steps.length?(console.log("fetching next section"),M(e).then(t=>{n(t.steps[0])}).catch(i)):n(e.steps[s+1])})})({step:t,section:e}).then(t=>{this.setVisible({step:t,visibility:!0}),this.scrollToStep({step:t})}).catch(this.catastrophicError)}invalidStepSubmitted({step:t,section:e}){}scrollToStep({step:t}){window.scroll({top:document.querySelector(`.scroll-section[data-id="${t.id}"]`).offsetTop,left:0,behavior:"smooth"})}setVisible({step:t,visibility:e}){t.isVisible=e,this.commitInterview()}setLoading({step:t,loading:e}){let{interview:n}=this.get();return n.isLoading=e,t.isLoading=e,this.commitInterview()}commitInterview(){let{interview:t}=this.get();return this.set({interview:t}),this}catastrophicError(t){console.log("oh nose",t)}}({interview:null,interviewPromise:function(t){var e=j.sections.filter(t=>t.hasOwnProperty("get")&&t.preload);j.info.get&&e.push(j.info);let n=e.map(t=>t.get());return Promise.all(n).then(t=>Promise.all(t.map(t=>t.json()))).then(O(e)).then(()=>(G(j),Z(z()),j))}().then(t=>{H.set({interview:t})})});window.config=j;var J={handleSubmit(t){t.preventDefault();let{step:e,section:n}=this.get();this.store.stepSubmitted({step:e,section:n})}};function R(t){I(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._slotted=t.slots||{},this._fragment=function(t,e){var n,i,l,d,_,m,g,b,y,q,x,k,L,C,S,I,N,D,E=t._slotted.heading,T=t._slotted.body,$=t._slotted.footer;function P(e){t.handleSubmit(e)}return{c(){n=u("div"),i=u("form"),l=u("div"),d=u("div"),E||((_=u("div")).textContent="Heading"),m=h("\n      "),T||((y=u("div")).textContent="Body"),q=h("\n      "),x=u("div"),$||((k=u("a")).textContent="Previous",L=h("\n          "),(C=u("button")).textContent="Next"),S=h("\n    "),(I=u("div")).innerHTML='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612 792" enable-background="new 0 0 612 792" xml:space="preserve" class="svelte-pvl5ol"><g class="svelte-pvl5ol"><path d="M404.5,478.3c-8.1-10.5-23.4-12.6-33.6-4.2c-17.6,14.6-40.1,23.5-64.8,23.5c-49.3,0-90.3-35.1-99.6-81.7l34.6-3.1\n\t\t\t            c2.6-0.2,3.9-3.2,2.3-5.3l-31.2-40.6l-31.7-41.3c-1.5-1.9-4.5-1.7-5.6,0.5l-23.8,46.2l-23.4,45.5c-1.2,2.3,0.6,5,3.2,4.8l27.5-2.5\n\t\t\t            c11.6,71.1,73.1,125.5,147.5,125.5c36.2,0,69.2-12.9,95.1-34.3c9.8-8.1,11.3-22.6,3.6-32.7L404.5,478.3z"></path><path d="M480.9,369.3l-27.5,2.5c-11.6-71.1-73.1-125.5-147.5-125.5c-36.2,0-69.2,12.9-95.1,34.3c-9.8,8.1-11.3,22.6-3.6,32.7\n\t\t\t            l0.3,0.4c8.1,10.5,23.4,12.6,33.6,4.2c17.6-14.6,40.1-23.5,64.8-23.5c49.3,0,90.3,35.1,99.6,81.7l-34.6,3.1\n\t\t\t            c-2.6,0.2-3.9,3.2-2.3,5.3l31.2,40.6l31.7,41.3c1.5,1.9,4.5,1.7,5.6-0.5l23.8-46.2l23.4-45.5C485.3,371.8,483.5,369.1,480.9,369.3z\n\t\t\t            "></path></g></svg>',d.className="card-heading svelte-pvl5ol",$||(k.href="/previous-step",C.type="submit",C.className="bs-btn"),x.className="card-footer svelte-pvl5ol",l.className="card-section svelte-pvl5ol",I.className="loading-section svelte-pvl5ol",w(I,"visible",e.step.isLoading),f(i,"submit",P),i.className="bs-card white svelte-pvl5ol",n.className="scroll-section svelte-pvl5ol",n.dataset.id=N=e.step.id,w(n,"visible",e.step.isVisible)},m(t,e){r(t,n,e),o(n,i),o(i,l),o(l,d),o(d,E||_),o(l,m),T?(o(l,g||(g=p())),o(l,T),o(l,b||(b=p()))):o(l,y),o(l,q),o(l,x),$?o(x,$):(o(x,k),o(x,L),o(x,C)),o(i,S),o(i,I),D=!0},p(t,e){t.step&&w(I,"visible",e.step.isLoading),t.step&&N!==(N=e.step.id)&&(n.dataset.id=N),t.step&&w(n,"visible",e.step.isVisible)},i(t,e){D||this.m(t,e)},o:s,d(t){t&&a(n),E&&c(d,E),T&&(function(t,e,n){for(;t.nextSibling&&t.nextSibling!==e;)n.appendChild(t.parentNode.removeChild(t.nextSibling))}(g,b,T),a(g),a(b)),$&&c(x,$),v(i,"submit",P)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}e(R.prototype,T),e(R.prototype,J);var U={lookupZip(){console.log("lookup zip",this.get())}};function W(t){const{component:e}=this._svelte;e.lookupZip()}function K(t,e,n){const i=Object.create(t);return i.field=e[n],i.each_value=e,i.field_index=n,i}function X(t,e){var n,i,s,o,c,l,d=!1;function p(){d=!0,e.each_value[e.field_index].value=o.value,t.set({step:e.step}),d=!1}return{c(){n=u("label"),s=h("\n      "),o=u("input"),n.htmlFor=i=e.field.id,o._svelte={component:t,ctx:e},f(o,"input",p),f(o,"keyup",W),o.id=c=e.field.id,_(o,"type","text"),o.placeholder=l=e.field.placeholder,o.className="svelte-1ehrgvi"},m(t,i){r(t,n,i),r(t,s,i),r(t,o,i),o.value=e.field.value},p(t,s){e=s,t.step&&i!==(i=e.field.id)&&(n.htmlFor=i),o._svelte.ctx=e,!d&&t.step&&(o.value=e.field.value),t.step&&c!==(c=e.field.id)&&(o.id=c),t.step&&l!==(l=e.field.placeholder)&&(o.placeholder=l)},d(t){t&&(a(n),a(s),a(o)),v(o,"input",p),v(o,"keyup",W)}}}function Y(t){I(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,s,r,a={},c=e.step.fields,p=[],f=0;f<c.length;f+=1)p[f]=X(t,K(e,c,f));var v={};void 0!==e.step&&(v.step=e.step,a.step=!0),void 0!==e.section&&(v.section=e.section,a.section=!0);var m=new R({root:t.root,store:t.store,slots:{default:d(),body:d(),heading:d()},data:v,_bind(e,n){var i={};!a.step&&e.step&&(i.step=n.step),!a.section&&e.section&&(i.section=n.section),t._set(i),a={}}});return t.root._beforecreate.push(()=>{m._bind({step:1,section:1},m.get())}),{c(){(n=u("div")).textContent="What is your location?",i=h("\n  "),s=u("div");for(var t=0;t<p.length;t+=1)p[t].c();m._fragment.c(),_(n,"slot","heading"),_(s,"slot","body")},m(t,e){o(m._slotted.heading,n),o(m._slotted.default,i),o(m._slotted.body,s);for(var a=0;a<p.length;a+=1)p[a].m(s,null);m._mount(t,e),r=!0},p(n,i){if(e=i,n.step){c=e.step.fields;for(var o=0;o<c.length;o+=1){const i=K(e,c,o);p[o]?p[o].p(n,i):(p[o]=X(t,i),p[o].c(),p[o].m(s,null))}for(;o<p.length;o+=1)p[o].d(1);p.length=c.length}var r={};!a.step&&n.step&&(r.step=e.step,a.step=void 0!==e.step),!a.section&&n.section&&(r.section=e.section,a.section=void 0!==e.section),m._set(r),a={}},i(t,e){r||this.m(t,e)},o(t){r&&(m&&m._fragment.o(t),r=!1)},d(t){l(p,t),m.destroy(t)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),C(this)),this._intro=!0}function tt(t,e,n){const i=Object.create(t);return i.answerID=e[n].answerID,i.answerText=e[n].answerText,i}function et(t,e){var n,i,s,c,l,d,p,g,w,b,y=e.answerText;function q(){e.question.value=i.__value,t.set({question:e.question})}return{c(){n=u("div"),i=u("input"),d=h("\n\t\t"),p=u("label"),g=h(y),b=h("\n\t"),t._bindingGroups[0].push(i),f(i,"change",q),_(i,"type","radio"),i.id=s=e.answerID,i.__value=c=e.answerID,i.value=i.__value,i.name=l="radio_"+e.question.questionID,p.htmlFor=w=e.answerID,p.className="svelte-1v9dpan"},m(t,s){r(t,n,s),o(n,i),i.checked=i.__value===e.question.value,o(n,d),o(n,p),o(p,g),o(n,b)},p(t,n){e=n,t.question&&(i.checked=i.__value===e.question.value),t.question&&s!==(s=e.answerID)&&(i.id=s),t.question&&c!==(c=e.answerID)&&(i.__value=c),i.value=i.__value,t.question&&l!==(l="radio_"+e.question.questionID)&&(i.name=l),t.question&&y!==(y=e.answerText)&&m(g,y),t.question&&w!==(w=e.answerID)&&(p.htmlFor=w)},d(e){e&&a(n),t._bindingGroups[0].splice(t._bindingGroups[0].indexOf(i),1),v(i,"change",q)}}}function nt(t){I(this,t),this._state=e({},t.data),this._bindingGroups=[[]],this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,o=e.question.answerElements,c=[],d=0;d<o.length;d+=1)c[d]=et(t,tt(e,o,d));return{c(){for(var t=0;t<c.length;t+=1)c[t].c();n=p()},m(t,e){for(var s=0;s<c.length;s+=1)c[s].m(t,e);r(t,n,e),i=!0},p(e,i){if(e.question){o=i.question.answerElements;for(var s=0;s<o.length;s+=1){const r=tt(i,o,s);c[s]?c[s].p(e,r):(c[s]=et(t,r),c[s].c(),c[s].m(n.parentNode,n))}for(;s<c.length;s+=1)c[s].d(1);c.length=o.length}},i(t,e){i||this.m(t,e)},o:s,d(t){l(c,t),t&&a(n)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}e(Y.prototype,T),e(Y.prototype,U),e(nt.prototype,T);var it={updateValue(t){t.value=t.answerElements.filter(t=>t.checked).map(t=>t.answerID).join(", "),this.set({question:t})}};function st(t){const{component:e,ctx:n}=this._svelte;e.updateValue(n.question)}function ot(t,e,n){const i=Object.create(t);return i.answerID=e[n].answerID,i.answerText=e[n].answerText,i.checked=e[n].checked,i.each_value=e,i.each_index=n,i}function rt(t,e){var n,i,s,c,l,d,p,g,w,b=e.answerText;function y(){e.each_value[e.each_index].checked=i.checked,t.set({question:e.question})}return{c(){n=u("div"),i=u("input"),l=h("\n    "),d=u("label"),p=h(b),w=h("\n  "),i._svelte={component:t,ctx:e},f(i,"change",y),f(i,"change",st),_(i,"type","checkbox"),i.id=s=e.answerID,i.__value=c=e.answerID,i.value=i.__value,d.htmlFor=g=e.answerID,d.className="svelte-16k26kd"},m(t,s){r(t,n,s),o(n,i),i.checked=e.checked,o(n,l),o(n,d),o(d,p),o(n,w)},p(t,n){e=n,i._svelte.ctx=e,t.question&&(i.checked=e.checked),t.question&&s!==(s=e.answerID)&&(i.id=s),t.question&&c!==(c=e.answerID)&&(i.__value=c),i.value=i.__value,t.question&&b!==(b=e.answerText)&&m(p,b),t.question&&g!==(g=e.answerID)&&(d.htmlFor=g)},d(t){t&&a(n),v(i,"change",y),v(i,"change",st)}}}function at(t){I(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,o=e.question.answerElements,c=[],d=0;d<o.length;d+=1)c[d]=rt(t,ot(e,o,d));return{c(){for(var t=0;t<c.length;t+=1)c[t].c();n=p()},m(t,e){for(var s=0;s<c.length;s+=1)c[s].m(t,e);r(t,n,e),i=!0},p(e,i){if(e.question){o=i.question.answerElements;for(var s=0;s<o.length;s+=1){const r=ot(i,o,s);c[s]?c[s].p(e,r):(c[s]=rt(t,r),c[s].c(),c[s].m(n.parentNode,n))}for(;s<c.length;s+=1)c[s].d(1);c.length=o.length}},i(t,e){i||this.m(t,e)},o:s,d(t){l(c,t),t&&a(n)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}function ct(t,e,n){const i=Object.create(t);return i.answerID=e[n].answerID,i.answerText=e[n].answerText,i}function lt(t,e){var n,i,s,c,l=e.answerText;return{c(){n=u("option"),i=h(l),s=h("\n\t\t"),n.__value=c=e.answerID,n.value=n.__value},m(t,e){r(t,n,e),o(n,i),o(n,s)},p(t,e){t.question&&l!==(l=e.answerText)&&m(i,l),t.question&&c!==(c=e.answerID)&&(n.__value=c),n.value=n.__value},d(t){t&&a(n)}}}function dt(t){I(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,o,c=!1,d=e.question.answerElements,h=[],p=0;p<d.length;p+=1)h[p]=lt(0,ct(e,d,p));function _(){c=!0,e.question.value=function(t){var e=t.querySelector(":checked")||t.options[0];return e&&e.__value}(n),t.set({question:e.question}),c=!1}return{c(){n=u("select");for(var s=0;s<h.length;s+=1)h[s].c();f(n,"change",_),"question"in e||t.root._beforecreate.push(_),n.id=i=e.question.questionId},m(t,i){r(t,n,i);for(var s=0;s<h.length;s+=1)h[s].m(n,null);g(n,e.question.value),o=!0},p(t,s){if(e=s,t.question){d=e.question.answerElements;for(var o=0;o<d.length;o+=1){const i=ct(e,d,o);h[o]?h[o].p(t,i):(h[o]=lt(0,i),h[o].c(),h[o].m(n,null))}for(;o<h.length;o+=1)h[o].d(1);h.length=d.length}!c&&t.question&&g(n,e.question.value),t.question&&i!==(i=e.question.questionId)&&(n.id=i)},i(t,e){o||this.m(t,e)},o:s,d(t){t&&a(n),l(h,t),v(n,"change",_)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),C(this)),this._intro=!0}function ut(t){I(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){var n,i,o,c=!1;function l(){c=!0,e.question.value=n.value,t.set({question:e.question}),c=!1}return{c(){f(n=u("input"),"input",l),_(n,"type","text"),n.placeholder=i=e.question.placeholder},m(t,i){r(t,n,i),n.value=e.question.value,o=!0},p(t,s){e=s,!c&&t.question&&(n.value=e.question.value),t.question&&i!==(i=e.question.placeholder)&&(n.placeholder=i)},i(t,e){o||this.m(t,e)},o:s,d(t){t&&a(n),v(n,"input",l)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}e(at.prototype,T),e(at.prototype,it),e(dt.prototype,T),e(ut.prototype,T);var ht={doSomething(){let{step:t,section:e}=this.get();this.store.stepSubmitted(t,e)}};function pt({changed:t,current:e}){t.step&&this.set({step:e.step})}function ft(t){I(this,t),this._state=e({templates:{Select:dt,Checkbox:at,Radio:nt,Text:ut}},t.data),this._intro=!!t.intro,this._handlers.state=[pt],pt.call(this,{changed:n({},this._state),current:this._state}),this._fragment=function(t,e){var n,s,r,a,c,l,p,f,v,g=e.step.questionText,w=e.step.isLoading,b={},y={},q=e.templates[e.step.presentationType];function x(e){var n={name:"Question"};return void 0!==e.step&&(n.question=e.step,b.question=!0),void 0!==e.interview&&(n.interview=e.interview,b.interview=!0),{root:t.root,store:t.store,data:n,_bind(e,n){var i={};!b.question&&e.question&&(i.step=n.question),!b.interview&&e.interview&&(i.interview=n.interview),t._set(i),b={}}}}if(q){var k=new q(x(e));t.root._beforecreate.push(()=>{k._bind({question:1,interview:1},k.get())})}var L={};void 0!==e.step&&(L.step=e.step,y.step=!0),void 0!==e.section&&(L.section=e.section,y.section=!0);var C=new R({root:t.root,store:t.store,slots:{default:d(),body:d(),heading:d()},data:L,_bind(e,n){var i={};!y.step&&e.step&&(i.step=n.step),!y.section&&e.section&&(i.section=n.section),t._set(i),y={}}});return t.root._beforecreate.push(()=>{C._bind({step:1,section:1},C.get())}),{c(){n=u("div"),s=h(g),r=h(" ["),a=h(w),c=h("]"),l=h("\n  "),p=u("div"),f=u("div"),k&&k._fragment.c(),C._fragment.c(),_(n,"slot","heading"),f.className="answers-block svelte-1tqai3f",_(p,"slot","body")},m(t,e){o(C._slotted.heading,n),o(n,s),o(n,r),o(n,a),o(n,c),o(C._slotted.default,l),o(C._slotted.body,p),o(p,f),k&&k._mount(f,null),C._mount(t,e),v=!0},p(n,i){e=i,v&&!n.step||g===(g=e.step.questionText)||m(s,g),v&&!n.step||w===(w=e.step.isLoading)||m(a,w);var o={};if(!b.question&&n.step&&(o.question=e.step,b.question=void 0!==e.step),!b.interview&&n.interview&&(o.interview=e.interview,b.interview=void 0!==e.interview),q!==(q=e.templates[e.step.presentationType])){if(k){const t=k;t._fragment.o(()=>{t.destroy()})}q?(k=new q(x(e)),t.root._beforecreate.push(()=>{const t={};void 0===e.step&&(t.question=1),void 0===e.interview&&(t.interview=1),k._bind(t,k.get())}),k._fragment.c(),k._mount(f,null)):k=null}else q&&(k._set(o),b={});var r={};!y.step&&n.step&&(r.step=e.step,y.step=void 0!==e.step),!y.section&&n.section&&(r.section=e.section,y.section=void 0!==e.section),C._set(r),y={}},i(t,e){v||this.m(t,e)},o(t){v&&(t=i(t,2),k&&k._fragment.o(t),C&&C._fragment.o(t),v=!1)},d(t){k&&k.destroy(),C.destroy(t)}}}(this,this._state),this.root._oncreate.push(()=>{this.fire("update",{changed:n({},this._state),current:this._state})}),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),C(this)),this._intro=!0}function vt(t,e,n){const i=Object.create(t);return i.id=e[n].id,i.label=e[n].label,i.placeholder=e[n].placeholder,i.type=e[n].type,i}function _t(t,e){var n,i,s,c,l,d,p,f,v,g,w=e.label;return{c(){n=u("div"),i=u("label"),s=h(w),l=h("\n        "),d=u("input"),g=h("\n      "),i.htmlFor=c=e.id,_(d,"type",p=e.type),d.id=f=e.id,d.placeholder=v=e.placeholder,n.className="bs-form-group"},m(t,e){r(t,n,e),o(n,i),o(i,s),o(n,l),o(n,d),o(n,g)},p(t,e){t.step&&w!==(w=e.label)&&m(s,w),t.step&&c!==(c=e.id)&&(i.htmlFor=c),t.step&&p!==(p=e.type)&&_(d,"type",p),t.step&&f!==(f=e.id)&&(d.id=f),t.step&&v!==(v=e.placeholder)&&(d.placeholder=v)},d(t){t&&a(n)}}}function mt(t){I(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,s,r,a,c=e.step.heading,p={},f=e.step.fields,v=[],g=0;g<f.length;g+=1)v[g]=_t(0,vt(e,f,g));var w={};void 0!==e.step&&(w.step=e.step,p.step=!0),void 0!==e.section&&(w.section=e.section,p.section=!0);var b=new R({root:t.root,store:t.store,slots:{default:d(),body:d(),heading:d()},data:w,_bind(e,n){var i={};!p.step&&e.step&&(i.step=n.step),!p.section&&e.section&&(i.section=n.section),t._set(i),p={}}});return t.root._beforecreate.push(()=>{b._bind({step:1,section:1},b.get())}),{c(){n=u("div"),i=h(c),s=h("\n  "),r=u("div");for(var t=0;t<v.length;t+=1)v[t].c();b._fragment.c(),_(n,"slot","heading"),_(r,"slot","body")},m(t,e){o(b._slotted.heading,n),o(n,i),o(b._slotted.default,s),o(b._slotted.body,r);for(var c=0;c<v.length;c+=1)v[c].m(r,null);b._mount(t,e),a=!0},p(t,n){if(e=n,a&&!t.step||c===(c=e.step.heading)||m(i,c),t.step){f=e.step.fields;for(var s=0;s<f.length;s+=1){const n=vt(e,f,s);v[s]?v[s].p(t,n):(v[s]=_t(0,n),v[s].c(),v[s].m(r,null))}for(;s<v.length;s+=1)v[s].d(1);v.length=f.length}var o={};!p.step&&t.step&&(o.step=e.step,p.step=void 0!==e.step),!p.section&&t.section&&(o.section=e.section,p.section=void 0!==e.section),b._set(o),p={}},i(t,e){a||this.m(t,e)},o(t){a&&(b&&b._fragment.o(t),a=!1)},d(t){l(v,t),b.destroy(t)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),C(this)),this._intro=!0}function gt(t,e,n){const i=Object.create(t);return i.step=e[n],i.each_value=e,i.step_index=n,i}function wt(t,e){var n,s,o=[],c=q(),l=e.section.steps;const d=t=>t.step.id;for(var u=0;u<l.length;u+=1){let n=gt(e,l,u),i=d(n);o[u]=c[i]=bt(t,i,n)}return{c(){for(u=0;u<o.length;u+=1)o[u].c();n=p()},m(t,e){for(u=0;u<o.length;u+=1)o[u].i(t,e);r(t,n,e),s=!0},p(e,i){const s=i.section.steps;o=function(t,e,n,i,s,o,r,a,c,l,d,u,h,p){for(var f=t.length,v=r.length,_=f,m={};_--;)m[t[_].key]=_;var g=[],w={},b={};for(_=v;_--;){var y=p(o,r,_),q=i(y),x=a[q];x?s&&x.p(n,y):(x=d(e,q,y)).c(),g[_]=w[q]=x,q in m&&(b[q]=Math.abs(_-m[q]))}var k={},L={};function C(t){t[u](c,h),a[t.key]=t,h=t.first,v--}for(;f&&v;){var S=g[v-1],I=t[f-1],N=S.key,D=I.key;S===I?(h=S.first,f--,v--):w[D]?!a[N]||k[N]?C(S):L[D]?f--:b[N]>b[D]?(L[N]=!0,C(S)):(k[D]=!0,f--):(l(I,a),f--)}for(;f--;)w[(I=t[f]).key]||l(I,a);for(;v;)C(g[v-1]);return g}(o,t,e,d,1,i,s,c,n.parentNode,y,bt,"i",n,gt)},i(t,e){s||this.m(t,e)},o(t){if(!s)return;const e=i(t,o.length);for(u=0;u<o.length;u+=1)o[u].o(e);s=!1},d(t){for(u=0;u<o.length;u+=1)o[u].d(t);t&&a(n)}}}function bt(t,e,n){var i,s,o,c={},l=n.templates[n.section.component];function d(e){var n={};return void 0!==e.step.isLoading&&(n.isLoading=e.step.isLoading,c.isLoading=!0),void 0!==e.step&&(n.step=e.step,c.step=!0),void 0!==e.section&&(n.section=e.section,c.section=!0),{root:t.root,store:t.store,data:n,_bind(n,i){var s={};!c.isLoading&&n.isLoading&&(e.step.isLoading=i.isLoading,s.section=e.section),!c.step&&n.step&&(e.each_value[e.step_index]=i.step=i.step,s.section=e.section),!c.section&&n.section&&(s.section=i.section),t._set(s),c={}}}}if(l){var u=new l(d(n));t.root._beforecreate.push(()=>{u._bind({isLoading:1,step:1,section:1},u.get())})}function h(e){t.fire("stepSubmitted",e)}return u&&u.on("stepSubmitted",h),{key:e,first:null,c(){i=p(),u&&u._fragment.c(),s=p(),this.first=i},m(t,e){r(t,i,e),u&&u._mount(t,e),r(t,s,e),o=!0},p(e,i){n=i;var o={};if(!c.isLoading&&e.section&&(o.isLoading=n.step.isLoading,c.isLoading=void 0!==n.step.isLoading),!c.step&&e.section&&(o.step=n.step,c.step=void 0!==n.step),!c.section&&e.section&&(o.section=n.section,c.section=void 0!==n.section),l!==(l=n.templates[n.section.component])){if(u){const t=u;t._fragment.o(()=>{t.destroy()})}l?(u=new l(d(n)),t.root._beforecreate.push(()=>{const t={};void 0===n.step.isLoading&&(t.isLoading=1),void 0===n.step&&(t.step=1),void 0===n.section&&(t.section=1),u._bind(t,u.get())}),u._fragment.c(),u._mount(s.parentNode,s),u.on("stepSubmitted",h)):u=null}else l&&(u._set(o),c={})},i(t,e){o||this.m(t,e)},o(t){o&&(u&&u._fragment.o(t),o=!1)},d(t){t&&(a(i),a(s)),u&&u.destroy(t)}}}function yt(t){I(this,t),this._state=e({templates:{Location:Y,Question:ft,ContactSubmit:mt}},t.data),this._intro=!!t.intro,this._fragment=wt(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),C(this)),this._intro=!0}function qt(t,e,n){const i=Object.create(t);return i.section=e[n],i.each_value=e,i.section_index=n,i}function xt(e,n){return{c:t,m:t,p:t,i:t,o:s,d:t}}function kt(t,e){var n,i,s=e.$interview&&Lt(t,e);return{c(){s&&s.c(),n=p()},m(t,e){s&&s.m(t,e),r(t,n,e),i=!0},p(e,i){i.$interview?(s?s.p(e,i):(s=Lt(t,i))&&s.c(),s.i(n.parentNode,n)):s&&s.o(function(){s.d(1),s=null})},i(t,e){i||this.m(t,e)},o(t){i&&(s?s.o(t):t(),i=!1)},d(t){s&&s.d(t),t&&a(n)}}}function Lt(t,e){for(var n,s,o=e.$interview.sections,c=[],d=0;d<o.length;d+=1)c[d]=Ct(t,qt(e,o,d));function u(t,e,n){c[t]&&c[t].o(()=>{e&&(c[t].d(e),c[t]=null),n&&n()})}return{c(){for(var t=0;t<c.length;t+=1)c[t].c();n=p()},m(t,e){for(var i=0;i<c.length;i+=1)c[i].i(t,e);r(t,n,e),s=!0},p(e,i){if(e.$interview){o=i.$interview.sections;for(var s=0;s<o.length;s+=1){const r=qt(i,o,s);c[s]?c[s].p(e,r):(c[s]=Ct(t,r),c[s].c()),c[s].i(n.parentNode,n)}for(;s<c.length;s+=1)u(s,1)}},i(t,e){s||this.m(t,e)},o(t){if(!s)return;const e=i(t,(c=c.filter(Boolean)).length);for(let t=0;t<c.length;t+=1)u(t,0,e);s=!1},d(t){l(c,t),t&&a(n)}}}function Ct(t,e){var n,i={},s={};void 0!==e.section&&(s.section=e.section,i.section=!0),void 0!==e.$interview&&(s.interview=e.$interview,i.interview=!0);var o=new yt({root:t.root,store:t.store,data:s,_bind(n,s){var o={};!i.section&&n.section&&(e.each_value[e.section_index]=s.section=s.section,o.interview=e.$interview),!i.interview&&n.interview&&(o.interview=s.interview),t.store.set(o),i={}}});return t.root._beforecreate.push(()=>{o._bind({section:1,interview:1},o.get())}),{c(){o._fragment.c()},m(t,e){o._mount(t,e),n=!0},p(t,n){e=n;var s={};!i.section&&t.$interview&&(s.section=e.section,i.section=void 0!==e.section),!i.interview&&t.$interview&&(s.interview=e.$interview,i.interview=void 0!==e.$interview),o._set(s),i={}},i(t,e){n||this.m(t,e)},o(t){n&&(o&&o._fragment.o(t),n=!1)},d(t){o.destroy(t)}}}function St(e,n){return{c:t,m:t,p:t,i:t,o:s,d:t}}function It(t){I(this,t),this.store=H,this._state=e(this.store._init(["interview"]),t.data),this.store._add(this,["interview"]),this._intro=!!t.intro,this._handlers.destroy=[E],this._fragment=function(t,n){var s,o,c,l;let d={component:t,ctx:n,current:null,pending:St,then:kt,catch:xt,value:"success",error:"null",blocks:Array(3)};return b(s=n.$interview,d),{c(){d.block.c(),o=h("\n"),(c=u("div")).className="footer-displacer svelte-1qo0hz8"},m(t,e){d.block.i(t,d.anchor=e),d.mount=(()=>o.parentNode),r(t,o,e),r(t,c,e),l=!0},p(t,i){n=i,d.ctx=n,"$interview"in t&&s!==(s=n.$interview)&&b(s,d)||d.block.p(t,e(e({},n),d.resolved))},i(t,e){l||this.m(t,e)},o(t){if(!l)return;const e=i(t,3);for(let t=0;t<3;t+=1){const n=d.blocks[t];n?n.o(e):e()}l=!1},d(t){d.block.d(t),d=null,t&&(a(o),a(c))}}}(this,this._state),this.root._oncreate.push(()=>{(function(){}).call(this),this.fire("update",{changed:n({},this._state),current:this._state})}),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),C(this)),this._intro=!0}return e(ft.prototype,T),e(ft.prototype,ht),e(mt.prototype,T),e(yt.prototype,T),e(It.prototype,T),new It({target:document.body,data:{name:"world"}})}();
//# sourceMappingURL=bundle.js.map
