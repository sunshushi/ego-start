"use strict";
// 上回书说道
// 怎么让使用 双括号进行绑定的数据，在渲染一次后，还可以渲染第二次-----修改了绑定的属性的名称，在发现大括号之后，加一层ego-model
// 新问题，没有办法控制，没使用标签包裹的绑定点(目前使用检测后强制绑定了一个ego-model，但我觉得这样不太科学)
// 新问题，如果在一个标签内既有{{}}数据绑定，又有ego-model该如何处理
// 新问题，事件绑定，在修改数据之后会重复遍历，这样会将数据绑定四次
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
            return _this.defineProp(data, key, data[key], context);
        });
    }
    Observer.prototype.setData = function (dataChange) {
        for (var key in dataChange) {
            this.data[key] = dataChange[key];
        }
    };
    Observer.prototype.defineProp = function (data, key, value, context) {
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
                console.log(newValue);
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
        // 这个当前的遍历节点留下相应的接口，但是目前没有使用，可以做调试用
        this.currentElement = this.rootElement;
        this.documentFragment = document.createDocumentFragment();
        this.observer = new Observer(data, methods, this);
        // this.observer.data.get()
        for (var key in this.observer.data) {
            // this.observer.data[key].set()
        }
    }
    // 检测该节点的属性函数
    Compiler.prototype.isHavingAttr = function (element, attrName) {
        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes[i].nodeName.indexOf(attrName) > -1) {
                return true;
            }
            else {
                return false;
            }
        }
    };
    // 检测该节点的监听器的函数
    Compiler.prototype.isHavingEventFunction = function (element, eventName) {
        // for (let i = 0;)
        // getEventListeners是控制台方法，在这里无法调用
        /*  console.log(getEventListeners(element))
         let eventObj = getEventListeners(element)
         if (eventObj[eventName]) {
           return true
         } else {
           return false
         } */
    };
    //遍历节点
    Compiler.prototype.traversalElement = function (element) {
        if (element === void 0) { element = this.documentFragment.children[0]; }
        var index = 0;
        this.currentElement = element;
        while (element.children.length > index + 1) {
            // for循环内使用自己的循环，而不用使用这个循环
            if (!this.isHavingAttr(element, 'ego-for')) {
                this.traversalElement(element.children[index]);
                index++;
            }
        }
        this.handleCatchDataEgoModel(element);
        this.handleCatchDataModel(element);
        this.handleCatchEvent(element);
        this.handleCatchIfData(element);
        this.handleCatchForData(element);
        return;
    };
    // 考虑为for循环专门写一个遍历
    // for循环之中主要需要支持，数据绑定，if判断，以及事件绑定，不支持for循环嵌套
    Compiler.prototype.traversalForElement = function (element) {
        // TODO: for循环的专门遍历逻辑
        var index = 0;
        while (element.childNodes.length > index + 1) {
            this.traversalForElement(element.childNodes[index]);
            index++;
        }
        this.handleCatchDataModel(element, true, 'dataList');
        // this.handleCatchDataEgoModel(element)
        // this.handleCatchEvent(element)
        // this.handleCatchIfData(element)
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
                    var dataList = this.observer.data[dataListName];
                    if (!this.observer.data[dataListName]) {
                        this.observer.data[dataListName] = [];
                    }
                    var listLength = this.observer.data[dataListName].length;
                    // 遍历同一个dom，但是要让这个dom渲染listLength次数
                    var modelElement = document.createDocumentFragment();
                    modelElement.innerHTML = element.childNodes[0];
                    for (var i = 0; i < dataList.length; i++) {
                        console.log(element);
                        this.traversalForElement(modelElement);
                        var node = document.createElement("LI");
                        var textnode = document.createTextNode("Water");
                        node.appendChild(textnode);
                        element.appendChild(node);
                    }
                    modelElement = null;
                    // this.traversalElement(element)
                    // NOTE：这里这个遍历，直接遍历会死循环，是针对这个for节点的内部遍历，他所定义的节点和逻辑是不一样的，所以按道理
                    // 这里的遍历操作的是for的这个内容，所以我们可以考虑把for的内容当做参数传入traversalElement
                    // 让基础节点的遍历也可以使用这个参数，然后统一在遍历完之后进行
                    // this.traversalElement(element)
                }
            }
        }
    };
    // 判断ego-model
    Compiler.prototype.handleCatchDataEgoModel = function (element) {
        if (element.attributes && element.attributes.length > 0) {
            if (element.attributes.getNamedItem('ego-model')) {
                var nodeValue = element.attributes.getNamedItem('ego-model');
                if (this.observer.dataList.indexOf(nodeValue.textContent) === -1) {
                    this.observer.dataList.push(nodeValue.textContent);
                }
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
    Compiler.prototype.handleCatchDataModel = function (element, isForDom, forListName) {
        // 改写为children而不是使用childNode，因为节点会错误的包括text节点
        if (element) {
            if (this.regType.test(element.innerHTML)) {
                var elementValue = this.regType.exec(element.innerHTML);
                var result = this.handleMatchingData(elementValue.input);
                if (isForDom) {
                    var currentDataList = this.observer.data[forListName];
                    console.log(currentDataList);
                    element.innerHTML = currentDataList[0].data;
                    element.setAttribute('ego-model', currentDataList[0]);
                }
                else {
                    if (this.observer.dataList.indexOf(result) === -1) {
                        this.observer.dataList.push(result);
                        element.setAttribute('ego-model', result);
                    }
                    element.innerHTML = this.observer.data[result];
                }
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
                    // NOTE:这里不能使用add，否则会一直添加监听器
                    element.addEventListener(eventType, function () {
                        _this.observer.methods[eventFunctionName_1]();
                    });
                    var onEventType = 'on' + eventType;
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
    Compiler.prototype.handleCatchIfData = function (element) {
        var attributes = element.attributes;
        if (attributes && attributes.length > 0) {
            for (var attr in attributes) {
                if (attr === 'length') {
                    break;
                }
                if (attributes[attr].nodeName.indexOf('ego-if') > -1) {
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
