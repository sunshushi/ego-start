"use strict";
// 上回书说道
// 怎么让使用 双括号进行绑定的数据，在渲染一次后，还可以渲染第二次-----修改了绑定的属性的名称，在发现大括号之后，加一层ego-model
// 新问题，没有办法控制，没使用标签包裹的绑定点
// 实现函数绑定,可参考掘金的实现
var Observer = /** @class */ (function () {
    function Observer() {
        this.keyObject = {
            type: 'div',
            props: {},
            children: []
        };
        this.dataList = []; // 测试专用数组
        this.data = {};
        this.methods = {};
    }
    Observer.prototype.setData = function (dataChange) {
        for (var key in dataChange) {
            this.data[key] = dataChange[key];
        }
    };
    return Observer;
}());
// class Watcher {
// }
var Compiler = /** @class */ (function () {
    function Compiler() {
        this.observer = new Observer();
        this.rootElement = document.querySelector('#ego');
        this.regType = /\{\{[a-z]*\}\}/;
        this.currentNode = this.rootElement;
        this.documentFragment = document.createDocumentFragment();
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
                if (this.observer.data[result]) {
                    element.innerHTML = this.observer.data[result];
                }
                else {
                    element.innerHTML = '';
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
    Compiler.prototype.handleMatchingData = function (data) {
        var regSign = /(\{\{)|(\}\})/g;
        data = data.replace(regSign, '');
        return data;
    };
    Compiler.prototype.setData = function (dataChange) {
        this.observer.setData(dataChange);
        console.log(this.rootElement);
        this.documentFragment.append(this.rootElement);
        this.traversalElement();
        document.body.appendChild(this.documentFragment);
        this.documentFragment = document.createDocumentFragment();
    };
    return Compiler;
}());
var Page = /** @class */ (function () {
    function Page(pageData) {
        this.complier = new Compiler();
        this.data = {};
        this.methods = {};
        this.data = pageData.data;
        this.methods = pageData.methods;
        console.log('page');
        this.complier.observer.data = this.data;
        this.complier.observer.methods = this.methods;
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
