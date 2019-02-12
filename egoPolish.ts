// 上回书说道
// 怎么让使用 双括号进行绑定的数据，在渲染一次后，还可以渲染第二次-----修改了绑定的属性的名称，在发现大括号之后，加一层ego-model
// 新问题，没有办法控制，没使用标签包裹的绑定点(目前使用检测后强制绑定了一个ego-model，但我觉得这样不太科学)
// 新问题，如果在一个标签内既有{{}}数据绑定，又有ego-model该如何处理
// 新问题，事件绑定，在修改数据之后会重复遍历，这样会将数据绑定四次

// ---解决可能性： 给每一个节点添加一个遍历的flag，如果在一次数据的set过程中，遍历过一次了，那就不用在修改其他数据的时候再改变了

// 实现ego-for,整个编译存在疑问，egomodel设置错误

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


declare function getEventListeners(element: HTMLElement): any

class Observer {
  public keyObject: VirtualDom = {
    type: 'div',
    props: {},
    children: []
  }
  public dataList: string[] = []  // 测试专用数组
  public data: Key = {}
  public methods: Methods = {}

  constructor(data: Key, methods: Methods, context: Compiler) {
    this.data = data
    this.methods = methods
    let a: PropertyDescriptorMap
    // 用这个似乎无法解决set的时候也要遍历的问题，只能解决可以不使用setData的问题
    // get和set会将原生的dom操作覆盖掉
    Object.keys(data).forEach(key =>
      // self.defineReactive(data, key, data[key])
      this.defineProp(data, key, data[key], context)
    )

  }

  public setData(dataChange: Key) {
    for (const key in dataChange) {
      this.data[key] = dataChange[key]
    }
  }

  private defineProp(data: Key, key: keyof Key, value: any, context: Compiler) {
    // 注意，在defineProperty之中不能直接使用this.data[key]这样的方式，否则会循环调用set和get函数
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: true,
      get: () => {
        // 获取属性值
        return value
      },
      set: (newValue) => {
        // 无论是视图上的数据变化了，还是在逻辑中主动变动了，都会触发这个事件
        console.log(newValue)
        if (value != newValue) {
          value = newValue
          context.changeDom()
        }
      }
    })
  }
}

// class Watcher {

// }

class Compiler {
  public observer!: Observer
  public rootElement: HTMLElement = document.querySelector('#ego') as HTMLElement
  private regType: RegExp = /\{\{[a-z]*\}\}/
  // 这个当前的遍历节点留下相应的接口，但是目前没有使用，可以做调试用
  private currentElement = this.rootElement
  public documentFragment: any = document.createDocumentFragment()

  constructor(data: Key, methods: Methods) {
    this.observer = new Observer(data, methods, this)
    // this.observer.data.get()
    for (const key in this.observer.data) {
      // this.observer.data[key].set()
    }
  }

  // 检测该节点的属性函数
  private isHavingAttr(element: HTMLElement, attrName: string) {
    for (let i = 0; i < element.attributes.length; i++) {
      if (element.attributes[i].nodeName.indexOf(attrName) > -1) {
        return true
      } else {
        return false
      }
    }
  }
  // 检测该节点的监听器的函数
  private isHavingEventFunction(element: HTMLElement, eventName: string) {
    // for (let i = 0;)
    // getEventListeners是控制台方法，在这里无法调用
    /*  console.log(getEventListeners(element))
     let eventObj = getEventListeners(element)
     if (eventObj[eventName]) {
       return true
     } else {
       return false
     } */
  }

  //遍历节点
  public traversalElement(element: HTMLElement = this.documentFragment.children[0]) {
    let index = 0
    this.currentElement = element
    while (element.children.length > index + 1) {
      // for循环内使用自己的循环，而不用使用这个循环
      if (!this.isHavingAttr(element, 'ego-for')) {
        this.traversalElement(element.children[index] as HTMLElement)
        index++
      }
    }
    this.handleCatchDataEgoModel(element)
    this.handleCatchDataModel(element)
    this.handleCatchEvent(element)
    this.handleCatchIfData(element)
    this.handleCatchForData(element)
    return
  }

  // 考虑为for循环专门写一个遍历
  // for循环之中主要需要支持，数据绑定，if判断，以及事件绑定，不支持for循环嵌套
  public traversalForElement(element: any) {
    // TODO: for循环的专门遍历逻辑
    let index = 0
    while (element.childNodes.length > index + 1) {
      this.traversalForElement(element.childNodes[index] as HTMLElement)
      index++
    }
    this.handleCatchDataModel(element, true, 'dataList')
    // this.handleCatchDataEgoModel(element)
    // this.handleCatchEvent(element)
    // this.handleCatchIfData(element)
  }

