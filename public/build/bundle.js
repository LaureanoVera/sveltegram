
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const likeCount = writable(0);

    /* src\components\Header.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$b = "src\\components\\Header.svelte";

    function create_fragment$c(ctx) {
    	let header;
    	let div3;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let ul;
    	let li0;
    	let t1_value = (/*$likeCount*/ ctx[0] === 0 ? "" : /*$likeCount*/ ctx[0]) + "";
    	let t1;
    	let i0;
    	let t2;
    	let li1;
    	let i1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			t1 = text(t1_value);
    			i0 = element("i");
    			t2 = space();
    			li1 = element("li");
    			i1 = element("i");
    			if (img.src !== (img_src_value = "favicon.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "svelte-1a8a6um");
    			add_location(img, file$b, 15, 8, 339);
    			attr_dev(div0, "class", "Header-logo svelte-1a8a6um");
    			add_location(div0, file$b, 14, 6, 304);
    			attr_dev(i0, "class", "fas fa-heart svelte-1a8a6um");
    			add_location(i0, file$b, 24, 50, 713);
    			attr_dev(li0, "class", "svelte-1a8a6um");
    			add_location(li0, file$b, 24, 10, 673);
    			attr_dev(i1, "class", "fas fa-user-alt svelte-1a8a6um");
    			add_location(i1, file$b, 25, 14, 760);
    			attr_dev(li1, "class", "svelte-1a8a6um");
    			add_location(li1, file$b, 25, 10, 756);
    			attr_dev(ul, "class", "svelte-1a8a6um");
    			add_location(ul, file$b, 18, 8, 429);
    			attr_dev(div1, "class", "Header-nav");
    			add_location(div1, file$b, 17, 6, 395);
    			attr_dev(div2, "class", "Header-content svelte-1a8a6um");
    			add_location(div2, file$b, 13, 4, 268);
    			attr_dev(div3, "class", "Header-container svelte-1a8a6um");
    			add_location(div3, file$b, 12, 2, 232);
    			attr_dev(header, "class", "Header svelte-1a8a6um");
    			add_location(header, file$b, 11, 0, 205);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, t1);
    			append_dev(li0, i0);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, i1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$likeCount*/ 1 && t1_value !== (t1_value = (/*$likeCount*/ ctx[0] === 0 ? "" : /*$likeCount*/ ctx[0]) + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $likeCount;
    	validate_store(likeCount, "likeCount");
    	component_subscribe($$self, likeCount, $$value => $$invalidate(0, $likeCount = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { toggleTheme = false } = $$props;

    	function handleIcon() {
    		$$invalidate(1, toggleTheme = !toggleTheme);
    		console.log(toggleTheme);
    	}

    	const writable_props = ["toggleTheme"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("toggleTheme" in $$props) $$invalidate(1, toggleTheme = $$props.toggleTheme);
    	};

    	$$self.$capture_state = () => ({
    		likeCount,
    		toggleTheme,
    		handleIcon,
    		$likeCount
    	});

    	$$self.$inject_state = $$props => {
    		if ("toggleTheme" in $$props) $$invalidate(1, toggleTheme = $$props.toggleTheme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$likeCount, toggleTheme];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { toggleTheme: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get toggleTheme() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleTheme(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Main.svelte generated by Svelte v3.38.2 */

    const file$a = "src\\components\\Main.svelte";

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "Main-container svelte-lojzfq");
    			add_location(div0, file$a, 4, 2, 45);
    			attr_dev(div1, "class", "Main svelte-lojzfq");
    			add_location(div1, file$a, 3, 0, 23);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Main", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }

    /* src\components\Comments.svelte generated by Svelte v3.38.2 */

    const file$9 = "src\\components\\Comments.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (20:4) {#each comments as comment (comment.id)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let h3;
    	let t0_value = /*comment*/ ctx[2].username + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*comment*/ ctx[2].text + "";
    	let t2;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			attr_dev(h3, "class", "svelte-13gbskt");
    			add_location(h3, file$9, 21, 8, 503);
    			attr_dev(span, "class", "svelte-13gbskt");
    			add_location(span, file$9, 22, 8, 540);
    			attr_dev(div, "class", "Comments-users svelte-13gbskt");
    			add_location(div, file$9, 20, 6, 465);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, span);
    			append_dev(span, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*comments*/ 1 && t0_value !== (t0_value = /*comment*/ ctx[2].username + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*comments*/ 1 && t2_value !== (t2_value = /*comment*/ ctx[2].text + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(20:4) {#each comments as comment (comment.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let div0;
    	let form;
    	let input;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*comments*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*comment*/ ctx[2].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div0 = element("div");
    			form = element("form");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Post";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "Comments-input svelte-13gbskt");
    			attr_dev(input, "placeholder", "Add Comment...");
    			attr_dev(input, "id", "text");
    			add_location(input, file$9, 28, 8, 690);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-13gbskt");
    			add_location(button, file$9, 34, 8, 836);
    			attr_dev(form, "class", "svelte-13gbskt");
    			add_location(form, file$9, 27, 6, 636);
    			attr_dev(div0, "class", "Comments-add svelte-13gbskt");
    			add_location(div0, file$9, 26, 4, 602);
    			attr_dev(div1, "class", "Comments-content svelte-13gbskt");
    			add_location(div1, file$9, 18, 2, 381);
    			attr_dev(div2, "class", "Comments svelte-13gbskt");
    			add_location(div2, file$9, 17, 0, 355);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, form);
    			append_dev(form, input);
    			append_dev(form, t1);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(/*addComment*/ ctx[1]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*comments*/ 1) {
    				each_value = /*comments*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block$1, t0, get_each_context$1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Comments", slots, []);
    	let { comments = [] } = $$props;

    	function addComment(event) {
    		const msg = event.target.text.value;

    		if (msg.length > 3) {
    			const message = {
    				id: Date.now(),
    				text: msg,
    				username: "LauriDev"
    			};

    			$$invalidate(0, comments = [...comments, message]);
    			event.target.text.value = "";
    		}
    	}

    	const writable_props = ["comments"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Comments> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("comments" in $$props) $$invalidate(0, comments = $$props.comments);
    	};

    	$$self.$capture_state = () => ({ comments, addComment });

    	$$self.$inject_state = $$props => {
    		if ("comments" in $$props) $$invalidate(0, comments = $$props.comments);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [comments, addComment];
    }

    class Comments extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { comments: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Comments",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get comments() {
    		throw new Error("<Comments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comments(value) {
    		throw new Error("<Comments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Modal.svelte generated by Svelte v3.38.2 */

    const file$8 = "src\\components\\Modal.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "Modal-overlay svelte-1h16sv");
    			add_location(div0, file$8, 1, 2, 23);
    			attr_dev(div1, "class", "Modal svelte-1h16sv");
    			add_location(div1, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\Share.svelte generated by Svelte v3.38.2 */

    const file$7 = "src\\components\\Share.svelte";

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let h2;
    	let t1;
    	let i0;
    	let t2;
    	let div1;
    	let a;
    	let i1;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Share";
    			t1 = space();
    			i0 = element("i");
    			t2 = space();
    			div1 = element("div");
    			a = element("a");
    			i1 = element("i");
    			t3 = text("\r\n      \r\n      Share on Facebook");
    			attr_dev(h2, "class", "svelte-un87zz");
    			add_location(h2, file$7, 2, 4, 53);
    			attr_dev(i0, "class", "fas fa-times-circle svelte-un87zz");
    			add_location(i0, file$7, 3, 4, 73);
    			attr_dev(div0, "class", "Share-head svelte-un87zz");
    			add_location(div0, file$7, 1, 2, 23);
    			attr_dev(i1, "class", "fab fa-facebook-square svelte-un87zz");
    			add_location(i1, file$7, 10, 6, 445);
    			attr_dev(a, "href", "https://www.facebook.com/sharer/sharer.php?&u=https://pugstagram.co");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-un87zz");
    			add_location(a, file$7, 8, 4, 283);
    			attr_dev(div1, "class", "Share-content svelte-un87zz");
    			add_location(div1, file$7, 6, 2, 192);
    			attr_dev(div2, "class", "Share svelte-un87zz");
    			add_location(div2, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, i0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, a);
    			append_dev(a, i1);
    			append_dev(a, t3);

    			if (!mounted) {
    				dispose = listen_dev(i0, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Share", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Share> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	return [click_handler];
    }

    class Share extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Share",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\Card.svelte generated by Svelte v3.38.2 */
    const file$6 = "src\\components\\Card.svelte";

    // (33:2) {#if isModal}
    function create_if_block(ctx) {
    	let div;
    	let modal;
    	let div_transition;
    	let current;

    	modal = new Modal({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(modal.$$.fragment);
    			add_location(div, file$6, 33, 4, 718);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(modal, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, blur, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, blur, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(modal);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:2) {#if isModal}",
    		ctx
    	});

    	return block;
    }

    // (35:6) <Modal>
    function create_default_slot$1(ctx) {
    	let share;
    	let current;
    	share = new Share({ $$inline: true });
    	share.$on("click", /*handleClick*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(share.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(share, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(share.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(share.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(share, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(35:6) <Modal>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div8;
    	let t0;
    	let div7;
    	let header;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let h2;
    	let t2;
    	let span0;
    	let t3;
    	let t4;
    	let div1;
    	let i0;
    	let t5;
    	let div2;
    	let figure;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let div5;
    	let div3;
    	let i1;
    	let t7;
    	let i2;
    	let t8;
    	let div4;
    	let i3;
    	let t9;
    	let div6;
    	let h3;
    	let t10;
    	let t11;
    	let span1;
    	let t12;
    	let t13;
    	let comments_1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isModal*/ ctx[6] && create_if_block(ctx);

    	comments_1 = new Comments({
    			props: { comments: /*comments*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div7 = element("div");
    			header = element("header");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(/*username*/ ctx[0]);
    			span0 = element("span");
    			t3 = text(/*location*/ ctx[1]);
    			t4 = space();
    			div1 = element("div");
    			i0 = element("i");
    			t5 = space();
    			div2 = element("div");
    			figure = element("figure");
    			img1 = element("img");
    			t6 = space();
    			div5 = element("div");
    			div3 = element("div");
    			i1 = element("i");
    			t7 = space();
    			i2 = element("i");
    			t8 = space();
    			div4 = element("div");
    			i3 = element("i");
    			t9 = space();
    			div6 = element("div");
    			h3 = element("h3");
    			t10 = text(/*username*/ ctx[0]);
    			t11 = space();
    			span1 = element("span");
    			t12 = text(/*postComment*/ ctx[3]);
    			t13 = space();
    			create_component(comments_1.$$.fragment);
    			if (img0.src !== (img0_src_value = /*avatar*/ ctx[5])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", /*username*/ ctx[0]);
    			attr_dev(img0, "class", "svelte-gmernt");
    			add_location(img0, file$6, 43, 8, 944);
    			attr_dev(span0, "class", "svelte-gmernt");
    			add_location(span0, file$6, 44, 22, 1001);
    			attr_dev(h2, "class", "svelte-gmernt");
    			add_location(h2, file$6, 44, 8, 987);
    			attr_dev(div0, "class", "Card-user svelte-gmernt");
    			add_location(div0, file$6, 42, 6, 911);
    			attr_dev(i0, "class", "fas fa-ellipsis-h svelte-gmernt");
    			add_location(i0, file$6, 47, 8, 1088);
    			attr_dev(div1, "class", "Card-settings svelte-gmernt");
    			add_location(div1, file$6, 46, 6, 1051);
    			attr_dev(header, "class", "Card-Header svelte-gmernt");
    			add_location(header, file$6, 41, 4, 875);
    			if (img1.src !== (img1_src_value = /*photo*/ ctx[2])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", /*username*/ ctx[0]);
    			attr_dev(img1, "class", "svelte-gmernt");
    			add_location(img1, file$6, 52, 10, 1235);
    			attr_dev(figure, "class", "svelte-gmernt");
    			add_location(figure, file$6, 51, 8, 1190);
    			attr_dev(div2, "class", "Card-photo svelte-gmernt");
    			add_location(div2, file$6, 50, 6, 1156);
    			attr_dev(i1, "class", "fas fa-heart svelte-gmernt");
    			toggle_class(i1, "active-like", /*like*/ ctx[7]);
    			add_location(i1, file$6, 57, 10, 1384);
    			attr_dev(i2, "class", "fas fa-paper-plane svelte-gmernt");
    			add_location(i2, file$6, 60, 10, 1494);
    			attr_dev(div3, "class", "Card-icons-firts");
    			add_location(div3, file$6, 56, 8, 1342);
    			attr_dev(i3, "class", "fas fa-bookmark svelte-gmernt");
    			toggle_class(i3, "active-bookmark", /*bookmark*/ ctx[8]);
    			add_location(i3, file$6, 63, 10, 1619);
    			attr_dev(div4, "class", "Card-icons-seconds");
    			add_location(div4, file$6, 62, 8, 1575);
    			attr_dev(div5, "class", "Card-icons svelte-gmernt");
    			add_location(div5, file$6, 55, 6, 1308);
    			attr_dev(h3, "class", "svelte-gmernt");
    			add_location(h3, file$6, 69, 6, 1820);
    			attr_dev(span1, "class", "svelte-gmernt");
    			add_location(span1, file$6, 70, 6, 1847);
    			attr_dev(div6, "class", "Card-description svelte-gmernt");
    			add_location(div6, file$6, 68, 4, 1782);
    			attr_dev(div7, "class", "Card-container");
    			add_location(div7, file$6, 40, 2, 841);
    			attr_dev(div8, "class", "Card svelte-gmernt");
    			add_location(div8, file$6, 31, 0, 677);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			if (if_block) if_block.m(div8, null);
    			append_dev(div8, t0);
    			append_dev(div8, div7);
    			append_dev(div7, header);
    			append_dev(header, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t1);
    			append_dev(div0, h2);
    			append_dev(h2, t2);
    			append_dev(h2, span0);
    			append_dev(span0, t3);
    			append_dev(header, t4);
    			append_dev(header, div1);
    			append_dev(div1, i0);
    			append_dev(div7, t5);
    			append_dev(div7, div2);
    			append_dev(div2, figure);
    			append_dev(figure, img1);
    			append_dev(div7, t6);
    			append_dev(div7, div5);
    			append_dev(div5, div3);
    			append_dev(div3, i1);
    			append_dev(div3, t7);
    			append_dev(div3, i2);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, i3);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, h3);
    			append_dev(h3, t10);
    			append_dev(div6, t11);
    			append_dev(div6, span1);
    			append_dev(span1, t12);
    			append_dev(div7, t13);
    			mount_component(comments_1, div7, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(figure, "dblclick", /*handleLike*/ ctx[10], false, false, false),
    					listen_dev(i1, "click", /*handleLike*/ ctx[10], false, false, false),
    					listen_dev(i2, "click", /*handleClick*/ ctx[9], false, false, false),
    					listen_dev(i3, "click", /*click_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isModal*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isModal*/ 64) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div8, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*avatar*/ 32 && img0.src !== (img0_src_value = /*avatar*/ ctx[5])) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (!current || dirty & /*username*/ 1) {
    				attr_dev(img0, "alt", /*username*/ ctx[0]);
    			}

    			if (!current || dirty & /*username*/ 1) set_data_dev(t2, /*username*/ ctx[0]);
    			if (!current || dirty & /*location*/ 2) set_data_dev(t3, /*location*/ ctx[1]);

    			if (!current || dirty & /*photo*/ 4 && img1.src !== (img1_src_value = /*photo*/ ctx[2])) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (!current || dirty & /*username*/ 1) {
    				attr_dev(img1, "alt", /*username*/ ctx[0]);
    			}

    			if (dirty & /*like*/ 128) {
    				toggle_class(i1, "active-like", /*like*/ ctx[7]);
    			}

    			if (dirty & /*bookmark*/ 256) {
    				toggle_class(i3, "active-bookmark", /*bookmark*/ ctx[8]);
    			}

    			if (!current || dirty & /*username*/ 1) set_data_dev(t10, /*username*/ ctx[0]);
    			if (!current || dirty & /*postComment*/ 8) set_data_dev(t12, /*postComment*/ ctx[3]);
    			const comments_1_changes = {};
    			if (dirty & /*comments*/ 16) comments_1_changes.comments = /*comments*/ ctx[4];
    			comments_1.$set(comments_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(comments_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(comments_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if (if_block) if_block.d();
    			destroy_component(comments_1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, []);
    	let { username } = $$props;
    	let { location } = $$props;
    	let { photo } = $$props;
    	let { postComment } = $$props;
    	let { comments } = $$props;
    	let { avatar } = $$props;
    	let isModal = false;
    	let like = false;
    	let bookmark = false;

    	function handleClick() {
    		$$invalidate(6, isModal = !isModal);
    	}

    	function handleLike() {
    		$$invalidate(7, like = !like);

    		if (like) {
    			likeCount.update(n => n + 1);
    		} else {
    			likeCount.update(n => n - 1);
    		}
    	}

    	const writable_props = ["username", "location", "photo", "postComment", "comments", "avatar"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(8, bookmark = !bookmark);

    	$$self.$$set = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("location" in $$props) $$invalidate(1, location = $$props.location);
    		if ("photo" in $$props) $$invalidate(2, photo = $$props.photo);
    		if ("postComment" in $$props) $$invalidate(3, postComment = $$props.postComment);
    		if ("comments" in $$props) $$invalidate(4, comments = $$props.comments);
    		if ("avatar" in $$props) $$invalidate(5, avatar = $$props.avatar);
    	};

    	$$self.$capture_state = () => ({
    		blur,
    		Comments,
    		Modal,
    		Share,
    		likeCount,
    		username,
    		location,
    		photo,
    		postComment,
    		comments,
    		avatar,
    		isModal,
    		like,
    		bookmark,
    		handleClick,
    		handleLike
    	});

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("location" in $$props) $$invalidate(1, location = $$props.location);
    		if ("photo" in $$props) $$invalidate(2, photo = $$props.photo);
    		if ("postComment" in $$props) $$invalidate(3, postComment = $$props.postComment);
    		if ("comments" in $$props) $$invalidate(4, comments = $$props.comments);
    		if ("avatar" in $$props) $$invalidate(5, avatar = $$props.avatar);
    		if ("isModal" in $$props) $$invalidate(6, isModal = $$props.isModal);
    		if ("like" in $$props) $$invalidate(7, like = $$props.like);
    		if ("bookmark" in $$props) $$invalidate(8, bookmark = $$props.bookmark);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		location,
    		photo,
    		postComment,
    		comments,
    		avatar,
    		isModal,
    		like,
    		bookmark,
    		handleClick,
    		handleLike,
    		click_handler
    	];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			username: 0,
    			location: 1,
    			photo: 2,
    			postComment: 3,
    			comments: 4,
    			avatar: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*username*/ ctx[0] === undefined && !("username" in props)) {
    			console.warn("<Card> was created without expected prop 'username'");
    		}

    		if (/*location*/ ctx[1] === undefined && !("location" in props)) {
    			console.warn("<Card> was created without expected prop 'location'");
    		}

    		if (/*photo*/ ctx[2] === undefined && !("photo" in props)) {
    			console.warn("<Card> was created without expected prop 'photo'");
    		}

    		if (/*postComment*/ ctx[3] === undefined && !("postComment" in props)) {
    			console.warn("<Card> was created without expected prop 'postComment'");
    		}

    		if (/*comments*/ ctx[4] === undefined && !("comments" in props)) {
    			console.warn("<Card> was created without expected prop 'comments'");
    		}

    		if (/*avatar*/ ctx[5] === undefined && !("avatar" in props)) {
    			console.warn("<Card> was created without expected prop 'avatar'");
    		}
    	}

    	get username() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set username(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get location() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get photo() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set photo(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get postComment() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set postComment(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get comments() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comments(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get avatar() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set avatar(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.38.2 */

    const file$5 = "src\\components\\Footer.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t0;
    	let span;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("©2021 ");
    			span = element("span");
    			span.textContent = "LAUREANO VERA";
    			add_location(span, file$5, 2, 38, 94);
    			attr_dev(p, "class", "Footer-copy");
    			add_location(p, file$5, 2, 4, 60);
    			attr_dev(div0, "class", "Footer-container");
    			add_location(div0, file$5, 1, 2, 24);
    			attr_dev(div1, "class", "Footer svelte-kbe64f");
    			add_location(div1, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(p, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\TimeLine.svelte generated by Svelte v3.38.2 */
    const file$4 = "src\\components\\TimeLine.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (14:4) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file$4, 14, 6, 338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(14:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:4) {#each posts as post}
    function create_each_block(ctx) {
    	let card;
    	let current;
    	const card_spread_levels = [/*post*/ ctx[1]];
    	let card_props = {};

    	for (let i = 0; i < card_spread_levels.length; i += 1) {
    		card_props = assign(card_props, card_spread_levels[i]);
    	}

    	card = new Card({ props: card_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = (dirty & /*posts*/ 1)
    			? get_spread_update(card_spread_levels, [get_spread_object(/*post*/ ctx[1])])
    			: {};

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(12:4) {#each posts as post}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let current;
    	let each_value = /*posts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(div0, "class", "TimeLine-container");
    			add_location(div0, file$4, 10, 2, 232);
    			attr_dev(div1, "class", "TimeLine svelte-1rnklec");
    			add_location(div1, file$4, 9, 0, 206);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*posts*/ 1) {
    				each_value = /*posts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(div0, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TimeLine", slots, []);
    	let { posts = [] } = $$props;
    	const writable_props = ["posts"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TimeLine> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("posts" in $$props) $$invalidate(0, posts = $$props.posts);
    	};

    	$$self.$capture_state = () => ({ App, Card, Comments, Footer, posts });

    	$$self.$inject_state = $$props => {
    		if ("posts" in $$props) $$invalidate(0, posts = $$props.posts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [posts];
    }

    class TimeLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { posts: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeLine",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get posts() {
    		throw new Error("<TimeLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set posts(value) {
    		throw new Error("<TimeLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Profile.svelte generated by Svelte v3.38.2 */

    const file$3 = "src\\components\\Profile.svelte";

    function create_fragment$4(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h2;
    	let t2;
    	let span;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "LauriVera";
    			t2 = space();
    			span = element("span");
    			span.textContent = "LaureanoVera";
    			if (img.src !== (img_src_value = "https://avatars.githubusercontent.com/u/77276651?v=4")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1hmmsrx");
    			add_location(img, file$3, 6, 6, 119);
    			attr_dev(div0, "class", "Profile-avatar svelte-1hmmsrx");
    			add_location(div0, file$3, 5, 4, 83);
    			attr_dev(h2, "class", "svelte-1hmmsrx");
    			add_location(h2, file$3, 9, 6, 242);
    			attr_dev(span, "class", "svelte-1hmmsrx");
    			add_location(span, file$3, 10, 6, 268);
    			attr_dev(div1, "class", "Profile-info svelte-1hmmsrx");
    			add_location(div1, file$3, 8, 4, 208);
    			attr_dev(div2, "class", "Profile-content svelte-1hmmsrx");
    			add_location(div2, file$3, 4, 2, 48);
    			attr_dev(div3, "class", "Profile");
    			add_location(div3, file$3, 3, 0, 23);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t2);
    			append_dev(div1, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Profile", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Profile> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Profile",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Storie.svelte generated by Svelte v3.38.2 */

    const file$2 = "src\\components\\Storie.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t1;
    	let t2;
    	let span;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(/*username*/ ctx[0]);
    			t2 = space();
    			span = element("span");
    			t3 = text(/*time*/ ctx[2]);
    			if (img.src !== (img_src_value = /*avatar*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*username*/ ctx[0]);
    			attr_dev(img, "class", "svelte-169jltu");
    			add_location(img, file$2, 9, 6, 243);
    			attr_dev(div0, "class", "Stories-item-box svelte-169jltu");
    			add_location(div0, file$2, 8, 4, 205);
    			attr_dev(span, "class", "svelte-169jltu");
    			add_location(span, file$2, 11, 19, 309);
    			attr_dev(h2, "class", "svelte-169jltu");
    			add_location(h2, file$2, 11, 4, 294);
    			attr_dev(div1, "class", "Stories-item svelte-169jltu");
    			add_location(div1, file$2, 7, 2, 173);
    			attr_dev(div2, "class", "Stories-items svelte-169jltu");
    			add_location(div2, file$2, 6, 0, 142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, span);
    			append_dev(span, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*avatar*/ 2 && img.src !== (img_src_value = /*avatar*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*username*/ 1) {
    				attr_dev(img, "alt", /*username*/ ctx[0]);
    			}

    			if (dirty & /*username*/ 1) set_data_dev(t1, /*username*/ ctx[0]);
    			if (dirty & /*time*/ 4) set_data_dev(t3, /*time*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Storie", slots, []);
    	let { username = "Anonymous" } = $$props;
    	let { avatar = "../../img/anonymous.jpg" } = $$props;
    	let { time = "-----" } = $$props;
    	const writable_props = ["username", "avatar", "time"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Storie> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("avatar" in $$props) $$invalidate(1, avatar = $$props.avatar);
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    	};

    	$$self.$capture_state = () => ({ username, avatar, time });

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("avatar" in $$props) $$invalidate(1, avatar = $$props.avatar);
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [username, avatar, time];
    }

    class Storie extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { username: 0, avatar: 1, time: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Storie",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get username() {
    		throw new Error("<Storie>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set username(value) {
    		throw new Error("<Storie>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get avatar() {
    		throw new Error("<Storie>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set avatar(value) {
    		throw new Error("<Storie>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time() {
    		throw new Error("<Storie>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error("<Storie>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Stories.svelte generated by Svelte v3.38.2 */
    const file$1 = "src\\components\\Stories.svelte";

    function create_fragment$2(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let span;
    	let t3;
    	let storie0;
    	let t4;
    	let storie1;
    	let t5;
    	let storie2;
    	let t6;
    	let storie3;
    	let t7;
    	let div2;
    	let i;
    	let current;
    	let mounted;
    	let dispose;

    	storie0 = new Storie({
    			props: {
    				username: "Uzumaki.404",
    				avatar: "../../img/uzumaki.404.jpg",
    				time: "17 hours"
    			},
    			$$inline: true
    		});

    	storie1 = new Storie({
    			props: {
    				username: "Dead_Cool",
    				avatar: "../../img/dead_cool.jpg",
    				time: "24 minutes"
    			},
    			$$inline: true
    		});

    	storie2 = new Storie({ $$inline: true });

    	storie3 = new Storie({
    			props: {
    				username: "Me",
    				avatar: "https://avatars.githubusercontent.com/u/77276651?v=4",
    				time: "now"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Stories";
    			t1 = space();
    			span = element("span");
    			span.textContent = "See all";
    			t3 = space();
    			create_component(storie0.$$.fragment);
    			t4 = space();
    			create_component(storie1.$$.fragment);
    			t5 = space();
    			create_component(storie2.$$.fragment);
    			t6 = space();
    			create_component(storie3.$$.fragment);
    			t7 = space();
    			div2 = element("div");
    			i = element("i");
    			attr_dev(h2, "class", "svelte-1i9949b");
    			add_location(h2, file$1, 14, 6, 287);
    			attr_dev(span, "class", "svelte-1i9949b");
    			add_location(span, file$1, 15, 6, 311);
    			attr_dev(div0, "class", "Stories-head svelte-1i9949b");
    			add_location(div0, file$1, 13, 4, 253);
    			attr_dev(div1, "class", "Stories-container svelte-1i9949b");
    			toggle_class(div1, "show-stories", /*stories*/ ctx[0]);
    			add_location(div1, file$1, 11, 2, 184);
    			attr_dev(i, "class", "fas fa-history svelte-1i9949b");
    			toggle_class(i, "active", /*stories*/ ctx[0]);
    			add_location(i, file$1, 23, 4, 692);
    			attr_dev(div2, "class", "Stories-responsive svelte-1i9949b");
    			add_location(div2, file$1, 22, 2, 654);
    			attr_dev(div3, "class", "Stories svelte-1i9949b");
    			add_location(div3, file$1, 10, 0, 159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(div1, t3);
    			mount_component(storie0, div1, null);
    			append_dev(div1, t4);
    			mount_component(storie1, div1, null);
    			append_dev(div1, t5);
    			mount_component(storie2, div1, null);
    			append_dev(div1, t6);
    			mount_component(storie3, div1, null);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, i);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*handleStories*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*stories*/ 1) {
    				toggle_class(div1, "show-stories", /*stories*/ ctx[0]);
    			}

    			if (dirty & /*stories*/ 1) {
    				toggle_class(i, "active", /*stories*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(storie0.$$.fragment, local);
    			transition_in(storie1.$$.fragment, local);
    			transition_in(storie2.$$.fragment, local);
    			transition_in(storie3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(storie0.$$.fragment, local);
    			transition_out(storie1.$$.fragment, local);
    			transition_out(storie2.$$.fragment, local);
    			transition_out(storie3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(storie0);
    			destroy_component(storie1);
    			destroy_component(storie2);
    			destroy_component(storie3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Stories", slots, []);
    	let { stories = false } = $$props;

    	function handleStories() {
    		$$invalidate(0, stories = !stories);
    	}

    	const writable_props = ["stories"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stories> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("stories" in $$props) $$invalidate(0, stories = $$props.stories);
    	};

    	$$self.$capture_state = () => ({ Storie, stories, handleStories });

    	$$self.$inject_state = $$props => {
    		if ("stories" in $$props) $$invalidate(0, stories = $$props.stories);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stories, handleStories];
    }

    class Stories extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { stories: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stories",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get stories() {
    		throw new Error("<Stories>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stories(value) {
    		throw new Error("<Stories>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Sidebar.svelte generated by Svelte v3.38.2 */
    const file = "src\\components\\Sidebar.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let div;
    	let profile;
    	let t0;
    	let stories;
    	let t1;
    	let footer;
    	let current;

    	profile = new Profile({
    			props: {
    				nickname: /*nickname*/ ctx[0],
    				name: /*name*/ ctx[1]
    			},
    			$$inline: true
    		});

    	stories = new Stories({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			create_component(profile.$$.fragment);
    			t0 = space();
    			create_component(stories.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div, "class", "Sidebar-container svelte-oxd95w");
    			add_location(div, file, 10, 2, 225);
    			attr_dev(section, "class", "Sidebar svelte-oxd95w");
    			add_location(section, file, 9, 0, 196);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			mount_component(profile, div, null);
    			append_dev(div, t0);
    			mount_component(stories, div, null);
    			append_dev(div, t1);
    			mount_component(footer, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const profile_changes = {};
    			if (dirty & /*nickname*/ 1) profile_changes.nickname = /*nickname*/ ctx[0];
    			if (dirty & /*name*/ 2) profile_changes.name = /*name*/ ctx[1];
    			profile.$set(profile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(profile.$$.fragment, local);
    			transition_in(stories.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(profile.$$.fragment, local);
    			transition_out(stories.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(profile);
    			destroy_component(stories);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", slots, []);
    	let { nickname } = $$props;
    	let { name } = $$props;
    	const writable_props = ["nickname", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("nickname" in $$props) $$invalidate(0, nickname = $$props.nickname);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ Profile, Stories, Footer, nickname, name });

    	$$self.$inject_state = $$props => {
    		if ("nickname" in $$props) $$invalidate(0, nickname = $$props.nickname);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [nickname, name];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { nickname: 0, name: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*nickname*/ ctx[0] === undefined && !("nickname" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'nickname'");
    		}

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'name'");
    		}
    	}

    	get nickname() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nickname(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    // (22:0) <Main {darkMode}>
    function create_default_slot(ctx) {
    	let timeline;
    	let t;
    	let sidebar;
    	let current;

    	timeline = new TimeLine({
    			props: { posts: /*data*/ ctx[2].posts },
    			$$inline: true
    		});

    	const sidebar_spread_levels = [/*data*/ ctx[2].user];
    	let sidebar_props = {};

    	for (let i = 0; i < sidebar_spread_levels.length; i += 1) {
    		sidebar_props = assign(sidebar_props, sidebar_spread_levels[i]);
    	}

    	sidebar = new Sidebar({ props: sidebar_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(timeline.$$.fragment);
    			t = space();
    			create_component(sidebar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(timeline, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(sidebar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timeline_changes = {};
    			if (dirty & /*data*/ 4) timeline_changes.posts = /*data*/ ctx[2].posts;
    			timeline.$set(timeline_changes);

    			const sidebar_changes = (dirty & /*data*/ 4)
    			? get_spread_update(sidebar_spread_levels, [get_spread_object(/*data*/ ctx[2].user)])
    			: {};

    			sidebar.$set(sidebar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timeline.$$.fragment, local);
    			transition_in(sidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timeline.$$.fragment, local);
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(timeline, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(sidebar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(22:0) <Main {darkMode}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let t;
    	let main;
    	let current;

    	header = new Header({
    			props: { toggleTheme: /*toggleTheme*/ ctx[0] },
    			$$inline: true
    		});

    	main = new Main({
    			props: {
    				darkMode: /*darkMode*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t = space();
    			create_component(main.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(main, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*toggleTheme*/ 1) header_changes.toggleTheme = /*toggleTheme*/ ctx[0];
    			header.$set(header_changes);
    			const main_changes = {};
    			if (dirty & /*darkMode*/ 2) main_changes.darkMode = /*darkMode*/ ctx[1];

    			if (dirty & /*$$scope, data*/ 12) {
    				main_changes.$$scope = { dirty, ctx };
    			}

    			main.$set(main_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(main.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(main.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(main, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const API = "https://us-central1-pugstagram-co.cloudfunctions.net/data";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { toggleTheme } = $$props;
    	let { darkMode = toggleTheme } = $$props;
    	let data = {};

    	onMount(async () => {
    		const response = await fetch(API);
    		$$invalidate(2, data = await response.json());
    	});

    	const writable_props = ["toggleTheme", "darkMode"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("toggleTheme" in $$props) $$invalidate(0, toggleTheme = $$props.toggleTheme);
    		if ("darkMode" in $$props) $$invalidate(1, darkMode = $$props.darkMode);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Header,
    		Main,
    		TimeLine,
    		Sidebar,
    		toggleTheme,
    		darkMode,
    		data,
    		API
    	});

    	$$self.$inject_state = $$props => {
    		if ("toggleTheme" in $$props) $$invalidate(0, toggleTheme = $$props.toggleTheme);
    		if ("darkMode" in $$props) $$invalidate(1, darkMode = $$props.darkMode);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toggleTheme, darkMode, data];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { toggleTheme: 0, darkMode: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*toggleTheme*/ ctx[0] === undefined && !("toggleTheme" in props)) {
    			console.warn("<App> was created without expected prop 'toggleTheme'");
    		}
    	}

    	get toggleTheme() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleTheme(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get darkMode() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
