"use strict";
var toolCrib = /** @class */ (function () {
    function toolCrib() {
        this.watingTime = 0;
    }
    toolCrib.prototype.timeoutPolling = function (cb, maxWaitingTime, timeout, paremeterList) {
        var _this = this;
        if (maxWaitingTime === void 0) { maxWaitingTime = 5000; }
        if (timeout === void 0) { timeout = 500; }
        if (this.watingTime >= maxWaitingTime) {
            return;
        }
        setTimeout(function () {
            _this.watingTime += timeout;
            cb.apply(_this, paremeterList);
        }, timeout);
    };
    toolCrib.prototype.browserChecking = function () {
        var Sys = {
            name: '',
            version: ''
        };
        var ua = navigator.userAgent.toLowerCase();
        console.log(ua);
        // NOTE：这里的判断需要具体环境测试一下相关浏览器
        var re = /(msie|firefox|chrome|opera|Version|QQBrowser|Edge|OPR|UBrowser).*?([\d.]+)/;
        // ua = 'medfasdfasdf'
        var m = ua.match(re);
        if (!m) {
            return false;
        }
        Sys.name = m[1].replace(/version/, '\'safari');
        Sys.version = m[2];
        console.log(Sys);
        return true;
    };
    return toolCrib;
}());
