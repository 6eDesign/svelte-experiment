var app=function(){"use strict";function t(){}function e(t,e){for(var n in e)t[n]=e[n];return t}function n(t,e){return 0===e&&t(),()=>{--e||t()}}function o(t){t()}function i(t,e){t.appendChild(e)}function r(t,e,n){t.insertBefore(e,n)}function s(t){t.parentNode.removeChild(t)}function a(t,e,n){for(;t.nextSibling&&t.nextSibling!==e;)n.appendChild(t.parentNode.removeChild(t.nextSibling))}function c(t,e){for(;t.firstChild;)e.appendChild(t.firstChild)}function l(t,e){for(var n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function h(){return document.createDocumentFragment()}function u(t){return document.createElement(t)}function d(t){return document.createTextNode(t)}function p(){return document.createComment("")}function f(t,e,n,o){t.addEventListener(e,n,o)}function _(t,e,n,o){t.removeEventListener(e,n,o)}function v(t,e,n){null==n?t.removeAttribute(e):t.setAttribute(e,n)}function m(t,e){t.data=""+e}function g(t,e){for(var n=0;n<t.options.length;n+=1){var o=t.options[n];if(o.__value===e)return void(o.selected=!0)}}function w(t,n){var o,i=n.token={};function r(t,o,r,s){if(n.token!==i)return;n.resolved=r&&{[r]:s};const a=e(e({},n.ctx),n.resolved),c=t&&(n.current=t)(n.component,a);n.block&&(n.blocks?n.blocks.forEach((t,e)=>{e!==o&&t&&t.o(()=>{t.d(1),n.blocks[e]=null})}):n.block.d(1),c.c(),c[c.i?"i":"m"](n.mount(),n.anchor),n.component.root.set({})),n.block=c,n.blocks&&(n.blocks[o]=c)}if((o=t)&&"function"==typeof o.then){if(t.then(t=>{r(n.then,1,n.value,t)},t=>{r(n.catch,2,n.error,t)}),n.current!==n.pending)return r(n.pending,0),!0}else{if(n.current!==n.then)return r(n.then,1,n.value,t),!0;n.resolved={[n.value]:t}}}function b(){return Object.create(null)}function y(t){t._lock=!0,k(t._beforecreate),k(t._oncreate),k(t._aftercreate),t._lock=!1}function x(t,e){t._handlers=b(),t._slots=b(),t._bind=e._bind,t._staged={},t.options=e,t.root=e.root||t,t.store=e.store||t.root.store,e.root||(t._beforecreate=[],t._oncreate=[],t._aftercreate=[])}function k(t){for(;t&&t.length;)t.shift()()}var q={destroy:function(e){this.destroy=t,this.fire("destroy"),this.set=t,this._fragment.d(!1!==e),this._fragment=null,this._state={}},get:function(){return this._state},fire:function(t,e){var n=t in this._handlers&&this._handlers[t].slice();if(n)for(var o=0;o<n.length;o+=1){var i=n[o];if(!i.__calling)try{i.__calling=!0,i.call(this,e)}finally{i.__calling=!1}}},on:function(t,e){var n=this._handlers[t]||(this._handlers[t]=[]);return n.push(e),{cancel:function(){var t=n.indexOf(e);~t&&n.splice(t,1)}}},set:function(t){this._set(e({},t)),this.root._lock||y(this.root)},_recompute:t,_set:function(t){var n=this._state,o={},i=!1;for(var r in t=e(this._staged,t),this._staged={},t)this._differs(t[r],n[r])&&(o[r]=i=!0);i&&(this._state=e(e({},n),t),this._recompute(o,this._state),this._bind&&this._bind(o,this._state),this._fragment&&(this.fire("state",{changed:o,current:this._state,previous:n}),this._fragment.p(o,this._state),this.fire("update",{changed:o,current:this._state,previous:n})))},_stage:function(t){e(this._staged,t)},_mount:function(t,e){this._fragment[this._fragment.i?"i":"m"](t,e||null)},_differs:function(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}};var C={info:{get:t=>fetch("/data/taskInfo.json")},sections:[{name:"basicLocation",component:"Location",steps:[{fields:{unknown:[{type:"postalCode",id:"locationCardPostalCode",value:"99547"}],known:{}}}]},{name:"taskInterviewPageOne",component:"Question",componentOptions:{page:1},preload:!0,get:t=>fetch("/data/interview-page-one.json")},{name:"taskInterviewPageTwo",component:"Question",componentOptions:{page:2},get:t=>fetch("/data/interview-page-two.json")},{name:"contactSubmit",component:"ContactSubmit",steps:[{heading:"Give me your name...",fields:[{type:"text",placeholder:"First Name",label:"First Name",id:"firstName",value:"Jon"},{type:"text",placeholder:"Last Name",label:"Last Name",id:"lastName",value:"Greenemeier"}]},{heading:"Give me your addy...",fields:[{type:"text",placeholder:"Street Address",label:"Street Address",id:"addressLine1",value:"1882 E 104th Ave"},{type:"text",placeholder:"City",label:"City",id:"city",value:"Denver"},{type:"postalCode",placeholder:"Zip Code",label:"Zip Code",id:"csPostalCode",value:"80233"}]},{heading:"Give me your deets...",fields:[{type:"phone",placeholder:"Phone",label:"Phone",id:"phone",value:"7203492738"},{type:"email",placeholder:"Email",label:"Email",id:"email",value:"jgrkj23kj@edify.com"}]}]}]};let I=t=>e=>(t.forEach((t,n)=>{t.steps=e[n]}),t);function D(t,e){var n,o,i,c=t._slotted.error;return{c(){c||((i=u("h1")).textContent="Error!")},m(t,e){c?(r(t,n||(n=p()),e),r(t,c,e),r(t,o||(o=p()),e)):r(t,i,e)},d(t){c?(a(n,o,c),s(n),s(o)):t&&s(i)}}}function N(t,e){var n,o,i,c=t._slotted.loaded;return{c(){c||((i=u("div")).textContent="Loaded!")},m(t,e){c?(r(t,n||(n=p()),e),r(t,c,e),r(t,o||(o=p()),e)):r(t,i,e)},d(t){c?(a(n,o,c),s(n),s(o)):t&&s(i)}}}function T(t,e){var n,o,i,c=t._slotted.loading;return{c(){c||((i=u("div")).textContent="Loading...")},m(t,e){c?(r(t,n||(n=p()),e),r(t,c,e),r(t,o||(o=p()),e)):r(t,i,e)},d(t){c?(a(n,o,c),s(n),s(o)):t&&s(i)}}}function j(t){x(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._slotted=t.slots||{},this._fragment=function(t,e){var n,i,a;let c={component:t,ctx:e,current:null,pending:T,then:N,catch:D,value:"data",error:"error"};return w(i=e.promise,c),{c(){n=p(),c.block.c()},m(t,e){r(t,n,e),c.block.m(t,c.anchor=e),c.mount=(()=>n.parentNode),a=!0},p(t,n){e=n,c.ctx=e,"promise"in t&&i!==(i=e.promise)&&w(i,c)},i(t,e){a||this.m(t,e)},o:o,d(t){t&&s(n),c.block.d(t),c=null}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}function E(n){var l,h,f,_,v,m,g,w,b,y,k,q,C,I,D,N,T,j,E;x(this,n),this._state=e({},n.data),this._intro=!!n.intro,this._slotted=n.slots||{},this._fragment=(l=this,this._state,T=l._slotted.heading,j=l._slotted.body,E=l._slotted.footer,{c(){h=u("div"),f=u("form"),_=u("div"),v=u("div"),T||((m=u("div")).textContent="Heading"),g=d("\r\n      "),j||((y=u("div")).textContent="Body"),k=d("\r\n      "),q=u("div"),E||((C=u("a")).textContent="Previous",I=d("\r\n          "),(D=u("button")).textContent="Next"),v.className="card-heading svelte-98rrxd",E||(C.href="/previous-step",D.type="submit",D.className="bs-btn"),q.className="card-footer svelte-98rrxd",_.className="card-section svelte-98rrxd",f.className="bs-card white svelte-98rrxd",h.className="scroll-section"},m(t,e){r(t,h,e),i(h,f),i(f,_),i(_,v),i(v,T||m),i(_,g),j?(i(_,w||(w=p())),i(_,j),i(_,b||(b=p()))):i(_,y),i(_,k),i(_,q),E?i(q,E):(i(q,C),i(q,I),i(q,D)),N=!0},p:t,i(t,e){N||this.m(t,e)},o:o,d(t){t&&s(h),T&&c(v,T),j&&(a(w,b,j),s(w),s(b)),E&&c(q,E)}}),n.target&&(this._fragment.c(),this._mount(n.target,n.anchor)),this._intro=!0}function O(n){var o,r,s,a;x(this,n),this._state=e({},n.data),this._intro=!!n.intro,this._fragment=(o=this,this._state,a=new E({root:o.root,store:o.store,slots:{default:h(),heading:h()}}),{c(){(r=u("div")).textContent="What is your location?",a._fragment.c(),v(r,"slot","heading")},m(t,e){i(a._slotted.heading,r),a._mount(t,e),s=!0},p:t,i(t,e){s||this.m(t,e)},o(t){s&&(a&&a._fragment.o(t),s=!1)},d(t){a.destroy(t)}}),n.target&&(this._fragment.c(),this._mount(n.target,n.anchor),y(this)),this._intro=!0}function L(t,e,n){const o=Object.create(t);return o.answerID=e[n].answerID,o.answerText=e[n].answerText,o}function P(t,e){var n,o,a,c,l,h,p,g,w,b,y=e.answerText;function x(){e.question.value=o.__value,t.set({question:e.question})}return{c(){n=u("div"),o=u("input"),h=d("\r\n\t\t"),p=u("label"),g=d(y),b=d("\r\n\t"),t._bindingGroups[0].push(o),f(o,"change",x),v(o,"type","radio"),o.id=a=e.answerID,o.__value=c=e.answerID,o.value=o.__value,o.name=l="radio_"+e.question.questionID,p.htmlFor=w=e.answerID,p.className="svelte-5jml85"},m(t,s){r(t,n,s),i(n,o),o.checked=o.__value===e.question.value,i(n,h),i(n,p),i(p,g),i(n,b)},p(t,n){e=n,t.question&&(o.checked=o.__value===e.question.value),t.question&&a!==(a=e.answerID)&&(o.id=a),t.question&&c!==(c=e.answerID)&&(o.__value=c),o.value=o.__value,t.question&&l!==(l="radio_"+e.question.questionID)&&(o.name=l),t.question&&y!==(y=e.answerText)&&m(g,y),t.question&&w!==(w=e.answerID)&&(p.htmlFor=w)},d(e){e&&s(n),t._bindingGroups[0].splice(t._bindingGroups[0].indexOf(o),1),_(o,"change",x)}}}function S(t){x(this,t),this._state=e({},t.data),this._bindingGroups=[[]],this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,a=e.question.answerElements,c=[],h=0;h<a.length;h+=1)c[h]=P(t,L(e,a,h));return{c(){for(var t=0;t<c.length;t+=1)c[t].c();n=p()},m(t,e){for(var o=0;o<c.length;o+=1)c[o].m(t,e);r(t,n,e),i=!0},p(e,o){if(e.question){a=o.question.answerElements;for(var i=0;i<a.length;i+=1){const r=L(o,a,i);c[i]?c[i].p(e,r):(c[i]=P(t,r),c[i].c(),c[i].m(n.parentNode,n))}for(;i<c.length;i+=1)c[i].d(1);c.length=a.length}},i(t,e){i||this.m(t,e)},o:o,d(t){l(c,t),t&&s(n)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}e(j.prototype,q),e(E.prototype,q),e(O.prototype,q),e(S.prototype,q);var F={updateValue(t){console.log(t),t.value=t.answerElements.filter(t=>t.checked).map(t=>t.answerID).join(","),this.set({step:t})}};function G(t){const{component:e,ctx:n}=this._svelte;e.updateValue(n.step)}function A(t,e,n){const o=Object.create(t);return o.answerID=e[n].answerID,o.answerText=e[n].answerText,o.checked=e[n].checked,o.each_value=e,o.each_index=n,o}function B(t,e){var n,o,a,c,l,h,p,g,w,b=e.answerText;function y(){e.each_value[e.each_index].checked=o.checked,t.set({step:e.step})}return{c(){n=u("div"),o=u("input"),l=d("\r\n    "),h=u("label"),p=d(b),w=d("\r\n  "),o._svelte={component:t,ctx:e},f(o,"change",y),f(o,"change",G),v(o,"type","checkbox"),o.id=a=e.answerID,o.__value=c=e.answerID,o.value=o.__value,h.htmlFor=g=e.answerID,h.className="svelte-1vp3xsv"},m(t,s){r(t,n,s),i(n,o),o.checked=e.checked,i(n,l),i(n,h),i(h,p),i(n,w)},p(t,n){e=n,o._svelte.ctx=e,t.step&&(o.checked=e.checked),t.step&&a!==(a=e.answerID)&&(o.id=a),t.step&&c!==(c=e.answerID)&&(o.__value=c),o.value=o.__value,t.step&&b!==(b=e.answerText)&&m(p,b),t.step&&g!==(g=e.answerID)&&(h.htmlFor=g)},d(t){t&&s(n),_(o,"change",y),_(o,"change",G)}}}function Q(t){x(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,a=e.step.answerElements,c=[],h=0;h<a.length;h+=1)c[h]=B(t,A(e,a,h));return{c(){for(var t=0;t<c.length;t+=1)c[t].c();n=p()},m(t,e){for(var o=0;o<c.length;o+=1)c[o].m(t,e);r(t,n,e),i=!0},p(e,o){if(e.step){a=o.step.answerElements;for(var i=0;i<a.length;i+=1){const r=A(o,a,i);c[i]?c[i].p(e,r):(c[i]=B(t,r),c[i].c(),c[i].m(n.parentNode,n))}for(;i<c.length;i+=1)c[i].d(1);c.length=a.length}},i(t,e){i||this.m(t,e)},o:o,d(t){l(c,t),t&&s(n)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}function V(t,e,n){const o=Object.create(t);return o.answerID=e[n].answerID,o.answerText=e[n].answerText,o}function Z(t,e){var n,o,a,c,l=e.answerText;return{c(){n=u("option"),o=d(l),a=d("\r\n\t\t"),n.__value=c=e.answerID,n.value=n.__value},m(t,e){r(t,n,e),i(n,o),i(n,a)},p(t,e){t.step&&l!==(l=e.answerText)&&m(o,l),t.step&&c!==(c=e.answerID)&&(n.__value=c),n.value=n.__value},d(t){t&&s(n)}}}function H(t){x(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var n,i,a,c=!1,h=e.step.answerElements,d=[],p=0;p<h.length;p+=1)d[p]=Z(0,V(e,h,p));function v(){c=!0,e.step.value=function(t){var e=t.querySelector(":checked")||t.options[0];return e&&e.__value}(n),t.set({step:e.step}),c=!1}return{c(){n=u("select");for(var o=0;o<d.length;o+=1)d[o].c();f(n,"change",v),"step"in e||t.root._beforecreate.push(v),n.id=i=e.step.questionId},m(t,o){r(t,n,o);for(var i=0;i<d.length;i+=1)d[i].m(n,null);g(n,e.step.value),a=!0},p(t,o){if(e=o,t.step){h=e.step.answerElements;for(var r=0;r<h.length;r+=1){const o=V(e,h,r);d[r]?d[r].p(t,o):(d[r]=Z(0,o),d[r].c(),d[r].m(n,null))}for(;r<d.length;r+=1)d[r].d(1);d.length=h.length}!c&&t.step&&g(n,e.step.value),t.step&&i!==(i=e.step.questionId)&&(n.id=i)},i(t,e){a||this.m(t,e)},o:o,d(t){t&&s(n),l(d,t),_(n,"change",v)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),y(this)),this._intro=!0}function J(t){x(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){var n,i,a,c=!1;function l(){c=!0,e.question.value=n.value,t.set({question:e.question}),c=!1}return{c(){f(n=u("input"),"input",l),v(n,"type","text"),n.placeholder=i=e.question.placeholder},m(t,o){r(t,n,o),n.value=e.question.value,a=!0},p(t,o){e=o,!c&&t.question&&(n.value=e.question.value),t.question&&i!==(i=e.question.placeholder)&&(n.placeholder=i)},i(t,e){a||this.m(t,e)},o:o,d(t){t&&s(n),_(n,"input",l)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}function R(t){x(this,t),this._state=e({templates:{Select:H,Checkbox:Q,Radio:S,Text:J}},t.data),this._intro=!!t.intro,this._fragment=function(t,e){var o,r,s,a,c,l,p,f,_,g,w=e.step.questionText,b={},y=e.step.value,x=e.templates[e.step.presentationType];function k(e){var n={name:"Question"};return void 0!==e.step&&(n.step=e.step,b.step=!0),void 0!==e.interview&&(n.interview=e.interview,b.interview=!0),{root:t.root,store:t.store,data:n,_bind(e,n){var o={};!b.step&&e.step&&(o.step=n.step),!b.interview&&e.interview&&(o.interview=n.interview),t._set(o),b={}}}}if(x){var q=new x(k(e));t.root._beforecreate.push(()=>{q._bind({step:1,interview:1},q.get())})}var C=new E({root:t.root,store:t.store,slots:{default:h(),body:h(),heading:h()}});return{c(){o=u("div"),r=d(w),s=d("\r\n  "),a=u("div"),c=u("div"),q&&q._fragment.c(),l=d("\r\n      "),p=u("p"),f=d("Value: "),_=d(y),C._fragment.c(),v(o,"slot","heading"),c.className="answers-block svelte-d70yqh",v(a,"slot","body")},m(t,e){i(C._slotted.heading,o),i(o,r),i(C._slotted.default,s),i(C._slotted.body,a),i(a,c),q&&q._mount(c,null),i(c,l),i(c,p),i(p,f),i(p,_),C._mount(t,e),g=!0},p(n,o){e=o,g&&!n.step||w===(w=e.step.questionText)||m(r,w);var i={};if(!b.step&&n.step&&(i.step=e.step,b.step=void 0!==e.step),!b.interview&&n.interview&&(i.interview=e.interview,b.interview=void 0!==e.interview),x!==(x=e.templates[e.step.presentationType])){if(q){const t=q;t._fragment.o(()=>{t.destroy()})}x?(q=new x(k(e)),t.root._beforecreate.push(()=>{const t={};void 0===e.step&&(t.step=1),void 0===e.interview&&(t.interview=1),q._bind(t,q.get())}),q._fragment.c(),q._mount(c,l)):q=null}else x&&(q._set(i),b={});g&&!n.step||y===(y=e.step.value)||m(_,y)},i(t,e){g||this.m(t,e)},o(t){g&&(t=n(t,2),q&&q._fragment.o(t),C&&C._fragment.o(t),g=!1)},d(t){q&&q.destroy(),C.destroy(t)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),y(this)),this._intro=!0}function W(t,e,n){const o=Object.create(t);return o.id=e[n].id,o.label=e[n].label,o.placeholder=e[n].placeholder,o.type=e[n].type,o}function z(t,e){var n,o,a,c,l,h,p,f,_,g,w=e.label;return{c(){n=u("div"),o=u("label"),a=d(w),l=d("\r\n        "),h=u("input"),g=d("\r\n      "),o.htmlFor=c=e.id,v(h,"type",p=e.type),h.id=f=e.id,h.placeholder=_=e.placeholder,n.className="bs-form-group"},m(t,e){r(t,n,e),i(n,o),i(o,a),i(n,l),i(n,h),i(n,g)},p(t,e){t.step&&w!==(w=e.label)&&m(a,w),t.step&&c!==(c=e.id)&&(o.htmlFor=c),t.step&&p!==(p=e.type)&&v(h,"type",p),t.step&&f!==(f=e.id)&&(h.id=f),t.step&&_!==(_=e.placeholder)&&(h.placeholder=_)},d(t){t&&s(n)}}}function K(t){x(this,t),this._state=e({},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var n,o,r,s,a,c=e.step.heading,p=e.step.fields,f=[],_=0;_<p.length;_+=1)f[_]=z(0,W(e,p,_));var g=new E({root:t.root,store:t.store,slots:{default:h(),body:h(),heading:h()}});return{c(){n=u("div"),o=d(c),r=d("\r\n  "),s=u("div");for(var t=0;t<f.length;t+=1)f[t].c();g._fragment.c(),v(n,"slot","heading"),v(s,"slot","body")},m(t,e){i(g._slotted.heading,n),i(n,o),i(g._slotted.default,r),i(g._slotted.body,s);for(var c=0;c<f.length;c+=1)f[c].m(s,null);g._mount(t,e),a=!0},p(t,e){if(a&&!t.step||c===(c=e.step.heading)||m(o,c),t.step){p=e.step.fields;for(var n=0;n<p.length;n+=1){const o=W(e,p,n);f[n]?f[n].p(t,o):(f[n]=z(0,o),f[n].c(),f[n].m(s,null))}for(;n<f.length;n+=1)f[n].d(1);f.length=p.length}},i(t,e){a||this.m(t,e)},o(t){a&&(g&&g._fragment.o(t),a=!1)},d(t){l(f,t),g.destroy(t)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),y(this)),this._intro=!0}function M(t,e,n){const o=Object.create(t);return o.step=e[n],o}function U(t,e){var n,o,i=e.templates[e.section.component];function a(e){var n={step:e.step};return{root:t.root,store:t.store,data:n}}if(i)var c=new i(a(e));return{c(){c&&c._fragment.c(),n=p()},m(t,e){c&&c._mount(t,e),r(t,n,e),o=!0},p(t,e){var o={};if(t.section&&(o.step=e.step),i!==(i=e.templates[e.section.component])){if(c){const t=c;t._fragment.o(()=>{t.destroy()})}i?((c=new i(a(e)))._fragment.c(),c._mount(n.parentNode,n)):c=null}else i&&c._set(o)},i(t,e){o||this.m(t,e)},o(t){o&&(c&&c._fragment.o(t),o=!1)},d(t){t&&s(n),c&&c.destroy(t)}}}function X(t){x(this,t),this._state=e({templates:{Location:O,Question:R,ContactSubmit:K}},t.data),this._intro=!!t.intro,this._fragment=function(t,e){for(var o,i,a=e.section.steps,c=[],h=0;h<a.length;h+=1)c[h]=U(t,M(e,a,h));function u(t,e,n){c[t]&&c[t].o(()=>{e&&(c[t].d(e),c[t]=null),n&&n()})}return{c(){for(var t=0;t<c.length;t+=1)c[t].c();o=p()},m(t,e){for(var n=0;n<c.length;n+=1)c[n].i(t,e);r(t,o,e),i=!0},p(e,n){if(e.templates||e.section){a=n.section.steps;for(var i=0;i<a.length;i+=1){const r=M(n,a,i);c[i]?c[i].p(e,r):(c[i]=U(t,r),c[i].c()),c[i].i(o.parentNode,o)}for(;i<c.length;i+=1)u(i,1)}},i(t,e){i||this.m(t,e)},o(t){if(!i)return;const e=n(t,(c=c.filter(Boolean)).length);for(let t=0;t<c.length;t+=1)u(t,0,e);i=!1},d(t){l(c,t),t&&s(o)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),y(this)),this._intro=!0}function Y(){return{interview:function(t){var e=C.sections.filter(t=>t.hasOwnProperty("get")&&t.preload);C.info.get&&e.push(C.info);let n=e.map(t=>t.get());return Promise.all(n).then(t=>Promise.all(t.map(t=>t.json()))).then(I(e)).then(()=>(C.sections.forEach(t=>t.steps=t.steps||[]),C))}()}}function $(t,e,n){const o=Object.create(t);return o.section=e[n],o.each_value=e,o.section_index=n,o}function tt(e,n){return{c:t,m:t,p:t,i:t,o:o,d:t}}function et(t,e){for(var o,i,a=e.data.sections,c=[],h=0;h<a.length;h+=1)c[h]=nt(t,$(e,a,h));function u(t,e,n){c[t]&&c[t].o(()=>{e&&(c[t].d(e),c[t]=null),n&&n()})}return{c(){for(var t=0;t<c.length;t+=1)c[t].c();o=p()},m(t,e){for(var n=0;n<c.length;n+=1)c[n].i(t,e);r(t,o,e),i=!0},p(e,n){if(e.interview){a=n.data.sections;for(var i=0;i<a.length;i+=1){const r=$(n,a,i);c[i]?c[i].p(e,r):(c[i]=nt(t,r),c[i].c()),c[i].i(div,o)}for(;i<c.length;i+=1)u(i,1)}},i(t,e){i||this.m(t,e)},o(t){if(!i)return;const e=n(t,(c=c.filter(Boolean)).length);for(let t=0;t<c.length;t+=1)u(t,0,e);i=!1},d(t){l(c,t),t&&s(o)}}}function nt(t,e){var n,o={},i={};void 0!==e.section&&(i.section=e.section,o.section=!0),void 0!==e.interview&&(i.interview=e.interview,o.interview=!0);var r=new X({root:t.root,store:t.store,data:i,_bind(n,i){var r={};!o.section&&n.section&&(e.each_value[e.section_index]=i.section=i.section,r.interview=e.interview),!o.interview&&n.interview&&(r.interview=i.interview),t._set(r),o={}}});return t.root._beforecreate.push(()=>{r._bind({section:1,interview:1},r.get())}),{c(){r._fragment.c()},m(t,e){r._mount(t,e),n=!0},p(t,n){e=n;var i={};!o.section&&t.interview&&(i.section=e.section,o.section=void 0!==e.section),!o.interview&&t.interview&&(i.interview=e.interview,o.interview=void 0!==e.interview),r._set(i),o={}},i(t,e){n||this.m(t,e)},o(t){n&&(r&&r._fragment.o(t),n=!1)},d(t){r.destroy(t)}}}function ot(e,n){return{c:t,m:t,p:t,i:t,o:o,d:t}}function it(t){x(this,t),this._state=e(Y(),t.data),this._intro=!!t.intro,this._fragment=function(t,o){var r,s,a,c={};let l={component:t,ctx:o,current:null,pending:ot,then:et,catch:tt,value:"data",error:"null",blocks:Array(3)};w(s=o.interview,l);var d={};void 0!==o.interview&&(d.promise=o.interview,c.promise=!0);var p=new j({root:t.root,store:t.store,slots:{default:h(),loaded:h()},data:d,_bind(e,n){var o={};!c.promise&&e.promise&&(o.interview=n.promise),t._set(o),c={}}});return t.root._beforecreate.push(()=>{p._bind({promise:1},p.get())}),{c(){r=u("div"),l.block.c(),p._fragment.c(),v(r,"slot","loaded")},m(t,e){i(p._slotted.loaded,r),l.block.i(r,l.anchor=null),l.mount=(()=>r),p._mount(t,e),a=!0},p(t,n){o=n,l.ctx=o,"interview"in t&&s!==(s=o.interview)&&w(s,l)||l.block.p(t,e(e({},o),l.resolved));var i={};!c.promise&&t.interview&&(i.promise=o.interview,c.promise=void 0!==o.interview),p._set(i),c={}},i(t,e){a||this.m(t,e)},o(t){if(!a)return;t=n(t,2);const e=n(t,3);for(let t=0;t<3;t+=1){const n=l.blocks[t];n?n.o(e):e()}p&&p._fragment.o(t),a=!1},d(t){l.block.d(),l=null,p.destroy(t)}}}(this,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),y(this)),this._intro=!0}return e(Q.prototype,q),e(Q.prototype,F),e(H.prototype,q),e(J.prototype,q),e(R.prototype,q),e(K.prototype,q),e(X.prototype,q),e(it.prototype,q),new it({target:document.body,data:{name:"world"}})}();
//# sourceMappingURL=bundle.js.map