  // 判断ego-for
  public handleCatchForData(element: HTMLElement) {
    const attributes = element.attributes
    if (attributes && attributes.length > 0) {
      for (const attr in attributes) {
        if (attr === 'length') {
          break
        }
        if ((attributes[attr].nodeName as string).indexOf('ego-for') > -1) {
          let dataListName = attributes[attr].value
          let dataList = this.observer.data[dataListName]
          if (!this.observer.data[dataListName]) {
            (this.observer.data[dataListName] as any) = []
          }
          let listLength = this.observer.data[dataListName].length
          // 遍历同一个dom，但是要让这个dom渲染listLength次数
          let modelElement: any = document.createDocumentFragment()
          modelElement.innerHTML = element.childNodes[0]
          for (let i = 0; i < dataList.length; i++) {
            console.log(element)
            this.traversalForElement(modelElement)
            let node=document.createElement("LI")
            let textnode=document.createTextNode("Water")
            node.appendChild(textnode)
            element.appendChild(node)
          }
          modelElement = null
          // this.traversalElement(element)
          // NOTE：这里这个遍历，直接遍历会死循环，是针对这个for节点的内部遍历，他所定义的节点和逻辑是不一样的，所以按道理
          // 这里的遍历操作的是for的这个内容，所以我们可以考虑把for的内容当做参数传入traversalElement
          // 让基础节点的遍历也可以使用这个参数，然后统一在遍历完之后进行
          // this.traversalElement(element)
        }
      }
    }
  }


  // 判断ego-model
  public handleCatchDataEgoModel(element: HTMLElement) {
    if (element.attributes && element.attributes.length > 0) {
      if (element.attributes.getNamedItem('ego-model')) {
        const nodeValue = element.attributes.getNamedItem('ego-model') as Attr
        if (this.observer.dataList.indexOf(nodeValue.textContent as string) === -1) {
          this.observer.dataList.push(nodeValue.textContent as string)
        }
        if (this.observer.data[nodeValue.textContent as string]) {
          element.innerHTML = this.observer.data[nodeValue.textContent as string]
        } else {
          element.innerHTML = ''
        }
      }
    }
  }
  // 判断{{}}
  public handleCatchDataModel(element: HTMLElement, isForDom?: boolean, forListName?: string) {
    // 改写为children而不是使用childNode，因为节点会错误的包括text节点
    if (element) {
      if (this.regType.test(element.innerHTML)) {
        const elementValue: RegExpExecArray = this.regType.exec(element.innerHTML as string) as RegExpExecArray
        const result = this.handleMatchingData(elementValue.input)
        if (isForDom) {
          const currentDataList: any = this.observer.data[forListName as string]
          console.log(currentDataList)
          element.innerHTML = currentDataList[0].data
          element.setAttribute('ego-model', currentDataList[0])
        } else {
          if (this.observer.dataList.indexOf(result) === -1) {
            this.observer.dataList.push(result)
            element.setAttribute('ego-model', result)
          }
          element.innerHTML = this.observer.data[result]
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
          // NOTE:这里不能使用add，否则会一直添加监听器
          element.addEventListener(eventType, () => {
            this.observer.methods[eventFunctionName]()
          })
          let onEventType: any = 'on' + eventType
          // element[onEventType as string] = () => {
          //   window.getEventListeners = ()=>void
          // }
          break
        }
      }
    }
  }

  public handleCatchIfData(element: HTMLElement) {
    const attributes = element.attributes
    if (attributes && attributes.length > 0) {
      for (const attr in attributes) {
        if (attr === 'length') {
          break
        }
        if ((attributes[attr].nodeName as string).indexOf('ego-if') > -1) {
          if (attributes[attr].value) {
            let value = attributes[attr].value
            // NOTE：先判断非且或，在判断比较符号，在判断运算符
            // 目前只尝试一个 ‘==’
            if (value.indexOf('==')) {
              let variety = this.observer.data[value.split('==')[0].trim()]
              let result = value.split('==')[1].trim()
              if (variety == result) {
                element.style.display = 'none'
              } else {
                element.style.display = ''
              }
            }
          } else {
            element.style.display = ''
          }
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
  }

  public changeDom() {
    // 或许可以考虑把这一部分写入set的环节中，这样可以减少获取的fragment的范围
    this.documentFragment.append(this.rootElement)
    this.traversalElement()
    document.body.appendChild(this.documentFragment)
    this.documentFragment = document.createDocumentFragment()
  }
}

class Page {
  private complier!: Compiler
  public data: Key = {}
  public methods: Methods = {}

  constructor(pageData: { data: Key, methods: Methods }) {
    this.data = pageData.data
    this.methods = pageData.methods
    this.complier = new Compiler(this.data, this.methods)
    this.complier.documentFragment.append(this.complier.rootElement)
    this.complier.traversalElement()
    document.body.appendChild(this.complier.documentFragment)
    this.complier.documentFragment = document.createDocumentFragment()
  }

  setData(data: Key) {
    this.complier.setData(data)
  }

}