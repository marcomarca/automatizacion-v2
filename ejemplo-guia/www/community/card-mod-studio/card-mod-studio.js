/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$4 = globalThis, e$3 = t$4.ShadowRoot && (void 0 === t$4.ShadyCSS || t$4.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$3 = Symbol(), o$4 = /* @__PURE__ */ new WeakMap();
let n$3 = class n {
  constructor(t2, e2, o2) {
    if (this._$cssResult$ = true, o2 !== s$3) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t2, this.t = e2;
  }
  get styleSheet() {
    let t2 = this.o;
    const s2 = this.t;
    if (e$3 && void 0 === t2) {
      const e2 = void 0 !== s2 && 1 === s2.length;
      e2 && (t2 = o$4.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && o$4.set(s2, t2));
    }
    return t2;
  }
  toString() {
    return this.cssText;
  }
};
const r$4 = (t2) => new n$3("string" == typeof t2 ? t2 : t2 + "", void 0, s$3), i$6 = (t2, ...e2) => {
  const o2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s2, o3) => e3 + ((t3) => {
    if (true === t3._$cssResult$) return t3.cssText;
    if ("number" == typeof t3) return t3;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s2) + t2[o3 + 1], t2[0]);
  return new n$3(o2, t2, s$3);
}, S$1 = (s2, o2) => {
  if (e$3) s2.adoptedStyleSheets = o2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet);
  else for (const e2 of o2) {
    const o3 = document.createElement("style"), n3 = t$4.litNonce;
    void 0 !== n3 && o3.setAttribute("nonce", n3), o3.textContent = e2.cssText, s2.appendChild(o3);
  }
}, c$3 = e$3 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
  let e2 = "";
  for (const s2 of t3.cssRules) e2 += s2.cssText;
  return r$4(e2);
})(t2) : t2;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: i$5, defineProperty: e$2, getOwnPropertyDescriptor: h$2, getOwnPropertyNames: r$3, getOwnPropertySymbols: o$3, getPrototypeOf: n$2 } = Object, a$1 = globalThis, c$2 = a$1.trustedTypes, l$1 = c$2 ? c$2.emptyScript : "", p$2 = a$1.reactiveElementPolyfillSupport, d$1 = (t2, s2) => t2, u$3 = { toAttribute(t2, s2) {
  switch (s2) {
    case Boolean:
      t2 = t2 ? l$1 : null;
      break;
    case Object:
    case Array:
      t2 = null == t2 ? t2 : JSON.stringify(t2);
  }
  return t2;
}, fromAttribute(t2, s2) {
  let i4 = t2;
  switch (s2) {
    case Boolean:
      i4 = null !== t2;
      break;
    case Number:
      i4 = null === t2 ? null : Number(t2);
      break;
    case Object:
    case Array:
      try {
        i4 = JSON.parse(t2);
      } catch (t3) {
        i4 = null;
      }
  }
  return i4;
} }, f$1 = (t2, s2) => !i$5(t2, s2), b$1 = { attribute: true, type: String, converter: u$3, reflect: false, useDefault: false, hasChanged: f$1 };
Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let y$1 = class y extends HTMLElement {
  static addInitializer(t2) {
    this._$Ei(), (this.l ??= []).push(t2);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t2, s2 = b$1) {
    if (s2.state && (s2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((s2 = Object.create(s2)).wrapped = true), this.elementProperties.set(t2, s2), !s2.noAccessor) {
      const i4 = Symbol(), h2 = this.getPropertyDescriptor(t2, i4, s2);
      void 0 !== h2 && e$2(this.prototype, t2, h2);
    }
  }
  static getPropertyDescriptor(t2, s2, i4) {
    const { get: e2, set: r2 } = h$2(this.prototype, t2) ?? { get() {
      return this[s2];
    }, set(t3) {
      this[s2] = t3;
    } };
    return { get: e2, set(s3) {
      const h2 = e2?.call(this);
      r2?.call(this, s3), this.requestUpdate(t2, h2, i4);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t2) {
    return this.elementProperties.get(t2) ?? b$1;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d$1("elementProperties"))) return;
    const t2 = n$2(this);
    t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d$1("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
      const t3 = this.properties, s2 = [...r$3(t3), ...o$3(t3)];
      for (const i4 of s2) this.createProperty(i4, t3[i4]);
    }
    const t2 = this[Symbol.metadata];
    if (null !== t2) {
      const s2 = litPropertyMetadata.get(t2);
      if (void 0 !== s2) for (const [t3, i4] of s2) this.elementProperties.set(t3, i4);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t3, s2] of this.elementProperties) {
      const i4 = this._$Eu(t3, s2);
      void 0 !== i4 && this._$Eh.set(i4, t3);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s2) {
    const i4 = [];
    if (Array.isArray(s2)) {
      const e2 = new Set(s2.flat(1 / 0).reverse());
      for (const s3 of e2) i4.unshift(c$3(s3));
    } else void 0 !== s2 && i4.push(c$3(s2));
    return i4;
  }
  static _$Eu(t2, s2) {
    const i4 = s2.attribute;
    return false === i4 ? void 0 : "string" == typeof i4 ? i4 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t2) => this.enableUpdating = t2), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t2) => t2(this));
  }
  addController(t2) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t2), void 0 !== this.renderRoot && this.isConnected && t2.hostConnected?.();
  }
  removeController(t2) {
    this._$EO?.delete(t2);
  }
  _$E_() {
    const t2 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
    for (const i4 of s2.keys()) this.hasOwnProperty(i4) && (t2.set(i4, this[i4]), delete this[i4]);
    t2.size > 0 && (this._$Ep = t2);
  }
  createRenderRoot() {
    const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S$1(t2, this.constructor.elementStyles), t2;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t2) => t2.hostConnected?.());
  }
  enableUpdating(t2) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t2) => t2.hostDisconnected?.());
  }
  attributeChangedCallback(t2, s2, i4) {
    this._$AK(t2, i4);
  }
  _$ET(t2, s2) {
    const i4 = this.constructor.elementProperties.get(t2), e2 = this.constructor._$Eu(t2, i4);
    if (void 0 !== e2 && true === i4.reflect) {
      const h2 = (void 0 !== i4.converter?.toAttribute ? i4.converter : u$3).toAttribute(s2, i4.type);
      this._$Em = t2, null == h2 ? this.removeAttribute(e2) : this.setAttribute(e2, h2), this._$Em = null;
    }
  }
  _$AK(t2, s2) {
    const i4 = this.constructor, e2 = i4._$Eh.get(t2);
    if (void 0 !== e2 && this._$Em !== e2) {
      const t3 = i4.getPropertyOptions(e2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== t3.converter?.fromAttribute ? t3.converter : u$3;
      this._$Em = e2;
      const r2 = h2.fromAttribute(s2, t3.type);
      this[e2] = r2 ?? this._$Ej?.get(e2) ?? r2, this._$Em = null;
    }
  }
  requestUpdate(t2, s2, i4, e2 = false, h2) {
    if (void 0 !== t2) {
      const r2 = this.constructor;
      if (false === e2 && (h2 = this[t2]), i4 ??= r2.getPropertyOptions(t2), !((i4.hasChanged ?? f$1)(h2, s2) || i4.useDefault && i4.reflect && h2 === this._$Ej?.get(t2) && !this.hasAttribute(r2._$Eu(t2, i4)))) return;
      this.C(t2, s2, i4);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t2, s2, { useDefault: i4, reflect: e2, wrapped: h2 }, r2) {
    i4 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t2) && (this._$Ej.set(t2, r2 ?? s2 ?? this[t2]), true !== h2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i4 || (s2 = void 0), this._$AL.set(t2, s2)), true === e2 && this._$Em !== t2 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t2));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t3) {
      Promise.reject(t3);
    }
    const t2 = this.scheduleUpdate();
    return null != t2 && await t2, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t4, s3] of this._$Ep) this[t4] = s3;
        this._$Ep = void 0;
      }
      const t3 = this.constructor.elementProperties;
      if (t3.size > 0) for (const [s3, i4] of t3) {
        const { wrapped: t4 } = i4, e2 = this[s3];
        true !== t4 || this._$AL.has(s3) || void 0 === e2 || this.C(s3, void 0, i4, e2);
      }
    }
    let t2 = false;
    const s2 = this._$AL;
    try {
      t2 = this.shouldUpdate(s2), t2 ? (this.willUpdate(s2), this._$EO?.forEach((t3) => t3.hostUpdate?.()), this.update(s2)) : this._$EM();
    } catch (s3) {
      throw t2 = false, this._$EM(), s3;
    }
    t2 && this._$AE(s2);
  }
  willUpdate(t2) {
  }
  _$AE(t2) {
    this._$EO?.forEach((t3) => t3.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t2) {
    return true;
  }
  update(t2) {
    this._$Eq &&= this._$Eq.forEach((t3) => this._$ET(t3, this[t3])), this._$EM();
  }
  updated(t2) {
  }
  firstUpdated(t2) {
  }
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$2?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$3 = globalThis, i$4 = (t2) => t2, s$2 = t$3.trustedTypes, e$1 = s$2 ? s$2.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, h$1 = "$lit$", o$2 = `lit$${Math.random().toFixed(9).slice(2)}$`, n$1 = "?" + o$2, r$2 = `<${n$1}>`, l = document, c$1 = () => l.createComment(""), a = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, u$2 = Array.isArray, d = (t2) => u$2(t2) || "function" == typeof t2?.[Symbol.iterator], f = "[ 	\n\f\r]", v$1 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m$1 = />/g, p$1 = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y2 = /^(?:script|style|textarea|title)$/i, x = (t2) => (i4, ...s2) => ({ _$litType$: t2, strings: i4, values: s2 }), b = x(1), E = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), C = /* @__PURE__ */ new WeakMap(), P = l.createTreeWalker(l, 129);
function V(t2, i4) {
  if (!u$2(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e$1 ? e$1.createHTML(i4) : i4;
}
const N = (t2, i4) => {
  const s2 = t2.length - 1, e2 = [];
  let n3, l2 = 2 === i4 ? "<svg>" : 3 === i4 ? "<math>" : "", c2 = v$1;
  for (let i5 = 0; i5 < s2; i5++) {
    const s3 = t2[i5];
    let a2, u2, d2 = -1, f2 = 0;
    for (; f2 < s3.length && (c2.lastIndex = f2, u2 = c2.exec(s3), null !== u2); ) f2 = c2.lastIndex, c2 === v$1 ? "!--" === u2[1] ? c2 = _ : void 0 !== u2[1] ? c2 = m$1 : void 0 !== u2[2] ? (y2.test(u2[2]) && (n3 = RegExp("</" + u2[2], "g")), c2 = p$1) : void 0 !== u2[3] && (c2 = p$1) : c2 === p$1 ? ">" === u2[0] ? (c2 = n3 ?? v$1, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? p$1 : '"' === u2[3] ? $ : g) : c2 === $ || c2 === g ? c2 = p$1 : c2 === _ || c2 === m$1 ? c2 = v$1 : (c2 = p$1, n3 = void 0);
    const x2 = c2 === p$1 && t2[i5 + 1].startsWith("/>") ? " " : "";
    l2 += c2 === v$1 ? s3 + r$2 : d2 >= 0 ? (e2.push(a2), s3.slice(0, d2) + h$1 + s3.slice(d2) + o$2 + x2) : s3 + o$2 + (-2 === d2 ? i5 : x2);
  }
  return [V(t2, l2 + (t2[s2] || "<?>") + (2 === i4 ? "</svg>" : 3 === i4 ? "</math>" : "")), e2];
};
class S {
  constructor({ strings: t2, _$litType$: i4 }, e2) {
    let r2;
    this.parts = [];
    let l2 = 0, a2 = 0;
    const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = N(t2, i4);
    if (this.el = S.createElement(f2, e2), P.currentNode = this.el.content, 2 === i4 || 3 === i4) {
      const t3 = this.el.content.firstChild;
      t3.replaceWith(...t3.childNodes);
    }
    for (; null !== (r2 = P.nextNode()) && d2.length < u2; ) {
      if (1 === r2.nodeType) {
        if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(h$1)) {
          const i5 = v2[a2++], s2 = r2.getAttribute(t3).split(o$2), e3 = /([.?@])?(.*)/.exec(i5);
          d2.push({ type: 1, index: l2, name: e3[2], strings: s2, ctor: "." === e3[1] ? I : "?" === e3[1] ? L : "@" === e3[1] ? z : H }), r2.removeAttribute(t3);
        } else t3.startsWith(o$2) && (d2.push({ type: 6, index: l2 }), r2.removeAttribute(t3));
        if (y2.test(r2.tagName)) {
          const t3 = r2.textContent.split(o$2), i5 = t3.length - 1;
          if (i5 > 0) {
            r2.textContent = s$2 ? s$2.emptyScript : "";
            for (let s2 = 0; s2 < i5; s2++) r2.append(t3[s2], c$1()), P.nextNode(), d2.push({ type: 2, index: ++l2 });
            r2.append(t3[i5], c$1());
          }
        }
      } else if (8 === r2.nodeType) if (r2.data === n$1) d2.push({ type: 2, index: l2 });
      else {
        let t3 = -1;
        for (; -1 !== (t3 = r2.data.indexOf(o$2, t3 + 1)); ) d2.push({ type: 7, index: l2 }), t3 += o$2.length - 1;
      }
      l2++;
    }
  }
  static createElement(t2, i4) {
    const s2 = l.createElement("template");
    return s2.innerHTML = t2, s2;
  }
}
function M$1(t2, i4, s2 = t2, e2) {
  if (i4 === E) return i4;
  let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
  const o2 = a(i4) ? void 0 : i4._$litDirective$;
  return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i4 = M$1(t2, h2._$AS(t2, i4.values), h2, e2)), i4;
}
class R {
  constructor(t2, i4) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i4;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    const { el: { content: i4 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? l).importNode(i4, true);
    P.currentNode = e2;
    let h2 = P.nextNode(), o2 = 0, n3 = 0, r2 = s2[0];
    for (; void 0 !== r2; ) {
      if (o2 === r2.index) {
        let i5;
        2 === r2.type ? i5 = new k(h2, h2.nextSibling, this, t2) : 1 === r2.type ? i5 = new r2.ctor(h2, r2.name, r2.strings, this, t2) : 6 === r2.type && (i5 = new Z(h2, this, t2)), this._$AV.push(i5), r2 = s2[++n3];
      }
      o2 !== r2?.index && (h2 = P.nextNode(), o2++);
    }
    return P.currentNode = l, e2;
  }
  p(t2) {
    let i4 = 0;
    for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i4), i4 += s2.strings.length - 2) : s2._$AI(t2[i4])), i4++;
  }
}
class k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t2, i4, s2, e2) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i4, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i4 = this._$AM;
    return void 0 !== i4 && 11 === t2?.nodeType && (t2 = i4.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i4 = this) {
    t2 = M$1(this, t2, i4), a(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== E && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : d(t2) ? this.k(t2) : this._(t2);
  }
  O(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  T(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
  }
  _(t2) {
    this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(l.createTextNode(t2)), this._$AH = t2;
  }
  $(t2) {
    const { values: i4, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = S.createElement(V(s2.h, s2.h[0]), this.options)), s2);
    if (this._$AH?._$AD === e2) this._$AH.p(i4);
    else {
      const t3 = new R(e2, this), s3 = t3.u(this.options);
      t3.p(i4), this.T(s3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i4 = C.get(t2.strings);
    return void 0 === i4 && C.set(t2.strings, i4 = new S(t2)), i4;
  }
  k(t2) {
    u$2(this._$AH) || (this._$AH = [], this._$AR());
    const i4 = this._$AH;
    let s2, e2 = 0;
    for (const h2 of t2) e2 === i4.length ? i4.push(s2 = new k(this.O(c$1()), this.O(c$1()), this, this.options)) : s2 = i4[e2], s2._$AI(h2), e2++;
    e2 < i4.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i4.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, s2) {
    for (this._$AP?.(false, true, s2); t2 !== this._$AB; ) {
      const s3 = i$4(t2).nextSibling;
      i$4(t2).remove(), t2 = s3;
    }
  }
  setConnected(t2) {
    void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
  }
}
class H {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t2, i4, s2, e2, h2) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i4, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
  }
  _$AI(t2, i4 = this, s2, e2) {
    const h2 = this.strings;
    let o2 = false;
    if (void 0 === h2) t2 = M$1(this, t2, i4, 0), o2 = !a(t2) || t2 !== this._$AH && t2 !== E, o2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let n3, r2;
      for (t2 = h2[0], n3 = 0; n3 < h2.length - 1; n3++) r2 = M$1(this, e3[s2 + n3], i4, n3), r2 === E && (r2 = this._$AH[n3]), o2 ||= !a(r2) || r2 !== this._$AH[n3], r2 === A ? t2 = A : t2 !== A && (t2 += (r2 ?? "") + h2[n3 + 1]), this._$AH[n3] = r2;
    }
    o2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
  }
}
class I extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === A ? void 0 : t2;
  }
}
class L extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    this.element.toggleAttribute(this.name, !!t2 && t2 !== A);
  }
}
class z extends H {
  constructor(t2, i4, s2, e2, h2) {
    super(t2, i4, s2, e2, h2), this.type = 5;
  }
  _$AI(t2, i4 = this) {
    if ((t2 = M$1(this, t2, i4, 0) ?? A) === E) return;
    const s2 = this._$AH, e2 = t2 === A && s2 !== A || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== A && (s2 === A || e2);
    e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
  }
}
class Z {
  constructor(t2, i4, s2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i4, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    M$1(this, t2);
  }
}
const j = { I: k }, B = t$3.litHtmlPolyfillSupport;
B?.(S, k), (t$3.litHtmlVersions ??= []).push("3.3.2");
const D = (t2, i4, s2) => {
  const e2 = s2?.renderBefore ?? i4;
  let h2 = e2._$litPart$;
  if (void 0 === h2) {
    const t3 = s2?.renderBefore ?? null;
    e2._$litPart$ = h2 = new k(i4.insertBefore(c$1(), t3), t3, void 0, s2 ?? {});
  }
  return h2._$AI(t2), h2;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const s$1 = globalThis;
let i$3 = class i extends y$1 {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t2 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t2.firstChild, t2;
  }
  update(t2) {
    const r2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = D(r2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i$3._$litElement$ = true, i$3["finalized"] = true, s$1.litElementHydrateSupport?.({ LitElement: i$3 });
const o$1 = s$1.litElementPolyfillSupport;
o$1?.({ LitElement: i$3 });
(s$1.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$2 = (t2) => (e2, o2) => {
  void 0 !== o2 ? o2.addInitializer(() => {
    customElements.define(t2, e2);
  }) : customElements.define(t2, e2);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const o = { attribute: true, type: String, converter: u$3, reflect: false, hasChanged: f$1 }, r$1 = (t2 = o, e2, r2) => {
  const { kind: n3, metadata: i4 } = r2;
  let s2 = globalThis.litPropertyMetadata.get(i4);
  if (void 0 === s2 && globalThis.litPropertyMetadata.set(i4, s2 = /* @__PURE__ */ new Map()), "setter" === n3 && ((t2 = Object.create(t2)).wrapped = true), s2.set(r2.name, t2), "accessor" === n3) {
    const { name: o2 } = r2;
    return { set(r3) {
      const n4 = e2.get.call(this);
      e2.set.call(this, r3), this.requestUpdate(o2, n4, t2, true, r3);
    }, init(e3) {
      return void 0 !== e3 && this.C(o2, void 0, t2, e3), e3;
    } };
  }
  if ("setter" === n3) {
    const { name: o2 } = r2;
    return function(r3) {
      const n4 = this[o2];
      e2.call(this, r3), this.requestUpdate(o2, n4, t2, true, r3);
    };
  }
  throw Error("Unsupported decorator location: " + n3);
};
function n2(t2) {
  return (e2, o2) => "object" == typeof o2 ? r$1(t2, e2, o2) : ((t3, e3, o3) => {
    const r2 = e3.hasOwnProperty(o3);
    return e3.constructor.createProperty(o3, t3), r2 ? Object.getOwnPropertyDescriptor(e3, o3) : void 0;
  })(t2, e2, o2);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function r(r2) {
  return n2({ ...r2, state: true, attribute: false });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1 = { CHILD: 2 }, e = (t2) => (...e2) => ({ _$litDirective$: t2, values: e2 });
let i$2 = class i2 {
  constructor(t2) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t2, e2, i4) {
    this._$Ct = t2, this._$AM = e2, this._$Ci = i4;
  }
  _$AS(t2, e2) {
    return this.update(t2, e2);
  }
  update(t2, e2) {
    return this.render(...e2);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: t } = j, i$1 = (o2) => o2, s = () => document.createComment(""), v = (o2, n3, e2) => {
  const l2 = o2._$AA.parentNode, d2 = void 0 === n3 ? o2._$AB : n3._$AA;
  if (void 0 === e2) {
    const i4 = l2.insertBefore(s(), d2), n4 = l2.insertBefore(s(), d2);
    e2 = new t(i4, n4, o2, o2.options);
  } else {
    const t2 = e2._$AB.nextSibling, n4 = e2._$AM, c2 = n4 !== o2;
    if (c2) {
      let t3;
      e2._$AQ?.(o2), e2._$AM = o2, void 0 !== e2._$AP && (t3 = o2._$AU) !== n4._$AU && e2._$AP(t3);
    }
    if (t2 !== d2 || c2) {
      let o3 = e2._$AA;
      for (; o3 !== t2; ) {
        const t3 = i$1(o3).nextSibling;
        i$1(l2).insertBefore(o3, d2), o3 = t3;
      }
    }
  }
  return e2;
}, u$1 = (o2, t2, i4 = o2) => (o2._$AI(t2, i4), o2), m = {}, p = (o2, t2 = m) => o2._$AH = t2, M = (o2) => o2._$AH, h = (o2) => {
  o2._$AR(), o2._$AA.remove();
};
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const i3 = e(class extends i$2 {
  constructor() {
    super(...arguments), this.key = A;
  }
  render(r2, t2) {
    return this.key = r2, t2;
  }
  update(r2, [t2, e2]) {
    return t2 !== this.key && (p(r2), this.key = t2), e2;
  }
});
function isCardModInstalled() {
  return customElements.get("card-mod") !== void 0;
}
function isUixInstalled(hass) {
  if (customElements.get("uix-node") !== void 0) return true;
  return !!hass?.config?.components?.includes("uix");
}
const HA_CARD_EDITOR_ELEMENT = "hui-card-element-editor";
const HA_DIALOG_ELEMENT = "hui-dialog-edit-card";
function isDictForm(style) {
  return style !== void 0 && style !== null && typeof style !== "string";
}
function hasDictFormStyle(source) {
  return isDictForm(source.card_mod?.style) || isDictForm(source.uix?.style);
}
function hasStyleContent(style) {
  if (typeof style === "string") return style.trim().length > 0;
  if (style && typeof style === "object") return Object.keys(style).length > 0;
  return false;
}
function resolveStyle(source) {
  return hasStyleContent(source.uix?.style) ? source.uix.style : source.card_mod?.style;
}
function isUixOnlyStyle(config) {
  return hasStyleContent(config.uix?.style) && !hasStyleContent(config.card_mod?.style);
}
function usesUixOnlyFeaturesInBlock(uix) {
  return !!(uix?.macros || uix?.billets || uix?.theme);
}
function usesUixOnlyFeatures(config) {
  return usesUixOnlyFeaturesInBlock(config.uix);
}
function isUixOnlyRowStyle(row) {
  return !!row.entity && hasStyleContent(row.uix?.style) && !hasStyleContent(row.card_mod?.style);
}
function hasUixOnlyRow(config) {
  const rows = config.entities;
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => row && typeof row === "object" && isUixOnlyRowStyle(row));
}
const NON_STATE_CARD_TYPES = /* @__PURE__ */ new Set([
  "sensor",
  "gauge",
  "history-graph",
  "statistics-graph",
  "statistic",
  "energy-distribution",
  "energy-usage-graph",
  "calendar",
  "todo-list",
  "weather-forecast",
  "sun",
  "map",
  "media-control"
]);
const CONTAINER_CARD_TYPES = /* @__PURE__ */ new Set([
  "grid",
  "vertical-stack",
  "horizontal-stack",
  "sections",
  "conditional"
]);
const STYLABLE_CHILDREN_CARD_TYPES = /* @__PURE__ */ new Set([
  "grid",
  "vertical-stack",
  "horizontal-stack"
]);
const NO_ANIMATION_TYPES = /* @__PURE__ */ new Set([
  "gauge",
  "history-graph",
  "statistics-graph",
  "statistic",
  "energy-distribution",
  "energy-usage-graph",
  "thermostat",
  "humidifier",
  "light",
  "alarm-panel",
  "media-control",
  "weather-forecast",
  "calendar",
  "logbook",
  "activity",
  "map",
  "iframe",
  "webpage",
  "shopping-list",
  "todo-list",
  "heading",
  "picture",
  "picture-entity",
  "picture-glance",
  "picture-elements"
]);
const NO_BACKGROUND_TYPES = /* @__PURE__ */ new Set([
  "picture",
  "picture-entity",
  "picture-glance",
  "picture-elements",
  "iframe",
  "webpage",
  "map",
  // heading cards have no painted ha-card box — background has no visual effect
  // (verified empirically). See docs/CARD_SUPPORT_MATRIX.md.
  "heading"
]);
const NO_BORDER_TYPES = /* @__PURE__ */ new Set([
  "heading"
]);
const NO_ICON_COLOR_TYPES = /* @__PURE__ */ new Set([
  "gauge",
  "history-graph",
  "statistics-graph",
  "statistic",
  "energy-distribution",
  "energy-usage-graph",
  "thermostat",
  "humidifier",
  "weather-forecast",
  "calendar",
  "logbook",
  "activity",
  "markdown",
  "map",
  "iframe",
  "webpage",
  "shopping-list",
  "todo-list",
  "picture",
  "picture-entity",
  "heading",
  // glance renders its icon inside a nested <state-badge> shadow root that a
  // card-mod rule can't pierce, and the colour is applied inline from state —
  // no selector recolours it (verified empirically), so don't offer a dead
  // control. alarm-panel and media-control DO honour icon colour (plain mode)
  // and are intentionally NOT listed here.
  "glance"
]);
const ICON_SIZE_TYPES = /* @__PURE__ */ new Set([
  "tile",
  "entity",
  "sensor",
  "picture-glance"
]);
const NO_FONT_TYPES = /* @__PURE__ */ new Set([
  "heading",
  "iframe",
  "webpage",
  "map"
]);
const BINARY_DOMAINS = [
  "switch",
  "light",
  "binary_sensor",
  "input_boolean",
  "lock",
  "fan",
  "cover",
  "climate",
  "alarm_control_panel",
  "person",
  "automation",
  "script",
  "timer",
  "group",
  "input_button"
];
function isStateAware(cardType, entityId, hass) {
  if (!entityId || !hass?.states) {
    return !NON_STATE_CARD_TYPES.has(cardType ?? "");
  }
  const entity = hass.states[entityId];
  if (!entity) return !NON_STATE_CARD_TYPES.has(cardType ?? "");
  const domain = entityId.split(".")[0];
  return BINARY_DOMAINS.includes(domain) || ["on", "off"].includes(entity.state);
}
const PLACEHOLDER_PREFIX = "__CMS_J";
const PLACEHOLDER_SUFFIX = "__";
function extractJinja(css) {
  const map = /* @__PURE__ */ new Map();
  let index = 0;
  const cleaned = css.replace(/\{\{[\s\S]*?\}\}/g, (match) => {
    const key = `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`;
    map.set(key, match);
    index++;
    return key;
  });
  return { cleaned, map };
}
function restoreJinja(value, map) {
  let result = value;
  for (const [key, original] of map) {
    result = result.split(key).join(original);
  }
  return result;
}
const ENTITY_STATE_PATTERN = /^\{\{\s*'([^']*)'\s+if\s+is_state\(\s*(?:config\.entity|'([^']+)')\s*,\s*'(on|off)'\s*\)\s+else\s+'([^']*)'\s*\}\}$/;
function analyzeJinja(value) {
  const trimmed = value.trim();
  const match = trimmed.match(ENTITY_STATE_PATTERN);
  if (match) {
    const [, val1, entityId, state, val2] = match;
    if (state === "off") {
      return { hasCondition: true, offValue: val1, onValue: val2, entityId };
    }
    return { hasCondition: true, onValue: val1, offValue: val2, entityId };
  }
  if (trimmed.includes("{{")) {
    return { hasCondition: true };
  }
  return { hasCondition: false };
}
function splitIntoBlocks(css) {
  const blocks = [];
  const atBlocks = [];
  let depth = 0;
  let blockStart = -1;
  let selectorStart = 0;
  let inComment = false;
  for (let i4 = 0; i4 < css.length; i4++) {
    const ch = css[i4];
    if (inComment) {
      if (ch === "*" && css[i4 + 1] === "/") {
        inComment = false;
        i4++;
      }
      continue;
    }
    if (ch === "/" && css[i4 + 1] === "*") {
      inComment = true;
      i4++;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) {
        blockStart = i4 + 1;
      }
      depth++;
    } else if (ch === "}") {
      if (depth > 0) depth--;
      if (depth === 0 && blockStart !== -1) {
        const selector = css.slice(selectorStart, blockStart - 1).trim();
        const declarationBlock = css.slice(blockStart, i4).trim();
        if (selector && declarationBlock) {
          if (selector.startsWith("@")) {
            atBlocks.push(css.slice(selectorStart, i4 + 1).trim());
          } else {
            blocks.push({ selector, declarationBlock });
          }
        }
        selectorStart = i4 + 1;
        blockStart = -1;
      }
    }
  }
  return { blocks, atBlocks };
}
function splitDeclarations(block) {
  const out = [];
  let start = 0;
  let parens = 0;
  let quote = null;
  for (let i4 = 0; i4 < block.length; i4++) {
    const ch = block[i4];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(") {
      parens++;
    } else if (ch === ")") {
      if (parens > 0) parens--;
    } else if (ch === ";" && parens === 0) {
      out.push(block.slice(start, i4));
      start = i4 + 1;
    }
  }
  out.push(block.slice(start));
  return out;
}
function parseDeclarations(declarationBlock, jinjaMap) {
  const properties = [];
  const indexByProperty = /* @__PURE__ */ new Map();
  const declarations = splitDeclarations(declarationBlock);
  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const propertyName = trimmed.slice(0, colonIdx).trim().toLowerCase();
    let rawValue = trimmed.slice(colonIdx + 1).trim();
    const important = /\s*!important\s*$/.test(rawValue);
    rawValue = rawValue.replace(/\s*!important\s*$/, "").trim();
    if (!propertyName) continue;
    const value = restoreJinja(rawValue, jinjaMap);
    const jinjaInfo = analyzeJinja(value);
    const entry = { property: propertyName, value, ...jinjaInfo, ...important ? { important } : {} };
    const existingIndex = indexByProperty.get(propertyName);
    if (existingIndex !== void 0) {
      properties[existingIndex] = entry;
    } else {
      indexByProperty.set(propertyName, properties.length);
      properties.push(entry);
    }
  }
  return properties;
}
function coalesceBySelector(targets) {
  const order = [];
  const bySelector = /* @__PURE__ */ new Map();
  for (const target of targets) {
    const key = target.selector.trim().toLowerCase();
    const existing = bySelector.get(key);
    if (!existing) {
      order.push(key);
      bySelector.set(key, { selector: target.selector, properties: [...target.properties] });
      continue;
    }
    for (const prop of target.properties) {
      const i4 = existing.properties.findIndex((p2) => p2.property === prop.property);
      if (i4 === -1) existing.properties.push(prop);
      else existing.properties[i4] = prop;
    }
  }
  return order.map((key) => bySelector.get(key));
}
function parseCss(css) {
  return parseCssDetailed(css).targets;
}
function parseCssDetailed(css) {
  if (!css || !css.trim()) return { targets: [], passthroughCss: "" };
  const { cleaned, map } = extractJinja(css);
  const { blocks, atBlocks } = splitIntoBlocks(cleaned);
  const targets = blocks.map(({ selector, declarationBlock }) => {
    const restoredSelector = restoreJinja(selector, map);
    const properties = parseDeclarations(declarationBlock, map);
    return {
      selector: restoredSelector,
      properties
    };
  }).filter((target) => target.properties.length > 0);
  const passthroughCss = atBlocks.map((block) => restoreJinja(block, map)).filter((block) => !/^@keyframes\s+cms-/.test(block)).join("\n\n");
  return { targets: coalesceBySelector(targets), passthroughCss };
}
function parseStyleValue(style) {
  if (!style) {
    return emptyState();
  }
  if (typeof style === "string") {
    return parseStyleString(style);
  }
  if (typeof style === "object" && style !== null) {
    return parseDictStyle(style);
  }
  return emptyState();
}
function parseStyleString(css) {
  const trimmed = css.trim();
  if (!trimmed) return emptyState();
  try {
    const { targets, passthroughCss } = parseCssDetailed(trimmed);
    return { targets, rawCss: trimmed, passthroughCss };
  } catch {
    return { targets: [], rawCss: trimmed };
  }
}
function parseDictStyle(dict) {
  const targets = [];
  const rawParts = [];
  for (const [selector, declarations] of Object.entries(dict)) {
    if (typeof declarations !== "string") continue;
    const trimmedDecls = declarations.trim();
    if (!trimmedDecls) continue;
    const synthetic = `${selector} { ${trimmedDecls} }`;
    rawParts.push(synthetic);
    try {
      const parsed = parseCss(synthetic);
      targets.push(...parsed);
    } catch {
    }
  }
  return {
    targets,
    rawCss: rawParts.join("\n")
  };
}
function emptyState() {
  return { targets: [], rawCss: "" };
}
function entityRef(entityId) {
  return entityId ? `'${entityId}'` : "config.entity";
}
const KEYFRAMES = {
  pulse: `@keyframes cms-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}`,
  breathe: `@keyframes cms-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}`,
  "gradient-shift": `@keyframes cms-gradient-shift {
  0% { background-position: 0% center; }
  50% { background-position: 100% center; }
  100% { background-position: 0% center; }
}`,
  blink: `@keyframes cms-blink {
  0%, 49%, 100% { opacity: 1; }
  50%, 99% { opacity: 0.3; }
}`,
  bounce: `@keyframes cms-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}`,
  shake: `@keyframes cms-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}`,
  spin: `@keyframes cms-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
  glow: `@keyframes cms-glow {
  0%, 100% { box-shadow: 0 0 2px 0 currentColor; }
  50% { box-shadow: 0 0 12px 2px currentColor; }
}`,
  heartbeat: `@keyframes cms-heartbeat {
  0%, 28%, 70%, 100% { transform: scale(1); }
  14%, 42% { transform: scale(1.12); }
}`
};
const ANIMATION_TIMING = {
  pulse: "ease-in-out",
  breathe: "ease-in-out",
  "gradient-shift": "ease-in-out",
  blink: "ease-in-out",
  bounce: "ease-in-out",
  shake: "ease-in-out",
  spin: "linear",
  glow: "ease-in-out",
  heartbeat: "ease-in-out"
};
function conditionExpr(c2) {
  if (!c2 || c2.when === "always") return null;
  if (c2.when === "on") return `is_state(config.entity, 'on')`;
  if (c2.when === "off") return `is_state(config.entity, 'off')`;
  if (c2.when === "custom") {
    return c2.customEntity ? `is_state('${c2.customEntity}', 'on')` : null;
  }
  if (!c2.valueEntity || !c2.valueOperator || c2.valueThreshold === void 0) return null;
  const src = c2.valueAttribute ? `state_attr('${c2.valueEntity}', '${c2.valueAttribute}') | float(0)` : `states('${c2.valueEntity}') | float(0)`;
  return `${src} ${c2.valueOperator} ${c2.valueThreshold}`;
}
function filterDecls(s2) {
  if (!s2.enabled) return [];
  const decls = [];
  if (s2.grayscale) {
    const grayParts = ["grayscale(100%)"];
    const otherParts = [];
    if (s2.brightness !== 100) {
      grayParts.push(`brightness(${s2.brightness}%)`);
      otherParts.push(`brightness(${s2.brightness}%)`);
    }
    if (s2.blur > 0) {
      grayParts.push(`blur(${s2.blur}px)`);
      otherParts.push(`blur(${s2.blur}px)`);
    }
    if (s2.opacity !== void 0 && s2.opacity < 100) {
      grayParts.push(`opacity(${s2.opacity}%)`);
      otherParts.push(`opacity(${s2.opacity}%)`);
    }
    const grayVal = grayParts.join(" ");
    const otherVal = otherParts.length > 0 ? otherParts.join(" ") : "none";
    if (s2.grayscaleWhen === "always") {
      decls.push(`filter: ${grayVal};`);
    } else if (s2.grayscaleWhen === "off") {
      decls.push(
        `filter: {{ '${grayVal}' if is_state(config.entity, 'off') else '${otherVal}' }};`
      );
    } else if (s2.grayscaleWhen === "custom") {
      decls.push(
        s2.customEntity ? `filter: {{ '${grayVal}' if is_state(${entityRef(s2.customEntity)}, 'on') else '${otherVal}' }};` : `filter: ${grayVal};`
      );
    } else {
      decls.push(
        `filter: {{ '${grayVal}' if is_state(config.entity, 'on') else '${otherVal}' }};`
      );
    }
  } else {
    const parts = [];
    if (s2.brightness !== 100) parts.push(`brightness(${s2.brightness}%)`);
    if (s2.blur > 0) parts.push(`blur(${s2.blur}px)`);
    if (s2.opacity !== void 0 && s2.opacity < 100) parts.push(`opacity(${s2.opacity}%)`);
    if (parts.length > 0) {
      const cond = conditionExpr(s2.effectsWhen);
      decls.push(
        cond ? `filter: {{ '${parts.join(" ")}' if ${cond} else 'none' }};` : `filter: ${parts.join(" ")};`
      );
    }
  }
  if (decls.length > 0) {
    decls.push(`transition: filter ${s2.transitionMs}ms ease;`);
  }
  return decls;
}
function accentValue(s2) {
  return s2.mode === "conditional" ? `{{ '${s2.colorOn}' if is_state(${entityRef(s2.entityId)}, 'on') else '${s2.colorOff}' }}` : s2.color;
}
function accentAuxDecls(value, cardType) {
  if (cardType === "tile") {
    return [`--tile-color: ${value} !important;`, `--state-icon-color: ${value};`];
  }
  if (cardType === "thermostat") {
    return [
      `--state-climate-heat-color: ${value};`,
      `--state-climate-cool-color: ${value};`,
      `--state-climate-auto-color: ${value};`,
      `--state-climate-idle-color: ${value};`,
      `--control-circular-slider-color: ${value};`
    ];
  }
  if (cardType === "gauge" || cardType === "heading") return [];
  return [`--state-icon-color: ${value};`];
}
function accentColorDecls(s2, cardType) {
  if (!s2.enabled) return [];
  const value = accentValue(s2);
  return [`--accent-color: ${value};`, ...accentAuxDecls(value, cardType)];
}
function gaugeColorBlock(value, cardType, marker, opts) {
  if (cardType !== "gauge") return "";
  const markerLine = "";
  const needleLine = opts?.gaugeNeedle ? `  --primary-text-color: ${value} !important;
` : "";
  return `ha-gauge {
${markerLine}  --gauge-color: ${value} !important;
${needleLine}}`;
}
function backgroundDecls(s2) {
  if (!s2.enabled) return [];
  const bgValue = s2.type === "gradient" ? `linear-gradient(${s2.angle}deg, ${s2.color1}, ${s2.color2})` : s2.color1;
  if (s2.applyWhen === "always") return [`background: ${bgValue};`];
  if (s2.applyWhen === "custom") {
    return s2.customEntity ? [`background: {{ '${bgValue}' if is_state(${entityRef(s2.customEntity)}, 'on') else 'none' }};`] : [`background: ${bgValue};`];
  }
  const when = s2.applyWhen === "on" ? "on" : "off";
  return [
    `background: {{ '${bgValue}' if is_state(config.entity, '${when}') else 'none' }};`
  ];
}
function borderDecls(s2, skipColor = false) {
  if (!s2.enabled) return [];
  const decls = [];
  if (s2.radiusPx > 0) decls.push(`border-radius: ${s2.radiusPx}px;`);
  if (!skipColor && s2.borderWidth > 0) {
    const cond = conditionExpr(s2.widthWhen);
    if (cond) {
      const onVal = `${s2.borderWidth}px solid ${s2.borderColor}`;
      const offVal = s2.widthOffPx && s2.widthOffPx > 0 ? `${s2.widthOffPx}px solid ${s2.borderColor}` : "none";
      decls.push(`border: {{ '${onVal}' if ${cond} else '${offVal}' }};`);
    } else {
      decls.push(`border: ${s2.borderWidth}px solid ${s2.borderColor};`);
    }
  }
  return decls;
}
function animationKeyframes(s2) {
  if (!s2.enabled) return "";
  return KEYFRAMES[s2.preset] ?? "";
}
function animationDecls(s2) {
  if (!s2.enabled) return [];
  const animValue = `cms-${s2.preset} ${s2.speedS}s ${ANIMATION_TIMING[s2.preset]} infinite`;
  const decls = [];
  if (s2.preset === "gradient-shift") decls.push("background-size: 200% auto;");
  if (s2.trigger === "always") {
    decls.push(`animation: ${animValue};`);
  } else if (s2.trigger === "on") {
    decls.push(
      `animation: {{ '${animValue}' if is_state(config.entity, 'on') else 'none' }};`
    );
  } else if (s2.trigger === "off") {
    decls.push(
      `animation: {{ '${animValue}' if is_state(config.entity, 'off') else 'none' }};`
    );
  } else if (s2.trigger === "custom") {
    decls.push(
      s2.customEntity ? `animation: {{ '${animValue}' if is_state('${s2.customEntity}', 'on') else 'none' }};` : `animation: ${animValue};`
    );
  } else if (s2.trigger === "value") {
    if (s2.valueEntity && s2.valueOperator && s2.valueThreshold !== void 0) {
      const stateExpr = s2.valueAttribute ? `state_attr('${s2.valueEntity}', '${s2.valueAttribute}') | float(0)` : `states('${s2.valueEntity}') | float(0)`;
      decls.push(
        `animation: {{ '${animValue}' if ${stateExpr} ${s2.valueOperator} ${s2.valueThreshold} else 'none' }};`
      );
    } else {
      decls.push(`animation: ${animValue};`);
    }
  }
  return decls;
}
function headingStyleBlocks(s2) {
  if (!s2.enabled) return "";
  const alignMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end"
  };
  const titlePDecls = [
    `font-size: ${s2.fontSize}px;`,
    `color: ${s2.textColor} !important;`,
    `font-weight: ${FONT_WEIGHT_VALUE[s2.fontWeight ?? "normal"]};`,
    ...s2.fontFamily?.trim() ? [`font-family: ${s2.fontFamily.trim()};`] : []
  ];
  const titleP = `.title p {
${titlePDecls.map((d2) => `  ${d2}`).join("\n")}
}`;
  const iconDecls = [
    `--mdc-icon-size: ${s2.iconSize}px;`,
    `--ha-icon-size: ${s2.iconSize}px;`,
    `color: ${s2.iconColor} !important;`
  ];
  const titleIcon = `.title ha-icon {
${iconDecls.map((d2) => `  ${d2}`).join("\n")}
}`;
  const alignVal = alignMap[s2.alignment] ?? "flex-start";
  const container = `.container {
  justify-content: ${alignVal} !important;
}`;
  return [container, titleP, titleIcon].join("\n\n");
}
const FONT_WEIGHT_VALUE = {
  normal: "normal",
  medium: "500",
  bold: "bold"
};
const HEADER_TITLE_CARD_TYPES = /* @__PURE__ */ new Set([
  "entities",
  "glance",
  "history-graph",
  "statistics-graph",
  "statistic",
  "calendar",
  "todo-list",
  "shopping-list",
  "logbook",
  "picture-glance"
]);
function headerFontSize(sizePx) {
  return `calc(${sizePx}px * 1.5)`;
}
function valueFontSize(sizePx) {
  return `calc(${sizePx}px * 1.75)`;
}
function fontCompanionBlocks(cardType, size, sizePx, weight, color) {
  const blocks = [];
  if (cardType === "light") {
    blocks.push(`#info {
  font-size: ${size} !important;
}`);
    blocks.push(`.brightness {
  font-size: ${size} !important;
}`);
  }
  if (cardType === "sensor" || cardType === "entity") {
    const nameDecls = [
      `  font-size: ${size} !important;`,
      `  font-weight: ${weight} !important;`,
      ...color ? [`  color: ${color} !important;`] : []
    ];
    blocks.push(`.name {
${nameDecls.join("\n")}
}`);
    blocks.push(`.value {
  font-size: ${valueFontSize(sizePx)} !important;
}`);
    const unitDecls = [
      `  font-size: ${size} !important;`,
      ...color ? [`  color: ${color} !important;`] : []
    ];
    blocks.push(`.measurement {
${unitDecls.join("\n")}
}`);
  }
  if (cardType === "gauge" || cardType === "thermostat") {
    const titleDecls = [
      `  font-size: ${size} !important;`,
      `  font-weight: ${weight} !important;`,
      ...color ? [`  color: ${color} !important;`] : []
    ];
    blocks.push(`.title {
${titleDecls.join("\n")}
}`);
  }
  if (cardType === "entities") {
    blocks.push(`.card-header {
  font-weight: ${weight};
}`);
  }
  return blocks;
}
function fontCompanionDecls(cardType, size, sizePx, weight, color, family) {
  const decls = [];
  if (cardType === "tile") {
    decls.push(
      `--ha-tile-info-primary-font-size: ${size};`,
      `--ha-tile-info-secondary-font-size: ${size};`,
      `--ha-tile-info-primary-font-weight: ${weight};`,
      `--ha-tile-info-secondary-font-weight: ${weight};`
    );
    if (color) {
      decls.push(`--ha-tile-info-primary-color: ${color};`, `--ha-tile-info-secondary-color: ${color};`);
    }
  }
  if (cardType === "gauge" && color) {
    decls.push(`--primary-text-color: ${color};`);
  }
  if (cardType === "thermostat") {
    decls.push(`--ha-font-size-l: ${size};`, `--ha-font-weight-medium: ${weight};`);
  }
  if (HEADER_TITLE_CARD_TYPES.has(cardType ?? "")) {
    decls.push(`--ha-card-header-font-size: ${headerFontSize(sizePx)};`);
    if (color) decls.push(`--ha-card-header-color: ${color};`);
    if (family) decls.push(`--ha-card-header-font-family: ${family};`);
  }
  return decls;
}
function fontBlock(s2, cardType, skipColor = false) {
  if (!s2.enabled) return "";
  const size = `${s2.fontSize}px`;
  const weight = FONT_WEIGHT_VALUE[s2.fontWeight];
  const color = skipColor ? null : s2.color;
  const family = s2.fontFamily.trim() || null;
  const sizeImportant = cardType === "button" ? " !important" : "";
  const decls = [`font-size: ${size}${sizeImportant};`, `font-weight: ${weight};`];
  if (color) decls.push(`color: ${color};`);
  if (family) decls.push(`font-family: ${family};`);
  decls.push(...fontCompanionDecls(cardType, size, s2.fontSize, weight, color, family));
  const base = `ha-card {
${decls.map((d2) => `  ${d2}`).join("\n")}
}`;
  return [base, ...fontCompanionBlocks(cardType, size, s2.fontSize, weight, color)].join("\n\n");
}
function iconSizeValue(s2) {
  if (!s2.sizePx || s2.sizePx <= 0) return null;
  const cond = conditionExpr(s2.sizeWhen);
  if (!cond) return `${s2.sizePx}px`;
  const offPx = s2.sizeOffPx && s2.sizeOffPx > 0 ? s2.sizeOffPx : 24;
  return `{{ '${s2.sizePx}px' if ${cond} else '${offPx}px' }}`;
}
function iconSizeDecls(s2, cardType) {
  if (!s2.enabled || !cardType || cardType === "tile" || !ICON_SIZE_TYPES.has(cardType)) return [];
  const value = iconSizeValue(s2);
  return value ? [`--mdc-icon-size: ${value};`, `--ha-icon-size: ${value};`] : [];
}
function tileIconSizeBlock(s2, cardType) {
  if (!s2.enabled || cardType !== "tile") return "";
  const value = iconSizeValue(s2);
  return value ? `ha-tile-icon {
  --mdc-icon-size: ${value};
}` : "";
}
function iconColorBlock(s2) {
  if (!s2.enabled) return "";
  if (s2.mode === "plain") {
    return `ha-state-icon {
  color: ${s2.color} !important;
}`;
  }
  const ref = entityRef(s2.entityId);
  if (s2.mode === "light") {
    const jinja = `{{ 'rgb(' ~ (state_attr(${ref}, 'rgb_color') | join(', ')) ~ ')' if is_state(${ref}, 'on') and state_attr(${ref}, 'rgb_color') else '${s2.colorOff}' }}`;
    return `ha-state-icon {
  color: ${jinja} !important;
}`;
  }
  return `ha-state-icon {
  color: {{ '${s2.colorOn}' if is_state(${ref}, 'on') else '${s2.colorOff}' }} !important;
}`;
}
function sortThresholdRules(rules) {
  const firstOp = rules[0]?.operator ?? ">";
  const sorted = [...rules];
  if (firstOp === ">" || firstOp === ">=") {
    sorted.sort((a2, b2) => b2.value - a2.value);
  } else if (firstOp === "<" || firstOp === "<=") {
    sorted.sort((a2, b2) => a2.value - b2.value);
  }
  return sorted;
}
function buildThresholdJinja(rules, defaultColor, entityId, attribute) {
  const stateExpr = attribute ? `state_attr('${entityId}', '${attribute}') | float(0)` : `states('${entityId}') | float(0)`;
  const sortedRules = sortThresholdRules(rules);
  let jinja = "{{ ";
  for (let i4 = 0; i4 < sortedRules.length; i4++) {
    const rule = sortedRules[i4];
    if (i4 > 0) jinja += " else (";
    jinja += `'${rule.color}' if ${stateExpr} ${rule.operator} ${rule.value}`;
  }
  jinja += ` else '${defaultColor}'`;
  jinja += ")".repeat(sortedRules.length - 1);
  jinja += " }}";
  return jinja;
}
const GRADIENT_STEPS = 32;
const GRADIENT_MARKER_PROPERTY = "--cms-gradient-stops";
function normalizeHex(value) {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  const short = value.match(/^#([0-9a-fA-F]{3})[0-9a-fA-F]?$/);
  if (short) return `#${[...short[1]].map((c2) => c2 + c2).join("")}`;
  const long = value.match(/^#([0-9a-fA-F]{6})[0-9a-fA-F]{2}$/);
  if (long) return `#${long[1]}`;
  return "#888888";
}
function hexToRgb(hex) {
  const h2 = normalizeHex(hex).slice(1);
  return [parseInt(h2.slice(0, 2), 16), parseInt(h2.slice(2, 4), 16), parseInt(h2.slice(4, 6), 16)];
}
function rgbToHex(r2, g2, b2) {
  const clamp = (n3) => Math.max(0, Math.min(255, Math.round(n3)));
  return `#${[r2, g2, b2].map((c2) => clamp(c2).toString(16).padStart(2, "0")).join("")}`;
}
function lerpColor(c1, c2, t2) {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(r1 + (r2 - r1) * t2, g1 + (g2 - g1) * t2, b1 + (b2 - b1) * t2);
}
function colorAtValue(stops, value) {
  const sorted = [...stops].sort((a2, b2) => a2.value - b2.value);
  if (sorted.length === 0) return "#888888";
  if (sorted.length === 1) return normalizeHex(sorted[0].color);
  if (value <= sorted[0].value) return normalizeHex(sorted[0].color);
  const last = sorted[sorted.length - 1];
  if (value >= last.value) return normalizeHex(last.color);
  for (let i4 = 0; i4 < sorted.length - 1; i4++) {
    const a2 = sorted[i4];
    const b2 = sorted[i4 + 1];
    if (value >= a2.value && value <= b2.value) {
      const t2 = b2.value === a2.value ? 0 : (value - a2.value) / (b2.value - a2.value);
      return lerpColor(a2.color, b2.color, t2);
    }
  }
  return normalizeHex(last.color);
}
function gradientToRules(stops) {
  const sorted = [...stops].sort((a2, b2) => a2.value - b2.value);
  if (sorted.length < 2) return { rules: [], defaultColor: normalizeHex(sorted[0]?.color ?? "#888888") };
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  const rules = [];
  for (let i4 = 1; i4 <= GRADIENT_STEPS; i4++) {
    const value = Math.round((min + (max - min) * i4 / GRADIENT_STEPS) * 100) / 100;
    rules.push({ id: `grad-${i4}`, operator: ">=", value, color: colorAtValue(sorted, value) });
  }
  return { rules, defaultColor: normalizeHex(sorted[0].color) };
}
function encodeGradientStops(stops) {
  return stops.map((s2) => `${s2.value}:${s2.color}`).join(",");
}
function decodeGradientStops(encoded) {
  const parts = encoded.split(",").filter((p2) => p2.trim());
  if (parts.length < 2) return null;
  const stops = [];
  for (let i4 = 0; i4 < parts.length; i4++) {
    const m2 = parts[i4].trim().match(/^(-?\d+(?:\.\d+)?):(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))$/);
    if (!m2) return null;
    stops.push({ id: `stop-${i4}`, value: parseFloat(m2[1]), color: m2[2] });
  }
  return stops;
}
function thresholdPropertyBlock(property, jinja, borderWidth, gradientMarker, cardType, opts) {
  const marker = gradientMarker ? `  ${GRADIENT_MARKER_PROPERTY}: ${gradientMarker};
` : "";
  switch (property) {
    case "icon-color":
      return `ha-state-icon {
${marker}  color: ${jinja} !important;
}`;
    case "background":
      return `ha-card {
${marker}  background: ${jinja};
}`;
    case "text-color":
      return `ha-card {
${marker}  color: ${jinja};
}`;
    case "accent-color": {
      const decls = [`--accent-color: ${jinja};`, ...accentAuxDecls(jinja, cardType)].map((d2) => `  ${d2}`).join("\n");
      const haCardBlock = `ha-card {
${marker}${decls}
}`;
      const gauge = gaugeColorBlock(jinja, cardType, null, opts);
      return gauge ? `${haCardBlock}

${gauge}` : haCardBlock;
    }
    case "border-color":
      return `ha-card {
${marker}  border: ${borderWidth}px solid ${jinja};
}`;
    default:
      return "";
  }
}
function thresholdBlock(s2, cardType, opts) {
  if (!s2 || !s2.enabled || !s2.entityId || s2.properties.length === 0) return "";
  let rules = s2.rules;
  let defaultColor = s2.defaultColor;
  let gradientMarker = null;
  if (s2.valueMode === "gradient") {
    if (s2.colorStops.length < 2) return "";
    ({ rules, defaultColor } = gradientToRules(s2.colorStops));
    gradientMarker = `'${encodeGradientStops(s2.colorStops)}'`;
  } else if (rules.length === 0) {
    return "";
  }
  const jinja = buildThresholdJinja(rules, defaultColor, s2.entityId, s2.attribute || void 0);
  const CANONICAL = ["background", "text-color", "accent-color", "border-color", "icon-color"];
  const ordered = [...s2.properties].sort((a2, b2) => CANONICAL.indexOf(a2) - CANONICAL.indexOf(b2));
  return ordered.map((property) => thresholdPropertyBlock(property, jinja, s2.borderWidth ?? 2, gradientMarker, cardType, opts)).join("\n\n");
}
function generateCss(state, cardType, opts) {
  const parts = [];
  const animDecls = animationDecls(state.animation);
  const kf = animDecls.some((d2) => d2.startsWith("animation")) ? animationKeyframes(state.animation) : "";
  if (kf) parts.push(kf);
  const thresholdProps = new Set(state.threshold.enabled ? state.threshold.properties : []);
  const haCardDecls = [
    ...thresholdProps.has("accent-color") ? [] : accentColorDecls(state.accentColor, cardType),
    ...filterDecls(state.filter),
    ...thresholdProps.has("background") ? [] : backgroundDecls(state.background),
    ...borderDecls(state.border, thresholdProps.has("border-color")),
    ...animDecls,
    ...iconSizeDecls(state.iconColor, cardType)
  ];
  if (haCardDecls.length > 0) {
    const body = haCardDecls.map((d2) => `  ${d2}`).join("\n");
    parts.push(`ha-card {
${body}
}`);
  }
  if (!thresholdProps.has("accent-color") && state.accentColor.enabled) {
    const gauge = gaugeColorBlock(accentValue(state.accentColor), cardType, null, opts);
    if (gauge) parts.push(gauge);
  }
  const iconColor = thresholdProps.has("icon-color") ? "" : iconColorBlock(state.iconColor);
  if (iconColor) parts.push(iconColor);
  const tileIconSize = tileIconSizeBlock(state.iconColor, cardType);
  if (tileIconSize) parts.push(tileIconSize);
  const threshold = thresholdBlock(state.threshold, cardType, opts);
  if (threshold) parts.push(threshold);
  const headingStyle = headingStyleBlocks(state.headingStyle);
  if (headingStyle) parts.push(headingStyle);
  const font = fontBlock(state.font, cardType, thresholdProps.has("text-color"));
  if (font) parts.push(font);
  if (state.advanced.rawCss.trim()) {
    parts.push(state.advanced.rawCss.trim());
  }
  return parts.join("\n\n");
}
const DEFAULT_FILTER = {
  enabled: false,
  grayscale: false,
  grayscaleWhen: "off",
  brightness: 100,
  blur: 0,
  transitionMs: 300
};
const DEFAULT_ICON_COLOR = {
  enabled: false,
  mode: "conditional",
  color: "#2196F3",
  colorOn: "#2196F3",
  colorOff: "#6b6b6b"
};
const DEFAULT_ACCENT_COLOR = {
  enabled: false,
  mode: "plain",
  color: "#03a9f4",
  colorOn: "#03a9f4",
  colorOff: "#6b6b6b"
};
const DEFAULT_BACKGROUND = {
  enabled: false,
  type: "solid",
  color1: "#03a9f4",
  color2: "#ff8c00",
  angle: 135,
  applyWhen: "always"
};
const DEFAULT_ANIMATION = {
  enabled: false,
  preset: "pulse",
  speedS: 2,
  trigger: "always",
  customEntity: void 0,
  // trigger === 'value' fields — undefined until that trigger is used, so
  // spreads/toEqual comparisons of older states keep working unchanged.
  valueEntity: void 0,
  valueAttribute: void 0,
  valueOperator: void 0,
  valueThreshold: void 0
};
const DEFAULT_BORDER = {
  enabled: false,
  radiusPx: 12,
  borderWidth: 0,
  borderColor: "#03a9f4"
};
const DEFAULT_HEADING_STYLE = {
  enabled: false,
  fontSize: 24,
  textColor: "#e1e1e1",
  fontWeight: "normal",
  fontFamily: "",
  iconSize: 24,
  iconColor: "#e1e1e1",
  alignment: "left"
};
const DEFAULT_FONT = {
  enabled: false,
  fontSize: 16,
  fontFamily: "",
  fontWeight: "normal",
  color: "#e1e1e1"
};
const DEFAULT_THRESHOLD = {
  enabled: false,
  entityId: "",
  attribute: "",
  properties: ["icon-color"],
  valueMode: "switch",
  rules: [],
  defaultColor: "#888888",
  colorStops: [
    { id: "stop-0", value: 0, color: "#9e9e9e" },
    { id: "stop-1", value: 100, color: "#f44336" }
  ]
};
function migrateStudioState(raw) {
  const r2 = raw && typeof raw === "object" ? raw : {};
  const threshold = { ...DEFAULT_THRESHOLD, ...r2.threshold ?? {} };
  if (!Array.isArray(threshold.properties) || threshold.properties.length === 0) {
    const legacy = threshold["property"];
    threshold.properties = typeof legacy === "string" ? [legacy] : [...DEFAULT_THRESHOLD.properties];
  }
  delete threshold["property"];
  if (threshold.valueMode !== "gradient") threshold.valueMode = "switch";
  if (!Array.isArray(threshold.rules)) threshold.rules = [];
  if (!Array.isArray(threshold.colorStops) || threshold.colorStops.length === 0) {
    threshold.colorStops = DEFAULT_THRESHOLD.colorStops.map((s2) => ({ ...s2 }));
  }
  const accentColor = { ...DEFAULT_ACCENT_COLOR, ...r2.accentColor ?? {} };
  if (accentColor.mode !== "conditional") accentColor.mode = "plain";
  return {
    filter: { ...DEFAULT_FILTER, ...r2.filter ?? {} },
    iconColor: { ...DEFAULT_ICON_COLOR, ...r2.iconColor ?? {} },
    accentColor,
    background: { ...DEFAULT_BACKGROUND, ...r2.background ?? {} },
    animation: { ...DEFAULT_ANIMATION, ...r2.animation ?? {} },
    border: { ...DEFAULT_BORDER, ...r2.border ?? {} },
    headingStyle: { ...DEFAULT_HEADING_STYLE, ...r2.headingStyle ?? {} },
    font: { ...DEFAULT_FONT, ...r2.font ?? {} },
    threshold,
    advanced: { rawCss: typeof r2.advanced?.rawCss === "string" ? r2.advanced.rawCss : "" }
  };
}
function claimKey(selector, property) {
  return `${selector.trim().toLowerCase()}::${property.trim().toLowerCase()}`;
}
const ACCENT_AUX_VARS = [
  "--tile-color",
  "--state-icon-color",
  "--paper-item-icon-active-color",
  "--state-climate-heat-color",
  "--state-climate-cool-color",
  "--state-climate-auto-color",
  "--state-climate-idle-color",
  "--control-circular-slider-color"
];
function claimAccentAux(haCard, haGauge, value, claimed) {
  if (haCard) {
    for (const aux of ACCENT_AUX_VARS) {
      const prop = findProp(haCard, aux);
      if (prop && prop.value.trim() === value) claimed.add(claimKey(haCard.selector, aux));
    }
  }
  if (haGauge) {
    for (const aux of ["--gauge-color", "--primary-text-color"]) {
      const prop = findProp(haGauge, aux);
      if (prop && prop.value.trim() === value) claimed.add(claimKey(haGauge.selector, aux));
    }
  }
}
const COND_TERNARY_PATTERN = /^\{\{\s*'([^']*)'\s+if\s+(.+?)\s+else\s+'([^']*)'\s*\}\}$/;
const COND_ON_OFF_PATTERN = /^is_state\(config\.entity,\s*'(on|off)'\)$/;
const COND_CUSTOM_PATTERN = /^is_state\('([^']+)',\s*'on'\)$/;
const COND_VALUE_PATTERN = /^(?:states\('([^']+)'\)|state_attr\('([^']+)',\s*'([^']+)'\))\s*\|\s*float\(0\)\s*(>=|<=|>|<|==|!=)\s*(-?[\d.]+)$/;
function parseConditionExpr(cond) {
  const trimmed = cond.trim();
  const onOff = trimmed.match(COND_ON_OFF_PATTERN);
  if (onOff) return { when: onOff[1] };
  const custom = trimmed.match(COND_CUSTOM_PATTERN);
  if (custom) return { when: "custom", customEntity: custom[1] };
  const value = trimmed.match(COND_VALUE_PATTERN);
  if (value) {
    const [, stateEntity, attrEntity, attrName, operator, numStr] = value;
    return {
      when: "value",
      valueEntity: stateEntity ?? attrEntity,
      ...attrName ? { valueAttribute: attrName } : {},
      valueOperator: operator,
      valueThreshold: parseFloat(numStr)
    };
  }
  return null;
}
function parseCondTernary(value) {
  const match = value.trim().match(COND_TERNARY_PATTERN);
  if (!match) return null;
  const condition = parseConditionExpr(match[2]);
  if (!condition) return null;
  return { onValue: match[1], offValue: match[3], condition };
}
const ANIM_PATTERN = /^cms-(pulse|breathe|gradient-shift|blink|bounce|shake|spin|glow|heartbeat)\s+([\d.]+)s\s+(ease-in-out|linear)\s+infinite$/;
const ANIM_VALUE_TRIGGER_PATTERN = /^\{\{\s*'([^']+)'\s+if\s+(?:states\('([^']+)'\)|state_attr\('([^']+)',\s*'([^']+)'\))\s*\|\s*float\(0\)\s*(>=|<=|>|<|==|!=)\s*(-?[\d.]+)\s+else\s+'none'\s*\}\}$/;
function parseAnimValue(value) {
  const match = value.match(ANIM_PATTERN);
  if (!match) return null;
  const preset = match[1];
  if (match[3] !== ANIMATION_TIMING[preset]) return null;
  return { preset, speedS: parseFloat(match[2]) };
}
function mapAnimation(haCard, claimed) {
  if (!haCard) return { ...DEFAULT_ANIMATION };
  const animProp = findProp(haCard, "animation");
  if (!animProp) return { ...DEFAULT_ANIMATION };
  const claimCompanions = () => {
    claimed.add(claimKey(haCard.selector, "animation"));
    const bgSize = findProp(haCard, "background-size");
    if (bgSize && bgSize.value.trim() === "200% auto") {
      claimed.add(claimKey(haCard.selector, "background-size"));
    }
  };
  if (!animProp.hasCondition) {
    const parsed = parseAnimValue(animProp.value);
    if (parsed) {
      claimCompanions();
      return { enabled: true, ...parsed, trigger: "always" };
    }
  } else if (animProp.onValue || animProp.offValue) {
    const onValue = animProp.onValue?.trim() || "";
    const offValue = animProp.offValue?.trim() || "";
    const onParsed = parseAnimValue(onValue);
    const parsed = onParsed ?? parseAnimValue(offValue);
    if (parsed) {
      if (animProp.entityId && !onParsed) return { ...DEFAULT_ANIMATION };
      claimCompanions();
      const base = { enabled: true, ...parsed };
      if (animProp.entityId && onParsed) {
        return { ...base, trigger: "custom", customEntity: animProp.entityId };
      }
      return { ...base, trigger: onParsed ? "on" : "off" };
    }
  } else {
    const match = animProp.value.trim().match(ANIM_VALUE_TRIGGER_PATTERN);
    if (match) {
      const [, animValue, stateEntity, attrEntity, attrName, operator, numStr] = match;
      const parsed = parseAnimValue(animValue);
      if (parsed) {
        claimCompanions();
        return {
          enabled: true,
          ...parsed,
          trigger: "value",
          valueEntity: stateEntity ?? attrEntity,
          ...attrName ? { valueAttribute: attrName } : {},
          valueOperator: operator,
          valueThreshold: parseFloat(numStr)
        };
      }
    }
  }
  return { ...DEFAULT_ANIMATION };
}
function mapToStudioState(parsed, cardType) {
  const haCard = findTarget(parsed.targets, "ha-card");
  const haStateIcon = findTarget(parsed.targets, "ha-state-icon");
  const haIcon = findTarget(parsed.targets, "ha-icon");
  const hostTarget = findTarget(parsed.targets, ":host");
  const haGauge = findTarget(parsed.targets, "ha-gauge");
  const haTileIcon = findTarget(parsed.targets, "ha-tile-icon");
  const titleP = findTarget(parsed.targets, ".title p");
  const titleIcon = findTarget(parsed.targets, ".title ha-icon");
  const container = findTarget(parsed.targets, ".container");
  const claimed = /* @__PURE__ */ new Set();
  return {
    filter: mapFilter(haCard, claimed),
    iconColor: mapIconColor(haStateIcon, haIcon, haCard, hostTarget, haTileIcon, cardType, claimed),
    accentColor: mapAccentColor(haCard, haGauge, claimed),
    background: mapBackground(haCard, claimed),
    animation: mapAnimation(haCard, claimed),
    border: mapBorder(haCard, claimed),
    headingStyle: mapHeadingStyle(titleP, titleIcon, container, claimed),
    font: mapFont(parsed.targets, haCard, claimed),
    threshold: mapThreshold(haCard, haStateIcon, haGauge, hostTarget, cardType, claimed),
    advanced: mapAdvanced(parsed, claimed)
  };
}
function mergeStudioStates(primary, secondary) {
  return {
    filter: primary.filter.enabled ? primary.filter : secondary.filter,
    iconColor: primary.iconColor.enabled ? primary.iconColor : secondary.iconColor,
    accentColor: primary.accentColor.enabled ? primary.accentColor : secondary.accentColor,
    background: primary.background.enabled ? primary.background : secondary.background,
    animation: primary.animation.enabled ? primary.animation : secondary.animation,
    border: primary.border.enabled ? primary.border : secondary.border,
    headingStyle: primary.headingStyle.enabled ? primary.headingStyle : secondary.headingStyle,
    font: primary.font.enabled ? primary.font : secondary.font,
    threshold: primary.threshold.enabled ? primary.threshold : secondary.threshold,
    advanced: { rawCss: mergeRawCss(primary.advanced.rawCss, secondary.advanced.rawCss) }
  };
}
function mergeRawCss(primary, secondary) {
  const p2 = primary.trim();
  const s2 = secondary.trim();
  if (!p2) return s2;
  if (!s2 || s2 === p2) return p2;
  return `${s2}

${p2}`;
}
function findTarget(targets, selector) {
  const norm = selector.trim().toLowerCase();
  return targets.find((t2) => t2.selector.trim().toLowerCase() === norm) ?? null;
}
function findProp(target, property) {
  const norm = property.trim().toLowerCase();
  return target.properties.find((p2) => p2.property === norm) ?? null;
}
function parseEffectParts(value, allowEmpty) {
  if (value === "") return allowEmpty ? {} : null;
  const match = value.match(
    /^(?:brightness\((\d+(?:\.\d+)?)%\))?\s*(?:blur\((\d+(?:\.\d+)?)px\))?\s*(?:opacity\((\d+(?:\.\d+)?)%\))?$/
  );
  if (!match || match[1] === void 0 && match[2] === void 0 && match[3] === void 0) {
    return null;
  }
  return {
    ...match[1] !== void 0 ? { brightness: parseFloat(match[1]) } : {},
    ...match[2] !== void 0 ? { blur: parseFloat(match[2]) } : {},
    ...match[3] !== void 0 ? { opacity: parseFloat(match[3]) } : {}
  };
}
function mapFilter(haCard, claimed) {
  if (!haCard) return { ...DEFAULT_FILTER };
  const filterProp = findProp(haCard, "filter");
  const transitionProp = findProp(haCard, "transition");
  const state = { ...DEFAULT_FILTER };
  let filterClaimed = false;
  if (filterProp) {
    if (filterProp.hasCondition) {
      const offHasGrayscale = filterProp.offValue?.trim().startsWith("grayscale(");
      const onHasGrayscale = filterProp.onValue?.trim().startsWith("grayscale(");
      const customEntity = filterProp.entityId;
      const grayRemainder = (branch) => (branch ?? "").replace(/^grayscale\(100%\)\s*/, "").trim();
      const matchesOther = (grayBranch, other) => {
        if (!grayBranch?.trim().startsWith("grayscale(100%)")) return false;
        const remainder = grayRemainder(grayBranch);
        if (other?.trim() === "none") return remainder.length === 0;
        if (!other) return false;
        return remainder.length > 0 && other.trim() === remainder;
      };
      if (offHasGrayscale && matchesOther(filterProp.offValue, filterProp.onValue)) {
        if (!customEntity) {
          state.enabled = true;
          state.grayscale = true;
          state.grayscaleWhen = "off";
          filterClaimed = true;
        }
      } else if (onHasGrayscale && matchesOther(filterProp.onValue, filterProp.offValue)) {
        state.enabled = true;
        state.grayscale = true;
        if (customEntity) {
          state.grayscaleWhen = "custom";
          state.customEntity = customEntity;
        } else {
          state.grayscaleWhen = "on";
        }
        filterClaimed = true;
      }
      if (filterClaimed) {
        const source = (offHasGrayscale ? filterProp.offValue : filterProp.onValue) ?? filterProp.value;
        const parts = parseEffectParts(grayRemainder(source), true);
        if (parts) {
          if (parts.brightness !== void 0) state.brightness = parts.brightness;
          if (parts.blur !== void 0) state.blur = parts.blur;
          if (parts.opacity !== void 0) state.opacity = parts.opacity;
        } else {
          state.enabled = false;
          state.grayscale = false;
          state.grayscaleWhen = DEFAULT_FILTER.grayscaleWhen;
          delete state.customEntity;
          filterClaimed = false;
        }
      } else {
        const ternary = parseCondTernary(filterProp.value);
        const parts = ternary && ternary.offValue === "none" ? parseEffectParts(ternary.onValue, false) : null;
        if (ternary && parts) {
          state.enabled = true;
          if (parts.brightness !== void 0) state.brightness = parts.brightness;
          if (parts.blur !== void 0) state.blur = parts.blur;
          if (parts.opacity !== void 0) state.opacity = parts.opacity;
          state.effectsWhen = ternary.condition;
          filterClaimed = true;
        }
      }
    } else {
      const val = filterProp.value.trim();
      const grayscale = val.startsWith("grayscale(100%)");
      if (!grayscale && val.startsWith("grayscale(")) ;
      else {
        const rest = grayscale ? val.replace(/^grayscale\(100%\)\s*/, "").trim() : val;
        const parts = parseEffectParts(rest, true);
        const emittable = parts?.brightness !== void 0 && parts.brightness !== 100 || parts?.blur !== void 0 && parts.blur > 0 || parts?.opacity !== void 0 && parts.opacity < 100;
        if (parts && (grayscale || emittable)) {
          state.enabled = true;
          if (grayscale) {
            state.grayscale = true;
            state.grayscaleWhen = "always";
          }
          if (parts.brightness !== void 0) state.brightness = parts.brightness;
          if (parts.blur !== void 0) state.blur = parts.blur;
          if (parts.opacity !== void 0) state.opacity = parts.opacity;
          filterClaimed = true;
        }
      }
    }
    if (filterClaimed) claimed.add(claimKey(haCard.selector, "filter"));
  }
  if (transitionProp && state.enabled) {
    if (/^filter[\s,]/.test(transitionProp.value.trim())) {
      const msMatch = transitionProp.value.match(/(\d+)ms/);
      const sMatch = transitionProp.value.match(/(\d*\.?\d+)s(?:\s|$|,)/);
      if (msMatch) {
        state.transitionMs = parseInt(msMatch[1], 10);
        claimed.add(claimKey(haCard.selector, "transition"));
      } else if (sMatch) {
        state.transitionMs = Math.round(parseFloat(sMatch[1]) * 1e3);
        claimed.add(claimKey(haCard.selector, "transition"));
      }
    }
  }
  return state;
}
function iconAdoptionAllowed(cardType) {
  if (!cardType) return false;
  if (cardType === "entities") return false;
  return !NO_ICON_COLOR_TYPES.has(cardType);
}
function mapIconColor(haStateIcon, haIcon, haCard, hostTarget, haTileIcon, cardType, claimed) {
  const state = mapIconColorCore(haStateIcon, haIcon, haCard, hostTarget, cardType, claimed);
  if (!state.enabled) {
    const colorProp = haStateIcon ? findProp(haStateIcon, "color") : void 0;
    const thresholdShaped = !!colorProp && colorProp.hasCondition && !colorProp.onValue && !colorProp.offValue;
    if (!thresholdShaped) return state;
    applyIconSize(state, haCard, haTileIcon, cardType, claimed);
    if (state.sizePx !== void 0 && state.sizePx > 0) state.enabled = true;
    return state;
  }
  return applyIconSize(state, haCard, haTileIcon, cardType, claimed);
}
function applyIconSize(state, haCard, haTileIcon, cardType, claimed) {
  const applySize = (raw) => {
    const staticMatch = raw.trim().match(/^(\d+(?:\.\d+)?)px$/);
    if (staticMatch) {
      state.sizePx = parseFloat(staticMatch[1]);
      return true;
    }
    const ternary = parseCondTernary(raw.trim());
    const on = ternary?.onValue.match(/^(\d+(?:\.\d+)?)px$/);
    const off = ternary?.offValue.match(/^(\d+(?:\.\d+)?)px$/);
    if (!ternary || !on || !off) return false;
    state.sizePx = parseFloat(on[1]);
    const offPx = parseFloat(off[1]);
    if (offPx !== 24) state.sizeOffPx = offPx;
    state.sizeWhen = ternary.condition;
    return true;
  };
  if (cardType === "tile") {
    const tileMdc = haTileIcon ? findProp(haTileIcon, "--mdc-icon-size") : void 0;
    if (haTileIcon && tileMdc && applySize(tileMdc.value)) {
      claimed.add(claimKey(haTileIcon.selector, "--mdc-icon-size"));
    }
  } else if (cardType && ICON_SIZE_TYPES.has(cardType) && haCard) {
    const mdc = findProp(haCard, "--mdc-icon-size");
    const haSize = findProp(haCard, "--ha-icon-size");
    if (mdc && haSize && mdc.value.trim() === haSize.value.trim() && applySize(mdc.value)) {
      claimed.add(claimKey(haCard.selector, "--mdc-icon-size"));
      claimed.add(claimKey(haCard.selector, "--ha-icon-size"));
    }
  }
  return state;
}
function mapIconColorCore(haStateIcon, haIcon, haCard, hostTarget, cardType, claimed) {
  if (!haStateIcon || !findProp(haStateIcon, "color")) {
    if (iconAdoptionAllowed(cardType)) {
      if (haIcon) {
        const adopted = mapIconColorCore(haIcon, null, null, null, cardType, claimed);
        if (adopted.enabled) return adopted;
      }
      for (const target of [haCard, hostTarget]) {
        if (!target) continue;
        const accentProp = haCard ? findProp(haCard, "--accent-color") : void 0;
        for (const varName of ["--state-icon-color", "--paper-item-icon-color"]) {
          const prop = findProp(target, varName);
          if (!prop) continue;
          if (accentProp && accentProp.value.trim() === prop.value.trim()) continue;
          const adopted = mapIconColorCore(
            { selector: target.selector, properties: [{ ...prop, property: "color" }] },
            null,
            null,
            null,
            cardType,
            /* @__PURE__ */ new Set()
          );
          if (adopted.enabled) {
            claimed.add(claimKey(target.selector, varName));
            return adopted;
          }
        }
      }
    }
    return { ...DEFAULT_ICON_COLOR };
  }
  const colorProp = findProp(haStateIcon, "color");
  if (!colorProp) return { ...DEFAULT_ICON_COLOR };
  if (colorProp.hasCondition && colorProp.value.includes("rgb_color")) {
    claimed.add(claimKey(haStateIcon.selector, "color"));
    const fallbackMatch = colorProp.value.match(/else\s+'([^']+)'/);
    const colorOff = fallbackMatch ? fallbackMatch[1] : DEFAULT_ICON_COLOR.colorOff;
    const entityMatch = colorProp.value.match(/is_state\(\s*'([^']+)'\s*,/);
    return {
      enabled: true,
      mode: "light",
      color: colorOff,
      colorOn: colorOff,
      colorOff,
      ...entityMatch ? { entityId: entityMatch[1] } : {}
    };
  }
  if (colorProp.hasCondition && colorProp.onValue && colorProp.offValue) {
    claimed.add(claimKey(haStateIcon.selector, "color"));
    return {
      enabled: true,
      mode: "conditional",
      color: colorProp.onValue,
      colorOn: colorProp.onValue,
      colorOff: colorProp.offValue,
      ...colorProp.entityId ? { entityId: colorProp.entityId } : {}
    };
  }
  if (!colorProp.hasCondition && colorProp.value.trim()) {
    claimed.add(claimKey(haStateIcon.selector, "color"));
    return {
      enabled: true,
      mode: "plain",
      color: colorProp.value.trim(),
      colorOn: colorProp.value.trim(),
      colorOff: DEFAULT_ICON_COLOR.colorOff
    };
  }
  return { ...DEFAULT_ICON_COLOR };
}
function mapAccentColor(haCard, haGauge, claimed) {
  if (!haCard) return { ...DEFAULT_ACCENT_COLOR };
  const prop = findProp(haCard, "--accent-color");
  if (!prop) return { ...DEFAULT_ACCENT_COLOR };
  if (prop.hasCondition) {
    if (prop.onValue && prop.offValue) {
      claimed.add(claimKey(haCard.selector, "--accent-color"));
      claimAccentAux(haCard, haGauge, prop.value.trim(), claimed);
      return {
        ...DEFAULT_ACCENT_COLOR,
        enabled: true,
        mode: "conditional",
        colorOn: prop.onValue,
        colorOff: prop.offValue,
        ...prop.entityId ? { entityId: prop.entityId } : {}
      };
    }
    return { ...DEFAULT_ACCENT_COLOR };
  }
  const value = prop.value.trim();
  if (!value) return { ...DEFAULT_ACCENT_COLOR };
  claimed.add(claimKey(haCard.selector, "--accent-color"));
  claimAccentAux(haCard, haGauge, value, claimed);
  return { ...DEFAULT_ACCENT_COLOR, enabled: true, mode: "plain", color: value };
}
function parseLinearGradient(value) {
  const m2 = value.trim().match(/^linear-gradient\(\s*(\d+)deg\s*,([\s\S]+)\)$/i);
  if (!m2) return null;
  const body = m2[2];
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i4 = 0; i4 < body.length; i4++) {
    const ch = body[i4];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(body.slice(start, i4));
      start = i4 + 1;
    }
  }
  parts.push(body.slice(start));
  if (parts.length !== 2) return null;
  const color1 = parts[0].trim();
  const color2 = parts[1].trim();
  if (!color1 || !color2) return null;
  return { angle: parseInt(m2[1], 10), color1, color2 };
}
function mapBackground(haCard, claimed) {
  if (!haCard) return { ...DEFAULT_BACKGROUND };
  let bgProp = findProp(haCard, "background");
  if (!bgProp) {
    const bgColorProp = findProp(haCard, "background-color");
    const otherBgLonghands = haCard.properties.some(
      (p2) => p2.property.startsWith("background-") && p2.property !== "background-color"
    );
    if (bgColorProp && !bgColorProp.hasCondition && bgColorProp.value.trim() && !otherBgLonghands) {
      claimed.add(claimKey(haCard.selector, "background-color"));
      return {
        ...DEFAULT_BACKGROUND,
        enabled: true,
        type: "solid",
        color1: bgColorProp.value.trim(),
        applyWhen: "always"
      };
    }
    return { ...DEFAULT_BACKGROUND };
  }
  if (bgProp.hasCondition && bgProp.onValue !== void 0 && bgProp.offValue !== void 0) {
    const onVal = bgProp.onValue.trim();
    const offVal = bgProp.offValue.trim();
    let applyWhen = null;
    let colorVal = "";
    if (offVal === "none" && onVal && onVal !== "none") {
      applyWhen = bgProp.entityId ? "custom" : "on";
      colorVal = onVal;
    } else if (onVal === "none" && offVal && offVal !== "none") {
      if (bgProp.entityId) return { ...DEFAULT_BACKGROUND };
      applyWhen = "off";
      colorVal = offVal;
    }
    if (applyWhen && colorVal) {
      claimed.add(claimKey(haCard.selector, "background"));
      const customEntity = applyWhen === "custom" ? { customEntity: bgProp.entityId } : {};
      const gradient2 = parseLinearGradient(colorVal);
      if (gradient2) {
        return {
          enabled: true,
          type: "gradient",
          color1: gradient2.color1,
          color2: gradient2.color2,
          angle: gradient2.angle,
          applyWhen,
          ...customEntity
        };
      }
      return { ...DEFAULT_BACKGROUND, enabled: true, type: "solid", color1: colorVal, applyWhen, ...customEntity };
    }
    return { ...DEFAULT_BACKGROUND };
  }
  if (bgProp.hasCondition) return { ...DEFAULT_BACKGROUND };
  const value = bgProp.value.trim();
  const gradient = parseLinearGradient(value);
  if (gradient) {
    claimed.add(claimKey(haCard.selector, "background"));
    return {
      enabled: true,
      type: "gradient",
      color1: gradient.color1,
      color2: gradient.color2,
      angle: gradient.angle,
      applyWhen: "always"
    };
  }
  if (value && !value.includes("url(") && !value.includes("{{")) {
    claimed.add(claimKey(haCard.selector, "background"));
    return { ...DEFAULT_BACKGROUND, enabled: true, type: "solid", color1: value };
  }
  return { ...DEFAULT_BACKGROUND };
}
function mapBorder(haCard, claimed) {
  if (!haCard) return { ...DEFAULT_BORDER };
  const radiusProp = findProp(haCard, "border-radius");
  const borderProp = findProp(haCard, "border");
  const state = { ...DEFAULT_BORDER };
  if (radiusProp && !radiusProp.hasCondition) {
    const match = radiusProp.value.match(/^(\d+(?:\.\d+)?)px$/);
    if (match) {
      state.enabled = true;
      state.radiusPx = parseFloat(match[1]);
      claimed.add(claimKey(haCard.selector, "border-radius"));
    }
  }
  if (borderProp && !borderProp.hasCondition) {
    const match = borderProp.value.match(
      /^(\d+)px\s+(solid|dashed|dotted|double|groove|ridge|inset|outset|none)\s+(#[0-9a-fA-F]{3,8}|var\(--[\w-]+\)|rgba?\([\d\s.,%]+\)|[a-zA-Z]+)$/i
    );
    if (match) {
      state.enabled = true;
      state.borderWidth = parseInt(match[1], 10);
      state.borderColor = match[3];
      claimed.add(claimKey(haCard.selector, "border"));
      if (!radiusProp) state.radiusPx = 0;
    }
  } else if (borderProp) {
    const ternary = parseCondTernary(borderProp.value);
    if (ternary) {
      const BRANCH = /^(\d+)px\s+solid\s+(#[0-9a-fA-F]{3,8}|var\(--[\w-]+\)|rgba?\([\d\s.,%]+\)|[a-zA-Z]+)$/i;
      const on = ternary.onValue.match(BRANCH);
      const off = ternary.offValue === "none" ? "none" : ternary.offValue.match(BRANCH);
      const colorsMatch = off === "none" || off !== null && on !== null && off[2] === on[2];
      if (on && off !== null && colorsMatch) {
        state.enabled = true;
        state.borderWidth = parseInt(on[1], 10);
        state.borderColor = on[2];
        state.widthWhen = ternary.condition;
        if (off !== "none") state.widthOffPx = parseInt(off[1], 10);
        claimed.add(claimKey(haCard.selector, "border"));
        if (!radiusProp) state.radiusPx = 0;
      }
    }
  }
  return state;
}
const JUSTIFY_TO_ALIGN = {
  "flex-start": "left",
  center: "center",
  "flex-end": "right"
};
const TEXT_ALIGN_MAP = {
  left: "left",
  center: "center",
  right: "right"
};
function mapHeadingStyle(titleP, titleIcon, container, claimed) {
  if (!titleP && !titleIcon && !container) return { ...DEFAULT_HEADING_STYLE };
  const state = { ...DEFAULT_HEADING_STYLE };
  if (titleP) {
    const fontSizeProp = findProp(titleP, "font-size");
    if (fontSizeProp && !fontSizeProp.hasCondition) {
      const m2 = fontSizeProp.value.match(/^(\d+(?:\.\d+)?)px$/);
      if (m2) {
        state.enabled = true;
        state.fontSize = parseFloat(m2[1]);
        claimed.add(claimKey(titleP.selector, "font-size"));
      }
    }
    const colorProp = findProp(titleP, "color");
    if (colorProp && !colorProp.hasCondition && colorProp.value.trim()) {
      state.enabled = true;
      state.textColor = colorProp.value.trim();
      claimed.add(claimKey(titleP.selector, "color"));
    }
    const weightProp = findProp(titleP, "font-weight");
    if (weightProp && !weightProp.hasCondition && FONT_WEIGHT_FROM_VALUE[weightProp.value.trim()]) {
      state.enabled = true;
      state.fontWeight = FONT_WEIGHT_FROM_VALUE[weightProp.value.trim()];
      claimed.add(claimKey(titleP.selector, "font-weight"));
    }
    const familyProp = findProp(titleP, "font-family");
    if (familyProp && !familyProp.hasCondition && familyProp.value.trim()) {
      state.enabled = true;
      state.fontFamily = familyProp.value.trim();
      claimed.add(claimKey(titleP.selector, "font-family"));
    }
    const textAlignProp = findProp(titleP, "text-align");
    if (textAlignProp && !textAlignProp.hasCondition) {
      const a2 = TEXT_ALIGN_MAP[textAlignProp.value.trim()];
      if (a2) {
        state.enabled = true;
        state.alignment = a2;
        claimed.add(claimKey(titleP.selector, "text-align"));
      }
    }
  }
  if (titleIcon) {
    const iconSizeProp = findProp(titleIcon, "--mdc-icon-size");
    if (iconSizeProp && !iconSizeProp.hasCondition) {
      const m2 = iconSizeProp.value.match(/^(\d+(?:\.\d+)?)px$/);
      if (m2) {
        state.enabled = true;
        state.iconSize = parseFloat(m2[1]);
        claimed.add(claimKey(titleIcon.selector, "--mdc-icon-size"));
        const haIconSize = findProp(titleIcon, "--ha-icon-size");
        if (haIconSize && haIconSize.value.trim() === iconSizeProp.value.trim()) {
          claimed.add(claimKey(titleIcon.selector, "--ha-icon-size"));
        }
      }
    }
    const iconColorProp = findProp(titleIcon, "color");
    if (iconColorProp && !iconColorProp.hasCondition && iconColorProp.value.trim()) {
      state.enabled = true;
      state.iconColor = iconColorProp.value.trim();
      claimed.add(claimKey(titleIcon.selector, "color"));
    }
  }
  if (container) {
    const justifyProp = findProp(container, "justify-content");
    if (justifyProp && !justifyProp.hasCondition) {
      const a2 = JUSTIFY_TO_ALIGN[justifyProp.value.trim()];
      if (a2) {
        state.enabled = true;
        state.alignment = a2;
        claimed.add(claimKey(container.selector, "justify-content"));
      }
    }
  }
  return state;
}
const FONT_WEIGHT_FROM_VALUE = {
  normal: "normal",
  "500": "medium",
  bold: "bold"
};
function claimFontCompanions(targets, haCard, sizePx, size, weight, color, family, claimed) {
  const claimIf = (target, property, expected) => {
    if (!target || expected === null) return;
    const prop = findProp(target, property);
    if (prop && prop.value.trim() === expected) claimed.add(claimKey(target.selector, property));
  };
  for (const [name2, expected] of [
    ["--ha-tile-info-primary-font-size", size],
    ["--ha-tile-info-secondary-font-size", size],
    ["--ha-tile-info-primary-font-weight", weight],
    ["--ha-tile-info-secondary-font-weight", weight],
    ["--ha-tile-info-primary-color", color],
    ["--ha-tile-info-secondary-color", color],
    ["--primary-text-color", color],
    ["--ha-font-size-l", size],
    ["--ha-font-weight-medium", weight],
    ["--ha-card-header-font-size", headerFontSize(sizePx)],
    ["--ha-card-header-color", color],
    ["--ha-card-header-font-family", family]
  ]) {
    claimIf(haCard, name2, expected);
  }
  const name = findTarget(targets, ".name");
  claimIf(name, "font-size", size);
  claimIf(name, "font-weight", weight);
  claimIf(name, "color", color);
  const value = findTarget(targets, ".value");
  claimIf(value, "font-size", valueFontSize(sizePx));
  const measurement = findTarget(targets, ".measurement");
  claimIf(measurement, "font-size", size);
  claimIf(measurement, "color", color);
  for (const sel of ["#info", ".brightness"]) {
    claimIf(findTarget(targets, sel), "font-size", size);
  }
  const title = findTarget(targets, ".title");
  claimIf(title, "font-size", size);
  claimIf(title, "font-weight", weight);
  claimIf(title, "color", color);
  claimIf(findTarget(targets, ".card-header"), "font-weight", weight);
}
function mapFont(targets, haCard, claimed) {
  if (!haCard) return { ...DEFAULT_FONT };
  const fontSizeProp = findProp(haCard, "font-size");
  if (!fontSizeProp || fontSizeProp.hasCondition) return { ...DEFAULT_FONT };
  const sizeMatch = fontSizeProp.value.trim().match(/^(\d+(?:\.\d+)?)px$/);
  if (!sizeMatch) return { ...DEFAULT_FONT };
  const state = { ...DEFAULT_FONT, enabled: true, fontSize: parseFloat(sizeMatch[1]) };
  claimed.add(claimKey(haCard.selector, "font-size"));
  const sizeStr = fontSizeProp.value.trim();
  let weightStr = "normal";
  const weightProp = findProp(haCard, "font-weight");
  if (weightProp && !weightProp.hasCondition && FONT_WEIGHT_FROM_VALUE[weightProp.value.trim()]) {
    weightStr = weightProp.value.trim();
    state.fontWeight = FONT_WEIGHT_FROM_VALUE[weightStr];
    claimed.add(claimKey(haCard.selector, "font-weight"));
  }
  let colorStr = null;
  const colorProp = findProp(haCard, "color");
  if (colorProp && !colorProp.hasCondition && colorProp.value.trim()) {
    colorStr = colorProp.value.trim();
    state.color = colorStr;
    claimed.add(claimKey(haCard.selector, "color"));
  }
  let familyStr = null;
  const familyProp = findProp(haCard, "font-family");
  if (familyProp && !familyProp.hasCondition && familyProp.value.trim()) {
    familyStr = familyProp.value.trim();
    state.fontFamily = familyStr;
    claimed.add(claimKey(haCard.selector, "font-family"));
  }
  claimFontCompanions(targets, haCard, state.fontSize, sizeStr, weightStr, colorStr, familyStr, claimed);
  return state;
}
function parseThresholdJinja(value) {
  if (!value.includes("float(0)")) return null;
  const RULE_RE = /'(#[0-9a-fA-F]{3,8}|var\(--[\w-]+\)|rgba?\([\d\s.,%]+\)|[a-zA-Z]+)'\s+if\s+(?:states\('([^']+)'\)|state_attr\('([^']+)',\s*'([^']+)'\))\s*\|\s*float\(0\)\s*(>=|<=|>|<|==|!=)\s*(-?[\d.]+(?:\.\d+)?)/g;
  const DEFAULT_RE = /else\s+'(#[0-9a-fA-F]{3,8}|var\(--[\w-]+\)|rgba?\([\d\s.,%]+\)|[a-zA-Z]+)'\s*[)}]/;
  const rules = [];
  let entityId = "";
  let attribute;
  let idx = 0;
  let match;
  while ((match = RULE_RE.exec(value)) !== null) {
    const [, color, stateEntity, attrEntity, attrName, operator, numStr] = match;
    entityId = stateEntity ?? attrEntity;
    if (attrName) attribute = attrName;
    rules.push({
      id: String(idx++),
      operator,
      value: parseFloat(numStr),
      color
    });
  }
  if (rules.length === 0 || !entityId) return null;
  const defaultMatch = DEFAULT_RE.exec(value);
  const defaultColor = defaultMatch ? defaultMatch[1] : DEFAULT_THRESHOLD.defaultColor;
  return { entityId, attribute, rules, defaultColor };
}
function parseEntityRowCss(css) {
  const style = { iconColor: "", textColor: "" };
  const detailed = parseCssDetailed(css);
  let targets = detailed.targets;
  if (targets.length === 0) targets = parseCss(`:host{${css}}`);
  const [target, ...otherTargets] = targets;
  const properties = target?.properties ?? [];
  const consumed = /* @__PURE__ */ new Set();
  const valueOf = (...names) => {
    for (const name of names) {
      const found = properties.find((p2) => p2.property === name);
      if (found) {
        consumed.add(name);
        return found.value.trim();
      }
    }
    return "";
  };
  const iconVal = valueOf("--state-icon-color", "--paper-item-icon-color");
  if (iconVal.includes("float(0)")) {
    const parsed = parseThresholdJinja(iconVal);
    if (parsed && !parsed.attribute) {
      style.iconMode = "threshold";
      style.iconRules = parsed.rules;
      style.iconDefault = parsed.defaultColor;
    } else {
      consumed.delete("--state-icon-color");
      consumed.delete("--paper-item-icon-color");
    }
  } else {
    style.iconColor = iconVal;
  }
  const textVal = valueOf("color");
  if (textVal.includes("float(0)")) {
    const parsed = parseThresholdJinja(textVal);
    if (parsed && !parsed.attribute) {
      style.textMode = "threshold";
      style.textRules = parsed.rules;
      style.textDefault = parsed.defaultColor;
    } else {
      consumed.delete("color");
    }
  } else {
    style.textColor = textVal;
  }
  const rowFontSize = valueOf("font-size");
  const sizeM = rowFontSize.match(/^(\d+(?:\.\d+)?)px$/);
  if (sizeM) {
    style.fontSizePx = parseFloat(sizeM[1]);
  } else if (rowFontSize) {
    consumed.delete("font-size");
  }
  const rowWeight = valueOf("font-weight");
  if (rowWeight && FONT_WEIGHT_FROM_VALUE[rowWeight]) {
    style.fontWeight = FONT_WEIGHT_FROM_VALUE[rowWeight];
  } else if (rowWeight) {
    consumed.delete("font-weight");
  }
  const extraParts = [];
  if (detailed.passthroughCss) extraParts.push(detailed.passthroughCss);
  if (target) {
    const leftover = properties.filter((p2) => !consumed.has(p2.property));
    if (leftover.length > 0) {
      const decls = leftover.map((p2) => `  ${p2.property}: ${p2.value}${p2.important ? " !important" : ""};`).join("\n");
      extraParts.push(`${target.selector} {
${decls}
}`);
    }
  }
  for (const t2 of otherTargets) {
    const decls = t2.properties.map((p2) => `  ${p2.property}: ${p2.value}${p2.important ? " !important" : ""};`).join("\n");
    extraParts.push(`${t2.selector} {
${decls}
}`);
  }
  if (extraParts.length > 0) style.extraCss = extraParts.join("\n\n");
  return style;
}
function mergeEntityRowStyles(primary, secondary) {
  const iconSet = !!(primary.iconColor || primary.iconMode === "threshold");
  const textSet = !!(primary.textColor || primary.textMode === "threshold");
  return {
    iconColor: iconSet ? primary.iconColor : secondary.iconColor,
    iconMode: iconSet ? primary.iconMode : secondary.iconMode,
    iconRules: iconSet ? primary.iconRules : secondary.iconRules,
    iconDefault: iconSet ? primary.iconDefault : secondary.iconDefault,
    textColor: textSet ? primary.textColor : secondary.textColor,
    textMode: textSet ? primary.textMode : secondary.textMode,
    textRules: textSet ? primary.textRules : secondary.textRules,
    textDefault: textSet ? primary.textDefault : secondary.textDefault,
    ...primary.fontSizePx ?? secondary.fontSizePx ? { fontSizePx: primary.fontSizePx ?? secondary.fontSizePx } : {},
    ...primary.fontWeight ?? secondary.fontWeight ? { fontWeight: primary.fontWeight ?? secondary.fontWeight } : {},
    // Same whole-or-nothing choice as mergeStudioStates' rawCss: unstructured
    // CSS can't be merged declaration-by-declaration safely.
    ...primary.extraCss || secondary.extraCss ? { extraCss: primary.extraCss || secondary.extraCss } : {}
  };
}
function sameThreshold(a2, b2) {
  if (a2.entityId !== b2.entityId || a2.defaultColor !== b2.defaultColor) return false;
  if ((a2.attribute ?? "") !== (b2.attribute ?? "")) return false;
  if (a2.rules.length !== b2.rules.length) return false;
  return a2.rules.every(
    (r2, i4) => r2.operator === b2.rules[i4].operator && r2.value === b2.rules[i4].value && r2.color === b2.rules[i4].color
  );
}
function mapThreshold(haCard, haStateIcon, haGauge, hostTarget, cardType, claimed) {
  const candidates = [];
  if (haCard) {
    const bgProp = findProp(haCard, "background");
    if (bgProp?.hasCondition && !bgProp.onValue)
      candidates.push({ target: haCard, cssProperty: "background", thresholdProperty: "background" });
    const colorProp = findProp(haCard, "color");
    if (colorProp?.hasCondition && !colorProp.onValue)
      candidates.push({ target: haCard, cssProperty: "color", thresholdProperty: "text-color" });
    const accentProp = findProp(haCard, "--accent-color");
    if (accentProp?.hasCondition && !accentProp.onValue)
      candidates.push({ target: haCard, cssProperty: "--accent-color", thresholdProperty: "accent-color" });
    const borderColorProp = findProp(haCard, "border-color");
    if (borderColorProp?.hasCondition && !borderColorProp.onValue)
      candidates.push({ target: haCard, cssProperty: "border-color", thresholdProperty: "border-color" });
    const borderShorthandProp = findProp(haCard, "border");
    if (borderShorthandProp?.hasCondition && !borderShorthandProp.onValue)
      candidates.push({ target: haCard, cssProperty: "border", thresholdProperty: "border-color" });
  }
  if (haStateIcon) {
    const colorProp = findProp(haStateIcon, "color");
    if (colorProp?.hasCondition && !colorProp.onValue)
      candidates.push({ target: haStateIcon, cssProperty: "color", thresholdProperty: "icon-color" });
  }
  if (iconAdoptionAllowed(cardType)) {
    for (const target of [haCard, hostTarget]) {
      if (!target) continue;
      const accentProp = haCard ? findProp(haCard, "--accent-color") : void 0;
      for (const varName of ["--state-icon-color", "--paper-item-icon-color"]) {
        const prop = findProp(target, varName);
        if (!prop?.hasCondition || prop.onValue) continue;
        if (accentProp && accentProp.value.trim() === prop.value.trim()) continue;
        candidates.push({ target, cssProperty: varName, thresholdProperty: "icon-color" });
      }
    }
  }
  let base = null;
  const properties = [];
  let borderWidth;
  let gradientStops = null;
  for (const { target, cssProperty, thresholdProperty } of candidates) {
    const prop = findProp(target, cssProperty);
    const parsed = parseThresholdJinja(prop.value);
    if (!parsed) continue;
    if (base && !sameThreshold(base, parsed)) continue;
    base ??= parsed;
    claimed.add(claimKey(target.selector, cssProperty));
    if (!properties.includes(thresholdProperty)) properties.push(thresholdProperty);
    if (thresholdProperty === "accent-color") {
      claimAccentAux(haCard, haGauge, prop.value.trim(), claimed);
    }
    if (cssProperty === "border") {
      const bwMatch = prop.value.match(/^(\d+)px/);
      borderWidth = bwMatch ? parseInt(bwMatch[1], 10) : 2;
    }
    const markerProp = findProp(target, GRADIENT_MARKER_PROPERTY);
    if (markerProp) {
      const unquoted = markerProp.value.trim().replace(/^'|'$/g, "");
      const decoded = decodeGradientStops(unquoted);
      if (decoded) {
        gradientStops ??= decoded;
        claimed.add(claimKey(target.selector, GRADIENT_MARKER_PROPERTY));
      }
    }
  }
  if (!base || properties.length === 0) return { ...DEFAULT_THRESHOLD };
  return {
    enabled: true,
    entityId: base.entityId,
    attribute: base.attribute ?? "",
    properties,
    valueMode: gradientStops ? "gradient" : "switch",
    rules: gradientStops ? [] : base.rules,
    defaultColor: gradientStops ? DEFAULT_THRESHOLD.defaultColor : base.defaultColor,
    colorStops: gradientStops ?? DEFAULT_THRESHOLD.colorStops,
    ...borderWidth !== void 0 ? { borderWidth } : {}
  };
}
function mapAdvanced(parsed, claimed) {
  const parts = [];
  if (parsed.passthroughCss) parts.push(parsed.passthroughCss);
  for (const target of parsed.targets) {
    const unclaimed = target.properties.filter(
      (p2) => !claimed.has(claimKey(target.selector, p2.property))
    );
    if (unclaimed.length > 0) {
      const decls = unclaimed.map((p2) => `  ${p2.property}: ${p2.value}${p2.important ? " !important" : ""};`).join("\n");
      parts.push(`${target.selector} {
${decls}
}`);
    }
  }
  return { rawCss: parts.join("\n\n") };
}
function pickOutputKey(hass) {
  return isUixInstalled(hass) && !isCardModInstalled() ? "uix" : "card_mod";
}
function withoutStyle(uix) {
  const rest = { ...uix };
  delete rest.style;
  return Object.keys(rest).length > 0 ? rest : void 0;
}
function clearUixStyle(existingConfig) {
  return existingConfig.uix ? withoutStyle(existingConfig.uix) : void 0;
}
function clearCardModStyle(existingConfig) {
  if (!existingConfig.card_mod) return void 0;
  const rest = { ...existingConfig.card_mod };
  delete rest.style;
  return Object.keys(rest).length > 0 ? rest : void 0;
}
function applyCardModStyle(css, existingConfig, outputKey = "card_mod") {
  if (hasDictFormStyle(existingConfig)) {
    return { ...existingConfig };
  }
  const trimmed = css.trim();
  if (!trimmed) {
    const result = { ...existingConfig };
    const cleanedCardMod = clearCardModStyle(result);
    if (cleanedCardMod === void 0) {
      delete result.card_mod;
    } else {
      result.card_mod = cleanedCardMod;
    }
    const cleanedUix = clearUixStyle(result);
    if (cleanedUix === void 0) {
      delete result.uix;
    } else {
      result.uix = cleanedUix;
    }
    return result;
  }
  if (outputKey === "uix") {
    const next2 = { ...existingConfig, uix: { ...existingConfig.uix, style: trimmed } };
    const cleanedCardMod = clearCardModStyle(next2);
    if (cleanedCardMod === void 0) {
      delete next2.card_mod;
    } else {
      next2.card_mod = cleanedCardMod;
    }
    return next2;
  }
  const next = { ...existingConfig, card_mod: { ...existingConfig.card_mod, style: trimmed } };
  if (next.uix?.style !== void 0 && !usesUixOnlyFeaturesInBlock(next.uix)) {
    const cleanedUix = clearUixStyle(next);
    if (cleanedUix === void 0) {
      delete next.uix;
    } else {
      next.uix = cleanedUix;
    }
  }
  return next;
}
const PALETTE_CHANGED_EVENT = "cms-palette-changed";
const HA_KEY$1 = "cms_palette";
const LS_KEY$1 = "cms-palette";
const EMPTY_PALETTE = { colors: [], defaults: {} };
function hassAvailable$1(hass) {
  return !!hass?.connection?.sendMessagePromise;
}
function sanitize(raw) {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PALETTE };
  const obj = raw;
  const colors = Array.isArray(obj.colors) ? obj.colors.filter(
    (c2) => !!c2 && typeof c2 === "object" && typeof c2.id === "string" && typeof c2.name === "string" && typeof c2.hex === "string"
  ) : [];
  const defaults = {};
  if (obj.defaults && typeof obj.defaults === "object") {
    if (typeof obj.defaults.onColor === "string" && obj.defaults.onColor) defaults.onColor = obj.defaults.onColor;
    if (typeof obj.defaults.offColor === "string" && obj.defaults.offColor) defaults.offColor = obj.defaults.offColor;
  }
  return { colors, defaults };
}
let cache = { ...EMPTY_PALETTE };
let initPromise = null;
let cacheDirty = false;
function getCachedPalette() {
  return cache;
}
function initPaletteCache(hass) {
  initPromise ??= (async () => {
    const loaded = await loadPalette(hass);
    if (cacheDirty) return;
    cache = loaded;
    window.dispatchEvent(new CustomEvent(PALETTE_CHANGED_EVENT));
  })();
  return initPromise;
}
async function loadPalette(hass) {
  if (hassAvailable$1(hass)) {
    try {
      const result = await hass.connection.sendMessagePromise({
        type: "frontend/get_user_data",
        key: HA_KEY$1
      });
      if (result?.value) return sanitize(result.value);
    } catch (err) {
      console.warn("[Card-Mod Studio] Palette load from HA failed, using localStorage:", err);
    }
  }
  try {
    const raw = localStorage.getItem(LS_KEY$1);
    return raw ? sanitize(JSON.parse(raw)) : { ...EMPTY_PALETTE };
  } catch {
    return { ...EMPTY_PALETTE };
  }
}
async function savePalette(palette, hass) {
  cache = sanitize(palette);
  cacheDirty = true;
  window.dispatchEvent(new CustomEvent(PALETTE_CHANGED_EVENT));
  try {
    localStorage.setItem(LS_KEY$1, JSON.stringify(cache));
  } catch {
  }
  if (hassAvailable$1(hass)) {
    try {
      await hass.connection.sendMessagePromise({
        type: "frontend/set_user_data",
        key: HA_KEY$1,
        value: cache
      });
    } catch (err) {
      console.warn("[Card-Mod Studio] Palette sync to HA failed (saved to localStorage only):", err);
    }
  }
}
function applyPaletteDefaults(state) {
  const { onColor, offColor } = getCachedPalette().defaults;
  if (!onColor && !offColor) return state;
  const next = { ...state };
  if (!next.iconColor.enabled) {
    next.iconColor = {
      ...next.iconColor,
      ...onColor ? { color: onColor, colorOn: onColor } : {},
      ...offColor ? { colorOff: offColor } : {}
    };
  }
  if (!next.accentColor.enabled) {
    next.accentColor = {
      ...next.accentColor,
      ...onColor ? { color: onColor, colorOn: onColor } : {},
      ...offColor ? { colorOff: offColor } : {}
    };
  }
  return next;
}
function buildMergedStudioState(config, hass) {
  const outputKey = pickOutputKey(hass);
  const primaryStyle = outputKey === "uix" ? config.uix?.style : config.card_mod?.style;
  const secondaryStyle = outputKey === "uix" ? config.card_mod?.style : config.uix?.style;
  const primaryState = mapToStudioState(parseStyleValue(primaryStyle), config.type);
  const secondaryUsable = outputKey === "uix" || !usesUixOnlyFeatures(config);
  if (!hasStyleContent(secondaryStyle) || !secondaryUsable) return applyPaletteDefaults(primaryState);
  const secondaryState = mapToStudioState(parseStyleValue(secondaryStyle), config.type);
  return applyPaletteDefaults(mergeStudioStates(primaryState, secondaryState));
}
function applyStudioState(state, config, hass) {
  const css = generateCss(state, config.type, {
    gaugeNeedle: config.needle === true
  });
  return applyCardModStyle(css, config, pickOutputKey(hass));
}
function buildMergedRowStyle(row, hass) {
  const outputKey = pickOutputKey(hass);
  const primaryStyle = outputKey === "uix" ? row.uix?.style : row.card_mod?.style;
  const secondaryStyle = outputKey === "uix" ? row.card_mod?.style : row.uix?.style;
  const primaryRowStyle = parseEntityRowCss(typeof primaryStyle === "string" ? primaryStyle : "");
  if (!hasStyleContent(secondaryStyle)) return primaryRowStyle;
  const secondaryRowStyle = parseEntityRowCss(typeof secondaryStyle === "string" ? secondaryStyle : "");
  return mergeEntityRowStyles(primaryRowStyle, secondaryRowStyle);
}
function rowEntityId(row) {
  return typeof row === "string" ? row : row.entity;
}
function rowStyleKey(index) {
  return String(index);
}
function initEntityRowStyles(config, hass) {
  if (config.type !== "entities") return {};
  const rows = config.entities;
  if (!rows?.length) return {};
  const styles = {};
  rows.forEach((row, index) => {
    const entityId = rowEntityId(row);
    if (!entityId) return;
    styles[rowStyleKey(index)] = typeof row === "string" ? { iconColor: "", textColor: "" } : buildMergedRowStyle(row, hass);
  });
  return styles;
}
function generateEntityRowCss(style, entityId) {
  const decls = [];
  if (style.iconMode === "threshold" && style.iconRules?.length && style.iconDefault) {
    decls.push(`  --state-icon-color: ${buildThresholdJinja(style.iconRules, style.iconDefault, entityId)};`);
  } else if (style.iconColor) {
    decls.push(`  --state-icon-color: ${style.iconColor};`);
  }
  if (style.textMode === "threshold" && style.textRules?.length && style.textDefault) {
    decls.push(`  color: ${buildThresholdJinja(style.textRules, style.textDefault, entityId)};`);
  } else if (style.textColor) {
    decls.push(`  color: ${style.textColor};`);
  }
  if (style.fontSizePx) decls.push(`  font-size: ${style.fontSizePx}px;`);
  if (style.fontWeight) decls.push(`  font-weight: ${FONT_WEIGHT_VALUE[style.fontWeight]};`);
  const hostBlock = decls.length ? `:host {
${decls.join("\n")}
}` : "";
  return [hostBlock, style.extraCss ?? ""].filter(Boolean).join("\n\n");
}
function rowStyleHasContent(rowStyle) {
  if (!rowStyle) return false;
  const hasIcon = !!(rowStyle.iconColor || rowStyle.iconMode === "threshold" && rowStyle.iconRules?.length);
  const hasText = !!(rowStyle.textColor || rowStyle.textMode === "threshold" && rowStyle.textRules?.length);
  return hasIcon || hasText || !!rowStyle.fontSizePx || !!rowStyle.fontWeight || !!rowStyle.extraCss;
}
function applyEntityRowStyles(config, rowStyles, hass) {
  const rows = config.entities;
  if (!rows?.length) return config;
  const outputKey = pickOutputKey(hass);
  const updatedRows = rows.map((row, index) => {
    const entityId = rowEntityId(row);
    if (!entityId) return row;
    const rowStyle = rowStyles[rowStyleKey(index)];
    const hasContent = rowStyleHasContent(rowStyle);
    if (typeof row === "string") {
      if (!hasContent) return row;
      return applyCardModStyle(
        generateEntityRowCss(rowStyle, entityId),
        { entity: row },
        outputKey
      );
    }
    const currentStyle = resolveStyle(row);
    if (isDictForm(currentStyle)) return row;
    const rowCss = hasContent ? generateEntityRowCss(rowStyle, entityId) : "";
    return applyCardModStyle(rowCss, row, outputKey);
  });
  return { ...config, entities: updatedRows };
}
var __defProp$h = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __decorateClass$h = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$h(target, key, result);
  return result;
};
const TOGGLE_DOMAINS = [
  "binary_sensor",
  "switch",
  "light",
  "input_boolean",
  "fan",
  "humidifier",
  "siren",
  "remote"
];
let CmsEntityPicker = class extends i$3 {
  constructor() {
    super(...arguments);
    this.value = "";
    this.label = "Entity";
    this.placeholder = "";
  }
  _emit(value) {
    this.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value } })
    );
  }
  render() {
    if (this.hass) {
      return b`
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this.value}
          .label=${this.label}
          .includeDomains=${this.includeDomains}
          .allowCustomEntity=${true}
          @value-changed=${(e2) => {
        e2.stopPropagation();
        this._emit(e2.detail.value ?? "");
      }}
        ></ha-entity-picker>
      `;
    }
    return b`
      <input
        class="fallback-input"
        type="text"
        .value=${this.value}
        placeholder=${this.placeholder || "sensor.example"}
        @change=${(e2) => this._emit(e2.target.value.trim())}
      />
    `;
  }
};
CmsEntityPicker.styles = i$6`
    :host {
      display: block;
      flex: 1;
      min-width: 0;
    }
    ha-entity-picker {
      width: 100%;
    }
    .fallback-input {
      width: 100%;
      box-sizing: border-box;
      background: var(--card-background-color, #1c1c1c);
      color: var(--primary-text-color, #e1e1e1);
      border: 1px solid var(--divider-color, #383838);
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 12px;
      font-family: monospace;
    }
  `;
