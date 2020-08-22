// 订阅者，参数分别位vm实例，模板指令上绑定的属性，渲染函数
function Watcher(vm, modelExp, renderFunc) {
  this.vm = vm;
  this.modelExp = modelExp;
  this.renderFunc = renderFunc;
  // 调用内部get方法，把当前监听者对象保存到监听器里
  this.value = this.get();
}

Watcher.prototype = {
  // 最终对外的接口，执行更新
  update: function() {
    // 调用内部的run方法
    this.run();
  },
  // 
  run: function() {
    // 获取指定data对象属性的新值
    var newValue = this.vm.data[this.modelExp];
    // 获取旧值
    var oldVal = this.value;
    // 新旧值不等，赋予新值，vm实例调用渲染函数
    if(newValue !== oldVal){
      this.value = newValue;
      this.renderFunc.call(this.vm, newValue, oldVal);
    }
  },
  get: function() {
    // 缓存自身
    Dep.target = this;
    // 访问属性，触发get拦截器，添加订阅者
    // 得到指定data对象属性上的旧值
    var value = this.vm.data[this.modelExp];
    // 添加成功后，去除
    Dep.target = null;
    return value;
  }
};