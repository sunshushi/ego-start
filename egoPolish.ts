// 上回书说道
// 怎么让使用 双括号进行绑定的数据，在渲染一次后，还可以渲染第二次-----修改了绑定的属性的名称，在发现大括号之后，加一层ego-model
// 新问题，没有办法控制，没使用标签包裹的绑定点(目前使用检测后强制绑定了一个ego-model，但我觉得这样不太科学)
// 新问题，如果在一个标签内既有{{}}数据绑定，又有
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

  constructor(data: Key, methods: Methods, context: Compiler) {
    this.data = data
    this.methods = methods
    let a: PropertyDescriptorMap
    // 用这个似乎无法解决set的时候也要遍历的问题，只能解决可以不使用setData的问题
    // get和set会将原生的dom操作覆盖掉
    Object.keys(data).forEach(key =>
      // self.defineReactive(data, key, data[key])
      this.defineppt(data, key, data[key], context)
    )

  }

  public setData(dataChange: Key) {
    for (const key in dataChange) {
      this.data[key] = dataChange[key]
    }
    console.log(this.data)
  }

  private defineppt(data: Key, key: keyof Key, value: any, context: Compiler) {
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
  private currentNode = this.rootElement
  public documentFragment: any = document.createDocumentFragment()

  constructor(data: Key, methods: Methods) {
    this.observer = new Observer(data, methods, this)
    // this.observer.data.get()
    for (const key in this.observer.data) {
      // this.observer.data[key].set()
    }
  }

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
    this.handleCatchIfData(element)
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
        element.innerHTML = this.observer.data[result]
        // if (this.observer.data[result]) {
        //   element.innerHTML = this.observer.data[result]
        // } else {
        //   element.innerHTML = ''
        // }
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

          // NOTE：这里这个遍历，是针对这个for节点的内部遍历，他所定义的节点和逻辑是不一样的，所以按道理
          // 这里的遍历操作的是for的这个内容，所以我们可以考虑把for的内容当做参数传入traversalElement
          // 让基础节点的遍历也可以使用这个参数，然后统一在遍历完之后进行
          // this.traversalElement(element)
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
          console.log(attributes[attr].value)
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