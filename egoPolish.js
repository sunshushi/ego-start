"use strict";
// 上回书说道
// 怎么让使用 双括号进行绑定的数据，在渲染一次后，还可以渲染第二次-----修改了绑定的属性的名称，在发现大括号之后，加一层ego-model
// 新问题，没有办法控制，没使用标签包裹的绑定点(目前使用检测后强制绑定了一个ego-model，但我觉得这样不太科学)
// 新问题，如果在一个标签内既有{{}}数据绑定，又有
// 实现ego-if
var Observer = /** @class */ (function () {
    function Observer(data, methods, context) {
        var _this = this;
        this.keyObject = {
            type: 'div',
            props: {},
            children: []
        };
        this.dataList = []; // 测试专用数组
        this.data = {};
        this.methods = {};
        this.data = data;
        this.methods = methods;
        var a;
        // 用这个似乎无法解决set的时候也要遍历的问题，只能解决可以不使用setData的问题
        // get和set会将原生的dom操作覆盖掉
        Object.keys(data).forEach(function (key) {
            // self.defineReactive(data, key, data[key])
            return _this.defineppt(data, key, data[key], context);
        });
    }
    Observer.prototype.setData = function (dataChange) {
        for (var key in dataChange) {
            this.data[key] = dataChange[key];
        }
        console.log(this.data);
    };
    Observer.prototype.defineppt = function (data, key, value, context) {
        // 注意，在defineProperty之中不能直接使用this.data[key]这样的方式，否则会循环调用set和get函数
        Object.defineProperty(data, key, {
            enumerable: false,
            configurable: true,
            get: function () {
                // 获取属性值
                return value;
            },
            set: function (newValue) {
                // 无论是视图上的数据变化了，还是在逻辑中主动变动了，都会触发这个事件
                if (value != newValue) {
                    value = newValue;
                    context.changeDom();
                }
            }
        });
    };
    return Observer;
}());
// class Watcher {
// }
var Compiler = /** @class */ (function () {
    function Compiler(data, methods) {
        this.rootElement = document.querySelector('#ego');
        this.regType = /\{\{[a-z]*\}\}/;
        this.currentNode = this.rootElement;
        this.documentFragment = document.createDocumentFragment();
        this.observer = new Observer(data, methods, this);
        // this.observer.data.get()
        for (var key in this.observer.data) {
            // this.observer.data[key].set()
        }
    }
    //遍历节点
    Compiler.prototype.traversalElement = function (element) {
        if (element === void 0) { element = this.documentFragment.childNodes[0]; }
        var index = 0;
        this.currentNode = element;
        while (element.childNodes.length > index + 1) {
            this.traversalElement(element.childNodes[index]);
            index++;
        }
        // 在这里对于每一个绑定点就实现了defineProperty，这样当发生变化时就可以直接触发回调
        // 这样只需要在初始化页面的时候调用函数遍历一次就可以了
        this.handleCatchDataEgoModel(element);
        this.handleCatchDataModel(element);
        this.handleCatchEvent(element);
        this.handleCatchIfData(element);
        return;
    };
    // 判断ego-model
    Compiler.prototype.handleCatchDataEgoModel = function (element) {
        if (element.attributes && element.attributes.length > 0) {
            if (element.attributes.getNamedItem('ego-model')) {
                var nodeValue = element.attributes.getNamedItem('ego-model');
                if (this.observer.dataList.indexOf(nodeValue.textContent) === -1) {
                    this.observer.dataList.push(nodeValue.textContent);
                }
                // 换成在fragment中操作
                // NOTE: 这部分内容在切换了数据之后就失去了效用，还需要改良
                if (this.observer.data[nodeValue.textContent]) {
                    element.innerHTML = this.observer.data[nodeValue.textContent];
                }
                else {
                    element.innerHTML = '';
                }
            }
        }
    };
    // 判断{{}}
    Compiler.prototype.handleCatchDataModel = function (element) {
        if (element.childNodes.length === 1) {
            if (this.regType.test(element.childNodes[0].nodeValue)) {
                element.addEventListener;
                var nodeValue = this.regType.exec(element.childNodes[0].nodeValue);
                var result = this.handleMatchingData(nodeValue.input);
                element.setAttribute('ego-model', result);
                if (this.observer.dataList.indexOf(result) === -1) {
                    this.observer.dataList.push(result);
                }
                element.innerHTML = this.observer.data[result];
                // if (this.observer.data[result]) {
                //   element.innerHTML = this.observer.data[result]
                // } else {
                //   element.innerHTML = ''
                // }
            }
        }
    };
    // 判断ego-bind
    Compiler.prototype.handleCatchEvent = function (element) {
        var _this = this;
        var attributes = element.attributes;
        if (attributes && attributes.length > 0) {
            var _loop_1 = function (attr) {
                if (attr === 'length') {
                    return "break";
                }
                if (attributes[attr].nodeName.indexOf('ego-bind') > -1) {
                    var eventType = attributes[attr].nodeName.split(':')[1];
                    var eventFunctionName_1 = attributes[attr].textContent;
                    element.addEventListener(eventType, function () {
                        _this.observer.methods[eventFunctionName_1]();
                    });
                    return "break";
                }
            };
            for (var attr in attributes) {
                var state_1 = _loop_1(attr);
                if (state_1 === "break")
                    break;
            }
        }
    };
    // 判断ego-for
    Compiler.prototype.handleCatchForData = function (element) {
        var attributes = element.attributes;
        if (attributes && attributes.length > 0) {
            for (var attr in attributes) {
                if (attr === 'length') {
                    break;
                }
                if (attributes[attr].nodeName.indexOf('ego-for') > -1) {
                    var dataListName = attributes[attr].value;
                    // NOTE：这里这个遍历，是针对这个for节点的内部遍历，他所定义的节点和逻辑是不一样的，所以按道理
                    // 这里的遍历操作的是for的这个内容，所以我们可以考虑把for的内容当做参数传入traversalElement
                    // 让基础节点的遍历也可以使用这个参数，然后统一在遍历完之后进行
                    // this.traversalElement(element)
                }
            }
        }
    };
    Compiler.prototype.handleCatchIfData = function (element) {
        var attributes = element.attributes;
        if (attributes && attributes.length > 0) {
            for (var attr in attributes) {
                if (attr === 'length') {
                    break;
                }
                if (attributes[attr].nodeName.indexOf('ego-if') > -1) {
                    console.log(attributes[attr].value);
                    if (attributes[attr].value) {
                        var value = attributes[attr].value;
                        // NOTE：先判断非且或，在判断比较符号，在判断运算符
                        // 目前只尝试一个 ‘==’
                        if (value.indexOf('==')) {
                            var variety = this.observer.data[value.split('==')[0].trim()];
                            var result = value.split('==')[1].trim();
                            if (variety == result) {
                                element.style.display = 'none';
                            }
                            else {
                                element.style.display = '';
                            }
                        }
                    }
                    else {
                        element.style.display = '';
                    }
                }
            }
        }
    };
    Compiler.prototype.handleMatchingData = function (data) {
        var regSign = /(\{\{)|(\}\})/g;
        data = data.replace(regSign, '');
        return data;
    };
    Compiler.prototype.setData = function (dataChange) {
        this.observer.setData(dataChange);
    };
    Compiler.prototype.changeDom = function () {
        // 或许可以考虑把这一部分写入set的环节中，这样可以减少获取的fragment的范围
        this.documentFragment.append(this.rootElement);
        this.traversalElement();
        document.body.appendChild(this.documentFragment);
        this.documentFragment = document.createDocumentFragment();
    };
    return Compiler;
}());
var Page = /** @class */ (function () {
    function Page(pageData) {
        this.data = {};
        this.methods = {};
        this.data = pageData.data;
        this.methods = pageData.methods;
        this.complier = new Compiler(this.data, this.methods);
        this.complier.documentFragment.append(this.complier.rootElement);
        this.complier.traversalElement();
        document.body.appendChild(this.complier.documentFragment);
        this.complier.documentFragment = document.createDocumentFragment();
    }
    Page.prototype.setData = function (data) {
        this.complier.setData(data);
    };
    return Page;
}());
