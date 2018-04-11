var t = getApp(),
  $ = t.requirejs("core"),
  s = t.requirejs("jquery");
Page({
  data: {
    phone: '',
    password: ''
  },
  onLoad: function (options) {
    //wx.vibrateLong()
  },
  // 获取输入账号 
  phoneInput: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },
  // 获取输入密码 
  passwordInput: function (e) {
    this.setData({
      password: e.detail.value
    })
  },
  msg: function (title, icon = 'loading', time = 2000) {

    wx.showToast({
      title: title,
      icon: icon,
      duration: time
    })
  },
  // 登录 
  login: function () {
    var that = this;
    if (this.data.phone.length == 0 || this.data.password.length == 0) {
      wx.showToast({
        title: '用户名和密码不能为空',
        icon: 'loading',
        duration: 2000
      })
    } else {
      // 这里修改成跳转的页面 
      var datas = {}
      datas.phone = this.data.phone,
        datas.password = this.data.password;
      console.log(datas);
      $.post('store/_login', datas, function (i) {
        console.log(i);
        if (i.error == 0) {
          t.setCache("user", i.user, 7200);
          //t.setCache("store_id", i.store_id, 7200);
          t.setCache("mid", { mid: i.store_id }, 7200);
          that.msg(i.msg, 'success');
          setTimeout(function () {
            wx.redirectTo({
              url: '/pages/public/order/index?store_id=' + i.store_id
            });
          }, 2000);
        } else {
          $.alert(i.msg);
        }
      })
    }
  },

  onShareAppMessage: function () {
    return {
      title: 'E派速达',
      desc: '店铺管理',
      path: 'pages/public/coupon/index'
    }
  }
})