__decorateClass$h([
  n2({ attribute: false })
], CmsEntityPicker.prototype, "hass", 2);
__decorateClass$h([
  n2()
], CmsEntityPicker.prototype, "value", 2);
__decorateClass$h([
  n2()
], CmsEntityPicker.prototype, "label", 2);
__decorateClass$h([
  n2()
], CmsEntityPicker.prototype, "placeholder", 2);
__decorateClass$h([
  n2({ attribute: false })
], CmsEntityPicker.prototype, "includeDomains", 2);
CmsEntityPicker = __decorateClass$h([
  t$2("cms-entity-picker")
], CmsEntityPicker);
const moduleStyles = i$6`
  :host {
    display: block;
  }

  .module {
    border: 1px solid var(--divider-color, #383838);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .module-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;
  }

  .module-header:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .module-chevron {
    font-size: 9px;
    color: var(--secondary-text-color, #9e9e9e);
    width: 14px;
    flex-shrink: 0;
    transition: transform 0.15s ease;
  }

  .module-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    flex: 1;
  }

  .module-body {
    padding: 12px 14px;
    border-top: 1px solid var(--divider-color, #383838);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 36px;
    gap: 8px;
  }

  .control-label {
    font-size: 12px;
    color: var(--secondary-text-color, #9e9e9e);
    flex-shrink: 0;
  }

  .control-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: flex-end;
  }

  ha-slider {
    flex: 1;
    min-width: 100px;
    max-width: 160px;
  }

  .value-label {
    font-size: 11px;
    color: var(--secondary-text-color, #9e9e9e);
    min-width: 36px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  input[type='color'] {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--divider-color, #383838);
    cursor: pointer;
    padding: 0;
    background: none;
    flex-shrink: 0;
  }

  .color-label {
    font-size: 11px;
    color: var(--secondary-text-color, #9e9e9e);
    font-family: monospace;
  }

  .sub-label {
    font-size: 11px;
    color: var(--secondary-text-color, #9e9e9e);
    margin-bottom: 4px;
  }

  ha-select {
    width: 100%;
  }

  select {
    background: var(--card-background-color, #1c1c1c);
    color: var(--primary-text-color, #e1e1e1);
    border: 1px solid var(--divider-color, #383838);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 12px;
    cursor: pointer;
    width: 100%;
  }

  /* Shared "Apply when" hint + custom-entity input (see renderWhen). */
  .when-hint {
    font-size: 11px;
    line-height: 1.4;
    color: var(--secondary-text-color, #9e9e9e);
  }

  /* "Custom CSS is overriding this control" — see style-conflicts.ts. */
  .override-badge {
    font-size: 13px;
    margin-right: 6px;
    flex-shrink: 0;
    cursor: help;
  }
  .override-hint {
    font-size: 11px;
    line-height: 1.5;
    color: var(--warning-color, #ffa600);
    background: rgba(255, 166, 0, 0.08);
    border: 1px solid rgba(255, 166, 0, 0.3);
    border-radius: 4px;
    padding: 6px 8px;
  }
  .override-hint code {
    font-size: 10px;
  }

`;
function whenHint(v2, o2) {
  switch (v2) {
    case "on":
      return `Applies the ${o2.noun} only while this card's entity is on (removed when off).`;
    case "off":
      return `Applies the ${o2.noun} only while this card's entity is off (removed when on).`;
    case "custom":
      return `Applies the ${o2.noun} only while ${o2.customEntity || "the chosen entity"} is on.`;
    default:
      return `Always applies the ${o2.noun}.`;
  }
}
function renderWhen(o2) {
  const hasStateValue = o2.value === "on" || o2.value === "off";
  const showOnOff = o2.stateAware || hasStateValue;
  const showSelect = showOnOff || !!o2.allowCustom;
  const opts = [{ v: "always", label: "Always" }];
  if (showOnOff) {
    opts.push({ v: "on", label: "Only while entity is ON" });
    opts.push({ v: "off", label: "Only while entity is OFF" });
  }
  if (o2.allowCustom) opts.push({ v: "custom", label: "While another entity is ON…" });
  return b`
    ${showSelect ? b`
          <div class="control-row">
            <span class="control-label">Apply when</span>
            <div class="control-right">
              <select
                .value=${o2.value}
                @change=${(e2) => o2.onChange(e2.target.value)}
              >
                ${opts.map(
    (opt) => b`<option value=${opt.v} ?selected=${o2.value === opt.v}>
                      ${opt.label}
                    </option>`
  )}
              </select>
            </div>
          </div>
        ` : A}
    ${o2.value === "custom" ? b`
          <div class="control-row">
            <span class="control-label">Entity</span>
            <div class="control-right">
              <cms-entity-picker
                .hass=${o2.hass}
                .value=${o2.customEntity ?? ""}
                .includeDomains=${TOGGLE_DOMAINS}
                label="Controlling entity"
                placeholder="input_boolean.my_entity"
                @value-changed=${(e2) => o2.onCustomEntity?.(e2.detail.value.trim())}
              ></cms-entity-picker>
            </div>
          </div>
        ` : A}
    <div class="when-hint">${whenHint(o2.value, o2)}</div>
  `;
}
function renderOverrideBadge(overridden) {
  if (!overridden) return A;
  return b`<span
    class="override-badge"
    title="Custom CSS in Advanced CSS is currently overriding this control"
  >⚠️</span>`;
}
function renderOverrideHint(overridden, detail) {
  if (!overridden) return A;
  return b`<div class="override-hint">
    ⚠️ <strong>Custom CSS is currently overriding this control</strong>${detail ? b` — <code>${detail}</code>` : A}.
    Advanced CSS is applied after these settings (hand-written styles always
    win), so changes here may not be visible on the card. Edit or remove
    those lines in Advanced CSS to hand control back to this module.
  </div>`;
}
const CONDITION_OPERATORS = ["<", "<=", ">", ">=", "==", "!="];
function numericAttributes(hass, entityId, current) {
  const attrs = hass?.states?.[entityId]?.attributes ?? {};
  const names = Object.keys(attrs).filter((k2) => {
    const v2 = attrs[k2];
    return typeof v2 === "number" || typeof v2 === "string" && v2.trim() !== "" && !isNaN(Number(v2));
  });
  if (current && !names.includes(current)) names.unshift(current);
  return names;
}
function conditionHint(c2, o2) {
  switch (c2?.when) {
    case "on":
      return `Applies the ${o2.noun} only while this card's entity is on.`;
    case "off":
      return `Applies the ${o2.noun} only while this card's entity is off.`;
    case "custom":
      return `Applies the ${o2.noun} only while ${c2.customEntity || "the chosen entity"} is on.`;
    case "value":
      return `Applies the ${o2.noun} only while the condition matches.`;
    default:
      return `Always applies the ${o2.noun}.`;
  }
}
function renderCondition(o2) {
  const c2 = o2.condition;
  const when = c2?.when ?? "always";
  const hasStateValue = when === "on" || when === "off";
  const showOnOff = o2.stateAware || hasStateValue;
  const opts = [
    { v: "always", label: "Always" }
  ];
  if (showOnOff) {
    opts.push({ v: "on", label: "Only while entity is ON" });
    opts.push({ v: "off", label: "Only while entity is OFF" });
  }
  opts.push({ v: "custom", label: "While another entity is ON…" });
  opts.push({ v: "value", label: "While a value matches…" });
  const change = (patch) => {
    const next = { when, ...c2, ...patch };
    o2.onChange(next.when === "always" ? void 0 : next);
  };
  const pick = (v2) => {
    if (v2 === "always") return o2.onChange(void 0);
    if (v2 === "value") return change({ when: v2, valueOperator: c2?.valueOperator ?? ">", valueThreshold: c2?.valueThreshold ?? 0 });
    change({ when: v2 });
  };
  const attrNames = when === "value" && c2?.valueEntity ? numericAttributes(o2.hass, c2.valueEntity, c2.valueAttribute) : [];
  return b`
    <div class="control-row">
      <span class="control-label">Reacts to</span>
      <div class="control-right">
        <select
          .value=${when}
          @change=${(e2) => pick(e2.target.value)}
        >
          ${opts.map(
    (opt) => b`<option value=${opt.v} ?selected=${when === opt.v}>${opt.label}</option>`
  )}
        </select>
      </div>
    </div>
    ${when === "custom" ? b`
          <div class="control-row">
            <span class="control-label">Entity</span>
            <div class="control-right">
              <cms-entity-picker
                .hass=${o2.hass}
                .value=${c2?.customEntity ?? ""}
                .includeDomains=${TOGGLE_DOMAINS}
                label="Controlling entity"
                placeholder="input_boolean.my_entity"
                @value-changed=${(e2) => change({ customEntity: e2.detail.value.trim() })}
              ></cms-entity-picker>
            </div>
          </div>
        ` : A}
    ${when === "value" ? b`
          <div class="control-row">
            <span class="control-label">Entity</span>
            <div class="control-right">
              <cms-entity-picker
                .hass=${o2.hass}
                .value=${c2?.valueEntity ?? ""}
                label="Entity the value is read from"
                placeholder="sensor.temperature"
                @value-changed=${(e2) => change({ valueEntity: e2.detail.value.trim(), valueAttribute: "" })}
              ></cms-entity-picker>
            </div>
          </div>
          ${attrNames.length > 0 || c2?.valueAttribute ? b`
                <div class="control-row">
                  <span class="control-label">Value read from</span>
                  <div class="control-right">
                    <select
                      .value=${c2?.valueAttribute ?? ""}
                      @change=${(e2) => change({ valueAttribute: e2.target.value })}
                    >
                      <option value="" ?selected=${!c2?.valueAttribute}>State</option>
                      ${attrNames.map(
    (name) => b`<option value=${name} ?selected=${c2?.valueAttribute === name}>
                            Attribute: ${name}
                          </option>`
  )}
                    </select>
                  </div>
                </div>
              ` : A}
          <div class="control-row">
            <span class="control-label">Condition</span>
            <div class="control-right">
              <select
                .value=${c2?.valueOperator ?? ">"}
                @change=${(e2) => change({
    valueOperator: e2.target.value
  })}
              >
                ${CONDITION_OPERATORS.map(
    (op) => b`<option value=${op} ?selected=${(c2?.valueOperator ?? ">") === op}>
                      value ${op}
                    </option>`
  )}
              </select>
            </div>
          </div>
          <div class="control-row">
            <span class="control-label">Threshold</span>
            <div class="control-right">
              <input
                type="number"
                .value=${String(c2?.valueThreshold ?? 0)}
                @change=${(e2) => change({
    valueThreshold: parseFloat(e2.target.value) || 0
  })}
              />
            </div>
          </div>
        ` : A}
    <div class="when-hint">${conditionHint(c2, o2)}</div>
  `;
}
const RULES$1 = [
  { module: "iconColor", selector: "ha-state-icon", props: ["color"] },
  { module: "iconColor", selector: "ha-icon", props: ["color"] },
  { module: "iconColor", selector: "ha-card", props: ["--state-icon-color", "--paper-item-icon-color", "--mdc-icon-size", "--ha-icon-size"] },
  { module: "iconColor", selector: ":host", props: ["--state-icon-color", "--paper-item-icon-color"] },
  // v0.9 icon size, tile companion block
  { module: "iconColor", selector: "ha-tile-icon", props: ["--mdc-icon-size"] },
  { module: "accentColor", selector: "ha-card", props: [
    "--accent-color",
    "--tile-color",
    "--state-icon-color",
    "--paper-item-icon-active-color",
    "--state-climate-heat-color",
    "--state-climate-cool-color",
    "--state-climate-auto-color",
    "--state-climate-idle-color",
    "--control-circular-slider-color",
    "--gauge-color"
  ] },
  { module: "accentColor", selector: "ha-gauge", props: ["--gauge-color", "--primary-text-color"] },
  { module: "background", selector: "ha-card", props: ["background", "background-color", "background-image"] },
  { module: "font", selector: "ha-card", props: [
    "font-size",
    "font-weight",
    "font-family",
    "color",
    "--ha-tile-info-primary-font-size",
    "--ha-tile-info-primary-font-weight",
    "--ha-tile-info-primary-color",
    "--ha-tile-info-secondary-font-size",
    "--ha-tile-info-secondary-font-weight",
    "--ha-tile-info-secondary-color",
    "--ha-card-header-font-size",
    "--ha-card-header-color",
    "--ha-card-header-font-family",
    "--ha-font-size-l",
    "--ha-font-weight-medium",
    "--primary-text-color"
  ] },
  { module: "headingStyle", selector: ".title", props: ["font-size", "font-weight", "font-family", "color", "--mdc-icon-size", "--ha-icon-size"] },
  { module: "border", selector: "ha-card", props: ["border", "border-radius", "border-width", "border-color"] },
  { module: "filter", selector: "ha-card", props: ["filter", "-webkit-filter"] },
  { module: "animation", selector: "ha-card", props: ["animation", "animation-name"] }
];
const THRESHOLD_PROPS = {
  "icon-color": [{ module: "threshold", selector: "ha-state-icon", props: ["color"] }],
  "accent-color": [
    { module: "threshold", selector: "ha-card", props: [
      "--accent-color",
      "--tile-color",
      "--state-icon-color",
      "--state-climate-heat-color",
      "--state-climate-cool-color",
      "--state-climate-auto-color",
      "--state-climate-idle-color",
      "--control-circular-slider-color"
    ] },
    { module: "threshold", selector: "ha-gauge", props: ["--gauge-color", "--primary-text-color"] }
  ],
  background: [{ module: "threshold", selector: "ha-card", props: ["background"] }],
  "text-color": [{ module: "threshold", selector: "ha-card", props: ["color"] }],
  "border-color": [{ module: "threshold", selector: "ha-card", props: ["border", "border-color"] }]
};
function isEnabled(state, module) {
  switch (module) {
    case "iconColor":
      return state.iconColor.enabled;
    case "accentColor":
      return state.accentColor.enabled;
    case "background":
      return state.background.enabled;
    case "font":
      return state.font.enabled;
    case "headingStyle":
      return state.headingStyle.enabled;
    case "border":
      return state.border.enabled;
    case "filter":
      return state.filter.enabled || state.filter.grayscale;
    case "animation":
      return state.animation.enabled;
    case "threshold":
      return state.threshold.enabled;
  }
}
function findAdvancedCssConflicts(rawCss, state) {
  const trimmed = rawCss.trim();
  if (!trimmed) return {};
  let targets;
  try {
    targets = parseCss(trimmed);
  } catch {
    return {};
  }
  const activeRules = RULES$1.filter((r2) => isEnabled(state, r2.module));
  if (state.threshold.enabled) {
    for (const p2 of state.threshold.properties) {
      activeRules.push(...THRESHOLD_PROPS[p2] ?? []);
    }
  }
  if (activeRules.length === 0) return {};
  const out = {};
  for (const target of targets) {
    const sel = target.selector.toLowerCase();
    for (const prop of target.properties) {
      const name = prop.property.toLowerCase();
      for (const rule of activeRules) {
        if (rule.selector && !sel.includes(rule.selector)) continue;
        if (!rule.props.includes(name)) continue;
        (out[rule.module] ??= []).push(`${target.selector} { ${prop.property} }`);
      }
    }
  }
  for (const k2 of Object.keys(out)) {
    out[k2] = [...new Set(out[k2])];
  }
  return out;
}
function findRowExtraCssConflicts(style) {
  const extra = style.extraCss?.trim();
  if (!extra) return [];
  const iconOn = !!(style.iconColor || style.iconMode === "threshold");
  const textOn = !!(style.textColor || style.textMode === "threshold");
  const fontOn = !!(style.fontSizePx || style.fontWeight);
  if (!iconOn && !textOn && !fontOn) return [];
  let targets;
  try {
    targets = parseCss(extra.includes("{") ? extra : `:host{${extra}}`);
  } catch {
    return [];
  }
  const hits = [];
  for (const target of targets) {
    for (const prop of target.properties) {
      const name = prop.property.toLowerCase();
      if (iconOn && (name === "--state-icon-color" || name === "--paper-item-icon-color")) {
        hits.push(`${target.selector} { ${prop.property} }`);
      }
      if (textOn && name === "color") hits.push(`${target.selector} { color }`);
      if (fontOn && (name === "font-size" || name === "font-weight")) {
        hits.push(`${target.selector} { ${prop.property} }`);
      }
    }
  }
  return [...new Set(hits)];
}
class ConfigEchoGuard {
  constructor() {
    this._lastJson = null;
  }
  /** Record the config JSON this component just emitted — the reflected
   *  echo of exactly this JSON must not trigger a rebuild. */
  noteEmitted(json) {
    this._lastJson = json;
  }
  /** Config went away entirely — forget the baseline. */
  reset() {
    this._lastJson = null;
  }
  /**
   * Called with each incoming config's JSON. Returns false for our own
   * echo (JSON identical to the last known baseline). Returns true when
   * the editor state must be rebuilt — and advances the baseline to the
   * incoming JSON, so a later revert to a previously-emitted config is
   * correctly treated as a fresh external change, not mistaken for an echo.
   */
  shouldRebuild(incomingJson) {
    if (incomingJson === this._lastJson) return false;
    this._lastJson = incomingJson;
    return true;
  }
}
var __defProp$g = Object.defineProperty;
var __decorateClass$g = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$g(target, key, result);
  return result;
};
class FilterModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = { ...DEFAULT_FILTER };
    this.stateAware = true;
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
    this._brightness = DEFAULT_FILTER.brightness;
    this._blur = DEFAULT_FILTER.blur;
    this._opacity = 100;
    this._transitionMs = DEFAULT_FILTER.transitionMs;
  }
  static {
    this.styles = [moduleStyles, i$6``];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
      this._brightness = this.state.brightness;
      this._blur = this.state.blur;
      this._opacity = this.state.opacity ?? 100;
      this._transitionMs = this.state.transitionMs;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { ...this.state, ...changes }
      })
    );
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🔲 Visual Filters</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <!-- Grayscale -->
        <div class="control-row">
          <span class="control-label">Grayscale</span>
          <div class="control-right">
            <ha-switch
              .checked=${this.state.grayscale}
              @change=${(e2) => this._emit({ grayscale: e2.target.checked })}
            ></ha-switch>
          </div>
        </div>

        ${this.state.grayscale ? renderWhen({
      value: this.state.grayscaleWhen,
      stateAware: this.stateAware,
      noun: "grayscale",
      allowCustom: true,
      customEntity: this.state.customEntity,
      hass: this.hass,
      onChange: (v2) => this._emit({ grayscaleWhen: v2 }),
      onCustomEntity: (id) => this._emit({ customEntity: id })
    }) : A}

        <!-- Brightness -->
        <div class="control-row">
          <span class="control-label">Brightness</span>
          <div class="control-right">
            <ha-slider
              min="0"
              max="200"
              step="5"
              .value=${String(this._brightness)}
              @input=${(e2) => {
      this._brightness = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      brightness: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._brightness}%</span>
          </div>
        </div>

        <!-- Blur -->
        <div class="control-row">
          <span class="control-label">Blur</span>
          <div class="control-right">
            <ha-slider
              min="0"
              max="20"
              step="1"
              .value=${String(this._blur)}
              @input=${(e2) => {
      this._blur = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({ blur: parseFloat(e2.target.value) })}
            ></ha-slider>
            <span class="value-label">${this._blur}px</span>
          </div>
        </div>

        <!-- Opacity -->
        <div class="control-row">
          <span class="control-label">Opacity</span>
          <div class="control-right">
            <ha-slider
              min="10"
              max="100"
              step="5"
              .value=${String(this._opacity)}
              @input=${(e2) => {
      this._opacity = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({ opacity: parseFloat(e2.target.value) })}
            ></ha-slider>
            <span class="value-label">${this._opacity}%</span>
          </div>
        </div>

        ${!this.state.grayscale ? renderCondition({
      condition: this.state.effectsWhen,
      stateAware: this.stateAware,
      noun: "effects",
      hass: this.hass,
      onChange: (c2) => this._emit({ effectsWhen: c2 })
    }) : A}

        <!-- Transition speed -->
        <div class="control-row">
          <span class="control-label">Transition speed</span>
          <div class="control-right">
            <ha-slider
              min="0"
              max="2000"
              step="50"
              .value=${String(this._transitionMs)}
              @input=${(e2) => {
      this._transitionMs = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      transitionMs: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._transitionMs}ms</span>
          </div>
        </div>
      </div>
    `;
  }
}
__decorateClass$g([
  n2({ attribute: false })
], FilterModule.prototype, "state");
__decorateClass$g([
  n2({ type: Boolean, attribute: "state-aware" })
], FilterModule.prototype, "stateAware");
__decorateClass$g([
  n2({ attribute: false })
], FilterModule.prototype, "hass");
__decorateClass$g([
  n2({ attribute: false })
], FilterModule.prototype, "overridden");
__decorateClass$g([
  n2({ attribute: false })
], FilterModule.prototype, "overriddenDetail");
__decorateClass$g([
  r()
], FilterModule.prototype, "_open");
__decorateClass$g([
  r()
], FilterModule.prototype, "_brightness");
__decorateClass$g([
  r()
], FilterModule.prototype, "_blur");
__decorateClass$g([
  r()
], FilterModule.prototype, "_opacity");
__decorateClass$g([
  r()
], FilterModule.prototype, "_transitionMs");
customElements.define("cms-filter-module", FilterModule);
var __defProp$f = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass$f = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$f(target, key, result);
  return result;
};
function flattenedParent(node) {
  if (node instanceof Element && node.assignedSlot) return node.assignedSlot;
  const el = node;
  if (el.parentElement) return el.parentElement;
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}
function findModalDialogAncestor(start) {
  let node = start;
  while (node) {
    if (node instanceof HTMLDialogElement && node.open) return node;
    node = flattenedParent(node);
  }
  return null;
}
const HA_COLOR_PRESETS = [
  { name: "Red", variable: "var(--red-color)", hex: "#F44336" },
  { name: "Pink", variable: "var(--pink-color)", hex: "#E91E63" },
  { name: "Purple", variable: "var(--purple-color)", hex: "#9C27B0" },
  { name: "Blue", variable: "var(--blue-color)", hex: "#2196F3" },
  { name: "Cyan", variable: "var(--cyan-color)", hex: "#00BCD4" },
  { name: "Teal", variable: "var(--teal-color)", hex: "#009688" },
  { name: "Green", variable: "var(--green-color)", hex: "#4CAF50" },
  { name: "Yellow", variable: "var(--yellow-color)", hex: "#FFEB3B" },
  { name: "Orange", variable: "var(--orange-color)", hex: "#FF9800" },
  { name: "Grey", variable: "var(--grey-color)", hex: "#9E9E9E" }
];
function previewHexFor(value) {
  const preset = HA_COLOR_PRESETS.find((p2) => p2.variable === value);
  if (preset) return preset.hex;
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r2, g2, b2] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${r2.toString(16).padStart(2, "0")}${g2.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;
  } catch {
    return "#888888";
  }
}
const popoverStyles = i$6`
  .popover {
    position: fixed;
    z-index: 999999;
    background: var(--card-background-color, #1c1c1c);
    border: 1px solid var(--divider-color, #383838);
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    width: 200px;
  }
  .container { display: flex; flex-direction: column; gap: 8px; }
  .presets { display: flex; flex-wrap: wrap; gap: 4px; }
  .preset {
    width: 24px; height: 24px;
    border-radius: 4px;
    border: 2px solid transparent;
    cursor: pointer;
  }
  .preset:hover { border-color: var(--primary-color, #03a9f4); }
  .preset.selected { border-color: var(--primary-color, #03a9f4); }
  .custom { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .custom input[type="color"] { width: 32px; height: 24px; padding: 0; border: none; }
  .custom input[type="text"] { flex: 1; padding: 4px; font-size: 12px; }
`;
let CmsColorPicker = class extends i$3 {
  constructor() {
    super(...arguments);
    this.value = "#ffffff";
    this.compact = false;
    this._popoverOpen = false;
    this._popoverPos = null;
    this._portalHost = null;
    this._portalShadow = null;
    this._containingDialog = null;
    this._outsideClickHandler = (e2) => {
      const path = e2.composedPath();
      if (!path.includes(this) && !(this._portalHost && path.includes(this._portalHost))) {
        this._closePopover();
      }
    };
    this._paletteChangedHandler = () => {
      this.requestUpdate();
      if (this._popoverOpen) this._renderPortalContent();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(PALETTE_CHANGED_EVENT, this._paletteChangedHandler);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(PALETTE_CHANGED_EVENT, this._paletteChangedHandler);
    this._destroyPortal();
  }
  render() {
    if (!this.compact) {
      return this._renderPickerBody();
    }
    return b`
      <button
        class="swatch-trigger"
        style="background: ${previewHexFor(this.value)}"
        title="${this.value}"
        @click=${this._toggleCompactPopover}
      ></button>
    `;
  }
  updated() {
    if (this._popoverOpen) this._renderPortalContent();
  }
  _renderPickerBody() {
    const customColors = getCachedPalette().colors;
    return b`
      <div class="container">
        <div class="presets">
          ${HA_COLOR_PRESETS.map((p2) => b`
            <div
              class="preset ${this.value === p2.variable ? "selected" : ""}"
              style="background: ${p2.hex}"
              title="${p2.name} (${p2.variable})"
              @click=${() => this._selectPreset(p2)}
            ></div>
          `)}
        </div>
        ${customColors.length > 0 ? b`<div class="presets" title="My colors">
              ${customColors.map((c2) => b`
                <div
                  class="preset ${this.value === c2.hex ? "selected" : ""}"
                  style="background: ${c2.hex}"
                  title="${c2.name || c2.hex}"
                  @click=${() => this._selectCustom(c2.hex)}
                ></div>
              `)}
            </div>` : A}
        <div class="custom">
          <input type="color" .value=${this._toHex(this.value)} @input=${this._onColorInput} />
          <input type="text" .value=${this.value} @change=${this._onTextChange} placeholder="Color or var(--name)" />
        </div>
      </div>
    `;
  }
  /**
   * Renders the popover into a <div> appended outside this element's own
   * shadow DOM, to escape two independent problems HA's card-edit dialog
   * causes for a normal shadow-DOM `position: fixed` child:
   *
   * 1. The dialog nests a native <dialog> two shadow roots deep (ha-dialog
   *    -> wa-dialog -> <dialog>), which carries `transform: matrix(1,0,0,1,0,0)`
   *    — an identity matrix with no visible effect, but per the CSS spec
   *    *any* transform value other than `none` still establishes a new
   *    containing block for `position: fixed` descendants (and clips them
   *    via the dialog's own `overflow: hidden`). A popover positioned with
   *    viewport-relative getBoundingClientRect() coordinates renders
   *    hundreds of pixels off from its trigger as a result.
   * 2. The dialog is shown via showModal(), which promotes it to the
   *    browser's "top layer" — content paints above *any* top-layer
   *    element only if it is itself in the top layer (or a descendant of
   *    one); no z-index outside the dialog can win against it.
   *
   * These two pull in opposite directions: escaping (1) means rendering
   * outside the dialog (e.g. straight on document.body), but that loses
   * the top-layer promotion needed for (2), making the popover invisible
   * behind the modal. The fix used here: find the nearest open modal
   * <dialog> ancestor and append the portal as ITS direct child instead —
   * that keeps the popover in the top layer (fixing #2), and since the
   * dialog is now deliberately the portal's containing block, position is
   * computed relative to the dialog's own rect instead of the viewport's
   * (see _toggleCompactPopover), which is correct *because of* #1, not in
   * spite of it. Falls back to document.body (viewport-relative) when
   * there's no dialog ancestor, e.g. this component used standalone.
   *
   * Confirmed empirically against a live HA instance for both problems.
   */
  _ensurePortal() {
    if (!this._portalShadow) {
      this._portalHost = document.createElement("div");
      (this._containingDialog ?? document.body).appendChild(this._portalHost);
      this._portalShadow = this._portalHost.attachShadow({ mode: "open" });
    }
    return this._portalShadow;
  }
  _renderPortalContent() {
    if (!this._portalShadow || !this._popoverPos) return;
    D(
      b`
        <style>${popoverStyles}</style>
        <div
          class="popover"
          style="top: ${this._popoverPos.top}px; left: ${this._popoverPos.left}px;"
          @click=${(e2) => e2.stopPropagation()}
        >
          ${this._renderPickerBody()}
        </div>
      `,
      this._portalShadow,
      { host: this }
    );
  }
  _destroyPortal() {
    document.removeEventListener("click", this._outsideClickHandler, true);
    this._portalHost?.remove();
    this._portalHost = null;
    this._portalShadow = null;
    this._containingDialog = null;
  }
  _toggleCompactPopover(e2) {
    e2.stopPropagation();
    if (this._popoverOpen) {
      this._closePopover();
      return;
    }
    const trigger = e2.currentTarget;
    const rect = trigger.getBoundingClientRect();
    this._containingDialog = findModalDialogAncestor(this);
    const bounds = this._containingDialog ? this._containingDialog.getBoundingClientRect() : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    const relLeft = rect.left - bounds.left;
    const relTop = rect.top - bounds.top;
    const relBottom = rect.bottom - bounds.top;
    const left = Math.max(8, Math.min(relLeft, bounds.width - 216));
    const ESTIMATED_HEIGHT = 132;
    const top = relBottom + ESTIMATED_HEIGHT + 4 <= bounds.height ? relBottom + 4 : Math.max(8, relTop - ESTIMATED_HEIGHT - 4);
    this._popoverPos = { top, left };
    this._popoverOpen = true;
    this._ensurePortal();
    this._renderPortalContent();
    document.addEventListener("click", this._outsideClickHandler, true);
  }
  _closePopover() {
    this._popoverOpen = false;
    this._popoverPos = null;
    this._destroyPortal();
  }
  _selectPreset(preset) {
    this.value = preset.variable;
    this._emit();
    if (this.compact) this._closePopover();
  }
  /** A palette-manager color — written as its plain hex value, which every
   *  recognizer already round-trips (unlike inventing a CSS variable no
   *  theme defines). */
  _selectCustom(hex) {
    this.value = hex;
    this._emit();
    if (this.compact) this._closePopover();
  }
  _onColorInput(e2) {
    this.value = e2.target.value;
    this._emit();
  }
  _onTextChange(e2) {
    this.value = e2.target.value;
    this._emit();
    if (this.compact) this._closePopover();
  }
  _toHex(val) {
    if (val.startsWith("var(")) {
      const preset = HA_COLOR_PRESETS.find((p2) => p2.variable === val);
      return preset?.hex || "#888888";
    }
    return val;
  }
  _emit() {
    this.dispatchEvent(new CustomEvent("color-changed", {
      detail: { value: this.value },
      bubbles: true,
      composed: true
    }));
  }
};
CmsColorPicker.styles = i$6`
    :host { display: block; }
    .container { display: flex; flex-direction: column; gap: 8px; }
    .presets { display: flex; flex-wrap: wrap; gap: 4px; }
    .preset {
      width: 24px; height: 24px;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
    }
    .preset:hover { border-color: var(--primary-color, #03a9f4); }
    .preset.selected { border-color: var(--primary-color, #03a9f4); }
    .custom { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .custom input[type="color"] { width: 32px; height: 24px; padding: 0; border: none; }
    .custom input[type="text"] { flex: 1; padding: 4px; font-size: 12px; }

    .swatch-trigger {
      width: 32px;
      height: 24px;
      padding: 0;
      border: 1px solid var(--divider-color, #383838);
      border-radius: 4px;
      cursor: pointer;
    }
  `;
__decorateClass$f([
  n2()
], CmsColorPicker.prototype, "value", 2);
__decorateClass$f([
  n2({ type: Boolean })
], CmsColorPicker.prototype, "compact", 2);
__decorateClass$f([
  r()
], CmsColorPicker.prototype, "_popoverOpen", 2);
__decorateClass$f([
  r()
], CmsColorPicker.prototype, "_popoverPos", 2);
CmsColorPicker = __decorateClass$f([
  t$2("cms-color-picker")
], CmsColorPicker);
var __defProp$e = Object.defineProperty;
var __decorateClass$e = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$e(target, key, result);
  return result;
};
class IconColorModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = {
      ...DEFAULT_ICON_COLOR
    };
    this.stateAware = true;
    this.isLightCard = false;
    this.allowSize = false;
    this.cardEntity = "";
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
  }
  static {
    this.styles = [moduleStyles];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    const detail = { ...this.state, ...changes };
    this.dispatchEvent(
      new CustomEvent("state-changed", { detail })
    );
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🎨 Icon Color</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    const mode = this.state.mode;
    const ownEntityUseless = !this.stateAware && !this.state.entityId;
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Color mode</span>
          <div class="control-right">
            <select
              .value=${mode}
              @change=${(e2) => this._emit({
      mode: e2.target.value
    })}
            >
              <option value="plain" ?selected=${mode === "plain"}>
                One fixed color
              </option>
              <option value="conditional" ?selected=${mode === "conditional"}>
                Different for ON / OFF
              </option>
              ${this.isLightCard ? b`<option value="light" ?selected=${mode === "light"}>
                    Match the light's color
                  </option>` : A}
            </select>
          </div>
        </div>
        <div class="when-hint">
          ${mode === "plain" ? "One color, shown all the time." : mode === "light" ? "Uses the light's real color while on; your chosen color while off." : "One color while the controlling entity is on, another while off."}
        </div>
        ${mode !== "plain" ? b`
              <div class="control-row">
                <span class="control-label">Controlled by</span>
                <div class="control-right">
                  <cms-entity-picker
                    .hass=${this.hass}
                    .value=${this.state.entityId ?? ""}
                    .includeDomains=${mode === "light" ? ["light"] : TOGGLE_DOMAINS}
                    .placeholder=${this.stateAware ? this.cardEntity : "binary_sensor.example"}
                    label="Entity (default: this card's entity)"
                    @value-changed=${(e2) => this._emit({ entityId: e2.detail.value.trim() })}
                  ></cms-entity-picker>
                </div>
              </div>
              <div class="when-hint" style=${ownEntityUseless ? "color:var(--warning-color,#ffa600)" : ""}>
                ${this.state.entityId ? `Uses ${this.state.entityId}'s on/off state, not this card's own entity.` : ownEntityUseless ? `This card's entity (${this.cardEntity || "none"}) has no on/off state of its own — pick a toggleable entity above, or this mode won't do anything.` : "Leave empty to use this card's own entity."}
              </div>
            ` : A}

        ${mode === "plain" ? b`
              <div class="control-row">
                <span class="control-label">Color</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.color}
                    @color-changed=${(e2) => this._emit({ color: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
            ` : mode === "light" ? b`
              <div class="control-row">
                <span class="control-label">Color when OFF</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.colorOff}
                    @color-changed=${(e2) => this._emit({ colorOff: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
              <div class="when-hint">When ON: uses the light's actual color automatically.</div>
            ` : b`
              <div class="control-row">
                <span class="control-label">Color when ON</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.colorOn}
                    @color-changed=${(e2) => this._emit({ colorOn: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
              <div class="control-row">
                <span class="control-label">Color when OFF</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.colorOff}
                    @color-changed=${(e2) => this._emit({ colorOff: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
            `}
        ${this.allowSize ? this._renderSize() : A}
      </div>
    `;
  }
  /** Icon size (v0.9) — 0 = leave the theme size alone; with a condition,
   *  the size switches between "Icon size" and "Size otherwise" (24px = the
   *  HA default when unset). */
  _renderSize() {
    const sizePx = this.state.sizePx ?? 0;
    return b`
      <div class="control-row">
        <span class="control-label">Icon size</span>
        <div class="control-right">
          <ha-slider
            min="0"
            max="64"
            step="2"
            .value=${String(sizePx)}
            @change=${(e2) => {
      const v2 = parseFloat(e2.target.value);
      this._emit(
        v2 > 0 ? { sizePx: v2 } : { sizePx: void 0, sizeOffPx: void 0, sizeWhen: void 0 }
      );
    }}
          ></ha-slider>
          <span class="value-label">${sizePx > 0 ? `${sizePx}px` : "theme"}</span>
        </div>
      </div>
      ${sizePx > 0 ? b`
            ${renderCondition({
      condition: this.state.sizeWhen,
      stateAware: this.stateAware,
      noun: "icon size",
      hass: this.hass,
      onChange: (c2) => this._emit({ sizeWhen: c2 })
    })}
            ${this.state.sizeWhen && this.state.sizeWhen.when !== "always" ? b`
                  <div class="control-row">
                    <span class="control-label">Size otherwise</span>
                    <div class="control-right">
                      <ha-slider
                        min="16"
                        max="64"
                        step="2"
                        .value=${String(this.state.sizeOffPx ?? 24)}
                        @change=${(e2) => this._emit({
      sizeOffPx: parseFloat(e2.target.value)
    })}
                      ></ha-slider>
                      <span class="value-label">${this.state.sizeOffPx ?? 24}px</span>
                    </div>
                  </div>
                ` : A}
          ` : A}
    `;
  }
}
__decorateClass$e([
  n2({ attribute: false })
], IconColorModule.prototype, "state");
__decorateClass$e([
  n2({ type: Boolean, attribute: "state-aware" })
], IconColorModule.prototype, "stateAware");
__decorateClass$e([
  n2({ type: Boolean, attribute: "is-light-card" })
], IconColorModule.prototype, "isLightCard");
__decorateClass$e([
  n2({ type: Boolean, attribute: "allow-size" })
], IconColorModule.prototype, "allowSize");
__decorateClass$e([
  n2({ type: String })
], IconColorModule.prototype, "cardEntity");
__decorateClass$e([
  n2({ attribute: false })
], IconColorModule.prototype, "hass");
__decorateClass$e([
  n2({ attribute: false })
], IconColorModule.prototype, "overridden");
__decorateClass$e([
  n2({ attribute: false })
], IconColorModule.prototype, "overriddenDetail");
__decorateClass$e([
  r()
], IconColorModule.prototype, "_open");
customElements.define("cms-icon-color-module", IconColorModule);
var __defProp$d = Object.defineProperty;
var __decorateClass$d = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$d(target, key, result);
  return result;
};
class AccentColorModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = {
      ...DEFAULT_ACCENT_COLOR
    };
    this.stateAware = true;
    this.cardEntity = "";
    this.cardType = "";
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
  }
  static {
    this.styles = [moduleStyles];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { ...this.state, ...changes }
      })
    );
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🌈 Accent Color</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    const mode = this.state.mode;
    const ownEntityUseless = !this.stateAware && !this.state.entityId;
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Color mode</span>
          <div class="control-right">
            <select
              .value=${mode}
              @change=${(e2) => this._emit({
      mode: e2.target.value
    })}
            >
              <option value="plain" ?selected=${mode === "plain"}>One fixed color</option>
              <option value="conditional" ?selected=${mode === "conditional"}>
                Different for ON / OFF
              </option>
            </select>
          </div>
        </div>
        <div class="when-hint">
          ${mode === "plain" ? "One color, shown all the time." : "One color while the controlling entity is on, another while off."}
        </div>
        ${this.cardType === "gauge" ? b`<div class="when-hint">
              Colors the gauge dial — or, with <code>needle: true</code>, the needle and
              value text (the dial itself shows your configured segment colors there).
            </div>` : A}

        ${mode === "conditional" ? b`
              <div class="control-row">
                <span class="control-label">Controlled by</span>
                <div class="control-right">
                  <cms-entity-picker
                    .hass=${this.hass}
                    .value=${this.state.entityId ?? ""}
                    .includeDomains=${TOGGLE_DOMAINS}
                    .placeholder=${this.stateAware ? this.cardEntity : "binary_sensor.example"}
                    label="Entity (default: this card's entity)"
                    @value-changed=${(e2) => this._emit({ entityId: e2.detail.value.trim() })}
                  ></cms-entity-picker>
                </div>
              </div>
              <div class="when-hint" style=${ownEntityUseless ? "color:var(--warning-color,#ffa600)" : ""}>
                ${this.state.entityId ? `Uses ${this.state.entityId}'s on/off state, not this card's own entity.` : ownEntityUseless ? `This card's entity (${this.cardEntity || "none"}) has no on/off state of its own — pick a toggleable entity above, or this mode won't do anything.` : "Leave empty to use this card's own entity."}
              </div>
            ` : A}

        ${mode === "plain" ? b`
              <div class="control-row">
                <span class="control-label">Color</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.color}
                    @color-changed=${(e2) => this._emit({ color: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
            ` : b`
              <div class="control-row">
                <span class="control-label">Color when ON</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.colorOn}
                    @color-changed=${(e2) => this._emit({ colorOn: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
              <div class="control-row">
                <span class="control-label">Color when OFF</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.colorOff}
                    @color-changed=${(e2) => this._emit({ colorOff: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
            `}
      </div>
    `;
  }
}
__decorateClass$d([
  n2({ attribute: false })
], AccentColorModule.prototype, "state");
__decorateClass$d([
  n2({ type: Boolean, attribute: "state-aware" })
], AccentColorModule.prototype, "stateAware");
__decorateClass$d([
  n2({ type: String })
], AccentColorModule.prototype, "cardEntity");
__decorateClass$d([
  n2({ type: String })
], AccentColorModule.prototype, "cardType");
__decorateClass$d([
  n2({ attribute: false })
], AccentColorModule.prototype, "hass");
__decorateClass$d([
  n2({ attribute: false })
], AccentColorModule.prototype, "overridden");
__decorateClass$d([
  n2({ attribute: false })
], AccentColorModule.prototype, "overriddenDetail");
__decorateClass$d([
  r()
], AccentColorModule.prototype, "_open");
customElements.define("cms-accent-color-module", AccentColorModule);
var __defProp$c = Object.defineProperty;
var __decorateClass$c = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$c(target, key, result);
  return result;
};
class BackgroundModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = {
      ...DEFAULT_BACKGROUND
    };
    this.stateAware = true;
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
    this._angle = DEFAULT_BACKGROUND.angle;
  }
  static {
    this.styles = [moduleStyles, i$6``];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
      this._angle = this.state.angle;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { ...this.state, ...changes }
      })
    );
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🖼️ Background</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Type</span>
          <div class="control-right">
            <select
              .value=${this.state.type}
              @change=${(e2) => this._emit({
      type: e2.target.value
    })}
            >
              <option value="solid" ?selected=${this.state.type === "solid"}>Solid color</option>
              <option value="gradient" ?selected=${this.state.type === "gradient"}>
                Gradient
              </option>
            </select>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">
            ${this.state.type === "gradient" ? "Color 1" : "Color"}
          </span>
          <div class="control-right">
            <cms-color-picker
              .value=${this.state.color1}
              @color-changed=${(e2) => this._emit({ color1: e2.detail.value })}
            ></cms-color-picker>
          </div>
        </div>

        ${this.state.type === "gradient" ? b`
              <div class="control-row">
                <span class="control-label">Color 2</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.color2}
                    @color-changed=${(e2) => this._emit({ color2: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>

              <div class="control-row">
                <span class="control-label">Angle</span>
                <div class="control-right">
                  <ha-slider
                    min="0"
                    max="360"
                    step="5"
                    .value=${String(this._angle)}
                    @input=${(e2) => {
      this._angle = parseFloat(e2.target.value);
    }}
                    @change=${(e2) => this._emit({
      angle: parseFloat(e2.target.value)
    })}
                  ></ha-slider>
                  <span class="value-label">${this._angle}°</span>
                </div>
              </div>
            ` : A}

        ${renderWhen({
      value: this.state.applyWhen,
      stateAware: this.stateAware,
      noun: "background",
      allowCustom: true,
      customEntity: this.state.customEntity,
      hass: this.hass,
      onChange: (v2) => this._emit({ applyWhen: v2 }),
      onCustomEntity: (id) => this._emit({ customEntity: id })
    })}
      </div>
    `;
  }
}
__decorateClass$c([
  n2({ attribute: false })
], BackgroundModule.prototype, "state");
__decorateClass$c([
  n2({ type: Boolean, attribute: "state-aware" })
], BackgroundModule.prototype, "stateAware");
__decorateClass$c([
  n2({ attribute: false })
], BackgroundModule.prototype, "hass");
__decorateClass$c([
  n2({ attribute: false })
], BackgroundModule.prototype, "overridden");
__decorateClass$c([
  n2({ attribute: false })
], BackgroundModule.prototype, "overriddenDetail");
__decorateClass$c([
  r()
], BackgroundModule.prototype, "_open");
__decorateClass$c([
  r()
], BackgroundModule.prototype, "_angle");
customElements.define("cms-background-module", BackgroundModule);
var __defProp$b = Object.defineProperty;
var __decorateClass$b = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$b(target, key, result);
  return result;
};
const PRESETS = [
  { value: "pulse", label: "Pulse (gentle scale)" },
  { value: "breathe", label: "Breathe (opacity fade)" },
  { value: "gradient-shift", label: "Gradient Shift (requires gradient bg)" },
  { value: "blink", label: "Blink (alert pulse)" },
  { value: "bounce", label: "Bounce (vertical)" },
  { value: "shake", label: "Shake (horizontal)" },
  { value: "spin", label: "Spin (360° rotation)" },
  { value: "glow", label: "Glow (pulsing shadow)" },
  { value: "heartbeat", label: "Heartbeat (double beat)" }
];
const VALUE_OPERATORS = ["<", "<=", ">", ">=", "==", "!="];
class AnimationModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = {
      ...DEFAULT_ANIMATION
    };
    this.stateAware = true;
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
    this._speedS = DEFAULT_ANIMATION.speedS;
  }
  static {
    this.styles = [
      moduleStyles,
      i$6`
      input[type='number'] {
        width: 80px;
        padding: 4px 6px;
        font-size: 12px;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #e1e1e1);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 4px;
      }
    `
    ];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
      this._speedS = this.state.speedS;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { ...this.state, ...changes }
      })
    );
  }
  _onTriggerChange(trigger) {
    const changes = { trigger };
    if (trigger === "value") {
      changes.valueOperator = this.state.valueOperator ?? ">";
      changes.valueThreshold = this.state.valueThreshold ?? 0;
    }
    this._emit(changes);
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">✨ Animation</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Preset</span>
          <div class="control-right">
            <select
              .value=${this.state.preset}
              @change=${(e2) => this._emit({
      preset: e2.target.value
    })}
            >
              ${PRESETS.map(
      (p2) => b`
                  <option value=${p2.value} ?selected=${this.state.preset === p2.value}>
                    ${p2.label}
                  </option>
                `
    )}
            </select>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Speed</span>
          <div class="control-right">
            <ha-slider
              min="0.5"
              max="10"
              step="0.5"
              .value=${String(this._speedS)}
              @input=${(e2) => {
      this._speedS = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      speedS: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._speedS}s</span>
          </div>
        </div>

        ${this._renderTrigger()}

        ${this.state.preset === "gradient-shift" ? b`<div class="when-hint">⚠️ Gradient Shift requires a gradient background to be set.</div>` : A}
      </div>
    `;
  }
  /**
   * Same options + hint conventions as the shared renderWhen control, plus
   * the animation-only "While a value matches…" trigger (renderWhen's
   * WhenValue union has no 'value', so the select is rendered locally).
   * On/off options follow renderWhen's rule: hidden on non-state-aware
   * cards unless one is already the stored value.
   */
  _renderTrigger() {
    const hasStateValue = this.state.trigger === "on" || this.state.trigger === "off";
    const showOnOff = this.stateAware || hasStateValue;
    const opts = [
      { v: "always", label: "Always" }
    ];
    if (showOnOff) {
      opts.push({ v: "on", label: "Only while entity is ON" });
      opts.push({ v: "off", label: "Only while entity is OFF" });
    }
    opts.push({ v: "custom", label: "While another entity is ON…" });
    opts.push({ v: "value", label: "While a value matches…" });
    return b`
      <div class="control-row">
        <span class="control-label">Apply when</span>
        <div class="control-right">
          <select
            .value=${this.state.trigger}
            @change=${(e2) => this._onTriggerChange(e2.target.value)}
          >
            ${opts.map(
      (opt) => b`<option value=${opt.v} ?selected=${this.state.trigger === opt.v}>
                  ${opt.label}
                </option>`
    )}
          </select>
        </div>
      </div>
      ${this.state.trigger === "custom" ? b`
            <div class="control-row">
              <span class="control-label">Entity</span>
              <div class="control-right">
                <cms-entity-picker
                  .hass=${this.hass}
                  .value=${this.state.customEntity ?? ""}
                  .includeDomains=${TOGGLE_DOMAINS}
                  label="Controlling entity"
                  placeholder="input_boolean.my_entity"
                  @value-changed=${(e2) => this._emit({ customEntity: e2.detail.value.trim() })}
                ></cms-entity-picker>
              </div>
            </div>
          ` : A}
      ${this.state.trigger === "value" ? this._renderValueCondition() : A}
      <div class="when-hint">${this._triggerHint()}</div>
    `;
  }
  _triggerHint() {
    switch (this.state.trigger) {
      case "on":
        return `Applies the animation only while this card's entity is on (removed when off).`;
      case "off":
        return `Applies the animation only while this card's entity is off (removed when on).`;
      case "custom":
        return `Applies the animation only while ${this.state.customEntity || "the chosen entity"} is on.`;
      case "value":
        return "Runs the animation only while the condition matches.";
      default:
        return "Always applies the animation.";
    }
  }
  /** Numeric attributes of the picked value entity (the condition compares
   *  via float(), so string/list attributes would always read 0). The stored
   *  attribute is always offered even when it's not currently numeric — an
   *  entity that's unavailable right now shouldn't hide the active selection.
   *  Same pattern as the Threshold module's _numericAttributes. */
  _numericAttributes() {
    const entityId = this.state.valueEntity ?? "";
    const attrs = this.hass?.states?.[entityId]?.attributes ?? {};
    const names = Object.keys(attrs).filter((k2) => {
      const v2 = attrs[k2];
      return typeof v2 === "number" || typeof v2 === "string" && v2.trim() !== "" && !isNaN(Number(v2));
    });
    const current = this.state.valueAttribute;
    if (current && !names.includes(current)) names.unshift(current);
    return names;
  }
  _renderAttributeSelect() {
    const options = this._numericAttributes();
    if (options.length === 0 && !this.state.valueAttribute) return A;
    return b`
      <div class="control-row">
        <span class="control-label">Value read from</span>
        <div class="control-right">
          <select
            .value=${this.state.valueAttribute ?? ""}
            @change=${(e2) => this._emit({ valueAttribute: e2.target.value })}
          >
            <option value="" ?selected=${!this.state.valueAttribute}>State (default)</option>
            ${options.map(
      (name) => b`<option value=${name} ?selected=${this.state.valueAttribute === name}>
                Attribute: ${name}
              </option>`
    )}
          </select>
        </div>
      </div>
    `;
  }
  _renderValueCondition() {
    return b`
      <div class="control-row">
        <span class="control-label">Entity</span>
        <div class="control-right">
          <cms-entity-picker
            .hass=${this.hass}
            .value=${this.state.valueEntity ?? ""}
            label="Entity the value is read from"
            placeholder="sensor.temperature"
            @value-changed=${(e2) => this._emit({ valueEntity: e2.detail.value.trim(), valueAttribute: "" })}
          ></cms-entity-picker>
        </div>
      </div>
      ${this._renderAttributeSelect()}
      <div class="control-row">
        <span class="control-label">Condition</span>
        <div class="control-right">
          <select
            .value=${this.state.valueOperator ?? ">"}
            @change=${(e2) => this._emit({
      valueOperator: e2.target.value
    })}
          >
            ${VALUE_OPERATORS.map(
      (op) => b`<option value=${op} ?selected=${(this.state.valueOperator ?? ">") === op}>
                  value ${op}
                </option>`
    )}
          </select>
        </div>
      </div>
      <div class="control-row">
        <span class="control-label">Threshold</span>
        <div class="control-right">
          <input
            type="number"
            .value=${String(this.state.valueThreshold ?? 0)}
            @change=${(e2) => this._emit({
      valueThreshold: parseFloat(e2.target.value) || 0
    })}
          />
        </div>
      </div>
    `;
  }
}
__decorateClass$b([
  n2({ attribute: false })
], AnimationModule.prototype, "state");
__decorateClass$b([
  n2({ type: Boolean, attribute: "state-aware" })
], AnimationModule.prototype, "stateAware");
__decorateClass$b([
  n2({ attribute: false })
], AnimationModule.prototype, "hass");
__decorateClass$b([
  n2({ attribute: false })
], AnimationModule.prototype, "overridden");
__decorateClass$b([
  n2({ attribute: false })
], AnimationModule.prototype, "overriddenDetail");
__decorateClass$b([
  r()
], AnimationModule.prototype, "_open");
__decorateClass$b([
  r()
], AnimationModule.prototype, "_speedS");
customElements.define("cms-animation-module", AnimationModule);
var __defProp$a = Object.defineProperty;
var __decorateClass$a = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$a(target, key, result);
  return result;
};
class BorderModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = { ...DEFAULT_BORDER };
    this.stateAware = true;
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
    this._radiusPx = DEFAULT_BORDER.radiusPx;
    this._borderWidth = DEFAULT_BORDER.borderWidth;
  }
  static {
    this.styles = [moduleStyles, i$6``];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
      this._radiusPx = this.state.radiusPx;
      this._borderWidth = this.state.borderWidth;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { ...this.state, ...changes }
      })
    );
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">⬛ Border & Radius</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Border radius</span>
          <div class="control-right">
            <ha-slider
              min="0"
              max="50"
              step="1"
              .value=${String(this._radiusPx)}
              @input=${(e2) => {
      this._radiusPx = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      radiusPx: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._radiusPx}px</span>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Border width</span>
          <div class="control-right">
            <ha-slider
              min="0"
              max="8"
              step="1"
              .value=${String(this._borderWidth)}
              @input=${(e2) => {
      this._borderWidth = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      borderWidth: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._borderWidth}px</span>
          </div>
        </div>

        ${this.state.borderWidth > 0 || this._borderWidth > 0 ? b`
              <div class="control-row">
                <span class="control-label">Border color</span>
                <div class="control-right">
                  <cms-color-picker
                    .value=${this.state.borderColor}
                    @color-changed=${(e2) => this._emit({ borderColor: e2.detail.value })}
                  ></cms-color-picker>
                </div>
              </div>
              ${renderCondition({
      condition: this.state.widthWhen,
      stateAware: this.stateAware,
      noun: "border",
      hass: this.hass,
      onChange: (c2) => this._emit({ widthWhen: c2 })
    })}
              ${this.state.widthWhen && this.state.widthWhen.when !== "always" ? b`
                    <div class="control-row">
                      <span class="control-label">Width otherwise</span>
                      <div class="control-right">
                        <ha-slider
                          min="0"
                          max="8"
                          step="1"
                          .value=${String(this.state.widthOffPx ?? 0)}
                          @change=${(e2) => this._emit({
      widthOffPx: parseFloat(e2.target.value)
    })}
                        ></ha-slider>
                        <span class="value-label">
                          ${(this.state.widthOffPx ?? 0) > 0 ? `${this.state.widthOffPx}px` : "no border"}
                        </span>
                      </div>
                    </div>
                  ` : A}
            ` : A}
      </div>
    `;
  }
}
__decorateClass$a([
  n2({ attribute: false })
], BorderModule.prototype, "state");
__decorateClass$a([
  n2({ type: Boolean, attribute: "state-aware" })
], BorderModule.prototype, "stateAware");
__decorateClass$a([
  n2({ attribute: false })
], BorderModule.prototype, "hass");
__decorateClass$a([
  n2({ attribute: false })
], BorderModule.prototype, "overridden");
__decorateClass$a([
  n2({ attribute: false })
], BorderModule.prototype, "overriddenDetail");
__decorateClass$a([
  r()
], BorderModule.prototype, "_open");
__decorateClass$a([
  r()
], BorderModule.prototype, "_radiusPx");
__decorateClass$a([
  r()
], BorderModule.prototype, "_borderWidth");
customElements.define("cms-border-module", BorderModule);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const u = (e2, s2, t2) => {
  const r2 = /* @__PURE__ */ new Map();
  for (let l2 = s2; l2 <= t2; l2++) r2.set(e2[l2], l2);
  return r2;
}, c = e(class extends i$2 {
  constructor(e2) {
    if (super(e2), e2.type !== t$1.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(e2, s2, t2) {
    let r2;
    void 0 === t2 ? t2 = s2 : void 0 !== s2 && (r2 = s2);
    const l2 = [], o2 = [];
    let i4 = 0;
    for (const s3 of e2) l2[i4] = r2 ? r2(s3, i4) : i4, o2[i4] = t2(s3, i4), i4++;
    return { values: o2, keys: l2 };
  }
  render(e2, s2, t2) {
    return this.dt(e2, s2, t2).values;
  }
  update(s2, [t2, r2, c2]) {
    const d2 = M(s2), { values: p$12, keys: a2 } = this.dt(t2, r2, c2);
    if (!Array.isArray(d2)) return this.ut = a2, p$12;
    const h$12 = this.ut ??= [], v$12 = [];
    let m2, y3, x2 = 0, j2 = d2.length - 1, k2 = 0, w = p$12.length - 1;
    for (; x2 <= j2 && k2 <= w; ) if (null === d2[x2]) x2++;
    else if (null === d2[j2]) j2--;
    else if (h$12[x2] === a2[k2]) v$12[k2] = u$1(d2[x2], p$12[k2]), x2++, k2++;
    else if (h$12[j2] === a2[w]) v$12[w] = u$1(d2[j2], p$12[w]), j2--, w--;
    else if (h$12[x2] === a2[w]) v$12[w] = u$1(d2[x2], p$12[w]), v(s2, v$12[w + 1], d2[x2]), x2++, w--;
    else if (h$12[j2] === a2[k2]) v$12[k2] = u$1(d2[j2], p$12[k2]), v(s2, d2[x2], d2[j2]), j2--, k2++;
    else if (void 0 === m2 && (m2 = u(a2, k2, w), y3 = u(h$12, x2, j2)), m2.has(h$12[x2])) if (m2.has(h$12[j2])) {
      const e2 = y3.get(a2[k2]), t3 = void 0 !== e2 ? d2[e2] : null;
      if (null === t3) {
        const e3 = v(s2, d2[x2]);
        u$1(e3, p$12[k2]), v$12[k2] = e3;
      } else v$12[k2] = u$1(t3, p$12[k2]), v(s2, d2[x2], t3), d2[e2] = null;
      k2++;
    } else h(d2[j2]), j2--;
    else h(d2[x2]), x2++;
    for (; k2 <= w; ) {
      const e2 = v(s2, v$12[w + 1]);
      u$1(e2, p$12[k2]), v$12[k2++] = e2;
    }
    for (; x2 <= j2; ) {
      const e2 = d2[x2++];
      null !== e2 && h(e2);
    }
    return this.ut = a2, p(s2, v$12), E;
  }
});
var __defProp$9 = Object.defineProperty;
var __decorateClass$9 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$9(target, key, result);
  return result;
};
const PROPERTY_OPTIONS = [
  { value: "icon-color", label: "Icon Color" },
  { value: "accent-color", label: "Accent Color" },
  { value: "background", label: "Background" },
  { value: "text-color", label: "Text Color" },
  { value: "border-color", label: "Border Color" }
];
const NO_ICON_PROPERTY_TYPES = NO_ICON_COLOR_TYPES;
class ThresholdModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = {
      ...DEFAULT_THRESHOLD
    };
    this.cardEntity = "";
    this.cardType = "";
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
  }
  static {
    this.styles = [
      moduleStyles,
      i$6`
      .rule {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
      }
      .rule select,
      .rule input[type='number'] {
        padding: 4px 6px;
        font-size: 12px;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #e1e1e1);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 4px;
      }
      .rule input[type='number'] {
        width: 70px;
      }
      .rule select {
        width: 60px;
      }
      .rule button {
        padding: 2px 8px;
        cursor: pointer;
        background: rgba(255, 0, 0, 0.15);
        color: #ff6b6b;
        border: 1px solid rgba(255, 0, 0, 0.3);
        border-radius: 4px;
        font-size: 14px;
        line-height: 1;
      }
      .rule button:hover {
        background: rgba(255, 0, 0, 0.25);
      }
      .rule-label {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
      }
      .add-btn {
        margin-top: 8px;
        padding: 6px 12px;
        cursor: pointer;
        background: rgba(33, 150, 243, 0.15);
        color: #2196f3;
        border: 1px solid rgba(33, 150, 243, 0.3);
        border-radius: 4px;
        font-size: 12px;
        width: 100%;
      }
      .add-btn:hover {
        background: rgba(33, 150, 243, 0.25);
      }
      .property-checks {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .property-check {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        cursor: pointer;
      }
      .property-check input {
        cursor: pointer;
      }
      .rules-container {
        margin-top: 12px;
      }
      .rules-label {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
        margin-bottom: 8px;
        display: block;
      }
      .legend {
        margin-top: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .legend-title {
        font-size: 11px;
        font-weight: 600;
        color: var(--secondary-text-color, #9e9e9e);
        margin-bottom: 2px;
      }
      .legend-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
      }
      .legend-cond {
        color: var(--primary-text-color, #e1e1e1);
        font-variant-numeric: tabular-nums;
      }
      .legend-sw {
        width: 26px;
        height: 16px;
        border-radius: 3px;
        border: 1px solid var(--divider-color, #383838);
        flex-shrink: 0;
      }
      .stop {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
      }
      .stop input[type='number'] {
        width: 80px;
        padding: 4px 6px;
        font-size: 12px;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #e1e1e1);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 4px;
      }
      .stop-move {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .move-btn {
        padding: 0 4px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.06);
        color: var(--secondary-text-color, #9e9e9e);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 3px;
        font-size: 9px;
        line-height: 1.4;
      }
      .move-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
        color: var(--primary-text-color, #e1e1e1);
      }
      .move-btn:disabled {
        opacity: 0.3;
        cursor: default;
      }
      .gradient-bar {
        height: 20px;
        border-radius: 4px;
        border: 1px solid var(--divider-color, #383838);
        margin-bottom: 6px;
      }
      .gradient-labels {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: var(--secondary-text-color, #9e9e9e);
        font-variant-numeric: tabular-nums;
        margin-bottom: 12px;
      }
    `
    ];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    const newState = { ...this.state, ...changes };
    if (changes.enabled && !newState.entityId && this.cardEntity) {
      newState.entityId = this.cardEntity;
    }
    if (changes.enabled && NO_ICON_PROPERTY_TYPES.has(this.cardType) && newState.rules.length === 0 && newState.properties.length === 1 && newState.properties[0] === "icon-color") {
      newState.properties = [this.cardType === "gauge" ? "accent-color" : "background"];
    }
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: newState
      })
    );
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🎯 Threshold Colors</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _toggleProperty(value, checked) {
    const properties = checked ? [...this.state.properties, value] : this.state.properties.filter((p2) => p2 !== value);
    this._emit({ properties });
  }
  /** PROPERTY_OPTIONS filtered/relabelled for this card type. A property
   *  already selected (e.g. parsed from existing YAML) is always shown so
   *  it stays visible and un-checkable rather than invisibly stuck on. */
  _propertyOptions() {
    return PROPERTY_OPTIONS.filter(
      (opt) => opt.value !== "icon-color" || !NO_ICON_PROPERTY_TYPES.has(this.cardType) || this.state.properties.includes("icon-color")
    ).map(
      (opt) => opt.value === "accent-color" && this.cardType === "gauge" ? { ...opt, label: "Gauge / Accent Color" } : opt
    );
  }
  _renderBody() {
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Entity</span>
        </div>
        <cms-entity-picker
          .hass=${this.hass}
          .value=${this.state.entityId}
          .placeholder=${this.cardEntity || "sensor.temperature"}
          label="Entity these rules read from"
          @value-changed=${(e2) => this._emit({ entityId: e2.detail.value.trim(), attribute: "" })}
        ></cms-entity-picker>

        ${this._renderAttributeSelect()}

        <div class="control-row">
          <span class="control-label">Apply to</span>
        </div>
        <div class="property-checks">
          ${this._propertyOptions().map(
      (opt) => b`
              <label class="property-check">
                <input
                  type="checkbox"
                  .checked=${this.state.properties.includes(opt.value)}
                  @change=${(e2) => this._toggleProperty(opt.value, e2.target.checked)}
                />
                ${opt.label}
              </label>
            `
    )}
        </div>
        ${this.state.properties.length === 0 ? b`<div class="when-hint">Select at least one property above to apply these rules.</div>` : A}

        ${this.state.properties.includes("border-color") ? b`
              <div class="control-row">
                <span class="control-label">Border width</span>
                <div class="control-right">
                  <ha-slider
                    min="1"
                    max="16"
                    step="1"
                    .value=${String(this.state.borderWidth ?? 2)}
                    @change=${(e2) => this._emit({
      borderWidth: Math.max(1, parseFloat(e2.target.value) || 2)
    })}
                  ></ha-slider>
                  <span class="value-label">${this.state.borderWidth ?? 2}px</span>
                </div>
              </div>
            ` : A}

        <div class="control-row" style="margin-top: 12px;">
          <span class="control-label">Value mode</span>
          <div class="control-right">
            <select
              .value=${this.state.valueMode}
              @change=${(e2) => this._emit({
      valueMode: e2.target.value
    })}
            >
              <option value="switch" ?selected=${this.state.valueMode === "switch"}>
                Step — color switches at each rule
              </option>
              <option value="gradient" ?selected=${this.state.valueMode === "gradient"}>
                Fade — color blends smoothly between points
              </option>
            </select>
          </div>
        </div>

        ${this.state.valueMode === "gradient" ? this._renderGradientBody() : this._renderSwitchBody()}
      </div>
    `;
  }
  /** Numeric attributes of the picked entity (rules compare via float(),
   *  so string/list attributes would always read 0). The stored attribute
   *  is always offered even when it's not currently numeric — an entity
   *  that's unavailable right now shouldn't hide the active selection. */
  _numericAttributes() {
    const entityId = this.state.entityId || this.cardEntity;
    const attrs = this.hass?.states?.[entityId]?.attributes ?? {};
    const names = Object.keys(attrs).filter((k2) => {
      const v2 = attrs[k2];
      return typeof v2 === "number" || typeof v2 === "string" && v2.trim() !== "" && !isNaN(Number(v2));
    });
    const current = this.state.attribute;
    if (current && !names.includes(current)) names.unshift(current);
    return names;
  }
  _renderAttributeSelect() {
    const options = this._numericAttributes();
    if (options.length === 0 && !this.state.attribute) return A;
    return b`
      <div class="control-row" style="margin-top: 8px;">
        <span class="control-label">Value read from</span>
        <div class="control-right">
          <select
            .value=${this.state.attribute ?? ""}
            @change=${(e2) => this._emit({ attribute: e2.target.value })}
          >
            <option value="" ?selected=${!this.state.attribute}>State (default)</option>
            ${options.map(
      (name) => b`<option value=${name} ?selected=${this.state.attribute === name}>
                Attribute: ${name}
              </option>`
    )}
          </select>
        </div>
      </div>
    `;
  }
  _renderSwitchBody() {
    return b`
      <div class="rules-container">
        <span class="rules-label">Rules — order doesn't matter, they're sorted automatically:</span>
        ${this.state.rules.map((rule, i4) => this._renderRule(rule, i4))}
        <button class="add-btn" @click=${this._addRule}>+ Add Rule</button>
      </div>

      <div class="control-row" style="margin-top: 12px;">
        <span class="control-label">Default color</span>
        <div class="control-right">
          <cms-color-picker
            compact
            .value=${this.state.defaultColor}
            @color-changed=${(e2) => this._emit({ defaultColor: e2.detail.value })}
          ></cms-color-picker>
          <span class="color-label">${this.state.defaultColor}</span>
        </div>
      </div>

      ${this._renderLegend()}
    `;
  }
  _renderGradientBody() {
    const stops = [...this.state.colorStops].sort((a2, b2) => a2.value - b2.value);
    return b`
      <div class="rules-container">
        <span class="rules-label">
          Points — the color fades smoothly between them; values outside this range stay
          clamped to the nearest end:
        </span>
        ${c(
      stops,
      (stop) => stop.id,
      (stop, sortedIndex) => this._renderStop(stop, sortedIndex, stops.length)
    )}
        <button class="add-btn" @click=${this._addStop}>+ Add Point</button>
      </div>
      ${this._renderGradientPreview(stops)}
    `;
  }
  _renderGradientPreview(stops) {
    if (stops.length < 2) {
      return b`<div class="when-hint">Add at least 2 points to see a preview.</div>`;
    }
    const hexStops = stops.map((s2) => `${previewHexFor(s2.color)} ${((s2.value - stops[0].value) / (stops[stops.length - 1].value - stops[0].value || 1) * 100).toFixed(1)}%`);
    return b`
      <div class="gradient-bar" style="background: linear-gradient(90deg, ${hexStops.join(", ")})"></div>
      <div class="gradient-labels">
        <span>${stops[0].value}</span>
        <span>${stops[stops.length - 1].value}</span>
      </div>
    `;
  }
  /**
   * Read-only "what actually happens" legend. Uses the exact same sort the
   * generator uses, so the colours shown here are the colours that will render.
   */
  _renderLegend() {
    const sorted = sortThresholdRules(this.state.rules);
    const defaultSwatch = b`<span
      class="legend-sw"
      style="background:${previewHexFor(this.state.defaultColor)}"
    ></span>`;
    if (sorted.length === 0) {
      return b`
        <div class="legend">
          <span class="legend-title">Result</span>
          <div class="legend-row">
            <span class="legend-cond">Always</span>${defaultSwatch}
          </div>
        </div>
      `;
    }
    return b`
      <div class="legend">
        <span class="legend-title">Result — first match wins (top to bottom)</span>
        ${sorted.map(
      (r2, i4) => b`
            <div class="legend-row">
              <span class="legend-cond">
                ${i4 === 0 ? "If" : "else if"} value ${r2.operator} ${r2.value}
              </span>
              <span class="legend-sw" style="background:${previewHexFor(r2.color)}"></span>
            </div>
          `
    )}
        <div class="legend-row">
          <span class="legend-cond">otherwise (default)</span>${defaultSwatch}
        </div>
      </div>
    `;
  }
  _renderRule(rule, index) {
    return b`
      <div class="rule">
        <span class="rule-label">If value</span>
        <select
          .value=${rule.operator}
          @change=${(e2) => this._onOperatorChange(index, e2.target.value)}
        >
          <option value="<" ?selected=${rule.operator === "<"}>&lt;</option>
          <option value="<=" ?selected=${rule.operator === "<="}>&lt;=</option>
          <option value=">" ?selected=${rule.operator === ">"}>&gt;</option>
          <option value=">=" ?selected=${rule.operator === ">="}>&gt;=</option>
          <option value="==" ?selected=${rule.operator === "=="}>==</option>
          <option value="!=" ?selected=${rule.operator === "!="}>!=</option>
        </select>
        <input
          type="number"
          .value=${String(rule.value)}
          @change=${(e2) => this._onValueChange(index, e2.target.value)}
        />
        <span class="rule-label">→</span>
        <cms-color-picker
          compact
          .value=${rule.color}
          @color-changed=${(e2) => this._onRuleColorChange(index, e2.detail.value)}
        ></cms-color-picker>
        <button @click=${() => this._removeRule(index)}>×</button>
      </div>
    `;
  }
  _renderStop(stop, sortedIndex, sortedCount) {
    const index = this.state.colorStops.findIndex((s2) => s2.id === stop.id);
    return b`
      <div class="stop">
        <div class="stop-move">
          <button
            class="move-btn"
            @click=${() => this._swapStop(sortedIndex, -1)}
            ?disabled=${sortedIndex === 0}
            title="Swap with the point above"
          >▲</button>
          <button
            class="move-btn"
            @click=${() => this._swapStop(sortedIndex, 1)}
            ?disabled=${sortedIndex === sortedCount - 1}
            title="Swap with the point below"
          >▼</button>
        </div>
        <span class="rule-label">At value</span>
        <input
          type="number"
          .value=${String(stop.value)}
          @change=${(e2) => this._onStopValueChange(index, e2.target.value)}
        />
        <span class="rule-label">→</span>
        <cms-color-picker
          compact
          .value=${stop.color}
          @color-changed=${(e2) => this._onStopColorChange(index, e2.detail.value)}
        ></cms-color-picker>
        <button
          @click=${() => this._removeStop(index)}
          ?disabled=${this.state.colorStops.length <= 2}
          title=${this.state.colorStops.length <= 2 ? "At least 2 points are required" : "Remove point"}
        >×</button>
      </div>
    `;
  }
  _addRule() {
    const newRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      operator: "<",
      value: 0,
      // Same "what a fresh control starts with" convention as the row-level
      // builder and the Icon/Accent modules: palette ON-default when set.
      color: getCachedPalette().defaults.onColor ?? "#2196F3"
    };
    this._emit({ rules: [...this.state.rules, newRule] });
  }
  _removeRule(index) {
    const rules = [...this.state.rules];
    rules.splice(index, 1);
    this._emit({ rules });
  }
  _onOperatorChange(index, operator) {
    const rules = [...this.state.rules];
    rules[index] = {
      ...rules[index],
      operator
    };
    this._emit({ rules });
  }
  _onValueChange(index, value) {
    const rules = [...this.state.rules];
    rules[index] = { ...rules[index], value: parseFloat(value) || 0 };
    this._emit({ rules });
  }
  _onRuleColorChange(index, color) {
    const rules = [...this.state.rules];
    rules[index] = { ...rules[index], color };
    this._emit({ rules });
  }
  _addStop() {
    const values = this.state.colorStops.map((s2) => s2.value);
    const nextValue = values.length ? Math.max(...values) + 10 : 0;
    const newStop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      value: nextValue,
      // Stops need concrete hex (interpolation) — previewHexFor resolves a
      // palette var() ON-default the same way stop color picks resolve.
      color: previewHexFor(getCachedPalette().defaults.onColor ?? "#2196F3")
    };
    this._emit({ colorStops: [...this.state.colorStops, newStop] });
  }
  _removeStop(index) {
    if (this.state.colorStops.length <= 2) return;
    const colorStops = [...this.state.colorStops];
    colorStops.splice(index, 1);
    this._emit({ colorStops });
  }
  _onStopValueChange(index, value) {
    const colorStops = [...this.state.colorStops];
    colorStops[index] = { ...colorStops[index], value: parseFloat(value) || 0 };
    this._emit({ colorStops });
  }
  _onStopColorChange(index, color) {
    const colorStops = [...this.state.colorStops];
    colorStops[index] = { ...colorStops[index], color: previewHexFor(color) };
    this._emit({ colorStops });
  }
  /**
   * Swaps the *colors* of two adjacent (by sorted value) points, leaving
   * their values fixed — "move this point up/down" reads naturally, but
   * what it needs to actually do is exchange which color sits at which
   * value slot. Swapping the values instead would be a no-op once
   * re-sorted (the two rows would just trade places and look identical).
   */
  _swapStop(sortedIndex, direction) {
    const sorted = [...this.state.colorStops].sort((a2, b2) => a2.value - b2.value);
    const other = sorted[sortedIndex + direction];
    const current = sorted[sortedIndex];
    if (!other || !current) return;
    const colorStops = this.state.colorStops.map((s2) => {
      if (s2.id === current.id) return { ...s2, color: other.color };
      if (s2.id === other.id) return { ...s2, color: current.color };
      return s2;
    });
    this._emit({ colorStops });
  }
}
__decorateClass$9([
  n2({ attribute: false })
], ThresholdModule.prototype, "state");
__decorateClass$9([
  n2({ type: String })
], ThresholdModule.prototype, "cardEntity");
__decorateClass$9([
  n2({ type: String })
], ThresholdModule.prototype, "cardType");
__decorateClass$9([
  n2({ attribute: false })
], ThresholdModule.prototype, "hass");
__decorateClass$9([
  n2({ attribute: false })
], ThresholdModule.prototype, "overridden");
__decorateClass$9([
  n2({ attribute: false })
], ThresholdModule.prototype, "overriddenDetail");
__decorateClass$9([
  r()
], ThresholdModule.prototype, "_open");
customElements.define("cms-threshold-module", ThresholdModule);
var __defProp$8 = Object.defineProperty;
var __decorateClass$8 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$8(target, key, result);
  return result;
};
class AdvancedModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = { rawCss: "" };
    this.open = false;
  }
  static {
    this.styles = [
      moduleStyles,
      i$6`
      .editor-wrap {
        padding: 0 14px 12px;
        border-top: 1px solid var(--divider-color, #383838);
      }
      ha-code-editor {
        display: block;
        --code-mirror-height: 180px;
      }
      .hint {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
        margin: 6px 0 0;
      }
    `
    ];
  }
  _onValueChanged(e2) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { rawCss: e2.detail.value }
      })
    );
  }
  render() {
    return b`
      <div class="module">
        <div
          class="module-header"
          @click=${() => {
      this.open = !this.open;
    }}
        >
          <span class="module-chevron">${this.open ? "▼" : "▶"}</span>
          <span class="module-title">⌨️ Advanced CSS</span>
        </div>
        ${this.open ? b`
              <div class="editor-wrap">
                <ha-code-editor
                  mode="jinja2"
                  .value=${this.state.rawCss}
                  @value-changed=${this._onValueChanged}
                ></ha-code-editor>
                <p class="hint">
                  Raw CSS appended after visual module output. Supports Jinja2
                  templates just like card-mod.
                </p>
              </div>
            ` : ""}
      </div>
    `;
  }
}
__decorateClass$8([
  n2({ attribute: false })
], AdvancedModule.prototype, "state");
__decorateClass$8([
  n2({ type: Boolean })
], AdvancedModule.prototype, "open");
customElements.define("cms-advanced-module", AdvancedModule);
var __defProp$7 = Object.defineProperty;
var __decorateClass$7 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$7(target, key, result);
  return result;
};
const FONT_FAMILY_PRESETS = [
  { value: "", label: "Theme default" },
  { value: "sans-serif", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" }
];
class FontModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = {
      ...DEFAULT_FONT
    };
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
    this._fontSize = DEFAULT_FONT.fontSize;
  }
  static {
    this.styles = [moduleStyles];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
      this._fontSize = this.state.fontSize;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { ...this.state, ...changes }
      })
    );
  }
  get _isCustomFamily() {
    return !FONT_FAMILY_PRESETS.some((p2) => p2.value === this.state.fontFamily);
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🔠 Font</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    const family = this.state.fontFamily;
    const isCustom = this._isCustomFamily;
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Text size</span>
          <div class="control-right">
            <ha-slider
              min="10"
              max="48"
              step="1"
              .value=${String(this._fontSize)}
              @input=${(e2) => {
      this._fontSize = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      fontSize: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._fontSize}px</span>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Weight</span>
          <div class="control-right">
            <select
              .value=${this.state.fontWeight}
              @change=${(e2) => this._emit({
      fontWeight: e2.target.value
    })}
            >
              <option value="normal" ?selected=${this.state.fontWeight === "normal"}>Normal</option>
              <option value="medium" ?selected=${this.state.fontWeight === "medium"}>Medium</option>
              <option value="bold" ?selected=${this.state.fontWeight === "bold"}>Bold</option>
            </select>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Font family</span>
          <div class="control-right">
            <select
              .value=${isCustom ? "custom" : family}
              @change=${(e2) => {
      const v2 = e2.target.value;
      if (v2 !== "custom") this._emit({ fontFamily: v2 });
    }}
            >
              ${FONT_FAMILY_PRESETS.map(
      (p2) => b`<option value=${p2.value} ?selected=${!isCustom && family === p2.value}>
                  ${p2.label}
                </option>`
    )}
              <option value="custom" ?selected=${isCustom}>Custom…</option>
            </select>
          </div>
        </div>
        ${isCustom ? b`
              <div class="control-row">
                <span class="control-label">Custom family</span>
                <div class="control-right">
                  <input
                    type="text"
                    style="width:100%;box-sizing:border-box;"
                    .value=${family}
                    placeholder="'My Font', sans-serif"
                    @change=${(e2) => this._emit({ fontFamily: e2.target.value.trim() })}
                  />
                </div>
              </div>
            ` : A}

        <div class="control-row">
          <span class="control-label">Text color</span>
          <div class="control-right">
            <cms-color-picker
              .value=${this.state.color}
              @color-changed=${(e2) => this._emit({ color: e2.detail.value })}
            ></cms-color-picker>
          </div>
        </div>
      </div>
    `;
  }
}
__decorateClass$7([
  n2({ attribute: false })
], FontModule.prototype, "state");
__decorateClass$7([
  n2({ attribute: false })
], FontModule.prototype, "overridden");
__decorateClass$7([
  n2({ attribute: false })
], FontModule.prototype, "overriddenDetail");
__decorateClass$7([
  r()
], FontModule.prototype, "_open");
__decorateClass$7([
  r()
], FontModule.prototype, "_fontSize");
customElements.define("cms-font-module", FontModule);
var __defProp$6 = Object.defineProperty;
var __decorateClass$6 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$6(target, key, result);
  return result;
};
class HeadingStyleModule extends i$3 {
  constructor() {
    super(...arguments);
    this.state = {
      ...DEFAULT_HEADING_STYLE
    };
    this.overridden = false;
    this.overriddenDetail = "";
    this._open = false;
    this._fontSize = DEFAULT_HEADING_STYLE.fontSize;
    this._iconSize = DEFAULT_HEADING_STYLE.iconSize;
  }
  static {
    this.styles = [moduleStyles];
  }
  firstUpdated() {
    this._open = this.state.enabled;
  }
  updated(changed) {
    if (changed.has("state")) {
      const prev = changed.get("state");
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
      this._fontSize = this.state.fontSize;
      this._iconSize = this.state.iconSize;
    }
  }
  _toggleOpen() {
    this._open = !this._open;
  }
  _emit(changes) {
    this.dispatchEvent(
      new CustomEvent("state-changed", {
        detail: { ...this.state, ...changes }
      })
    );
  }
  render() {
    return b`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🔤 Heading Style</span>
          ${renderOverrideBadge(this.overridden)}
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e2) => e2.stopPropagation()}
            @change=${(e2) => this._emit({ enabled: e2.target.checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  get _isCustomFamily() {
    return !FONT_FAMILY_PRESETS.some((p2) => p2.value === (this.state.fontFamily ?? ""));
  }
  _renderBody() {
    const family = this.state.fontFamily ?? "";
    const isCustom = this._isCustomFamily;
    return b`
      <div class="module-body">
        ${renderOverrideHint(this.overridden, this.overriddenDetail)}
        <div class="control-row">
          <span class="control-label">Text size</span>
          <div class="control-right">
            <ha-slider
              min="12"
              max="48"
              step="1"
              .value=${String(this._fontSize)}
              @input=${(e2) => {
      this._fontSize = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      fontSize: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._fontSize}px</span>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Weight</span>
          <div class="control-right">
            <select
              .value=${this.state.fontWeight ?? "normal"}
              @change=${(e2) => this._emit({
      fontWeight: e2.target.value
    })}
            >
              <option value="normal" ?selected=${(this.state.fontWeight ?? "normal") === "normal"}>Normal</option>
              <option value="medium" ?selected=${this.state.fontWeight === "medium"}>Medium</option>
              <option value="bold" ?selected=${this.state.fontWeight === "bold"}>Bold</option>
            </select>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Font family</span>
          <div class="control-right">
            <select
              .value=${isCustom ? "custom" : family}
              @change=${(e2) => {
      const v2 = e2.target.value;
      if (v2 !== "custom") this._emit({ fontFamily: v2 });
    }}
            >
              ${FONT_FAMILY_PRESETS.map(
      (p2) => b`<option value=${p2.value} ?selected=${!isCustom && family === p2.value}>
                  ${p2.label}
                </option>`
    )}
              <option value="custom" ?selected=${isCustom}>Custom…</option>
            </select>
          </div>
        </div>
        ${isCustom ? b`
              <div class="control-row">
                <span class="control-label">Custom family</span>
                <div class="control-right">
                  <input
                    type="text"
                    style="width:100%;box-sizing:border-box;"
                    .value=${family}
                    placeholder="'My Font', sans-serif"
                    @change=${(e2) => this._emit({ fontFamily: e2.target.value.trim() })}
                  />
                </div>
              </div>
            ` : A}

        <div class="control-row">
          <span class="control-label">Text color</span>
          <div class="control-right">
            <cms-color-picker
              .value=${this.state.textColor}
              @color-changed=${(e2) => this._emit({ textColor: e2.detail.value })}
            ></cms-color-picker>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Icon size</span>
          <div class="control-right">
            <ha-slider
              min="12"
              max="48"
              step="1"
              .value=${String(this._iconSize)}
              @input=${(e2) => {
      this._iconSize = parseFloat(e2.target.value);
    }}
              @change=${(e2) => this._emit({
      iconSize: parseFloat(e2.target.value)
    })}
            ></ha-slider>
            <span class="value-label">${this._iconSize}px</span>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Icon color</span>
          <div class="control-right">
            <cms-color-picker
              .value=${this.state.iconColor}
              @color-changed=${(e2) => this._emit({ iconColor: e2.detail.value })}
            ></cms-color-picker>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Alignment</span>
          <div class="control-right">
            <select
              .value=${this.state.alignment}
              @change=${(e2) => this._emit({
      alignment: e2.target.value
    })}
            >
              <option value="left" ?selected=${this.state.alignment === "left"}>Left</option>
              <option value="center" ?selected=${this.state.alignment === "center"}>Center</option>
              <option value="right" ?selected=${this.state.alignment === "right"}>Right</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
}
__decorateClass$6([
  n2({ attribute: false })
], HeadingStyleModule.prototype, "state");
__decorateClass$6([
  n2({ attribute: false })
], HeadingStyleModule.prototype, "overridden");
__decorateClass$6([
  n2({ attribute: false })
], HeadingStyleModule.prototype, "overriddenDetail");
__decorateClass$6([
  r()
], HeadingStyleModule.prototype, "_open");
__decorateClass$6([
  r()
], HeadingStyleModule.prototype, "_fontSize");
__decorateClass$6([
  r()
], HeadingStyleModule.prototype, "_iconSize");
customElements.define("cms-heading-style-module", HeadingStyleModule);
var __defProp$5 = Object.defineProperty;
var __decorateClass$5 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$5(target, key, result);
  return result;
};
function defaultOnColor() {
  return getCachedPalette().defaults.onColor ?? "#2196F3";
}
class EntitiesRowsModule extends i$3 {
  constructor() {
    super(...arguments);
    this.rows = [];
    this.styles = {};
    this._openRows = /* @__PURE__ */ new Set();
  }
  static {
    this.styles = [
      moduleStyles,
      i$6`
      .entity-section {
        border: 1px solid var(--divider-color, #383838);
        border-radius: 6px;
        overflow: hidden;
      }
      .entity-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 12px;
        background: rgba(255, 255, 255, 0.03);
        cursor: pointer;
        user-select: none;
      }
      .entity-header:hover {
        background: rgba(255, 255, 255, 0.07);
      }
      .entity-chevron {
        font-size: 9px;
        color: var(--secondary-text-color, #9e9e9e);
        width: 12px;
        flex-shrink: 0;
      }
      .entity-name {
        font-size: 13px;
        font-weight: 500;
        flex-shrink: 0;
      }
      .entity-id {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
      .style-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent-color, #2196f3);
        flex-shrink: 0;
      }
      .entity-body {
        padding: 12px 14px;
        border-top: 1px solid var(--divider-color, #383838);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .mode-toggle {
        display: flex;
        border: 1px solid var(--divider-color, #383838);
        border-radius: 4px;
        overflow: hidden;
      }
      .mode-btn {
        padding: 3px 10px;
        font-size: 11px;
        cursor: pointer;
        background: transparent;
        color: var(--secondary-text-color, #9e9e9e);
        border: none;
      }
      .mode-btn.active {
        background: rgba(33, 150, 243, 0.2);
        color: #2196f3;
      }
      .color-section-label {
        font-size: 12px;
        color: var(--secondary-text-color, #9e9e9e);
        font-weight: 500;
        margin-bottom: 2px;
      }
      /* Threshold rule styles */
      .rule {
        display: flex;
        gap: 6px;
        align-items: center;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
      }
      .rule select,
      .rule input[type='number'] {
        padding: 4px 6px;
        font-size: 12px;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #e1e1e1);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 4px;
      }
      .rule input[type='number'] { width: 70px; }
      .rule select { width: 60px; }
      .rule button {
        padding: 2px 8px;
        cursor: pointer;
        background: rgba(255, 0, 0, 0.15);
        color: #ff6b6b;
        border: 1px solid rgba(255, 0, 0, 0.3);
        border-radius: 4px;
        font-size: 14px;
        line-height: 1;
      }
      .rule button:hover { background: rgba(255, 0, 0, 0.25); }
      .rule-label {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
      }
      /* Same metrics as the card-level Threshold module's .add-btn. */
      .add-rule-btn {
        margin-top: 4px;
        padding: 6px 12px;
        cursor: pointer;
        background: rgba(33, 150, 243, 0.15);
        color: #2196f3;
        border: 1px solid rgba(33, 150, 243, 0.3);
        border-radius: 4px;
        font-size: 12px;
        width: 100%;
      }
      .add-rule-btn:hover { background: rgba(33, 150, 243, 0.25); }
      .rules-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 6px;
      }
      .divider {
        border: none;
        border-top: 1px solid var(--divider-color, #383838);
        margin: 4px 0;
      }
    `
    ];
  }
  // ---------------------------------------------------------------------------
  // Emit helpers
  // ---------------------------------------------------------------------------
  _updateRow(rowKey, changes) {
    const current = this.styles[rowKey] ?? { iconColor: "", textColor: "" };
    const updated = { ...current, ...changes };
    this.dispatchEvent(
      new CustomEvent("styles-changed", {
        detail: { ...this.styles, [rowKey]: updated }
      })
    );
  }
  _toggleRow(rowKey) {
    const next = new Set(this._openRows);
    if (next.has(rowKey)) next.delete(rowKey);
    else next.add(rowKey);
    this._openRows = next;
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    const entityRows = this.rows.map((r2, index) => ({
      row: typeof r2 === "string" ? { entity: r2 } : r2,
      index
    })).filter((x2) => !!x2.row.entity);
    if (!entityRows.length) return A;
    const seen = /* @__PURE__ */ new Map();
    return b`
      <div class="module">
        <div class="module-header" style="cursor:default; pointer-events:none">
          <span class="module-title">🏠 Entity Rows</span>
        </div>
        <div class="module-body">
          ${entityRows.map(({ row, index }) => {
      const occurrence = (seen.get(row.entity) ?? 0) + 1;
      seen.set(row.entity, occurrence);
      return this._renderRow(row, index, occurrence);
    })}
        </div>
      </div>
    `;
  }
  _renderRow(row, index, occurrence) {
    const rowKey = String(index);
    const id = row.entity;
    const baseLabel = row.name || id.split(".")[1] || id;
    const label = occurrence > 1 ? `${baseLabel} (${occurrence})` : baseLabel;
    const isOpen = this._openRows.has(rowKey);
    const rowStyle = this.styles[rowKey] ?? { iconColor: "", textColor: "" };
    const hasStyle = !!(rowStyle.iconColor || rowStyle.iconMode === "threshold" || rowStyle.textColor || rowStyle.textMode === "threshold" || rowStyle.fontSizePx || rowStyle.fontWeight || rowStyle.extraCss);
    const conflicts = findRowExtraCssConflicts(rowStyle);
    return b`
      <div class="entity-section">
        <div class="entity-header" @click=${() => this._toggleRow(rowKey)}>
          <span class="entity-chevron">${isOpen ? "▼" : "▶"}</span>
          <span class="entity-name">${label}</span>
          <span class="entity-id">${id}</span>
          ${conflicts.length ? b`<span class="override-badge" title="Hand-written CSS on this row is overriding these controls">⚠️</span>` : A}
          ${hasStyle ? b`<span class="style-dot"></span>` : A}
        </div>
        ${isOpen ? this._renderBody(rowKey, rowStyle, conflicts) : A}
      </div>
    `;
  }
  _renderBody(rowKey, rowStyle, conflicts = []) {
    const iconEnabled = !!(rowStyle.iconColor || rowStyle.iconMode === "threshold");
    const iconIsThreshold = rowStyle.iconMode === "threshold";
    const textEnabled = !!(rowStyle.textColor || rowStyle.textMode === "threshold");
    const textIsThreshold = rowStyle.textMode === "threshold";
    return b`
      <div class="entity-body">
        ${renderOverrideHint(conflicts.length > 0, conflicts.join(", "))}

        <!-- Icon color -->
        <div class="control-row">
          <span class="control-label">Icon color</span>
          <div class="control-right">
            ${iconEnabled ? b`<div class="mode-toggle">
                    <button
                      class="mode-btn ${!iconIsThreshold ? "active" : ""}"
                      @click=${(e2) => {
      e2.stopPropagation();
      this._setMode(rowKey, "icon", "static");
    }}
                    >Static</button>
                    <button
                      class="mode-btn ${iconIsThreshold ? "active" : ""}"
                      @click=${(e2) => {
      e2.stopPropagation();
      this._setMode(rowKey, "icon", "threshold");
    }}
                    >Threshold</button>
                  </div>` : A}
            <ha-switch
              .checked=${iconEnabled}
              @change=${(e2) => {
      const on = e2.target.checked;
      this._updateRow(rowKey, on ? { iconColor: defaultOnColor(), iconMode: "static" } : { iconColor: "", iconMode: void 0, iconRules: void 0, iconDefault: void 0 });
    }}
            ></ha-switch>
          </div>
        </div>
        ${iconEnabled && !iconIsThreshold ? b`<cms-color-picker
                .value=${rowStyle.iconColor}
                @color-changed=${(e2) => this._updateRow(rowKey, { iconColor: e2.detail.value })}
              ></cms-color-picker>` : A}
        ${iconEnabled && iconIsThreshold ? this._renderRuleBuilder(rowKey, "icon", rowStyle.iconRules ?? [], rowStyle.iconDefault ?? "#888888") : A}

        <hr class="divider" />

        <!-- Text / state color -->
        <div class="control-row">
          <span class="control-label">Text / state color</span>
          <div class="control-right">
            ${textEnabled ? b`<div class="mode-toggle">
                    <button
                      class="mode-btn ${!textIsThreshold ? "active" : ""}"
                      @click=${(e2) => {
      e2.stopPropagation();
      this._setMode(rowKey, "text", "static");
    }}
                    >Static</button>
                    <button
                      class="mode-btn ${textIsThreshold ? "active" : ""}"
                      @click=${(e2) => {
      e2.stopPropagation();
      this._setMode(rowKey, "text", "threshold");
    }}
                    >Threshold</button>
                  </div>` : A}
            <ha-switch
              .checked=${textEnabled}
              @change=${(e2) => {
      const on = e2.target.checked;
      this._updateRow(rowKey, on ? { textColor: "#e1e1e1", textMode: "static" } : { textColor: "", textMode: void 0, textRules: void 0, textDefault: void 0 });
    }}
            ></ha-switch>
          </div>
        </div>
        ${textEnabled && !textIsThreshold ? b`<cms-color-picker
                .value=${rowStyle.textColor}
                @color-changed=${(e2) => this._updateRow(rowKey, { textColor: e2.detail.value })}
              ></cms-color-picker>` : A}
        ${textEnabled && textIsThreshold ? this._renderRuleBuilder(rowKey, "text", rowStyle.textRules ?? [], rowStyle.textDefault ?? "#888888") : A}

        <hr class="divider" />

        <!-- Per-row font (size + weight; inherits the card-level Font when off) -->
        <div class="control-row">
          <span class="control-label">Font (this row)</span>
          <div class="control-right">
            <ha-switch
              .checked=${!!(rowStyle.fontSizePx || rowStyle.fontWeight)}
              @change=${(e2) => {
      const on = e2.target.checked;
      this._updateRow(rowKey, on ? { fontSizePx: 16, fontWeight: "normal" } : { fontSizePx: void 0, fontWeight: void 0 });
    }}
            ></ha-switch>
          </div>
        </div>
        ${rowStyle.fontSizePx || rowStyle.fontWeight ? b`
              <div class="control-row">
                <span class="control-label">Text size</span>
                <div class="control-right">
                  <ha-slider
                    min="8"
                    max="48"
                    step="1"
                    .value=${String(rowStyle.fontSizePx ?? 16)}
                    @change=${(e2) => this._updateRow(rowKey, {
      fontSizePx: Math.max(8, parseFloat(e2.target.value) || 16)
    })}
                  ></ha-slider>
                  <span class="value-label">${rowStyle.fontSizePx ?? 16}px</span>
                </div>
              </div>
              <div class="control-row">
                <span class="control-label">Weight</span>
                <div class="control-right">
                  <select
                    .value=${rowStyle.fontWeight ?? "normal"}
                    @change=${(e2) => this._updateRow(rowKey, {
      fontWeight: e2.target.value
    })}
                  >
                    <option value="normal" ?selected=${(rowStyle.fontWeight ?? "normal") === "normal"}>Normal</option>
                    <option value="medium" ?selected=${rowStyle.fontWeight === "medium"}>Medium</option>
                    <option value="bold" ?selected=${rowStyle.fontWeight === "bold"}>Bold</option>
                  </select>
                </div>
              </div>
            ` : A}

      </div>
    `;
  }
  // ---------------------------------------------------------------------------
  // Threshold rule builder
  // ---------------------------------------------------------------------------
  _renderRuleBuilder(rowKey, prop, rules, defaultColor) {
    return b`
      <div class="rules-container">
        <span class="rule-label">Rules — order doesn't matter, they're sorted automatically:</span>
        ${rules.map((rule, i4) => b`
          <div class="rule">
            <span class="rule-label">If value</span>
            <select
              .value=${rule.operator}
              @change=${(e2) => this._updateRule(rowKey, prop, i4, {
      operator: e2.target.value
    })}
            >
              <option value="<"  ?selected=${rule.operator === "<"}>&lt;</option>
              <option value="<=" ?selected=${rule.operator === "<="}>&lt;=</option>
              <option value=">"  ?selected=${rule.operator === ">"}>&gt;</option>
              <option value=">=" ?selected=${rule.operator === ">="}>&gt;=</option>
              <option value="==" ?selected=${rule.operator === "=="}>==</option>
              <option value="!=" ?selected=${rule.operator === "!="}>!=</option>
            </select>
            <input
              type="number"
              .value=${String(rule.value)}
              @change=${(e2) => this._updateRule(rowKey, prop, i4, {
      value: parseFloat(e2.target.value) || 0
    })}
            />
            <span class="rule-label">→</span>
            <cms-color-picker
              compact
              .value=${rule.color}
              @color-changed=${(e2) => this._updateRule(rowKey, prop, i4, { color: e2.detail.value })}
            ></cms-color-picker>
            <button @click=${() => this._removeRule(rowKey, prop, i4)}>×</button>
          </div>
        `)}
        <button class="add-rule-btn" @click=${() => this._addRule(rowKey, prop)}>+ Add Rule</button>
        <div class="control-row" style="margin-top:4px">
          <span class="control-label">Default color</span>
          <div class="control-right">
            <cms-color-picker
              compact
              .value=${defaultColor}
              @color-changed=${(e2) => {
      const key = prop === "icon" ? "iconDefault" : "textDefault";
      this._updateRow(rowKey, { [key]: e2.detail.value });
    }}
            ></cms-color-picker>
            <span class="color-label">${defaultColor}</span>
          </div>
        </div>
      </div>
    `;
  }
  _setMode(rowKey, prop, mode) {
    const current = this.styles[rowKey] ?? { iconColor: "", textColor: "" };
    if (prop === "icon") {
      this._updateRow(rowKey, {
        iconMode: mode,
        iconColor: mode === "static" ? current.iconColor || defaultOnColor() : "",
        iconRules: mode === "threshold" ? current.iconRules ?? [] : void 0,
        iconDefault: mode === "threshold" ? current.iconDefault ?? "#888888" : void 0
      });
    } else {
      this._updateRow(rowKey, {
        textMode: mode,
        textColor: mode === "static" ? current.textColor || "#e1e1e1" : "",
        textRules: mode === "threshold" ? current.textRules ?? [] : void 0,
        textDefault: mode === "threshold" ? current.textDefault ?? "#888888" : void 0
      });
    }
  }
  _addRule(rowKey, prop) {
    const current = this.styles[rowKey] ?? { iconColor: "", textColor: "" };
    const key = prop === "icon" ? "iconRules" : "textRules";
    const rules = [...current[key] ?? []];
    rules.push({
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      operator: "<",
      value: 0,
      color: defaultOnColor()
    });
    this._updateRow(rowKey, { [key]: rules });
  }
  _removeRule(rowKey, prop, index) {
    const current = this.styles[rowKey] ?? { iconColor: "", textColor: "" };
    const key = prop === "icon" ? "iconRules" : "textRules";
    const rules = [...current[key] ?? []];
    rules.splice(index, 1);
    this._updateRow(rowKey, { [key]: rules });
  }
  _updateRule(rowKey, prop, index, changes) {
    const current = this.styles[rowKey] ?? { iconColor: "", textColor: "" };
    const key = prop === "icon" ? "iconRules" : "textRules";
    const rules = [...current[key] ?? []];
    rules[index] = { ...rules[index], ...changes };
    this._updateRow(rowKey, { [key]: rules });
  }
}
__decorateClass$5([
  n2({ attribute: false })
], EntitiesRowsModule.prototype, "rows");
__decorateClass$5([
  n2({ attribute: false })
], EntitiesRowsModule.prototype, "styles");
__decorateClass$5([
  r()
], EntitiesRowsModule.prototype, "_openRows");
customElements.define("cms-entities-rows-module", EntitiesRowsModule);
var __defProp$4 = Object.defineProperty;
var __decorateClass$4 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$4(target, key, result);
  return result;
};
class CmsChildCardSection extends i$3 {
  constructor() {
    super(...arguments);
    this.index = 0;
    this._studioState = null;
    this._entityRowStyles = {};
    this._open = false;
    this._echoGuard = new ConfigEchoGuard();
  }
  static {
    this.styles = [
      moduleStyles,
      i$6`
      :host {
        display: block;
      }
      .child-section {
        border: 1px solid var(--divider-color, #383838);
        border-radius: 6px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.02);
      }
      .child-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        cursor: pointer;
        user-select: none;
      }
      .child-title {
        font-weight: 600;
        font-size: 13px;
      }
      .child-sub {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        min-width: 0;
      }
      /* Same "this item carries styling" indicator as the entities rows
       * module's .style-dot — one concept, one look. */
      .styled-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent-color, #2196f3);
        flex-shrink: 0;
      }
      .child-body {
        padding: 4px 8px 8px;
        border-top: 1px solid var(--divider-color, #383838);
      }
      .child-note {
        font-size: 12px;
        color: var(--secondary-text-color, #9e9e9e);
        padding: 8px 12px;
      }
    `
    ];
  }
  willUpdate(changed) {
    if (changed.has("childConfig")) {
      if (!this.childConfig) {
        this._studioState = null;
        this._entityRowStyles = {};
        this._echoGuard.reset();
        return;
      }
      if (this._echoGuard.shouldRebuild(JSON.stringify(this.childConfig))) {
        this._studioState = buildMergedStudioState(this.childConfig, this.hass);
        this._entityRowStyles = initEntityRowStyles(this.childConfig, this.hass);
      }
    }
  }
  _emitChanged(changes) {
    if (!this.childConfig || !this._studioState) return;
    this._studioState = { ...this._studioState, ...changes };
    this._emitChildConfig();
  }
  _onRowStylesChanged(e2) {
    this._entityRowStyles = e2.detail;
    this._emitChildConfig();
  }
  _emitChildConfig() {
    if (!this.childConfig || !this._studioState) return;
    let newChild = applyStudioState(this._studioState, this.childConfig, this.hass);
    if (this.childConfig.type === "entities") {
      newChild = applyEntityRowStyles(newChild, this._entityRowStyles, this.hass);
    }
    this._echoGuard.noteEmitted(JSON.stringify(newChild));
    this.dispatchEvent(
      new CustomEvent("child-config-changed", {
        detail: { index: this.index, config: newChild },
        bubbles: true,
        composed: true
      })
    );
  }
  get _isStyled() {
    return !!(this.childConfig?.card_mod?.style || this.childConfig?.uix?.style);
  }
  render() {
    const c2 = this.childConfig;
    if (!c2) return A;
    const label = `${this.index + 1}. ${c2.type}`;
    const sub = c2.entity ?? c2.title ?? c2.name ?? "";
    return b`
      <div class="child-section">
        <div class="child-header" @click=${() => this._open = !this._open}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="child-title">${label}</span>
          <span class="child-sub">${sub}</span>
          ${this._isStyled ? b`<span class="styled-dot" title="This card has styling"></span>` : A}
        </div>
        ${this._open ? this._renderBody() : A}
      </div>
    `;
  }
  _renderBody() {
    const c2 = this.childConfig;
    const s2 = this._studioState;
    if (!s2) return A;
    if (CONTAINER_CARD_TYPES.has(c2.type)) {
      return b`<div class="child-note">
        This child is itself a "${c2.type}" container — open it as its own card
        (or edit its YAML) to style the cards inside it. Nested container
        styling isn't supported yet.
      </div>`;
    }
    if (hasDictFormStyle(c2)) {
      return b`<div class="child-note">
        🔒 This child's styling is written in card-mod's dictionary form
        ($ shadow-piercing), which the Studio can't edit yet — planned for
        v0.10. It is preserved exactly as written.
      </div>`;
    }
    const cardType = c2.type ?? "";
    const entity = c2.entity ?? "";
    const stateAware = isStateAware(cardType, entity, this.hass);
    const showHeading = cardType === "heading";
    const isEntities = cardType === "entities";
    const hasUnrecognisedCss = !!s2.advanced.rawCss.trim();
    const conflicts = findAdvancedCssConflicts(s2.advanced.rawCss, s2);
    return b`
      <div class="child-body">
        ${showHeading ? b`<cms-heading-style-module
              .overridden=${!!conflicts.headingStyle}
              .overriddenDetail=${(conflicts.headingStyle ?? []).join(", ")}
              .state=${s2.headingStyle}
              @state-changed=${(e2) => this._emitChanged({ headingStyle: e2.detail })}
            ></cms-heading-style-module>` : A}

        ${!NO_FONT_TYPES.has(cardType) ? b`<cms-font-module
              .overridden=${!!conflicts.font}
              .overriddenDetail=${(conflicts.font ?? []).join(", ")}
              .state=${s2.font}
              @state-changed=${(e2) => this._emitChanged({ font: e2.detail })}
            ></cms-font-module>` : A}

        <cms-filter-module
          .overridden=${!!conflicts.filter}
          .overriddenDetail=${(conflicts.filter ?? []).join(", ")}
          .state=${s2.filter}
          .stateAware=${stateAware}
          .hass=${this.hass}
          @state-changed=${(e2) => this._emitChanged({ filter: e2.detail })}
        ></cms-filter-module>

        ${!showHeading && !isEntities ? b`<cms-accent-color-module
              .overridden=${!!conflicts.accentColor}
              .overriddenDetail=${(conflicts.accentColor ?? []).join(", ")}
              .state=${s2.accentColor}
              .stateAware=${stateAware}
              .cardEntity=${entity}
              .cardType=${cardType}
              .hass=${this.hass}
              @state-changed=${(e2) => this._emitChanged({ accentColor: e2.detail })}
            ></cms-accent-color-module>` : A}

        ${!isEntities && !NO_ICON_COLOR_TYPES.has(cardType) ? b`<cms-icon-color-module
              .overridden=${!!conflicts.iconColor}
              .overriddenDetail=${(conflicts.iconColor ?? []).join(", ")}
              .state=${s2.iconColor}
              .stateAware=${stateAware}
              .isLightCard=${cardType === "light"}
              .allowSize=${ICON_SIZE_TYPES.has(cardType)}
              .cardEntity=${entity}
              .hass=${this.hass}
              @state-changed=${(e2) => this._emitChanged({ iconColor: e2.detail })}
            ></cms-icon-color-module>` : A}

        ${!isEntities ? b`<cms-threshold-module
              .overridden=${!!conflicts.threshold}
              .overriddenDetail=${(conflicts.threshold ?? []).join(", ")}
              .state=${s2.threshold}
              .cardEntity=${entity}
              .cardType=${cardType}
              .hass=${this.hass}
              @state-changed=${(e2) => this._emitChanged({ threshold: e2.detail })}
            ></cms-threshold-module>` : A}

        ${!NO_BACKGROUND_TYPES.has(cardType) ? b`<cms-background-module
              .overridden=${!!conflicts.background}
              .overriddenDetail=${(conflicts.background ?? []).join(", ")}
              .state=${s2.background}
              .stateAware=${stateAware}
              .hass=${this.hass}
              @state-changed=${(e2) => this._emitChanged({ background: e2.detail })}
            ></cms-background-module>` : A}

        ${!NO_ANIMATION_TYPES.has(cardType) ? b`<cms-animation-module
              .overridden=${!!conflicts.animation}
              .overriddenDetail=${(conflicts.animation ?? []).join(", ")}
              .state=${s2.animation}
              .stateAware=${stateAware}
              .hass=${this.hass}
              @state-changed=${(e2) => this._emitChanged({ animation: e2.detail })}
            ></cms-animation-module>` : A}

        ${!NO_BORDER_TYPES.has(cardType) ? b`<cms-border-module
              .overridden=${!!conflicts.border}
              .overriddenDetail=${(conflicts.border ?? []).join(", ")}
              .state=${s2.border}
              .stateAware=${stateAware}
              .hass=${this.hass}
              @state-changed=${(e2) => this._emitChanged({ border: e2.detail })}
            ></cms-border-module>` : A}

        <cms-advanced-module
          .state=${s2.advanced}
          ?open=${hasUnrecognisedCss}
          @state-changed=${(e2) => this._emitChanged({ advanced: e2.detail })}
        ></cms-advanced-module>

        ${isEntities ? b`<cms-entities-rows-module
              .rows=${c2.entities ?? []}
              .styles=${this._entityRowStyles}
              @styles-changed=${this._onRowStylesChanged}
            ></cms-entities-rows-module>` : A}
      </div>
    `;
  }
}
__decorateClass$4([
  n2({ attribute: false })
], CmsChildCardSection.prototype, "childConfig");
__decorateClass$4([
  n2({ attribute: false })
], CmsChildCardSection.prototype, "hass");
__decorateClass$4([
  n2({ type: Number })
], CmsChildCardSection.prototype, "index");
__decorateClass$4([
  r()
], CmsChildCardSection.prototype, "_studioState");
__decorateClass$4([
  r()
], CmsChildCardSection.prototype, "_entityRowStyles");
__decorateClass$4([
  r()
], CmsChildCardSection.prototype, "_open");
customElements.define("cms-child-card-section", CmsChildCardSection);
const ENTITY_ROW_TAG_RE = /-entity-row$|^hui-.*-row$/;
const ICON_TAGS = /* @__PURE__ */ new Set(["ha-state-icon", "state-badge", "ha-tile-icon"]);
const GAUGE_CLASSES = /* @__PURE__ */ new Set(["value-text", "needle", "dial"]);
const FONT_CLASSES = /* @__PURE__ */ new Set([
  "card-header",
  "header",
  "name",
  "value",
  "measurement",
  "info",
  "title"
]);
const FONT_CLASS_TAGS = /* @__PURE__ */ new Set([
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "td",
  "th",
  "li"
]);
const GENERIC_ROW_TEXT_CLASSES = /* @__PURE__ */ new Set(["text-content", "secondary", "state"]);
const CARD_TEXT_MATCHERS = {
  button: (el) => el.tag === "span",
  markdown: (el) => el.tag === "ha-markdown" || el.tag === "ha-markdown-element",
  glance: (el) => el.classes.includes("entity"),
  "media-control": (el) => el.tag === "hui-marquee" || el.classes.includes("media-info") || el.classes.includes("icon-name"),
  "picture-entity": (el) => el.classes.includes("footer"),
  "picture-glance": (el) => el.classes.includes("box")
};
const RULES = [
  {
    // Icons: ha-state-icon / state-badge, plus ha-icon when it's NOT part of
    // a heading card's .title (those belong to Heading Style below).
    test: (el, i4, ctx) => ICON_TAGS.has(el.tag) || el.tag === "ha-icon" && (ctx.titleIndex === -1 || i4 > ctx.titleIndex),
    target: (cardType) => (
      // Mirror cms-panel._showIconColor: hidden on NO_ICON_COLOR_TYPES and on
      // entities cards (rows carry their own per-row icon color instead — the
      // walk falls through to the entity-row rule there).
      NO_ICON_COLOR_TYPES.has(cardType) || cardType === "entities" ? null : { module: "cms-icon-color-module", label: "Icon Color" }
    )
  },
  {
    // Heading card title (.title wraps the p + ha-icon) → Heading Style.
    test: (_el, i4, ctx) => ctx.titleIndex !== -1 && i4 <= ctx.titleIndex,
    target: (cardType) => cardType === "heading" ? { module: "cms-heading-style-module", label: "Heading Style" } : null,
    highlightIndex: (_i, ctx) => ctx.titleIndex
  },
  {
    // ha-gauge internals (value text / needle / dial) → Accent Color.
    test: (el) => el.tag === "ha-gauge" || el.classes.some((c2) => GAUGE_CLASSES.has(c2)),
    target: (cardType) => (
      // Accent module is hidden on heading + entities cards (cms-panel).
      cardType === "heading" || cardType === "entities" ? null : {
        module: "cms-accent-color-module",
        label: cardType === "gauge" ? "Gauge / Accent Color" : "Accent Color"
      }
    )
  },
  {
    // Thermostat temperature dial: the Accent Color module drives it via
    // --control-circular-slider-color + the state-climate-* colors. The
    // humidifier's dial gets no accent variables — not matched there, so it
    // falls through to the card surface.
    test: (el) => el.tag === "ha-control-circular-slider",
    target: (cardType) => cardType === "thermostat" ? { module: "cms-accent-color-module", label: "Accent Color" } : null
  },
  {
    // Sensor card's inline graph: the line is stroked with --accent-color.
    test: (el) => el.tag === "hui-graph-base" || el.tag === "hui-graph-header-footer",
    target: (cardType) => cardType === "sensor" ? { module: "cms-accent-color-module", label: "Graph / Accent Color" } : null
  },
  {
    // Tile feature rows (sliders/toggles below the info block): their
    // --feature-color derives from --tile-color, which Accent drives.
    test: (el) => el.tag === "hui-card-features" || el.tag === "hui-card-feature",
    target: (cardType) => cardType === "tile" ? { module: "cms-accent-color-module", label: "Features / Accent Color" } : null
  },
  {
    // Text: card header, tile info block, common text-carrying markers
    // (trusted only on real text tags), text containers inside a generic
    // entity row, and the per-card shapes from CARD_TEXT_MATCHERS.
    test: (el, i4, ctx) => el.tag === "ha-tile-info" || el.id === "info" || FONT_CLASS_TAGS.has(el.tag) && el.classes.some((c2) => FONT_CLASSES.has(c2)) || ctx.genericRowIndex !== -1 && i4 < ctx.genericRowIndex && el.classes.some((c2) => GENERIC_ROW_TEXT_CLASSES.has(c2)) || (CARD_TEXT_MATCHERS[ctx.cardType]?.(el) ?? false),
    target: (cardType) => NO_FONT_TYPES.has(cardType) ? null : { module: "cms-font-module", label: "Font" }
  },
  {
    // A row element on an entities card → the per-row styling module.
    // rowEntity is resolved by the caller (the picker), which can see the
    // actual DOM order and the card's entity list — this mapper can't.
    test: (el) => ENTITY_ROW_TAG_RE.test(el.tag),
    target: (cardType) => cardType === "entities" ? { module: "cms-entities-rows-module", label: "Entity Rows" } : null
  }
];
function fallbackTarget(cardType) {
  return NO_BACKGROUND_TYPES.has(cardType) ? { module: "cms-advanced-module", label: "Advanced CSS" } : { module: "cms-background-module", label: "Background & card surface" };
}
function buildContext(chain, cardType) {
  return {
    cardType,
    titleIndex: chain.findIndex((el) => el.classes.includes("title")),
    genericRowIndex: chain.findIndex((el) => el.tag === "hui-generic-entity-row")
  };
}
function mapElementToMatch(chain, cardType) {
  if (!chain.length) return null;
  const ctx = buildContext(chain, cardType);
  for (let i4 = 0; i4 < chain.length; i4++) {
    const el = chain[i4];
    for (const rule of RULES) {
      if (!rule.test(el, i4, ctx)) continue;
      const target = rule.target(cardType);
      if (!target) continue;
      return { target, index: rule.highlightIndex ? rule.highlightIndex(i4, ctx) : i4 };
    }
  }
  const haCardIndex = chain.findIndex((el) => el.tag === "ha-card");
  return {
    target: fallbackTarget(cardType),
    index: haCardIndex !== -1 ? haCardIndex : chain.length - 1
  };
}
var __defProp$3 = Object.defineProperty;
var __decorateClass$3 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$3(target, key, result);
  return result;
};
const _CmsPreviewPicker = class _CmsPreviewPicker2 extends i$3 {
  constructor() {
    super(...arguments);
    this.cardType = "";
    this.rows = [];
    this._box = null;
    this._label = "";
    this._target = null;
  }
  static {
    this.styles = i$6`
    :host {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: block;
    }

    .overlay {
      position: absolute;
      inset: 0;
      pointer-events: auto;
      cursor: pointer;
    }

    /* Highlight box — module-base-ish accents: 2px pink/accent border with a
       faint fill. */
    .hl {
      position: absolute;
      pointer-events: none;
      border: 2px solid var(--accent-color, #ff4081);
      background: rgba(255, 64, 129, 0.08);
      border-radius: 4px;
      box-sizing: border-box;
      z-index: 1;
    }

    /* The label sits OUTSIDE the box (above it, or below when the box
       touches the top edge) — most targets (icons!) are far smaller than
       the pill, so an inside-pinned label truncates to nothing (caught in
       visual review). */
    .hl-label {
      position: absolute;
      white-space: nowrap;
      padding: 2px 7px;
      border-radius: 10px;
      background: var(--accent-color, #ff4081);
      color: #fff;
      font-size: 10px;
      font-weight: 500;
      line-height: 1.4;
      font-family: var(--primary-font-family, sans-serif);
    }
  `;
  }
  // ---------------------------------------------------------------------------
  // Hit-testing
  // ---------------------------------------------------------------------------
  /** Re-queried on every hit-test — the panel's keyed() re-renders would
   *  make a stored reference stale. */
  get _resolvedCardEl() {
    return this.parentElement?.querySelector("hui-card") ?? null;
  }
  /** HA cards paint transparent interaction layers (the tile's full-card
   *  `div.background` tap surface, ripple elements) ABOVE their visual
   *  content — a plain elementFromPoint returns those instead of the icon
   *  or text underneath (verified live against hui-tile-card). Anything
   *  matching this is skipped in favor of the next element in the stack. */
  static _isInteractionOverlay(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "ha-ripple" || tag === "mwc-ripple" || tag === "md-ripple") return true;
    if (tag !== "div" && tag !== "span" && tag !== "button") return false;
    const cls = el.className?.toString?.() ?? "";
    return /(^|\s)(background|ripple|overlay|mdc-ripple[\w-]*)(\s|$)/.test(cls);
  }
  /**
   * Geometric hit-test: walk the card's composed tree (piercing open shadow
   * roots) and return the smallest-area element whose rect contains the
   * point. elementFromPoint is a dead end here — HA cards set
   * pointer-events:none on their CONTENT (only a transparent full-card tap
   * layer is interactive, e.g. the tile's div.background), which makes the
   * icon/text invisible to browser hit-testing entirely (verified live).
   * Rects don't care about pointer-events. Overlay/ripple layers are still
   * skipped so the full-card tap surface never wins over real content.
   */
  _deepElementFromPoint(x2, y3) {
    const cardEl = this._resolvedCardEl;
    if (!cardEl) return null;
    let best = null;
    let bestArea = Infinity;
    const stack = [cardEl];
    let guard = 0;
    while (stack.length && guard++ < 2e3) {
      const el = stack.pop();
      if (el.shadowRoot) stack.push(...Array.from(el.shadowRoot.children));
      stack.push(...Array.from(el.children));
      if (_CmsPreviewPicker2._isInteractionOverlay(el)) continue;
      const r2 = el.getBoundingClientRect();
      if (r2.width <= 0 || r2.height <= 0) continue;
      if (x2 < r2.left || x2 > r2.right || y3 < r2.top || y3 > r2.bottom) continue;
      const area = r2.width * r2.height;
      if (area <= bestArea) {
        best = el;
        bestArea = area;
      }
    }
    return best;
  }
  /** Next node up the flattened tree (light parent, or shadow host). */
  static _flatParent(el) {
    if (el.parentElement) return el.parentElement;
    const root = el.getRootNode();
    return root instanceof ShadowRoot ? root.host : null;
  }
  /** Ancestor chain from `deepest` up to and including `cardEl`, or null if
   *  the element isn't inside the preview card at all. */
  _buildChain(deepest, cardEl) {
    const chain = [];
    let node = deepest;
    while (node) {
      chain.push(node);
      if (node === cardEl) return chain;
      node = _CmsPreviewPicker2._flatParent(node);
    }
    return null;
  }
  static _describe(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id ?? "",
      classes: Array.from(el.classList)
    };
  }
  /** All entity-row elements inside the card, in document order — used to
   *  translate a hovered row element into an index into `this.rows`. */
  static _collectRows(node, out) {
    if (ENTITY_ROW_TAG_RE.test(node.tagName.toLowerCase())) {
      out.push(node);
      return;
    }
    if (node.shadowRoot) {
      for (const child of Array.from(node.shadowRoot.children)) {
        _CmsPreviewPicker2._collectRows(child, out);
      }
    }
    for (const child of Array.from(node.children)) {
      _CmsPreviewPicker2._collectRows(child, out);
    }
  }
  /** DOM row element → its index into `rows` (== config order), or -1. */
  _resolveRowIndex(rowEl, cardEl) {
    const allRows = [];
    _CmsPreviewPicker2._collectRows(cardEl, allRows);
    return allRows.indexOf(rowEl);
  }
  // ---------------------------------------------------------------------------
  // Pointer handling
  // ---------------------------------------------------------------------------
  /** Recompute target + highlight for a pointer position. Returns the target
   *  (also cached in _target), or null when the point hits nothing pickable. */
  _updateFromPoint(x2, y3) {
    const cardEl = this._resolvedCardEl;
    const deepest = cardEl ? this._deepElementFromPoint(x2, y3) : null;
    const chain = deepest && cardEl ? this._buildChain(deepest, cardEl) : null;
    if (!chain || !cardEl) {
      this._clear();
      return null;
    }
    const match = mapElementToMatch(chain.map(_CmsPreviewPicker2._describe), this.cardType);
    if (!match) {
      this._clear();
      return null;
    }
    const target = { ...match.target };
    if (target.module === "cms-entities-rows-module") {
      const rowEl = chain.find((el) => ENTITY_ROW_TAG_RE.test(el.tagName.toLowerCase()));
      const rowIndex = rowEl ? this._resolveRowIndex(rowEl, cardEl) : -1;
      if (rowIndex !== -1) {
        target.rowIndex = rowIndex;
        target.rowEntity = this.rows[rowIndex];
      }
    }
    const rect = chain[match.index].getBoundingClientRect();
    const hostRect = this.getBoundingClientRect();
    this._box = {
      left: rect.left - hostRect.left,
      top: rect.top - hostRect.top,
      width: rect.width,
      height: rect.height
    };
    this._label = target.rowEntity ? `${target.label} — ${target.rowEntity}` : target.label;
    this._target = target;
    return target;
  }
  _clear() {
    this._box = null;
    this._label = "";
    this._target = null;
  }
  _onMouseMove(ev) {
    this._updateFromPoint(ev.clientX, ev.clientY);
  }
  _onMouseLeave() {
    this._clear();
  }
  _onClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    const prev = this._target;
    const target = this._updateFromPoint(ev.clientX, ev.clientY) ?? prev;
    if (!target) return;
    this.dispatchEvent(
      new CustomEvent("cms-pick", {
        detail: target,
        bubbles: true,
        composed: true
      })
    );
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    return b`
      <div
        class="overlay"
        @mousemove=${this._onMouseMove}
        @mouseleave=${this._onMouseLeave}
        @click=${this._onClick}
      ></div>
      ${this._box ? b`
            <div
              class="hl"
              style="left:${this._box.left}px;top:${this._box.top}px;width:${this._box.width}px;height:${this._box.height}px"
            >
            </div>
            <span
              class="hl-label"
              style="left:${Math.max(0, this._box.left)}px;top:${this._box.top >= 26 ? this._box.top - 24 : this._box.top + this._box.height + 4}px"
            >${this._label}</span>
          ` : A}
    `;
  }
};
__decorateClass$3([
  n2({ attribute: false })
], _CmsPreviewPicker.prototype, "cardType");
__decorateClass$3([
  n2({ attribute: false })
], _CmsPreviewPicker.prototype, "rows");
__decorateClass$3([
  r()
], _CmsPreviewPicker.prototype, "_box");
__decorateClass$3([
  r()
], _CmsPreviewPicker.prototype, "_label");
let CmsPreviewPicker = _CmsPreviewPicker;
customElements.define("cms-preview-picker", CmsPreviewPicker);
function migratePresets(presets) {
  return presets.filter((p2) => p2 && typeof p2 === "object" && typeof p2.name === "string").map((p2) => ({ name: p2.name, state: migrateStudioState(p2.state) }));
}
const HA_KEY = "cms_presets";
const LS_KEY = "cms-presets";
function hassAvailable(hass) {
  return !!hass?.connection?.sendMessagePromise;
}
async function loadPresets(hass) {
  if (hassAvailable(hass)) {
    try {
      const result = await hass.connection.sendMessagePromise({
        type: "frontend/get_user_data",
        key: HA_KEY
      });
      const value = result?.value;
      if (Array.isArray(value)) return migratePresets(value);
    } catch (err) {
      console.warn("[Card-Mod Studio] Preset load from HA failed, using localStorage:", err);
    }
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? migratePresets(parsed) : [];
  } catch {
    return [];
  }
}
async function savePresets(presets, hass) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(presets));
  } catch {
  }
  if (hassAvailable(hass)) {
    try {
      await hass.connection.sendMessagePromise({
        type: "frontend/set_user_data",
        key: HA_KEY,
        value: presets
      });
    } catch (err) {
      console.warn("[Card-Mod Studio] Preset sync to HA failed (saved to localStorage only):", err);
    }
  }
}
function freshThreshold() {
  return {
    ...DEFAULT_THRESHOLD,
    properties: [...DEFAULT_THRESHOLD.properties],
    rules: [],
    colorStops: DEFAULT_THRESHOLD.colorStops.map((s2) => ({ ...s2 }))
  };
}
function filterPresetStateForCardType(state, cardType) {
  const type = cardType ?? "";
  const isHeading = type === "heading";
  const isEntities = type === "entities";
  const next = { ...state };
  if (!isHeading) next.headingStyle = { ...DEFAULT_HEADING_STYLE };
  if (isEntities || NO_ICON_COLOR_TYPES.has(type)) next.iconColor = { ...DEFAULT_ICON_COLOR };
  if (isHeading || isEntities) next.accentColor = { ...DEFAULT_ACCENT_COLOR };
  if (isEntities) next.threshold = freshThreshold();
  if (NO_BACKGROUND_TYPES.has(type)) next.background = { ...DEFAULT_BACKGROUND };
  if (NO_ANIMATION_TYPES.has(type)) next.animation = { ...DEFAULT_ANIMATION };
  if (NO_BORDER_TYPES.has(type)) next.border = { ...DEFAULT_BORDER };
  if (NO_FONT_TYPES.has(type)) next.font = { ...DEFAULT_FONT };
  return next;
}
var __defProp$2 = Object.defineProperty;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$2(target, key, result);
  return result;
};
class CmsPaletteManager extends i$3 {
  constructor() {
    super(...arguments);
    this._open = false;
    this._paletteChangedHandler = () => this.requestUpdate();
  }
  static {
    this.styles = [
      moduleStyles,
      i$6`
      .color-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      /* input[type='color'] deliberately NOT restyled here — it inherits the
       * shared round swatch look from moduleStyles, same as everywhere else. */
      .color-row input[type='text'] {
        flex: 1;
        min-width: 0;
        padding: 4px 6px;
        font-size: 12px;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #e1e1e1);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 4px;
      }
      .color-row .del-btn {
        padding: 2px 8px;
        cursor: pointer;
        background: rgba(255, 0, 0, 0.15);
        color: #ff6b6b;
        border: 1px solid rgba(255, 0, 0, 0.3);
        border-radius: 4px;
        font-size: 14px;
        line-height: 1;
      }
      .color-row .del-btn:hover {
        background: rgba(255, 0, 0, 0.25);
      }
      .add-btn {
        margin-top: 4px;
        padding: 6px 12px;
        cursor: pointer;
        background: rgba(33, 150, 243, 0.15);
        color: #2196f3;
        border: 1px solid rgba(33, 150, 243, 0.3);
        border-radius: 4px;
        font-size: 12px;
        width: 100%;
      }
      .add-btn:hover {
        background: rgba(33, 150, 243, 0.25);
      }
      .reset-btn {
        padding: 2px 8px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.06);
        color: var(--secondary-text-color, #9e9e9e);
        border: 1px solid var(--divider-color, #383838);
        border-radius: 4px;
        font-size: 11px;
      }
      .reset-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: var(--primary-text-color, #e1e1e1);
      }
      .section-label {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
        margin: 10px 0 6px;
        display: block;
      }
      .hint {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
        margin-top: 8px;
      }
      .header-summary {
        font-size: 11px;
        color: var(--secondary-text-color, #9e9e9e);
      }
      .default-label {
        flex: 1;
        font-size: 12px;
      }
      .default-builtin {
        color: var(--secondary-text-color, #9e9e9e);
      }
    `
    ];
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(PALETTE_CHANGED_EVENT, this._paletteChangedHandler);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(PALETTE_CHANGED_EVENT, this._paletteChangedHandler);
  }
  _save(palette) {
    void savePalette(palette, this.hass);
  }
  _addColor() {
    const palette = getCachedPalette();
    const color = {
      id: `color-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `My color ${palette.colors.length + 1}`,
      hex: "#03a9f4"
    };
    this._save({ ...palette, colors: [...palette.colors, color] });
  }
  _updateColor(id, changes) {
    const palette = getCachedPalette();
    this._save({
      ...palette,
      colors: palette.colors.map((c2) => c2.id === id ? { ...c2, ...changes } : c2)
    });
  }
  _deleteColor(id) {
    const palette = getCachedPalette();
    this._save({ ...palette, colors: palette.colors.filter((c2) => c2.id !== id) });
  }
  _setDefault(key, value) {
    const palette = getCachedPalette();
    const defaults = { ...palette.defaults };
    if (value) defaults[key] = value;
    else delete defaults[key];
    this._save({ ...palette, defaults });
  }
  render() {
    const palette = getCachedPalette();
    const hasContent = palette.colors.length > 0 || !!palette.defaults.onColor || !!palette.defaults.offColor;
    return b`
      <div class="module">
        <div class="module-header" @click=${() => this._open = !this._open}>
          <span class="module-chevron">${this._open ? "▼" : "▶"}</span>
          <span class="module-title">🖌️ My Color Palette</span>
          ${hasContent && !this._open ? b`<span class="header-summary">
                ${palette.colors.length ? `${palette.colors.length} color${palette.colors.length === 1 ? "" : "s"}` : "defaults set"}
              </span>` : A}
        </div>
        ${this._open ? this._renderBody(palette) : A}
      </div>
    `;
  }
  _renderBody(palette) {
    return b`
      <div class="module-body">
        <span class="section-label">My colors — shown as extra swatches in every color picker:</span>
        ${palette.colors.map(
      (c2) => b`
            <div class="color-row">
              <input
                type="color"
                .value=${c2.hex}
                @input=${(e2) => this._updateColor(c2.id, { hex: e2.target.value })}
              />
              <input
                type="text"
                .value=${c2.name}
                placeholder="Name"
                @change=${(e2) => this._updateColor(c2.id, { name: e2.target.value })}
              />
              <button class="del-btn" title="Delete color" @click=${() => this._deleteColor(c2.id)}>×</button>
            </div>
          `
    )}
        <button class="add-btn" @click=${this._addColor}>+ Add Color</button>

        <span class="section-label">
          Default ON / OFF colors — what Icon Color and Accent Color start with when you enable them:
        </span>
        ${this._renderDefaultRow("ON default", "onColor", palette.defaults.onColor, DEFAULT_ICON_COLOR.colorOn)}
        ${this._renderDefaultRow("OFF default", "offColor", palette.defaults.offColor, DEFAULT_ICON_COLOR.colorOff)}
        <div class="hint">
          Changing these doesn't touch already-styled cards — only what a newly-enabled module starts from.
        </div>
      </div>
    `;
  }
  _renderDefaultRow(label, key, value, builtin) {
    return b`
      <div class="color-row">
        <input
          type="color"
          .value=${value ?? builtin}
          @input=${(e2) => this._setDefault(key, e2.target.value)}
        />
        <span class="default-label">${label}${value ? "" : b` <span class="default-builtin">(built-in ${builtin})</span>`}</span>
        ${value ? b`<button class="reset-btn" @click=${() => this._setDefault(key, void 0)}>Reset</button>` : A}
      </div>
    `;
  }
}
__decorateClass$2([
  n2({ attribute: false })
], CmsPaletteManager.prototype, "hass");
__decorateClass$2([
  r()
], CmsPaletteManager.prototype, "_open");
customElements.define("cms-palette-manager", CmsPaletteManager);
var __defProp$1 = Object.defineProperty;
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp$1(target, key, result);
  return result;
};
const VERSION$1 = "0.9.1";
class CmsPanel extends i$3 {
  constructor() {
    super(...arguments);
    this._cardModPresent = false;
    this._uixPresent = false;
    this._studioState = null;
    this._previewConfig = void 0;
    this._previewKey = 0;
    this._presets = [];
    this._selectedPreset = "";
    this._entityRowStyles = {};
    this._narrow = false;
    this._echoGuard = new ConfigEchoGuard();
  }
  connectedCallback() {
    super.connectedCallback();
    this._cardModPresent = isCardModInstalled();
    this._uixPresent = isUixInstalled();
    void loadPresets(void 0).then((p2) => {
      this._presets = p2;
    });
    void initPaletteCache(this.hass);
    this._resizeObserver = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) this._narrow = w < 600;
    });
    this._resizeObserver.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = void 0;
  }
  updated(changed) {
    super.updated(changed);
    if (changed.has("config") || changed.has("hass")) {
      this._initState();
      this._previewConfig = void 0;
    }
    if (changed.has("hass") && this.hass && !changed.get("hass")) {
      void loadPresets(this.hass).then((p2) => {
        this._presets = p2;
      });
      void initPaletteCache(this.hass);
      this._uixPresent = isUixInstalled(this.hass);
    }
  }
  _initState() {
    if (!this.config) {
      this._studioState = null;
      this._entityRowStyles = {};
      this._echoGuard.reset();
      return;
    }
    if (!this._echoGuard.shouldRebuild(JSON.stringify(this.config))) return;
    this._studioState = this._buildMergedState(this.config);
    this._initEntityRowStyles();
  }
  /** See buildMergedStudioState in studio-state.ts — extracted so
   *  cms-child-card-section runs the identical merge for stack children. */
  _buildMergedState(config) {
    return buildMergedStudioState(config, this.hass);
  }
  _initEntityRowStyles() {
    this._entityRowStyles = this.config ? initEntityRowStyles(this.config, this.hass) : {};
  }
  /** See applyEntityRowStyles in studio-state.ts — extracted so
   *  cms-child-card-section runs the identical pipeline for an entities
   *  card nested inside a stack. */
  _applyEntityRowStyles(config) {
    return applyEntityRowStyles(config, this._entityRowStyles, this.hass);
  }
  // ---------------------------------------------------------------------------
  // card-mod / UIX compatibility
  // ---------------------------------------------------------------------------
  /**
   * True when this card's own top-level styling lives only under uix:
   * (nothing under card_mod: to fall back to) and UIX isn't currently
   * installed to read it — i.e. this specific card is about to render
   * unstyled, distinct from the generic "neither engine detected" case.
   */
  get _uixOnlyAtRisk() {
    return !this._uixPresent && !!this.config && isUixOnlyStyle(this.config);
  }
  /** Same risk, but for an entities card's individual rows — rows carry their own independent card_mod/uix blocks. */
  get _uixOnlyRowsAtRisk() {
    return !this._uixPresent && !!this.config && hasUixOnlyRow(this.config);
  }
  get _uixOnlyUsesMacros() {
    return !!this.config && usesUixOnlyFeatures(this.config);
  }
  /**
   * True when card-mod is the active write target (pickOutputKey() would
   * resolve to 'card_mod') and a uix: block using macros/billets sits
   * alongside it. Studio edits keep updating card_mod:, but — since that
   * uix: content can't be safely regenerated (see applyCardModStyle's doc
   * comment) — it's deliberately left untouched, and UIX (if actually
   * installed) keeps rendering it unchanged rather than the studio's edits.
   * Purely informational: there's nothing to "fix," just something worth
   * knowing. Mirrors pickOutputKey()'s own condition rather than checking
   * this.config.card_mod directly, since the sync-skip applies the moment
   * card-mod is the target, even on a card with no card_mod block yet.
   */
  get _uixMacrosCoexist() {
    return !!this.config && this._cardModPresent && usesUixOnlyFeatures(this.config);
  }
  /**
   * True when UIX is the active write target (pickOutputKey() would resolve
   * to 'uix' — UIX installed, card-mod not) and the card's existing uix:
   * block already uses macros/billets. Unlike the card_mod-primary case
   * above, there's no fallback key to write to instead, so studio edits here
   * DO overwrite uix.style directly — this is a heads-up that doing so will
   * replace the hand-authored macro/billet-driven styling, not a "safe, no
   * data lost" guarantee.
   */
  get _uixMacrosWillBeOverwritten() {
    return !!this.config && this._uixPresent && !this._cardModPresent && usesUixOnlyFeatures(this.config);
  }
  /**
   * Copies uix.style (card level and/or per at-risk row) verbatim into
   * card_mod.style, leaving uix.style completely untouched.
   *
   * Deliberately does NOT go through _emitConfigChanged() -> applyCardModStyle():
   * that path clears the *other* key once it's confident which engine is
   * active, which is right for a genuine settings edit but wrong here — this
   * button exists precisely because neither engine could be confirmed
   * installed (_uixOnlyAtRisk / _uixOnlyRowsAtRisk only fire when UIX isn't
   * detected), so clearing uix.style on a guess would destroy the original
   * hand-authored styling if that guess is wrong (UIX actually is installed
   * some other way, or gets installed later). A verbatim copy is also more
   * faithful than re-deriving through parse -> state -> generate, which is
   * lossy for anything the recognisers don't perfectly round-trip (and for
   * dict-form uix.style, which mapToStudioState can't represent losslessly
   * at all).
   */
  _copyUixStyleToCardMod() {
    if (!this.config) return;
    let next = { ...this.config };
    if (hasStyleContent(this.config.uix?.style) && !hasStyleContent(this.config.card_mod?.style)) {
      next = { ...next, card_mod: { style: this.config.uix.style } };
    }
    if (this.config.type === "entities") {
      const rows = this.config.entities;
      if (rows?.length) {
        const updatedRows = rows.map(
          (row) => hasStyleContent(row.uix?.style) && !hasStyleContent(row.card_mod?.style) ? { ...row, card_mod: { style: row.uix.style } } : row
        );
        next = { ...next, entities: updatedRows };
      }
    }
    this._previewConfig = next;
    this._previewKey++;
    this._echoGuard.noteEmitted(JSON.stringify(next));
    this.dispatchEvent(
      new CustomEvent("config-changed", { bubbles: true, composed: true, detail: { config: next } })
    );
  }
  // ---------------------------------------------------------------------------
  // Card-type helpers
  // ---------------------------------------------------------------------------
  get _isContainerCard() {
    return CONTAINER_CARD_TYPES.has(this.config?.type ?? "");
  }
  get _showIconColor() {
    if (this.config?.type === "entities") return false;
    return !NO_ICON_COLOR_TYPES.has(this.config?.type ?? "");
  }
  get _isEntitiesCard() {
    return this.config?.type === "entities";
  }
  get _showAnimation() {
    return !NO_ANIMATION_TYPES.has(this.config?.type ?? "");
  }
  get _showBackground() {
    return !NO_BACKGROUND_TYPES.has(this.config?.type ?? "");
  }
  get _showBorder() {
    return !NO_BORDER_TYPES.has(this.config?.type ?? "");
  }
  get _showHeadingStyle() {
    return this.config?.type === "heading";
  }
  get _showFont() {
    return !NO_FONT_TYPES.has(this.config?.type ?? "");
  }
  get _isLightCard() {
    return this.config?.type === "light";
  }
  get _isStateAware() {
    return isStateAware(this.config?.type, this.config?.entity, this.hass);
  }
  // ---------------------------------------------------------------------------
  // Module state handlers
  // ---------------------------------------------------------------------------
  _onFilterChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, filter: e2.detail };
    this._emitConfigChanged();
  }
  _onIconColorChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, iconColor: e2.detail };
    this._emitConfigChanged();
  }
  _onAccentColorChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, accentColor: e2.detail };
    this._emitConfigChanged();
  }
  _onBackgroundChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, background: e2.detail };
    this._emitConfigChanged();
  }
  _onAnimationChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, animation: e2.detail };
    this._emitConfigChanged();
  }
  _onBorderChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, border: e2.detail };
    this._emitConfigChanged();
  }
  _onAdvancedChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, advanced: e2.detail };
    this._emitConfigChanged();
  }
  _onHeadingStyleChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, headingStyle: e2.detail };
    this._emitConfigChanged();
  }
  _onFontChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, font: e2.detail };
    this._emitConfigChanged();
  }
  _onThresholdChanged(e2) {
    if (!this._studioState) return;
    this._studioState = { ...this._studioState, threshold: e2.detail };
    this._emitConfigChanged();
  }
  _emitConfigChanged() {
    if (!this.config || !this._studioState) return;
    const css2 = generateCss(this._studioState, this.config?.type, {
      gaugeNeedle: this.config.needle === true
    });
    let newConfig = applyCardModStyle(css2, this.config, pickOutputKey(this.hass));
    if (this.config.type === "entities") {
      newConfig = this._applyEntityRowStyles(newConfig);
    }
    this._previewConfig = newConfig;
    this._previewKey++;
    this._echoGuard.noteEmitted(JSON.stringify(newConfig));
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: newConfig }
      })
    );
  }
  _onEntityRowStylesChanged(e2) {
    this._entityRowStyles = e2.detail;
    this._emitConfigChanged();
  }
  // ---------------------------------------------------------------------------
  // Preset management
  // ---------------------------------------------------------------------------
  _saveCurrentAsPreset() {
    if (!this._studioState) return;
    const name = window.prompt("Preset name:");
    if (!name?.trim()) return;
    const trimmed = name.trim();
    const updated = [
      ...this._presets.filter((p2) => p2.name !== trimmed),
      { name: trimmed, state: { ...this._studioState } }
    ];
    this._presets = updated;
    this._selectedPreset = trimmed;
    void savePresets(updated, this.hass);
  }
  _onPresetSelect(e2) {
    const name = e2.target.value;
    this._selectedPreset = name;
    if (!name) return;
    const preset = this._presets.find((p2) => p2.name === name);
    if (!preset) return;
    const currentAdvanced = this._studioState?.advanced;
    const presetHasAdvanced = !!preset.state.advanced?.rawCss?.trim();
    this._studioState = filterPresetStateForCardType(
      {
        ...preset.state,
        ...presetHasAdvanced || !currentAdvanced ? {} : { advanced: currentAdvanced }
      },
      this.config?.type
    );
    this._emitConfigChanged();
  }
  _deleteSelectedPreset() {
    if (!this._selectedPreset) return;
    const updated = this._presets.filter((p2) => p2.name !== this._selectedPreset);
    this._presets = updated;
    this._selectedPreset = "";
    void savePresets(updated, this.hass);
  }
  static {
    this.styles = i$6`
    :host {
      display: flex;
      flex-direction: column;
      position: absolute;
      inset: 0;
      z-index: 10;
      background: var(--card-background-color, var(--ha-card-background, #1c1c1c));
      font-family: var(--primary-font-family, sans-serif);
      color: var(--primary-text-color, #e1e1e1);
      box-sizing: border-box;
      overflow: hidden;
    }

    /* ---- Header ---- */

    .header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--divider-color, #383838);
    }

    .header h2 { margin: 0; font-size: 16px; font-weight: 500; }
    .header .version {
      font-size: 11px;
      color: var(--secondary-text-color, #9e9e9e);
      margin-left: auto;
    }

    /* ---- Two-column body ---- */

    .panel-body {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 280px;
      overflow: hidden;
      min-height: 0;
    }

    .panel-body.no-preview {
      grid-template-columns: 1fr;
    }

    /* Narrow editors (mobile / slim side panel): stack the preview below the
       controls instead of starving them of width. */
    .panel-body.narrow {
      grid-template-columns: 1fr;
      overflow-y: auto;
    }
    .panel-body.narrow .modules-col {
      overflow: visible;
    }
    .panel-body.narrow .preview-col {
      border-left: none;
      border-top: 1px solid var(--divider-color, #383838);
      overflow: visible;
    }
    .panel-body.narrow .preview-card-wrapper {
      min-height: 160px;
    }

    /* ---- Left column: modules ---- */

    .modules-col {
      overflow-y: auto;
      padding: 10px 14px 16px;
      min-width: 0;
    }

    /* ---- Preset bar ---- */

    .preset-bar {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--divider-color, #383838);
    }

    .preset-bar select {
      flex: 1;
      min-width: 0;
      padding: 5px 8px;
      font-size: 12px;
      background: var(--card-background-color, #1c1c1c);
      color: var(--primary-text-color, #e1e1e1);
      border: 1px solid var(--divider-color, #383838);
      border-radius: 4px;
    }

    .btn-preset-save {
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      background: rgba(33, 150, 243, 0.15);
      color: #2196f3;
      border: 1px solid rgba(33, 150, 243, 0.3);
      border-radius: 4px;
      white-space: nowrap;
    }

    .btn-preset-save:hover { background: rgba(33, 150, 243, 0.25); }

    .btn-preset-delete {
      padding: 5px 8px;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      background: rgba(255, 0, 0, 0.12);
      color: #ff6b6b;
      border: 1px solid rgba(255, 0, 0, 0.25);
      border-radius: 4px;
    }

    .btn-preset-delete:hover { background: rgba(255, 0, 0, 0.22); }

    /* ---- Banners ---- */

    .warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(255, 152, 0, 0.15);
      border: 1px solid #ff9800;
      color: #ff9800;
      font-size: 12px;
      margin-bottom: 10px;
    }

    .btn-banner-action {
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      background: rgba(255, 152, 0, 0.15);
      color: #ff9800;
      border: 1px solid rgba(255, 152, 0, 0.4);
      border-radius: 4px;
      white-space: nowrap;
      margin-left: auto;
    }

    .btn-banner-action:hover { background: rgba(255, 152, 0, 0.28); }

    .info-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 8px;
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid #2196F3;
      color: #2196F3;
      font-size: 12px;
      margin-bottom: 10px;
    }

    .no-config {
      padding: 24px 16px;
      text-align: center;
      color: var(--secondary-text-color, #9e9e9e);
      border: 2px dashed var(--divider-color, #383838);
      border-radius: 8px;
      font-size: 13px;
    }

    .container-banner {
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(156, 39, 176, 0.12);
      border: 1px solid #9c27b0;
      color: #ce93d8;
      font-size: 12px;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    .container-banner strong {
      display: block;
      margin-bottom: 4px;
      color: #e1bee7;
    }

    /* ---- Right column: preview ---- */

    .preview-col {
      border-left: 1px solid var(--divider-color, #383838);
      padding: 10px 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .preview-col-label {
      flex-shrink: 0;
      font-size: 11px;
      color: var(--secondary-text-color, #9e9e9e);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .preview-card-wrapper {
      flex: 1;
      overflow: auto;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      background: var(--lovelace-background, #111111);
      border-radius: 8px;
      padding: 12px;
      min-height: 0;
      /* Prevent clicking live card elements — the cms-preview-picker overlay
         (positioned against this wrapper) owns all pointer events instead. */
      pointer-events: none;
      position: relative;
    }

    .preview-hint {
      flex-shrink: 0;
      font-size: 10px;
      color: var(--secondary-text-color, #9e9e9e);
      line-height: 1.4;
    }

    .preview-card-wrapper hui-card {
      width: 100%;
    }

    .preview-unavailable {
      font-size: 11px;
      color: var(--secondary-text-color, #9e9e9e);
      text-align: center;
      margin: auto;
    }
  `;
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    const hasPreview = !!(this.config && this.hass);
    return b`
      <div class="header">
        <span>🎨</span>
        <h2>Card-Mod Studio</h2>
        <span class="version">v${VERSION$1}</span>
      </div>

      <div class="panel-body ${hasPreview ? "" : "no-preview"} ${this._narrow ? "narrow" : ""}">
        <div class="modules-col">
          ${this._renderCompatBanner()}

          ${this._studioState ? b`
                ${this._renderPresetBar()}
                <cms-palette-manager .hass=${this.hass}></cms-palette-manager>
                ${this._renderModuleList(this._studioState)}
              ` : b`<div class="no-config">No card selected.</div>`}
        </div>

        ${hasPreview ? b`
              <div class="preview-col">
                <span class="preview-col-label">Preview</span>
                ${this._pickerActive ? b`<span class="preview-hint">Click any part of the preview to jump to its control</span>` : A}
                <div class="preview-card-wrapper">
                  ${this._renderPreviewContent()}
                </div>
              </div>
            ` : A}
      </div>
    `;
  }
  /** True when the click-to-edit picker overlays the preview. Container
   *  cards are skipped: their children/sections make per-element mapping
   *  ambiguous (which child's module would a click mean?). */
  get _pickerActive() {
    return !!this.config && !!this.hass && !this._isContainerCard && Boolean(customElements.get("hui-card"));
  }
  _renderPreviewContent() {
    if (!this.config || !this.hass) return A;
    const hasHuiCard = Boolean(customElements.get("hui-card"));
    if (!hasHuiCard) {
      return b`<p class="preview-unavailable">Preview unavailable — open a card editor first.</p>`;
    }
    const previewConfig = this._previewConfig ?? this.config;
    return b`
      ${i3(
      this._previewKey,
      b`<hui-card .hass=${this.hass} .config=${previewConfig}></hui-card>`
    )}
      ${this._pickerActive ? b`<cms-preview-picker
            .cardType=${this.config.type ?? ""}
            .rows=${this._rowEntityIds()}
            @cms-pick=${this._onPreviewPick}
          ></cms-preview-picker>` : A}
    `;
  }
  /** Entities cards: entity_id per row in config order (undefined for rows
   *  without one, keeping indices aligned with the DOM row order). */
  _rowEntityIds() {
    if (this.config?.type !== "entities") return [];
    const rows = this.config.entities ?? [];
    return rows.map((r2) => typeof r2 === "string" ? r2 : r2.entity);
  }
  /** Click-to-edit: scroll to the picked module, open it, flash it. */
  _onPreviewPick(e2) {
    const { module, rowEntity, rowIndex } = e2.detail;
    const el = this.shadowRoot?.querySelector(module);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (module === "cms-advanced-module") {
      el.open = true;
    } else if (module === "cms-entities-rows-module") {
      const index = typeof rowIndex === "number" && rowIndex >= 0 ? rowIndex : rowEntity ? this._rowEntityIds().indexOf(rowEntity) : -1;
      if (index >= 0 && el._openRows) {
        el._openRows = /* @__PURE__ */ new Set([...el._openRows, String(index)]);
      }
    } else {
      el._open = true;
    }
    el.style.transition = "box-shadow 0.3s ease";
    el.style.borderRadius = "8px";
    el.style.boxShadow = "0 0 0 2px var(--accent-color, #2196f3)";
    window.setTimeout(() => {
      el.style.boxShadow = "";
      window.setTimeout(() => {
        el.style.transition = "";
        el.style.borderRadius = "";
      }, 350);
    }, 1200);
  }
  _renderCompatBanner() {
    if (!this._cardModPresent && !this._uixPresent) {
      return b`<div class="warning-banner">
        ⚠️ card-mod/UIX not detected — install one of them first or styles won't apply.
      </div>`;
    }
    const atRisk = this._uixOnlyAtRisk || this._uixOnlyRowsAtRisk;
    if (atRisk) {
      if (this._uixOnlyUsesMacros) {
        return b`<div class="warning-banner">
          ⚠️ This card's styling uses UIX-only macros/billets and UIX isn't detected — it won't apply, and
          card-mod cannot run these features under any key. Reinstall UIX, or restyle this card manually.
        </div>`;
      }
      const what = this._uixOnlyAtRisk && this._uixOnlyRowsAtRisk ? "This card's styling, and one or more entity rows," : this._uixOnlyRowsAtRisk ? "One or more entity rows on this card" : "This card's styling";
      return b`<div class="warning-banner">
        ⚠️ ${what} is only under uix: and UIX isn't detected — it won't apply.
        <button class="btn-banner-action" @click=${this._copyUixStyleToCardMod}>Copy to card_mod</button>
      </div>`;
    }
    if (this._uixMacrosCoexist) {
      return b`<div class="info-banner">
        ℹ️ This card also has uix: macros/billets — studio edits update card_mod:, but UIX will keep
        rendering your uix: styling unchanged (macros/billets can't be auto-synced).
      </div>`;
    }
    if (this._uixMacrosWillBeOverwritten) {
      return b`<div class="info-banner">
        ℹ️ This card's uix: styling uses macros/billets — editing it here will replace that with
        plain generated CSS (macros/billets can't be regenerated from the visual controls).
      </div>`;
    }
    return A;
  }
  _renderPresetBar() {
    return b`
      <div class="preset-bar">
        <select .value=${this._selectedPreset} @change=${this._onPresetSelect}>
          <option value="">📋 Load preset…</option>
          ${this._presets.map(
      (p2) => b`<option value=${p2.name} ?selected=${p2.name === this._selectedPreset}>${p2.name}</option>`
    )}
        </select>
        ${this._selectedPreset ? b`<button class="btn-preset-delete" title="Delete preset" @click=${this._deleteSelectedPreset}>×</button>` : A}
        <button class="btn-preset-save" @click=${this._saveCurrentAsPreset}>💾 Save</button>
      </div>
    `;
  }
  _renderModuleList(s2) {
    if (this._isContainerCard) {
      return this._renderContainerCard(s2);
    }
    if (hasDictFormStyle(this.config ?? {})) {
      return b`
        <div class="container-banner">
          <strong>🔒 Hand-written shadow-piercing style — preserved as-is</strong>
          This card's styling is written in card-mod's dictionary form
          (<code>$</code> shadow-piercing), which the Studio can't edit yet —
          visual editing of this form is planned for v0.10. Nothing here will
          overwrite it: your styling is preserved exactly as written.
          ${this._isEntitiesCard ? b`Per-row styling below still works as usual.` : A}
        </div>
        ${this._renderEntityRowsModule()}
      `;
    }
    const stateAware = this._isStateAware;
    const showIconColor = this._showIconColor;
    const showAnimation = this._showAnimation;
    const showBackground = this._showBackground;
    const showBorder = this._showBorder;
    const showHeadingStyle = this._showHeadingStyle;
    const showFont = this._showFont;
    const hasUnrecognisedCss = !!s2.advanced.rawCss.trim();
    const conflicts = findAdvancedCssConflicts(s2.advanced.rawCss, s2);
    return b`
      ${hasUnrecognisedCss ? b`<div class="info-banner">
            ℹ️ Some existing styles weren't recognised — preserved in Advanced CSS.
          </div>` : A}

      ${showHeadingStyle ? b`<cms-heading-style-module
            .overridden=${!!conflicts.headingStyle}
            .overriddenDetail=${(conflicts.headingStyle ?? []).join(", ")}
            .state=${s2.headingStyle}
            @state-changed=${this._onHeadingStyleChanged}
          ></cms-heading-style-module>` : A}

      ${showFont ? b`<cms-font-module
            .overridden=${!!conflicts.font}
            .overriddenDetail=${(conflicts.font ?? []).join(", ")}
            .state=${s2.font}
            @state-changed=${this._onFontChanged}
          ></cms-font-module>` : A}

      <cms-filter-module
        .overridden=${!!conflicts.filter}
        .overriddenDetail=${(conflicts.filter ?? []).join(", ")}
        .state=${s2.filter}
        .stateAware=${stateAware}
        .hass=${this.hass}
        @state-changed=${this._onFilterChanged}
      ></cms-filter-module>

      ${!showHeadingStyle && !this._isEntitiesCard ? b`<cms-accent-color-module
            .overridden=${!!conflicts.accentColor}
            .overriddenDetail=${(conflicts.accentColor ?? []).join(", ")}
            .state=${s2.accentColor}
            .stateAware=${stateAware}
            .cardEntity=${this.config?.entity ?? ""}
            .cardType=${this.config?.type ?? ""}
            .hass=${this.hass}
            @state-changed=${this._onAccentColorChanged}
          ></cms-accent-color-module>` : A}

      ${showIconColor ? b`<cms-icon-color-module
            .overridden=${!!conflicts.iconColor}
            .overriddenDetail=${(conflicts.iconColor ?? []).join(", ")}
            .state=${s2.iconColor}
            .stateAware=${stateAware}
            .isLightCard=${this._isLightCard}
            .allowSize=${ICON_SIZE_TYPES.has(this.config?.type ?? "")}
            .cardEntity=${this.config?.entity ?? ""}
            .hass=${this.hass}
            @state-changed=${this._onIconColorChanged}
          ></cms-icon-color-module>` : A}

      ${!this._isEntitiesCard ? b`<cms-threshold-module
              .overridden=${!!conflicts.threshold}
              .overriddenDetail=${(conflicts.threshold ?? []).join(", ")}
              .state=${s2.threshold}
              .cardEntity=${this.config?.entity ?? ""}
              .cardType=${this.config?.type ?? ""}
              .hass=${this.hass}
              @state-changed=${this._onThresholdChanged}
            ></cms-threshold-module>` : A}

      ${showBackground ? b`<cms-background-module
            .overridden=${!!conflicts.background}
            .overriddenDetail=${(conflicts.background ?? []).join(", ")}
            .state=${s2.background}
            .stateAware=${stateAware}
            .hass=${this.hass}
            @state-changed=${this._onBackgroundChanged}
          ></cms-background-module>` : A}

      ${showAnimation ? b`<cms-animation-module
            .overridden=${!!conflicts.animation}
            .overriddenDetail=${(conflicts.animation ?? []).join(", ")}
            .state=${s2.animation}
            .stateAware=${stateAware}
            .hass=${this.hass}
            @state-changed=${this._onAnimationChanged}
          ></cms-animation-module>` : A}

      ${showBorder ? b`<cms-border-module
            .overridden=${!!conflicts.border}
            .overriddenDetail=${(conflicts.border ?? []).join(", ")}
            .state=${s2.border}
            .stateAware=${stateAware}
            .hass=${this.hass}
            @state-changed=${this._onBorderChanged}
          ></cms-border-module>` : A}

      <cms-advanced-module
        .state=${s2.advanced}
        ?open=${hasUnrecognisedCss}
        @state-changed=${this._onAdvancedChanged}
      ></cms-advanced-module>

      ${this._renderEntityRowsModule()}
    `;
  }
  _renderEntityRowsModule() {
    return this.config?.type === "entities" ? b`<cms-entities-rows-module
            .rows=${this.config.entities ?? []}
            .styles=${this._entityRowStyles}
            @styles-changed=${this._onEntityRowStylesChanged}
          ></cms-entities-rows-module>` : A;
  }
  _onChildConfigChanged(e2) {
    e2.stopPropagation();
    if (!this.config) return;
    const cards = this.config.cards;
    if (!Array.isArray(cards) || !cards[e2.detail.index]) return;
    const updatedCards = cards.map((c2, i4) => i4 === e2.detail.index ? e2.detail.config : c2);
    const newConfig = { ...this.config, cards: updatedCards };
    this._previewConfig = newConfig;
    this._previewKey++;
    this._echoGuard.noteEmitted(JSON.stringify(newConfig));
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: newConfig }
      })
    );
  }
  _renderContainerCard(s2) {
    const cardType = this.config?.type ?? "layout";
    const hasUnrecognisedCss = !!s2.advanced.rawCss.trim();
    const childCards = STYLABLE_CHILDREN_CARD_TYPES.has(cardType) ? this.config.cards ?? [] : null;
    return b`
      ${childCards ? b`
            <div class="container-banner">
              <strong>🗂️ Layout card — style each child card below</strong>
              "${cardType}" is a container: styles at this level have no
              visual effect, so every card inside it gets its own styling
              section here. Changes are saved into that child's own
              configuration — exactly what you'd get styling it as a
              standalone card.
            </div>
            ${childCards.map(
      (child, i4) => b`<cms-child-card-section
                .childConfig=${child}
                .index=${i4}
                .hass=${this.hass}
                @child-config-changed=${this._onChildConfigChanged}
              ></cms-child-card-section>`
    )}
          ` : b`
            <div class="container-banner">
              <strong>🗂️ Layout card — child styling isn't supported here yet</strong>
              "${cardType}" is a container: card-mod styles applied at this
              level have no visual effect, and this container type doesn't
              carry an editable <code>cards:</code> list the Studio can offer
              per-child sections for yet. To style a card inside it today,
              add the child's <code>card_mod:</code> in YAML by hand.
            </div>
          `}

      ${hasUnrecognisedCss ? b`<div class="info-banner">
            ℹ️ Some existing styles weren't recognised — preserved in Advanced CSS.
          </div>` : A}

      <cms-advanced-module
        .state=${s2.advanced}
        ?open=${hasUnrecognisedCss}
        @state-changed=${this._onAdvancedChanged}
      ></cms-advanced-module>
    `;
  }
}
__decorateClass$1([
  n2({ attribute: false })
], CmsPanel.prototype, "config");
__decorateClass$1([
  n2({ attribute: false })
], CmsPanel.prototype, "hass");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_cardModPresent");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_uixPresent");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_studioState");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_previewConfig");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_previewKey");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_presets");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_selectedPreset");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_entityRowStyles");
__decorateClass$1([
  r()
], CmsPanel.prototype, "_narrow");
customElements.define("cms-panel", CmsPanel);
var __defProp = Object.defineProperty;
var __decorateClass = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key, result) || result;
  if (result) __defProp(target, key, result);
  return result;
};
class CmsTabButton extends i$3 {
  constructor() {
    super(...arguments);
    this.active = false;
  }
  static {
    this.styles = i$6`
    :host {
      display: inline-flex;
      align-items: center;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      font-family: var(--primary-font-family, sans-serif);
      font-weight: 500;
      transition: background 0.15s ease, color 0.15s ease;
      background: transparent;
      color: var(--secondary-text-color, #727272);
    }

    button:hover {
      background: var(--secondary-background-color, #f5f5f5);
      color: var(--primary-text-color, #212121);
    }

    :host([active]) button {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    :host([active]) button:hover {
      background: var(--dark-primary-color, #0288d1);
    }

    .icon {
      font-size: 16px;
      line-height: 1;
    }
  `;
  }
  _handleClick() {
    this.active = !this.active;
    this.dispatchEvent(
      new CustomEvent("cms-tab-toggle", {
        detail: { active: this.active },
        bubbles: true,
        composed: true
      })
    );
  }
  render() {
    return b`
      <button
        @click=${this._handleClick}
        title="${this.active ? "Close Card-Mod Studio" : "Open Card-Mod Studio style editor"}"
        aria-pressed="${this.active}"
      >
        <span class="icon">🎨</span>
        Style
      </button>
    `;
  }
}
__decorateClass([
  n2({ type: Boolean, reflect: true })
], CmsTabButton.prototype, "active");
customElements.define("cms-tab-button", CmsTabButton);
const CMS_BUTTON_ATTR = "data-cms-injected";
const CMS_PANEL_ID = "cms-style-panel";
const SECONDARY_ACTION_SELECTOR = "ha-button[slot=secondaryAction]";
function getPanelHost(dialog) {
  const root = dialog.shadowRoot;
  if (!root) return null;
  const cardEditor = root.querySelector(HA_CARD_EDITOR_ELEMENT);
  return cardEditor?.shadowRoot ?? root;
}
function tryExpandDialog(dialog) {
  const root = dialog.shadowRoot;
  if (!root) return;
  const haDialog = root.querySelector("ha-dialog");
  if (haDialog) {
    haDialog.style.setProperty("--mdc-dialog-max-height", "92vh");
    const nativeDialogEl = haDialog.shadowRoot?.querySelector("wa-dialog")?.shadowRoot?.querySelector("dialog");
    nativeDialogEl?.style.setProperty("max-height", "92vh");
  }
  const cardEditor = root.querySelector("hui-card-element-editor");
  if (cardEditor) {
    cardEditor.style.display = "block";
    cardEditor.style.minHeight = "72vh";
  }
}
function togglePanel(dialog, active) {
  const host = getPanelHost(dialog);
  if (!host) return;
  let panel = host.getElementById(CMS_PANEL_ID);
  if (active) {
    tryExpandDialog(dialog);
    if (!panel) {
      panel = document.createElement("cms-panel");
      panel.id = CMS_PANEL_ID;
      panel.config = dialog._cardConfig;
      panel.hass = dialog.hass;
      host.appendChild(panel);
    } else {
      panel.config = dialog._cardConfig;
      panel.hass = dialog.hass;
      panel.style.display = "";
    }
  } else {
    if (panel) {
      panel.style.display = "none";
    }
  }
}
function injectButton(dialog) {
  const root = dialog.shadowRoot;
  if (!root) return;
  if (root.querySelector(`[${CMS_BUTTON_ATTR}]`)) return;
  const existingButton = root.querySelector(SECONDARY_ACTION_SELECTOR);
  if (!existingButton) {
    const children = Array.from(root.children).map(
      (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.className ? `.${[...el.classList].join(".")}` : "") + (el.getAttribute("slot") ? `[slot=${el.getAttribute("slot")}]` : "")
    );
    console.warn(
      "[Card-Mod Studio] Could not find ha-button[slot=secondaryAction] in hui-dialog-edit-card shadow root. Style button will not appear. This may be caused by a Home Assistant update. Shadow root direct children: " + (children.length ? children.join(", ") : "(none)") + "\nPlease report at https://github.com/dertrolli/card-mod-studio/issues"
    );
    return;
  }
  const tabButton = document.createElement("cms-tab-button");
  tabButton.setAttribute(CMS_BUTTON_ATTR, "true");
  tabButton.setAttribute("slot", "secondaryAction");
  tabButton.addEventListener("cms-tab-toggle", (ev) => {
    const detail = ev.detail;
    togglePanel(dialog, detail.active);
  });
  existingButton.parentNode?.insertBefore(tabButton, existingButton);
}
function patchDialogElement(DialogClass) {
  const proto = DialogClass.prototype;
  if (proto._cmsPatched) {
    console.info(
      "[Card-Mod Studio] Dialog already patched by another CMS instance, skipping."
    );
    return;
  }
  proto._cmsPatched = true;
  const originalUpdated = proto.updated;
  proto.updated = function(changedProps) {
    if (originalUpdated) {
      originalUpdated.call(this, changedProps);
    }
    requestAnimationFrame(() => {
      try {
        injectButton(this);
        const host = getPanelHost(this);
        if (!host) return;
        const panel = host.getElementById(CMS_PANEL_ID);
        if (panel && panel.style.display !== "none") {
          panel.config = this._cardConfig;
          panel.hass = this.hass;
        }
      } catch (err) {
        console.error("[Card-Mod Studio] Error during injection:", err);
      }
    });
  };
  console.info("[Card-Mod Studio] hui-dialog-edit-card patched successfully.");
}
function injectIntoExistingDialogs() {
  document.querySelectorAll(HA_DIALOG_ELEMENT).forEach((dialog) => {
    requestAnimationFrame(() => {
      try {
        injectButton(dialog);
      } catch (err) {
        console.error("[Card-Mod Studio] Error injecting into existing dialog:", err);
      }
    });
  });
}
async function patchFormEditor() {
  await customElements.whenDefined("hui-form-editor");
  const FormEditorClass = customElements.get("hui-form-editor");
  if (!FormEditorClass) return;
  const proto = FormEditorClass.prototype;
  if (proto._cmsFormPatched || typeof proto.setConfig !== "function") return;
  proto._cmsFormPatched = true;
  const originalSetConfig = proto.setConfig;
  proto.setConfig = function(config) {
    const originalAssert = this.assertConfig;
    if (originalAssert && config && (config.uix || config.card_mod)) {
      this.assertConfig = (c2) => {
        const copy = { ...c2 };
        delete copy.uix;
        delete copy.card_mod;
        originalAssert.call(this, copy);
      };
    }
    try {
      originalSetConfig.call(this, config);
    } finally {
      if (originalAssert) this.assertConfig = originalAssert;
    }
  };
  console.info("[Card-Mod Studio] hui-form-editor patched (uix:/card_mod: tolerated by visual editor).");
}
async function startInjector() {
  console.info("[Card-Mod Studio] Waiting for hui-dialog-edit-card...");
  void patchFormEditor().catch(
    (err) => console.error("[Card-Mod Studio] hui-form-editor patch failed:", err)
  );
  await customElements.whenDefined(HA_DIALOG_ELEMENT);
  const DialogClass = customElements.get(HA_DIALOG_ELEMENT);
  if (!DialogClass) {
    console.error(
      "[Card-Mod Studio] hui-dialog-edit-card was defined but could not be retrieved. This is unexpected — please report this issue."
    );
    return;
  }
  patchDialogElement(DialogClass);
  injectIntoExistingDialogs();
}
const VERSION = "0.9.1";
if (window.cardModStudio) {
  console.warn(
    `[Card-Mod Studio] Already loaded (v${window.cardModStudio.version}). Skipping load of v${VERSION}. If you see duplicate "Style" buttons, clear your browser cache.`
  );
} else {
  const meta = { version: VERSION, injected: false };
  window.cardModStudio = meta;
  const cardModPresent = isCardModInstalled();
  const uixPresent = isUixInstalled();
  if (!cardModPresent && !uixPresent) {
    console.warn(
      "[Card-Mod Studio] Neither card-mod nor UIX is detected. Install one of them via HACS first. The style editor UI will still open, but generated YAML will not apply until one is present."
    );
  } else if (uixPresent && !cardModPresent) {
    console.info("[Card-Mod Studio] UIX detected ✓");
  } else {
    console.info("[Card-Mod Studio] card-mod detected ✓");
  }
  startInjector().then(() => {
    meta.injected = true;
    console.info(
      `%c CARD-MOD STUDIO %c v${VERSION} `,
      "color: white; background: #03a9f4; font-weight: bold; padding: 2px 4px; border-radius: 3px 0 0 3px;",
      "color: #03a9f4; background: #fff; font-weight: bold; padding: 2px 4px; border-radius: 0 3px 3px 0; border: 1px solid #03a9f4;"
    );
  }).catch((err) => {
    console.error("[Card-Mod Studio] Injection failed:", err);
  });
}
//# sourceMappingURL=card-mod-studio.js.map
