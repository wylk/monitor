// pages/public/pay/index.js

var t = getApp(),
  $ = t.requirejs("core"),
  s = t.requirejs("jquery");
Page({

  /**
   * 页面的初始数据
   */

  data: {
    status:0,
    price_value: '',
    openid: '',
    iconimg: 'http://yipaikeji.oss-cn-beijing.aliyuncs.com/static/images/choosed-sm.png',
    wximg: 'https://yipaikeji.oss-cn-beijing.aliyuncs.com/static/images/WeChat.png',
    price: 0,
    disabled: 1,
    userinfo:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var store_id = t.getCache("mid").mid;
    if (!store_id) {
      wx.navigateTo({
        url: "/pages/public/login/index"
      })
    }
    console.log(options);
    this.setData({
      price_value:options.price,
      price: options.price
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getUserInfo();
    this.epVoucher();
  },
  epVoucher:function(){
    var tt = this;
    var user = t.getCache("user");
    $.get('store/epVoucher',{mobile:user.phone},function(res){
      if(res.error == 0){
        tt.setData({
          userinfo:res.msg
        })
      }
    });
  },
  getUserInfo: function () {
    var tt = this;
    wx.login({
      success: function (res) {
        $.post('public/login', { code: res.code, store_id: 1 }, function (res) {
          console.log(res);
          tt.setData({
            openid: res.msg.openid
          })
        });
      },
      fail: function (i) {
        console.log(i);
      }
    })
  },
  priceInput: function (i) {
    console.log(i.detail.value);
    var reg = /^[1-9]\d*$/;
    var price = i.detail.value;
    if (!reg.test(price)) {
      this.setData({
        price_value: ''
      })
      wx.showToast({
        title: '请输入正整数的金额',
        icon: 'error',
        duration: 1000
      });
      return;
    }
    this.setData({
      price: price,
      status: 0,
    })
    //console.log(i.detail.value);
  },
  pay: function () {
    wx.showLoading({
      title: '操作中',
      mask: true
    });
    var user = t.getCache("user");
    var tt = this;
    var data = {}
    data.money = tt.data.price;
    //data.money = 0.01,
    data.openid = tt.data.openid;
    data.mobile = user.phone;
    $.post('store/expressPay', data, function (res) {
      console.log(res);
      wx.hideLoading();
      if (res.error == 0) {
        $.pay(res.payinfo, function (t) {
          console.log(t);
          if (t.errMsg == 'requestPayment:ok') {
            wx.navigateTo({
              url: "/pages/public/order/index"
            })
          } else {
            $.alert(e.error);
          }

        }, function (i) {
          console.log(i);
          if (i.errMsg == 'requestPayment:fail cancel') {
            $.alert('取消支付');
          }

        })
      } else {
        console.log(res.error);
      }
    });

    console.log(data);
  },
  choose: function (res) {
    var price = res.currentTarget.dataset.v;
    console.log(price);
    this.setData({
      status:price,
      price: price,
      price_value: '',
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})