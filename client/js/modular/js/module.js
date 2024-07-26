function createElementFromHTML(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    return div;
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function generateRandomClassPrefix() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function generateClassName() {

    return generateRandomClassPrefix() + '-' + uuidv4();

}

const CSSClasses = {};

let vars = {

    color: 'white',
    name: 'test',
    child: 'inside'

}

const dependencies = {};

const cache = {};

const parseMatches = (string, regex, flags) => {

    if (cache[string] && cache[string][regex]) {

        return cache[string][regex];

    } else {

        let currentIndex = 0;
        let values = [];
        let matched = {};

        const matches = string.matchAll(new RegExp(regex, flags));

        for (const match of matches) {

            let word = string.substring(currentIndex, match.index);
            currentIndex = match.index + match[0].length;

            values.push(word);
            matched[match[1]] = values.length;
            values.push(vars[match[1]]);

        }

        let word = string.substring(currentIndex, string.length);

        values.push(word);

        const cachedValue = { vars: matched, expression: values };

        if (cache[string]) {

            cache[string][regex] = cachedValue;

        } else {

            cache[string] = {};
            cache[string][regex] = cachedValue;

        }

        return cachedValue;

    }

}

const renderInnerHTML = (element) => {

    for (const child of element.childNodes) {

        if (child.nodeType === 3) {

            const matches = parseMatches(child.textContent, '{{(.*?)}}', 'gmi');

            for (const value in matches.vars) {

                if (dependencies[value]) {

                    dependencies[value].push({
                        real: child,
                        attributeName: 'textContent',
                        matches
                    });

                } else {

                    dependencies[value] = [{
                        real: child,
                        attributeName: 'textContent',
                        matches
                    }];

                }

                child.textContent = matches.expression.join('');

            }

        } else {

            render(child);

        }

    }

}

const renderAttr = (element, name) => {

    const attribute = element.getAttribute(name);

    const matches = parseMatches(attribute, '{{(.*?)}}', 'gmi');

    for (const value in matches.vars) {

        if (dependencies[value]) {

            dependencies[value].push({
                real: element,
                attributeName: name,
                matches
            });

        } else {

            dependencies[value] = [{
                real: element,
                attributeName: name,
                matches
            }];

        }

        element.setAttribute(name, matches.expression.join(''));

    }

}

const render = (element) => {

    renderInnerHTML(element);

    for (const attribute of element.attributes) {

        renderAttr(element, attribute.name);

    }

}

const createLocalScript = async (string) => {

    return await createScript(`(()=>{let Parent = document.currentScript.parentElement${string}})()`);

}

const createScript = async (string) => {

    let script = document.createElement('script');

    const blob = new Blob([string], { type: 'application/javascript' });

    script.integrity = await checksum(string);
    script.src = URL.createObjectURL(blob);

    return script;

}

const createCSS = async (string) => {

    let style = document.createElement('link');

    const blob = new Blob([string], { type: 'text/plain' });

    style.setAttribute('rel', 'stylesheet');
    style.integrity = await checksum(string);
    style.href = URL.createObjectURL(blob);

    return style;

}

const base64ArrayBuffer = (arrayBuffer) => {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}

const checksum = async (str) => {

    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-512', data);
    return 'sha512-' + base64ArrayBuffer(hash);

}

const checksumTrim = async (str) => {

    return await checksum(str.replace(/\s+/g, ' '));

}

const parse = async (path) => {
    return new Promise((resolve, reject) => {

        fetch(path)
            .then(response => response.text())
            .then(data => {

                let element = createElementFromHTML(data);

                element.querySelectorAll('script').forEach(async (script) => {

                    script.after(await createLocalScript(script.innerHTML));
                    script.remove();

                })

                element.querySelectorAll('style').forEach(async (style) => {

                    let classID = generateClassName();

                    let sum = await checksumTrim(style.innerHTML);

                    if (!CSSClasses[sum]) {

                        CSSClasses[sum] = classID;

                        document.body.append(await createCSS(`

                        .${classID} ${style.innerHTML}
    
                        `));

                    }

                    style.parentNode.classList.add(CSSClasses[sum]);

                    style.remove();

                })

                for (const child of element.children) {

                    if (child.tagName.toUpperCase().startsWith('mod'.toUpperCase())) {

                        import(`./elements/${child.tagName.split('-')[1].toLowerCase()}.js`);

                    }

                }

                for (const child of element.children) {

                    render(child);

                }

                resolve(element);

            });

    })
}

const parseDependencies = (prop, value) => {

    if (dependencies[prop]) {

        dependencies[prop].forEach(child => {

            if (child.attributeName === 'textContent') {

                child.matches.expression[child.matches.vars[prop]] = value;

                child.real.textContent = child.matches.expression.join('');

            } else {

                child.matches.expression[child.matches.vars[prop]] = value;

                child.real.setAttribute(
                    child.attributeName,
                    child.matches.expression.join(''));

            }

        })

    }

}

const proxy = new Proxy(vars, {

    get: (target, prop, receiver) => {

        return Reflect.get(target, prop, receiver);

    },

    set: (target, prop, receiver) => {

        parseDependencies(prop, receiver);

        return Reflect.set(target, prop, receiver);

    }

})

export const Element = {

    parse,

    get state() {

        return proxy;

    },

    set state(value) {

        for (const key in value) {

            vars[key] = value[key];

            parseDependencies(key, value[key]);

        }

        return proxy;

    }

}

const Modular = {

    prefix: 'mod',
    elements: {}

}

export class CustomElement {

    constructor(tagName, cb) {

        if (!Modular.elements[tagName]) {

            Modular.elements[tagName] = class extends HTMLElement {

                constructor() {

                    super();

                    cb(this).then(element => {
                        this.append(element);
                    })

                }

            }

            customElements.define(Modular.prefix + '-' + tagName, Modular.elements[tagName]);

        } else {

            console.error(`Element ${Modular.prefix + '-' + tagName} already registered.`,
                {
                    prefix: Modular.prefix,
                    tagName
                });

        }

    }

}

const deepProxy = (object, options) => {

    let result = {};

    for (let key of Object.keys(object)) {

        const value = object[key];

        if (value instanceof Object) {

            result[key] = new Proxy(deepProxy(value), {

                get: options.get,
                set: options.set

            });

        } else {

            result[key] = value;

        }

    }

    return new Proxy(result, {

        get: options.get,
        set: options.set

    });

}

const deepProxyCheck = (target, property, value) => {

    if (value instanceof Object) {

        target[property] = deepProxy(value, {

            get: (target, property) => {

                return target[property];

            },
            set: (target, property, value, receiver) => {

                console.log('changed');

                deepProxyCheck(target, property, value);

                return true;

            }

        });

    } else {

        target[property] = value;

    }
}

const closest = (element, index) => {

    let before = element.children.item(index - 1);

    if (before) {

        return before;

    } else {

        return closest(element, index - 1);

    }

}

export const Repeater = (array, template, parent) => {

    let proxyToArray = new Proxy(array, {

        get: (target, property) => {

            return target[property];
        },
        set: (target, property, value, receiver) => {

            if (!isNaN(property)) {

                console.log(property, value);

                if (!div.children.item(property)) {

                    let e = template.cloneNode(true);

                    e.innerHTML = property;

                    closest(div, property).after(e);
                }

            }

            // console.log('changed array set\n', target, property, value);

            deepProxyCheck(target, property, value);

            return true;
        }

    });

    let div = document.createElement('div');

    array.forEach((value, i) => {

        let e = template.cloneNode(true);

        e.innerHTML = i;

        div.append(e);

    })

    parent.append(div);

    return proxyToArray;

}

// Module.observer.observe(document.body, { childList: true, subtree: true });

// export const observer = new MutationObserver((mutationsList, observer) => {

//     for (const mutation of mutationsList) {

//         if (mutation.type === 'childList') {

//             mutation.addedNodes.forEach((node) => {

//                 if (node.tagName) {

//                     // console.log(node.tagName);

//                 }

//                 // if (node.tagName && Modular.elements[node.tagName]) {

//                 //     Modular.elements[node.tagName].render([node]);

//                 // } else {

//                 //     if (node.tagName) {

//                 //         for (let key in Modular.elements) {

//                 //             Modular.elements[key].render(node.querySelectorAll(key));

//                 //         }

//                 //     }

//                 // }

//             })

//         }

//     }

// })