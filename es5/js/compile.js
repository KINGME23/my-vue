// 编译器，完成指令的解析、初始化、编译
// 参数分别是vm实例，实例中el属性的值所对应的DOM节点
function Compile(el, vm) {
  this.vm = vm;
  this.el = document.querySelector(el);
  this.fragment = null;
  this.init();
}

Compile.prototype = {
  // 初始化，把el DOM节点的子节点
  init: function () {
    if (this.el) {
      this.fragment = this.nodeToFragment(this.el);
      this.compileElement(this.fragment);
      this.el.appendChild(this.fragment);
    } else {
      console.log('Dom元素不存在');
    }
  },
  // 把el属性的值对应的DOM节点 转换成fragment
  nodeToFragment: function (el) {
    // DocumentFragment不属于当前文档，操作DocumentFragment节点，要比直接操作 DOM 树快得多。
    // 它一般用于构建一个 DOM 结构，然后插入当前文档
    var fragment = document.createDocumentFragment();
    var child = el.firstChild;
    while (child) {
      fragment.appendChild(child);
      child = el.firstChild;
    }
    return fragment;
  },
  // 编译el上的子节点，区分出文本节点和node节点，若有嵌套递归调用
  compileElement: function (el) {
    // 获取el上所有子节点
    var childNodes = el.childNodes;
    var self = this;
    // 把childNodes转为真正的数组，并遍历
    [].slice.call(childNodes).forEach(function (node) {
      // 正则匹配差值表达式
      var reg = /\{\{(.*)\}\}/;
      // 获得每个孩子节点的文本内容
      var text = node.textContent;
      // 如果孩子节点是node节点
      if (self.isElementNode(node)) {
        self.compile(node);
      } else if (self.isTextNode(node) && reg.test(text)) {
        self.compileText(node, reg.exec(text)[1]);
      }
      // 如果节点嵌套了节点，递归调用当前方法
      if (node.childNodes && node.childNodes.length) {
        self.compileElement(node);
      }
    })
  },
  // 按照node节点进行编译
  compile: function (node) {
    // 获得node节点上的属性
    var nodeAttrs = node.attributes;
    var self = this;
    // 绑定forEach()到nodeAttrs对象上，遍历每一个属性对象
    Array.prototype.forEach.call(nodeAttrs, function (attr) {
      // 获取属性的名字
      var attrName = attr.name;
      // 如果属性是v-模板指令
      if (self.isDirective(attrName)) {
        // 获得属性的值
        var exp = attr.value;
        // 获得v-后面的字符串，从而进一步判断是model还是on事件
        var dir = attrName.substring(2);
        // 如果属性是v-on属性
        if (self.isEventDirective(dir)) {
          // 节点绑定事件渲染函数
          self.compileEvent(node, self.vm, exp, dir);
        } else {
          // 节点绑定模板指令渲染函数
          self.compileModel(node, self.vm, exp, dir);
        }
        node.removeAttribute(attrName);
      }
    })
  },
  // 编译文本
  compileText: function (node, exp) {
    var self = this;
    var initText = this.vm[exp];
    // 将初始化的数据初始化到视图中
    this.updateText(node, initText);
    // 生成订阅者并绑定更新函数
    new Watcher(this.vm, exp, function (value) {
      self.updateText(node, value);
    });
  },
  // 根据不同的事件类型绑定不同的渲染函数
  compileEvent: function (node, vm, exp, dir) {
    // 获取事件类型，v-on:click="xxx方法"
    var eventType = dir.split(':')[1];
    var cb = vm.methods && vm.methods[exp];
    if (eventType && cb) {
      node.addEventListener(eventType, cb.bind(vm), false)
    }
  },
  // 编译模板指令，数据的双向绑定
  compileModel: function (node, vm, exp, dir) {
    var self = this;
    var val = this.vm[exp];
    this.modelUpdater(node, val);
    new Watcher(this.vm, exp, function (value) {
      self.modelUpdater(node, value);
    });

    node.addEventListener('input', function (e) {
      var newValue = e.target.value;
      if (val === newValue) {
        return;
      }
      self.vm[exp] = newValue;
      val = newValue;
    });
  },
  // 更新文本节点中 {{}}中的值
  updateText: function (node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value;
  },
  // 更新模板的值
  modelUpdater: function (node, value, oldValue) {
    node.value = typeof value == 'undefined' ? '' : value;
  },
  // 判断v-模板指令
  isDirective: function (att) {
    return att.indexOf('v-') === 0;
  },
  // 判断v-on:事件绑定
  isEventDirective: function (dir) {
    return dir.indexOf('on:') === 0;
  },
  // 判断node节点
  isElementNode: function (node) {
    return node.nodeType == 1;
  },
  // 判断text节点
  isTextNode: function (node) {
    return node.nodeType == 3;
  }
}