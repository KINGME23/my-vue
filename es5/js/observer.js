// 监听器，监听数据对象的变化
function Observer(data) {
  this.data = data;
  this.observeKeys(data);
}

Observer.prototype = {
  observeKeys: function(data) {
    // 保存当前上下文
    var self = this;
    // 对于data对象 的每一个属性key进行拦截
    Object.keys(data).forEach(function(key) {
      self.defindReactive(data, key, data[key]);
    });
  },
  // 重写Object.definePrototype，拦截对象的属性
  defindReactive: function (data, key, value) {
    // 创建一个订阅器，数据变化了，把订阅者全局对象添加到订阅器数组中
    var dep = new Dep();
    // 对于对象属性是对象的，递归调Observer()
    var childObj = observe(value);
    // 对于data对象上的属性进行创建/修改，通过第三个参数属性描述符对象来定义
    Object.defineProperty(data, key, {
      // 为 true 时，该属性描述符才能够被改变，同时该属性也能从对应的对象上被删除
      configurable: true,
      // 为 true 时，该属性才能够出现在对象的枚举属性中
      enumerable: true,
      // get 拦截对 对象属性的访问
      get: function getter() {
        // 如果全局订阅者存在，就添加到订阅器数组里；并返回当前属性的值
        // 保证订阅者初始化时才添加到订阅器
        if(Dep.target){
          dep.addSub(Dep.target);
        }
        return value;
      },
      set: function setter(newValue) {
        // 如果新旧值相等，则什么都不做
        if(newValue === value){
          return;
        }
        // 新旧值不等，赋予新值，并通知订阅者发生了变化
        value = newValue;
        dep.notify();
      }
    });
    
  }
}

function  observe(propValue) {
  // 如果对象的属性不是对象，那么就不用递归了
  if(!propValue || typeof propValue !== 'object') return;
  // 对象的属性还是对象，则对于属性也要嵌套监听
  return new Observer(propValue);
}

// 订阅器，统一管理订阅者
function Dep() {
  // 用数组手机订阅者
  this.subs = [];
}

Dep.prototype = {
  // 添加订阅者的方法
  addSub: function (sub) {
    this.subs.push(sub);
  },
  // 通知数组中每一个订阅者更新
  notify: function () {
    this.subs.forEach(function (sub) {
      sub.update();
    })
  }
};

// 设置一个订阅者全局对象，同一时间只有一个订阅者
Dep.target = null;