
interface Parameter {
  [key: string]: any
}

interface BrowserInfo {
  name: string,
  version: string,
}

class toolCrib {
  private watingTime: number

  constructor() {
    this.watingTime = 0
  }

  public timeoutPolling(cb: () => void, maxWaitingTime: number = 5000,
    timeout: number = 500, paremeterList?: Parameter) {
    if (this.watingTime >= maxWaitingTime) {
      return
    }
    setTimeout(() => {
      this.watingTime += timeout
      cb.apply(this, paremeterList)
    }, timeout)
  }

  public browserChecking() {
    let Sys: BrowserInfo = {
      name: '',
      version: ''
    }
    let ua = navigator.userAgent.toLowerCase()
    console.log(ua)
    // NOTE：这里的判断需要具体环境测试一下相关浏览器
    const re = /(msie|firefox|chrome|opera|Version|QQBrowser|Edge|OPR|UBrowser).*?([\d.]+)/
    // ua = 'medfasdfasdf'
    let m = ua.match(re)
    if (!m) {
      return false
    }
    Sys.name = m[1].replace(/version/, '\'safari')
    Sys.version = m[2]
    console.log(Sys)
    return true
  }
}