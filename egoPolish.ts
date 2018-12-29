// 上回书说道
// 怎么让使用 双括号进行绑定的数据，在渲染一次后，还可以渲染第二次-----修改了绑定的属性的名称，在发现大括号之后，加一层ego-model
// 新问题，没有办法控制，没使用标签包裹的绑定点
// 实现ego-if

interface Key {
  [key: string]: string
}

interface Methods {
  [key: string]: Function
}

interface DomProps {
  name: string,
  value: string
}

interface VirtualDom {
  type: string,
  props: Key,
  children: VirtualDom[]
}

class Observer {
  public keyObject: VirtualDom = {
    type: 'div',
    props: {},
    children: []
  }
  public dataList: string[] = []  // 测试专用数组
  public data: Key = {}
  public methods: Methods = {}
  public setData(dataChange: Key) {
    for (const key in dataChange) {
      this.data[key] = dataChange[key]
    }
  }
}

// class Watcher {

// }

class Compiler {
  public observer: Observer = new Observer()
  public rootElement: HTMLElement = document.querySelector('#ego') as HTMLElement
  private regType: RegExp = /\{\{[a-z]*\}\}/
  private currentNode = this.rootElement
  public documentFragment: any = document.createDocumentFragment()

  //遍历节点
  public traversalElement(element: HTMLElement = this.documentFragment.childNodes[0]) {
    let index = 0
    this.currentNode = element
    while (element.childNodes.length > index + 1) {
      this.traversalElement(element.childNodes[index] as HTMLElement)
      index++
    }
    // 在这里对于每一个绑定点就实现了defineProperty，这样当发生变化时就可以直接触发回调
    // 这样只需要在初始化页面的时候调用函数遍历一次就可以了
    this.handleCatchDataEgoModel(element)
    this.handleCatchDataModel(element)
    this.handleCatchEvent(element)
    return
  }
  // 判断ego-model
  public handleCatchDataEgoModel(element: HTMLElement) {
    if (element.attributes && element.attributes.length > 0) {
      if (element.attributes.getNamedItem('ego-model')) {
        const nodeValue = element.attributes.getNamedItem('ego-model') as Attr
        if (this.observer.dataList.indexOf(nodeValue.textContent as string) === -1) {
          this.observer.dataList.push(nodeValue.textContent as string)
        }
        // 换成在fragment中操作
        // NOTE: 这部分内容在切换了数据之后就失去了效用，还需要改良
        if (this.observer.data[nodeValue.textContent as string]) {
          element.innerHTML = this.observer.data[nodeValue.textContent as string]
        } else {
          element.innerHTML = ''
        }
      }
    }
  }
  // 判断{{}}
  public handleCatchDataModel(element: HTMLElement) {
    if (element.childNodes.length === 1) { // 这个判断条件很可能会有问题
      if (this.regType.test(element.childNodes[0].nodeValue as string)) {
        element.addEventListener
        const nodeValue: RegExpExecArray = this.regType.exec(element.childNodes[0].nodeValue as string) as RegExpExecArray
        const result = this.handleMatchingData(nodeValue.input)
        element.setAttribute('ego-model', result)
        if (this.observer.dataList.indexOf(result) === -1) {
          this.observer.dataList.push(result)
        }
        if (this.observer.data[result]) {
          element.innerHTML = this.observer.data[result]
        } else {
          element.innerHTML = ''
        }
      }
    }
  }
  // 判断ego-bind
  public handleCatchEvent(element: HTMLElement) {
    const attributes = element.attributes
    if (attributes && attributes.length > 0) {
      for (const attr in attributes) {
        if (attr === 'length') {
          break
        }
        if ((attributes[attr].nodeName as string).indexOf('ego-bind') > -1) {
          const eventType = attributes[attr].nodeName.split(':')[1]
          const eventFunctionName = attributes[attr].textContent as string
          element.addEventListener(eventType, () => {
            this.observer.methods[eventFunctionName]()
          })
          break
        }
      }
    }
  }

  private handleMatchingData(data: string) {
    const regSign = /(\{\{)|(\}\})/g
    data = data.replace(regSign, '')
    return data
  }

  public setData(dataChange: Key) {
    this.observer.setData(dataChange)
    console.log(this.rootElement)
    this.documentFragment.append(this.rootElement)
    this.traversalElement()
    document.body.appendChild(this.documentFragment)
    this.documentFragment = document.createDocumentFragment()
  }
}

class Page {
  private complier: Compiler = new Compiler()
  public data: Key = {}
  public methods: Methods = {}

  constructor(pageData: { data: Key, methods: Methods}) {
    this.data = pageData.data
    this.methods = pageData.methods

    console.log('page')
    this.complier.observer.data = this.data
    this.complier.observer.methods = this.methods
    this.complier.documentFragment.append(this.complier.rootElement)
    this.complier.traversalElement()
    document.body.appendChild(this.complier.documentFragment)
    this.complier.documentFragment = document.createDocumentFragment()
  }

  setData(data: Key) {
    this.complier.setData(data)
  }

}