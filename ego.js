


class Observer {
  constructor() {
    this.keyObject = {} //形式{model(页面变量名称): data(页面变量值)}
  }
  // -----待优化
  setData(keyObject) {
    // 这样做每修改一次数据就要修改一次全部dom
    // this.drawingData = this.htmlData
    // // 这里尝试修改成defineProperty，修改数据后，页面数据自动变化，而不需要setData
    // for (let key in keyObject) {
    //   this.keyObject[key] = keyObject[key]
    //   this.drawingData = this.drawingData.replace('{{' + key + '}}', this.keyObject[key])
    // }
    // document.querySelector('#ego').innerHTML = this.drawingData
    this.changeDom(this.dataList[0].element, this.dataList[0].result)
  }
  ////////
  handleMatchingData(data) {
    const regSign = /(\{\{)|(\}\})/g
    data = data.replace(regSign, '')
    return data
  }
}
class Watcher {
  // 串联compiler与observer，目前不实现，
  // 选择直接在compiler中直接初始化observer对象的方式
}
class Compilers {
  constructor() {
    this.observer = new Observer()
    this.element = document.querySelector('#ego')
    this.regType = /\{\{[a-z]*\}\}/
    this.currentNode = this.element
    this.traversalElement(this.element, this.regType.test(this.currentNode.childNodes[0].nodeValue), () => {
      console.log('666')
    })
  }

  /**
   * 对dom进行遍历，搜索出相应的绑定点
   * @param 搜索开始的根节点 element
   */
  traversalElement(element, type) {
    let index = 0
    this.currentNode = element
    while (element.childNodes.length > index + 1) {
      this.traversalElement(element.childNodes[index], type)
      index++
    }
    if (type === 'init') {
      this.handleCatchDataModel()
      this.handleCatchDataEgoModel()
    }
    return
  }
  handleCatchDataModel() {
    if (element.childNodes.length === 1) { // 这个判断条件很可能会有问题
      if (this.regType.test(element.childNodes[0].nodeValue)) {
        element.addEventListener
        const nodeValue = this.regType.exec(element.childNodes[0].nodeValue)
        const result = this.handleMatchingData(nodeValue[0])

      }
    }
  }
  handleCatchDataEgoModel() {
    // 搜索使用了model进行绑定数据
    if (element.attributes && element.attributes.length > 0) {
      if (element.attributes.getNamedItem('@ego-model')) {
        const nodeValue = element.attributes['@ego-model']
        this.dataList.push({
          variable: nodeValue.textContent,
          element: element.nodeName
        })
      }
    }
  }

  /**
   * 初始化页面寻找相应的绑定节点，并将内容进行初始化
   * 目前没有执行初始化某些值，现在都是初始化为空的
   */
  initDom() {
    this.drawingData = this.htmlData
    // 这里是要进行遍历的，先把内容存储到fragment之中，再进行遍历
    for (let data of this.dataList) {
      this.keyObject[data.variable] = {
        value: '',
        element: data.element
      }
    }
    console.log(this.keyObject)
    document.querySelector('#ego').innerHTML = this.drawingData
  }

  changeDom(element, data) {
    // 尝试将修改dom封装成函数，并使用fragment
    const fragment = document.querySelector('#ego')
    console.log(fragment)
    let node = document.createElement(element)
    node.innerHTML = data
    fragment.appendChild(node)
    console.log(fragment)
    console.log(fragment.innerHTML)

  }
  // 待插入实际操作中的函数
  test() {
    // 搜索使用{{}}绑定数据
    if (element.childNodes.length === 1) { // 这个判断条件很可能会有问题
      if (this.regType.test(element.childNodes[0].nodeValue)) {
        element.addEventListener
        const nodeValue = this.regType.exec(element.childNodes[0].nodeValue)
        const result = this.handleMatchingData(nodeValue[0])
        this.dataList.push({
          variable: result,
          element: element.nodeName
        })
      }
    }
    // 搜索使用了model进行绑定数据
    else if (element.attributes && element.attributes.length > 0) {
      if (element.attributes.getNamedItem('@ego-model')) {
        const nodeValue = element.attributes['@ego-model']
        this.dataList.push({
          variable: nodeValue.textContent,
          element: element.nodeName
        })
      }
    }
    // else if .....
  }

}
class Page {
  constructor() {
    this.compilers = new Compilers()
    this.observer = new Observer()
    const { compilers, observer } = this
  }
}
// new Compilers()