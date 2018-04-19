// pages/public/shoose/index.js
var t = getApp(),
  $ = t.requirejs("core"),
  s = t.requirejs("jquery");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showModalOrderInfo: 1,
    orders: '',
    show: !1,
    showModalExpress: 1,
    express: '',
    is_express: 1,
    items: [
      { name: '1', value: '快送', checked: 'true' },
      { name: '0', value: '无需快送' }
    ],
    goodIds: [],
    isEcit: 0,
    lockReconnect: false,
    src: 'https://mall.epaikj.com/static/audio/dp.mp3',
    page: 1,
    loaded: !1,
    status: 2,
  },
  radioChange: function (i) {
    this.data.is_express = i.detail.value;
  },
  audioPlay: function () {
    wx.vibrateLong();
    this.audioCtx.play();
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var store_id = t.getCache("mid").mid;
    if (!store_id){
      wx.navigateTo({
        url: "/pages/public/login/index" 
      })
    }
    var tt = this;
    tt.redSock();
    wx.onSocketError(function (res) {
      tt.redSock();
      console.log('WebSocket连接打开失败，请检查！')
    });
    wx.onSocketClose(function (res) {
      console.log("WebSocket连接关闭!" + new Date().toUTCString());
      tt.reconnect();
    })
    wx.onSocketMessage(function (res) {
      var signal = JSON.parse(res.data.toString().trim());
      //tt.audioPlay();
      if (signal.type == 'mp3') {
        tt.setData({
          page: 1,
          loaded: !1,
          status: 2,
        })
        tt.audioPlay();
        tt.get_shop();
      }
      var store_id = t.getCache("mid").mid;
      if (res.data.indexOf(store_id) > -1) {
        wx.closeSocket();
      }
      console.log(res.data);
    });
  },
  redSock: function () {
    var store_id = t.getCache("mid").mid;
    var timestamp = new Date().getTime();
    var name = 'store' + store_id + ':' + timestamp;
    wx.connectSocket({
      url: 'wss://tui.51ao.com'
    });
    wx.onSocketOpen(function (res) {
      var str = "{name:'" + name + "',ping:'ping'}";
      console.log(str);
      wx.sendSocketMessage({ data: str });
      console.log("WebSocket连接已打开!" + new Date().toUTCString());
    });

  },
  reconnect: function () {
    var tt = this;
    if (tt.data.lockReconnect) return;
    tt.data.lockReconnect = true;
    setTimeout(function () {
      tt.redSock();
      tt.data.lockReconnect = false;
    }, 2000);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.audioCtx = wx.createAudioContext('myAudio');
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.get_shop();
  },
  get_shop: function (r) {
    var store_id = t.getCache("mid").mid;
    var tt = this,
      status = tt.data.status,
      page = tt.data.page;
    $.post('store/order', { store_id: store_id, p: page, status: status }, function (i) {
      if (i.error == 0) {
        if (page > 1) {
          var orders = tt.data.orders.concat(i.orders);
        } else {
          var orders = i.orders;
        }
        tt.setData({
          empty: !1,
          show: 1,
          orders: orders,
          page: page + 1,
        });
      } else {
        var empty = (page == 1) ? 1 : 0;
        var set_data = {
          show: 1,
          loaded: 1,
          empty: empty,
        };
        if (i.msg == 0) set_data.orders = [];//第一次就没有订单
        tt.setData(set_data);
      }
      //console.log(i);
    });
  },
  //发送快递
  express: function (e) {
    var tt = this;
    var order_id = e.target.dataset.order_id;
    $.post('store/package_product', { order_id: order_id }, function (i) {
      //console.log(i);
      if (i.err_code) {
        wx.showToast({
          title: i.err_msg,
          icon: 'loading',
          duration: 2000
        })
      } else {
        if ((i.products).length == 0) {
          $.alert('没有要发的商品,请处理好退款的商品'); return;
        }
        console.log(i.products);
        tt.setData({
          express: i,
          showModalExpress: !1,
        })

      }

    });
  },
  //订单详情
  order_info: function (e) {
    var tt = this;
    var order_id = e.target.dataset.order_id;
    $.post('store/package_product', { order_id: order_id }, function (i) {
      console.log(i);
      tt.setData({
        express: i,
        showModalOrderInfo: !1,
      })
    });
  },
  expressBtn: function () {
    
    var products = [];
    var order_products = [];
    var sku_data = [];
    var tt = this,
      express = tt.data.express,
      data = {};
    data.is_express = tt.data.is_express;
    data.order_id = express.order_id;
    data.express_id = 'ep';
    data.express_company = 'E派速达';
    data.courier = 0;
    var goodIds = tt.data.goodIds;
    var isEcit = tt.data.isEcit;
    if (!isEcit) {
      for (var index in express.products) {
        goodIds[index] = express.products[index].order_product_id;
      }
    } else {
      if (goodIds.length == 0) {
        $.alert('没有选择要发的商品'); return;
      }
    }
    for (var index in express.products) {
      if (goodIds.toString().indexOf(express.products[index].order_product_id) > -1) {
        order_products[index] = express.products[index].product_id;
        sku_data[index] = express.products[index].sku_data;
      }
    }
    data.order_products = goodIds.toString();
    data.products = order_products.toString();
    data.sku_data = sku_data;
    console.log(data);
    wx.showLoading({
      title: '操作中',
      mask: true
    });
    $.post('store/create_package', data, function (i) {
      wx.hideLoading();
      tt.listenerCancel();
      tt.setData({
        isEcit: !1,
      });
      if (i.err_code == 0) {
        wx.showToast({
          title: i.err_msg,
          icon: 'success',
          duration: 2000
        })
        tt.data.page = 1;
        setTimeout(function () {
          tt.get_shop();
        }, 2000);
      } else {
        if (i.err_code == 1002) {
          wx.showToast({
            title: '快递费余额不足请充值',
            icon: 'loading',
            duration: 1500
          });
          setTimeout(function () {
            wx.navigateTo({
              url: "/pages/public/pay/index?price=" + express.price
            })
          },1500);

        } else {
          $.alert(i.err_msg);
        }

      }
    });
  },
  //切换商品属性
  btnStatus: function (i) {
    var tt = this;
    tt.setData({
      loaded: !1,
      page: 1,
      status: i.currentTarget.dataset.status
    });
    tt.get_shop();
    console.log(i.currentTarget.dataset.status);
  },
  //发货商品选择
  checkboxChange: function (e) {
    this.setData({
      goodIds: e.detail.value,
      isEcit: 1,
    });
  },
  //关闭弹框
  listenerCancel: function () {
    this.setData({
      showModalExpress: 1,
      showModalOrderInfo: 1,
    });
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
    console.log(1);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log(2);
    this.data.loaded || this.get_shop(1);
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
})